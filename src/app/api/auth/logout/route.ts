import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('codeshastra_token')?.value || req.headers.get('authorization')?.replace('Bearer ', '');
    if (token) {
      const session = auth.verifyToken(token);
      if (session?.userId) {
        await auth.logoutUser(session.userId);
      }
    }

    const res = NextResponse.json({ success: true, message: 'Logged out successfully' });
    res.cookies.delete('codeshastra_token');
    return res;
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to logout' }, { status: 500 });
  }
}
