// ============================================================================
// CUSTODY & PENDING ISSUES MODULE TYPES (دفتر العهد والاشكاليات المعلقة v1.0.0)
// Product Requirements Document (PRD) Standard Schema
// ============================================================================

export type CustodySection = 'custody' | 'issues';

export type CustodyPriority = 'A' | 'B' | 'C' | 'D' | '√' | string;

export type CustodyStatus =
  | 'مخطط'
  | 'مكتمل'
  | 'مؤجل'
  | 'متأخر'
  | 'شركة'
  | 'ملغي'
  | 'بدون حالة'
  | string;

export interface CustodyIssueRecord {
  id: string;
  section: CustodySection; // 'custody' (العهد وحسابات) | 'issues' (الاشكاليات المعلقة)
  date: string; // YYYY-MM-DD or empty
  name: string; // الشخص / الصيدلية / العميل / الجهة
  desc: string; // الوصف التفصيلي (إلزامي)
  cat: string; // الفئة: حسابات، عهدة، مشكلة، مرتجع، تعويض، فروقات جرد...
  pri: CustodyPriority; // A, B, C, D, √
  status: CustodyStatus; // مخطط، مكتمل، مؤجل، متأخر، شركة، ملغي، بدون حالة
  resp: string; // انا، صدام، الفريق، الإدارة، انا وصدام...
  amount?: number; // المبلغ إن وجد
  currency?: string; // العملة: ريال يمني / دولار / ريال سعودي
  notes?: string; // ملاحظات إضافية
  link?: string; // رابط أو مرجع
  isCorruptedReference?: boolean; // علامة تمييز مراجع Schedule! التالفة
  corruptedRefText?: string; // النص الأصلي المرجعي مثل Schedule!AT13:BO14
  createdAt?: string;
  updatedAt?: string;
}

export interface CustodyFilterState {
  search: string;
  section: 'all' | CustodySection;
  status: string;
  priority: string;
  category: string;
  responsible: string;
  onlyLateOrPostponed: boolean;
  onlyUnclassified: boolean;
  onlyCorrupted: boolean;
  startDate?: string;
  endDate?: string;
}

export interface CustodyKPIs {
  total: number;
  custodyCount: number;
  issuesCount: number;
  completedCount: number;
  plannedCount: number;
  postponedCount: number;
  lateCount: number;
  companyCount: number;
  cancelledCount: number;
  unclassifiedCount: number;
  corruptedCount: number;
  priorityCounts: {
    A: number;
    B: number;
    C: number;
    D: number;
    check: number;
    other: number;
  };
  responsibleCounts: { [resp: string]: number };
  totalAmountYEM: number;
  totalAmountUSD: number;
  totalAmountSAR: number;
}
