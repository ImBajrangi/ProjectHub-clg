'use client';

import React, { useEffect, useState } from 'react';
import {
  X,
  CheckCheck,
  Bell,
  CheckCircle,
  Info,
  BellOff,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Calendar,
  Send,
  FileText,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { NotificationItem } from '@/lib/types';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  userName?: string;
}

interface NotificationTheme {
  borderLeft: string;
  badgeBg: string;
  badgeColor: string;
  badgeBorder: string;
  unreadDot: string;
  cardBorder: string;
  cardBg: string;
  btnBorder: string;
  btnColor: string;
  typeLabel: string;
  icon: React.ReactNode;
}

function getNotificationTheme(item: NotificationItem): NotificationTheme {
  const text = `${item.subject} ${item.body} ${item.category || ''}`.toLowerCase();

  // 1. Withdrawn / Cancelled / Rejected (Rose / Crimson)
  if (text.includes('withdrawn') || text.includes('cancelled') || text.includes('canceled') || text.includes('rejected')) {
    return {
      borderLeft: item.is_read ? '3px solid #CBD5E1' : '3px solid #E11D48',
      badgeBg: item.is_read ? 'var(--color-canvas-soft)' : '#FFF1F2',
      badgeColor: item.is_read ? 'var(--color-text-muted)' : '#BE123C',
      badgeBorder: item.is_read ? 'var(--color-hairline)' : '#FECDD3',
      unreadDot: '#E11D48',
      cardBorder: item.is_read ? 'var(--color-hairline)' : '#FFE4E6',
      cardBg: '#FFFFFF',
      btnBorder: '#FECDD3',
      btnColor: '#BE123C',
      typeLabel: 'Request Withdrawn',
      icon: <XCircle size={11} style={{ color: item.is_read ? 'var(--color-text-muted)' : '#E11D48', flexShrink: 0 }} />,
    };
  }

  // 2. Approved / Completed / Phase Cleared / Logged (Emerald Green)
  if (
    text.includes('approved') ||
    text.includes('completed') ||
    text.includes('cleared') ||
    text.includes('logged') ||
    text.includes('scores successfully recorded')
  ) {
    return {
      borderLeft: item.is_read ? '3px solid #CBD5E1' : '3px solid #059669',
      badgeBg: item.is_read ? 'var(--color-canvas-soft)' : '#ECFDF5',
      badgeColor: item.is_read ? 'var(--color-text-muted)' : '#047857',
      badgeBorder: item.is_read ? 'var(--color-hairline)' : '#A7F3D0',
      unreadDot: '#059669',
      cardBorder: item.is_read ? 'var(--color-hairline)' : '#D1FAE5',
      cardBg: '#FFFFFF',
      btnBorder: '#A7F3D0',
      btnColor: '#047857',
      typeLabel: 'Approved / Completed',
      icon: <CheckCircle2 size={11} style={{ color: item.is_read ? 'var(--color-text-muted)' : '#059669', flexShrink: 0 }} />,
    };
  }

  // 3. Revision Requested / Action Required / Directive (Amber)
  if (text.includes('revision') || text.includes('attention') || text.includes('directive') || text.includes('action required')) {
    return {
      borderLeft: item.is_read ? '3px solid #CBD5E1' : '3px solid #D97706',
      badgeBg: item.is_read ? 'var(--color-canvas-soft)' : '#FFFBEB',
      badgeColor: item.is_read ? 'var(--color-text-muted)' : '#B45309',
      badgeBorder: item.is_read ? 'var(--color-hairline)' : '#FDE68A',
      unreadDot: '#D97706',
      cardBorder: item.is_read ? 'var(--color-hairline)' : '#FEF3C7',
      cardBg: '#FFFFFF',
      btnBorder: '#FDE68A',
      btnColor: '#B45309',
      typeLabel: 'Revision Required',
      icon: <AlertTriangle size={11} style={{ color: item.is_read ? 'var(--color-text-muted)' : '#D97706', flexShrink: 0 }} />,
    };
  }

  // 4. Scheduled / Confirmed / Calendar (Purple / Indigo)
  if (text.includes('scheduled') || text.includes('rescheduled') || text.includes('slot confirmed')) {
    return {
      borderLeft: item.is_read ? '3px solid #CBD5E1' : '3px solid #7C3AED',
      badgeBg: item.is_read ? 'var(--color-canvas-soft)' : '#F5F3FF',
      badgeColor: item.is_read ? 'var(--color-text-muted)' : '#6D28D9',
      badgeBorder: item.is_read ? 'var(--color-hairline)' : '#DDD6FE',
      unreadDot: '#7C3AED',
      cardBorder: item.is_read ? 'var(--color-hairline)' : '#E9D5FF',
      cardBg: '#FFFFFF',
      btnBorder: '#DDD6FE',
      btnColor: '#6D28D9',
      typeLabel: 'Meeting Scheduled',
      icon: <Calendar size={11} style={{ color: item.is_read ? 'var(--color-text-muted)' : '#7C3AED', flexShrink: 0 }} />,
    };
  }

  // 5. Submitted / New Request / General (Royal Blue)
  return {
    borderLeft: item.is_read ? '3px solid #CBD5E1' : '3px solid #2563EB',
    badgeBg: item.is_read ? 'var(--color-canvas-soft)' : '#EFF6FF',
    badgeColor: item.is_read ? 'var(--color-text-muted)' : '#1D4ED8',
    badgeBorder: item.is_read ? 'var(--color-hairline)' : '#BFDBFE',
    unreadDot: '#2563EB',
    cardBorder: item.is_read ? 'var(--color-hairline)' : '#DBEAFE',
    cardBg: '#FFFFFF',
    btnBorder: '#BFDBFE',
    btnColor: '#1D4ED8',
    typeLabel: 'Request Dispatched',
    icon: <Send size={11} style={{ color: item.is_read ? 'var(--color-text-muted)' : '#2563EB', flexShrink: 0 }} />,
  };
}

