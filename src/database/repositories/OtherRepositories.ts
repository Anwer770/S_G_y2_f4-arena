import { BaseRepository } from './BaseRepository';
import { CustodyIssueRecord, LinkRecord, NoteRecord, RoutineRecord } from '../../types';
import { DEFAULT_CUSTODY_ISSUES_RECORDS } from '../../data/defaultCustodyIssues';
import { DEFAULT_LINKS_RECORDS } from '../../data/defaultLinks';
import { DEFAULT_NOTES } from '../../data/defaultNotes';
import { DEFAULT_ROUTINES } from '../../data/defaultRoutines';

export class CustodyRepository extends BaseRepository<CustodyIssueRecord> {
  constructor() {
    super('suite_custody_records_v1', DEFAULT_CUSTODY_ISSUES_RECORDS);
  }
}

export class LinksRepository extends BaseRepository<LinkRecord> {
  constructor() {
    super('suite_links_records_v1', DEFAULT_LINKS_RECORDS);
  }
}

export class NotesRepository extends BaseRepository<NoteRecord> {
  constructor() {
    super('suite_knowledge_notes_v1', DEFAULT_NOTES);
  }
}

export class RoutinesRepository extends BaseRepository<RoutineRecord> {
  constructor() {
    super('suite_routines_items_v1', DEFAULT_ROUTINES);
  }
}

export const custodyRepository = new CustodyRepository();
export const linksRepository = new LinksRepository();
export const notesRepository = new NotesRepository();
export const routinesRepository = new RoutinesRepository();
