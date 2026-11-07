import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { SystemUser, UserRole } from '../../types/settings';
import {
  ShieldCheck,
  Lock,
  UserCheck,
  KeyRound,
  ArrowLeft,
  Eye,
  EyeOff,
  Building2,
  Database,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Smartphone,
  Users,
  Briefcase,
  HelpCircle,
} from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { availableUsers, login, isLoading } = useAuth();
  const [selectedUser, setSelectedUser] = useState<SystemUser>(
    availableUsers.find((u) => u.status === 'active') || availableUsers[0]
  );
  const [pin, setPin] = useState<string>('');
  const [showPin, setShowPin] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return {
          label: 'مدير النظام (صلاحيات كاملة)',
          bg: 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800',
        };
      case 'accountant':
        return {
          label: 'محاسب مالي (سجلات ومطابقات)',
          bg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
        };
      case 'sales':
        return {
          label: 'مندوب ميداني ومبيعات',
          bg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        };
      case 'viewer':
      default:
        return {
          label: 'مستعرض (قراءة فقط)',
          bg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
        };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) {
      setErrorMessage('يرجى اختيار حساب المستخدم');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await login(selectedUser.id, pin.trim() || '1234');
      if (!res.success) {
        setErrorMessage(res.error || 'فشل تسجيل الدخول، تحقق من البيانات');
      }
    } catch {
      setErrorMessage('حدث خطأ أثناء محاولة تسجيل الدخول');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = async (user: SystemUser) => {
    // حساب محمي برمز خاص: لا دخول بضغطة واحدة — يُطلب الرمز أولاً
    const hasCustomPin = !!user.pin && user.pin !== '1234';
    if (hasCustomPin) {
      setSelectedUser(user);
      setErrorMessage('هذا الحساب محمي برمز خاص — أدخل PIN ثم اضغط تسجيل الدخول');
      return;
    }

    setSelectedUser(user);
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await login(user.id, user.pin || '1234');
      if (!res.success) {
        setErrorMessage(res.error || 'تعذر تسجيل الدخول');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white font-sans" dir="rtl">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-300 font-bold">جاري تحميل جلسة العمل ومحرك البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 select-none font-sans"
      dir="rtl"
    >
      <div className="w-full max-w-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl shadow-2xl border border-slate-200/20 dark:border-slate-800 overflow-hidden text-slate-900 dark:text-slate-100 transition-all">
        {/* Brand Banner */}
        <div className="bg-[#0F3935] p-6 sm:p-8 text-white relative overflow-hidden border-b border-[#134E48]">
          <div className="absolute -left-12 -top-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-teal-400/10 rounded-full blur-xl pointer-events-none" />

          <div className="flex items-center justify-between relative z-10 flex-wrap gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-white/10 dark:bg-slate-900/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg">
                <Building2 className="w-6 h-6 text-emerald-300" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                  المنظومة الإدارية والمالية الشاملة
                </h1>
                <p className="text-xs sm:text-sm text-teal-200/90 font-medium mt-0.5">
                  القيصر الذهبي • نظام إدارة العمليات والمخزون والحسابات
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-950/40 border border-teal-500/30 text-xs font-mono font-bold text-teal-200">
              <Database className="w-3.5 h-3.5 text-teal-400" />
              <span>محرك IndexedDB مفعل</span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Instructions & Header */}
          <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <h2 className="text-base sm:text-lg font-bold">تسجيل الدخول والتحقق من الصلاحيات</h2>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
              اختر حسابك للمتابعة
            </span>
          </div>

          {errorMessage && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 rounded-xl flex items-center gap-2.5 text-rose-700 dark:text-rose-300 text-xs font-bold animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* User Selection Cards */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>الحسابات المصرح لها على هذا الجهاز:</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {availableUsers.map((user) => {
                const isSelected = selectedUser?.id === user.id;
                const roleBadge = getRoleBadge(user.role);

                return (
                  <div
                    key={user.id}
                    onClick={() => {
                      setSelectedUser(user);
                      setErrorMessage(null);
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer relative text-right flex flex-col justify-between ${
                      isSelected
                        ? 'border-teal-600 bg-teal-50/50 dark:bg-teal-950/30 ring-2 ring-teal-500/20 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 hover:border-teal-300 dark:hover:border-slate-700 bg-white dark:bg-slate-850'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-xs ${
                          isSelected
                            ? 'bg-[#0d6854] text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {user.avatarInitial || user.name.charAt(0) || 'م'}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {user.name}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">
                          {user.email}
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                      <span
                        className={`px-1.5 py-0.5 rounded text-xs font-bold border ${roleBadge.bg}`}
                      >
                        {user.role === 'admin'
                          ? 'مدير عام'
                          : user.role === 'accountant'
                          ? 'محاسب'
                          : user.role === 'sales'
                          ? 'مبيعات'
                          : 'مستعرض'}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickLogin(user);
                        }}
                        className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
                        title="دخول مباشر"
                      >
                        دخول سريع ←
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Credentials */}
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>رمز المرور السريع أو PIN (اختياري، الافتراضي: 1234):</span>
                </label>
                <span className="text-xs text-slate-400 dark:text-slate-500">PIN: 1234</span>
              </div>

              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="أدخل رمز PIN (أو اضغط تسجيل الدخول مباشرة)"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 placeholder-slate-400 tracking-wider"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember me & auto-login options */}
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded text-teal-600 dark:text-teal-400 focus:ring-teal-500 w-4 h-4 cursor-pointer"
                />
                <span>تذكر تسجيل الدخول وحفظ الجلسة</span>
              </label>

              <div className="flex items-center gap-1 text-xs text-teal-600 dark:text-teal-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>حماية الصلاحيات نشطة</span>
              </div>
            </div>

            {/* Action Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-[#0D9488] hover:bg-[#059669] text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>جاري التحقق والدخول...</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span>تسجيل الدخول كـ {selectedUser?.name || 'مستخدم'}</span>
                </>
              )}
            </button>
          </form>

          {/* Role Access Matrix Quick Guide */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
              <HelpCircle className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>مستويات الوصول والصلاحيات المعمول بها:</span>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
              <li className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-500" />
                <span><strong>مدير النظام:</strong> وصول كامل، تعديل الإعدادات والنسخ والمالية</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span><strong>المحاسب المالي:</strong> إدارة السجل المالي، الديون، المطابقات والأرصدة</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span><strong>المندوب الميداني:</strong> زيارات العملاء، زيارات الأطباء، المهام، المخزون</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <span><strong>المستعرض:</strong> استعراض القيود والتقارير العامة دون إمكانية التعديل</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Security Badges */}
        <div className="px-6 py-3.5 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Smartphone className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>متوافق تماماً مع شاشات الهواتف وأجهزة التابلت</span>
          </div>
          <div className="flex items-center gap-1 text-xs font-mono">
            <span>المنظومة v2.4.0 • IndexedDB Offline</span>
          </div>
        </div>
      </div>
    </div>
  );
};
