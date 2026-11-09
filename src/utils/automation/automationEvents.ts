/**
 * ناقل أحداث المجال (R31) — وحدة ورقية بلا أي اعتمادية داخلية:
 * لا React ولا تخزين ولا منطق أعمال، لذلك يمكن استيرادها من أي طبقة بلا دورة استيراد.
 *
 * القاعدة: من يكتب بيانات يُنشر حدثاً؛ من يريد أن يتفاعل يشترك.
 */
import type { DomainEvent, DomainEventInput, DomainEventOrigin } from './automationTypes';

type Listener = (event: DomainEvent) => void;

const listeners = new Set<Listener>();
let sequence = 0;
let suppressed = 0;

/** ينشر حدثاً جديداً ويُعيد الحدث الكامل (المعرّف والوقت يُملآن هنا). */
export function publishDomainEvent(input: DomainEventInput): DomainEvent {
  sequence += 1;
  const event: DomainEvent = {
    ...input,
    id: `evt_${Date.now()}_${sequence}`,
    at: new Date().toISOString(),
    origin: input.origin ?? (suppressed > 0 ? 'automation' : 'user'),
  };

  for (const listener of [...listeners]) {
    try {
      listener(event);
    } catch (err) {
      // مستمع ساقط لا يُسقط كاتب البيانات أبداً
      console.warn('automation: listener failed', err);
    }
  }

  return event;
}

/** يشترك في كل الأحداث ويعيد دالة إلغاء الاشتراك. */
export function subscribeDomainEvents(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function clearDomainEventListeners(): void {
  listeners.clear();
}

export function countDomainEventListeners(): number {
  return listeners.size;
}

/**
 * ينفّذ عملية تُصدر أحداثاً «من محرّك الأتمتة نفسه».
 * الأحداث الصادرة داخلها تُوسَم `origin: 'automation'` فلا يعالجها المشغّل مرة أخرى
 * (حماية من الحلقة اللانهائية: مهمة متابعة تُنشئ مهمة متابعة…).
 */
export function withAutomationOrigin<T>(fn: () => T): T {
  suppressed += 1;
  try {
    return fn();
  } finally {
    suppressed -= 1;
  }
}

/** أصل الحدث الحالي (للاختبارات والتشخيص). */
export function isSuppressingEvents(): boolean {
  return suppressed > 0;
}

export type { DomainEventOrigin };
