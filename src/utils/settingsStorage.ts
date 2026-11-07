import { CompleteSystemSettings, UserRole } from '../types/settings';
import { dbStorage } from '../database/dbStorage';

const SETTINGS_STORAGE_KEY = 'qeema_accounting_system_settings_v1';

export const SETTINGS_UPDATED_EVENT = 'system_settings_updated';

export const DEFAULT_SYSTEM_SETTINGS: CompleteSystemSettings = {
  company: {
    nameAr: 'المنظومة-الإدارية-المتكاملة',
    nameEn: 'Integrated Administrative System',
    phone: '+967 771 234 567',
    email: 'admin@system.local',
    crNumber: 'CR-1049284',
    taxNumber: 'TAX-300192847500003',
    website: 'https://system.local',
    address: 'صنعاء - الإدارة العامة والمبيعات المركزية',
    logoUrl: '',
  },
  general: {
    baseCurrency: 'ريال سعودي (SAR)',
    timezone: '(GMT+03:00) الرياض / صنعاء / مكة المكرمة',
    calendarType: 'miladi',
    theme: 'light',
    salesInvoicePrefix: 'INV-',
    purchaseInvoicePrefix: 'PUR-',
    currentUserName: 'محمد العولقي',
    currentUserTitle: 'مدير النظام التنفيذي',
  },
  inventory: {
    warehouses: [
      { id: 'wh-1', name: 'المخزن الرئيسي', isDefault: true, code: 'WH-MAIN', location: 'المقر الرئيسي' },
      { id: 'wh-2', name: 'مخزن الفرع الثاني', isDefault: false, code: 'WH-BR2', location: 'فرع الحوبان' },
      { id: 'wh-3', name: 'مخزن البضاعة التالفة', isDefault: false, code: 'WH-DAMAGED', location: 'المستودع المركزي' },
    ],
    productCategories: [
      'عام',
      'إلكترونيات',
      'ملابس',
      'أغذية ومشروبات',
      'مستحضرات تجميل',
      'أدوية ومستلزمات طبية',
      'خدمات',
      'أخرى',
    ],
    units: ['قطعة', 'كرتونة', 'دستة', 'باكت', 'كجم', 'جم', 'متر', 'لتر', 'ساعة', 'طرد'],
  },
  fiscalYear: {
    currentYear: 2026,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    status: 'open',
    allowBackdatedEntries: true,
  },
  notifications: {
    stockAlertsEnabled: true,
    stockAlertThreshold: 5,
    invoiceDueAlertsEnabled: true,
    invoiceDueDaysNotice: 3,
    dailySummaryEnabled: true,
    soundAlertsEnabled: false,
    balanceMismatchAlertEnabled: true,
    treasuryLowAlertEnabled: true,
    treasuryLowThreshold: 1000,
  },
  printer: {
    paperSize: 'A4',
    orientation: 'portrait',
    margins: {
      top: 10,
      bottom: 10,
      right: 10,
      left: 10,
    },
    showCompanyLogo: true,
    showCompanyInfo: true,
    showFooter: true,
    footerText: 'شكراً لتعاملكم معنا - المنظومة-الإدارية-المتكاملة',
    fontSize: 'medium',
    colorMode: 'color',
    headerColor: '#0d6854',
    showTableBorders: true,
    showGridLines: true,
    autoPrint: false,
  },
  users: [
    {
      id: 'usr-1',
      name: 'محمد العولقي',
      email: 'admin@system.local',
      phone: '+967 771 234 567',
      role: 'admin',
      status: 'active',
      avatarInitial: 'م',
      lastLogin: 'الآن نشط',
      createdAt: '2025-01-10',
    },
    {
      id: 'usr-2',
      name: 'محاسب رئيسي',
      email: 'accountant@system.local',
      phone: '+967 772 345 678',
      role: 'accountant',
      status: 'active',
      avatarInitial: 'م',
      lastLogin: 'أمس، 04:15 م',
      createdAt: '2025-02-01',
    },
    {
      id: 'usr-3',
      name: 'مندوب المبيعات',
      email: 'sales@system.local',
      phone: '+967 773 456 789',
      role: 'sales',
      status: 'active',
      avatarInitial: 'م',
      lastLogin: 'منذ 3 أيام',
      createdAt: '2025-03-15',
    },
  ],
  rolePermissions: {
    admin: [
      'fin_create', 'fin_edit', 'fin_delete', 'fin_view', 'fin_reports',
      'inv_create', 'inv_edit', 'inv_delete', 'inv_view', 'inv_adjust',
      'sales_create', 'sales_edit', 'sales_delete', 'sales_discount', 'sales_view',
      'sys_settings', 'sys_backup', 'sys_users', 'sys_audit'
    ],
    accountant: [
      'fin_create', 'fin_edit', 'fin_view', 'fin_reports',
      'inv_view',
      'sales_view',
      'sys_audit'
    ],
    sales: [
      'sales_create', 'sales_view',
      'inv_view'
    ],
    viewer: [
      'fin_view', 'inv_view', 'sales_view'
    ],
  },
  database: {
    googleDriveClientId: '',
    isGoogleDriveConnected: false,
    autoBackupIntervalHours: 24,
  },
};

