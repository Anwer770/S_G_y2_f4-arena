import * as XLSX from 'xlsx';
import {
  DebtBookId,
  DebtCommitment,
  DebtCommitmentPayment,
  DebtRecord,
} from '../types';

// ============================================================================
// DEFAULT CATEGORIES & RESPONSIBLES & SYMBOLS
// ============================================================================
export const DEBT_CATEGORIES = [
  'أعمال الالتزامات',
  'ديون شخصية',
  'إيجار ومصاريف سكن',
  'فواتير وخدمات',
  'مشتريات وبضائع',
  'عهدة وتحصيل',
  'أقساط ومستحقات',
  'حسابات تجارية',
  'أخرى',
];

export const DEBT_OWNERS = [
  'أنور',
  'زها',
  'علي القات',
  'أحمد',
  'صدام',
  'عمار',
  'عبدالرحمن',
  'الأكحلي',
  'جمال',
  'محمد',
  'المؤسسة',
];

export const DEBT_ICONS = [
  { symbol: '★', name: 'وضع خاص (Special Condition)', color: 'text-amber-500 bg-amber-50' },
  { symbol: '⚐', name: 'يحتاج تأكيد (Need to Confirm)', color: 'text-blue-500 bg-blue-50' },
  { symbol: '⚑', name: 'مؤكد (Confirmed)', color: 'text-emerald-500 bg-emerald-50' },
  { symbol: '✔', name: 'مكتمل / منجز (Completed)', color: 'text-slate-500 bg-slate-100' },
  { symbol: '✖', name: 'لم يظهر (No Show)', color: 'text-rose-500 bg-rose-50' },
  { symbol: '⏸', name: 'استراحة / خارج المكتب (Break)', color: 'text-purple-500 bg-purple-50' },
];

export const DEBT_BOOKS_META: Record<
  DebtBookId,
  { title: string; subtitle: string; description: string; badge: string; color: string }
> = {
  anwar: {
    title: 'دفتر دين أنور',
    subtitle: 'سجل المديونيات والمسحوبات الخاصة',
    description: 'توثيق مسحوبات ومديونيات أنور والالتزامات المترتبة',
    badge: 'دين أنور',
    color: 'amber',
  },
  previous: {
    title: 'حساب دين سابق',
    subtitle: 'الديون والمستحقات السابقة ومتعددة العملات',
    description: 'تسوية القيود والديون السابقة بالريال اليمني والسعودي',
    badge: 'دين سابق',
    color: 'indigo',
  },
  zaha: {
    title: 'دين أنور – زها',
    subtitle: 'الحسابات المشتركة والالتزامات المتبادلة',
    description: 'توثيق المديونيات المشتركة بالريال اليمني والدولار الأمريكي',
    badge: 'أنور-زها',
    color: 'purple',
  },
  ali_qat: {
    title: 'حساب علي القات',
    subtitle: 'الدفتر اليومي والرصيد التراكمي (له / عليه)',
    description: 'تسجيل الحركات اليومية مع الرصيد التراكمي المستمر',
    badge: 'علي القات',
    color: 'emerald',
  },
};

// ============================================================================
// INITIAL SEED DATA (EXCEL JARD APPENDIX)
// ============================================================================

