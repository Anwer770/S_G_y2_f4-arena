/**
 * مخزن وحدة «knowledge» — مُستخرج من storage.ts (R26).
 */
import {
  DEFAULT_NOTES,
  DEFAULT_NOTE_FOLDERS,
  DEFAULT_NOTE_TAGS,
  DEFAULT_NOTE_TEMPLATES,
} from '../../data/defaultNotes';
import {
  dbStorage,
} from '../../database/dbStorage';
import {
  NoteAuditLog,
  NoteFolder,
  NoteRecord,
  NoteTagItem,
  NoteTemplate,
} from '../../types';
import {
  STORAGE_KEYS,
} from './keys';

export function loadNotes(): NoteRecord[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.KNOWLEDGE_NOTES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading notes:', e);
  }
  return DEFAULT_NOTES;
}

export function saveNotes(notes: NoteRecord[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.KNOWLEDGE_NOTES, JSON.stringify(notes));
  } catch (e) {
    console.error('Error saving notes:', e);
  }
}

export function loadNoteFolders(): NoteFolder[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.KNOWLEDGE_FOLDERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading note folders:', e);
  }
  return DEFAULT_NOTE_FOLDERS;
}

export function saveNoteFolders(folders: NoteFolder[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.KNOWLEDGE_FOLDERS, JSON.stringify(folders));
  } catch (e) {
    console.error('Error saving note folders:', e);
  }
}

export function loadNoteTags(): NoteTagItem[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.KNOWLEDGE_TAGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading note tags:', e);
  }
  return DEFAULT_NOTE_TAGS;
}

export function saveNoteTags(tags: NoteTagItem[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.KNOWLEDGE_TAGS, JSON.stringify(tags));
  } catch (e) {
    console.error('Error saving note tags:', e);
  }
}

export function loadNoteTemplates(): NoteTemplate[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.KNOWLEDGE_TEMPLATES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading note templates:', e);
  }
  return DEFAULT_NOTE_TEMPLATES;
}

export function saveNoteTemplates(templates: NoteTemplate[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.KNOWLEDGE_TEMPLATES, JSON.stringify(templates));
  } catch (e) {
    console.error('Error saving note templates:', e);
  }
}

export function loadNoteAuditLogs(): NoteAuditLog[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.KNOWLEDGE_AUDIT);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading note audit logs:', e);
  }
  return [
    {
      id: 'LOG-NOTE-1',
      time: new Date().toLocaleString('ar-YE'),
      action: 'استيراد',
      entity: 'نظام',
      title: 'إدارة الملاحظات والمعرفة',
      details: 'تمت تهيئة قاعدة المعرفة والملاحظات والقوالب والمجلدات الافتراضية بنجاح',
    },
  ];
}

export function saveNoteAuditLogs(logs: NoteAuditLog[]): void {
  try {
    const trimmed = logs.slice(0, 500);
    dbStorage.setItem(STORAGE_KEYS.KNOWLEDGE_AUDIT, JSON.stringify(trimmed));
  } catch (e) {
    console.error('Error saving note audit logs:', e);
  }
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
