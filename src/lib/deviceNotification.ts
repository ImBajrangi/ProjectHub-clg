// Utility for cross-platform OS Notifications (macOS Notification Center, Windows Toast, Android Chrome, iOS Web App)

let audioContext: AudioContext | null = null;

export function playNotificationChime() {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    if (!audioContext || audioContext.state === 'suspended') {
      audioContext = new AudioCtx();
    }
    if (audioContext.state === 'suspended') {
      audioContext.resume();
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

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // Play a quick test confirmation chime so user knows it's active
      playNotificationChime();
    }
    return permission;
  } catch (err) {
    console.warn('Error requesting notification permission:', err);
    return Notification.permission;
  }
}

// Global in-memory cache to prevent duplicate dispatches within 15 seconds
const recentDispatches = new Map<string, number>();

function isDuplicateDispatch(key: string, cooldownMs = 15000): boolean {
  const now = Date.now();
  const lastTime = recentDispatches.get(key);
  if (lastTime && now - lastTime < cooldownMs) {
    return true;
  }
  recentDispatches.set(key, now);
  // Clean up old entries
  if (recentDispatches.size > 200) {
    for (const [k, time] of recentDispatches.entries()) {
      if (now - time > cooldownMs) {
        recentDispatches.delete(k);
      }
    }
  }
  return false;
}

export async function triggerSystemNotification(item: {
  id: string;
  subject?: string;
  body?: string;
  salutation?: string;
  category?: string;
  url?: string;
}) {
  if (typeof window === 'undefined') return;

  const rawTitle = item.subject || 'CodeShastra Notice';
  const cleanBody = item.body
    ? item.body.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160)
    : 'You have a new update on CodeShastra Hub.';

  // Deduplicate by ID and by content signature (prevents optimistic ID vs DB UUID duplicate popups)
  const contentSignature = `${rawTitle.trim()}::${cleanBody.slice(0, 60)}`;
  if (isDuplicateDispatch(String(item.id)) || isDuplicateDispatch(contentSignature)) {
    console.log('[CodeShastra Notification] 🛡️ Suppressed duplicate notification:', rawTitle);
    return;
  }

  // 1. Play acoustic notification chime (once per genuine notification)
  playNotificationChime();

  // 2. Verify browser Notification support
  if (!('Notification' in window)) {
    console.warn('[CodeShastra Notification] Notification API not supported on this platform');
    return;
  }

  let permission = Notification.permission;
  if (permission === 'default') {
    try {
      permission = await Notification.requestPermission();
    } catch {
      permission = 'default';
    }
  }

  if (permission !== 'granted') {
    return;
  }

  const title = `CodeShastra: ${rawTitle.replace(/^CodeShastra:\s*/i, '')}`;
  const origin = window.location.origin;
  const iconUrl = `${origin}/favicon.ico`;

  // Deterministic OS tag: collapses any duplicate at the OS / macOS Notification Center level
  const cleanTagSlug = (item.id.startsWith('temp-') ? rawTitle : item.id)
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 40);

  const notifOptions: NotificationOptions = {
    body: cleanBody,
    icon: iconUrl,
    badge: iconUrl,
    tag: `cs-${cleanTagSlug}`,
    data: {
      url: item.url || '/dashboard/leader',
    },
    requireInteraction: false,
    silent: false,
  };

  console.log('[CodeShastra Notification] 🚀 Dispatching single OS notification:', { title, tag: notifOptions.tag });

  // METHOD 1: Primary Service Worker showNotification
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && typeof reg.showNotification === 'function') {
        await reg.showNotification(title, notifOptions);
        console.log('[CodeShastra Notification] ✅ Notification shown via ServiceWorker');
        return; // IMPORTANT: Return immediately so Method 2 is NOT called!
      }
    } catch (err) {
      console.warn('[CodeShastra Notification] ⚠️ ServiceWorker fallback to direct Notification:', err);
    }
  }

  // METHOD 2: Fallback direct Notification constructor (ONLY if Service Worker failed/unsupported)
  try {
    const notif = new Notification(title, notifOptions);
    notif.onclick = () => {
      window.focus();
      if (item.url) {
        window.location.href = item.url;
      }
      notif.close();
    };
    console.log('[CodeShastra Notification] ✅ Notification shown via direct constructor');
  } catch (err) {
    console.warn('[CodeShastra Notification] ⚠️ Direct Notification error:', err);
  }
}


