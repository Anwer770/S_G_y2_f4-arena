/**
 * أنواع وحدة المعرفة (R30) — مفصولة عن المكوّن ليشاركها الخطاف.
 */

export interface KnowledgeModuleProps {
  customersList?: { id: string; name: string }[];
  doctorsList?: { id: string; name: string }[];
  tasksList?: { id: string; title: string }[];
}

export type KnowledgeSubTab =
  | 'dashboard'
  | 'all_notes'
  | 'quick_notes'
  | 'pinned'
  | 'favorites'
  | 'needs_review'
  | 'templates'
  | 'folders_tags'
  | 'trash'
  | 'audit';
