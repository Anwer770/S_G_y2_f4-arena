// ============================================================================
// SETTINGS & SYSTEM CONFIGURATION TYPES (نظام قيمة المحاسبي)
// ============================================================================

export interface CompanySettings {
  nameAr: string;
  nameEn: string;
  phone: string;
  email: string;
  crNumber: string;
  taxNumber: string;
  website: string;
  address: string;
  logoUrl?: string;
}

export interface GeneralSettings {
  baseCurrency: string;
  timezone: string;
  calendarType: 'miladi' | 'hijri';
  theme: 'light' | 'dark';
  salesInvoicePrefix: string;
  purchaseInvoicePrefix: string;
  currentUserName: string;
  currentUserTitle?: string;
}

export interface WarehouseItem {
  id: string;
  name: string;
  isDefault: boolean;
  code?: string;
  location?: string;
}

export interface InventorySettings {
  warehouses: WarehouseItem[];
  productCategories: string[];
  units: string[];
  /** حدّ الطلب الافتراضي لكل صنف لا يحدّد حدّاً خاصاً (محرك التنبيهات) */
  reorderPointDefault: number;
}

export interface FiscalYearSettings {
  currentYear: number;
  startDate: string;
  endDate: string;
  status: 'open' | 'closed';
  allowBackdatedEntries: boolean;
}

export interface NotificationSettings {
  stockAlertsEnabled: boolean;
  stockAlertThreshold: number;
  invoiceDueAlertsEnabled: boolean;
  invoiceDueDaysNotice: number;
  dailySummaryEnabled: boolean;
  soundAlertsEnabled: boolean;
  balanceMismatchAlertEnabled: boolean;
  treasuryLowAlertEnabled: boolean;
  treasuryLowThreshold: number;
}

export interface PrinterSettings {
  paperSize: 'A4' | 'A5' | 'thermal80' | 'thermal58';
  orientation: 'portrait' | 'landscape';
  margins: {
    top: number;
    bottom: number;
    right: number;
    left: number;
  };
  showCompanyLogo: boolean;
  showCompanyInfo: boolean;
  showFooter: boolean;
  footerText: string;
  fontSize: 'small' | 'medium' | 'large';
  colorMode: 'color' | 'bw' | 'grayscale';
  headerColor: string;
  showTableBorders: boolean;
  showGridLines: boolean;
  autoPrint: boolean;
}

export type UserRole = 'admin' | 'accountant' | 'sales' | 'viewer';

/** دور مخصّص يُنشأ من الإعدادات بصلاحيات حرّة (R20) */
export interface CustomRole {
  id: string;
  label: string;
  description?: string;
  permissions: string[];
  createdAt: string;
}

/** مُعرّف دور مفتوح: مدمج أو مخصّص */
export type RoleId = string;

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: RoleId;
  status: 'active' | 'inactive';
  avatarInitial?: string;
  /** ملخّص PBKDF2-SHA256 لرمز المرور (base64) — لا يُخزَّن الرمز نصاً صريحاً (P2) */
  pinHash?: string;
  /** ملح الاشتقاق العشوائي (base64) */
  pinSalt?: string;
  /** عدد دورات PBKDF2 المستخدمة في هذا الملخّص */
  pinIterations?: number;
  /** سرّ نصي قديم — يُقبل مرة واحدة ثم يُرقّى إلى ملخّص ويُحذف */
  pin?: string;
  /** كلمة مرور قديمة نصية — تُرقّى مثل `pin` ثم تُحذف */
  password?: string;
  lastLogin?: string;
  createdAt: string;
}

export interface RoleDefinition {
  id: UserRole;
  title: string;
  badgeColor: string;
  badgeBg: string;
  description: string;
  permissionsCount: number;
  permissions: string[];
}

export interface PermissionItem {
  id: string;
  name: string;
  category: 'الحسابات والمالية' | 'المخزون والمستودعات' | 'الفواتير والمبيعات' | 'الإعدادات والنظام';
  description: string;
}

export interface DatabaseConfig {
  googleDriveClientId: string;
  isGoogleDriveConnected: boolean;
  autoBackupIntervalHours: number;
}

export interface CompleteSystemSettings {
  company: CompanySettings;
  general: GeneralSettings;
  inventory: InventorySettings;
  fiscalYear: FiscalYearSettings;
  notifications: NotificationSettings;
  printer: PrinterSettings;
  users: SystemUser[];
  rolePermissions: Record<string, string[]>;
  /** أدوار مخصّصة بصلاحيات حرّة */
  customRoles: CustomRole[];
  database: DatabaseConfig;
}
