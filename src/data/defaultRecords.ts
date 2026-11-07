import { MovementRecord } from '../types';
import { DEFAULT_62_PRODUCT_NAMES } from './defaultProducts';

// Beneficiaries commonly used in cosmetic distribution
const BENEFICIARIES = [
  'صيدلية النهضة الحديثة',
  'مركز بلسم للعناية والجمال',
  'صيدلية الشفاء المركزية',
  'مؤسسة التاج للتجارة والتوزيع',
  'صالون الوردة الدمشقية',
  'مستودع الأمل لمستحضرات التجميل',
  'صيدلية السلام العالمية',
  'مركز ستي بيوتي سنتر',
  'د. هناء أحمد (عينات عيادة)',
  'صيدلية طيبة الكبرى',
  'مؤسسة النور للتسويق',
  'مركز ريتاج للتجميل',
  'صيدلية الرواد',
  'معرض الفخامة كوزمتكس',
  'صيدلية النخبة الحديثة',
  'صالون الملكة للعناية',
  'أمين المخزن - عهدة تسليم',
  'إدارة التسويق والدعاية',
];

const CATEGORIES = [
  'مبيعات',
  'مبيعات',
  'مبيعات',
  'عينات',
  'توزيع',
  'هدية',
  'دعم',
  'شركة',
  'مرتجع',
];

const STATUSES = [
  'تم التنفيذ',
  'تم التنفيذ',
  'تم التنفيذ',
  'تم التنفيذ',
  'تم ترحيل',
  'قيد التنفيذ',
];

// Helper to generate representative historical records
export function generateDefaultRecords(): MovementRecord[] {
  const records: MovementRecord[] = [];

  // 1. IN records (IN-0001 to IN-0003)
  records.push({
    id: 'IN-0001',
    mainId: 'Categ-1001',
    subId: 'IN-0001',
    date: '2024-01-05',
    beneficiary: 'المورد الرئيسي - توريد شحنة تركيا الأولى',
    description: 'توريد شحنة الشامبوهات والصوابين الطبيعية',
    movementType: 'توريد',
    status: 'تم التنفيذ',
    category: 'مشتريات',
    items: {
      'شامبو القمح': 500,
      'شامبو القراص': 450,
      'صابون العرعر - تار': 300,
      'صابون الشاي': 350,
      'صابون الجوجوبا': 300,
      'رغوة الالوفيرا': 200,
    },
    note: 'شحنة رسمية مستلمة مع بوليصة الشحن',
    createdAt: '2024-01-05T09:00:00Z',
  });

  records.push({
    id: 'IN-0002',
    mainId: 'Categ-1002',
    subId: 'IN-0002',
    date: '2024-03-12',
    beneficiary: 'المصنع المورد - دفعة السيرومات والكريمات',
    description: 'توريد مستحضرات العناية بالبشرة وسيرومات النياسيناميد وفيتامين سي',
    movementType: 'توريد',
    status: 'تم التنفيذ',
    category: 'مشتريات',
    items: {
      'سيروم نياسيناميد': 400,
      'سيروم فيتامين سي': 400,
      'سيروم ألفا أربوتين': 300,
      'سيروم حمض الهيالورونيك': 350,
      'كريم اللؤلؤ والببتايد': 250,
      'كريم الوجه الساكورا': 300,
    },
    note: 'فحص الجودة مطابق للمواصفات',
    createdAt: '2024-03-12T11:30:00Z',
  });

  records.push({
    id: 'IN-0003',
    mainId: 'Categ-1003',
    subId: 'IN-0003',
    date: '2024-06-20',
    beneficiary: 'المورد الإقليمي - استلام طلبية العطور والرغوات',
    description: 'توريد دفعة رغوات وماسكات ولوشنات الساكورا والالوفيرا',
    movementType: 'توريد',
    status: 'تم التنفيذ',
    category: 'مشتريات',
    items: {
      'عطر رجالي تركي': 150,
      'رغوة اللؤلؤ': 250,
      'رغوة الساكورا': 300,
      'لوشن الجسم الألوفيرا': 250,
      'لوشن الساكورا': 200,
      'واقي الشمس': 400,
    },
    note: 'تم إدخال الكميات للمستودع الرئيسي',
    createdAt: '2024-06-20T14:15:00Z',
  });

  // 2. OUT records (OUT-0001 to OUT-0298)
  const baseDate = new Date('2024-01-10');

  for (let i = 1; i <= 298; i++) {
    const subId = `OUT-${String(i).padStart(4, '0')}`;
    const mainId = `Categ-${1000 + ((i % 50) + 1)}`;
    
    // Increment date gradually across 2024, 2025, 2026
    const curDate = new Date(baseDate.getTime() + (i * 2.8) * 24 * 60 * 60 * 1000);
    const dateStr = curDate.toISOString().split('T')[0];

    const beneficiary = BENEFICIARIES[i % BENEFICIARIES.length];
    const category = CATEGORIES[i % CATEGORIES.length];
    const status = i % 25 === 0 ? 'ملغي' : STATUSES[i % STATUSES.length];

    // Special PRD condition: OUT-0250 to OUT-0265 are without numerical quantities in original Excel
    const isWithoutQty = i >= 250 && i <= 265;

    const items: Record<string, number> = {};

    if (!isWithoutQty) {
      // Pick 1 to 4 items from the 62 list
      const itemCount = (i % 3) + 1;
      for (let j = 0; j < itemCount; j++) {
        const prodIndex = (i * 3 + j * 7) % DEFAULT_62_PRODUCT_NAMES.length;
        const prodName = DEFAULT_62_PRODUCT_NAMES[prodIndex];
        const qty = ((i + j * 2) % 12) + 1;
        items[prodName] = (items[prodName] || 0) + qty;
      }
    }

    const description = isWithoutQty
      ? `صرف مذكور نصاً بدون تحديد كميات رقمية بالملف الأصلي - سند ${subId}`
      : `صرف أصناف عناية وتجميل لـ ${beneficiary} - ${category}`;

    records.push({
      id: subId,
      mainId,
      subId,
      date: dateStr,
      beneficiary,
      description,
      movementType: 'صرف',
      status,
      category,
      items,
      note: isWithoutQty ? 'حركة تاريخية بدون كميات رقمية (مستندة للوصف الأصلي)' : undefined,
      createdAt: `${dateStr}T10:00:00Z`,
    });
  }

  return records;
}

export const INITIAL_RECORDS: MovementRecord[] = generateDefaultRecords();
