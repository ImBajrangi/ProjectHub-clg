import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { NotificationItem } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// In-Memory Server Cache to protect Supabase quota (TTL: 20 seconds per user)
interface CacheEntry {
  timestamp: number;
  notifications: NotificationItem[];
  unreadCount: number;
}
const notifCache = new Map<string, CacheEntry>();

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('codeshastra_token')?.value || req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ notifications: [], unreadCount: 0 }, { status: 200 });

    const sessionUser = await auth.validateSession(token);
    if (!sessionUser) return NextResponse.json({ notifications: [], unreadCount: 0 }, { status: 200 });

    const now = Date.now();
    const cached = notifCache.get(sessionUser.id);
    if (cached && now - cached.timestamp < 20000) {
      return NextResponse.json(
        { notifications: cached.notifications, unreadCount: cached.unreadCount },
        { status: 200 }
      );
    }

    const notifications = await db.getNotificationsByUser(sessionUser.id);
    const unreadCount = notifications.filter((n) => !n.is_read).length;

    // Save to memory cache
    notifCache.set(sessionUser.id, {
      timestamp: now,
      notifications,
      unreadCount,
    });

    return NextResponse.json(
      { notifications, unreadCount },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('codeshastra_token')?.value || req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sessionUser = await auth.validateSession(token);
    if (!sessionUser) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    const body = await req.json();
    const action = body.action;
    const notificationId = body.notificationId || body.id;

    // Invalidate cache immediately on update
    notifCache.delete(sessionUser.id);

    if (action === 'mark_read' && notificationId) {
      await db.markNotificationAsRead(notificationId);
      return NextResponse.json({ success: true });
    }

    if (action === 'mark_all_read') {
      await db.markAllNotificationsRead(sessionUser.id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}

