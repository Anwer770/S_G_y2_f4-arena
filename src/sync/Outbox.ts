import { indexedDBStorage } from '../database/adapters/IndexedDBAdapter';
import { auditService } from '../core/audit/AuditService';

export interface OutboxMutation {
  id: string;
  deviceId: string;
  entity: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  recordId: string;
  payload: unknown;
  timestamp: number;
  retryCount: number;
  status: 'PENDING' | 'SYNCING' | 'FAILED' | 'RESOLVED';
  /** تفصيل فشل محفوظ من واجهة الطابور القديمة، إن وجد. */
  error?: string;
}

export interface OutboxMutationInput {
  entity: string;
  operation: OutboxMutation['operation'];
  recordId: string;
  payload?: unknown;
}

/** مصدر الحقيقة الوحيد لطابور المزامنة (R62). */
export const OUTBOX_STORAGE_KEY = 'suite_sync_outbox_v1';
/** عدّاد مراقبة: لا تمسّ بيانات المستخدم الأصلية عند قص سجل المزامنة. */
export const OUTBOX_DROPPED_STORAGE_KEY = 'suite_sync_outbox_dropped_v1';
/** سقف حفظ السجل؛ الأحدث يبقى عند تجاوز السعة. */
export const OUTBOX_MAX_ENTRIES = 2000;

/**
 * طابور المزامنة المحلي.
 *
 * السجل لا يحل محل بيانات المستخدم، بل يصف عمليات ستُرسل عند وجود خادم. لهذا يبقى
 * محدوداً، ويُسجّل أي قص صريحاً. `enqueueMany` يكتب مرة واحدة للاستيراد والحذف
 * الجماعي بدلاً من قراءة/تسلسل/كتابة المصفوفة كاملةً لكل صف.
 */
export class Outbox {
  public static enqueue(
    entity: string,
    operation: OutboxMutation['operation'],
    recordId: string,
    payload?: unknown
  ): OutboxMutation {
    return Outbox.enqueueMany([{ entity, operation, recordId, payload }])[0]!;
  }

  /** يضيف دفعة عمليات في قراءة وكتابة واحدة، مع حفظ ترتيب الإدخال. */
  public static enqueueMany(inputs: readonly OutboxMutationInput[]): OutboxMutation[] {
    if (inputs.length === 0) return [];

    const mutations = inputs.map((input) => Outbox.createMutation(input));
    let queue = [...Outbox.getAll(), ...mutations];

    if (queue.length > OUTBOX_MAX_ENTRIES) {
      const overflow = queue.length - OUTBOX_MAX_ENTRIES;
      queue = queue.slice(overflow);
      Outbox.recordDropped(overflow);
    }

    Outbox.write(queue);
    return mutations;
  }

  public static getAll(): OutboxMutation[] {
    const data = indexedDBStorage.getItemSync<OutboxMutation[]>(OUTBOX_STORAGE_KEY);
    return Array.isArray(data) ? data : [];
  }

  /** يستبدل السجل بالبيانات المهاجرة/الإدارية مع إعلان أي قص مثل الإضافة العادية. */
  public static replaceAll(mutations: readonly OutboxMutation[]): void {
    const overflow = Math.max(0, mutations.length - OUTBOX_MAX_ENTRIES);
    if (overflow > 0) Outbox.recordDropped(overflow);
    Outbox.write(overflow > 0 ? mutations.slice(overflow) : [...mutations]);
  }

  public static remove(mutationId: string): void {
    Outbox.write(Outbox.getAll().filter((mutation) => mutation.id !== mutationId));
  }

  public static markFailed(mutationId: string): void {
    Outbox.write(
      Outbox.getAll().map((mutation) =>
        mutation.id === mutationId
          ? { ...mutation, status: 'FAILED' as const, retryCount: mutation.retryCount + 1 }
          : mutation
      )
    );
  }

  public static markResolved(mutationId: string): void {
    Outbox.write(
      Outbox.getAll().map((mutation) =>
        mutation.id === mutationId ? { ...mutation, status: 'RESOLVED' as const } : mutation
      )
    );
  }

  public static markAllResolved(): void {
    Outbox.write(Outbox.getAll().map((mutation) => ({ ...mutation, status: 'RESOLVED' as const })));
  }

  public static clearResolved(): void {
    Outbox.write(Outbox.getAll().filter((mutation) => mutation.status !== 'RESOLVED'));
  }

  public static clear(): void {
    Outbox.write([]);
  }

  public static count(): number {
    return Outbox.getAll().length;
  }

  /** عدد العناصر المُسقَطة بسبب تجاوز السقف (مراقبة/تشخيص — لا يحذف بيانات المستخدم) */
  public static getDroppedCount(): number {
    const value = indexedDBStorage.getItemSync<number>(OUTBOX_DROPPED_STORAGE_KEY);
    return typeof value === 'number' && value > 0 ? value : 0;
  }

  /** أقصى عدد عناصر يُحتفظ به في الطابور */
  public static maxEntries(): number {
    return OUTBOX_MAX_ENTRIES;
  }

  private static createMutation(input: OutboxMutationInput): OutboxMutation {
    return {
      id: `mut_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      deviceId: auditService.getDeviceId(),
      entity: input.entity,
      operation: input.operation,
      recordId: input.recordId,
      payload: input.payload,
      timestamp: Date.now(),
      retryCount: 0,
      status: 'PENDING',
    };
  }

  private static write(mutations: OutboxMutation[]): void {
    indexedDBStorage.setItemSync(OUTBOX_STORAGE_KEY, mutations);
  }

  private static recordDropped(count: number): void {
    const total = Outbox.getDroppedCount() + count;
    indexedDBStorage.setItemSync(OUTBOX_DROPPED_STORAGE_KEY, total);
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
