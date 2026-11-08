import React, { createContext, useContext, useState, useEffect } from 'react';
import { SystemUser, UserRole, CompleteSystemSettings } from '../types/settings';
import { ActiveModuleTab } from '../types';
import { loadCompleteSystemSettings, saveCompleteSystemSettings, SETTINGS_UPDATED_EVENT } from '../utils/settingsStorage';
import { modulesForRole, permissionsForRole } from '../utils/roles';
import { PinDigest, hashPin, verifyPin, hasPinDigest, isAcceptablePin, isWebCryptoAvailable } from '../utils/pinCrypto';
import {
  MAX_FAILED_ATTEMPTS,
  lockRemainingMs,
  attemptsRemaining,
  registerFailedAttempt,
  clearFailedAttempts,
  saveSession,
  readValidSession,
  endSession,
} from '../utils/authGuard';

/** إعادة تصدير لقاعدة الرمز المقبول حتى تبقى الواجهة على مسار استيراد واحد */
export { isAcceptablePin };

/** نتيجة محاولة الدخول — تُخبر الواجهة إن كان الحساب بلا رمز ويحتاج تعيينه، أو مقفلاً مؤقتاً */
export interface LoginResult {
  success: boolean;
  error?: string;
  /** الحساب لا يملك رمزاً بعد ⇒ يجب تعيين رمز أول مرة قبل الدخول (R2) */
  needsPinSetup?: boolean;
  /** المحاولات المتبقية قبل الإقفال المؤقت */
  attemptsRemaining?: number;
  /** طابع زمني (ms) لنهاية الإقفال إن كان الحساب مقفلاً */
  lockedUntil?: number;
}

export interface LoginOptions {
  /** حفظ الجلسة 8 ساعات (يُلغى إن لم يُطلب) — P2 */
  remember?: boolean;
}

export interface AuthContextType {
  currentUser: SystemUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  availableUsers: SystemUser[];
  rolePermissions: Record<UserRole, string[]>;
  login: (identifier: string, pinOrPassword?: string, options?: LoginOptions) => Promise<LoginResult>;
  setUserPin: (userId: string, pin: string) => Promise<LoginResult>;
  logout: () => void;
  hasPermission: (permissionId: string) => boolean;
  canAccessModule: (tab: ActiveModuleTab) => boolean;
  getAllowedTabs: () => ActiveModuleTab[];
  refreshUsers: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** يضع ملخّص الرمز ويحذف أي أثر نصي صريح للرمز (ترقية/تعيين) */
const withPinDigest = (user: SystemUser, digest: PinDigest): SystemUser => {
  const next: SystemUser = {
    ...user,
    pinHash: digest.pinHash,
    pinSalt: digest.pinSalt,
    pinIterations: digest.pinIterations,
  };
  delete next.pin;
  delete next.password;
  return next;
};

/** أسرار نصية قديمة (قبل التجزئة) — تُقبل مرة واحدة ثم تُرقّى تلقائياً */
const legacySecrets = (user: SystemUser): string[] =>
  [user.pin, user.password].filter((s): s is string => !!s && !!s.trim());

const minutes = (ms: number): number => Math.max(1, Math.ceil(ms / 60000));

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<SystemUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [settings, setSettings] = useState<CompleteSystemSettings>(() => loadCompleteSystemSettings());

  // Reload settings on custom event
  const refreshUsers = () => {
    const fresh = loadCompleteSystemSettings();
    setSettings(fresh);
  };

  useEffect(() => {
    const handleSettingsUpdate = () => {
      refreshUsers();
    };

    window.addEventListener(SETTINGS_UPDATED_EVENT, handleSettingsUpdate);
    return () => window.removeEventListener(SETTINGS_UPDATED_EVENT, handleSettingsUpdate);
  }, []);

  // استعادة الجلسة — بحدّ صريح (8 ساعات) وللجلسات التي طلبت «تذكّر الدخول» فقط (P2)
  useEffect(() => {
    try {
      const session = readValidSession();
      if (session) {
        const user = settings.users.find((u) => u.id === session.userId);
        if (user && user.status === 'active') {
          setCurrentUser(user);
          setIsAuthenticated(true);
        } else {
          endSession();
        }
      }
    } catch (e) {
      console.warn('Failed to restore auth session:', e);
    } finally {
      setIsLoading(false);
    }
  }, [settings.users]);

