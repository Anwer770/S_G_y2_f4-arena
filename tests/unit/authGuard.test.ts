import { beforeEach, describe, expect, it } from 'vitest';
import {
  LOCK_DURATION_MS,
  MAX_FAILED_ATTEMPTS,
  SESSION_TTL_MS,
  attemptsRemaining,
  clearFailedAttempts,
  endSession,
  lockRemainingMs,
  readValidSession,
  registerFailedAttempt,
  resetAuthGuard,
  saveSession,
} from '../../src/utils/authGuard';
import { dbStorage } from '../../src/database/dbStorage';
import { STORAGE_KEYS } from '../../src/utils/storage/keys';

const USER = 'usr-test';

beforeEach(() => {
  resetAuthGuard();
});

describe('إقفال المحاولات الفاشلة', () => {
  it('لا إقفال قبل الوصول إلى الحد', () => {
    expect(lockRemainingMs(USER)).toBe(0);
    for (let i = 1; i < MAX_FAILED_ATTEMPTS; i++) {
      const outcome = registerFailedAttempt(USER);
      expect(outcome.lockedUntil).toBe(0);
      expect(lockRemainingMs(USER)).toBe(0);
      expect(attemptsRemaining(USER)).toBe(MAX_FAILED_ATTEMPTS - i);
    }
  });

  it('يُقفل الحساب عند الحد ويعيد مدة الإقفال', () => {
    for (let i = 0; i < MAX_FAILED_ATTEMPTS; i++) registerFailedAttempt(USER);
    const remaining = lockRemainingMs(USER);
    expect(remaining).toBeGreaterThan(0);
    expect(remaining).toBeLessThanOrEqual(LOCK_DURATION_MS);
    expect(attemptsRemaining(USER)).toBe(0);
  });

  it('الإقفال محفوظ في التخزين ⇒ يعيش بعد إعادة القراءة (لا يُصفَّر بإعادة التحميل)', () => {
    for (let i = 0; i < MAX_FAILED_ATTEMPTS; i++) registerFailedAttempt(USER);
    const raw = dbStorage.getItem(STORAGE_KEYS.AUTH_GUARD);
    expect(raw).toContain('lockedUntil');
    expect(JSON.parse(raw as string)[USER].lockedUntil).toBeGreaterThan(Date.now());
  });

  it('ينتهي الإقفال بانقضاء المدة ويعود العدّاد', () => {
    const now = Date.now();
    for (let i = 0; i < MAX_FAILED_ATTEMPTS; i++) registerFailedAttempt(USER, now);
    expect(lockRemainingMs(USER, now + LOCK_DURATION_MS + 1)).toBe(0);
    const after = registerFailedAttempt(USER, now + LOCK_DURATION_MS + 2);
    expect(after.failures).toBe(1);
    expect(after.lockedUntil).toBe(0);
  });

  it('مسح المحاولات (دخول ناجح) يرفع الإقفال', () => {
    for (let i = 0; i < MAX_FAILED_ATTEMPTS; i++) registerFailedAttempt(USER);
    expect(lockRemainingMs(USER)).toBeGreaterThan(0);
    clearFailedAttempts(USER);
    expect(lockRemainingMs(USER)).toBe(0);
    expect(attemptsRemaining(USER)).toBe(MAX_FAILED_ATTEMPTS);
  });

  it('حساب لا علاقة له لا يتأثر بإقفال حساب آخر', () => {
    for (let i = 0; i < MAX_FAILED_ATTEMPTS; i++) registerFailedAttempt(USER);
    expect(lockRemainingMs('usr-other')).toBe(0);
  });
});

describe('الجلسة — انتهاء صريح', () => {
  it('لا تُحفظ الجلسة إن لم يُطلب «تذكّر الدخول»', () => {
    saveSession(USER, false);
    expect(dbStorage.getItem(STORAGE_KEYS.AUTH_SESSION)).toBeNull();
    expect(readValidSession()).toBeNull();
  });

  it('تُحفظ الجلسة 8 ساعات عند «تذكّر الدخول» وتُستعاد', () => {
    const now = Date.now();
    saveSession(USER, true, now);
    const session = readValidSession(now + 1000);
    expect(session).not.toBeNull();
    expect(session?.userId).toBe(USER);
    expect(session?.remember).toBe(true);
    expect((session?.expiresAt ?? 0) - now).toBe(SESSION_TTL_MS);
  });

  it('الجلسة المنتهية لا تُستعاد وتُمسح من التخزين', () => {
    const now = Date.now();
    saveSession(USER, true, now);
    expect(readValidSession(now + SESSION_TTL_MS + 1)).toBeNull();
    expect(dbStorage.getItem(STORAGE_KEYS.AUTH_SESSION)).toBeNull();
  });

  it('جلسة بصيغة قديمة (بلا expiresAt) تُعدّ منتهية', () => {
    dbStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify({ userId: USER, loginTime: new Date().toISOString() }));
    expect(readValidSession()).toBeNull();
  });

  it('جلسة بلا «تذكّر» مكتوبة يدوياً تُرفض', () => {
    dbStorage.setItem(
      STORAGE_KEYS.AUTH_SESSION,
      JSON.stringify({
        userId: USER,
        loginTime: new Date().toISOString(),
        expiresAt: Date.now() + 60_000,
        remember: false,
      })
    );
    expect(readValidSession()).toBeNull();
  });

  it('تسجيل الخروج يمحو الجلسة', () => {
    saveSession(USER, true);
    expect(readValidSession()).not.toBeNull();
    endSession();
    expect(readValidSession()).toBeNull();
  });

  it('حفظ جلسة بلا «تذكّر» يمحو جلسة سابقة بدل إبقائها', () => {
    saveSession(USER, true);
    saveSession(USER, false);
    expect(readValidSession()).toBeNull();
  });
});

/**
 * R49 — ذراع دفاعية: مسح محاولات لمستخدم لا سجلّ له ولا ينبغي أن يكتب شيئاً.
 */
describe('R49 — مسح محاولات لمستخدم بلا سجلّ', () => {
  it('لا يكتب في التخزين ولا يرمي', () => {
    resetAuthGuard();
    const before = dbStorage.getItem(STORAGE_KEYS.AUTH_GUARD);
    expect(() => clearFailedAttempts('مستخدم-غير-موجود')).not.toThrow();
    expect(dbStorage.getItem(STORAGE_KEYS.AUTH_GUARD)).toBe(before);
  });
});
