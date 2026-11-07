import { LinkRecord } from '../../types';
import { linksRepository, LinksRepository } from '../../database/repositories/OtherRepositories';
import { auditService } from '../../core/audit/AuditService';
import { Outbox } from '../../sync/Outbox';

export class LinksService {
  private repo: LinksRepository;

  constructor(repo: LinksRepository = linksRepository) {
    this.repo = repo;
  }

  public getAll(): LinkRecord[] {
    return this.repo.getAll();
  }

  public getById(id: string): LinkRecord | null {
    return this.repo.getById(id);
  }

  public saveLink(link: LinkRecord): LinkRecord {
    const isNew = !this.repo.getById(link.id);
    let saved: LinkRecord;

    if (isNew) {
      saved = this.repo.add(link);
      auditService.log({
        action: 'Create',
        entity: 'Link',
        recordId: link.id,
        details: `إضافة رابط/أداة جديدة: ${link.siteName || link.desc || ''}`,
        newValue: link,
      });
      Outbox.enqueue('Link', 'INSERT', link.id, link);
    } else {
      const old = this.repo.getById(link.id);
      saved = this.repo.update(link.id, link) || link;
      auditService.log({
        action: 'Update',
        entity: 'Link',
        recordId: link.id,
        details: `تحديث الرابط: ${link.siteName || link.desc || ''}`,
        oldValue: old,
        newValue: link,
      });
      Outbox.enqueue('Link', 'UPDATE', link.id, link);
    }

    return saved;
  }

  public deleteLink(id: string): boolean {
    const old = this.repo.getById(id);
    if (!old) return false;

    const res = this.repo.delete(id);
    if (res) {
      auditService.log({
        action: 'Delete',
        entity: 'Link',
        recordId: id,
        details: `حذف الرابط: ${old.siteName || old.desc || ''}`,
        oldValue: old,
      });
      Outbox.enqueue('Link', 'DELETE', id, old);
    }
    return res;
  }
}

export const linksService = new LinksService();