// 1. دين أنور (26 records)
export const DEFAULT_ANWAR_DEBTS: DebtRecord[] = [
  { id: 'ANW-001', book: 'anwar', date: '2024-01-05', icon: '⚑', name: 'سداد دفعة حساب محروقات ومواصلات', currency: 'YER', debit: 25000, credit: 0, note: 'مسحوبات نقدية للعمل الميداني', isCompleted: false },
  { id: 'ANW-002', book: 'anwar', date: '2024-01-12', icon: '★', name: 'شراء قطع غيار وصيانة دورية', currency: 'YER', debit: 38000, credit: 0, note: 'سند صرف ورشة الصيانة', isCompleted: false },
  { id: 'ANW-003', book: 'anwar', date: '2024-01-20', icon: '✔', name: 'دفعة حساب شخصي مؤقت', currency: 'YER', debit: 50000, credit: 0, note: 'تمت التسوية لاحقاً', isCompleted: true },
  { id: 'ANW-004', book: 'anwar', date: '2024-02-02', icon: '⚑', name: 'سداد فواتير اتصالات وإنترنت', currency: 'YER', debit: 18500, credit: 0, note: 'فواتير المكتب والعمل', isCompleted: false },
  { id: 'ANW-005', book: 'anwar', date: '2024-02-14', icon: '⚐', name: 'مسحوبات مصاريف تسويق وزيارات', currency: 'YER', debit: 42000, credit: 0, note: 'مراجعة سندات الصرف', isCompleted: false },
  { id: 'ANW-006', book: 'anwar', date: '2024-02-28', icon: '⚑', name: 'مستلزمات مكتبية ومطبوعات', currency: 'YER', debit: 15000, credit: 0, note: 'مطبوعات فواتير وسندات', isCompleted: false },
  { id: 'ANW-007', book: 'anwar', date: '2024-03-08', icon: '★', name: 'دفعة سداد حساب التزام قديم', currency: 'YER', debit: 60000, credit: 0, note: 'مرتبط بحساب سابق', isCompleted: false },
  { id: 'ANW-008', book: 'anwar', date: '2024-03-19', icon: '✔', name: 'مشتريات عينات وضيافة للعملاء', currency: 'YER', debit: 22000, credit: 0, note: 'منجز ومقيد', isCompleted: true },
  { id: 'ANW-009', book: 'anwar', date: '2024-04-01', icon: '⚑', name: 'إيجار المخزن الفرعي - شهر 4', currency: 'YER', debit: 80000, credit: 0, note: 'إيصال استلام من المؤجر', isCompleted: false },
  { id: 'ANW-010', book: 'anwar', date: '2024-04-15', icon: '⚐', name: 'حساب توريد مواد تغليف', currency: 'YER', debit: 35000, credit: 0, note: 'بانتظار الفاتورة الضريبية', isCompleted: false },
  { id: 'ANW-011', book: 'anwar', date: '2024-04-29', icon: '⚑', name: 'مسحوبات نقدية عهدة عمار', currency: 'YER', debit: 30000, credit: 0, note: 'عهدة تسليم بضاعة', isCompleted: false },
  { id: 'ANW-012', book: 'anwar', date: '2024-05-10', icon: '★', name: 'سداد التزام قطع غيار أجهزة', currency: 'YER', debit: 48000, credit: 0, note: 'شراء بطاريات ومحولات', isCompleted: false },
  { id: 'ANW-013', book: 'anwar', date: '2024-05-22', icon: '✔', name: 'حساب ضيافة واجتماعات المندوبين', currency: 'YER', debit: 16000, credit: 0, note: 'تم السداد', isCompleted: true },
  { id: 'ANW-014', book: 'anwar', date: '2024-06-04', icon: '⚑', name: 'سداد جزء من حساب الكهرباء والطاقة', currency: 'YER', debit: 28000, credit: 0, note: 'اشتراك طاقة شمسية ومولد', isCompleted: false },
  { id: 'ANW-015', book: 'anwar', date: '2024-06-18', icon: '⚐', name: 'سلفة مؤقتة تسليم بضاعة للحديدة', currency: 'YER', debit: 45000, credit: 0, note: 'أجور نقل وشحن', isCompleted: false },
  { id: 'ANW-016', book: 'anwar', date: '2024-07-02', icon: '⚑', name: 'إيجار المخزن الفرعي - شهر 7', currency: 'YER', debit: 80000, credit: 0, note: 'إيصال المؤجر', isCompleted: false },
  { id: 'ANW-017', book: 'anwar', date: '2024-07-16', icon: '★', name: 'مسحوبات نقدية مصاريف معيشية', currency: 'YER', debit: 55000, credit: 0, note: 'قيد شخصي', isCompleted: false },
  { id: 'ANW-018', book: 'anwar', date: '2024-08-01', icon: '✔', name: 'شراء كراتين وأشرطة لاصقة', currency: 'YER', debit: 14000, credit: 0, note: 'مكتمل', isCompleted: true },
  { id: 'ANW-019', book: 'anwar', date: '2024-08-14', icon: '⚑', name: 'صيانة سيارة التوزيع (طقم كفرات)', currency: 'YER', debit: 95000, credit: 0, note: 'فاتورة البنشر', isCompleted: false },
  { id: 'ANW-020', book: 'anwar', date: '2024-08-25', icon: '⚐', name: 'سداد دفعة من حساب التزامات سابقة', currency: 'YER', debit: 65000, credit: 0, note: 'قيد قيد المراجعة', isCompleted: false },
  { id: 'ANW-021', book: 'anwar', date: '2024-09-05', icon: '⚑', name: 'أجور عمال تنزيل وشحن البضاعة', currency: 'YER', debit: 22000, credit: 0, note: 'عمالة يدوية', isCompleted: false },
  { id: 'ANW-022', book: 'anwar', date: '2024-09-18', icon: '★', name: 'مسحوبات نقدية متنوعة', currency: 'YER', debit: 34000, credit: 0, note: 'تحت الحساب', isCompleted: false },
  { id: 'ANW-023', book: 'anwar', date: '2024-10-02', icon: '⚑', name: 'إيجار المخزن الفرعي - شهر 10', currency: 'YER', debit: 80000, credit: 0, note: 'دفعة المخزن', isCompleted: false },
  { id: 'ANW-024', book: 'anwar', date: '2024-10-15', icon: '✔', name: 'سداد فاتورة الماء والنظافة', currency: 'YER', debit: 12000, credit: 0, note: 'مسدد بالكامل', isCompleted: true },
  { id: 'ANW-025', book: 'anwar', date: '2024-11-01', icon: '⚑', name: 'شراء ملصقات وتغليف برايمو', currency: 'YER', debit: 46000, credit: 0, note: 'مطبعة التميز', isCompleted: false },
  { id: 'ANW-026', book: 'anwar', date: '2024-11-20', icon: '⚐', name: 'حساب مصاريف سفر تعز وإب', currency: 'YER', debit: 52000, credit: 0, note: 'جولة ترويجية', isCompleted: false },
];

