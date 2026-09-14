/**
 * CodeShastra Client-Side Session & Auth Cache
 * Strictly caches active user session token / profile only.
 * Business and operational data (teams, meetings, notifications, panels, admin)
 * are NEVER cached to guarantee 100% real-time accuracy directly with Supabase.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

const memoryFallback = new Map<string, CacheEntry<any>>();

// Clear legacy stale business data caches on initialization
if (typeof window !== 'undefined') {
  try {
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith('cs_cache_') && k !== 'cs_cache_user_me') {
        sessionStorage.removeItem(k);
      }
    }
  } catch {}
}

export const clientCache = {
  keys: {
    USER_ME: 'cs_cache_user_me',
    // Kept for signature compatibility; non-session data is never cached
    LEADER_TEAM: (userId: string) => `cs_cache_team_${userId}`,
    FACULTY_DATA: (userId: string) => `cs_cache_faculty_${userId}`,
    NOTIFICATIONS: (userId: string) => `cs_cache_notifs_${userId}`,
    ADMIN_DATA: 'cs_cache_admin_data',
    PANELS: 'cs_cache_panels',
  },

  /**
   * Only USER_ME (auth session profile) is retrieved from cache.
   * All other business entities return null to force real-time database queries.
   */
  get<T>(key: string, maxAgeMs?: number): T | null {
    if (typeof window === 'undefined') return null;

    // Only allow auth session cache
    if (key !== 'cs_cache_user_me') {
      return null;
    }

    try {
      const raw = sessionStorage.getItem(key);
      if (raw) {
        const entry: CacheEntry<T> = JSON.parse(raw);
        if (entry && entry.timestamp) {
          if (maxAgeMs && Date.now() - entry.timestamp > maxAgeMs) {
            sessionStorage.removeItem(key);
            return null;
          }
          return entry.data;
        }
      }
    } catch {
      const entry = memoryFallback.get(key);
      if (entry) {
        if (maxAgeMs && Date.now() - entry.timestamp > maxAgeMs) {
          memoryFallback.delete(key);
          return null;
        }
        return entry.data as T;
      }
    }
    return null;
  },

  /**
   * Only USER_ME is allowed to be cached.
   * Other keys are ignored so operational data stays strictly live.
   */
  set<T>(key: string, data: T, ttlMs: number = 5 * 60 * 1000): void {
    if (typeof window === 'undefined') return;

    if (key !== 'cs_cache_user_me') {
      return;
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttlMs,
    };

    try {
      sessionStorage.setItem(key, JSON.stringify(entry));
    } catch {}
    memoryFallback.set(key, entry);
  },

  invalidate(keyOrPrefix: string): void {
    if (typeof window === 'undefined') return;

    try {
      sessionStorage.removeItem(keyOrPrefix);
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const k = sessionStorage.key(i);
        if (k && k.startsWith(keyOrPrefix)) {
          sessionStorage.removeItem(k);
        }
      }
    } catch {}

    memoryFallback.delete(keyOrPrefix);
    for (const k of Array.from(memoryFallback.keys())) {
      if (k.startsWith(keyOrPrefix)) {
        memoryFallback.delete(k);
      }
    }
  },

  clear(): void {
    if (typeof window === 'undefined') return;

    try {
      sessionStorage.clear();
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith('cs_cache_')) {
          localStorage.removeItem(k);
        }
      }
    } catch {}

    memoryFallback.clear();
  },
};
