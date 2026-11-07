import { indexedDBStorage } from '../database/adapters/IndexedDBAdapter';
import { auditService } from '../core/audit/AuditService';

export interface OutboxMutation {
  id: string;
  deviceId: string;
  entity: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  recordId: string;
  payload: any;
  timestamp: number;
  retryCount: number;
  status: 'PENDING' | 'SYNCING' | 'FAILED' | 'RESOLVED';
}

const OUTBOX_KEY = 'suite_sync_outbox_v1';
/**
 * سقف حجم الطابور: بلا سقف كانت كل كتابة تُضيف نسخة كاملة من السجل وتُعيد كتابة
 * المصفوفة كلها (تكلفة تراكمية + تضخّم تخزين غير محدود) ولا يوجد مُفرِّغ لأن
 * طبقة المزامنة غير مربوطة بخادم. عند تجاوز السقف تُحذف الأقدم (FIFO) مع تسجيل
 * عدد المُسقَط في مفتاح مستقل + سجل تدقيق حتى لا يحدث أي إسقاط صامت.
 */
const OUTBOX_DROPPED_KEY = 'suite_sync_outbox_dropped_v1';
const OUTBOX_MAX_ENTRIES = 2000;

export class Outbox {
  public static enqueue(
    entity: string,
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    recordId: string,
    payload: any
  ): OutboxMutation {
    const mutation: OutboxMutation = {
      id: `mut_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      deviceId: auditService.getDeviceId(),
      entity,
      operation,
      recordId,
      payload,
      timestamp: Date.now(),
      retryCount: 0,
      status: 'PENDING',
    };

    let queue = Outbox.getAll();
    queue.push(mutation);

    if (queue.length > OUTBOX_MAX_ENTRIES) {
      const overflow = queue.length - OUTBOX_MAX_ENTRIES;
      queue = queue.slice(overflow); // نُبقي الأحدث
      Outbox.recordDropped(overflow);
    }

    indexedDBStorage.setItemSync(OUTBOX_KEY, queue);
    return mutation;
  }

  public static getAll(): OutboxMutation[] {
    const data = indexedDBStorage.getItemSync<OutboxMutation[]>(OUTBOX_KEY);
    return Array.isArray(data) ? data : [];
  }

  public static remove(mutationId: string): void {
    const queue = Outbox.getAll().filter((m) => m.id !== mutationId);
    indexedDBStorage.setItemSync(OUTBOX_KEY, queue);
  }

  public static markFailed(mutationId: string): void {
    const queue = Outbox.getAll().map((m) =>
      m.id === mutationId ? { ...m, status: 'FAILED' as const, retryCount: m.retryCount + 1 } : m
    );
    indexedDBStorage.setItemSync(OUTBOX_KEY, queue);
  }

  public static clear(): void {
    indexedDBStorage.setItemSync(OUTBOX_KEY, []);
  }

  public static count(): number {
    return Outbox.getAll().length;
  }

  /** عدد العناصر المُسقَطة بسبب تجاوز السقف (مراقبة/تشخيص — لا يحذف بيانات المستخدم) */
  public static getDroppedCount(): number {
    const value = indexedDBStorage.getItemSync<number>(OUTBOX_DROPPED_KEY);
    return typeof value === 'number' && value > 0 ? value : 0;
  }

  /** أقصى عدد عناصر يُحتفظ به في الطابور */
  public static maxEntries(): number {
    return OUTBOX_MAX_ENTRIES;
  }

  private static recordDropped(count: number): void {
    const total = Outbox.getDroppedCount() + count;
    indexedDBStorage.setItemSync(OUTBOX_DROPPED_KEY, total);
    console.warn(
      `Outbox: dropped ${count} oldest mutation(s) — queue capped at ${OUTBOX_MAX_ENTRIES}. ` +
        `Total dropped so far: ${total}. (لا يوجد مُفرِّغ للمزامنة؛ البيانات الأصلية محفوظة في مخازنها)`
    );
    auditService.log({
      action: 'Delete',
      entity: 'SyncOutboxTrim',
      details: `تم إسقاط ${count} عملية قديمة من طابور المزامنة لتجاوز السقف (${OUTBOX_MAX_ENTRIES}). الإجمالي: ${total}`,
    });
  }
}