// 2. حساب دين سابق (19 records, includes SAR)
export const DEFAULT_PREVIOUS_DEBTS: DebtRecord[] = [
  { id: 'PRV-001', book: 'previous', date: '2023-10-10', icon: '⚑', name: 'رصيد سابق مرحل - حساب بضاعة تجارية', currency: 'YER', debit: 240000, credit: 0, note: 'مرحل من الدفتر القديم', isCompleted: false },
  { id: 'PRV-002', book: 'previous', date: '2023-11-05', icon: '✔', name: 'سداد دفعة عبر الكريمي للمورد', currency: 'YER', debit: 0, credit: 150000, note: 'حوالة مؤكدة', isCompleted: true },
  { id: 'PRV-003', book: 'previous', date: '2023-11-20', icon: '★', name: 'حساب توريد كراتين تجميل من جدة', currency: 'SAR', debit: 1850, credit: 0, note: 'شحنة سعودية خاصة', isCompleted: false },
  { id: 'PRV-004', book: 'previous', date: '2023-12-01', icon: '⚑', name: 'دفعة حساب سابق مورد زيوت عطرية', currency: 'YER', debit: 120000, credit: 0, note: 'مستحق سداد', isCompleted: false },
  { id: 'PRV-005', book: 'previous', date: '2023-12-15', icon: '✔', name: 'تحصيل جزء من مديونية سابقة', currency: 'YER', debit: 0, credit: 80000, note: 'تم التوريد للصندوق', isCompleted: true },
  { id: 'PRV-006', book: 'previous', date: '2024-01-08', icon: '⚑', name: 'سداد دفعة بالريال السعودي للمكتب الخارجي', currency: 'SAR', debit: 0, credit: 1000, note: 'سداد عبر صراف الرياض', isCompleted: false },
  { id: 'PRV-007', book: 'previous', date: '2024-01-25', icon: '⚐', name: 'حساب صيانة مكائن تغليف سابقة', currency: 'YER', debit: 45000, credit: 0, note: 'بانتظار إشعار المهندس', isCompleted: false },
  { id: 'PRV-008', book: 'previous', date: '2024-02-10', icon: '★', name: 'التزام مواد خام مستوردة عبر عدن', currency: 'SAR', debit: 2400, credit: 0, note: 'رسوم تخليص ومشتريات', isCompleted: false },
  { id: 'PRV-009', book: 'previous', date: '2024-02-22', icon: '✔', name: 'سداد دفعة سابقة لحساب أحمد المالي', currency: 'YER', debit: 0, credit: 60000, note: 'مقاصة حسابات', isCompleted: true },
  { id: 'PRV-010', book: 'previous', date: '2024-03-05', icon: '⚑', name: 'قيد تسوية فروقات شحن سابقة', currency: 'YER', debit: 32000, credit: 0, note: 'شاحنة النقل الداخلي', isCompleted: false },
  { id: 'PRV-011', book: 'previous', date: '2024-03-20', icon: '⚐', name: 'سداد عهدة مصاريف جمركية سابقة', currency: 'SAR', debit: 0, credit: 800, note: 'سداد بالريال السعودي', isCompleted: false },
  { id: 'PRV-012', book: 'previous', date: '2024-04-12', icon: '★', name: 'حساب التزام قديم مورد عبوات زجاجية', currency: 'YER', debit: 180000, credit: 0, note: 'مستحق من العام الماضي', isCompleted: false },
  { id: 'PRV-013', book: 'previous', date: '2024-05-01', icon: '✔', name: 'دفعة سداد مقبوضة من الموزع', currency: 'YER', debit: 0, credit: 100000, note: 'سند استلام', isCompleted: true },
  { id: 'PRV-014', book: 'previous', date: '2024-05-18', icon: '⚑', name: 'متبقي حساب أجهزة فحص ومختبر', currency: 'SAR', debit: 1200, credit: 0, note: 'معدات فحص العينات', isCompleted: false },
  { id: 'PRV-015', book: 'previous', date: '2024-06-08', icon: '⚐', name: 'حساب شحن بضائع قديمة من دبي', currency: 'YER', debit: 95000, credit: 0, note: 'مكتب الشحن السريع', isCompleted: false },
  { id: 'PRV-016', book: 'previous', date: '2024-06-25', icon: '✔', name: 'دفعة إغلاق حساب مورد الأكياس', currency: 'YER', debit: 0, credit: 50000, note: 'إغلاق الحساب', isCompleted: true },
  { id: 'PRV-017', book: 'previous', date: '2024-07-10', icon: '★', name: 'حساب سابق رسوم استشارات وتراخيص', currency: 'YER', debit: 75000, credit: 0, note: 'مكتب التراخيص', isCompleted: false },
  { id: 'PRV-018', book: 'previous', date: '2024-08-05', icon: '⚑', name: 'متبقي حساب توريد ورق طباعة فاخر', currency: 'SAR', debit: 650, credit: 0, note: 'مطابع الهلال', isCompleted: false },
  { id: 'PRV-019', book: 'previous', date: '2024-08-20', icon: '✔', name: 'تسوية حساب نقل مع الأكحلي', currency: 'YER', debit: 0, credit: 35000, note: 'مقاصة نهائية', isCompleted: true },
];

// 3. دين أنور - زها (12 records, includes USD, Total Debit 386,500)
export const DEFAULT_ZAHA_DEBTS: DebtRecord[] = [
  { id: 'ZHA-001', book: 'zaha', date: '2024-02-01', icon: '⚑', name: 'شراء بضاعة ومستحضرات تجميل لزها', currency: 'YER', debit: 65000, credit: 0, note: 'منتجات برايمو كوزمتكس', isCompleted: false },
  { id: 'ZHA-002', book: 'zaha', date: '2024-02-18', icon: '★', name: 'مبلغ 150$ من زها لمصاريف الشحن', currency: 'USD', debit: 150, credit: 0, note: 'مبلغ 150$ يعادل حوالي 160,000 ريال يمني', isCompleted: false },
  { id: 'ZHA-003', book: 'zaha', date: '2024-03-05', icon: '✔', name: 'سداد دفعة نقدية لحساب زها', currency: 'YER', debit: 0, credit: 40000, note: 'سند تسليم نقدي', isCompleted: true },
  { id: 'ZHA-004', book: 'zaha', date: '2024-03-22', icon: '⚑', name: 'توريد عبوات وشامبوهات حصرية', currency: 'YER', debit: 55000, credit: 0, note: 'فاتورة تسليم رقم 104', isCompleted: false },
  { id: 'ZHA-005', book: 'zaha', date: '2024-04-10', icon: '⚐', name: 'مصاريف تسويق وإعلانات سوشيال ميديا', currency: 'YER', debit: 32000, credit: 0, note: 'حملة إعلانية مشتركة', isCompleted: false },
  { id: 'ZHA-006', book: 'zaha', date: '2024-04-28', icon: '★', name: 'دفعة سداد حساب التزام مستحضرات العناية', currency: 'YER', debit: 48000, credit: 0, note: 'تسليم منتجات صيدلانية', isCompleted: false },
  { id: 'ZHA-007', book: 'zaha', date: '2024-05-15', icon: '✔', name: 'سداد دفعة عبر الكريمي مميز', currency: 'YER', debit: 0, credit: 50000, note: 'حوالة رقم 94812', isCompleted: true },
  { id: 'ZHA-008', book: 'zaha', date: '2024-06-01', icon: '⚑', name: 'شراء كراتين وتغليف خاص لزها', currency: 'YER', debit: 28500, credit: 0, note: 'مطبوعات وتغليف هدايا', isCompleted: false },
  { id: 'ZHA-009', book: 'zaha', date: '2024-06-20', icon: '★', name: 'سحب مواد أولية وعطور مركّزة', currency: 'USD', debit: 120, credit: 0, note: 'مستوردة بالدولار', isCompleted: false },
  { id: 'ZHA-010', book: 'zaha', date: '2024-07-08', icon: '⚑', name: 'دفعة استلام طلبيات خاصة لمعرض زها', currency: 'YER', debit: 78000, credit: 0, note: 'منتجات جاهزة للبيع', isCompleted: false },
  { id: 'ZHA-011', book: 'zaha', date: '2024-07-25', icon: '⚐', name: 'مصاريف نقل وتوصيل الطلبيات للعملاء', currency: 'YER', debit: 20000, credit: 0, note: 'مناديب التوصيل', isCompleted: false },
  { id: 'ZHA-012', book: 'zaha', date: '2024-08-10', icon: '✔', name: 'دفعة تصفية جزء من الحساب المشترك', currency: 'YER', debit: 0, credit: 60000, note: 'تسوية حسابية موثقة', isCompleted: true },
];

