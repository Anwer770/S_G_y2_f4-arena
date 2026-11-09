/**
 * أنواع واجهة سجل الحركات (R30) — مفصولة عن المكوّن ليشاركها الخطاف.
 */
import type { MovementRecord, Product } from '../../types';

export interface RecordsViewProps {
  records: MovementRecord[];
  products: Product[];
  categories: string[];
  statuses: string[];
  onOpenAddModal: () => void;
  onEditRecord: (record: MovementRecord) => void;
  onDeleteRecord: (record: MovementRecord) => void;
  onCloneRecord: (record: MovementRecord) => void;
  onViewRecord: (record: MovementRecord) => void;
  onBulkDelete: (subIds: string[]) => void;
}
