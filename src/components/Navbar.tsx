'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  LogOut,
  KeyRound,
  UserCheck,
  Award,
  Shield,
  Compass,
  Users,
  Layers,
  HelpCircle,
} from 'lucide-react';
import NotificationDrawer from './NotificationDrawer';
import PasswordChangeModal from './PasswordChangeModal';
import HelpModal from './HelpModal';
import { NotificationItem } from '@/lib/types';

interface NavbarProps {
  user?: {
    id: string;
    fullName: string;
    email: string;
    role: 'leader' | 'supervisor' | 'panel' | 'admin';
    isLeader?: boolean;
  } | null;
  teamCode?: string;
  activeFacultyMode?: 'supervisor' | 'panel';
  onFacultyModeChange?: (mode: 'supervisor' | 'panel') => void;
}

export default function Navbar({
  user,
  teamCode,
  activeFacultyMode = 'supervisor',
  onFacultyModeChange,
}: NavbarProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);

  const notifiedIdsRef = React.useRef<Set<string>>(new Set());

  const triggerDeviceNotification = (item: NotificationItem) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`CodeShastra: ${item.subject}`, {
          body: `${item.salutation}\n${item.body.slice(0, 100)}...`,
        });
      } catch (err) {
        console.error('Device notification error', err);
      }
    }
  };

  const fetchNotifications = async () => {
    if (!user) return;
    if (typeof document !== 'undefined' && document.hidden) return;
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        const notifs: NotificationItem[] = data.notifications || [];
        const newUnread = data.unreadCount ?? notifs.filter((n) => !n.is_read).length;
        setUnreadCount(newUnread);
        setNotifications(notifs);

        // Real-time device notification trigger for newly received unread notifications
        const unread = notifs.filter((n) => !n.is_read);
        unread.forEach((n) => {
          if (!notifiedIdsRef.current.has(n.id)) {
            notifiedIdsRef.current.add(n.id);
            triggerDeviceNotification(n);
          }
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleMarkRead = async (id: string) => {
    // Instant optimistic UI update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_read', notificationId: id, id }),
      });
      fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = async () => {
    // Instant optimistic UI update
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);

    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_all_read' }),
      });
      fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error(e);
    } finally {
      localStorage.removeItem('codeshastra_token');
      router.push('/login');
    }
  };

  // Safe dashboard routing for logged in users when clicking CodeShastra logo
  const homeHref = user
    ? user.role === 'admin'
      ? '/admin'
      : user.role === 'supervisor'
      ? '/dashboard/faculty'
      : '/dashboard/leader'
    : '/';

  return (
    <>
      <div className="nav-pill-container">
        <header className="nav-pill">
          {/* Logo & Identity: Navigates to user portal if logged in, avoids accidental logout */}
          <Link href={homeHref} style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'var(--color-primary)',
                color: '#FFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.2s ease',
              }}
              className="logo-icon-box"
            >
              <Layers size={18} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  fontWeight: 800,
                  fontSize: '16px',
                  background: 'linear-gradient(135deg, #1E40AF 0%, #2563EB 60%, #059669 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.025em',
                }}
              >
                CodeShastra
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: '6px',
                  background: '#FFFBEB',
                  color: '#B45309',
                  border: '1px solid #FDE68A',
                  letterSpacing: '0.02em',
                }}
              >
                Hub
              </span>
            </div>
          </Link>

          {/* Center: Faculty Mode Segmented Control */}
          {user?.role === 'supervisor' && onFacultyModeChange && (
            <div className="segmented-control" style={{ padding: '3px' }}>
              <button
                type="button"
                className={`segmented-pill ${activeFacultyMode === 'supervisor' ? 'active' : ''}`}
                onClick={() => onFacultyModeChange('supervisor')}
                style={{ padding: '6px 14px', fontSize: '12px' }}
              >
                <Users size={13} /> Mentor
              </button>
              <button
                type="button"
                className={`segmented-pill ${activeFacultyMode === 'panel' ? 'active' : ''}`}
                onClick={() => onFacultyModeChange('panel')}
                style={{ padding: '6px 14px', fontSize: '12px' }}
              >
                <Award size={13} /> Judge
              </button>
            </div>
          )}

          {/* Right Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {user ? (
              <>
                {/* Role & Complete User Name on Desktop */}
                <div style={{ display: 'none', alignItems: 'center', gap: '8px' }} className="desktop-role-pill">
                  {user.role === 'leader' && (
                    <span className="badge badge-neutral" style={{ fontSize: '12px' }}>
                      <UserCheck size={12} /> <strong>{user.fullName}</strong> {teamCode ? `(${teamCode})` : ''}
                    </span>
                  )}
                  {user.role === 'supervisor' && (
                    <span className="badge badge-neutral" style={{ fontSize: '12px' }}>
                      <Compass size={12} /> <strong>{user.fullName}</strong>
                    </span>
                  )}
                  {user.role === 'admin' && (
                    <span className="badge badge-ink" style={{ fontSize: '12px' }}>
                      <Shield size={12} /> <strong>{user.fullName || 'Project Incharge'}</strong>
                    </span>
                  )}
                </div>

                {/* HELP & GUIDE BUTTON (Dedicated to logged in user role) */}
                <button
                  type="button"
                  onClick={() => setHelpModalOpen(true)}
                  className="btn btn-help"
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    borderRadius: 'var(--rounded-full)',
                  }}
                  title="Portal Help & Feature Guide"
                >
                  <HelpCircle size={14} />
                  <span className="mobile-btn-text">Help & Guide</span>
                </button>

                {/* Notification Bell */}
                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  className="btn btn-outline"
                  style={{
                    width: '36px',
                    height: '36px',
                    padding: 0,
                    position: 'relative',
                  }}
                  title="Notifications"
                >
                  <Bell size={16} />
                  {unreadCount > 0 && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '-3px',
                        right: '-3px',
                        backgroundColor: 'var(--color-danger)',
                        color: '#FFF',
                        fontSize: '10px',
                        fontWeight: 700,
                        minWidth: '16px',
                        height: '16px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 3px',
                      }}
                    >
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Password Change Button */}
                <button
                  type="button"
                  onClick={() => setPasswordModalOpen(true)}
                  className="btn btn-outline"
                  style={{ width: '36px', height: '36px', padding: 0 }}
                  title="Security Settings"
                >
                  <KeyRound size={15} />
                </button>

                {/* Logout Button */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn btn-soft"
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                  title="Log out"
                >
                  <LogOut size={13} />
                  <span className="mobile-btn-text">Logout</span>
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Link href="/leader" className="btn btn-outline mobile-hide-btn" style={{ fontSize: '13px', padding: '6px 14px', whiteSpace: 'nowrap' }}>
                  Elect Leader
                </Link>
                <Link href="/login" className="btn btn-primary" style={{ fontSize: '13px', padding: '6px 16px', whiteSpace: 'nowrap' }}>
                  Log In
                </Link>
              </div>
            )}
          </div>
        </header>
      </div>

      <style jsx global>{`
        @media (max-width: 639px) {
          .mobile-hide-btn {
            display: none !important;
          }
          .mobile-btn-text {
            display: none !important;
          }
          .nav-pill {
            padding: 6px 10px !important;
          }
          .btn-help, .btn-soft {
            width: 34px !important;
            height: 34px !important;
            padding: 0 !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            border-radius: 8px !important;
          }
          .btn-outline {
            width: 34px !important;
            height: 34px !important;
            border-radius: 8px !important;
          }
        }
        @media (min-width: 640px) {
          .desktop-role-pill {
            display: flex !important;
          }
        }
        .logo-icon-box:hover {
          opacity: 0.9;
        }
      `}</style>

      {/* Notification Drawer with Complete User Name */}
      <NotificationDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        notifications={notifications}
        onMarkRead={handleMarkRead}
        onMarkAllRead={handleMarkAllRead}
        userName={user?.fullName}
      />

      {/* Password Change Modal with Complete User Name */}
      <PasswordChangeModal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        onSuccess={() => {
          setPasswordModalOpen(false);
          router.push('/login');
        }}
        userName={user?.fullName}
      />

      {/* Role-Specific Help Modal with keyword search and counter */}
      {user && (
        <HelpModal
          isOpen={helpModalOpen}
          onClose={() => setHelpModalOpen(false)}
          userRole={user.role === 'supervisor' ? 'supervisor' : user.role === 'admin' ? 'admin' : 'leader'}
        />
      )}
    </>
  );
}