// 4. حساب علي القات (72 records, running daily ledger)
export const DEFAULT_ALI_QAT_DEBTS: DebtRecord[] = (() => {
  const records: DebtRecord[] = [];
  const entries = [
    // Month 1
    { d: '2024-01-01', name: 'قات جلسة رأس السنة واستقبال المندوبين', deb: 4000, cr: 0, note: 'جلسة عمل' },
    { d: '2024-01-03', name: 'قات يوم الأربعاء', deb: 3500, cr: 0, note: '' },
    { d: '2024-01-05', name: 'قات يوم الجمعة', deb: 5000, cr: 0, note: 'جلسة موسعة' },
    { d: '2024-01-08', name: 'قات يوم الاثنين', deb: 3500, cr: 0, note: '' },
    { d: '2024-01-10', name: 'سداد دفعة نقدية لعلي القات', deb: 0, cr: 15000, note: 'سند صرف نقدي' },
    { d: '2024-01-12', name: 'قات يوم الجمعة وضيافة ضيوف المحافظات', deb: 6000, cr: 0, note: 'ضيوف إب' },
    { d: '2024-01-15', name: 'قات يوم الاثنين', deb: 3000, cr: 0, note: '' },
    { d: '2024-01-18', name: 'قات يوم الخميس', deb: 4000, cr: 0, note: '' },
    { d: '2024-01-20', name: 'سداد دفعة حساب علي القات', deb: 0, cr: 10000, note: 'سداد نقدي' },
    { d: '2024-01-23', name: 'قات يوم الثلاثاء', deb: 3500, cr: 0, note: '' },
    { d: '2024-01-26', name: 'قات يوم الجمعة', deb: 4500, cr: 0, note: '' },
    { d: '2024-01-30', name: 'سداد نهاية الشهر لعلي القات', deb: 0, cr: 12000, note: 'تصفية شهر 1' },
    // Month 2
    { d: '2024-02-02', name: 'قات يوم الجمعة', deb: 5000, cr: 0, note: '' },
    { d: '2024-02-05', name: 'قات يوم الاثنين', deb: 3500, cr: 0, note: '' },
    { d: '2024-02-08', name: 'قات يوم الخميس وجلسة تسعير المنتجات', deb: 4500, cr: 0, note: 'اجتماع تسعير' },
    { d: '2024-02-12', name: 'قات يوم الاثنين', deb: 3500, cr: 0, note: '' },
    { d: '2024-02-15', name: 'سداد دفعة منتصف الشهر', deb: 0, cr: 15000, note: 'حوالة عبر جيب' },
    { d: '2024-02-18', name: 'قات يوم الأحد', deb: 3500, cr: 0, note: '' },
    { d: '2024-02-21', name: 'قات يوم الأربعاء', deb: 4000, cr: 0, note: '' },
    { d: '2024-02-25', name: 'قات يوم الأحد', deb: 3500, cr: 0, note: '' },
    { d: '2024-02-28', name: 'سداد حساب علي القات شهر 2', deb: 0, cr: 14000, note: 'سند نقد' },
    // Month 3
    { d: '2024-03-02', name: 'قات يوم السبت واستقبال بضاعة عدن', deb: 4500, cr: 0, note: '' },
    { d: '2024-03-06', name: 'قات يوم الأربعاء', deb: 3500, cr: 0, note: '' },
    { d: '2024-03-10', name: 'قات يوم الأحد', deb: 3500, cr: 0, note: '' },
    { d: '2024-03-14', name: 'قات يوم الخميس', deb: 4000, cr: 0, note: '' },
    { d: '2024-03-18', name: 'سداد دفعة نقدية لعلي القات', deb: 0, cr: 12000, note: '' },
    { d: '2024-03-22', name: 'قات يوم الجمعة', deb: 5000, cr: 0, note: '' },
    { d: '2024-03-26', name: 'قات يوم الثلاثاء', deb: 3500, cr: 0, note: '' },
    { d: '2024-03-30', name: 'سداد نهاية شهر مارس', deb: 0, cr: 10000, note: '' },
    // Month 4
    { d: '2024-04-03', name: 'قات يوم الأربعاء', deb: 3500, cr: 0, note: '' },
    { d: '2024-04-07', name: 'قات إجازة عيد الفطر المبارك', deb: 7000, cr: 0, note: 'جلسة العيد' },
    { d: '2024-04-10', name: 'قات ثاني أيام العيد وضيافة الأصدقاء', deb: 6000, cr: 0, note: 'العيد' },
    { d: '2024-04-15', name: 'قات يوم الاثنين واستئناف العمل', deb: 3500, cr: 0, note: '' },
    { d: '2024-04-18', name: 'سداد دفعة حساب العيد لعلي القات', deb: 0, cr: 20000, note: 'سداد حساب العيد' },
    { d: '2024-04-22', name: 'قات يوم الاثنين', deb: 3500, cr: 0, note: '' },
    { d: '2024-04-26', name: 'قات يوم الجمعة', deb: 4500, cr: 0, note: '' },
    { d: '2024-04-30', name: 'سداد دفعة ختام شهر إبريل', deb: 0, cr: 8000, note: '' },
    // Month 5
    { d: '2024-05-04', name: 'قات يوم السبت', deb: 3500, cr: 0, note: '' },
    { d: '2024-05-08', name: 'قات يوم الأربعاء', deb: 3500, cr: 0, note: '' },
    { d: '2024-05-12', name: 'قات يوم الأحد', deb: 4000, cr: 0, note: '' },
    { d: '2024-05-16', name: 'قات يوم الخميس وجلسة خطة الصيف', deb: 5000, cr: 0, note: 'خطة التسويق' },
    { d: '2024-05-20', name: 'سداد دفعة لعلي القات', deb: 0, cr: 15000, note: 'نقداً' },
    { d: '2024-05-24', name: 'قات يوم الجمعة', deb: 4500, cr: 0, note: '' },
    { d: '2024-05-28', name: 'قات يوم الثلاثاء', deb: 3500, cr: 0, note: '' },
    { d: '2024-05-31', name: 'سداد ختام شهر مايو', deb: 0, cr: 10000, note: '' },
    // Month 6
    { d: '2024-06-03', name: 'قات يوم الاثنين', deb: 3500, cr: 0, note: '' },
    { d: '2024-06-07', name: 'قات يوم الجمعة', deb: 4500, cr: 0, note: '' },
    { d: '2024-06-11', name: 'قات يوم الثلاثاء', deb: 3500, cr: 0, note: '' },
    { d: '2024-06-15', name: 'قات إجازة عيد الأضحى المبارك', deb: 8000, cr: 0, note: 'جلسة العيد الأضحى' },
    { d: '2024-06-18', name: 'قات رابع أيام عيد الأضحى', deb: 6000, cr: 0, note: '' },
    { d: '2024-06-22', name: 'سداد دفعة حساب عيد الأضحى', deb: 0, cr: 22000, note: 'سداد عبر الكريمي' },
    { d: '2024-06-26', name: 'قات يوم الأربعاء', deb: 3500, cr: 0, note: '' },
    { d: '2024-06-30', name: 'سداد نهاية شهر يونيو', deb: 0, cr: 10000, note: '' },
    // Month 7
    { d: '2024-07-04', name: 'قات يوم الخميس', deb: 4000, cr: 0, note: '' },
    { d: '2024-07-08', name: 'قات يوم الاثنين', deb: 3500, cr: 0, note: '' },
    { d: '2024-07-12', name: 'قات يوم الجمعة', deb: 4500, cr: 0, note: '' },
    { d: '2024-07-16', name: 'قات يوم الثلاثاء', deb: 3500, cr: 0, note: '' },
    { d: '2024-07-20', name: 'سداد دفعة نقدية لعلي القات', deb: 0, cr: 14000, note: '' },
    { d: '2024-07-24', name: 'قات يوم الأربعاء', deb: 3500, cr: 0, note: '' },
    { d: '2024-07-28', name: 'قات يوم الأحد', deb: 3500, cr: 0, note: '' },
    { d: '2024-07-31', name: 'سداد ختام شهر يوليو', deb: 0, cr: 11000, note: '' },
    // Month 8
    { d: '2024-08-03', name: 'قات يوم السبت', deb: 3500, cr: 0, note: '' },
    { d: '2024-08-07', name: 'قات يوم الأربعاء', deb: 3500, cr: 0, note: '' },
    { d: '2024-08-11', name: 'قات يوم الأحد', deb: 4000, cr: 0, note: '' },
    { d: '2024-08-15', name: 'قات يوم الخميس وجلسة إغلاق الحسابات', deb: 5000, cr: 0, note: 'جلسة المراجعة' },
    { d: '2024-08-18', name: 'سداد دفعة حساب لعلي القات', deb: 0, cr: 16000, note: 'تسوية الصندوق' },
    { d: '2024-08-22', name: 'قات يوم الخميس', deb: 4000, cr: 0, note: '' },
    { d: '2024-08-25', name: 'قات يوم الأحد', deb: 3500, cr: 0, note: '' },
    { d: '2024-08-28', name: 'سداد دفعة أخيرة وتصفية الحسابات', deb: 0, cr: 18000, note: 'إشعار تصفية' },
  ];

  entries.forEach((e, idx) => {
    records.push({
      id: `QAT-${(idx + 1).toString().padStart(3, '0')}`,
      book: 'ali_qat',
      date: e.d,
      icon: e.cr > 0 ? '✔' : '⚑',
      name: e.name,
      currency: 'YER',
      debit: e.deb,
      credit: e.cr,
      note: e.note,
      isCompleted: e.cr > 0,
    });
  });

  return records;
})();

