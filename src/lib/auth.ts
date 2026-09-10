import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { User, UserRole } from './types';
import { db } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'codeshastra_ultra_secure_jwt_secret_9837429871_projecthub_2026';

export interface AuthSession {
  userId: string;
  email: string;
  role: UserRole;
  fullName: string;
  sessionToken: string;
}

export const auth = {
  // Hash password
  hashPassword(password: string): string {
    return bcrypt.hashSync(password, 10);
  },

  // Verify password
  verifyPassword(password: string, hash: string): boolean {
    return bcrypt.compareSync(password, hash);
  },

  // Sign JWT
  signToken(payload: AuthSession, expiresIn: string = '12h'): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn } as any);
  },

  // Verify JWT
  verifyToken(token: string): AuthSession | null {
    try {
      return jwt.verify(token, JWT_SECRET) as AuthSession;
    } catch {
      return null;
    }
  },

  // Single-device login check & session token issuance
  async loginUser(
    email: string,
    passwordAttempt: string,
    deviceInfo: string
  ): Promise<{
    success: boolean;
    error?: string;
    token?: string;
    user?: { id: string; email: string; fullName: string; role: UserRole; isLeader?: boolean };
  }> {
    const user = await db.getUserByEmail(email);
    if (!user) {
      return { success: false, error: 'Invalid credentials. Please check your email and password.' };
    }

    const isMatch = bcrypt.compareSync(passwordAttempt, user.password_hash);
    if (!isMatch) {
      return { success: false, error: 'Invalid credentials. Please check your email and password.' };
    }

    // STRICT SINGLE-DEVICE CONCURRENT SESSION ENFORCEMENT
    // If user is a Team Leader, they are strictly allowed to be logged in on only ONE device or browser session at any time.
    if (user.role === 'leader' && user.active_session_token) {
      // Check if session is recent (within last 12 hours)
      const lastActive = user.active_session_at ? new Date(user.active_session_at).getTime() : 0;
      const now = Date.now();
      const twelveHours = 12 * 60 * 60 * 1000;

      if (now - lastActive < twelveHours) {
        return {
          success: false,
          error: 'Account is already active on another device. Please log out from that device first.',
        };
      }
    }

    // Issue new session token
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const now = new Date().toISOString();

    await db.updateUser(user.id, {
      active_session_token: sessionToken,
      active_session_device: deviceInfo,
      active_session_at: now,
    });

    const jwtToken = this.signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      fullName: user.full_name,
      sessionToken,
    });

    return {
      success: true,
      token: jwtToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        isLeader: user.is_leader,
      },
    };
  },

  // Logout - terminates active session
  async logoutUser(userId: string): Promise<boolean> {
    const user = await db.getUserById(userId);
    if (!user) return false;

    await db.updateUser(userId, {
      active_session_token: null,
      active_session_device: null,
      active_session_at: null,
    });
    return true;
  },

  // Validate active session
  async validateSession(token: string): Promise<User | null> {
    const session = this.verifyToken(token);
    if (!session) return null;

    const user = await db.getUserById(session.userId);
    if (!user) return null;

    // For leaders, verify sessionToken matches active_session_token
    if (user.role === 'leader' && user.active_session_token !== session.sessionToken) {
      return null;
    }

    return user;
  },

  // In-portal password update with MANDATORY SECURITY FLUSH
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    const user = await db.getUserById(userId);
    if (!user) return { success: false, error: 'User not found' };

    const isMatch = bcrypt.compareSync(currentPassword, user.password_hash);
    if (!isMatch) {
      return { success: false, error: 'Incorrect current password' };
    }

    if (newPassword.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters long' };
    }

    const newHash = bcrypt.hashSync(newPassword, 10);

    // MANDATORY SECURITY FLUSH: Terminate active session token and force-logout
    await db.updateUser(userId, {
      password_hash: newHash,
      active_session_token: null,
      active_session_device: null,
      active_session_at: null,
    });

    return { success: true };
  },

  // Forgot password module - exclusive email dispatch channel
  async generateResetToken(email: string): Promise<{ success: boolean; error?: string; resetToken?: string; resetLink?: string }> {
    const user = await db.getUserByEmail(email);
    if (!user) {
      return { success: false, error: 'Email ID not registered.' };
    }

    const resetToken = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes validity

    await db.updateUser(user.id, {
      reset_token: resetToken,
      reset_token_expires_at: expiresAt,
    });

    const resetLink = `/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`;

    return { success: true, resetToken, resetLink };
  },

  // Reset password using token
  async resetPasswordWithToken(
    token: string,
    email: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    const user = await db.getUserByEmail(email);
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    if (!user.reset_token || user.reset_token !== token) {
      return { success: false, error: 'Invalid or expired password reset link' };
    }

    const expiresAt = user.reset_token_expires_at ? new Date(user.reset_token_expires_at).getTime() : 0;
    if (Date.now() > expiresAt) {
      return { success: false, error: 'Password reset link has expired (15 minutes limit).' };
    }

    const newHash = bcrypt.hashSync(newPassword, 10);

    // Security flush on reset
    await db.updateUser(user.id, {
      password_hash: newHash,
      reset_token: null,
      reset_token_expires_at: null,
      active_session_token: null,
      active_session_device: null,
      active_session_at: null,
    });

    return { success: true };
  },
};
