import React, { createContext, useContext, useState, useEffect } from 'react';
import { SystemUser, UserRole, CompleteSystemSettings } from '../types/settings';
import { ActiveModuleTab } from '../types';
import { loadCompleteSystemSettings, saveCompleteSystemSettings, SETTINGS_UPDATED_EVENT } from '../utils/settingsStorage';
import { dbStorage } from '../database/dbStorage';
import { modulesForRole, permissionsForRole } from '../utils/roles';

const AUTH_SESSION_KEY = 'suite_active_auth_session_v1';

/** نتيجة محاولة الدخول — تُخبر الواجهة إن كان الحساب بلا رمز ويحتاج تعيينه */
export interface LoginResult {
  success: boolean;
  error?: string;
  /** الحساب لا يملك رمزاً بعد ⇒ يجب تعيين رمز أول مرة قبل الدخول (R2) */
  needsPinSetup?: boolean;
}

/** رمز المرور المقبول: 4–6 أرقام، وليس رمزاً شائعاً */
export const isAcceptablePin = (pin: string): boolean => {
  const clean = pin.trim();
  if (!/^[0-9]{4,6}$/.test(clean)) return false;
  return !['1234', '0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999', '123456', '654321'].includes(clean);
};

export interface AuthContextType {
  currentUser: SystemUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  availableUsers: SystemUser[];
  rolePermissions: Record<UserRole, string[]>;
  login: (identifier: string, pinOrPassword?: string) => Promise<LoginResult>;
  setUserPin: (userId: string, pin: string) => Promise<LoginResult>;
  logout: () => void;
  quickSwitchUser: (userId: string) => void;
  hasPermission: (permissionId: string) => boolean;
  canAccessModule: (tab: ActiveModuleTab) => boolean;
  getAllowedTabs: () => ActiveModuleTab[];
  refreshUsers: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define allowed module tabs for each role

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

  // Restore saved session on mount
  useEffect(() => {
    try {
      const savedSessionRaw = dbStorage.getItem(AUTH_SESSION_KEY);
      if (savedSessionRaw) {
        const savedSession = JSON.parse(savedSessionRaw);
        if (savedSession && savedSession.userId) {
          const user = settings.users.find((u) => u.id === savedSession.userId);
          if (user && user.status === 'active') {
            setCurrentUser(user);
            setIsAuthenticated(true);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to restore auth session:', e);
    } finally {
      setIsLoading(false);
    }
  }, [settings.users]);

  // Login handler
  const login = async (identifier: string, pinOrPassword?: string): Promise<LoginResult> => {
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

    // التحقق من الرمز (إصلاح R2): لا رموز افتراضية إطلاقاً، ولا دخول بلا رمز.
    // سابقاً: ``pin || '1234'`` ⇒ أي حساب بلا رمز يُفتح بـ 1234، ورمز فارغ كان يمرّ
    // من البوابة كأنه صحيح. الآن: الحساب بلا رمز يُوجَّه لتعيينه، والرمز الفارغ يُرفض.
    const secrets = [user.pin, user.password].filter((s): s is string => !!s && !!s.trim());

    if (secrets.length === 0) {
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
    if (!secrets.includes(credential)) {
      return { success: false, error: 'رمز المرور أو PIN غير صحيح' };
    }

    // Success: update lastLogin
    const updatedUsers = freshSettings.users.map((u) =>
      u.id === user.id
        ? {
            ...u,
            lastLogin: `اليوم، ${new Date().toLocaleTimeString('ar-YE', {
              hour: '2-digit',
              minute: '2-digit',
            })}`,
          }
        : u
    );

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

    // Persist session
    dbStorage.setItem(
      AUTH_SESSION_KEY,
      JSON.stringify({
        userId: user.id,
        loginTime: new Date().toISOString(),
      })
    );

    return { success: true };
  };

  /**
   * تعيين رمز المرور لأول مرة (أو تغييره من شاشة الدخول) — R2.
   * يُحفظ داخل سجل المستخدم في الإعدادات المركزية، ثم يُستكمل الدخول بالرمز نفسه.
   */
  const setUserPin = async (userId: string, pin: string): Promise<LoginResult> => {
    const clean = pin.trim();
    if (!isAcceptablePin(clean)) {
      return { success: false, error: 'الرمز يجب أن يكون من 4 إلى 6 أرقام وغير شائع (لا 1234 ولا أرقام مكرّرة)' };
    }
    const fresh = loadCompleteSystemSettings();
    const target = fresh.users.find((u) => u.id === userId);
    if (!target) {
      return { success: false, error: 'المستخدم غير موجود بالنظام' };
    }
    const updatedUsers = fresh.users.map((u) => (u.id === userId ? { ...u, pin: clean } : u));
    saveCompleteSystemSettings({ ...fresh, users: updatedUsers });
    setSettings({ ...fresh, users: updatedUsers });
    return { success: true };
  };

  // Logout handler
  const logout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    dbStorage.removeItem(AUTH_SESSION_KEY);
  };

  // Quick user switch
  const quickSwitchUser = (userId: string) => {
    const user = settings.users.find((u) => u.id === userId);
    if (user && user.status === 'active' && user.pin) {
      // يمر عبر نفس بوابة التحقق (رمز الحساب نفسه) — ولا تبديل لحساب بلا رمز (R2)
      void login(user.id, user.pin);
    }
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
    quickSwitchUser,
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