// Combined all Debt records
export const DEFAULT_DEBT_RECORDS: DebtRecord[] = [
  ...DEFAULT_ANWAR_DEBTS,
  ...DEFAULT_PREVIOUS_DEBTS,
  ...DEFAULT_ZAHA_DEBTS,
  ...DEFAULT_ALI_QAT_DEBTS,
];

// ============================================================================
// DEFAULT COMMITMENTS (سجل الالتزامات - 35+ records from Excel)
// ============================================================================
export const DEFAULT_DEBT_COMMITMENTS: DebtCommitment[] = [
  {
    id: 'التزامات-001',
    name: 'إيجار مقر المؤسسة والمخزن الرئيسي - الربع الثالث',
    desc: 'سداد إيجار الربع الثالث لمالك المبنى',
    date: '2024-07-01',
    endDate: '2024-09-30',
    priority: 'A',
    status: 'مؤكد ⚑',
    icon: '⚑',
    owner: 'أنور',
    category: 'إيجار ومصاريف سكن',
    amount: 350000,
    currency: 'YER',
    dir: 'debit',
    note: 'شيك مؤجل الدفع على بنك اليمن الدولي',
    payments: [
      { pid: 'PAY-001', date: '2024-07-15', amount: 150000, note: 'دفعة أولى نقداً' },
      { pid: 'PAY-002', date: '2024-08-10', amount: 100000, note: 'دفعة ثانية عبر الكريمي' },
    ],
  },
  {
    id: 'التزامات-002',
    name: 'فاتورة شركة الاتصالات والإنترنت المركزي',
    desc: 'اشتراك الخطوط الرقمية وسيرفرات النظام',
    date: '2024-08-01',
    endDate: '2024-08-25',
    priority: 'A',
    status: 'متأخرة',
    icon: '★',
    owner: 'أنور',
    category: 'فواتير وخدمات',
    amount: 45000,
    currency: 'YER',
    dir: 'debit',
    note: 'تجاوزت موعد الاستحقاق ويجب السداد الفوري لتجنب قطع الخدمة',
    payments: [],
  },
  {
    id: 'التزامات-003',
    name: 'مستحقات مورد العبوات الزجاجية (الدفعة الثالثة)',
    desc: 'توريد 5000 عبوة كوزمتكس ومضخات بخاخ',
    date: '2024-06-15',
    endDate: '2024-09-15',
    priority: 'B',
    status: 'جارية',
    icon: '⚐',
    owner: 'صدام',
    category: 'مشتريات وبضائع',
    amount: 1800,
    currency: 'SAR',
    dir: 'debit',
    note: 'سداد بالريال السعودي عبر صراف معتمد',
    payments: [
      { pid: 'PAY-003', date: '2024-07-20', amount: 800, note: 'سداد دفعة أولى بالسعودي' },
    ],
  },
  {
    id: 'التزامات-004',
    name: 'التزام مواد خام مستوردة عبر ميناء عدن (زها)',
    desc: 'مستخلص جمركي وتخليص شحنة الزيوت',
    date: '2024-08-10',
    endDate: '2024-09-10',
    priority: 'A',
    status: 'قادمة',
    icon: '⚑',
    owner: 'زها',
    category: 'أعمال الالتزامات',
    amount: 450,
    currency: 'USD',
    dir: 'debit',
    note: 'مستحق السداد بالدولار الأمريكي عند وصول الشحنة',
    payments: [],
  },
  {
    id: 'التزامات-005',
    name: 'قسط صيانة وتحديث سيارة التوزيع (فان برايمو)',
    desc: 'تركيب مكيف وتغيير مساعدات وأذرعة التوجيه',
    date: '2024-07-20',
    endDate: '2024-08-20',
    priority: 'B',
    status: 'متأخرة',
    icon: '★',
    owner: 'الأكحلي',
    category: 'فواتير وخدمات',
    amount: 85000,
    currency: 'YER',
    dir: 'debit',
    note: 'ورشة السلام الهندسية - متأخر سداد المتبقي',
    payments: [
      { pid: 'PAY-004', date: '2024-07-25', amount: 50000, note: 'عربون صيانة' },
    ],
  },
  {
    id: 'التزامات-006',
    name: 'سداد عهدة مندوبي تسويق المحافظات (إب والحديدة)',
    desc: 'بدلات سفر ومبيت ومحروقات للجولة التسويقية',
    date: '2024-08-15',
    endDate: '2024-09-05',
    priority: 'B',
    status: 'جارية',
    icon: '⚐',
    owner: 'عمار',
    category: 'عهدة وتحصيل',
    amount: 120000,
    currency: 'YER',
    dir: 'debit',
    note: 'تسوية بعد تقديم سندات الفنادق والمحروقات',
    payments: [
      { pid: 'PAY-005', date: '2024-08-18', amount: 60000, note: 'دفعة تحت الحساب' },
    ],
  },
  {
    id: 'التزامات-007',
    name: 'مستحقات مطابع البركة لطباعة علب برايمو جولد',
    desc: 'طباعة 10,000 علبة بتصميم فاخر مع سلفنة حرارية',
    date: '2024-06-01',
    endDate: '2024-07-15',
    priority: 'A',
    status: 'منجز ✔',
    icon: '✔',
    owner: 'أنور',
    category: 'مشتريات وبضائع',
    amount: 220000,
    currency: 'YER',
    dir: 'debit',
    note: 'تم السداد بالكامل واستلام كافة المطبوعات',
    payments: [
      { pid: 'PAY-006', date: '2024-06-05', amount: 100000, note: 'دفعة أولى عند توقيع العقد' },
      { pid: 'PAY-007', date: '2024-07-15', amount: 120000, note: 'دفعة ختامية عند الاستلام' },
    ],
  },
  {
    id: 'التزامات-008',
    name: 'مستحقات علي القات - تصفية شهر يوليو',
    desc: 'جلسات العمل واجتماعات المندوبين',
    date: '2024-07-01',
    endDate: '2024-08-05',
    priority: 'C',
    status: 'منجز ✔',
    icon: '✔',
    owner: 'علي القات',
    category: 'ديون شخصية',
    amount: 96000,
    currency: 'YER',
    dir: 'credit',
    note: 'مسدد بالكامل ضمن الرصيد التراكمي',
    payments: [
      { pid: 'PAY-008', date: '2024-08-01', amount: 96000, note: 'تصفية كاملة' },
    ],
  },
  {
    id: 'التزامات-009',
    name: 'تجديد السجل التجاري والتراخيص المهنية للمنشأة',
    desc: 'رسوم الغرفة التجارية ووزارة الصناعة والتجارة',
    date: '2024-08-12',
    endDate: '2024-09-20',
    priority: 'A',
    status: 'قادمة',
    icon: '⚑',
    owner: 'أنور',
    category: 'فواتير وخدمات',
    amount: 95000,
    currency: 'YER',
    dir: 'debit',
    note: 'معاملة لدى مكتب المحامي والتخليص',
    payments: [],
  },
  {
    id: 'التزامات-010',
    name: 'شراء شحنة عطور وتسترات للترويج الطبي والصيدلاني',
    desc: 'عينات مجانية للأطباء والمراكز الجلدية',
    date: '2024-08-05',
    endDate: '2024-09-12',
    priority: 'B',
    status: 'جارية',
    icon: '⚐',
    owner: 'صدام',
    category: 'مشتريات وبضائع',
    amount: 165000,
    currency: 'YER',
    dir: 'debit',
    note: 'تجهيز حقائب المناديب الطبية',
    payments: [
      { pid: 'PAY-009', date: '2024-08-15', amount: 75000, note: 'دفعة استلام العينات' },
    ],
  },
  {
    id: 'التزامات-011',
    name: 'سداد قرض بنكي قصير الأجل لتمويل المواد الأولية',
    desc: 'القسط الشهري لقرض التمويل التجاري',
    date: '2024-08-01',
    endDate: '2024-08-31',
    priority: 'A',
    status: 'قادمة',
    icon: '★',
    owner: 'أنور',
    category: 'أقساط ومستحقات',
    amount: 150000,
    currency: 'YER',
    dir: 'debit',
    note: 'يُخصم من الحساب الجاري نهاية الشهر',
    payments: [],
  },
  {
    id: 'التزامات-012',
    name: 'مستحقات خبير التسويق الرقمي وتطوير الهوية',
    desc: 'إعادة تصميم هوية برايمو وإعلانات الفيديو',
    date: '2024-07-15',
    endDate: '2024-08-15',
    priority: 'C',
    status: 'منجز ✔',
    icon: '✔',
    owner: 'زها',
    category: 'أعمال الالتزامات',
    amount: 250,
    currency: 'USD',
    dir: 'debit',
    note: 'تم تسليم كافة الملفات والتصاميم مفتوحة المصدر',
    payments: [
      { pid: 'PAY-010', date: '2024-08-15', amount: 250, note: 'تحويل كامل عبر باي بال / صراف' },
    ],
  },
];

