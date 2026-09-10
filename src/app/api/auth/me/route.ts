import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

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
      team = await db.getTeamByLeaderId(user.id);
    }

    const unreadNotifications = (await db.getNotificationsByUser(user.id)).filter((n) => !n.is_read).length;

    return NextResponse.json({
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
    });
  } catch (error) {
    return NextResponse.json({ authenticated: false, error: 'Auth check failed' }, { status: 500 });
  }
}
