// Utility for cross-platform OS Notifications (macOS Notification Center, Windows Action Center, Android Chrome, iOS Web App)

let audioContext: AudioContext | null = null;
let swRegistrationPromise: Promise<ServiceWorkerRegistration | null> | null = null;

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  if (!swRegistrationPromise) {
    swRegistrationPromise = navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        console.log('[CodeShastra SW] Service Worker active for OS notifications');
        return reg;
      })
      .catch((err) => {
        console.warn('[CodeShastra SW] Registration failed:', err);
        return null;
      });
  }
  return swRegistrationPromise;
}

export function playNotificationChime() {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    if (!audioContext || audioContext.state === 'suspended') {
      audioContext = new AudioCtx();
    }
    if (audioContext.state === 'suspended') {
      audioContext.resume().catch(() => {});
    }

    const now = audioContext.currentTime;
    
    // Note 1: High crisp bell (D6 = 1174.66Hz)
    const osc1 = audioContext.createOscillator();
    const gain1 = audioContext.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now);
    osc1.frequency.exponentialRampToValueAtTime(1174.66, now + 0.12);
    
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain1);
    gain1.connect(audioContext.destination);

    osc1.start(now);
    osc1.stop(now + 0.36);

    // Note 2: Harmonic shimmer (F#6 = 1479.98Hz)
    const osc2 = audioContext.createOscillator();
    const gain2 = audioContext.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1479.98, now + 0.08);

    gain2.gain.setValueAtTime(0.12, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc2.connect(gain2);
    gain2.connect(audioContext.destination);

    osc2.start(now + 0.08);
    osc2.stop(now + 0.46);
  } catch {
    // Gracefully ignore audio autoplay restrictions
  }
}

export async function requestDeviceNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }

  // Pre-register service worker in background
  registerServiceWorker().catch(() => {});

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  try {
    // Standard Promise-based API with callback fallback for older WebKit/Safari
    let permission: NotificationPermission;
    try {
      permission = await Notification.requestPermission();
    } catch {
      permission = await new Promise<NotificationPermission>((resolve) => {
        Notification.requestPermission((p) => resolve(p));
      });
    }

    if (permission === 'granted') {
      playNotificationChime();
    }
    return permission;
  } catch (err) {
    // In Safari/iOS, calling without an immediate synchronous user gesture throws a NotAllowedError
    return Notification.permission;
  }
}

// Lightweight debounce to prevent multiple triggers in the exact same millisecond burst
let lastDispatchTime = 0;
let lastDispatchSlug = '';

export function triggerSystemNotification(item: {
  id?: string;
  subject?: string;
  body?: string;
  salutation?: string;
  category?: string;
  url?: string;
}) {
  if (typeof window === 'undefined') return;

  const rawTitle = item.subject || 'CodeShastra Notice';
  const cleanBody = item.body
    ? item.body.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 180)
    : 'You have a new update on CodeShastra Hub.';

  const now = Date.now();
  const slug = `${rawTitle}::${cleanBody.slice(0, 40)}`;

  // Debounce rapid bursts within 1.5 seconds
  if (slug === lastDispatchSlug && now - lastDispatchTime < 1500) {
    return;
  }
  lastDispatchTime = now;
  lastDispatchSlug = slug;

  // 1. Play audio chime
  playNotificationChime();

  // 2. Check Notification API & Permission
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  const title = rawTitle.startsWith('CodeShastra') ? rawTitle : `CodeShastra: ${rawTitle}`;
  const origin = window.location.origin;
  const iconUrl = `${origin}/favicon.ico`;

  const notifOptions: NotificationOptions = {
    body: cleanBody,
    icon: iconUrl,
    badge: iconUrl,
    tag: `cs-${item.id || now}`,
    data: {
      url: item.url || '/notifications',
    },
    silent: false,
  };

  console.log('[CodeShastra Notification] 🚀 Pushing OS Notification to System:', { title, body: cleanBody });

  // 1. Dispatch via Service Worker Registration (Required by Chrome on macOS/Android for persistent OS toasts)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (reg && typeof reg.showNotification === 'function') {
        reg.showNotification(title, notifOptions).catch((err) => {
          console.warn('[CodeShastra Notification] SW showNotification failed:', err);
        });
      }
    }).catch(() => {});
  }

  // 2. Direct window.Notification (Immediate native OS banner fallback on desktop)
  try {
    const notif = new Notification(title, notifOptions);
    notif.onclick = (event) => {
      event.preventDefault();
      window.focus();
      if (item.url) {
        window.location.href = item.url;
      }
      notif.close();
    };
  } catch (err) {
    // Gracefully handle environments where Notification constructor is restricted
  }
}