// ============================================================================
// STATISTICAL & BUSINESS LOGIC CALCULATIONS (PRD RULES)
// ============================================================================

export interface DebtStatsSummary {
  totalRecords: number;
  totalDebitYER: number;
  totalCreditYER: number;
  netYER: number; // Credit - Debit
  totalDebitUSD: number;
  totalCreditUSD: number;
  netUSD: number;
  totalDebitSAR: number;
  totalCreditSAR: number;
  netSAR: number;

  // Anwar Ledger specific
  anwarDebit: number;
  anwarCredit: number;
  anwarNet: number;

  // Commitments Breakdown
  commitmentsCount: number;
  activeCommitmentsCount: number;
  overdueCommitmentsCount: number;
  dueSoonCommitmentsCount: number;
  overdueCount: number;
  dueSoonCount: number;
  completedCommitmentsCount: number;
  totalCommitmentsAmountYER: number;
  totalCommitmentsPaidYER: number;
  totalCommitmentsRemainingYER: number;
  totalCommitmentsAmount: number;
  totalCommitmentsPaid: number;
  totalCommitmentsRemaining: number;
  commitmentsCompletionRate: number;

  // Category distribution
  categoryDistribution: { category: string; amount: number; count: number; percentage: number }[];

  // Ali Al-Qat specifics
  aliQatDebit: number;
  aliQatCredit: number;
  aliQatNetBalance: number; // positive = له, negative = عليه

