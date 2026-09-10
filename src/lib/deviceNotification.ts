export async function triggerSystemNotification(item: {
  id: string;
  subject?: string;
  body?: string;
  salutation?: string;
  category?: string;
  url?: string;
}) {
  if (typeof window === 'undefined') return;

  // Verify notification support and permission
  if (!('Notification' in window)) {
    console.warn('System notifications not supported in this environment');
    return;
  }

  if (Notification.permission !== 'granted') {
    return;
  }

  const cleanBody = item.body
    ? item.body.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160)
    : 'You have a new update on CodeShastra Hub.';

  const title = item.subject
    ? `CodeShastra: ${item.subject}`
    : 'CodeShastra ProjectHub Notification';

  const notifOptions: NotificationOptions = {
    body: cleanBody,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: `codeshastra-${item.id}`,
    data: {
      url: item.url || '/dashboard/leader',
    },
    requireInteraction: false,
    silent: false,
  };

  // Method 1: Active Service Worker Registration (Highest reliability on macOS, Windows & Mobile)
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && typeof reg.showNotification === 'function') {
        await reg.showNotification(title, notifOptions);
        return;
      }
    } catch (err) {
      console.warn('Service worker showNotification fallback:', err);
    }
  }

  // Method 2: Native Window Notification Constructor
  try {
    const notif = new Notification(title, notifOptions);
    notif.onclick = () => {
      window.focus();
      notif.close();
    };
  } catch (err) {
    console.error('Direct Notification constructor failed:', err);
  }
}