  // Login handler
  const login = async (
    identifier: string,
    pinOrPassword?: string,
    options?: LoginOptions
  ): Promise<LoginResult> => {
    const remember = options?.remember !== false;
    // نقرأ الإعدادات من المصدر مباشرة لا من حالة الإغلاق (closure): الرمز قد يكون
    // عُيِّن للتوّ عبر setUserPin في نفس الدورة، وحالة React لم تكن لتظهر بعد.
    const freshSettings = loadCompleteSystemSettings();
    const cleanId = identifier.trim().toLowerCase();
    const user = freshSettings.users.find(
      (u) =>
        u.id.toLowerCase() === cleanId ||
        u.email.toLowerCase() === cleanId ||
        u.name.toLowerCase() === cleanId
    );

    if (!user) {
      return { success: false, error: 'المستخدم غير موجود بالنظام' };
    }

    if (user.status === 'inactive') {
      return { success: false, error: 'هذا الحساب معطل، يرجى مراجعة مسؤول النظام' };
    }

    // (1) إقفال مؤقت بعد محاولات فاشلة متكرّرة
    const lockedFor = lockRemainingMs(user.id);
    if (lockedFor > 0) {
      return {
        success: false,
        lockedUntil: Date.now() + lockedFor,
        attemptsRemaining: 0,
        error: `الحساب مقفل مؤقتاً بعد ${MAX_FAILED_ATTEMPTS} محاولات فاشلة — أعد المحاولة بعد ${minutes(lockedFor)} دقيقة`,
      };
    }

    // (2) لا رموز افتراضية: حساب بلا ملخّص ولا سرّ نصي ⇒ تعيين أول مرة
    const legacy = legacySecrets(user);
    const hasDigest = hasPinDigest(user);
    if (!hasDigest && legacy.length === 0) {
      return {
        success: false,
        needsPinSetup: true,
        error: 'هذا الحساب بلا رمز مرور بعد — عيّن رمزاً من 4 إلى 6 أرقام للمتابعة',
      };
    }

    const credential = (pinOrPassword || '').trim();
    if (!credential) {
      return { success: false, error: 'أدخل رمز المرور (PIN) للمتابعة' };
    }

    // (3) التحقق: ملخّص PBKDF2 أولاً، وإلا سرّ قديم يُرقّى عند النجاح
    let accepted = false;
    let upgraded: PinDigest | null = null;

    if (hasDigest) {
      if (!isWebCryptoAvailable()) {
        return {
          success: false,
          error: 'تعذّر التحقق من الرمز: Web Crypto غير متاح في هذا المتصفح — افتح التطبيق عبر HTTPS أو localhost',
        };
      }
      try {
        accepted = await verifyPin(credential, {
          pinHash: user.pinHash as string,
          pinSalt: user.pinSalt as string,
          pinIterations: Number(user.pinIterations),
        });
      } catch {
        return { success: false, error: 'تعذّر التحقق من الرمز في هذه البيئة (Web Crypto)' };
      }
    } else {
      accepted = legacy.includes(credential);
      if (accepted && isWebCryptoAvailable()) {
        try {
          upgraded = await hashPin(credential);
        } catch {
          upgraded = null;
        }
      }
    }

    // (4) محاولة فاشلة ⇒ عدّاد وإقفال عند الحد
    if (!accepted) {
      const outcome = registerFailedAttempt(user.id);
      if (outcome.lockedUntil > Date.now()) {
        return {
          success: false,
          lockedUntil: outcome.lockedUntil,
          attemptsRemaining: 0,
          error: `رمز غير صحيح — أُقفل الحساب ${minutes(outcome.lockedUntil - Date.now())} دقيقة بعد ${MAX_FAILED_ATTEMPTS} محاولات فاشلة`,
        };
      }
      const remaining = attemptsRemaining(user.id);
      return {
        success: false,
        attemptsRemaining: remaining,
        error: `رمز المرور أو PIN غير صحيح — تبقّى ${remaining} محاولة قبل الإقفال المؤقت`,
      };
    }

    clearFailedAttempts(user.id);

    // Success: update lastLogin (+ ترقية الملخّص إن كان الرمز نصياً قديماً)
    const updatedUsers = freshSettings.users.map((u) => {
      if (u.id !== user.id) return u;
      const base: SystemUser = {
        ...u,
        lastLogin: `اليوم، ${new Date().toLocaleTimeString('ar-YE', {
          hour: '2-digit',
          minute: '2-digit',
        })}`,
      };
      return upgraded ? withPinDigest(base, upgraded) : base;
    });

    const updatedSettings = {
      ...freshSettings,
      users: updatedUsers,
      general: {
        ...freshSettings.general,
        currentUserName: user.name,
        currentUserTitle:
          user.role === 'admin'
            ? 'مدير عام المنظومة والعمليات'
            : user.role === 'accountant'
            ? 'المحاسب المالي المعتمد'
            : user.role === 'sales'
            ? 'مسؤول المبيعات والميدان'
            : 'مستعرض النظام',
      },
    };

    saveCompleteSystemSettings(updatedSettings);
    setSettings(updatedSettings);

    const activeUser = updatedUsers.find((u) => u.id === user.id) || user;
    setCurrentUser(activeUser);
    setIsAuthenticated(true);

    // جلسة بانتهاء صريح (8 ساعات) — أو بلا جلسة إن لم يُطلب التذكّر
    saveSession(user.id, remember);

    return { success: true };
  };

