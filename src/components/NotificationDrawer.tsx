'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  CheckCheck,
  Bell,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Calendar,
  Send,
  XCircle,
  Award,
  CalendarPlus,
  Users,
  FileCheck2,
  Info,
} from 'lucide-react';
import { NotificationItem } from '@/lib/types';
import { triggerSystemNotification, requestDeviceNotificationPermission } from '@/lib/deviceNotification';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  userName?: string;
  onRefresh?: () => void;
}

type NotificationCategoryType =
  | 'request'
  | 'scheduled'
  | 'logged'
  | 'clearance'
  | 'revision'
  | 'withdrawn'
  | 'evaluation'
  | 'general';

interface ParsedNotification {
  cleanSubject: string;
  categoryLabel: string;
  categoryType: NotificationCategoryType;
  directSummary: string;
  teamTag: string | null;
  relativeTime: string;
  theme: {
    bg: string;
    cardBorder: string;
    borderLeft: string;
    iconBg: string;
    iconColor: string;
    badgeBg: string;
    badgeColor: string;
    badgeBorder: string;
    unreadDot: string;
    btnColor: string;
    btnBorder: string;
    icon: React.ReactNode;
  };
}

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  } catch {
    return dateString;
  }
}

function parseNotification(item: NotificationItem): ParsedNotification {
  const rawSubject = item.subject || '';
  const rawBody = item.body || '';
  const rawCat = item.category || '';
  const combined = `${rawSubject} ${rawBody} ${rawCat}`.toLowerCase();

  // 1. Clean Subject: remove redundant suffixes
  let cleanSubject = rawSubject
    .replace(/\s*–\s*CodeShastra\s*ProjectHub/gi, '')
    .replace(/\s*-\s*CodeShastra\s*ProjectHub/gi, '')
    .replace(/\s*–\s*ProjectHub/gi, '')
    .replace(/\s*-\s*ProjectHub/gi, '')
    .trim();

  // 2. Extract Team Tag if present
  let teamTag: string | null = null;
  const teamMatch = combined.match(/team\s+([a-z0-9\-_]+)/i);
  if (teamMatch && teamMatch[0]) {
    teamTag = teamMatch[0].toUpperCase();
  }

  // 3. Classify Category & Visual Theme
  let categoryType: NotificationCategoryType = 'general';
  let categoryLabel = 'Notice';
  let directSummary = '';

  const isRead = Boolean(item.is_read);

  if (combined.includes('withdrawn') || combined.includes('cancelled') || combined.includes('canceled') || combined.includes('rejected')) {
    categoryType = 'withdrawn';
    categoryLabel = 'Request Withdrawn';
    directSummary = teamTag
      ? `${teamTag} cancelled and withdrew their pending meeting request.`
      : 'The pending review request was cancelled and withdrawn.';
  } else if (combined.includes('revision') || combined.includes('modification') || combined.includes('action required')) {
    categoryType = 'revision';
    categoryLabel = 'Revision Required';
    directSummary = 'Supervisor requested modifications before approval. Please revise and resubmit.';
  } else if (combined.includes('clearance') || combined.includes('cleared for') || combined.includes('eligibility confirmed')) {
    categoryType = 'clearance';
    categoryLabel = 'Phase Clearance';
    directSummary = teamTag
      ? `${teamTag} granted official presentation clearance for the upcoming evaluation milestone.`
      : 'Formal clearance granted for upcoming presentation evaluation.';
  } else if (combined.includes('scheduled') || combined.includes('rescheduled') || combined.includes('slot confirmed')) {
    categoryType = 'scheduled';
    categoryLabel = 'Meeting Scheduled';

    // Try extracting date / venue from body
    const dateMatch = rawBody.match(/Date:\s*([^\n]+)/i);
    const slotMatch = rawBody.match(/Time Slot:\s*([^\n]+)/i);
    const venueMatch = rawBody.match(/Venue[^:]*:\s*([^\n]+)/i);

    if (dateMatch && slotMatch) {
      directSummary = `Confirmed: ${dateMatch[1].trim()} at ${slotMatch[1].trim()}${venueMatch ? ` • Venue: ${venueMatch[1].trim()}` : ''}`;
    } else {
      directSummary = teamTag
        ? `Review meeting scheduled with supervisor for ${teamTag}. Check notice for venue details.`
        : 'Review meeting confirmed. Check notice for slot and venue details.';
    }
  } else if (combined.includes('logged') || combined.includes('attendance') || combined.includes('session summary')) {
    categoryType = 'logged';
    categoryLabel = 'Meeting Logged';
    directSummary = teamTag
      ? `Review session attendance and faculty directives logged for ${teamTag}.`
      : 'Milestone review attendance and directives officially archived in tracking log.';
  } else if (combined.includes('new meeting request') || combined.includes('initiated a meeting request') || combined.includes('meeting request submitted')) {
    categoryType = 'request';
    categoryLabel = 'Meeting Request';
    directSummary = teamTag
      ? `${teamTag} submitted a progress review meeting request. Awaiting faculty schedule confirmation.`
      : 'New milestone review meeting request submitted. Awaiting slot confirmation.';
  } else if (combined.includes('evaluation') || combined.includes('score') || combined.includes('panel')) {
    categoryType = 'evaluation';
    categoryLabel = 'Evaluation Panel';
    directSummary = 'Panel evaluation schedule & scoring records updated for this phase.';
  } else if (combined.includes('problem statement')) {
    categoryType = 'clearance';
    categoryLabel = 'Problem Statement';
    directSummary = 'Problem statement status updated in academic registry.';
  } else {
    // General fallback summary
    const cleanLines = rawBody
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith('Dear ') && !l.startsWith('Sincerely') && !l.startsWith('-'));
    directSummary = cleanLines[0] || rawBody.slice(0, 120);
    if (directSummary.length > 125) directSummary = directSummary.slice(0, 122) + '...';
  }

  // Theme definition
  let theme: ParsedNotification['theme'];

  switch (categoryType) {
    case 'withdrawn':
      theme = {
        bg: '#FFFFFF',
        cardBorder: isRead ? '#E2E8F0' : '#FECDD3',
        borderLeft: isRead ? '3px solid #CBD5E1' : '3px solid #E11D48',
        iconBg: isRead ? '#F1F5F9' : '#FFF1F2',
        iconColor: isRead ? '#94A3B8' : '#E11D48',
        badgeBg: isRead ? '#F8FAFC' : '#FFF1F2',
        badgeColor: isRead ? '#64748B' : '#BE123C',
        badgeBorder: isRead ? '#E2E8F0' : '#FECDD3',
        unreadDot: '#E11D48',
        btnColor: '#BE123C',
        btnBorder: '#FECDD3',
        icon: <XCircle size={15} />,
      };
      break;

    case 'revision':
      theme = {
        bg: '#FFFFFF',
        cardBorder: isRead ? '#E2E8F0' : '#FDE68A',
        borderLeft: isRead ? '3px solid #CBD5E1' : '3px solid #D97706',
        iconBg: isRead ? '#F1F5F9' : '#FFFBEB',
        iconColor: isRead ? '#94A3B8' : '#D97706',
        badgeBg: isRead ? '#F8FAFC' : '#FFFBEB',
        badgeColor: isRead ? '#64748B' : '#B45309',
        badgeBorder: isRead ? '#E2E8F0' : '#FDE68A',
        unreadDot: '#D97706',
        btnColor: '#B45309',
        btnBorder: '#FDE68A',
        icon: <AlertTriangle size={15} />,
      };
      break;

    case 'scheduled':
      theme = {
        bg: '#FFFFFF',
        cardBorder: isRead ? '#E2E8F0' : '#DDD6FE',
        borderLeft: isRead ? '3px solid #CBD5E1' : '3px solid #7C3AED',
        iconBg: isRead ? '#F1F5F9' : '#F5F3FF',
        iconColor: isRead ? '#94A3B8' : '#7C3AED',
        badgeBg: isRead ? '#F8FAFC' : '#F5F3FF',
        badgeColor: isRead ? '#64748B' : '#6D28D9',
        badgeBorder: isRead ? '#E2E8F0' : '#DDD6FE',
        unreadDot: '#7C3AED',
        btnColor: '#6D28D9',
        btnBorder: '#DDD6FE',
        icon: <Calendar size={15} />,
      };
      break;

    case 'logged':
    case 'clearance':
      theme = {
        bg: '#FFFFFF',
        cardBorder: isRead ? '#E2E8F0' : '#A7F3D0',
        borderLeft: isRead ? '3px solid #CBD5E1' : '3px solid #059669',
        iconBg: isRead ? '#F1F5F9' : '#ECFDF5',
        iconColor: isRead ? '#94A3B8' : '#059669',
        badgeBg: isRead ? '#F8FAFC' : '#ECFDF5',
        badgeColor: isRead ? '#64748B' : '#047857',
        badgeBorder: isRead ? '#E2E8F0' : '#A7F3D0',
        unreadDot: '#059669',
        btnColor: '#047857',
        btnBorder: '#A7F3D0',
        icon: categoryType === 'clearance' ? <Award size={15} /> : <CheckCircle2 size={15} />,
      };
      break;

    case 'evaluation':
      theme = {
        bg: '#FFFFFF',
        cardBorder: isRead ? '#E2E8F0' : '#E9D5FF',
        borderLeft: isRead ? '3px solid #CBD5E1' : '3px solid #9333EA',
        iconBg: isRead ? '#F1F5F9' : '#FAF5FF',
        iconColor: isRead ? '#94A3B8' : '#9333EA',
        badgeBg: isRead ? '#F8FAFC' : '#FAF5FF',
        badgeColor: isRead ? '#64748B' : '#7E22CE',
        badgeBorder: isRead ? '#E2E8F0' : '#E9D5FF',
        unreadDot: '#9333EA',
        btnColor: '#7E22CE',
        btnBorder: '#E9D5FF',
        icon: <Award size={15} />,
      };
      break;

    case 'request':
    default:
      theme = {
        bg: '#FFFFFF',
        cardBorder: isRead ? '#E2E8F0' : '#BFDBFE',
        borderLeft: isRead ? '3px solid #CBD5E1' : '3px solid #2563EB',
        iconBg: isRead ? '#F1F5F9' : '#EFF6FF',
        iconColor: isRead ? '#94A3B8' : '#2563EB',
        badgeBg: isRead ? '#F8FAFC' : '#EFF6FF',
        badgeColor: isRead ? '#64748B' : '#1D4ED8',
        badgeBorder: isRead ? '#E2E8F0' : '#BFDBFE',
        unreadDot: '#2563EB',
        btnColor: '#1D4ED8',
        btnBorder: '#BFDBFE',
        icon: <CalendarPlus size={15} />,
      };
      break;
  }

  return {
    cleanSubject,
    categoryLabel,
    categoryType,
    directSummary,
    teamTag,
    relativeTime: formatRelativeTime(item.created_at),
    theme,
  };
}

