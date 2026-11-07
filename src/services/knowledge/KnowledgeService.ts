import { NoteRecord } from '../../types';
import { notesRepository, NotesRepository } from '../../database/repositories/OtherRepositories';
import { auditService } from '../../core/audit/AuditService';
import { Outbox } from '../../sync/Outbox';

export class KnowledgeService {
  private repo: NotesRepository;

  constructor(repo: NotesRepository = notesRepository) {
    this.repo = repo;
  }

  public getAll(): NoteRecord[] {
    return this.repo.getAll();
  }

  public getById(id: string): NoteRecord | null {
    return this.repo.getById(id);
  }

  public saveNote(note: NoteRecord): NoteRecord {
    const isNew = !this.repo.getById(note.id);
    let saved: NoteRecord;

    if (isNew) {
      saved = this.repo.add(note);
      auditService.log({
        action: 'Create',
        entity: 'Note',
        recordId: note.id,
        details: `إنشاء ملاحظة جديدة: ${note.title}`,
        newValue: note,
      });
      Outbox.enqueue('Note', 'INSERT', note.id, note);
    } else {
      const old = this.repo.getById(note.id);
      saved = this.repo.update(note.id, note) || note;
      auditService.log({
        action: 'Update',
        entity: 'Note',
        recordId: note.id,
        details: `تحديث الملاحظة: ${note.title}`,
        oldValue: old,
        newValue: note,
      });
      Outbox.enqueue('Note', 'UPDATE', note.id, note);
    }

    return saved;
  }

  public deleteNote(id: string): boolean {
    const old = this.repo.getById(id);
    if (!old) return false;

    const res = this.repo.delete(id);
    if (res) {
      auditService.log({
        action: 'Delete',
        entity: 'Note',
        recordId: id,
        details: `حذف الملاحظة: ${old.title}`,
        oldValue: old,
      });
      Outbox.enqueue('Note', 'DELETE', id, old);
    }
    return res;
  }
}

export const knowledgeService = new KnowledgeService();