  /**
   * تعيين رمز المرور لأول مرة (أو تغييره من شاشة الدخول) — R2.
   * يُخزَّن **ملخّص PBKDF2 فقط** (لا نص صريح)، ثم يُستكمل الدخول بالرمز نفسه.
   */
  const setUserPin = async (userId: string, pin: string): Promise<LoginResult> => {
    const clean = pin.trim();
    if (!isAcceptablePin(clean)) {
      return { success: false, error: 'الرمز يجب أن يكون من 4 إلى 6 أرقام وغير شائع (لا 1234 ولا أرقام مكرّرة)' };
    }
    if (!isWebCryptoAvailable()) {
      return {
        success: false,
        error: 'تعذّر تأمين الرمز: Web Crypto غير متاح في هذا المتصفح — افتح التطبيق عبر HTTPS أو localhost',
      };
    }
    const fresh = loadCompleteSystemSettings();
    const target = fresh.users.find((u) => u.id === userId);
    if (!target) {
      return { success: false, error: 'المستخدم غير موجود بالنظام' };
    }

    const digest = await hashPin(clean);
    const updatedUsers = fresh.users.map((u) => (u.id === userId ? withPinDigest(u, digest) : u));
    saveCompleteSystemSettings({ ...fresh, users: updatedUsers });
    setSettings({ ...fresh, users: updatedUsers });
    clearFailedAttempts(userId);
    return { success: true };
  };

  // Logout handler
  const logout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    endSession();
  };

  // Check specific permission
  const hasPermission = (permissionId: string): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;

    const userPerms = permissionsForRole(currentUser.role, settings.rolePermissions, settings.customRoles);
    if (userPerms[0] === '*') return true;
    return userPerms.includes(permissionId);
  };

  // Check module tab access
  const canAccessModule = (tab: ActiveModuleTab): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;

    const allowed = modulesForRole(currentUser.role, settings.rolePermissions, settings.customRoles);
    return allowed.includes(tab);
  };

  // Get list of allowed tabs for current user
  const getAllowedTabs = (): ActiveModuleTab[] => {
    if (!currentUser) return ['dashboard'];
    return modulesForRole(currentUser.role, settings.rolePermissions, settings.customRoles);
  };

  const value: AuthContextType = {
    currentUser,
    isAuthenticated,
    isLoading,
    availableUsers: settings.users,
    rolePermissions: settings.rolePermissions,
    login,
    setUserPin,
    logout,
    hasPermission,
    canAccessModule,
    getAllowedTabs,
    refreshUsers,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
