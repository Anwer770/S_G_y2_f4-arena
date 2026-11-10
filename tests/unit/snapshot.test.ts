/**
 * اختبارات وحدة لنقاط الاستعادة (R51): المخزن والتشفير.
 *
 * `snapshotStore.ts` و`snapshotCrypto.ts` كانا خارج مقام التغطية. والتشفير هنا ليس زينة:
 * R17 أصلح عيباً كان يجعل **أي** رمز PIN يفتح النسخة والبيانات تُخزَّن نصاً صريحاً.
 * لذلك يُقاس هنا: رمز خاطئ لا يفكّ، وبيانات معدَّلة لا تفكّ، والمغلّف لا يحمل بنية صريحة.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  SNAPSHOTS_STORAGE_KEY,
  loadSnapshots,
  saveSnapshots,
  type CloudSnapshot,
} from '../../src/services/backup/snapshotStore';
import {
  SNAPSHOT_CIPHER,
  SNAPSHOT_KDF,
  SNAPSHOT_KDF_ITERATIONS,
  SNAPSHOT_PAYLOAD_VERSION,
  decryptSnapshot,
  encryptSnapshot,
  isEncryptedSnapshotPayload,
} from '../../src/utils/snapshotCrypto';
import { dbStorage } from '../../src/database/dbStorage';

const snapshot = (over: Partial<CloudSnapshot> = {}): CloudSnapshot => ({
  id: 'snap-1',
  name: 'نقطة أولى',
  timestamp: '2026-11-07T10:00:00.000Z',
  totalRecords: 12,
  sizeKb: 34.5,
  isEncrypted: false,
  data: null,
  payload: null,
  ...over,
});

describe('مخزن نقاط الاستعادة', () => {
  beforeEach(() => dbStorage.removeItem(SNAPSHOTS_STORAGE_KEY));

  it('الغياب والتلف وغير المصفوفي ⇒ قائمة فارغة بلا رمي', () => {
    expect(loadSnapshots()).toEqual([]);

    dbStorage.setItem(SNAPSHOTS_STORAGE_KEY, '{تالف');
    expect(loadSnapshots()).toEqual([]);

    dbStorage.setItem(SNAPSHOTS_STORAGE_KEY, '{"a":1}');
    expect(loadSnapshots()).toEqual([]);
  });

  it('الكتابة تستبدل القائمة كاملة على مفتاح واحد', () => {
    saveSnapshots([snapshot(), snapshot({ id: 'snap-2', name: 'ثانية' })]);
    expect(loadSnapshots()).toHaveLength(2);
    expect(JSON.parse(dbStorage.getItem(SNAPSHOTS_STORAGE_KEY) as string)).toHaveLength(2);

    saveSnapshots([snapshot({ id: 'snap-3' })]);
    expect(loadSnapshots()).toEqual([snapshot({ id: 'snap-3' })]);
  });

  it('الفراغ [] يبقى فراغاً ولا يُستبدل ببذرة', () => {
    saveSnapshots([snapshot()]);
    saveSnapshots([]);
    expect(loadSnapshots()).toEqual([]);
  });
});

describe('تشفير نقطة الاستعادة — AES-GCM بمفتاح من PIN', () => {
  it('الذهاب والعودة بالرمز الصحيح', async () => {
    const data = { customers: [{ id: 'C-1', name: 'عميل' }], total: 1 };
    const payload = await encryptSnapshot(data, '4826');

    expect(payload.v).toBe(SNAPSHOT_PAYLOAD_VERSION);
    expect(payload.kdf).toBe(SNAPSHOT_KDF);
    expect(payload.cipher).toBe(SNAPSHOT_CIPHER);
    expect(payload.iterations).toBe(SNAPSHOT_KDF_ITERATIONS);
    expect(await decryptSnapshot<typeof data>(payload, '4826')).toEqual(data);
  });

  it('المغلّف لا يحمل أي بنية صريحة من البيانات', async () => {
    const payload = await encryptSnapshot({ customers: [{ id: 'C-SECRET' }] }, '4826');
    const serialized = JSON.stringify(payload);

    expect(serialized).not.toContain('C-SECRET');
    expect(serialized).not.toContain('customers');
    expect(isEncryptedSnapshotPayload(payload)).toBe(true);
    expect(isEncryptedSnapshotPayload({ ...payload, items: [] })).toBe(false);
  });

  it('رمز خاطئ لا يفكّ ويُعطي رسالة مفهومة', async () => {
    const payload = await encryptSnapshot({ a: 1 }, '4826');
    await expect(decryptSnapshot(payload, '9999')).rejects.toThrow('رمز PIN غير صحيح أو نقطة الاستعادة تالفة');
  });

  it('بيانات معدَّلة أو مغلّف بإصدار مجهول يُرفضان بلا كشف', async () => {
    const payload = await encryptSnapshot({ a: 1 }, '4826');

    await expect(decryptSnapshot({ ...payload, data: payload.data.slice(0, -4) + 'AAAA' }, '4826')).rejects.toThrow(
      'تالفة'
    );
    await expect(decryptSnapshot({ ...payload, v: 99 }, '4826')).rejects.toThrow('غير معروف الإصدار');
    await expect(decryptSnapshot({ ...payload, cipher: 'AES-CBC' } as never, '4826')).rejects.toThrow(
      'غير معروف الإصدار'
    );
  });

  it('PIN ليس أربعة أرقام يُرفض قبل أي تشفير', async () => {
    await expect(encryptSnapshot({ a: 1 }, '12')).rejects.toThrow('4 أرقام');
    await expect(encryptSnapshot({ a: 1 }, 'abcd')).rejects.toThrow('4 أرقام');
    await expect(encryptSnapshot({ a: 1 }, '٤٨٢٦')).rejects.toThrow('4 أرقام');
  });

  it('كل تشفير يستخدم ملحاً وIV جديدين (لا إعادة استخدام)', async () => {
    const first = await encryptSnapshot({ a: 1 }, '4826');
    const second = await encryptSnapshot({ a: 1 }, '4826');

    expect(first.salt).not.toBe(second.salt);
    expect(first.iv).not.toBe(second.iv);
    expect(first.data).not.toBe(second.data);
  });

  it('حارس النوع يرفض كل ما ليس مغلّفاً مشفَّراً', () => {
    expect(isEncryptedSnapshotPayload(null)).toBe(false);
    expect(isEncryptedSnapshotPayload('نص')).toBe(false);
    expect(isEncryptedSnapshotPayload({ cipher: SNAPSHOT_CIPHER })).toBe(false);
    expect(isEncryptedSnapshotPayload({ cipher: SNAPSHOT_CIPHER, salt: 'a', iv: 'b', data: 3 })).toBe(false);
  });
});

/* ─────────── حرّاس البيئة: الفشل برسالة عربية لا بـReferenceError ─────────── */
describe('التشفير في بيئة ناقصة — رسائل لا انهيار', () => {
  it('غياب Web Crypto يُرفض برسالة مفهومة قبل أي عمل', async () => {
    const original = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
    Object.defineProperty(globalThis, 'crypto', {
      value: { getRandomValues: (b: Uint8Array) => b },
      configurable: true,
    });
    try {
      await expect(encryptSnapshot({ a: 1 }, '4826')).rejects.toThrow('Web Crypto غير متاح');
    } finally {
      if (original) Object.defineProperty(globalThis, 'crypto', original);
    }
  });

  it('غياب TextEncoder يُرفض برسالة مفهومة', async () => {
    vi.stubGlobal('TextEncoder', undefined);
    try {
      await expect(encryptSnapshot({ a: 1 }, '4826')).rejects.toThrow('TextEncoder غير متاح');
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('غياب TextDecoder عند فك التشفير يُرفض برسالة مفهومة', async () => {
    const payload = await encryptSnapshot({ a: 1 }, '4826');
    vi.stubGlobal('TextDecoder', undefined);
    try {
      await expect(decryptSnapshot(payload, '4826')).rejects.toThrow('تالفة');
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
