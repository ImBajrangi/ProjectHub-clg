import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { NotificationTemplates } from '@/lib/notifications';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('codeshastra_token')?.value || req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = auth.verifyToken(token);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const { currentPassword, newPassword, confirmPassword } = await req.json();

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: 'New password and confirm password do not match' }, { status: 400 });
    }

    const result = await auth.changePassword(session.userId, currentPassword, newPassword);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // MANDATORY SECURITY FLUSH & CATEGORY E NOTIFICATION
    const user = await db.getUserById(session.userId);
    if (user) {
      const notifPayload = NotificationTemplates.passwordUpdatedSecurityNotice({
        userId: user.id,
        userName: user.full_name,
        email: user.email,
        timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      });
      await db.createNotification(notifPayload);
    }

    const res = NextResponse.json({
      success: true,
      message: 'Password updated successfully. As per system security protocol, all active sessions have been terminated. Please log in again.',
    });

    res.cookies.delete('codeshastra_token');
    return res;
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
  }
}
