/**
 * سياسة حماية الدخول (تقوية المصادقة — P2).
 *
 * ثلاث قواعد مفروضة هنا، منفصلة عن الواجهة وعن React لتكون قابلة للاختبار وحدها:
 *  1. **إقفال مؤقت بعد محاولات فاشلة**: 5 محاولات ⇒ إقفال 5 دقائق (يُحفظ ويعيش بعد إعادة التحميل).
 *  2. **جلسة بانتهاء صريح**: 8 ساعات كحد أقصى، ولا تُحفظ إطلاقاً إن لم يطلب المستخدم «تذكّر الدخول».
 *  3. **لا استعادة صامتة لجلسة بلا انتهاء**: أي جلسة قديمة الشكل (بلا `expiresAt`) تُعدّ منتهية.
 */
import {
  loadAuthGuardState,
  saveAuthGuardState,
  loadAuthSession,
  saveAuthSession,
  clearAuthSession,
  AuthGuardState,
  StoredAuthSession,
} from './storage/system';

/** عدد المحاولات الفاشلة المسموح بها قبل الإقفال */
export const MAX_FAILED_ATTEMPTS = 5;

/** مدة الإقفال بعد تجاوز المحاولات (5 دقائق) */
export const LOCK_DURATION_MS = 5 * 60 * 1000;

/** أقصى عمر للجلسة (8 ساعات) */
export const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

/** المتبقي من مدة الإقفال بالمللي ثانية (0 = غير مقفل) */
export function lockRemainingMs(userId: string, now: number = Date.now()): number {
  const state = loadAuthGuardState();
  const record = state[userId];
  if (!record || !record.lockedUntil) return 0;
  const remaining = record.lockedUntil - now;
  return remaining > 0 ? remaining : 0;
}

/** عدد المحاولات الفاشلة المتبقية قبل الإقفال (0 أثناء الإقفال الفعلي) */
export function attemptsRemaining(userId: string, now: number = Date.now()): number {
  const state = loadAuthGuardState();
  const record = state[userId];
  if (!record) return MAX_FAILED_ATTEMPTS;
  if (record.lockedUntil > now) return 0;
  return Math.max(0, MAX_FAILED_ATTEMPTS - record.failures);
}

/** يُسجّل محاولة فاشلة ويعيد الحالة بعدها (وقد يُقفل الحساب) */
export function registerFailedAttempt(
  userId: string,
  now: number = Date.now()
): { failures: number; lockedUntil: number } {
  const state: AuthGuardState = loadAuthGuardState();
  const previous = state[userId] || { failures: 0, lockedUntil: 0, lastFailureAt: 0 };
  // إقفال منتهٍ ⇒ نبدأ عدّاً جديداً
  const failures = previous.lockedUntil && previous.lockedUntil <= now ? 1 : previous.failures + 1;
  const lockedUntil = failures >= MAX_FAILED_ATTEMPTS ? now + LOCK_DURATION_MS : 0;
  state[userId] = { failures: lockedUntil ? 0 : failures, lockedUntil, lastFailureAt: now };
  saveAuthGuardState(state);
  return { failures, lockedUntil };
}

/** يمسح عدّاد المحاولات بعد دخول ناجح (أو بعد تعيين رمز جديد) */
export function clearFailedAttempts(userId: string): void {
  const state = loadAuthGuardState();
  if (!state[userId]) return;
  delete state[userId];
  saveAuthGuardState(state);
}

/** يحفظ جلسة لها انتهاء صريح — أو لا يحفظ شيئاً إن لم يُطلب التذكّر */
export function saveSession(userId: string, remember: boolean, now: number = Date.now()): void {
  if (!remember) {
    clearAuthSession();
    return;
  }
  const session: StoredAuthSession = {
    userId,
    loginTime: new Date(now).toISOString(),
    expiresAt: now + SESSION_TTL_MS,
    remember: true,
  };
  saveAuthSession(session);
}

/** يعيد الجلسة الصالحة فقط (غير منتهية · بتذكّر · بشكل صحيح) — وإلا null */
export function readValidSession(now: number = Date.now()): StoredAuthSession | null {
  const session = loadAuthSession();
  if (!session) return null;
  if (!session.userId || !session.remember) return null;
  if (!Number.isFinite(session.expiresAt) || session.expiresAt <= now) {
    clearAuthSession();
    return null;
  }
  return session;
}

/** إنهاء الجلسة الحالية */
export function endSession(): void {
  clearAuthSession();
}

/** تصفير كامل لحماية الدخول (تُستخدم في الاختبارات وفي «تسجيل الخروج») */
export function resetAuthGuard(): void {
  saveAuthGuardState({});
  clearAuthSession();
}
