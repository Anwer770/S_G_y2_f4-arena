import { CompleteSystemSettings, CustomRole, SystemUser } from '../types/settings';
import { createObjectRepository } from '../database/repositories/ObjectRepository';
import { STORAGE_KEYS } from './storage/keys';

/** المفتاح السابق كان خارج سجل المفاتيح الموحّد؛ يبقى للقراءة مرة واحدة فقط. */
export const LEGACY_SETTINGS_STORAGE_KEY = 'qeema_accounting_system_settings_v1';
const SETTINGS_STORAGE_KEY = STORAGE_KEYS.SETTINGS;

/**
 * الإعدادات تُقرأ ككائن واحد بلا دمج تلقائي (R42): التطبيع أدناه يدمج كل قسم
 * على حِدة ويتعامل مع قيم قديمة، فلا يصح أن يسبقه دمج ضحل يُخفي الغياب.
 */
const settingsRepo = createObjectRepository<Record<string, unknown>>({
  key: SETTINGS_STORAGE_KEY,
  defaults: {},
  noMerge: true,
  legacyKeys: [LEGACY_SETTINGS_STORAGE_KEY],
});

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
    reorderPointDefault: 5,
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
      'fin_create',
      'fin_edit',
      'fin_delete',
      'fin_view',
      'fin_reports',
      'inv_create',
      'inv_edit',
      'inv_delete',
      'inv_view',
      'inv_adjust',
      'sales_create',
      'sales_edit',
      'sales_delete',
      'sales_discount',
      'sales_view',
      'sys_settings',
      'sys_backup',
      'sys_users',
      'sys_audit',
    ],
    accountant: ['fin_create', 'fin_edit', 'fin_view', 'fin_reports', 'inv_view', 'sales_view', 'sys_audit'],
    sales: ['sales_create', 'sales_view', 'inv_view'],
    viewer: ['fin_view', 'inv_view', 'sales_view'],
  },
  customRoles: [],
  database: {
    googleDriveClientId: '',
    isGoogleDriveConnected: false,
    autoBackupIntervalHours: 24,
  },
};

