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

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: 'active' | 'inactive';
  avatarInitial?: string;
  pin?: string;
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
  rolePermissions: Record<UserRole, string[]>;
  database: DatabaseConfig;
}
