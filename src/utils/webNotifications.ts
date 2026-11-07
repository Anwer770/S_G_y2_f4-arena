/**
 * Web Notifications Helper
 * Provides native desktop/mobile push notification capability
 * for due debts, upcoming tasks, and critical financial alerts.
 */

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (e) {
    console.warn('Error requesting notification permission:', e);
    return false;
  }
}

export function sendSystemNotification(
  title: string,
  options?: {
    body?: string;
    icon?: string;
    badge?: string;
    tag?: string;
    data?: any;
    requireInteraction?: boolean;
  }
): boolean {
  if (!isNotificationSupported()) return false;
  if (Notification.permission !== 'granted') return false;

  try {
    const defaultOptions: NotificationOptions = {
      icon: '/pwa-192x192.png',
      badge: '/icon.svg',
      dir: 'rtl',
      lang: 'ar',
      ...options,
    };

    // If service worker is active, show via service worker
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, defaultOptions);
      });
      return true;
    }

    // Direct browser notification
    new Notification(title, defaultOptions);
    return true;
  } catch (err) {
    console.warn('Failed to send notification:', err);
    return false;
  }
}