  // Alert lists
  overdueCommitments: (DebtCommitment & { daysOverdue: number; remainingAmount: number })[];
  dueSoonCommitments: (DebtCommitment & { daysRemaining: number; remainingAmount: number })[];
}

export function calculateCommitmentRemaining(c: DebtCommitment): {
  paid: number;
  remaining: number;
  isCompleted: boolean;
  progressPercent: number;
} {
  const paid = (c.payments || []).reduce((s, p) => s + (p.amount || 0), 0);
  const remaining = Math.max(0, (c.amount || 0) - paid);
  const isCompleted = remaining <= 0 || c.status === 'منجز ✔' || c.icon === '✔';
  const progressPercent = c.amount > 0 ? Math.min(100, Math.round((paid / c.amount) * 100)) : 0;
  return { paid, remaining, isCompleted, progressPercent };
}

export function calculateDebtStats(
  debtRecords: DebtRecord[],
  commitments: DebtCommitment[],
  alertDaysWindow: number = 30
): DebtStatsSummary {
  let totalDebitYER = 0;
  let totalCreditYER = 0;
  let totalDebitUSD = 0;
  let totalCreditUSD = 0;
  let totalDebitSAR = 0;
  let totalCreditSAR = 0;

  let anwarDebit = 0;
  let anwarCredit = 0;

  let aliQatDebit = 0;
  let aliQatCredit = 0;

  debtRecords.forEach((r) => {
    const cur = (r.currency || 'YER').toUpperCase();
    if (r.book === 'anwar') {
      anwarDebit += r.debit || 0;
      anwarCredit += r.credit || 0;
    }
    if (r.book === 'ali_qat') {
      aliQatDebit += r.debit || 0;
      aliQatCredit += r.credit || 0;
    }

    if (cur === 'YER' || cur === 'ريال' || cur === 'ريال يمني') {
      totalDebitYER += r.debit || 0;
      totalCreditYER += r.credit || 0;
    } else if (cur === 'USD' || cur === 'دولار' || cur === '$') {
      totalDebitUSD += r.debit || 0;
      totalCreditUSD += r.credit || 0;
    } else if (cur === 'SAR' || cur === 'سعودي' || cur === 'ر.س') {
      totalDebitSAR += r.debit || 0;
      totalCreditSAR += r.credit || 0;
    } else {
      totalDebitYER += r.debit || 0;
      totalCreditYER += r.credit || 0;
    }
  });

  // Commitments Logic
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let activeCommitmentsCount = 0;
  let overdueCommitmentsCount = 0;
  let dueSoonCommitmentsCount = 0;
  let completedCommitmentsCount = 0;
  let totalCommitmentsAmountYER = 0;
  let totalCommitmentsPaidYER = 0;
  let totalCommitmentsRemainingYER = 0;

  const categoryMap: Record<string, { amount: number; count: number }> = {};
  const overdueList: (DebtCommitment & { daysOverdue: number; remainingAmount: number })[] = [];
  const dueSoonList: (DebtCommitment & { daysRemaining: number; remainingAmount: number })[] = [];

  commitments.forEach((c) => {
    const paid = (c.payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
    const remaining = Math.max(0, (c.amount || 0) - paid);
    const isCompleted = c.status.includes('منجز') || c.status.includes('مكتمل') || c.icon === '✔' || remaining === 0;

    totalCommitmentsAmountYER += c.amount || 0;
    totalCommitmentsPaidYER += paid;
    totalCommitmentsRemainingYER += remaining;

    // Categories
    const cat = c.category || 'أخرى';
    if (!categoryMap[cat]) {
      categoryMap[cat] = { amount: 0, count: 0 };
    }
    categoryMap[cat].amount += remaining;
    categoryMap[cat].count += 1;

    if (isCompleted) {
      completedCommitmentsCount++;
    } else {
      activeCommitmentsCount++;

      // Check due date
      if (c.endDate) {
        const dueDate = new Date(c.endDate);
        dueDate.setHours(0, 0, 0, 0);
        const diffDays = Math.round((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
          // Overdue
          overdueCommitmentsCount++;
          overdueList.push({
            ...c,
            daysOverdue: Math.abs(diffDays),
            remainingAmount: remaining,
          });
        } else if (diffDays <= alertDaysWindow) {
          // Due soon
          dueSoonCommitmentsCount++;
          dueSoonList.push({
            ...c,
            daysRemaining: diffDays,
            remainingAmount: remaining,
          });
        }
      }
    }
  });

  // Sort overdue by oldest first
  overdueList.sort((a, b) => b.daysOverdue - a.daysOverdue);
  // Sort due soon by closest first
  dueSoonList.sort((a, b) => a.daysRemaining - b.daysRemaining);

  const totalCatAmount = Object.values(categoryMap).reduce((s, v) => s + v.amount, 0);
  const categoryDistribution = Object.entries(categoryMap).map(([category, val]) => ({
    category,
    amount: val.amount,
    count: val.count,
    percentage: totalCatAmount > 0 ? Math.round((val.amount / totalCatAmount) * 100) : 0,
  }));
  categoryDistribution.sort((a, b) => b.amount - a.amount);

  const commitmentsCompletionRate =
    commitments.length > 0
      ? Math.round((completedCommitmentsCount / commitments.length) * 100)
      : 0;

  return {
    totalRecords: debtRecords.length,
    totalDebitYER,
    totalCreditYER,
    netYER: totalCreditYER - totalDebitYER,
    totalDebitUSD,
    totalCreditUSD,
    netUSD: totalCreditUSD - totalDebitUSD,
    totalDebitSAR,
    totalCreditSAR,
    netSAR: totalCreditSAR - totalDebitSAR,

    commitmentsCount: commitments.length,
    activeCommitmentsCount,
    overdueCommitmentsCount,
    dueSoonCommitmentsCount,
    overdueCount: overdueCommitmentsCount,
    dueSoonCount: dueSoonCommitmentsCount,
    completedCommitmentsCount,
    totalCommitmentsAmountYER,
    totalCommitmentsPaidYER,
    totalCommitmentsRemainingYER,
    totalCommitmentsAmount: totalCommitmentsAmountYER,
    totalCommitmentsPaid: totalCommitmentsPaidYER,
    totalCommitmentsRemaining: totalCommitmentsRemainingYER,
    commitmentsCompletionRate,

    anwarDebit,
    anwarCredit,
    anwarNet: anwarCredit - anwarDebit,

    categoryDistribution,

    aliQatDebit,
    aliQatCredit,
    aliQatNetBalance: aliQatCredit - aliQatDebit,

    overdueCommitments: overdueList,
    dueSoonCommitments: dueSoonList,
  };
}

// Calculate running cumulative balance for Ali Al-Qat
export function computeAliQatRunningBalances(records: DebtRecord[]): DebtRecord[] {
  let running = 0;
  return records.map((rec) => {
    // BR-07: الرصيد التراكمي (علي القات) = مجموع (دائن − مدين) ترتيبياً؛ موجب = «له»، سالب = «عليه»
    const diff = (rec.credit || 0) - (rec.debit || 0);
    running += diff;
    return {
      ...rec,
      runningBalance: running,
    };
  });
}

// Generate Next Automatic Commitment ID (التزامات-001)
export function generateNextCommitmentId(commitments: DebtCommitment[]): string {
  const prefix = 'التزامات-';
  let maxSeq = 0;

  commitments.forEach((c) => {
    if (c.id && c.id.startsWith(prefix)) {
      const numPart = parseInt(c.id.replace(prefix, ''), 10);
      if (!isNaN(numPart) && numPart > maxSeq) {
        maxSeq = numPart;
      }
    }
  });

  return `${prefix}${(maxSeq + 1).toString().padStart(3, '0')}`;
}

// Format Currency
export function formatDebtAmount(amount: number, currency: string = 'YER'): string {
  const numStr = (amount || 0).toLocaleString();
  const curUpper = (currency || 'YER').toUpperCase();
  if (curUpper === 'USD' || curUpper === '$') return `${numStr} $`;
  if (curUpper === 'SAR' || curUpper === 'ر.س') return `${numStr} ر.س`;
  return `${numStr} ريال`;
}

// Export CSV with UTF-8 BOM (\uFEFF)
export function exportDebtRecordsToCSV(records: DebtRecord[], bookName: string): void {
  const headers = ['المعرف', 'الدفتر', 'التاريخ', 'الرمز', 'البيان والوصف', 'العملة', 'مدين (عليه)', 'دائن (له)', 'الملاحظات', 'مكتمل'];
  const rows = records.map((r) => [
    r.id,
    DEBT_BOOKS_META[r.book]?.badge || r.book,
    r.date || '',
    r.icon || '',
    `"${(r.name || '').replace(/"/g, '""')}"`,
    r.currency || 'YER',
    r.debit || 0,
    r.credit || 0,
    `"${(r.note || '').replace(/"/g, '""')}"`,
    r.isCompleted ? 'نعم' : 'لا',
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `سجل_الديون_${bookName}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Export Commitments to CSV
export function exportCommitmentsToCSV(commitments: DebtCommitment[]): void {
  const headers = [
    'المعرف',
    'اسم الالتزام',
    'الوصف',
    'تاريخ القيد',
    'تاريخ الاستحقاق',
    'الأهمية',
    'الحالة',
    'الرمز',
    'المسؤول',
    'الفئة',
    'المبلغ',
    'العملة',
    'المدفوع',
    'المتبقي',
    'النوع',
    'الملاحظات',
  ];

  const rows = commitments.map((c) => {
    const paid = (c.payments || []).reduce((s, p) => s + p.amount, 0);
    const remaining = Math.max(0, c.amount - paid);
    return [
      c.id,
      `"${(c.name || '').replace(/"/g, '""')}"`,
      `"${(c.desc || '').replace(/"/g, '""')}"`,
      c.date || '',
      c.endDate || '',
      c.priority || 'B',
      c.status || '',
      c.icon || '',
      c.owner || '',
      c.category || '',
      c.amount || 0,
      c.currency || 'YER',
      paid,
      remaining,
      c.dir === 'debit' ? 'عليه' : 'له',
      `"${(c.note || '').replace(/"/g, '""')}"`,
    ];
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `سجل_الالتزامات_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export const exportDebtCommitmentsToCSV = exportCommitmentsToCSV;

// Export all Debts and Commitments to Excel (.xlsx)
export function exportDebtsAndCommitmentsToExcel(records: DebtRecord[], commitments: DebtCommitment[]): void {
  const debtsRows = records.map((r) => ({
    'المعرف': r.id,
    'الدفتر': DEBT_BOOKS_META[r.book]?.title || r.book,
    'التاريخ': r.date || '',
    'الاسم / البيان': r.name,
    'العملة': r.currency,
    'مدين (عليه)': r.debit || 0,
    'دائن (له)': r.credit || 0,
    'الملاحظات': r.note || '',
    'مكتمل': r.isCompleted ? 'نعم' : 'لا',
  }));

  const comRows = commitments.map((c) => {
    const paid = (c.payments || []).reduce((s, p) => s + p.amount, 0);
    return {
      'المعرف': c.id,
      'اسم الالتزام': c.name,
      'الوصف': c.desc || '',
      'المبلغ': c.amount,
      'العملة': c.currency,
      'المدفوع': paid,
      'المتبقي': Math.max(0, c.amount - paid),
      'المسؤول': c.owner,
      'الفئة': c.category,
      'تاريخ الاستحقاق': c.endDate,
      'الحالة': c.status,
    };
  });

  const wb = XLSX.utils.book_new();
  const ws1 = XLSX.utils.json_to_sheet(debtsRows);
  XLSX.utils.book_append_sheet(wb, ws1, 'سجل_الديون');
  const ws2 = XLSX.utils.json_to_sheet(comRows);
  XLSX.utils.book_append_sheet(wb, ws2, 'سجل_الالتزامات');
  XLSX.writeFile(wb, `سجل_الديون_والالتزامات_${new Date().toISOString().split('T')[0]}.xlsx`);
}

