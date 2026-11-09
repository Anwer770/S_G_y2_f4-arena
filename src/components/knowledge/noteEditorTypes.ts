/**
 * أنواع محرّر الملاحظات (R30) — مفصولة عن المكوّن ليشاركها الخطاف.
 */
import type {
  NoteAttachment,
  NoteFolder,
  NoteLinkItem,
  NotePriority,
  NoteRecord,
  NoteReminderItem,
  NoteStatus,
  NoteTagItem,
  NoteTaskItem,
  NoteType,
} from '../../types';

export interface NoteEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteToEdit: NoteRecord | null;
  onSave: (note: Partial<NoteRecord>, isNew: boolean) => void;
  folders: NoteFolder[];
  tagsList: NoteTagItem[];
  customersList?: { id: string; name: string }[];
  doctorsList?: { id: string; name: string }[];
  tasksList?: { id: string; title: string }[];
}
