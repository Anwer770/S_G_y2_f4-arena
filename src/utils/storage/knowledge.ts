/**
 * مخزن وحدة «knowledge» — مُستخرج من storage.ts (R26).
 */
import {
  DEFAULT_NOTES,
  DEFAULT_NOTE_FOLDERS,
  DEFAULT_NOTE_TAGS,
  DEFAULT_NOTE_TEMPLATES,
} from '../../data/defaultNotes';
import { createCollectionRepository } from '../../database/repositories/CollectionRepository';
import { NoteAuditLog, NoteFolder, NoteRecord, NoteTagItem, NoteTemplate } from '../../types';
import { STORAGE_KEYS } from './keys';

/**
 * مستودعات قاعدة المعرفة (R33) — القراءة/الكتابة عبر مستودع واحد.
 * السلوك محفوظ: المصفوفة الفارغة مقبولة (لا رجوع للبذرة)، وسجل التدقيق بسقف 500.
 */
const notesRepo = createCollectionRepository<NoteRecord>({
  key: STORAGE_KEYS.KNOWLEDGE_NOTES,
  fallback: DEFAULT_NOTES,
});

const foldersRepo = createCollectionRepository<NoteFolder>({
  key: STORAGE_KEYS.KNOWLEDGE_FOLDERS,
  fallback: DEFAULT_NOTE_FOLDERS,
});

const tagsRepo = createCollectionRepository<NoteTagItem>({
  key: STORAGE_KEYS.KNOWLEDGE_TAGS,
  fallback: DEFAULT_NOTE_TAGS,
});

const templatesRepo = createCollectionRepository<NoteTemplate>({
  key: STORAGE_KEYS.KNOWLEDGE_TEMPLATES,
  fallback: DEFAULT_NOTE_TEMPLATES,
});

const DEFAULT_NOTE_AUDIT: NoteAuditLog[] = [
  {
    id: 'LOG-NOTE-1',
    time: new Date().toLocaleString('ar-YE'),
    action: 'استيراد',
    entity: 'نظام',
    title: 'إدارة الملاحظات والمعرفة',
    details: 'تمت تهيئة قاعدة المعرفة والملاحظات والقوالب والمجلدات الافتراضية بنجاح',
  },
];

const auditRepo = createCollectionRepository<NoteAuditLog>({
  key: STORAGE_KEYS.KNOWLEDGE_AUDIT,
  fallback: DEFAULT_NOTE_AUDIT,
  limit: 500,
});

export function loadNotes(): NoteRecord[] {
  return notesRepo.read();
}

export function saveNotes(notes: NoteRecord[]): void {
  notesRepo.write(notes);
}

export function loadNoteFolders(): NoteFolder[] {
  return foldersRepo.read();
}

export function saveNoteFolders(folders: NoteFolder[]): void {
  foldersRepo.write(folders);
}

export function loadNoteTags(): NoteTagItem[] {
  return tagsRepo.read();
}

export function saveNoteTags(tags: NoteTagItem[]): void {
  tagsRepo.write(tags);
}

export function loadNoteTemplates(): NoteTemplate[] {
  return templatesRepo.read();
}

export function saveNoteTemplates(templates: NoteTemplate[]): void {
  templatesRepo.write(templates);
}

export function loadNoteAuditLogs(): NoteAuditLog[] {
  return auditRepo.read();
}

export function saveNoteAuditLogs(logs: NoteAuditLog[]): void {
  auditRepo.write(logs);
}

export function logNoteAudit(
  action: NoteAuditLog['action'],
  entity: NoteAuditLog['entity'],
  title: string,
  details: string
): void {
  const current = loadNoteAuditLogs();
  const newLog: NoteAuditLog = {
    id: `LOG-NT-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    time: new Date().toLocaleString('ar-YE'),
    action,
    entity,
    title,
    details,
  };
  saveNoteAuditLogs([newLog, ...current]);
}