function getDirectSnippet(body: string): string {
  if (!body) return '';
  const lines = body
    .split('\n')
    .map((l) => l.trim())
    .filter(
      (l) =>
        l.length > 0 &&
        !l.startsWith('-') &&
        !l.startsWith('Session Summary:') &&
        !l.startsWith('Meeting Logistics:') &&
        !l.startsWith('Dear ')
    );
  const firstSentence = lines[0] || body;
  if (firstSentence.length > 135) {
    return firstSentence.slice(0, 132) + '...';
  }
  return firstSentence;
}

export default function NotificationDrawer({
  isOpen,
  onClose,
  notifications,
  onMarkRead,
  onMarkAllRead,
  onRefresh,
  userName,
}: NotificationDrawerProps & { onRefresh?: () => void }) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Background page scroll lock & instant refresh on open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      onRefresh?.();
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onRefresh]);

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          height: '100%',
          backgroundColor: '#FFFFFF',
          borderLeft: '1px solid var(--color-hairline)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-6px 0 28px rgba(15, 23, 42, 0.08)',
          animation: 'slideInRight 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '18px 22px',
            borderBottom: '1px solid var(--color-hairline)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#FFFFFF',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                backgroundColor: '#EFF6FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563EB',
              }}
            >
              <Bell size={17} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-ink)' }}>
                  Notification Center
                </h3>
                {unreadCount > 0 && (
                  <span
                    style={{
                      fontSize: '10px',
                      padding: '2px 7px',
                      borderRadius: 'var(--rounded-full)',
                      backgroundColor: '#EFF6FF',
                      color: '#1D4ED8',
                      fontWeight: 700,
                      border: '1px solid #BFDBFE',
                    }}
                  >
                    {unreadCount} New
                  </span>
                )}
              </div>
              {userName && (
                <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  {userName} • Official Academic & Milestone Notices
                </p>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllRead}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 11px',
                  fontSize: '11px',
                  fontWeight: 600,
                  backgroundColor: 'var(--color-canvas-soft)',
                  color: 'var(--color-ink)',
                  border: '1px solid var(--color-hairline)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                <CheckCheck size={13} /> Mark All Read
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                padding: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '6px',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Real-Time Device Notification Status Banner */}
        <DeviceNotificationBanner />

        {/* Notifications List */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            backgroundColor: '#F8FAFC',
          }}
        >
          {notifications.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: '#E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                  color: '#64748B',
                }}
              >
                <Bell size={22} />
              </div>
              <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-ink)' }}>No Notifications</p>
              <p style={{ fontSize: '12px', marginTop: '4px', maxWidth: '320px', margin: '4px auto 0' }}>
                All milestone reviews, schedule updates, and meeting logs will appear here in real-time.
              </p>
            </div>
          ) : (
            notifications.map((item) => {
              const isExpanded = expandedIds.has(item.id);
              const previewText = getDirectSnippet(item.body);
              const theme = getNotificationTheme(item);

              return (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: theme.cardBg,
                    borderRadius: '10px',
                    borderTop: `1px solid ${theme.cardBorder}`,
                    borderRight: `1px solid ${theme.cardBorder}`,
                    borderBottom: `1px solid ${theme.cardBorder}`,
                    borderLeft: theme.borderLeft,
                    padding: '14px 16px',
                    boxShadow: item.is_read ? '0 1px 2px rgba(15, 23, 42, 0.02)' : '0 2px 8px rgba(15, 23, 42, 0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {/* Meta Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2.5px 8px',
                          borderRadius: '5px',
                          backgroundColor: theme.badgeBg,
                          color: theme.badgeColor,
                          border: `1px solid ${theme.badgeBorder}`,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4.5px',
                        }}
                      >
                        {theme.icon}
                        <span>{item.category || theme.typeLabel}</span>
                      </span>
                      {!item.is_read && (
                        <span style={{ fontSize: '10px', fontWeight: 700, color: theme.badgeColor, display: 'flex', alignItems: 'center', gap: '3.5px' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: theme.unreadDot, display: 'inline-block' }}></span>
                          Unread
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      <Clock size={11} />
                      <span>{new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>

                  {/* Subject */}
                  <div
                    onClick={() => toggleExpand(item.id)}
                    style={{
                      fontSize: '13px',
                      fontWeight: 800,
                      color: 'var(--color-ink)',
                      letterSpacing: '-0.01em',
                      lineHeight: 1.4,
                      cursor: 'pointer',
                    }}
                  >
                    {item.subject}
                  </div>

                  {/* Minimized Direct Info Preview (when collapsed) */}
                  {!isExpanded && previewText && (
                    <p
                      onClick={() => toggleExpand(item.id)}
                      style={{
                        fontSize: '12px',
                        color: 'var(--color-text-muted)',
                        margin: 0,
                        lineHeight: 1.5,
                        cursor: 'pointer',
                      }}
                    >
                      {previewText}
                    </p>
                  )}

                  {/* Full Formatted Notice (when expanded) */}
                  {isExpanded && (
                    <div
                      style={{
                        backgroundColor: 'var(--color-canvas-soft)',
                        borderRadius: '8px',
                        padding: '12px 14px',
                        fontSize: '12px',
                        lineHeight: '1.6',
                        color: 'var(--color-ink-soft)',
                        border: '1px solid var(--color-hairline)',
                        marginTop: '2px',
                      }}
                    >
                      {item.salutation && (
                        <div style={{ fontWeight: 700, color: 'var(--color-ink)', marginBottom: '6px' }}>
                          {item.salutation}
                        </div>
                      )}
                      <div style={{ whiteSpace: 'pre-wrap', color: 'var(--color-ink-soft)' }}>
                        {item.body}
                      </div>
                      {item.signoff && (
                        <div style={{ color: 'var(--color-text-muted)', fontSize: '11px', marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed var(--color-hairline)' }}>
                          {item.signoff}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Bar (Expand / Collapse + Mark Read) */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px', borderTop: '1px solid var(--color-hairline)', marginTop: '2px' }}>
                    <button
                      type="button"
                      onClick={() => toggleExpand(item.id)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: isExpanded ? theme.badgeColor : 'var(--color-text-muted)',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '2px 0',
                      }}
                    >
                      <span>{isExpanded ? 'Hide Full Notice' : 'View Full Notice'}</span>
                      {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>

                    {!item.is_read && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkRead(item.id);
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 9px',
                          fontSize: '11px',
                          fontWeight: 600,
                          backgroundColor: '#FFFFFF',
                          color: theme.btnColor,
                          border: `1px solid ${theme.btnBorder}`,
                          borderRadius: '5px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <CheckCircle2 size={11} /> Mark Read
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function DeviceNotificationBanner() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  if (!supported) return null;

  const requestPermission = async () => {
    try {
      const res = await Notification.requestPermission();
      setPermission(res);
      if (res === 'granted') {
        new Notification('CodeShastra ProjectHub', {
          body: 'Real-time device notifications are now enabled on this device!',
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const sendTest = () => {
    if (permission === 'granted' && typeof window !== 'undefined' && 'Notification' in window) {
      new Notification('CodeShastra ProjectHub', {
        body: 'Real-time alert: Notifications are active on your device.',
      });
    }
  };

  // Professional, subtle, non-intrusive banner
  return (
    <div
      style={{
        padding: '10px 18px',
        backgroundColor: permission === 'granted' ? '#F0FDF4' : '#F8FAFC',
        borderBottom: '1px solid var(--color-hairline)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '11px',
        flexWrap: 'wrap',
        gap: '8px',
      }}
    >
      {permission === 'granted' ? (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#166534', fontWeight: 600 }}>
            <CheckCircle2 size={13} /> Real-time device alerts enabled
          </div>
          <button
            type="button"
            onClick={sendTest}
            style={{
              padding: '3px 8px',
              fontSize: '10px',
              fontWeight: 600,
              backgroundColor: '#FFFFFF',
              border: '1px solid #BBF7D0',
              borderRadius: '4px',
              color: '#166534',
              cursor: 'pointer',
            }}
          >
            Send Test
          </button>
        </>
      ) : permission === 'denied' ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-muted)' }}>
          <Info size={12} color="#64748B" /> Browser push alerts are turned off. In-app notices will always appear here.
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-muted)' }}>
            <Bell size={12} color="#2563EB" /> Get real-time milestone alerts on your device:
          </div>
          <button
            type="button"
            onClick={requestPermission}
            style={{
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: 600,
              backgroundColor: '#2563EB',
              color: '#FFFFFF',
              border: '1px solid #1D4ED8',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Enable Alerts
          </button>
        </>
      )}
    </div>
  );
}
