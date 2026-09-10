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
  ChevronDown,
  User,
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
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const notifiedIdsRef = React.useRef<Set<string>>(new Set());
  const userMenuRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [userMenuOpen]);

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

      const handleImmediateUpdate = () => {
        fetchNotifications();
      };

      const handleInstantNotif = (e: any) => {
        const item = e.detail?.notification;
        if (item) {
          setNotifications((prev) => [item, ...prev.filter((n) => String(n.id) !== String(item.id))]);
          setUnreadCount((prev) => prev + 1);
        }
      };

      window.addEventListener('codeshastra_notification_instant', handleInstantNotif);
      window.addEventListener('codeshastra_notification_update', handleImmediateUpdate);
      window.addEventListener('focus', handleImmediateUpdate);

      const handleVisibility = () => {
        if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
          fetchNotifications();
        }
      };
      document.addEventListener('visibilitychange', handleVisibility);

      let bc: BroadcastChannel | null = null;
      try {
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          bc = new BroadcastChannel('codeshastra_notifications_channel');
          bc.onmessage = (event) => {
            if (event.data?.type === 'INSTANT_NOTIFICATION' && event.data?.notification) {
              const item = event.data.notification;
              setNotifications((prev) => [item, ...prev.filter((n) => String(n.id) !== String(item.id))]);
              setUnreadCount((prev) => prev + 1);
            } else {
              fetchNotifications();
            }
          };
        }
      } catch {}

      return () => {
        window.removeEventListener('codeshastra_notification_instant', handleInstantNotif);
        window.removeEventListener('codeshastra_notification_update', handleImmediateUpdate);
        window.removeEventListener('focus', handleImmediateUpdate);
        document.removeEventListener('visibilitychange', handleVisibility);
        if (bc) {
          try {
            bc.close();
          } catch {}
        }
      };
    }
  }, [user]);

  const handleMarkRead = async (id: string) => {
    // 1. Instant 0ms Optimistic UI update
    const previousNotifs = [...notifications];
    const previousUnread = unreadCount;

    setNotifications((prev) =>
      prev.map((n) => (String(n.id) === String(id) ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      // 2. Genuine backend & Supabase persistence
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_read', notificationId: id, id }),
      });

      if (!res.ok) {
        // Rollback gracefully on actual server error
        setNotifications(previousNotifs);
        setUnreadCount(previousUnread);
      }
    } catch (e) {
      console.error('Failed to mark notification as read:', e);
      // Soft rollback
      setNotifications(previousNotifs);
      setUnreadCount(previousUnread);
    }
  };

  const handleMarkAllRead = async () => {
    // 1. Instant 0ms Optimistic UI update
    const previousNotifs = [...notifications];
    const previousUnread = unreadCount;

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);

    try {
      // 2. Genuine backend & Supabase persistence
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_all_read' }),
      });

      if (!res.ok) {
        // Rollback gracefully on actual server error
        setNotifications(previousNotifs);
        setUnreadCount(previousUnread);
      }
    } catch (e) {
      console.error('Failed to mark all as read:', e);
      // Soft rollback
      setNotifications(previousNotifs);
      setUnreadCount(previousUnread);
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
          <Link
            href={homeHref}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8.5px',
              textDecoration: 'none',
              transition: 'opacity 0.15s ease',
            }}
            className="brand-logo-link"
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '7px',
                backgroundColor: '#0F172A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 1px 3px rgba(15, 23, 42, 0.12)',
                flexShrink: 0,
                transition: 'transform 0.2s ease',
              }}
              className="logo-icon-box"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 7L3 12L8 17" stroke="#60A5FA" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M16 7L21 12L16 17" stroke="#60A5FA" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M14 4.5L10 19.5" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5.5px' }}>
              <span
                className="logo-brand-text"
                style={{
                  fontWeight: 700,
                  fontSize: '15px',
                  color: 'var(--color-ink)',
                  letterSpacing: '-0.025em',
                  lineHeight: 1,
                }}
              >
                CodeShastra
              </span>
              <span
                className="logo-hub-badge"
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  padding: '1.5px 6px',
                  borderRadius: '4px',
                  backgroundColor: '#F1F5F9',
                  color: '#475569',
                  borderTop: '1px solid #E2E8F0',
                  borderRight: '1px solid #E2E8F0',
                  borderBottom: '1px solid #E2E8F0',
                  borderLeft: '1px solid #E2E8F0',
                  letterSpacing: '0.02em',
                  lineHeight: 1.2,
                }}
              >
                Hub
              </span>
            </div>
          </Link>

          {/* Center: Faculty Mode Segmented Control */}
          {user?.role === 'supervisor' && onFacultyModeChange && (
            <div className="nav-faculty-toggle" role="group" aria-label="Faculty Portal Mode Switcher">
              <button
                type="button"
                className={`nav-faculty-tab ${activeFacultyMode === 'supervisor' ? 'active' : ''}`}
                onClick={() => onFacultyModeChange('supervisor')}
              >
                <Users size={13.5} strokeWidth={2.2} />
                <span>Mentor</span>
              </button>
              <button
                type="button"
                className={`nav-faculty-tab ${activeFacultyMode === 'panel' ? 'active' : ''}`}
                onClick={() => onFacultyModeChange('panel')}
              >
                <Award size={13.5} strokeWidth={2.2} />
                <span>Judge</span>
              </button>
            </div>
          )}

          {/* Right Controls */}
          <div className="nav-right-controls" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {user ? (
              <>
                {/* Role & Complete User Name on Desktop */}
                <div style={{ display: 'none', alignItems: 'center' }} className="desktop-role-pill">
                  {user.role === 'leader' && (
                    <span className="nav-role-badge">
                      <UserCheck size={13} style={{ color: 'var(--color-primary)' }} />
                      <span>{user.fullName}</span>
                      {teamCode && <span className="nav-role-team-tag">{teamCode}</span>}
                    </span>
                  )}
                  {user.role === 'supervisor' && (
                    <span className="nav-role-badge">
                      <Compass size={13} style={{ color: 'var(--color-primary)' }} />
                      <span>{user.fullName}</span>
                      <span className="nav-role-team-tag">Mentor</span>
                    </span>
                  )}
                  {user.role === 'admin' && (
                    <span className="nav-role-badge">
                      <Shield size={13} style={{ color: '#0F172A' }} />
                      <span>{user.fullName || 'Project Incharge'}</span>
                      <span className="nav-role-team-tag">Incharge</span>
                    </span>
                  )}
                </div>

                {/* Notification Bell */}
                <button
                  type="button"
                  onClick={() => {
                    fetchNotifications();
                    setDrawerOpen(true);
                  }}
                  className="nav-btn nav-btn-icon"
                  title="Notifications"
                >
                  <Bell size={15} />
                  {unreadCount > 0 && (
                    <span className="nav-badge-count">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Profile & Actions Dropdown */}
                <div style={{ position: 'relative' }} ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen((prev) => !prev)}
                    className="nav-profile-btn"
                    title="Account & Menu"
                    aria-label="Account & Menu"
                    aria-expanded={userMenuOpen}
                  >
                    <div className="nav-avatar-circle">
                      {user.fullName ? (
                        user.fullName.trim().split(' ').length > 1
                          ? (user.fullName.trim().split(' ')[0][0] + user.fullName.trim().split(' ').slice(-1)[0][0]).toUpperCase()
                          : user.fullName.trim().slice(0, 2).toUpperCase()
                      ) : 'U'}
                    </div>
                    <ChevronDown
                      size={12}
                      className="nav-avatar-chevron"
                      style={{
                        transform: userMenuOpen ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.15s ease',
                      }}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {userMenuOpen && (
                    <div className="nav-dropdown-menu">
                      {/* User Info Header */}
                      <div className="nav-dropdown-header">
                        <div className="nav-dropdown-avatar">
                          {user.fullName ? (
                            user.fullName.trim().split(' ').length > 1
                              ? (user.fullName.trim().split(' ')[0][0] + user.fullName.trim().split(' ').slice(-1)[0][0]).toUpperCase()
                              : user.fullName.trim().slice(0, 2).toUpperCase()
                          ) : 'U'}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {user.fullName}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                            <span style={{ textTransform: 'capitalize', fontWeight: 600, color: 'var(--color-primary)' }}>
                              {user.role}
                            </span>
                            {teamCode && (
                              <>
                                <span>•</span>
                                <span style={{ fontWeight: 600, color: 'var(--color-ink)' }}>{teamCode}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="nav-dropdown-divider" />

                      {/* Help & Guide */}
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          setHelpModalOpen(true);
                        }}
                        className="nav-dropdown-item"
                      >
                        <HelpCircle size={15} style={{ color: '#2563EB', flexShrink: 0 }} />
                        <span>Help & Feature Guide</span>
                      </button>

                      {/* Security / Password */}
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          setPasswordModalOpen(true);
                        }}
                        className="nav-dropdown-item"
                      >
                        <KeyRound size={15} style={{ color: '#64748B', flexShrink: 0 }} />
                        <span>Security & Password</span>
                      </button>

                      <div className="nav-dropdown-divider" />

                      {/* Sign Out */}
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          handleLogout();
                        }}
                        className="nav-dropdown-item nav-dropdown-item-danger"
                      >
                        <LogOut size={15} style={{ flexShrink: 0 }} />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
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
        .nav-faculty-toggle {
          background: #F1F5F9;
          border: 1px solid #E2E8F0;
          border-radius: 9px;
          padding: 3px;
          display: inline-flex;
          align-items: center;
          gap: 3px;
          flex-shrink: 0;
          box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.03);
          user-select: none;
        }
        .nav-faculty-tab {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 13px;
          border-radius: 7px;
          font-family: var(--font-sans);
          font-size: 12px;
          font-weight: 600;
          border: none;
          background: transparent;
          color: #64748B;
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
          transition: background-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease, transform 0.1s ease;
        }
        .nav-faculty-tab:hover:not(.active) {
          color: #0F172A;
          background: rgba(255, 255, 255, 0.6);
        }
        .nav-faculty-tab.active {
          background: #FFFFFF;
          color: #1E40AF;
          font-weight: 700;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08), 0 1px 2px rgba(15, 23, 42, 0.04);
        }
        .nav-faculty-tab:active {
          transform: scale(0.97);
        }
        .nav-right-controls {
          display: flex;
          align-items: center;
          gap: 7px;
          flex-shrink: 0;
        }
        .nav-role-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 34px;
          padding: 0 11px;
          font-size: 12px;
          font-weight: 600;
          border-radius: 9px;
          border: 1px solid #E2E8F0;
          background: #F8FAFC;
          color: #0F172A;
          box-sizing: border-box;
          white-space: nowrap;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.02);
        }
        .nav-role-team-tag {
          font-size: 10.5px;
          font-weight: 700;
          color: #2563EB;
          background: #EFF6FF;
          border: 1px solid #DBEAFE;
          border-radius: 5px;
          padding: 1px 5px;
          margin-left: 2px;
        }
        .nav-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          height: 34px;
          padding: 0 11px;
          font-size: 12px;
          font-weight: 600;
          border-radius: 9px;
          border: 1px solid #E2E8F0;
          background: #FFFFFF;
          color: #475569;
          cursor: pointer;
          transition: all 0.15s ease;
          position: relative;
          box-sizing: border-box;
          text-decoration: none;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
        }
        .nav-btn:hover {
          background: #F8FAFC;
          color: #0F172A;
          border-color: #CBD5E1;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
        }
        .nav-btn:active {
          transform: scale(0.96);
        }
        .nav-btn-icon {
          width: 34px;
          height: 34px;
          min-width: 34px;
          padding: 0;
          border-radius: 9px;
        }
        .nav-badge-count {
          position: absolute;
          top: -3.5px;
          right: -3.5px;
          background-color: #EF4444;
          color: #FFFFFF;
          font-size: 9.5px;
          font-weight: 700;
          min-width: 17px;
          height: 17px;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 3.5px;
          border: 2px solid #FFFFFF;
          box-shadow: 0 1px 3px rgba(239, 68, 68, 0.35);
          line-height: 1;
        }
        .nav-profile-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          height: 34px;
          padding: 0 8px 0 4px;
          border-radius: 9px;
          border: 1px solid #E2E8F0;
          background: #FFFFFF;
          color: #475569;
          cursor: pointer;
          transition: all 0.15s ease;
          user-select: none;
          box-sizing: border-box;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
        }
        .nav-profile-btn:hover {
          background: #F8FAFC;
          border-color: #CBD5E1;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
        }
        .nav-profile-btn:active {
          transform: scale(0.96);
        }
        .nav-avatar-circle {
          width: 25px;
          height: 25px;
          border-radius: 7px;
          background: linear-gradient(135deg, #1E40AF 0%, #2563EB 100%);
          color: #FFFFFF;
          font-size: 11px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          letter-spacing: -0.02em;
        }
        .nav-avatar-chevron {
          color: #64748B;
        }
        .nav-dropdown-menu {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          min-width: 220px;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.08);
          padding: 6px;
          z-index: 200;
          animation: navDropdownFade 0.15s ease-out;
        }
        @keyframes navDropdownFade {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .nav-dropdown-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px 10px;
        }
        .nav-dropdown-avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: linear-gradient(135deg, #1E40AF 0%, #2563EB 100%);
          color: #FFFFFF;
          font-size: 12.5px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .nav-dropdown-divider {
          height: 1px;
          background: #F1F5F9;
          margin: 4px 0;
        }
        .nav-dropdown-item {
          display: flex;
          align-items: center;
          gap: 9px;
          width: 100%;
          padding: 8px 10px;
          font-size: 12.5px;
          font-weight: 500;
          border-radius: 8px;
          border: none;
          background: transparent;
          cursor: pointer;
          color: #334155;
          text-align: left;
          transition: background-color 0.12s ease, color 0.12s ease;
        }
        .nav-dropdown-item:hover {
          background: #F1F5F9;
          color: #0F172A;
        }
        .nav-dropdown-item-danger {
          color: #DC2626;
        }
        .nav-dropdown-item-danger:hover {
          background: #FEF2F2;
          color: #B91C1C;
        }

        @media (max-width: 639px) {
          .mobile-hide-btn {
            display: none !important;
          }
          .mobile-btn-text {
            display: none !important;
          }
          .nav-pill {
            padding: 6px 10px !important;
            box-sizing: border-box !important;
          }
          .nav-faculty-tab {
            padding: 4px 9px !important;
            font-size: 11px !important;
            gap: 4px !important;
          }
          .nav-right-controls {
            gap: 5px !important;
          }
          .nav-btn {
            width: 32px !important;
            height: 32px !important;
            min-width: 32px !important;
            padding: 0 !important;
            border-radius: 8px !important;
          }
          .nav-profile-btn {
            height: 32px !important;
            padding: 2px 6px 2px 3px !important;
          }
          .nav-avatar-circle {
            width: 23px !important;
            height: 23px !important;
            font-size: 10px !important;
          }
          .logo-icon-box {
            width: 28px !important;
            height: 28px !important;
            border-radius: 7px !important;
          }
          .logo-brand-text {
            font-size: 14px !important;
          }
          .logo-hub-badge {
            font-size: 9.5px !important;
            padding: 1px 4.5px !important;
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
        onRefresh={fetchNotifications}
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