export const ALL_PERMISSIONS_LIST = [
  {
    id: 'fin_create',
    name: 'إضافة قيود وسندات مالية',
    category: 'الحسابات والمالية',
    description: 'إنشاء سندات قبض وصرف وقيود يومية',
  },
  {
    id: 'fin_edit',
    name: 'تعديل القيود والحسابات',
    category: 'الحسابات والمالية',
    description: 'تعديل المعاملات المالية المعتمدة',
  },
  {
    id: 'fin_delete',
    name: 'حذف السجلات المالية',
    category: 'الحسابات والمالية',
    description: 'إمكانية إلغاء وحذف القيود والسندات',
  },
  {
    id: 'fin_view',
    name: 'عرض السجلات وكشوفات الحساب',
    category: 'الحسابات والمالية',
    description: 'الاطلاع على الحركات والأرصدة',
  },
  {
    id: 'fin_reports',
    name: 'تصدير التقارير والقوائم الختامية',
    category: 'الحسابات والمالية',
    description: 'استعراض ميزان المراجعة والأرباح والخسائر',
  },

  {
    id: 'inv_create',
    name: 'إضافة منتجات وأصناف جديدة',
    category: 'المخزون والمستودعات',
    description: 'تسجيل أصناف وتحديد أسعارها',
  },
  {
    id: 'inv_edit',
    name: 'تعديل بيانات الأصناف والمخازن',
    category: 'المخزون والمستودعات',
    description: 'تعديل الأسماء والكميات والوحدات',
  },
  {
    id: 'inv_delete',
    name: 'حذف أصناف من المستودع',
    category: 'المخزون والمستودعات',
    description: 'حذف سجلات الأصناف نهائياً',
  },
  {
    id: 'inv_view',
    name: 'عرض المخزون وحركات التوريد والصرف',
    category: 'المخزون والمستودعات',
    description: 'متابعة أرصدة الأصناف',
  },
  {
    id: 'inv_adjust',
    name: 'إجراء تسويات وجرد مخزني',
    category: 'المخزون والمستودعات',
    description: 'تعديل فروقات الجرد والفاقد',
  },

  {
    id: 'sales_create',
    name: 'إنشاء فواتير المبيعات وعروض الأسعار',
    category: 'الفواتير والمبيعات',
    description: 'إصدار فواتير نقدية وآجلة',
  },
  {
    id: 'sales_edit',
    name: 'تعديل الفواتير الصادرة',
    category: 'الفواتير والمبيعات',
    description: 'تعديل الكميات والأسعار في الفاتورة',
  },
  {
    id: 'sales_delete',
    name: 'إلغاء وحذف الفواتير',
    category: 'الفواتير والمبيعات',
    description: 'إلغاء فواتير المبيعات المعتمدة',
  },
  {
    id: 'sales_discount',
    name: 'منح خصومات إضافية',
    category: 'الفواتير والمبيعات',
    description: 'تطبيق نسب خصم خاصة للعملاء',
  },
  {
    id: 'sales_view',
    name: 'استعراض سجل الفواتير والمقبوضات',
    category: 'الفواتير والمبيعات',
    description: 'الاطلاع على مبيعات الفروع',
  },

  {
    id: 'sys_settings',
    name: 'تعديل إعدادات النظام وبيانات الشركة',
    category: 'الإعدادات والنظام',
    description: 'التحكم في العملات والطابعات والشعار',
  },
  {
    id: 'sys_backup',
    name: 'النسخ الاحتياطي واستعادة البيانات',
    category: 'الإعدادات والنظام',
    description: 'تصدير واستيراد قواعد البيانات',
  },
  {
    id: 'sys_users',
    name: 'إدارة المستخدمين والصلاحيات',
    category: 'الإعدادات والنظام',
    description: 'إنشاء وتعديل حسابات المستخدمين',
  },
  {
    id: 'sys_audit',
    name: 'مراجعة سجلات التدقيق والمراقبة',
    category: 'الإعدادات والنظام',
    description: 'متابعة نشاط المستخدمين على النظام',
  },
] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** لا تعُد المرجع الافتراضي نفسه: `updateCurrentUserName` يعدّل الكائن في مكانه. */
const cloneDefaultSettings = (): CompleteSystemSettings => JSON.parse(JSON.stringify(DEFAULT_SYSTEM_SETTINGS));

const sectionOrEmpty = (value: unknown): Record<string, unknown> => (isRecord(value) ? value : {});

const isSystemUser = (value: unknown): value is SystemUser =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  typeof value.name === 'string' &&
  typeof value.email === 'string' &&
  typeof value.role === 'string' &&
  (value.status === 'active' || value.status === 'inactive') &&
  typeof value.createdAt === 'string';

const isCustomRole = (value: unknown): value is CustomRole =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  typeof value.label === 'string' &&
  Array.isArray(value.permissions) &&
  value.permissions.every((permission) => typeof permission === 'string') &&
  typeof value.createdAt === 'string';

const normalizeRolePermissions = (value: unknown, defaults: Record<string, string[]>): Record<string, string[]> => {
  if (!isRecord(value)) return { ...defaults };
  return {
    ...defaults,
    ...Object.fromEntries(
      Object.entries(value)
        .filter(
          ([, permissions]) =>
            Array.isArray(permissions) && permissions.every((permission) => typeof permission === 'string')
        )
        .map(([role, permissions]) => [role, [...(permissions as string[])]])
    ),
  };
};

