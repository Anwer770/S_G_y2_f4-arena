import { describe, expect, it } from 'vitest';
import {
  PIN_KDF_ITERATIONS,
  PIN_MIN_ITERATIONS,
  hasPinDigest,
  hashPin,
  isAcceptablePin,
  isWebCryptoAvailable,
  verifyPin,
} from '../../src/utils/pinCrypto';

describe('isAcceptablePin — سياسة الرمز', () => {
  it('يرفض الرموز الشائعة صريحاً', () => {
    for (const pin of ['1234', '0000', '1111', '9999', '123456', '654321', '112233']) {
      expect(isAcceptablePin(pin), pin).toBe(false);
    }
  });

  it('يرفض الطول غير المسموح وغير الأرقام', () => {
    for (const pin of ['', '123', '1234567', '12a4', 'abcd', '12 34']) {
      expect(isAcceptablePin(pin), pin).toBe(false);
    }
  });

  it('يقبل 4 إلى 6 أرقام غير شائعة (مع تجاهل الفراغات الطرفية)', () => {
    for (const pin of ['4826', '9137', '482615', ' 4826 ']) {
      expect(isAcceptablePin(pin), pin).toBe(true);
    }
  });
});

describe('hashPin / verifyPin — تجزئة PBKDF2', () => {
  it('Web Crypto متاح في بيئة الاختبار (شرط الميزة)', () => {
    expect(isWebCryptoAvailable()).toBe(true);
  });

  it('يُنتج ملخّصاً بثلاثة حقول وعدد الدورات الافتراضي', async () => {
    const digest = await hashPin('482615');
    expect(Object.keys(digest).sort()).toEqual(['pinHash', 'pinIterations', 'pinSalt']);
    expect(digest.pinIterations).toBe(PIN_KDF_ITERATIONS);
    expect(digest.pinHash.length).toBeGreaterThan(20);
    expect(digest.pinSalt.length).toBeGreaterThan(10);
  });

  it('لا يحتوي الملخّص على الرمز نصاً (لا تسريب)', async () => {
    const digest = await hashPin('482615');
    const serialized = JSON.stringify(digest);
    expect(serialized.includes('482615')).toBe(false);
    expect(serialized.includes('pin"')).toBe(false);
  });

  it('ملح مختلف لكل استدعاء ⇒ ملخّص مختلف لنفس الرمز', async () => {
    const [a, b] = await Promise.all([hashPin('482615'), hashPin('482615')]);
    expect(a.pinSalt).not.toBe(b.pinSalt);
    expect(a.pinHash).not.toBe(b.pinHash);
  });

  it('يتحقق من الرمز الصحيح ويرفض الخاطئ', async () => {
    const digest = await hashPin('482615');
    await expect(verifyPin('482615', digest)).resolves.toBe(true);
    await expect(verifyPin('482616', digest)).resolves.toBe(false);
    await expect(verifyPin('', digest)).resolves.toBe(false);
    await expect(verifyPin('   ', digest)).resolves.toBe(false);
  });

  it('يتجاهل الفراغات الطرفية في الرمز الصحيح', async () => {
    const digest = await hashPin('482615');
    await expect(verifyPin('  482615  ', digest)).resolves.toBe(true);
  });

  it('يرفض ملخّصاً بعدد دورات أقل من الحد (منع تخفيض الحماية)', async () => {
    const weak = await hashPin('482615', PIN_MIN_ITERATIONS - 1);
    await expect(verifyPin('482615', weak)).resolves.toBe(false);
  });

  it('يرفض ملخّصاً معدّلاً يدوياً أو ناقص الحقول', async () => {
    const digest = await hashPin('482615');
    await expect(verifyPin('482615', { ...digest, pinHash: 'AAAA' })).resolves.toBe(false);
    await expect(verifyPin('482615', { ...digest, pinSalt: '' })).resolves.toBe(false);
    await expect(verifyPin('482615', { pinHash: '', pinSalt: '', pinIterations: 0 })).resolves.toBe(false);
  });

  it('يرفض رمزاً فارغاً عند التجزئة', async () => {
    await expect(hashPin('   ')).rejects.toThrow();
  });
});

describe('hasPinDigest', () => {
  it('يميّز الحساب المجزّأ عن الحساب بلا رمز', async () => {
    const digest = await hashPin('482615');
    expect(hasPinDigest(digest)).toBe(true);
    expect(hasPinDigest({})).toBe(false);
    expect(hasPinDigest(null)).toBe(false);
    expect(hasPinDigest(undefined)).toBe(false);
    expect(hasPinDigest({ pinHash: 'x', pinSalt: 'y', pinIterations: 0 })).toBe(false);
  });
});