export const ALL_PERMISSIONS_LIST = [
  { id: 'fin_create', name: 'إضافة قيود وسندات مالية', category: 'الحسابات والمالية', description: 'إنشاء سندات قبض وصرف وقيود يومية' },
  { id: 'fin_edit', name: 'تعديل القيود والحسابات', category: 'الحسابات والمالية', description: 'تعديل المعاملات المالية المعتمدة' },
  { id: 'fin_delete', name: 'حذف السجلات المالية', category: 'الحسابات والمالية', description: 'إمكانية إلغاء وحذف القيود والسندات' },
  { id: 'fin_view', name: 'عرض السجلات وكشوفات الحساب', category: 'الحسابات والمالية', description: 'الاطلاع على الحركات والأرصدة' },
  { id: 'fin_reports', name: 'تصدير التقارير والقوائم الختامية', category: 'الحسابات والمالية', description: 'استعراض ميزان المراجعة والأرباح والخسائر' },

  { id: 'inv_create', name: 'إضافة منتجات وأصناف جديدة', category: 'المخزون والمستودعات', description: 'تسجيل أصناف وتحديد أسعارها' },
  { id: 'inv_edit', name: 'تعديل بيانات الأصناف والمخازن', category: 'المخزون والمستودعات', description: 'تعديل الأسماء والكميات والوحدات' },
  { id: 'inv_delete', name: 'حذف أصناف من المستودع', category: 'المخزون والمستودعات', description: 'حذف سجلات الأصناف نهائياً' },
  { id: 'inv_view', name: 'عرض المخزون وحركات التوريد والصرف', category: 'المخزون والمستودعات', description: 'متابعة أرصدة الأصناف' },
  { id: 'inv_adjust', name: 'إجراء تسويات وجرد مخزني', category: 'المخزون والمستودعات', description: 'تعديل فروقات الجرد والفاقد' },

  { id: 'sales_create', name: 'إنشاء فواتير المبيعات وعروض الأسعار', category: 'الفواتير والمبيعات', description: 'إصدار فواتير نقدية وآجلة' },
  { id: 'sales_edit', name: 'تعديل الفواتير الصادرة', category: 'الفواتير والمبيعات', description: 'تعديل الكميات والأسعار في الفاتورة' },
  { id: 'sales_delete', name: 'إلغاء وحذف الفواتير', category: 'الفواتير والمبيعات', description: 'إلغاء فواتير المبيعات المعتمدة' },
  { id: 'sales_discount', name: 'منح خصومات إضافية', category: 'الفواتير والمبيعات', description: 'تطبيق نسب خصم خاصة للعملاء' },
  { id: 'sales_view', name: 'استعراض سجل الفواتير والمقبوضات', category: 'الفواتير والمبيعات', description: 'الاطلاع على مبيعات الفروع' },

  { id: 'sys_settings', name: 'تعديل إعدادات النظام وبيانات الشركة', category: 'الإعدادات والنظام', description: 'التحكم في العملات والطابعات والشعار' },
  { id: 'sys_backup', name: 'النسخ الاحتياطي واستعادة البيانات', category: 'الإعدادات والنظام', description: 'تصدير واستيراد قواعد البيانات' },
  { id: 'sys_users', name: 'إدارة المستخدمين والصلاحيات', category: 'الإعدادات والنظام', description: 'إنشاء وتعديل حسابات المستخدمين' },
  { id: 'sys_audit', name: 'مراجعة سجلات التدقيق والمراقبة', category: 'الإعدادات والنظام', description: 'متابعة نشاط المستخدمين على النظام' },
] as const;

