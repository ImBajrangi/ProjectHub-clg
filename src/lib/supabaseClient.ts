import { createClient } from '@supabase/supabase-js';
import { NotificationItem } from './types';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ezspbqjnvmxuglivdjzb.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Shared Browser-Side Supabase Client
 * Used strictly for WebSocket Realtime Channels (PostgreSQL change subscriptions).
 * Zero polling, 0 REST API Gateway overhead.
 */
export const supabaseBrowser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

/**
 * Subscribe to real-time notification inserts for a specific recipient user.
 * Returns an unsubscribe callback for clean unmounting.
 */
export function subscribeToUserNotifications(
  userId: string,
  onNotification: (notif: NotificationItem) => void
): () => void {
  if (!userId || typeof window === 'undefined') return () => {};

  const channelName = `realtime-notifs-${userId}-${Date.now()}`;
  const channel = supabaseBrowser
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        if (payload.new) {
          onNotification(payload.new as NotificationItem);
        }
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        // Realtime connection active
      }
    });

  return () => {
    supabaseBrowser.removeChannel(channel);
  };
}

/**
 * Subscribe to real-time meeting and problem statement changes for a team.
 */
export function subscribeToTeamLiveUpdates(
  teamId: string,
  onUpdate: (table: string, payload: any) => void
): () => void {
  if (!teamId || typeof window === 'undefined') return () => {};

  const channelName = `realtime-team-${teamId}-${Date.now()}`;
  const channel = supabaseBrowser
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'problem_statements',
        filter: `team_id=eq.${teamId}`,
      },
      (payload) => onUpdate('problem_statements', payload.new)
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'meetings',
        filter: `team_id=eq.${teamId}`,
      },
      (payload) => onUpdate('meetings', payload.new)
    )
    .subscribe();

  return () => {
    supabaseBrowser.removeChannel(channel);
  };
}
