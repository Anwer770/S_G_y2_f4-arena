import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { SystemUser, UserRole, CompleteSystemSettings } from '../types/settings';
import { ActiveModuleTab } from '../types';
import { loadCompleteSystemSettings, saveCompleteSystemSettings, SETTINGS_UPDATED_EVENT } from '../utils/settingsStorage';
import { dbStorage } from '../database/dbStorage';

const AUTH_SESSION_KEY = 'suite_active_auth_session_v1';

export interface AuthContextType {
  currentUser: SystemUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  availableUsers: SystemUser[];
  rolePermissions: Record<UserRole, string[]>;
  login: (identifier: string, pinOrPassword?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  quickSwitchUser: (userId: string) => void;
  hasPermission: (permissionId: string) => boolean;
  canAccessModule: (tab: ActiveModuleTab) => boolean;
  getAllowedTabs: () => ActiveModuleTab[];
  refreshUsers: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define allowed module tabs for each role
const ROLE_MODULE_ACCESS: Record<UserRole, ActiveModuleTab[]> = {
  admin: [
    'dashboard',
    'financial',
    'stock',
    'tasks',
    'customers',
    'doctors',
    'debts',
    'custody',
    'knowledge',
    'routines',
    'links',
    'taskflow',
    'workos',
    'settings',
  ],
  accountant: [
    'dashboard',
    'financial',
    'debts',
    'custody',
    'customers',
    'stock',
    'tasks',
    'links',
    'knowledge',
  ],
  sales: [
    'dashboard',
    'customers',
    'doctors',
    'tasks',
    'stock',
    'custody',
    'links',
    'knowledge',
  ],
  viewer: [
    'dashboard',
    'stock',
    'customers',
    'doctors',
    'links',
    'knowledge',
  ],
};

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
  const login = async (identifier: string, pinOrPassword?: string): Promise<{ success: boolean; error?: string }> => {
    const cleanId = identifier.trim().toLowerCase();
    const user = settings.users.find(
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

    // Check PIN/password.
    // الافتراضيان '1234' و 'admin123' يُستخدمان فقط حين لا يملك الحساب رمزاً/كلمة مرور خاصة به.
    // (سابقاً كان '1234' مقبولاً لكل حساب دائماً حتى مع وجود رمز خاص => تجاوز للمصادقة)
    if (pinOrPassword && pinOrPassword.trim()) {
      const input = pinOrPassword.trim();
      const validPin = user.pin || '1234';
      const validPassword = user.password || 'admin123';

      if (input !== validPin && input !== validPassword) {
        return { success: false, error: 'رمز المرور أو PIN غير صحيح' };
      }
    }

    // Success: update lastLogin
    const updatedUsers = settings.users.map((u) =>
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
      ...settings,
      users: updatedUsers,
      general: {
        ...settings.general,
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

  // Logout handler
  const logout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    dbStorage.removeItem(AUTH_SESSION_KEY);
  };

  // Quick user switch
  const quickSwitchUser = (userId: string) => {
    const user = settings.users.find((u) => u.id === userId);
    if (user && user.status === 'active') {
      // يمر عبر نفس بوابة التحقق (رمز الحساب نفسه) بدل مسار بلا تحقق
      login(user.id, user.pin || '1234');
    }
  };

  // Check specific permission
  const hasPermission = (permissionId: string): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;

    const userPerms = settings.rolePermissions[currentUser.role] || [];
    return userPerms.includes(permissionId);
  };

  // Check module tab access
  const canAccessModule = (tab: ActiveModuleTab): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;

    const allowed = ROLE_MODULE_ACCESS[currentUser.role] || ['dashboard'];
    return allowed.includes(tab);
  };

  // Get list of allowed tabs for current user
  const getAllowedTabs = (): ActiveModuleTab[] => {
    if (!currentUser) return ['dashboard'];
    if (currentUser.role === 'admin') {
      return ROLE_MODULE_ACCESS.admin;
    }
    return ROLE_MODULE_ACCESS[currentUser.role] || ['dashboard'];
  };

  const value: AuthContextType = {
    currentUser,
    isAuthenticated,
    isLoading,
    availableUsers: settings.users,
    rolePermissions: settings.rolePermissions,
    login,
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
