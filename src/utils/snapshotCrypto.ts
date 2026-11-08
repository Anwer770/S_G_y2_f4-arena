/**
 * تشفير نقاط الاستعادة محلياً (AES-GCM 256) بمفتاح مشتق من رمز PIN.
 *
 * خلفية الإصلاح (R17): كان `DatabasesTab` يضع `isEncrypted: true` لمجرد كتابة رمز PIN،
 * ويطلب الرمز عند الاستعادة دون التحقق منه أصلاً — أي أن **كل** رمز كان يفتح النسخة،
 * والبيانات تُخزَّن نصاً صريحاً داخل `localStorage`. هذا الملف يجعل التشفير حقيقياً:
 *   - مفتاح = PBKDF2-SHA256(PIN, salt عشوائي 16 بايت, 150,000 دورة)
 *   - تشفير = AES-GCM 256 بـ IV عشوائي 12 بايت لكل عملية
 *   - أي رمز خاطئ يُفشل فك التشفير (AES-GCM يتحقق من الوسم) ولا يُعيد بيانات.
 *
 * لا يُستخدم أي خادم: كل شيء داخل المتصفح عبر Web Crypto.
 */

export const SNAPSHOT_KDF = 'PBKDF2-SHA256';
export const SNAPSHOT_KDF_ITERATIONS = 150_000;
export const SNAPSHOT_CIPHER = 'AES-GCM-256';
export const SNAPSHOT_PAYLOAD_VERSION = 1;

export interface EncryptedSnapshotPayload {
  v: number;
  kdf: typeof SNAPSHOT_KDF;
  iterations: number;
  cipher: typeof SNAPSHOT_CIPHER;
  salt: string;
  iv: string;
  data: string;
}

/**
 * تُنشأ الكائنات عند الحاجة فقط: بعض بيئات الاختبار (jsdom) لا تُعرّف `TextEncoder`
 * على النافذة، فلا يجوز أن يفشل مجرّد استيراد الوحدة (وحدة تُستورد من شجرة الإعدادات).
 */
const encodeText = (value: string): Uint8Array => {
  const Enc = (globalThis as unknown as { TextEncoder?: typeof TextEncoder }).TextEncoder;
  if (!Enc) throw new Error('TextEncoder غير متاح في هذه البيئة');
  return new Enc().encode(value);
};

const decodeText = (bytes: ArrayBuffer): string => {
  const Dec = (globalThis as unknown as { TextDecoder?: typeof TextDecoder }).TextDecoder;
  if (!Dec) throw new Error('TextDecoder غير متاح في هذه البيئة');
  return new Dec().decode(bytes);
};

const toBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
};

const fromBase64 = (value: string): Uint8Array => {
  const binary = atob(value);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
  return out;
};

const randomBytes = (length: number): Uint8Array => {
  const buf = new Uint8Array(length);
  crypto.getRandomValues(buf);
  return buf;
};

const subtle = (): SubtleCrypto => {
  const engine = globalThis.crypto?.subtle;
  if (!engine) {
    throw new Error('Web Crypto غير متاح في هذه البيئة — لا يمكن تشفير نقطة الاستعادة');
  }
  return engine;
};

async function deriveKey(pin: string, salt: Uint8Array): Promise<CryptoKey> {
  const base = await subtle().importKey('raw', encodeText(pin) as unknown as BufferSource, 'PBKDF2', false, [
    'deriveKey',
  ]);
  return subtle().deriveKey(
    { name: 'PBKDF2', salt: salt as unknown as BufferSource, iterations: SNAPSHOT_KDF_ITERATIONS, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/** يشفّر أي بيانات قابلة للتسلسل JSON ويعيد مغلّفاً آمناً للتخزين. */
export async function encryptSnapshot<T>(data: T, pin: string): Promise<EncryptedSnapshotPayload> {
  if (!/^\d{4}$/.test(pin)) throw new Error('رمز PIN يجب أن يكون 4 أرقام');
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = await deriveKey(pin, salt);
  const plaintext = encodeText(JSON.stringify(data));
  const cipher = await subtle().encrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    key,
    plaintext as unknown as BufferSource
  );
  return {
    v: SNAPSHOT_PAYLOAD_VERSION,
    kdf: SNAPSHOT_KDF,
    iterations: SNAPSHOT_KDF_ITERATIONS,
    cipher: SNAPSHOT_CIPHER,
    salt: toBase64(salt),
    iv: toBase64(iv),
    data: toBase64(new Uint8Array(cipher)),
  };
}

/** يفك التشفير ويعيد البيانات الأصلية — يرفض الرمز الخاطئ والتلف. */
export async function decryptSnapshot<T>(payload: EncryptedSnapshotPayload, pin: string): Promise<T> {
  if (!payload || payload.v !== SNAPSHOT_PAYLOAD_VERSION || payload.cipher !== SNAPSHOT_CIPHER) {
    throw new Error('مغلّف نقطة استعادة غير معروف الإصدار');
  }
  try {
    const key = await deriveKey(pin, fromBase64(payload.salt));
    const plain = await subtle().decrypt(
      { name: 'AES-GCM', iv: fromBase64(payload.iv) as unknown as BufferSource },
      key,
      fromBase64(payload.data) as unknown as BufferSource
    );
    return JSON.parse(decodeText(plain)) as T;
  } catch {
    throw new Error('رمز PIN غير صحيح أو نقطة الاستعادة تالفة');
  }
}

/** حارس نوع: هل هذه القيمة مغلّف مشفَّر حقيقي (لا بيانات صريحة)؟ */
export function isEncryptedSnapshotPayload(value: unknown): value is EncryptedSnapshotPayload {
  if (!value || typeof value !== 'object') return false;
  const p = value as Record<string, unknown>;
  return (
    p.cipher === SNAPSHOT_CIPHER &&
    typeof p.salt === 'string' &&
    typeof p.iv === 'string' &&
    typeof p.data === 'string' &&
    !('items' in p) // لا تسريب بنية البيانات الصريحة داخل المغلّف
  );
}
