/**
 * مفاتيح التخزين — المصدر الوحيد (R24).
 * أي إعادة تسمية هنا تُفقد بيانات المستخدمين، لذا تحرسها بوابة storage-keys.
 */
export const STORAGE_KEYS = {
  // Stock
  STOCK_PRODUCTS: 'suite_stock_products_v2',
  STOCK_RECORDS: 'suite_stock_records_v2',
  STOCK_CATEGORIES: 'suite_stock_categories_v2',
  STOCK_STATUSES: 'suite_stock_statuses_v2',
  STOCK_SEQ: 'suite_stock_seq_v2',

  // Financial (دفتر السجل المالي اليومي)
  FIN_TRANSACTIONS: 'suite_fin_transactions_v2',
  FIN_MOVEMENTS: 'suite_fin_movements_v2',
  FIN_RESTRICTIONS: 'suite_fin_restrictions_v2',
  FIN_MOVEMENT_TYPES: 'suite_fin_movement_types_v2',
  FIN_IMPORTANCE: 'suite_fin_importance_v2',
  FIN_CATEGORY_ACCOUNTS: 'suite_fin_category_accounts_v2',
  FIN_RESTRICTION_ACCOUNTS: 'suite_fin_restriction_accounts_v2',
  FIN_ACCOUNT_NAMES: 'suite_fin_account_names_v2',

  // Custody & Issues (دفتر العهد والاشكاليات المعلقة v1.0)
  CUSTODY_RECORDS: 'suite_custody_records_v1',
  CUSTODY_CATEGORIES: 'suite_custody_categories_v1',
  CUSTODY_RESPONSIBLES: 'suite_custody_responsibles_v1',
  CUSTODY_STATUSES: 'suite_custody_statuses_v1',
  CUSTODY_PRIORITIES: 'suite_custody_priorities_v1',
  CUSTODY_AUDIT: 'suite_custody_audit_v1',

  // Tasks & Commitments (دفتر المها v2.0)
  TASKS_ITEMS: 'suite_tasks_items_v2',
  TASKS_COMMITMENTS: 'suite_tasks_commitments_v2',
  TASKS_CATEGORIES: 'suite_tasks_categories_v2',
  TASKS_OPERATIONS: 'suite_tasks_operations_v2',
  TASKS_ASSIGNEES: 'suite_tasks_assignees_v2',
  TASKS_AUDIT: 'suite_tasks_audit_v2',

  // Customers & Visits (دفتر إدارة العملاء والزيارات - القيصر الذهبي)
  CUSTOMERS_ITEMS: 'suite_customers_items_v2',
  CUSTOMERS_VISITS: 'suite_customers_visits_v2',
  CUSTOMERS_SOURCES: 'suite_customers_sources_v2',
  CUSTOMERS_REGIONS: 'suite_customers_regions_v2',
  CUSTOMERS_ROUTES: 'suite_customers_routes_v2',
  CUSTOMERS_RESPONSIBLES: 'suite_customers_responsibles_v2',
  CUSTOMERS_AUDIT: 'suite_customers_audit_v2',

  // Doctors & Medical Visits (دفتر إدارة زيارات الأطباء)
  DOCTORS_ITEMS: 'suite_doctors_items_v1',
  DOCTORS_VISITS: 'suite_doctors_visits_v1',
  DOCTORS_REGIONS: 'suite_doctors_regions_v1',
  DOCTORS_ROUTES: 'suite_doctors_routes_v1',
  DOCTORS_RESPONSIBLES: 'suite_doctors_responsibles_v1',
  DOCTORS_SPECIALTIES: 'suite_doctors_specialties_v1',
  DOCTORS_AUDIT: 'suite_doctors_audit_v1',

  // Debts & Commitments Ledger (دفتر الدين والالتزامات)
  DEBTS_RECORDS: 'suite_debts_records_v1',
  DEBTS_COMMITMENTS: 'suite_debts_commitments_v1',
  DEBTS_CATEGORIES: 'suite_debts_categories_v1',
  DEBTS_OWNERS: 'suite_debts_owners_v1',
  DEBTS_AUDIT: 'suite_debts_audit_v1',

  // Notes & Knowledge Management (إدارة الملاحظات والمعرفة - NKM v1.0)
  KNOWLEDGE_NOTES: 'suite_knowledge_notes_v1',
  KNOWLEDGE_FOLDERS: 'suite_knowledge_folders_v1',
  KNOWLEDGE_TAGS: 'suite_knowledge_tags_v1',
  KNOWLEDGE_TEMPLATES: 'suite_knowledge_templates_v1',
  KNOWLEDGE_AUDIT: 'suite_knowledge_audit_v1',

  // Routines & Habit Management (وحدة إدارة الروتين والعادات v1.0)
  ROUTINES_ITEMS: 'suite_routines_items_v1',
  ROUTINES_OCCURRENCES: 'suite_routines_occurrences_v1',
  ROUTINES_EXECUTIONS: 'suite_routines_executions_v1',
  ROUTINES_CATEGORIES: 'suite_routines_categories_v1',
  ROUTINES_TAGS: 'suite_routines_tags_v1',
  ROUTINES_TEMPLATES: 'suite_routines_templates_v1',
  ROUTINES_EXCEPTIONS: 'suite_routines_exceptions_v1',
  ROUTINES_AUDIT: 'suite_routines_audit_v1',
  ROUTINES_SETTINGS: 'suite_routines_settings_v1',

  // Smart Links Library (مكتبة الروابط الذكية v1.0)
  LINKS_RECORDS: 'suite_links_records_v1',
  LINKS_CLASSIFICATIONS: 'suite_links_classifications_v1',
  LINKS_CATEGORIES: 'suite_links_categories_v1',
  LINKS_TYPES: 'suite_links_types_v1',
  LINKS_IMPORTANCES: 'suite_links_importances_v1',

  // المصادقة (لا تُعاد تسمية هذين المفتاحين: تغييرهما يُسقط الجلسات وحمايات المحاولات)
  AUTH_SESSION: 'suite_active_auth_session_v1',
  AUTH_GUARD: 'suite_auth_guard_v1',

  // System Unified
  /** إعدادات النظام الكاملة؛ لا تشاركها إعدادات المخزون القديمة بعد R76. */
  SETTINGS: 'suite_unified_settings_v2',
  /** إعدادات التطبيق/المخزون القديمة، فُصلت عن إعدادات النظام الكاملة في R76. */
  APP_SETTINGS: 'suite_app_settings_v1',
  /**
   * R51: سجل النظام كان يشارك المفتاح `suite_unified_audit_v2` مع السجل المركزي
   * (`CentralAuditService`) وهذا الملف — وبشكلين مختلفين للبيانات. كل كتابة في أحدهما
   * كانت تمحو أو تُشوّه الآخر. المفتاح صار مستقلاً، والقديم يُقرأ كـ`legacy` فقط.
   */
  SYSTEM_AUDIT_LOGS: 'suite_system_audit_v2',
  /** مفتاح قديم (مشترك بين سجلَّين) — قراءة فقط للترحيل التدريجي. */
  SYSTEM_AUDIT: 'suite_unified_audit_v2',
  UNIFIED_BACKUP: 'suite_unified_autobackup_v2',
};

/** قائمة مسطّحة بكل المفاتيح — تستخدمها بوابة الحماية */
export const STORAGE_KEY_MANIFEST: string[] = Object.values(STORAGE_KEYS);
