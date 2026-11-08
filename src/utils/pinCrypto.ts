/**
 * تجزئة رمز المرور (PIN) — تقوية المصادقة (R2/P2).
 *
 * القاعدة: **لا يُخزَّن الرمز نصاً صريحاً إطلاقاً**. يُشتق منه ملخّص PBKDF2-SHA256
 * مع ملح (salt) عشوائي لكل مستخدم، ويُقارَن الملخّص فقط عند الدخول.
 *
 * ملاحظات تصميم:
 *  - `crypto.subtle` متاح فقط في «سياق آمن» (HTTPS أو localhost). إن غاب، نرفض
 *    العمل بدل تخزين الرمز صريحاً أو تعطيل الحماية بصمت (`isWebCryptoAvailable`).
 *  - الملخّص يحفظ عدد الدورات معه، فيمكن رفع العدد مستقبلاً بلا كسر الرموز القديمة.
 *  - المقارنة زمنية ثابتة (لا تُقصّر عند أول بايت مختلف).
 */

export interface PinDigest {
  pinHash: string;
  pinSalt: string;
  pinIterations: number;
}

/** عدد دورات الاشتقاق الافتراضي (قابل للرفع؛ يُحفظ مع كل ملخّص) */
export const PIN_KDF_ITERATIONS = 150_000;

/** أدنى عدد دورات مقبول عند التحقق من ملخّص قديم */
export const PIN_MIN_ITERATIONS = 20_000;

/** رموز شائعة مرفوضة عند التعيين */
const COMMON_PINS = [
  '1234',
  '0000',
  '1111',
  '2222',
  '3333',
  '4444',
  '5555',
  '6666',
  '7777',
  '8888',
  '9999',
  '123456',
  '654321',
  '121212',
  '112233',
  '123123',
  '000000',
  '111111',
  '121314',
];

/** رمز المرور المقبول: 4–6 أرقام، وليس رمزاً شائعاً */
export const isAcceptablePin = (pin: string): boolean => {
  const clean = pin.trim();
  if (!/^[0-9]{4,6}$/.test(clean)) return false;
  return !COMMON_PINS.includes(clean);
};

/** هل Web Crypto متاح في هذا السياق؟ (HTTPS أو localhost) */
export const isWebCryptoAvailable = (): boolean => {
  try {
    return !!(globalThis.crypto && globalThis.crypto.subtle && globalThis.crypto.getRandomValues);
  } catch {
    return false;
  }
};

const subtle = (): SubtleCrypto => {
  if (!isWebCryptoAvailable()) {
    throw new Error('Web Crypto غير متاح — افتح التطبيق عبر HTTPS أو localhost لتأمين رمز المرور');
  }
  return globalThis.crypto.subtle;
};

const toBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
};

const fromBase64 = (value: string): Uint8Array => {
  const binary = atob(value);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
};

const derive = async (pin: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> => {
  const encoder = new TextEncoder();
  const base = await subtle().importKey('raw', encoder.encode(pin) as unknown as BufferSource, 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bits = await subtle().deriveBits(
    { name: 'PBKDF2', salt: salt as unknown as BufferSource, iterations, hash: 'SHA-256' },
    base,
    256
  );
  return new Uint8Array(bits);
};

/** يشتق ملخّصاً آمناً للرمز (ملح عشوائي 16 بايت + PBKDF2-SHA256) */
export async function hashPin(pin: string, iterations: number = PIN_KDF_ITERATIONS): Promise<PinDigest> {
  const clean = pin.trim();
  if (!clean) throw new Error('رمز المرور فارغ');
  const salt = new Uint8Array(16);
  globalThis.crypto.getRandomValues(salt);
  const hash = await derive(clean, salt, iterations);
  return { pinHash: toBase64(hash), pinSalt: toBase64(salt), pinIterations: iterations };
}

/** مقارنة زمنية ثابتة بين مصفوفتين من البايتات */
const timingSafeEqual = (a: Uint8Array, b: Uint8Array): boolean => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
};

/** يتحقق من الرمز مقابل ملخّص مخزَّن — دون أي معرفة بالرمز الأصلي */
export async function verifyPin(pin: string, digest: PinDigest): Promise<boolean> {
  const clean = pin.trim();
  if (!clean || !digest || !digest.pinHash || !digest.pinSalt) return false;
  const iterations = Number(digest.pinIterations) || 0;
  if (iterations < PIN_MIN_ITERATIONS) return false;
  const salt = fromBase64(digest.pinSalt);
  const expected = fromBase64(digest.pinHash);
  const actual = await derive(clean, salt, iterations);
  return timingSafeEqual(actual, expected);
}

/** هل يملك المستخدم ملخّصاً صالح الشكل؟ (لا يكشف الرمز) */
export const hasPinDigest = (
  user: { pinHash?: string; pinSalt?: string; pinIterations?: number } | null | undefined
): boolean => !!user && !!user.pinHash && !!user.pinSalt && Number(user.pinIterations) > 0;
