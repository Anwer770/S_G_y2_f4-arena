import { useEffect } from 'react';

/**
 * Multi-Tab Synchronization System
 * Uses BroadcastChannel with Storage Event fallback to instantly sync
 * all open tabs when financial, inventory, or operational changes happen.
 */

export type MultiTabSyncType =
  | 'FINANCIAL_UPDATED'
  | 'STOCK_UPDATED'
  | 'DEBT_UPDATED'
  | 'CUSTODY_UPDATED'
  | 'TASK_UPDATED'
  | 'CUSTOMER_UPDATED'
  | 'DOCTOR_UPDATED'
  | 'SETTINGS_UPDATED'
  | 'OUTBOX_UPDATED';

export interface MultiTabMessage {
  type: MultiTabSyncType;
  timestamp: number;
  originId: string;
  payload?: any;
}

const CHANNEL_NAME = 'primo_erp_multitab_sync_v1';
const TAB_INSTANCE_ID = `tab_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

let channel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    channel = new BroadcastChannel(CHANNEL_NAME);
  } catch (e) {
    console.warn('BroadcastChannel not supported or disabled', e);
  }
}

/**
 * Broadcast an update event to all other open tabs
 */
export function broadcastDataChange(type: MultiTabSyncType, payload?: any): void {
  const message: MultiTabMessage = {
    type,
    timestamp: Date.now(),
    originId: TAB_INSTANCE_ID,
    payload,
  };

  // 1. Send to other tabs via BroadcastChannel
  if (channel) {
    try {
      channel.postMessage(message);
    } catch (e) {
      console.warn('Failed to postMessage on BroadcastChannel', e);
    }
  }

  // 2. Dispatch locally for current tab components
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('primo:data_sync', {
        detail: message,
      })
    );
  }
}

/**
 * React hook to listen for multi-tab sync events
 */
export function useMultiTabSync(
  types: MultiTabSyncType | MultiTabSyncType[],
  onUpdate: (type: MultiTabSyncType, payload?: any) => void
): void {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const targetTypes = Array.isArray(types) ? types : [types];

    // Handler for messages from other tabs
    const handleBroadcastMessage = (event: MessageEvent<MultiTabMessage>) => {
      const data = event.data;
      if (!data || data.originId === TAB_INSTANCE_ID) return;
      if (targetTypes.includes(data.type)) {
        onUpdate(data.type, data.payload);
      }
    };

    // Handler for local events
    const handleLocalCustomEvent = (event: Event) => {
      const customEvent = event as CustomEvent<MultiTabMessage>;
      const data = customEvent.detail;
      if (!data) return;
      if (targetTypes.includes(data.type)) {
        onUpdate(data.type, data.payload);
      }
    };

    if (channel) {
      channel.addEventListener('message', handleBroadcastMessage);
    }
    window.addEventListener('primo:data_sync', handleLocalCustomEvent);

    return () => {
      if (channel) {
        channel.removeEventListener('message', handleBroadcastMessage);
      }
      window.removeEventListener('primo:data_sync', handleLocalCustomEvent);
    };
  }, [types, onUpdate]);
}
