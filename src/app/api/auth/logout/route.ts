import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

async function performLogout(req: NextRequest) {
  try {
    const token = req.cookies.get('codeshastra_token')?.value || req.headers.get('authorization')?.replace('Bearer ', '');
    if (token) {
      const session = auth.verifyToken(token);
      if (session?.userId) {
        await auth.logoutUser(session.userId);
      }
    }
  } catch (err) {
    console.warn('Logout session invalidation warning:', err);
  }

  const res = NextResponse.json(
    { success: true, message: 'Logged out successfully' },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        Pragma: 'no-cache',
        Expires: '0',
      },
    }
  );

  // Expire cookie explicitly
  res.cookies.set('codeshastra_token', '', {
    path: '/',
    maxAge: 0,
    expires: new Date(0),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
  res.cookies.delete('codeshastra_token');

  return res;
}

export async function POST(req: NextRequest) {
  return performLogout(req);
}

export async function GET(req: NextRequest) {
  return performLogout(req);
}
