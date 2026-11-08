import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearAuthSession,
  loadAuthGuardState,
  loadAuthSession,
  saveAuthGuardState,
  saveAuthSession,
} from '../../src/utils/storage/system';
import { dbStorage } from '../../src/database/dbStorage';
import { STORAGE_KEYS } from '../../src/utils/storage/keys';

beforeEach(() => {
  dbStorage.removeItem(STORAGE_KEYS.AUTH_GUARD);
  dbStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
});

describe('تخزين حماية الدخول — صلابة ضد التلف', () => {
  it('الحالة الافتراضية فارغة', () => {
    expect(loadAuthGuardState()).toEqual({});
    expect(loadAuthSession()).toBeNull();
  });

  it('يحفظ ويقرأ سجل الإقفال', () => {
    saveAuthGuardState({ u1: { failures: 2, lockedUntil: 0, lastFailureAt: 123 } });
    expect(loadAuthGuardState().u1.failures).toBe(2);
  });

  it('JSON تالف أو مصفوفة ⇒ يعود لفراغ بلا انهيار', () => {
    dbStorage.setItem(STORAGE_KEYS.AUTH_GUARD, '{ليس JSON');
    expect(loadAuthGuardState()).toEqual({});
    dbStorage.setItem(STORAGE_KEYS.AUTH_GUARD, '[1,2,3]');
    expect(loadAuthGuardState()).toEqual({});
  });

  it('الجلسة تُحفظ وتُقرأ وتُمسح', () => {
    const session = { userId: 'u1', loginTime: new Date().toISOString(), expiresAt: Date.now() + 1000, remember: true };
    saveAuthSession(session);
    expect(loadAuthSession()?.userId).toBe('u1');
    clearAuthSession();
    expect(loadAuthSession()).toBeNull();
  });

  it('جلسة تالفة أو بلا معرّف تُرفض', () => {
    dbStorage.setItem(STORAGE_KEYS.AUTH_SESSION, '{ليس JSON');
    expect(loadAuthSession()).toBeNull();
    dbStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify({ loginTime: 'x' }));
    expect(loadAuthSession()).toBeNull();
  });
});
