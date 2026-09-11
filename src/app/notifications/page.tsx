'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  BellRing,
  CheckCheck,
  Search,
  Filter,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  Award,
  ArrowLeft,
  Volume2,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { NotificationItem } from '@/lib/types';
import {
  triggerSystemNotification,
  requestDeviceNotificationPermission,
  playNotificationChime,
} from '@/lib/deviceNotification';
import { clientCache } from '@/lib/clientCache';

export default function NotificationsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'revisions' | 'meetings' | 'evaluations'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [actionLoading, setActionLoading] = useState(false);

  const scrollToCenter = (elementId: string) => {
    setTimeout(() => {
      const el = document.getElementById(elementId);
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const navOffset = 70;
      const availableHeight = window.innerHeight - navOffset;
      if (rect.height >= availableHeight) {
        const targetScroll = window.scrollY + rect.top - navOffset - 16;
        window.scrollTo({ top: Math.max(0, targetScroll), behavior: 'smooth' });
      } else {
        const centerOffset = (availableHeight - rect.height) / 2;
        const targetScroll = window.scrollY + rect.top - navOffset - centerOffset;
        window.scrollTo({ top: Math.max(0, targetScroll), behavior: 'smooth' });
      }
    }, 60);
  };

  // Check system notification permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  const loadNotifications = async () => {
    try {
      const [authRes, notifRes] = await Promise.all([
        currentUser ? Promise.resolve(null) : fetch('/api/auth/me', { cache: 'no-store' }),
        fetch('/api/notifications', { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } }),
      ]);

      let loggedInUser = currentUser;

      if (authRes) {
        if (!authRes.ok) {
          router.push('/login');
          return;
        }
        const authData = await authRes.json();
        if (!authData.authenticated || !authData.user) {
          router.push('/login');
          return;
        }
        loggedInUser = authData.user;
        setCurrentUser(authData.user);
        clientCache.set(clientCache.keys.USER_ME, authData.user);
      }

      if (notifRes.ok) {
        const notifData = await notifRes.json();
        const rawNotifs: NotificationItem[] = notifData.notifications || [];
        const notifs = loggedInUser?.id
          ? rawNotifs.filter((n) => String(n.user_id) === String(loggedInUser.id))
          : rawNotifs;
        setNotifications(notifs);

        if (loggedInUser?.id) {
          clientCache.set(clientCache.keys.NOTIFICATIONS(loggedInUser.id), notifs);
        }
      }
    } catch (err) {
      console.error('Error loading notifications page:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 1. Instant 0ms cache hydration
    const cachedUser = clientCache.get<any>(clientCache.keys.USER_ME);
    if (cachedUser?.id) {
      setCurrentUser(cachedUser);
      const cachedNotifs = clientCache.get<NotificationItem[]>(clientCache.keys.NOTIFICATIONS(cachedUser.id));
      if (cachedNotifs && cachedNotifs.length > 0) {
        setNotifications(cachedNotifs);
        setLoading(false);
      }
    }

    // 2. Fetch fresh on load/reload
    loadNotifications();

    if (typeof window === 'undefined') return;

    const handleUpdate = () => loadNotifications();
    window.addEventListener('codeshastra_notification_update', handleUpdate);

    let bc: BroadcastChannel | null = null;
    if ('BroadcastChannel' in window) {
      try {
        bc = new BroadcastChannel('codeshastra_notifications_channel');
        bc.onmessage = () => loadNotifications();
      } catch {}
    }

    return () => {
      window.removeEventListener('codeshastra_notification_update', handleUpdate);
      if (bc) bc.close();
    };
  }, []);

  const handleEnableSystemNotifications = async () => {
    const perm = await requestDeviceNotificationPermission();
    setPermissionStatus(perm);
    if (perm === 'granted') {
      triggerSystemNotification({
        id: 'system-enabled',
        subject: 'System Notifications Activated',
        body: 'You will now receive instant desktop and OS alerts for revisions, approvals, and meetings.',
      });
    }
  };

  const handleTestNotification = () => {
    playNotificationChime();
    triggerSystemNotification({
      id: 'test-notif-' + Date.now(),
      subject: 'CodeShastra System Alert Test',
      body: 'System notifications are working flawlessly on your operating system.',
      url: '/notifications',
    });
  };

  const handleMarkRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (String(n.id) === String(id) ? { ...n, is_read: true } : n))
    );
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_read', id }),
      });
      window.dispatchEvent(new Event('codeshastra_notification_update'));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    setActionLoading(true);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_all_read' }),
      });
      window.dispatchEvent(new Event('codeshastra_notification_update'));
    } catch {} finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => String(n.id) !== String(id)));
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      });
      window.dispatchEvent(new Event('codeshastra_notification_update'));
    } catch {}
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to clear all notifications?')) return;
    setActionLoading(true);
    setNotifications([]);
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear_all' }),
      });
      window.dispatchEvent(new Event('codeshastra_notification_update'));
    } catch {} finally {
      setActionLoading(false);
    }
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      // Safety filter: ensure notification belongs to current user
      if (currentUser?.id && n.user_id && String(n.user_id) !== String(currentUser.id)) {
        return false;
      }

      // Tab filter
      if (activeTab === 'unread' && n.is_read) return false;
      const text = `${n.subject || ''} ${n.body || ''} ${n.category || ''}`.toLowerCase();
      if (activeTab === 'revisions' && !text.includes('revis') && !text.includes('proposal') && !text.includes('statement') && !text.includes('approv')) {
        return false;
      }
      if (activeTab === 'meetings' && !text.includes('meet') && !text.includes('schedul') && !text.includes('attend')) {
        return false;
      }
      if (activeTab === 'evaluations' && !text.includes('eval') && !text.includes('mark') && !text.includes('phase') && !text.includes('score')) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return text.includes(q);
      }

      return true;
    });
  }, [notifications, activeTab, searchQuery]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.is_read).length, [notifications]);

  const getCategoryBadge = (item: NotificationItem) => {
    const text = `${item.subject || ''} ${item.body || ''}`.toLowerCase();
    if (text.includes('revision') || text.includes('refine')) {
      return { label: 'Revision Required', bg: '#FEF3C7', color: '#92400E', border: '#FCD34D', icon: <AlertCircle size={12} /> };
    }
    if (text.includes('approved') || text.includes('locked')) {
      return { label: 'Approved', bg: '#D1FAE5', color: '#065F46', border: '#A7F3D0', icon: <CheckCircle2 size={12} /> };
    }
    if (text.includes('meeting') || text.includes('scheduled')) {
      return { label: 'Meeting', bg: '#DBEAFE', color: '#1E40AF', border: '#BFDBFE', icon: <Calendar size={12} /> };
    }
    if (text.includes('evaluation') || text.includes('phase')) {
      return { label: 'Evaluation', bg: '#EDE9FE', color: '#5B21B6', border: '#DDD6FE', icon: <Award size={12} /> };
    }
    return { label: 'Notice', bg: 'var(--color-canvas-soft)', color: 'var(--color-text-muted)', border: 'var(--color-hairline)', icon: <Bell size={12} /> };
  };

  const getDashboardLink = () => {
    if (!currentUser) return '/dashboard/leader';
    if (currentUser.role === 'admin') return '/admin';
    if (currentUser.role === 'supervisor') return '/dashboard/faculty';
    return '/dashboard/leader';
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-canvas)', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        user={
          currentUser
            ? {
                id: currentUser.id,
                fullName: currentUser.full_name,
                email: currentUser.email,
                role: currentUser.role,
                isLeader: currentUser.is_leader,
              }
            : null
        }
      />

      <main style={{ flex: 1, maxWidth: '1080px', width: '100%', margin: '0 auto', padding: '24px 16px 60px' }}>
        {/* Breadcrumb & Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <Link
            href={getDashboardLink()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--color-text-muted)',
              textDecoration: 'none',
              padding: '6px 12px',
              borderRadius: '6px',
              backgroundColor: 'var(--color-canvas-soft)',
              border: '1px solid var(--color-hairline)',
            }}
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>

          {/* System Notification Permission Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {permissionStatus === 'granted' ? (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#065F46',
                  backgroundColor: '#D1FAE5',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  border: '1px solid #A7F3D0',
                }}
              >
                <ShieldCheck size={14} /> System Notifications Active
              </span>
            ) : (
              <button
                onClick={handleEnableSystemNotifications}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#92400E',
                  backgroundColor: '#FEF3C7',
                  border: '1px solid #FCD34D',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                <BellRing size={14} /> Enable System Notifications
              </button>
            )}

            <button
              onClick={handleTestNotification}
              title="Test system notification chime and desktop banner"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--color-ink)',
                backgroundColor: 'var(--color-canvas-soft)',
                border: '1px solid var(--color-hairline)',
                padding: '5px 10px',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              <Volume2 size={13} /> Test Alert
            </button>
          </div>
        </div>

        {/* Header Banner */}
        <div
          className="card"
          style={{
            marginBottom: '20px',
            padding: '24px',
            background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.04) 0%, rgba(245, 158, 11, 0.04) 100%)',
            border: '1px solid var(--color-hairline)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--color-primary-light)',
                    color: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Bell size={20} />
                </div>
                <div>
                  <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-ink)', margin: 0 }}>
                    Notification Center
                  </h1>
                  <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: '2px 0 0' }}>
                    Live official directives, mentor revision requests, and schedule alerts.
                  </p>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={actionLoading}
                  className="btn btn-outline"
                  style={{ fontSize: '12.5px', padding: '6px 12px' }}
                >
                  <CheckCheck size={14} /> Mark All as Read ({unreadCount})
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  disabled={actionLoading}
                  className="btn btn-outline"
                  style={{ fontSize: '12.5px', padding: '6px 12px', color: 'var(--color-danger)' }}
                >
                  <Trash2 size={14} /> Clear All
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filter Controls & Search */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            marginBottom: '16px',
            flexWrap: 'wrap',
          }}
        >
          {/* Tab Filters */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px', maxWidth: '100%' }}>
            {[
              { id: 'all', label: `All (${notifications.length})` },
              { id: 'unread', label: `Unread (${unreadCount})` },
              { id: 'revisions', label: 'Proposals & Revisions' },
              { id: 'meetings', label: 'Meetings' },
              { id: 'evaluations', label: 'Evaluations' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '12.5px',
                  fontWeight: activeTab === tab.id ? 700 : 500,
                  backgroundColor: activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-canvas-soft)',
                  color: activeTab === tab.id ? '#FFFFFF' : 'var(--color-text-muted)',
                  border: activeTab === tab.id ? '1px solid var(--color-primary)' : '1px solid var(--color-hairline)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', minWidth: '220px', flex: '1', maxWidth: '320px' }}>
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-text-muted)',
              }}
            />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 10px 6px 32px',
                fontSize: '12.5px',
                borderRadius: '8px',
                border: '1px solid var(--color-hairline)',
                backgroundColor: 'var(--color-canvas-soft)',
                color: 'var(--color-ink)',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--color-primary)' }} />
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Loading notification history...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-canvas-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px',
                color: 'var(--color-text-muted)',
              }}
            >
              <Bell size={24} />
            </div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-ink)', marginBottom: '4px' }}>
              No Notifications Found
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', maxWidth: '360px', margin: '0 auto' }}>
              {searchQuery
                ? 'No notifications match your search query.'
                : activeTab === 'unread'
                ? 'All caught up! You have no unread notifications.'
                : 'You have no notifications in this category.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredNotifications.map((notif) => {
              const badge = getCategoryBadge(notif);
              const isExpanded = expandedId === String(notif.id);
              const isUnread = !notif.is_read;

              return (
                <div
                  key={notif.id}
                  id={`notif-card-${notif.id}`}
                  onClick={() => {
                    if (isUnread) handleMarkRead(String(notif.id));
                    const nextExpanded = !isExpanded;
                    setExpandedId(nextExpanded ? String(notif.id) : null);
                    if (nextExpanded) {
                      scrollToCenter(`notif-card-${notif.id}`);
                    }
                  }}
                  className="card"
                  style={{
                    padding: '16px 20px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    borderLeft: isUnread ? '4px solid var(--color-primary)' : '1px solid var(--color-hairline)',
                    backgroundColor: isUnread ? 'rgba(37, 99, 235, 0.02)' : 'var(--color-canvas-card)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            backgroundColor: badge.bg,
                            color: badge.color,
                            border: `1px solid ${badge.border}`,
                          }}
                        >
                          {badge.icon} {badge.label}
                        </span>

                        {isUnread && (
                          <span
                            style={{
                              width: '7px',
                              height: '7px',
                              borderRadius: '50%',
                              backgroundColor: 'var(--color-primary)',
                              display: 'inline-block',
                            }}
                          />
                        )}

                        <span style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', marginLeft: 'auto' }}>
                          {new Date(notif.created_at).toLocaleString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <h4
                        style={{
                          fontSize: '14px',
                          fontWeight: isUnread ? 700 : 600,
                          color: 'var(--color-ink)',
                          margin: '0 0 4px',
                        }}
                      >
                        {notif.subject || 'Notice'}
                      </h4>

                      <div
                        style={{
                          fontSize: '13px',
                          color: 'var(--color-text-muted)',
                          lineHeight: '1.5',
                          whiteSpace: isExpanded ? 'pre-wrap' : 'normal',
                          overflow: isExpanded ? 'visible' : 'hidden',
                          display: isExpanded ? 'block' : '-webkit-box',
                          WebkitLineClamp: isExpanded ? undefined : 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {notif.body}
                      </div>

                      {/* Expanded View Extras */}
                      {isExpanded && notif.salutation && (
                        <div
                          style={{
                            marginTop: '12px',
                            paddingTop: '10px',
                            borderTop: '1px dashed var(--color-hairline)',
                            fontSize: '12px',
                            color: 'var(--color-text-muted)',
                          }}
                        >
                          <strong>Salutation:</strong> {notif.salutation}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      <button
                        onClick={(e) => handleDelete(String(notif.id), e)}
                        title="Delete notification"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--color-text-muted)',
                          padding: '4px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