export function loadCompleteSystemSettings(): CompleteSystemSettings {
  const defaults = cloneDefaultSettings();
  try {
    const parsed = settingsRepo.read() as Partial<CompleteSystemSettings> & Record<string, unknown>;
    if (Object.keys(parsed).length === 0) return defaults;

    const company = { ...defaults.company, ...sectionOrEmpty(parsed.company) };
    // If company still has default placeholder from old version, update to new name
    if (typeof company.nameAr !== 'string' || !company.nameAr || company.nameAr === 'شركة قيمة للتجارة والتوكيلات') {
      company.nameAr = defaults.company.nameAr;
    }

    const general = { ...defaults.general, ...sectionOrEmpty(parsed.general) };
    if (
      typeof general.currentUserName !== 'string' ||
      general.currentUserName.trim() === '' ||
      general.currentUserName === 'مدير النظام'
    ) {
      general.currentUserName = defaults.general.currentUserName;
    }
    if (
      typeof general.currentUserTitle !== 'string' ||
      general.currentUserTitle.trim() === '' ||
      general.currentUserTitle === 'مدير عام المنظومة والعمليات'
    ) {
      general.currentUserTitle = defaults.general.currentUserTitle;
    }

    const inventory = sectionOrEmpty(parsed.inventory);
    const users = Array.isArray(parsed.users)
      ? parsed.users.filter(isSystemUser).map((user) => ({ ...user }))
      : defaults.users;
    // If the primary admin user exists, sync their name
    if (
      users.length > 0 &&
      users[0].id === 'usr-1' &&
      (users[0].name === 'أنور قاسم' || users[0].name === 'مدير النظام' || !users[0].name)
    ) {
      users[0].name = general.currentUserName;
      users[0].avatarInitial = 'م';
    }

    const normalized: CompleteSystemSettings = {
      company,
      general,
      inventory: {
        warehouses: Array.isArray(inventory.warehouses) ? inventory.warehouses : defaults.inventory.warehouses,
        productCategories: Array.isArray(inventory.productCategories)
          ? inventory.productCategories.filter((category): category is string => typeof category === 'string')
          : defaults.inventory.productCategories,
        units: Array.isArray(inventory.units)
          ? inventory.units.filter((unit): unit is string => typeof unit === 'string')
          : defaults.inventory.units,
        reorderPointDefault:
          typeof inventory.reorderPointDefault === 'number'
            ? inventory.reorderPointDefault
            : defaults.inventory.reorderPointDefault,
      },
      fiscalYear: { ...defaults.fiscalYear, ...sectionOrEmpty(parsed.fiscalYear) },
      notifications: { ...defaults.notifications, ...sectionOrEmpty(parsed.notifications) },
      printer: {
        ...defaults.printer,
        ...sectionOrEmpty(parsed.printer),
        margins: { ...defaults.printer.margins, ...sectionOrEmpty(sectionOrEmpty(parsed.printer).margins) },
      },
      users,
      rolePermissions: normalizeRolePermissions(parsed.rolePermissions, defaults.rolePermissions),
      customRoles: Array.isArray(parsed.customRoles) ? parsed.customRoles.filter(isCustomRole) : [],
      database: { ...defaults.database, ...sectionOrEmpty(parsed.database) },
    };

    // ننقل الإرث إلى المفتاح الموحّد مرة واحدة فقط. وجود المفتاح الجديد (حتى إن كان
    // فارغاً/تالفاً) قرارٌ صريح ولا يجوز أن يُستبدل ببيانات قديمة.
    if (!settingsRepo.hasCurrent()) {
      settingsRepo.write(normalized as unknown as Record<string, unknown>);
    }
    return normalized;
  } catch (err) {
    console.error('Error loading complete system settings:', err);
  }
  return defaults;
}

export function saveCompleteSystemSettings(settings: CompleteSystemSettings): void {
  settingsRepo.write(settings as unknown as Record<string, unknown>);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SETTINGS_UPDATED_EVENT, { detail: settings }));
  }
}

export function getCurrentUserProfile(): { name: string; title: string; initial: string } {
  const settings = loadCompleteSystemSettings();
  const name = settings.general.currentUserName;
  // `loadCompleteSystemSettings` يملأ اللقب الافتراضي دائماً رغم كونه اختيارياً في نوع الإدخال القديم.
  const title = settings.general.currentUserTitle!;
  return { name, title, initial: name.charAt(0) };
}

export function updateCurrentUserName(newName: string, newTitle?: string): void {
  const settings = loadCompleteSystemSettings();
  settings.general.currentUserName = newName.trim() || 'محمد العولقي';
  if (newTitle !== undefined) {
    settings.general.currentUserTitle = newTitle.trim();
  }
  const admin = settings.users.find((u) => u.role === 'admin' || u.id === 'usr-1');
  if (admin) {
    admin.name = settings.general.currentUserName;
    admin.avatarInitial = settings.general.currentUserName.charAt(0);
  }
  saveCompleteSystemSettings(settings);
}
