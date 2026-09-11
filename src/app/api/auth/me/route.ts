import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('codeshastra_token')?.value || req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
    }

    const user = await auth.validateSession(token);
    if (!user) {
      return NextResponse.json({ authenticated: false, user: null, error: 'Session expired or invalidated' }, { status: 200 });
    }

    let team = null;
    if (user.role === 'leader') {
      try {
        team = await db.getTeamByLeaderId(user.id);
      } catch (err) {
        console.error('Error fetching team for leader in /api/auth/me:', err);
      }
    }

    let unreadNotifications = 0;
    try {
      const userNotifs = await db.getNotificationsByUser(user.id);
      unreadNotifications = (userNotifs || []).filter((n) => n && !n.is_read).length;
    } catch (err) {
      console.error('Error fetching notifications in /api/auth/me:', err);
    }

    return NextResponse.json(
      {
        authenticated: true,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          phone: user.phone,
          isLeader: user.is_leader,
        },
        team,
        unreadNotifications,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error) {
    console.error('/api/auth/me exception:', error);
    return NextResponse.json(
      { authenticated: false, user: null, error: 'Auth check failed' },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      }
    );
  }
}
