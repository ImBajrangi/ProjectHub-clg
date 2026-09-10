'use client';

import React, { useEffect } from 'react';
import { X, CheckCheck, Bell, CheckCircle } from 'lucide-react';
import { NotificationItem } from '@/lib/types';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  userName?: string;
}

export default function NotificationDrawer({
  isOpen,
  onClose,
  notifications,
  onMarkRead,
  onMarkAllRead,
  userName,
}: NotificationDrawerProps) {
  // Background page scroll lock
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

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '540px',
          height: '100%',
          backgroundColor: '#FFFFFF',
          borderLeft: '1px solid var(--color-hairline)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.08)',
          animation: 'slideInRight 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
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
                backgroundColor: 'var(--color-canvas-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-ink)',
              }}
            >
              <Bell size={17} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Notification Center</h3>
                {userName && (
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                    • {userName}
                  </span>
                )}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                Official email-style operational notices
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {notifications.some((n) => !n.is_read) && (
              <button
                onClick={onMarkAllRead}
                className="btn btn-soft"
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                <CheckCheck size={13} /> Mark All Read
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                padding: '6px',
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Real-Time Device Notification Banner */}
        <DeviceNotificationBanner />

        {/* Notifications List */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            backgroundColor: '#FAFAFA',
          }}
        >
          {notifications.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              <Bell size={36} style={{ opacity: 0.3, margin: '0 auto 10px' }} />
              <p style={{ fontSize: '14px', fontWeight: 600 }}>No Notifications Yet</p>
              <p style={{ fontSize: '12px', marginTop: '4px' }}>
                All milestone reviews, schedule updates, and meeting logs will appear here.
              </p>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 'var(--rounded-sm)',
                  border: item.is_read ? '1px solid var(--color-hairline)' : '1px solid var(--color-ink)',
                  padding: '16px',
                }}
              >
                {/* Meta */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  <span className="badge badge-neutral" style={{ fontSize: '10px', padding: '2px 8px' }}>
                    {item.category}
                  </span>
                  <span>{new Date(item.created_at).toLocaleDateString('en-IN')}</span>
                </div>

                {/* Structured Email Format per SRS */}
                <div
                  style={{
                    backgroundColor: 'var(--color-canvas-soft)',
                    borderRadius: '8px',
                    padding: '14px',
                    fontSize: '12px',
                    fontFamily: 'var(--font-mono)',
                    lineHeight: '1.6',
                    color: 'var(--color-ink)',
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: '8px', borderBottom: '1px dashed var(--color-hairline)', paddingBottom: '6px' }}>
                    Subject: {item.subject}
                  </div>
                  <div style={{ fontWeight: 600, marginBottom: '8px' }}>{item.salutation}</div>
                  <div style={{ whiteSpace: 'pre-wrap', marginBottom: '10px' }}>{item.body}</div>
                  <div style={{ color: 'var(--color-text-muted)', whiteSpace: 'pre-wrap', fontSize: '11px' }}>
                    {item.signoff}
                  </div>
                </div>

                {!item.is_read && (
                  <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => onMarkRead(item.id)}
                      className="btn btn-soft"
                      style={{ padding: '4px 10px', fontSize: '11px' }}
                    >
                      <CheckCircle size={11} /> Mark as Read
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function DeviceNotificationBanner() {
  const [permission, setPermission] = React.useState<NotificationPermission>('default');
  const [supported, setSupported] = React.useState(false);

  React.useEffect(() => {
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

  const sendNotification = (title: string, options: NotificationOptions) => {
    if (typeof window === 'undefined') return;
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(title, options);
      }).catch(() => {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(title, options);
        }
      });
    } else if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, options);
    }
  };

  const sendTest = () => {
    if (permission === 'granted') {
      sendNotification('CodeShastra ProjectHub', {
        body: 'Real-time alert: Notifications are now active on your mobile or desktop device.',
        icon: '/image/arpit.png',
      });
    }
  };

  return (
    <div
      style={{
        padding: '12px 20px',
        backgroundColor: permission === 'granted' ? '#F0FDF4' : '#F8FAFC',
        borderBottom: '1px solid var(--color-hairline)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '12px',
        flexWrap: 'wrap',
        gap: '8px',
      }}
    >
      {permission === 'granted' ? (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#166534', fontWeight: 600 }}>
            <Bell size={13} /> Real-time device alerts enabled
          </div>
          <button
            type="button"
            onClick={sendTest}
            className="btn btn-soft"
            style={{ padding: '4px 10px', fontSize: '11px' }}
          >
            Send Test
          </button>
        </>
      ) : permission === 'denied' ? (
        <div style={{ color: 'var(--color-danger)', fontSize: '11px' }}>
          Device notifications are blocked in your browser settings.
        </div>
      ) : (
        <>
          <div style={{ color: 'var(--color-text-muted)' }}>
            Get instant real-time alerts on your device:
          </div>
          <button
            type="button"
            onClick={requestPermission}
            className="btn btn-primary"
            style={{ padding: '4px 12px', fontSize: '11px' }}
          >
            <Bell size={12} /> Enable Device Alerts
          </button>
        </>
      )}
    </div>
  );
}
