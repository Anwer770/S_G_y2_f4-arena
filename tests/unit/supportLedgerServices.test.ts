import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DebtCommitment, DebtRecord, NoteRecord } from '../../src/types';
import type { CustodyIssueRecord } from '../../src/types/custodyIssues';
import type { LinkRecord } from '../../src/types/linksLibrary';
import { auditService, type CentralAuditEntry } from '../../src/core/audit/AuditService';
import type {
  CustodyRepository,
  LinksRepository,
  NotesRepository,
} from '../../src/database/repositories/OtherRepositories';
import type { DebtRepository } from '../../src/database/repositories/DebtRepository';
import { CustodyService } from '../../src/services/custody/CustodyService';
import { DebtService } from '../../src/services/debts/DebtService';
import { KnowledgeService } from '../../src/services/knowledge/KnowledgeService';
import { LinksService } from '../../src/services/links/LinksService';
import { Outbox, type OutboxMutation } from '../../src/sync/Outbox';

const custody = (overrides: Partial<CustodyIssueRecord> = {}): CustodyIssueRecord => ({
  id: 'CUS-1001',
  section: 'custody',
  date: '2026-11-07',
  name: 'عهدة الاختبار',
  desc: 'وصف العهدة',
  cat: 'عهدة',
  pri: 'A',
  status: 'مخطط',
  resp: 'أنور',
  ...overrides,
});

const debt = (overrides: Partial<DebtRecord> = {}): DebtRecord => ({
  id: 'DEBT-1001',
  book: 'anwar',
  date: '2026-11-07',
  icon: '★',
  name: 'دين الاختبار',
  currency: 'YER',
  debit: 100,
  credit: 0,
  note: 'ملاحظة الدين',
  isCompleted: false,
  ...overrides,
});

const commitment = (overrides: Partial<DebtCommitment> = {}): DebtCommitment => ({
  id: 'COM-1001',
  name: 'التزام الاختبار',
  date: '2026-11-07',
  endDate: '2026-12-07',
  priority: 'A',
  status: 'مؤكد',
  icon: '★',
  owner: 'أنور',
  category: 'التزامات',
  amount: 100,
  currency: 'YER',
  dir: 'debit',
  payments: [],
  ...overrides,
});

const note = (overrides: Partial<NoteRecord> = {}): NoteRecord => ({
  id: 'NOTE-1001',
  title: 'ملاحظة الاختبار',
  content: 'المحتوى',
  type: 'عامة',
  category: 'عام',
  priority: 'متوسطة',
  status: 'جديدة',
  tags: [],
  folderId: 'general',
  isPinned: false,
  isFavorite: false,
  isLocked: false,
  isQuickNote: false,
  createdAt: '2026-11-07T12:00:00.000Z',
  updatedAt: '2026-11-07T12:00:00.000Z',
  ...overrides,
});

const link = (overrides: Partial<LinkRecord> = {}): LinkRecord => ({
  id: 'LNK-1001',
  siteName: 'رابط الاختبار',
  desc: 'وصف الرابط',
  url: 'https://example.test',
  type: 'موقع رسمي',
  classification: 'أعمال',
  category: 'مراجع',
  importance: 'A',
  ...overrides,
});

const createCrudRepo = <T extends { id: string }>() => ({
  getAll: vi.fn<() => T[]>(() => []),
  getById: vi.fn<(id: string) => T | null>(() => null),
  add: vi.fn<(entry: T) => T>((entry) => entry),
  update: vi.fn<(id: string, patch: Partial<T>) => T | null>(() => null),
  delete: vi.fn<(id: string) => boolean>(() => false),
});