export default function NotificationDrawer({
  isOpen,
  onClose,
  notifications,
  onMarkRead,
  onMarkAllRead,
  onRefresh,
  userName,
}: NotificationDrawerProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'meetings' | 'clearances'>('all');

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

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const parsedItems = useMemo(() => {
    return notifications.map((n) => ({
      raw: n,
      parsed: parseNotification(n),
    }));
  }, [notifications]);

  const filteredItems = useMemo(() => {
    return parsedItems.filter(({ raw, parsed }) => {
      if (activeFilter === 'unread') return !raw.is_read;
      if (activeFilter === 'meetings') {
        return ['request', 'scheduled', 'logged', 'withdrawn'].includes(parsed.categoryType);
      }
      if (activeFilter === 'clearances') {
        return ['clearance', 'revision', 'evaluation'].includes(parsed.categoryType);
      }
      return true;
    });
  }, [parsedItems, activeFilter]);

  const [permState, setPermState] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermState(Notification.permission);
    }
  }, [isOpen]);

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
        backdropFilter: 'blur(1.5px)',
        WebkitBackdropFilter: 'blur(1.5px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '580px',
          height: '100%',
          backgroundColor: '#FFFFFF',
          borderLeft: '1px solid var(--color-hairline)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-6px 0 28px rgba(15, 23, 42, 0.12)',
          animation: 'slideInRight 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '16px 20px 12px',
            borderBottom: '1px solid var(--color-hairline)',
            backgroundColor: '#FFFFFF',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: '#EFF6FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2563EB',
                  flexShrink: 0,
                  boxShadow: '0 1px 3px rgba(37, 99, 235, 0.12)',
                }}
              >
                <Bell size={19} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-ink)', lineHeight: 1.2 }}>
                    Notification Center
                  </h3>
                  {unreadCount > 0 && (
                    <span
                      style={{
                        fontSize: '10.5px',
                        padding: '1.5px 7.5px',
                        borderRadius: 'var(--rounded-full)',
                        backgroundColor: '#EFF6FF',
                        color: '#1D4ED8',
                        fontWeight: 700,
                        border: '1px solid #BFDBFE',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {unreadCount} New
                    </span>
                  )}
                </div>
                {userName && (
                  <p style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {userName} • Academic Governance Notices
                  </p>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={onMarkAllRead}
                  className="drawer-desktop-mark-all"
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
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <CheckCheck size={13} /> Mark All Read
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  color: '#475569',
                  cursor: 'pointer',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '8px',
                  transition: 'all 0.15s ease',
                }}
                title="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Quick Filter Segmented Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '14px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11.5px',
                fontWeight: 600,
                border: activeFilter === 'all' ? '1px solid #2563EB' : '1px solid #E2E8F0',
                backgroundColor: activeFilter === 'all' ? '#EFF6FF' : '#FFFFFF',
                color: activeFilter === 'all' ? '#1D4ED8' : '#64748B',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s',
              }}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('unread')}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11.5px',
                fontWeight: 600,
                border: activeFilter === 'unread' ? '1px solid #2563EB' : '1px solid #E2E8F0',
                backgroundColor: activeFilter === 'unread' ? '#EFF6FF' : '#FFFFFF',
                color: activeFilter === 'unread' ? '#1D4ED8' : '#64748B',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s',
              }}
            >
              Unread ({unreadCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('meetings')}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11.5px',
                fontWeight: 600,
                border: activeFilter === 'meetings' ? '1px solid #2563EB' : '1px solid #E2E8F0',
                backgroundColor: activeFilter === 'meetings' ? '#EFF6FF' : '#FFFFFF',
                color: activeFilter === 'meetings' ? '#1D4ED8' : '#64748B',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s',
              }}
            >
              Meetings
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('clearances')}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11.5px',
                fontWeight: 600,
                border: activeFilter === 'clearances' ? '1px solid #2563EB' : '1px solid #E2E8F0',
                backgroundColor: activeFilter === 'clearances' ? '#EFF6FF' : '#FFFFFF',
                color: activeFilter === 'clearances' ? '#1D4ED8' : '#64748B',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s',
              }}
            >
              Clearances & Reviews
            </button>
          </div>

          {/* System OS Notification Enable Banner */}
          {permState !== 'granted' && (
            <div
              style={{
                marginTop: '12px',
                padding: '9px 12px',
                borderRadius: '8px',
                backgroundColor: '#F0FDF4',
                border: '1px solid #BBF7D0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <Bell size={14} style={{ color: '#16A34A', flexShrink: 0 }} />
                <span style={{ fontSize: '11.5px', color: '#15803D', fontWeight: 600 }}>
                  Enable direct desktop OS alerts
                </span>
              </div>
              <button
                type="button"
                onClick={async () => {
                  const res = await requestDeviceNotificationPermission();
                  setPermState(res);
                  if (res === 'granted') {
                    triggerSystemNotification({
                      id: 'test-welcome',
                      subject: 'System Alerts Enabled',
                      body: 'You will receive instant desktop notifications for evaluations, milestones, and meetings.',
                    });
                  }
                }}
                style={{
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  backgroundColor: '#16A34A',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 1px 2px rgba(22, 163, 74, 0.2)',
                }}
              >
                Enable OS Alerts
              </button>
            </div>
          )}

          {/* Mobile Mark All Read Full Bar */}
          {unreadCount > 0 && (
            <div className="drawer-mobile-mark-all" style={{ marginTop: '10px' }}>
              <button
                type="button"
                onClick={onMarkAllRead}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  backgroundColor: '#EFF6FF',
                  color: '#1D4ED8',
                  border: '1px solid #BFDBFE',
                  borderRadius: '7px',
                  cursor: 'pointer',
                }}
              >
                <CheckCheck size={14} /> Mark All {unreadCount} Notifications as Read
              </button>
            </div>
          )}
        </div>

        {/* Real-Time Device Notification Status Banner */}
        <DeviceNotificationBanner />

        {/* Notifications List */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            padding: '16px 20px',
            paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            backgroundColor: '#F8FAFC',
          }}
        >
          {filteredItems.length === 0 ? (
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
              <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-ink)' }}>No Notifications in this View</p>
              <p style={{ fontSize: '12px', marginTop: '4px', maxWidth: '320px', margin: '4px auto 0' }}>
                {activeFilter === 'unread'
                  ? 'All caught up! You have zero unread notifications.'
                  : 'Milestone reviews, schedule updates, and meeting logs will appear here in real-time.'}
              </p>
            </div>
          ) : (
            filteredItems.map(({ raw: item, parsed }) => {
              const isExpanded = expandedIds.has(item.id);
              const { theme } = parsed;

              return (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: theme.bg,
                    borderRadius: '11px',
                    borderTop: `1px solid ${theme.cardBorder}`,
                    borderRight: `1px solid ${theme.cardBorder}`,
                    borderBottom: `1px solid ${theme.cardBorder}`,
                    borderLeft: theme.borderLeft,
                    padding: '14px 16px',
                    boxShadow: item.is_read ? '0 1px 2px rgba(15, 23, 42, 0.02)' : '0 2px 8px rgba(15, 23, 42, 0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {/* Meta Bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      {/* Differentiated Category Badge */}
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2.5px 8.5px',
                          borderRadius: '6px',
                          backgroundColor: theme.badgeBg,
                          color: theme.badgeColor,
                          border: `1px solid ${theme.badgeBorder}`,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                      >
                        {theme.icon}
                        <span>{parsed.categoryLabel}</span>
                      </span>

                      {/* Team Tag Badge if applicable */}
                      {parsed.teamTag && (
                        <span
                          style={{
                            fontSize: '10.5px',
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: '5px',
                            backgroundColor: '#F1F5F9',
                            color: '#334155',
                            border: '1px solid #E2E8F0',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Users size={10} />
                          {parsed.teamTag}
                        </span>
                      )}

                      {!item.is_read && (
                        <span style={{ fontSize: '10.5px', fontWeight: 700, color: theme.badgeColor, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: theme.unreadDot, display: 'inline-block' }}></span>
                          Unread
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      <Clock size={11} />
                      <span>{parsed.relativeTime}</span>
                    </div>
                  </div>

                  {/* Main Subject & Direct Summary */}
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        backgroundColor: theme.iconBg,
                        color: theme.iconColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px',
                      }}
                    >
                      {theme.icon}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        onClick={() => toggleExpand(item.id)}
                        style={{
                          fontSize: '13.5px',
                          fontWeight: 700,
                          color: 'var(--color-ink)',
                          lineHeight: 1.35,
                          cursor: 'pointer',
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {parsed.cleanSubject}
                      </div>

                      {/* Direct High-Impact Summary Preview */}
                      {!isExpanded && (
                        <p
                          onClick={() => toggleExpand(item.id)}
                          style={{
                            fontSize: '12px',
                            color: 'var(--color-ink-muted)',
                            margin: '4px 0 0 0',
                            lineHeight: 1.5,
                            cursor: 'pointer',
                          }}
                        >
                          {parsed.directSummary}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Full Formatted Notice Content (when expanded) */}
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px', borderTop: '1px solid var(--color-hairline)', marginTop: '2px' }}>
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
                          padding: '3.5px 10px',
                          fontSize: '11px',
                          fontWeight: 600,
                          backgroundColor: '#FFFFFF',
                          color: theme.btnColor,
                          border: `1px solid ${theme.btnBorder}`,
                          borderRadius: '6px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          boxShadow: '0 1px 2px rgba(15, 23, 42, 0.02)',
                        }}
                      >
                        <CheckCircle2 size={12} /> Mark Read
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
        await triggerSystemNotification({
          id: 'perm-granted-' + Date.now(),
          subject: 'Device Alerts Enabled',
          body: 'System notifications are active. You will receive live alerts for meeting schedules, clearances, and evaluations.',
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const sendTest = async () => {
    if (permission === 'granted' && typeof window !== 'undefined') {
      await triggerSystemNotification({
        id: 'test-ping-' + Date.now(),
        subject: 'System Alert Verified',
        body: 'Real-time OS notification pipeline is active and verified on this device.',
      });
    }
  };

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
