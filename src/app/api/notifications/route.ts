import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('codeshastra_token')?.value || req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ notifications: [], unreadCount: 0 }, { status: 200 });

    const sessionUser = await auth.validateSession(token);
    if (!sessionUser) return NextResponse.json({ notifications: [], unreadCount: 0 }, { status: 200 });

    const notifications = await db.getNotificationsByUser(sessionUser.id);
    const unreadCount = notifications.filter((n) => !n.is_read).length;

    return NextResponse.json({ notifications, unreadCount });
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
