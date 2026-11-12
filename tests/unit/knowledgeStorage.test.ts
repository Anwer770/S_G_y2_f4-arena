// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_NOTES,
  DEFAULT_NOTE_FOLDERS,
  DEFAULT_NOTE_TAGS,
  DEFAULT_NOTE_TEMPLATES,
} from '../../src/data/defaultNotes';
import { dbStorage } from '../../src/database/dbStorage';
import type { NoteAuditLog } from '../../src/types';
import {
  loadNoteAuditLogs,
  loadNoteFolders,
  loadNotes,
  loadNoteTags,
  loadNoteTemplates,
  logNoteAudit,
  saveNoteAuditLogs,
  saveNoteFolders,
  saveNotes,
  saveNoteTags,
  saveNoteTemplates,
} from '../../src/utils/storage/knowledge';
import { STORAGE_KEYS } from '../../src/utils/storage/keys';

beforeEach(() => {
  dbStorage.clear();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-07T12:00:00.000Z'));
});

afterEach(() => {
  dbStorage.clear();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('R74 — استمرارية قاعدة المعرفة والملاحظات', () => {
  it('يفصل الغياب عن الفراغ: كل دفاتر المعرفة تقبل []، وتستعمل البذور عند غياب المفتاح فقط', () => {
    expect(loadNotes()).toEqual(DEFAULT_NOTES);
    expect(loadNoteFolders()).toEqual(DEFAULT_NOTE_FOLDERS);
    expect(loadNoteTags()).toEqual(DEFAULT_NOTE_TAGS);
    expect(loadNoteTemplates()).toEqual(DEFAULT_NOTE_TEMPLATES);
    expect(loadNoteAuditLogs()).toEqual([expect.objectContaining({ id: 'LOG-NOTE-1', action: 'استيراد' })]);

    saveNotes([]);
    saveNoteFolders([]);
    saveNoteTags([]);
    saveNoteTemplates([]);
    saveNoteAuditLogs([]);
    expect(loadNotes()).toEqual([]);
    expect(loadNoteFolders()).toEqual([]);
    expect(loadNoteTags()).toEqual([]);
    expect(loadNoteTemplates()).toEqual([]);
    expect(loadNoteAuditLogs()).toEqual([]);
  });

  it('يحفظ كل دفتر معرفة على مفتاحه المستقل، ولا يخلط ملاحظة أو مجلداً أو وسماً أو قالباً بآخر', () => {
    const note = { ...DEFAULT_NOTES[0]!, id: 'NOTE-R74', title: 'ملاحظة محفوظة R74' };
    const folder = { ...DEFAULT_NOTE_FOLDERS[0]!, id: 'FOLDER-R74', name: 'مجلد R74' };
    const tag = { ...DEFAULT_NOTE_TAGS[0]!, id: 'TAG-R74', name: 'وسم R74' };
    const template = { ...DEFAULT_NOTE_TEMPLATES[0]!, id: 'TPL-R74', title: 'قالب R74' };

    saveNotes([note]);
    saveNoteFolders([folder]);
    saveNoteTags([tag]);
    saveNoteTemplates([template]);

    expect(loadNotes()).toEqual([note]);
    expect(loadNoteFolders()).toEqual([folder]);
    expect(loadNoteTags()).toEqual([tag]);
    expect(loadNoteTemplates()).toEqual([template]);
    expect(dbStorage.getItem(STORAGE_KEYS.KNOWLEDGE_FOLDERS)).not.toContain('ملاحظة محفوظة R74');
    expect(dbStorage.getItem(STORAGE_KEYS.KNOWLEDGE_NOTES)).not.toContain('مجلد R74');
  });

  it('يرفض JSON التالف والشكل غير المصفوفي بأمان ولا يمرر بيانات دخيلة إلى قاعدة المعرفة', () => {
    dbStorage.setItem(STORAGE_KEYS.KNOWLEDGE_NOTES, '{تالف');
    dbStorage.setItem(STORAGE_KEYS.KNOWLEDGE_FOLDERS, JSON.stringify({ folder: 'ليست قائمة' }));
    dbStorage.setItem(STORAGE_KEYS.KNOWLEDGE_TAGS, JSON.stringify({ tag: 'ليست قائمة' }));
    dbStorage.setItem(STORAGE_KEYS.KNOWLEDGE_TEMPLATES, '{تالف');
    dbStorage.setItem(STORAGE_KEYS.KNOWLEDGE_AUDIT, JSON.stringify({ audit: 'ليست قائمة' }));

    expect(loadNotes()).toEqual(DEFAULT_NOTES);
    expect(loadNoteFolders()).toEqual(DEFAULT_NOTE_FOLDERS);
    expect(loadNoteTags()).toEqual(DEFAULT_NOTE_TAGS);
    expect(loadNoteTemplates()).toEqual(DEFAULT_NOTE_TEMPLATES);
    expect(loadNoteAuditLogs()).toEqual([expect.objectContaining({ id: 'LOG-NOTE-1' })]);
  });

  it('يكتب أحدث تدقيق أولاً، ويبقي معرفه فريداً حتى لحدثين في اللحظة نفسها، ويقص السجل إلى 500', () => {
    saveNoteAuditLogs([]);
    vi.spyOn(Date, 'now').mockReturnValue(1730000000000);
    vi.spyOn(Math, 'random').mockReturnValue(0);

    logNoteAudit('إضافة', 'ملاحظة', 'ملاحظة أولى', 'حدث أول');
    const firstId = loadNoteAuditLogs()[0]!.id;
    saveNoteAuditLogs([
      {
        id: `${firstId}-1`,
        time: '2026-11-07T12:00:00.000Z',
        action: 'استيراد',
        entity: 'نظام',
        title: 'تضارب',
        details: 'لاحقة محجوزة',
      },
      ...loadNoteAuditLogs(),
    ]);
    logNoteAudit('تعديل', 'قالب', 'قالب ثان', 'حدث ثان');

    const newLogs = loadNoteAuditLogs();
    expect(newLogs).toEqual([
      expect.objectContaining({ id: `${firstId}-2`, action: 'تعديل', entity: 'قالب', title: 'قالب ثان' }),
      expect.objectContaining({ id: `${firstId}-1`, title: 'تضارب' }),
      expect.objectContaining({ id: firstId, action: 'إضافة', title: 'ملاحظة أولى', details: 'حدث أول' }),
    ]);
    expect(new Set(newLogs.map((entry) => entry.id)).size).toBe(3);

    const logs: NoteAuditLog[] = Array.from({ length: 501 }, (_, index) => ({
      id: `LOG-NOTE-R74-${index}`,
      time: '2026-11-07T12:00:00.000Z',
      action: 'تعديل',
      entity: 'ملاحظة',
      title: String(index),
      details: `تفصيل ${index}`,
    }));
    saveNoteAuditLogs(logs);
    expect(loadNoteAuditLogs()).toHaveLength(500);
    expect(loadNoteAuditLogs()[0]?.id).toBe('LOG-NOTE-R74-0');
    expect(loadNoteAuditLogs()[499]?.id).toBe('LOG-NOTE-R74-499');
  });

  it('يعزل البذور المتداخلة ومدخلات الحفظ والقراءة التالية عن تعديل المستهلك من دون حفظ صريح', () => {
    const originalTitle = DEFAULT_NOTES[0]!.title;
    const originalTag = DEFAULT_NOTES[0]!.tags[0]!;
    const originalTaskText = DEFAULT_NOTES[0]!.tasks![0]!.text;
    const originalFolderName = DEFAULT_NOTE_FOLDERS[0]!.name;
    const originalTemplateTag = DEFAULT_NOTE_TEMPLATES[0]!.tags![0]!;
    const notes = loadNotes();
    const folders = loadNoteFolders();
    const templates = loadNoteTemplates();
    notes[0]!.title = 'تعديل لا يلوّث البذرة';
    notes[0]!.tags[0] = 'وسم لا يلوّث البذرة';
    notes[0]!.tasks![0]!.text = 'مهمة لا تلوّث البذرة';
    folders[0]!.name = 'مجلد لا يلوّث البذرة';
    templates[0]!.tags![0] = 'وسم قالب لا يلوّث البذرة';

    expect(DEFAULT_NOTES[0]!.title).toBe(originalTitle);
    expect(DEFAULT_NOTES[0]!.tags[0]).toBe(originalTag);
    expect(DEFAULT_NOTES[0]!.tasks![0]!.text).toBe(originalTaskText);
    expect(DEFAULT_NOTE_FOLDERS[0]!.name).toBe(originalFolderName);
    expect(DEFAULT_NOTE_TEMPLATES[0]!.tags![0]).toBe(originalTemplateTag);
    expect(loadNotes()[0]!.tags[0]).toBe(originalTag);
    expect(loadNotes()[0]!.tasks![0]!.text).toBe(originalTaskText);

    const saved = [
      {
        ...DEFAULT_NOTES[0]!,
        id: 'NOTE-IMMUTABLE',
        tags: [...DEFAULT_NOTES[0]!.tags],
        tasks: DEFAULT_NOTES[0]!.tasks?.map((task) => ({ ...task })),
      },
    ];
    saveNotes(saved);
    saved[0]!.tags[0] = 'تعديل الذاكرة بعد الحفظ';
    saved[0]!.tasks![0]!.text = 'تعديل المهمة بعد الحفظ';
    expect(loadNotes()[0]!.tags[0]).toBe(originalTag);
    expect(loadNotes()[0]!.tasks![0]!.text).toBe(originalTaskText);
  });
});
