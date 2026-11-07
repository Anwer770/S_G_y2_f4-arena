export type LinkType =
  | 'موقع رسمي'
  | 'موقع مجاني'
  | 'موقع دفع'
  | 'موقع مهكر'
  | 'تحميل'
  | 'فيسبوك'
  | 'الانستجرام'
  | 'تلجرام'
  | string;

export type LinkImportance =
  | 'A'
  | 'B'
  | 'C'
  | 'D'
  | 'مفيد'
  | 'غير مفيد'
  | 'ملغي'
  | 'غير نشط'
  | string;

export type LinkClassification = string;
export type LinkCategory = string;

export interface LinkRecord {
  id: string;
  siteName: string;         // اسم الموقع
  desc: string;             // الوصف
  url: string;              // الرابط URL
  type: LinkType;           // النوع (فيسبوك، الانستجرام، تلجرام، موقع رسمي، موقع دفع، موقع مجاني، موقع مهكر، تحميل)
  classification: string;   // التصنيف (23 تصنيف)
  category: string;         // الفئة (10 فئات)
  importance: LinkImportance; // درجة الأهمية (A, B, C, D, ...)
  notes?: string;           // ملاحظات
  isFavorite?: boolean;     // هل مفضل
  visitCount?: number;      // عداد الزيارات
  createdAt?: string;
  updatedAt?: string;
}

export interface LinksKPIs {
  total: number;
  favoritesCount: number;
  aiCount: number;
  officeCount: number;
  socialCount: number;
  securityCount: number;
  importanceCounts: {
    A: number;
    B: number;
    C: number;
    D: number;
    other: number;
  };
  typeCounts: { [type: string]: number };
  classificationCounts: { [cls: string]: number };
  categoryCounts: { [cat: string]: number };
}

export interface LinksFilterState {
  search: string;
  classification: string;
  category: string;
  type: string;
  importance: string;
  onlyFavorites: boolean;
  onlyAI: boolean;
}