export function loadCompleteSystemSettings(): CompleteSystemSettings {
  try {
    const raw = dbStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const company = { ...DEFAULT_SYSTEM_SETTINGS.company, ...(parsed.company || {}) };
      // If company still has default placeholder from old version, update to new name
      if (!company.nameAr || company.nameAr === 'شركة قيمة للتجارة والتوكيلات') {
        company.nameAr = 'المنظومة-الإدارية-المتكاملة';
      }

      const general = {
        ...DEFAULT_SYSTEM_SETTINGS.general,
        ...(parsed.general || {}),
      };
      if (!general.currentUserName || general.currentUserName.trim() === '' || general.currentUserName === 'مدير النظام') {
        general.currentUserName = 'محمد العولقي';
      }
      if (!general.currentUserTitle || general.currentUserTitle.trim() === '' || general.currentUserTitle === 'مدير عام المنظومة والعمليات') {
        general.currentUserTitle = 'مدير النظام التنفيذي';
      }

      const users: typeof DEFAULT_SYSTEM_SETTINGS.users = parsed.users || DEFAULT_SYSTEM_SETTINGS.users;
      // If the primary admin user exists, sync their name
      if (users && users.length > 0 && users[0].id === 'usr-1' && (users[0].name === 'أنور قاسم' || users[0].name === 'مدير النظام' || !users[0].name)) {
        users[0].name = general.currentUserName;
        users[0].avatarInitial = 'م';
      }

      return {
        company,
        general,
        inventory: {
          warehouses: parsed.inventory?.warehouses || DEFAULT_SYSTEM_SETTINGS.inventory.warehouses,
          productCategories: parsed.inventory?.productCategories || DEFAULT_SYSTEM_SETTINGS.inventory.productCategories,
          units: parsed.inventory?.units || DEFAULT_SYSTEM_SETTINGS.inventory.units,
        },
        fiscalYear: { ...DEFAULT_SYSTEM_SETTINGS.fiscalYear, ...(parsed.fiscalYear || {}) },
        notifications: { ...DEFAULT_SYSTEM_SETTINGS.notifications, ...(parsed.notifications || {}) },
        printer: {
          ...DEFAULT_SYSTEM_SETTINGS.printer,
          ...(parsed.printer || {}),
          margins: { ...DEFAULT_SYSTEM_SETTINGS.printer.margins, ...(parsed.printer?.margins || {}) },
        },
        users,
        rolePermissions: { ...DEFAULT_SYSTEM_SETTINGS.rolePermissions, ...(parsed.rolePermissions || {}) },
        database: { ...DEFAULT_SYSTEM_SETTINGS.database, ...(parsed.database || {}) },
      };
    }
  } catch (err) {
    console.error('Error loading complete system settings:', err);
  }
  return DEFAULT_SYSTEM_SETTINGS;
}

export function saveCompleteSystemSettings(settings: CompleteSystemSettings): void {
  try {
    dbStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(SETTINGS_UPDATED_EVENT, { detail: settings }));
    }
  } catch (err) {
    console.error('Error saving complete system settings:', err);
  }
}

export function getCurrentUserProfile(): { name: string; title: string; initial: string } {
  const settings = loadCompleteSystemSettings();
  const rawName = settings.general?.currentUserName?.trim();
  const name = rawName && rawName !== 'مدير النظام' ? rawName : 'محمد العولقي';
  const rawTitle = settings.general?.currentUserTitle?.trim();
  const title = rawTitle && rawTitle !== 'مدير عام المنظومة والعمليات' ? rawTitle : 'مدير النظام التنفيذي';
  const initial = name.charAt(0) || 'م';
  return { name, title, initial };
}

export function updateCurrentUserName(newName: string, newTitle?: string): void {
  const settings = loadCompleteSystemSettings();
  settings.general.currentUserName = newName.trim() || 'محمد العولقي';
  if (newTitle !== undefined) {
    settings.general.currentUserTitle = newTitle.trim();
  }
  if (settings.users && settings.users.length > 0) {
    const adminIdx = settings.users.findIndex((u) => u.role === 'admin' || u.id === 'usr-1');
    if (adminIdx >= 0) {
      settings.users[adminIdx].name = settings.general.currentUserName;
      settings.users[adminIdx].avatarInitial = settings.general.currentUserName.charAt(0) || 'م';
    }
  }
  saveCompleteSystemSettings(settings);
}
