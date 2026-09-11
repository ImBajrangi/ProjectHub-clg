import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { NotificationTemplates } from '@/lib/notifications';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const userAgent = req.headers.get('user-agent') || 'Unknown Device';
    const result = await auth.loginUser(email, password, userAgent);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    // Notify supervisor on leader login
    if (result.user && result.user.role === 'leader') {
      try {
        const team = await db.getTeamByLeaderId(result.user.id);
        if (team && team.supervisor_id) {
          const supervisor = await db.getUserById(team.supervisor_id);
          if (supervisor) {
            const nowStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
            const notif = NotificationTemplates.teamLeaderLoggedInNotice({
              supervisorUserId: supervisor.id,
              supervisorName: supervisor.full_name,
              teamName: team.team_name,
              leaderName: result.user.fullName,
              timestamp: nowStr,
            });
            await db.createNotification(notif);
          }
        }
      } catch (err) {
        console.warn('Leader login notification error:', err);
      }
    }

    const res = NextResponse.json({
      success: true,
      user: result.user,
      token: result.token,
    });

    // Set HTTP-only session cookie
    res.cookies.set('codeshastra_token', result.token!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 12 * 60 * 60, // 12 hours
    });

    return res;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error during login' }, { status: 500 });
  }
}