const effectSpies = () => ({
  outbox: vi.spyOn(Outbox, 'enqueue').mockReturnValue({} as OutboxMutation),
  audit: vi.spyOn(auditService, 'log').mockReturnValue({} as CentralAuditEntry),
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('R78 — خدمة العهدة', () => {
  it('يقرأ السجل ويسجل الإنشاء والتحديث مع بدائل النص وفشل تحديث المستودع', () => {
    const raw = createCrudRepo<CustodyIssueRecord>();
    const service = new CustodyService(raw as unknown as CustodyRepository);
    const { audit, outbox } = effectSpies();
    const entry = custody();
    const saved = custody({ desc: 'محفوظ' });

    raw.getAll.mockReturnValue([entry]);
    expect(service.getAll()).toEqual([entry]);

    raw.getById.mockReturnValueOnce(null);
    raw.add.mockReturnValue(saved);
    expect(service.saveCustody(entry)).toEqual(saved);
    expect(audit).toHaveBeenLastCalledWith(
      expect.objectContaining({ action: 'Create', entity: 'CustodyRecord', recordId: entry.id })
    );
    expect(outbox).toHaveBeenLastCalledWith('CustodyRecord', 'INSERT', entry.id, entry);
    expect(raw.add).toHaveBeenCalledWith(entry);

    raw.getById.mockReturnValueOnce(null).mockReturnValueOnce(null);
    raw.add
      .mockReturnValueOnce(custody({ id: 'CUS-RESP', name: '', resp: 'صدام' }))
      .mockReturnValueOnce(custody({ id: 'CUS-EMPTY', name: '', resp: '', section: '' as never }));
    service.saveCustody(custody({ id: 'CUS-RESP', name: '', resp: 'صدام' }));
    service.saveCustody(custody({ id: 'CUS-EMPTY', name: '', resp: '', section: '' as never }));
    expect(audit).toHaveBeenLastCalledWith(expect.objectContaining({ details: expect.stringContaining('(عهدة)') }));

    raw.getById.mockReturnValue(entry);
    raw.update.mockReturnValueOnce(saved).mockReturnValueOnce(null);
    expect(service.saveCustody(entry)).toEqual(saved);
    expect(service.saveCustody(entry)).toEqual(entry);
    service.saveCustody(custody({ id: 'CUS-UPDATE-RESP', name: '', resp: 'صدام' }));
    service.saveCustody(custody({ id: 'CUS-UPDATE-EMPTY', name: '', resp: '' }));
    expect(audit).toHaveBeenLastCalledWith(expect.objectContaining({ details: 'تحديث سجل العهدة لـ ' }));
    expect(outbox).toHaveBeenLastCalledWith('CustodyRecord', 'UPDATE', 'CUS-UPDATE-EMPTY', expect.any(Object));
    expect(raw.update).toHaveBeenCalledWith(entry.id, entry);
  });

  it('لا يسجل حذف الغائب أو المرفوض، ويسجل الحذف الناجح وحده', () => {
    const raw = createCrudRepo<CustodyIssueRecord>();
    const service = new CustodyService(raw as unknown as CustodyRepository);
    const { audit, outbox } = effectSpies();
    const entry = custody();

    const respOnly = custody({ id: 'CUS-DELETE-RESP', name: '', resp: 'صدام' });
    const unnamed = custody({ id: 'CUS-DELETE-EMPTY', name: '', resp: '' });
    raw.getById
      .mockReturnValueOnce(null)
      .mockReturnValueOnce(entry)
      .mockReturnValueOnce(entry)
      .mockReturnValueOnce(respOnly)
      .mockReturnValueOnce(unnamed);
    raw.delete.mockReturnValueOnce(false).mockReturnValueOnce(true).mockReturnValueOnce(true).mockReturnValueOnce(true);
    expect(service.deleteCustody('غائب')).toBe(false);
    expect(service.deleteCustody(entry.id)).toBe(false);
    expect(service.deleteCustody(entry.id)).toBe(true);
    expect(service.deleteCustody(respOnly.id)).toBe(true);
    expect(service.deleteCustody(unnamed.id)).toBe(true);
    expect(audit).toHaveBeenCalledTimes(3);
    expect(audit).toHaveBeenLastCalledWith(
      expect.objectContaining({
        action: 'Delete',
        entity: 'CustodyRecord',
        details: 'حذف سجل العهدة: ',
        oldValue: unnamed,
      })
    );
    expect(outbox).toHaveBeenCalledWith('CustodyRecord', 'DELETE', entry.id, entry);
    expect(outbox).toHaveBeenCalledTimes(3);
    expect(raw.delete).toHaveBeenCalledTimes(4);
  });
});

describe('R78 — خدمة الديون', () => {
  it('تقرأ الديون والالتزامات وتحفظ الجديد والمحدّث مع حمولة المزامنة الصحيحة', () => {
    const raw = {
      ...createCrudRepo<DebtRecord>(),
      getCommitments: vi.fn<() => DebtCommitment[]>(() => []),
      recordPayment: vi.fn<(id: string, amount: number, date: string, notes?: string) => DebtRecord | null>(() => null),
    };
    const service = new DebtService(raw as unknown as DebtRepository);
    const { audit, outbox } = effectSpies();
    const entry = debt();
    const saved = debt({ note: 'محفوظ' });

    raw.getAll.mockReturnValue([entry]);
    raw.getCommitments.mockReturnValue([commitment()]);
    expect(service.getAll()).toEqual([entry]);
    expect(service.getCommitments()).toEqual([commitment()]);

    raw.getById.mockReturnValueOnce(null).mockReturnValueOnce(null);
    raw.add.mockReturnValueOnce(saved).mockReturnValueOnce(debt({ id: 'DEBT-CREDIT', debit: 0, credit: 20 }));
    expect(service.saveDebt(entry)).toEqual(saved);
    expect(service.saveDebt(debt({ id: 'DEBT-CREDIT', debit: 0, credit: 20 }))).toMatchObject({ credit: 20 });
    expect(audit).toHaveBeenLastCalledWith(
      expect.objectContaining({ action: 'Create', entity: 'DebtRecord', details: expect.stringContaining('20') })
    );
    expect(outbox).toHaveBeenLastCalledWith('DebtRecord', 'INSERT', 'DEBT-CREDIT', expect.any(Object));
    expect(raw.add).toHaveBeenCalledWith(entry);

    raw.getById.mockReturnValue(entry);
    raw.update.mockReturnValueOnce(saved).mockReturnValueOnce(null);
    expect(service.saveDebt(entry)).toEqual(saved);
    expect(service.saveDebt(entry)).toEqual(entry);
    expect(outbox).toHaveBeenLastCalledWith('DebtRecord', 'UPDATE', entry.id, entry);
    expect(raw.update).toHaveBeenCalledWith(entry.id, entry);
  });

  it('لا يكتب الحذف المرفوض، ويمرر سداداً ناجحاً فقط إلى طابور المزامنة', () => {
    const raw = {
      ...createCrudRepo<DebtRecord>(),
      getCommitments: vi.fn<() => DebtCommitment[]>(() => []),
      recordPayment: vi.fn<(id: string, amount: number, date: string, notes?: string) => DebtRecord | null>(() => null),
    };
    const service = new DebtService(raw as unknown as DebtRepository);
    const { audit, outbox } = effectSpies();
    const entry = debt();
    const paid = debt({ credit: 50 });

    raw.getById.mockReturnValueOnce(null).mockReturnValueOnce(entry).mockReturnValueOnce(entry);
    raw.delete.mockReturnValueOnce(false).mockReturnValueOnce(true);
    expect(service.deleteDebt('غائب')).toBe(false);
    expect(service.deleteDebt(entry.id)).toBe(false);
    expect(service.deleteDebt(entry.id)).toBe(true);
    expect(audit).toHaveBeenCalledTimes(1);
    expect(outbox).toHaveBeenLastCalledWith('DebtRecord', 'DELETE', entry.id, entry);
    expect(outbox).toHaveBeenCalledTimes(1);
    expect(raw.delete).toHaveBeenCalledTimes(2);

    raw.recordPayment.mockReturnValueOnce(null).mockReturnValueOnce(paid);
    expect(service.settlePayment(entry.id, 50, '2026-11-07', 'سداد')).toBeNull();
    expect(outbox).toHaveBeenCalledTimes(1);
    expect(service.settlePayment(entry.id, 50, '2026-11-07', 'سداد')).toEqual(paid);
    expect(outbox).toHaveBeenLastCalledWith('DebtRecord', 'UPDATE', entry.id, paid);
    expect(outbox).toHaveBeenCalledTimes(2);
    expect(raw.recordPayment).toHaveBeenLastCalledWith(entry.id, 50, '2026-11-07', 'سداد');
  });
});

describe('R78 — خدمة المعرفة', () => {
  it('تقرأ الملاحظة وتسجل الإنشاء والتحديث حتى عندما يعيد المستودع null', () => {
    const raw = createCrudRepo<NoteRecord>();
    const service = new KnowledgeService(raw as unknown as NotesRepository);
    const { audit, outbox } = effectSpies();
    const entry = note();
    const saved = note({ title: 'محفوظة' });

    raw.getAll.mockReturnValue([entry]);
    expect(service.getAll()).toEqual([entry]);
    expect(service.getById(entry.id)).toBeNull();

    raw.getById.mockReturnValueOnce(null);
    raw.add.mockReturnValue(saved);
    expect(service.saveNote(entry)).toEqual(saved);
    expect(audit).toHaveBeenLastCalledWith(
      expect.objectContaining({ action: 'Create', entity: 'Note', newValue: entry })
    );
    expect(outbox).toHaveBeenLastCalledWith('Note', 'INSERT', entry.id, entry);
    expect(raw.add).toHaveBeenCalledWith(entry);

    raw.getById.mockReturnValue(entry);
    raw.update.mockReturnValueOnce(saved).mockReturnValueOnce(null);
    expect(service.saveNote(entry)).toEqual(saved);
    expect(service.saveNote(entry)).toEqual(entry);
    expect(outbox).toHaveBeenLastCalledWith('Note', 'UPDATE', entry.id, entry);
    expect(raw.update).toHaveBeenCalledWith(entry.id, entry);
  });

  it('يرفض الحذف الغائب أو الفاشل ثم يوثق ويحزم الحذف الناجح', () => {
    const raw = createCrudRepo<NoteRecord>();
    const service = new KnowledgeService(raw as unknown as NotesRepository);
    const { audit, outbox } = effectSpies();
    const entry = note();

    raw.getById.mockReturnValueOnce(null).mockReturnValueOnce(entry).mockReturnValueOnce(entry);
    raw.delete.mockReturnValueOnce(false).mockReturnValueOnce(true);
    expect(service.deleteNote('غائب')).toBe(false);
    expect(service.deleteNote(entry.id)).toBe(false);
    expect(service.deleteNote(entry.id)).toBe(true);
    expect(audit).toHaveBeenCalledTimes(1);
    expect(audit).toHaveBeenLastCalledWith(
      expect.objectContaining({ action: 'Delete', entity: 'Note', details: expect.stringContaining(entry.title) })
    );
    expect(outbox).toHaveBeenCalledWith('Note', 'DELETE', entry.id, entry);
    expect(outbox).toHaveBeenCalledTimes(1);
    expect(raw.delete).toHaveBeenCalledTimes(2);
  });
});

describe('R78 — خدمة الروابط', () => {
  it('تقرأ الرابط وتسجل الإنشاء والتحديث مع بدائل اسم الرابط وفشل التحديث', () => {
    const raw = createCrudRepo<LinkRecord>();
    const service = new LinksService(raw as unknown as LinksRepository);
    const { audit, outbox } = effectSpies();
    const entry = link();
    const saved = link({ desc: 'محفوظ' });

    raw.getAll.mockReturnValue([entry]);
    expect(service.getAll()).toEqual([entry]);
    expect(service.getById(entry.id)).toBeNull();

    raw.getById.mockReturnValueOnce(null).mockReturnValueOnce(null).mockReturnValueOnce(null);
    raw.add
      .mockReturnValueOnce(saved)
      .mockReturnValueOnce(link({ id: 'LNK-DESC', siteName: '', desc: 'وصف بديل' }))
      .mockReturnValueOnce(link({ id: 'LNK-EMPTY', siteName: '', desc: '' }));
    expect(service.saveLink(entry)).toEqual(saved);
    service.saveLink(link({ id: 'LNK-DESC', siteName: '', desc: 'وصف بديل' }));
    service.saveLink(link({ id: 'LNK-EMPTY', siteName: '', desc: '' }));
    expect(audit).toHaveBeenLastCalledWith(expect.objectContaining({ details: expect.stringContaining(': ') }));
    expect(outbox).toHaveBeenLastCalledWith('Link', 'INSERT', 'LNK-EMPTY', expect.any(Object));
    expect(raw.add).toHaveBeenCalledWith(entry);

    raw.getById.mockReturnValue(entry);
    raw.update.mockReturnValueOnce(saved).mockReturnValueOnce(null);
    expect(service.saveLink(entry)).toEqual(saved);
    expect(service.saveLink(entry)).toEqual(entry);
    service.saveLink(link({ id: 'LNK-UPDATE-DESC', siteName: '', desc: 'وصف محدث' }));
    service.saveLink(link({ id: 'LNK-UPDATE-EMPTY', siteName: '', desc: '' }));
    expect(audit).toHaveBeenLastCalledWith(expect.objectContaining({ details: 'تحديث الرابط: ' }));
    expect(outbox).toHaveBeenLastCalledWith('Link', 'UPDATE', 'LNK-UPDATE-EMPTY', expect.any(Object));
    expect(raw.update).toHaveBeenCalledWith(entry.id, entry);
  });

  it('لا ينشئ أثراً لحذف مرفوض، ويكتب التدقيق والطابور للحذف الناجح', () => {
    const raw = createCrudRepo<LinkRecord>();
    const service = new LinksService(raw as unknown as LinksRepository);
    const { audit, outbox } = effectSpies();
    const entry = link();

    const descOnly = link({ id: 'LNK-DELETE-DESC', siteName: '', desc: 'وصف الحذف' });
    const unnamed = link({ id: 'LNK-DELETE-EMPTY', siteName: '', desc: '' });
    raw.getById
      .mockReturnValueOnce(null)
      .mockReturnValueOnce(entry)
      .mockReturnValueOnce(entry)
      .mockReturnValueOnce(descOnly)
      .mockReturnValueOnce(unnamed);
    raw.delete.mockReturnValueOnce(false).mockReturnValueOnce(true).mockReturnValueOnce(true).mockReturnValueOnce(true);
    expect(service.deleteLink('غائب')).toBe(false);
    expect(service.deleteLink(entry.id)).toBe(false);
    expect(service.deleteLink(entry.id)).toBe(true);
    expect(service.deleteLink(descOnly.id)).toBe(true);
    expect(service.deleteLink(unnamed.id)).toBe(true);
    expect(audit).toHaveBeenCalledTimes(3);
    expect(audit).toHaveBeenLastCalledWith(
      expect.objectContaining({ action: 'Delete', entity: 'Link', details: 'حذف الرابط: ', oldValue: unnamed })
    );
    expect(outbox).toHaveBeenCalledWith('Link', 'DELETE', entry.id, entry);
    expect(outbox).toHaveBeenCalledTimes(3);
    expect(raw.delete).toHaveBeenCalledTimes(4);
  });
});
