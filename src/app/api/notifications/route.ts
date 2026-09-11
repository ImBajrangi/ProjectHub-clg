import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('codeshastra_token')?.value || req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ notifications: [], unreadCount: 0 }, { status: 200 });

    const sessionUser = await auth.validateSession(token);
    if (!sessionUser) return NextResponse.json({ notifications: [], unreadCount: 0 }, { status: 200 });

    const notifications = await db.getNotificationsByUser(sessionUser.id);
    const unreadCount = notifications.filter((n) => !n.is_read).length;

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
    console.error('Notifications GET API error:', error);
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
      return NextResponse.json({ success: true, message: 'Notification marked as read.' });
    }

    if (action === 'mark_all_read') {
      await db.markAllNotificationsRead(sessionUser.id);
      return NextResponse.json({ success: true, message: 'All notifications marked as read.' });
    }

    if (action === 'delete' && notificationId) {
      await db.deleteNotification(notificationId, sessionUser.id);
      return NextResponse.json({ success: true, message: 'Notification deleted.' });
    }

    if (action === 'clear_all') {
      await db.clearAllNotifications(sessionUser.id);
      return NextResponse.json({ success: true, message: 'All notifications cleared.' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Notifications POST API error:', error);
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const token = req.cookies.get('codeshastra_token')?.value || req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sessionUser = await auth.validateSession(token);
    if (!sessionUser) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      await db.deleteNotification(id, sessionUser.id);
      return NextResponse.json({ success: true, message: 'Notification deleted.' });
    }

    await db.clearAllNotifications(sessionUser.id);
    return NextResponse.json({ success: true, message: 'All notifications cleared.' });
  } catch (error) {
    console.error('Notifications DELETE API error:', error);
    return NextResponse.json({ error: 'Failed to delete notifications' }, { status: 500 });
  }
}

