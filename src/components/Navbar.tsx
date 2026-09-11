'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
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
  BellRing,
  X,
} from 'lucide-react';
import NotificationDrawer from './NotificationDrawer';
import PasswordChangeModal from './PasswordChangeModal';
import HelpModal from './HelpModal';
import { NotificationItem } from '@/lib/types';
import { triggerSystemNotification, requestDeviceNotificationPermission, playNotificationChime, registerServiceWorker } from '@/lib/deviceNotification';
import { clientCache } from '@/lib/clientCache';
import { subscribeToUserNotifications } from '@/lib/supabaseClient';

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
  user: initialUser,
  teamCode,
  activeFacultyMode = 'supervisor',
  onFacultyModeChange,
}: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<any>(initialUser || null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [switchingPortal, setSwitchingPortal] = useState<string | null>(null);

  useEffect(() => {
    setSwitchingPortal(null);
  }, [pathname]);

  const userMenuRef = React.useRef<HTMLDivElement>(null);
  const notifiedIdsRef = React.useRef<Set<string>>(new Set());
  const isFetchingRef = React.useRef<boolean>(false);
  const isInitialFetchRef = React.useRef<boolean>(true);

  // 0ms Cache Hydration on initial render
  useEffect(() => {
    if (initialUser) {
      setCurrentUser(initialUser);
      return;
    }
    const cached = clientCache.get<any>(clientCache.keys.USER_ME);
    if (cached) {
      setCurrentUser({
        id: cached.id,
        fullName: cached.full_name || cached.fullName,
        email: cached.email,
        role: cached.role,
        isLeader: cached.is_leader ?? cached.isLeader,
      });
    }
  }, [initialUser]);

  // Fetch session if not provided
  useEffect(() => {
    if (initialUser) return;
    let isMounted = true;
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated && data?.user && isMounted) {
          const u = {
            id: data.user.id,
            fullName: data.user.full_name,
            email: data.user.email,
            role: data.user.role,
            isLeader: data.user.is_leader,
          };
          setCurrentUser(u);
          clientCache.set(clientCache.keys.USER_ME, data.user);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [initialUser]);

  const activeUser = initialUser || currentUser;

  // Pre-register Service Worker for reliable background OS toasts
  useEffect(() => {
    registerServiceWorker().catch(() => {});
  }, []);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const dispatchSingleNotification = (n: NotificationItem) => {
    const notifId = String(n.id);
    if (notifiedIdsRef.current.has(notifId)) return;
    notifiedIdsRef.current.add(notifId);

    triggerSystemNotification({
      id: notifId,
      subject: n.subject,
      body: n.body,
      salutation: n.salutation,
      category: n.category,
      url: n.url || '/notifications',
    });
  };

  const fetchNotifications = async (opts?: { suppressAlerts?: boolean }) => {
    if (!activeUser || isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const res = await fetch('/api/notifications', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        const rawNotifs: NotificationItem[] = data.notifications || [];
        const notifs = activeUser?.id
          ? rawNotifs.filter((n) => String(n.user_id) === String(activeUser.id))
          : rawNotifs;
        const newUnread = data.unreadCount ?? notifs.filter((n) => !n.is_read).length;
        setUnreadCount(newUnread);
        setNotifications(notifs);

        // Store in client cache for 0ms future mounts
        if (activeUser?.id) {
          clientCache.set(clientCache.keys.NOTIFICATIONS(activeUser.id), notifs);
        }

        if (isInitialFetchRef.current) {
          // On first page load: Acknowledge existing inbox notifications so past history doesn't spam
          notifs.forEach((n) => notifiedIdsRef.current.add(String(n.id)));
          isInitialFetchRef.current = false;
        } else if (!opts?.suppressAlerts) {
          // Alert for new incoming unread notifications
          const unreadNew = notifs.filter((n) => !n.is_read && !notifiedIdsRef.current.has(String(n.id)));
          if (unreadNew.length > 0) {
            unreadNew.forEach((n) => {
              dispatchSingleNotification(n);
            });
          }
        }
      }
    } catch {
      // Gracefully ignore temporary network disconnects
    } finally {
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    if (activeUser) {
      // 1. Instant 0ms cache hydration
      if (activeUser.id) {
        const cachedNotifs = clientCache.get<NotificationItem[]>(clientCache.keys.NOTIFICATIONS(activeUser.id));
        if (cachedNotifs && cachedNotifs.length > 0) {
          setNotifications(cachedNotifs);
          setUnreadCount(cachedNotifs.filter((n) => !n.is_read).length);
        }
      }

      // 2. Initial fetch on mount
      fetchNotifications();

      // 3. Supabase Realtime WebSocket Subscription (0-polling real-time updates)
      let unsubRealtime: (() => void) | null = null;
      if (activeUser.id) {
        unsubRealtime = subscribeToUserNotifications(activeUser.id, (newNotif) => {
          setNotifications((prev) => {
            const notifId = String(newNotif.id);
            const updated = [newNotif, ...prev.filter((n) => String(n.id) !== notifId)];
            if (activeUser.id) clientCache.set(clientCache.keys.NOTIFICATIONS(activeUser.id), updated);
            return updated;
          });
          setUnreadCount((prev) => prev + 1);
          dispatchSingleNotification(newNotif);
        });
      }

      const handleImmediateUpdate = () => {
        fetchNotifications();
      };

      const handleInstantNotif = (e: any) => {
        const item = e.detail?.notification;
        if (item && activeUser?.id && String(item.user_id) === String(activeUser.id)) {
          const notifId = String(item.id);
          setNotifications((prev) => {
            const updated = [item, ...prev.filter((n) => String(n.id) !== notifId)];
            if (activeUser.id) clientCache.set(clientCache.keys.NOTIFICATIONS(activeUser.id), updated);
            return updated;
          });
          setUnreadCount((prev) => prev + 1);
          dispatchSingleNotification(item);
        }
      };

      window.addEventListener('codeshastra_notification_instant', handleInstantNotif);
      window.addEventListener('codeshastra_notification_update', handleImmediateUpdate);

      let bc: BroadcastChannel | null = null;
      try {
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          bc = new BroadcastChannel('codeshastra_notifications_channel');
          bc.onmessage = (event) => {
            if (event.data?.type === 'INSTANT_NOTIFICATION' && event.data?.notification) {
              const item = event.data.notification;
              if (activeUser?.id && String(item.user_id) === String(activeUser.id)) {
                const notifId = String(item.id);
                setNotifications((prev) => {
                  const updated = [item, ...prev.filter((n) => String(n.id) !== notifId)];
                  if (activeUser.id) clientCache.set(clientCache.keys.NOTIFICATIONS(activeUser.id), updated);
                  return updated;
                });
                setUnreadCount((prev) => prev + 1);
                dispatchSingleNotification(item);
              }
            } else {
              fetchNotifications();
            }
          };
        }
      } catch {}

      return () => {
        if (unsubRealtime) unsubRealtime();
        window.removeEventListener('codeshastra_notification_instant', handleInstantNotif);
        window.removeEventListener('codeshastra_notification_update', handleImmediateUpdate);
        if (bc) {
          try {
            bc.close();
          } catch {}
        }
      };
    }
  }, [activeUser]);

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
    if (loggingOut) return;
    setLoggingOut(true);

    try {
      clientCache.clear();
      localStorage.clear();
      sessionStorage.clear();
      document.cookie = 'codeshastra_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0;';
    } catch {}

    // Safety fallback: Redirect after 1.5s regardless of network delays
    const fallbackTimer = setTimeout(() => {
      window.location.replace('/login');
    }, 1500);

    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      });
    } catch {}

    clearTimeout(fallbackTimer);
    window.location.replace('/login');
  };

  const getInitials = (name?: string) => {
    if (!name) return 'M';
    const clean = name.replace(/^(dr\.|mr\.|mrs\.|ms\.|prof\.)\s+/i, '').trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase() || 'M';
  };

  const getShortDisplayName = (name?: string) => {
    if (!name) return 'User';
    // Remove parenthesized annotations like (Head Administrator) for clean navbar display
    const clean = name.replace(/\s*\([^)]*\)/g, '').trim();
    return clean || name;
  };

  const getRoleLabel = (role?: string, mode?: string) => {
    if (role === 'supervisor') return mode === 'panel' ? 'Panel Judge' : 'Faculty Mentor';
    if (role === 'admin') return 'Project Incharge';
    if (role === 'leader') return 'Team Leader';
    return 'Student';
  };

  // Safe dashboard routing for logged in users when clicking CodeShastra logo
  const homeHref = activeUser
    ? activeUser.role === 'admin'
      ? '/admin'
      : activeUser.role === 'supervisor'
        ? '/dashboard/faculty'
        : '/dashboard/leader'
    : '/';

  return (
    <>
      <div className="nav-pill-container">
        <header className="nav-pill">
          {/* 1. Left: Brand Identity */}
          <div className="nav-left">
            <Link
              href={homeHref}
              className="brand-logo-link"
              title="CodeShastra Academic Platform"
            >
              <div className="logo-icon-box">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 7L3 12L8 17" stroke="#60A5FA" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M16 7L21 12L16 17" stroke="#60A5FA" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M14 4.5L10 19.5" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
                </svg>
              </div>
              <span className="logo-brand-text">
                CodeShastra
              </span>
            </Link>
          </div>

          {/* 2. Center: Faculty Mode Segmented Control (if applicable) */}
          {(activeUser?.role === 'supervisor' || activeUser?.role === 'admin') && onFacultyModeChange && (
            <div className="nav-center">
              <div className="nav-faculty-toggle" role="group" aria-label="Faculty Portal Mode Switcher">
                <button
                  type="button"
                  className={`nav-faculty-tab ${activeFacultyMode === 'supervisor' ? 'active' : ''}`}
                  onClick={() => onFacultyModeChange('supervisor')}
                  title="Switch to Faculty Mentor Workspace"
                >
                  <Users size={13.5} strokeWidth={2.2} />
                  <span>Mentor</span>
                </button>
                <button
                  type="button"
                  className={`nav-faculty-tab ${activeFacultyMode === 'panel' ? 'active' : ''}`}
                  onClick={() => onFacultyModeChange('panel')}
                  title="Switch to Panel Evaluation Console"
                >
                  <Award size={13.5} strokeWidth={2.2} />
                  <span>Judge</span>
                </button>
              </div>
            </div>
          )}

          {/* 3. Right: User Controls & Session Dropdown */}
          <div className="nav-right">
            <div className="nav-right-controls">
              {activeUser ? (
                <>
                  {/* Role & Complete User Name on Large Desktop */}
                  <div className="desktop-role-pill">
                    {activeUser.role === 'leader' && (
                      <span className="nav-role-badge">
                        <UserCheck size={13} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                        <span className="nav-role-name">{getShortDisplayName(activeUser.fullName)}</span>
                        {teamCode && <span className="nav-role-team-tag">{teamCode}</span>}
                      </span>
                    )}
                    {activeUser.role === 'supervisor' && (
                      <span className="nav-role-badge">
                        <Compass size={13} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                        <span className="nav-role-name">{getShortDisplayName(activeUser.fullName)}</span>
                        <span className="nav-role-team-tag">{activeFacultyMode === 'panel' ? 'Judge' : 'Mentor'}</span>
                      </span>
                    )}
                    {activeUser.role === 'admin' && (
                      <Link
                        href="/admin"
                        className="nav-role-badge nav-role-badge-link"
                        title="Click to open Master Administrator Operations Console"
                      >
                        <Shield size={13} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                        <span className="nav-role-name">{getShortDisplayName(activeUser.fullName)}</span>
                        <span className="nav-role-team-tag nav-role-tag-admin">
                          Admin Access ↗
                        </span>
                      </Link>
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
                    title="Notifications & System Alerts"
                    aria-label="Notifications"
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
                        {getInitials(activeUser.fullName)}
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
                            {getInitials(activeUser.fullName)}
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {activeUser.fullName}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                              <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                                {getRoleLabel(activeUser.role, activeFacultyMode)}
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

                        {/* Admin / Co-Admin Portal Switcher */}
                        {activeUser.role === 'admin' && (
                          <div style={{ padding: '4px 6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <button
                              type="button"
                              onClick={() => {
                                if (pathname === '/admin') {
                                  setUserMenuOpen(false);
                                  return;
                                }
                                setSwitchingPortal('Admin Console');
                                setUserMenuOpen(false);
                                router.push('/admin');
                              }}
                              className="nav-dropdown-item"
                              style={{
                                backgroundColor: pathname === '/admin' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.05)',
                                border: '1px solid rgba(245, 158, 11, 0.25)',
                                borderRadius: '8px',
                                color: 'var(--color-ink)',
                                padding: '8px 10px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                width: '100%',
                                textAlign: 'left',
                                cursor: 'pointer',
                              }}
                            >
                              <Shield size={15} style={{ color: '#D97706', flexShrink: 0 }} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '12.5px', fontWeight: 700, lineHeight: 1.2, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span>Use Admin Access</span>
                                  {pathname === '/admin' && (
                                    <span style={{ fontSize: '9.5px', fontWeight: 700, color: '#B45309', backgroundColor: '#FEF3C7', padding: '1px 5px', borderRadius: '4px' }}>
                                      Active
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: '10.5px', color: 'var(--color-text-muted)' }}>
                                  Full academic &amp; evaluation console
                                </div>
                              </div>
                            </button>

                            {/* Faculty Mentor Portal only visible to Co-Admin faculty, NOT master admin admin@codeshastra.edu */}
                            {activeUser.email?.toLowerCase() !== 'admin@codeshastra.edu' && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (pathname === '/dashboard/faculty') {
                                    setUserMenuOpen(false);
                                    return;
                                  }
                                  setSwitchingPortal('Faculty Mentor Portal');
                                  setUserMenuOpen(false);
                                  router.push('/dashboard/faculty');
                                }}
                                className="nav-dropdown-item"
                                style={{
                                  backgroundColor: pathname === '/dashboard/faculty' ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
                                  borderRadius: '8px',
                                  color: 'var(--color-ink)',
                                  padding: '8px 10px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  width: '100%',
                                  textAlign: 'left',
                                  cursor: 'pointer',
                                }}
                              >
                                <Users size={15} style={{ color: '#2563EB', flexShrink: 0 }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: '12.5px', fontWeight: 600, lineHeight: 1.2, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span>Faculty Mentor Portal</span>
                                    {pathname === '/dashboard/faculty' && (
                                      <span style={{ fontSize: '9.5px', fontWeight: 700, color: '#1D4ED8', backgroundColor: '#EFF6FF', padding: '1px 5px', borderRadius: '4px' }}>
                                        Active
                                      </span>
                                    )}
                                  </div>
                                  <div style={{ fontSize: '10.5px', color: 'var(--color-text-muted)' }}>
                                    Mentor &amp; judge workspace
                                  </div>
                                </div>
                              </button>
                            )}
                            <div className="nav-dropdown-divider" style={{ margin: '4px 0' }} />
                          </div>
                        )}

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

                        {/* Desktop Notifications Toggle */}
                        <button
                          type="button"
                          onClick={async () => {
                            setUserMenuOpen(false);
                            const perm = await requestDeviceNotificationPermission();
                            if (perm === 'granted') {
                              triggerSystemNotification({
                                id: 'system-test-' + Date.now(),
                                subject: 'Desktop Alerts Active',
                                body: 'System notifications are active and working on your device.',
                              });
                            } else {
                              router.push('/notifications');
                            }
                          }}
                          className="nav-dropdown-item"
                        >
                          <BellRing size={15} style={{ color: '#F59E0B', flexShrink: 0 }} />
                          <span>Desktop & OS Alerts</span>
                        </button>

                        <div className="nav-dropdown-divider" />

                        {/* Sign Out */}
                        <button
                          type="button"
                          disabled={loggingOut}
                          onClick={handleLogout}
                          className="nav-dropdown-item nav-dropdown-item-danger"
                          style={{
                            opacity: loggingOut ? 0.7 : 1,
                            cursor: loggingOut ? 'wait' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            width: '100%',
                          }}
                        >
                          {loggingOut ? (
                            <div
                              style={{
                                width: '14px',
                                height: '14px',
                                border: '2px solid rgba(239, 68, 68, 0.3)',
                                borderTopColor: '#EF4444',
                                borderRadius: '50%',
                                animation: 'spin 0.6s linear infinite',
                                flexShrink: 0,
                              }}
                            />
                          ) : (
                            <LogOut size={15} style={{ flexShrink: 0 }} />
                          )}
                          <span>{loggingOut ? 'Signing Out...' : 'Sign Out'}</span>
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
          </div>
        </header>
      </div>

      <style jsx global>{`
        .nav-left {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          flex: 1 1 0;
          min-width: 0;
        }
        .brand-logo-link {
          display: inline-flex;
          align-items: center;
          gap: 8.5px;
          text-decoration: none;
          flex-shrink: 0;
          transition: opacity 0.15s ease;
        }
        .brand-logo-link:hover {
          opacity: 0.88;
        }
        .logo-icon-box {
          width: 28px;
          height: 28px;
          border-radius: 7px;
          background-color: #0F172A;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.12);
          flex-shrink: 0;
          transition: transform 0.2s ease;
        }
        .logo-icon-box:hover {
          opacity: 0.9;
        }
        .logo-brand-text {
          font-weight: 800;
          font-size: 16px;
          color: var(--color-ink, #0F172A);
          letter-spacing: -0.025em;
          line-height: 1;
          white-space: nowrap;
        }
        .nav-center {
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 auto;
          margin: 0 8px;
        }
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
        .nav-right {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          flex: 1 1 0;
          min-width: 0;
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
          width: 250px;
          max-width: calc(100vw - 32px);
          box-sizing: border-box;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 14px;
          box-shadow: 0 16px 36px -4px rgba(15, 23, 42, 0.16), 0 6px 16px -2px rgba(15, 23, 42, 0.08);
          padding: 6px;
          z-index: 2000;
          animation: navDropdownFade 0.15s cubic-bezier(0.16, 1, 0.3, 1);
          overflow: hidden;
        }
        @keyframes navDropdownFade {
          from {
            opacity: 0;
            transform: translateY(-4px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .nav-dropdown-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px 10px;
          box-sizing: border-box;
          width: 100%;
          min-width: 0;
        }
        .nav-dropdown-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #1E40AF 0%, #2563EB 100%);
          color: #FFFFFF;
          font-size: 13px;
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
          gap: 10px;
          width: 100%;
          padding: 9px 12px;
          font-size: 13px;
          font-weight: 500;
          border-radius: 8px;
          border: none;
          background: transparent;
          cursor: pointer;
          color: #334155;
          text-align: left;
          box-sizing: border-box;
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

        .desktop-role-pill {
          display: none;
        }

        @media (min-width: 1080px) {
          .desktop-role-pill {
            display: inline-flex !important;
            align-items: center;
          }
        }

        .nav-role-name {
          max-width: 140px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          display: inline-block;
          vertical-align: middle;
        }

        .nav-role-badge-link {
          text-decoration: none;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .nav-role-badge-link:hover {
          background-color: #F8FAFC;
          border-color: #CBD5E1;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05);
        }

        .nav-role-tag-admin {
          color: #2563EB !important;
          background-color: #EFF6FF !important;
          border: 1px solid #DBEAFE !important;
          font-weight: 700;
          letter-spacing: 0.01em;
          flex-shrink: 0;
        }

        .nav-role-badge-link:hover .nav-role-tag-admin {
          background-color: #DBEAFE !important;
          border-color: #BFDBFE !important;
        }

        /* Auto-hide brand text on compact & split viewports to prioritize action buttons */
        @media (max-width: 768px) {
          .logo-brand-text {
            display: none !important;
          }
          .brand-logo-link {
            gap: 0 !important;
          }
          .nav-left {
            flex: 0 0 auto !important;
          }
          .nav-center {
            flex: 1 1 auto !important;
            justify-content: center !important;
            margin: 0 6px !important;
          }
          .nav-right {
            flex: 0 0 auto !important;
          }
        }

        @media (max-width: 639px) {
          .mobile-hide-btn {
            display: none !important;
          }
          .mobile-btn-text {
            display: none !important;
          }
          .nav-pill {
            padding: 6px 0 !important;
            gap: 6px !important;
          }
          .nav-center {
            margin: 0 4px !important;
          }
          .nav-faculty-toggle {
            padding: 2.5px !important;
            gap: 2px !important;
          }
          .nav-faculty-tab {
            padding: 4px 7px !important;
            font-size: 11px !important;
            gap: 3px !important;
          }
          .nav-right-controls {
            gap: 4px !important;
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
            padding: 2px 4px 2px 2px !important;
          }
          .nav-avatar-circle {
            width: 24px !important;
            height: 24px !important;
            font-size: 10px !important;
          }
          .logo-icon-box {
            width: 26px !important;
            height: 26px !important;
            border-radius: 6px !important;
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
        userName={activeUser?.fullName}
      />

      {/* Password Change Modal with Complete User Name */}
      <PasswordChangeModal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        onSuccess={() => {
          setPasswordModalOpen(false);
          router.push('/login');
        }}
        userName={activeUser?.fullName}
      />

      {/* Role-Specific Help Modal with keyword search and counter */}
      {activeUser && (
        <HelpModal
          isOpen={helpModalOpen}
          onClose={() => setHelpModalOpen(false)}
          userRole={activeUser.role === 'supervisor' ? 'supervisor' : activeUser.role === 'admin' ? 'admin' : 'leader'}
        />
      )}

      {/* Instant Portal Transition Indicator */}
      {switchingPortal && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 999999,
            backgroundColor: '#0F172A',
            color: '#FFFFFF',
            padding: '9px 20px',
            borderRadius: '30px',
            boxShadow: '0 10px 35px rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13px',
            fontWeight: 700,
            letterSpacing: '-0.01em',
            border: '1px solid rgba(255,255,255,0.18)',
            pointerEvents: 'none',
          }}
        >
          <span
            style={{
              width: '14px',
              height: '14px',
              border: '2px solid rgba(255,255,255,0.3)',
              borderTopColor: '#38BDF8',
              borderRadius: '50%',
              display: 'inline-block',
              animation: 'spin 0.6s linear infinite',
            }}
          />
          <span>Switching to {switchingPortal}...</span>
        </div>
      )}
    </>
  );
}

