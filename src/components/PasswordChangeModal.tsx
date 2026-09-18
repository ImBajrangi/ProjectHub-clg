'use client';

import React, { useState, useEffect } from 'react';
import { X, Lock, ShieldAlert, Eye, EyeOff, KeyRound, CheckCircle2 } from 'lucide-react';

interface PasswordChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userName?: string;
}

export default function PasswordChangeModal({ isOpen, onClose, onSuccess, userName }: PasswordChangeModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const onCloseRef = React.useRef(onClose);
  onCloseRef.current = onClose;

  // Background page scroll lock and Escape key listener
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onCloseRef.current?.();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = 'unset';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (currentPassword === newPassword) {
      setError('New password cannot be identical to your current password.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to update password');
        setLoading(false);
        return;
      }

      setSuccessMessage('Password updated successfully! Redirecting to login...');
      setTimeout(() => {
        onSuccess();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-overlay-responsive"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        className="card animate-scale-in modal-card-responsive"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '28px',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
          border: '1px solid var(--color-border)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <KeyRound size={18} strokeWidth={2.2} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Reset Password</h3>
            </div>
            {userName && (
              <div style={{ fontSize: '12.5px', color: 'var(--color-text-muted)', marginTop: '4px', marginLeft: '40px' }}>
                Account: <strong>{userName}</strong>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '4px', borderRadius: '6px' }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="alert-banner alert-warning" style={{ fontSize: '12px', marginBottom: '16px', borderRadius: '10px' }}>
          <ShieldAlert size={16} style={{ flexShrink: 0 }} />
          <div>
            <strong>Security Notice:</strong> Updating your password will flush active sessions. You will be redirected to sign in with your new password.
          </div>
        </div>

        {error && (
          <div className="alert-banner alert-danger" style={{ fontSize: '13px', marginBottom: '14px', borderRadius: '10px' }}>
            {error}
          </div>
        )}

        {successMessage && (
          <div className="alert-banner alert-success" style={{ fontSize: '13px', marginBottom: '14px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} color="#059669" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="input-group">
            <label className="input-label" style={{ fontSize: '12.5px', fontWeight: 600 }}>Current Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showCurrent ? 'text' : 'password'}
                className="input-field"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                required
                style={{ paddingRight: '40px', fontSize: '13.5px' }}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#64748B',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
                tabIndex={-1}
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label" style={{ fontSize: '12.5px', fontWeight: 600 }}>New Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showNew ? 'text' : 'password'}
                className="input-field"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                required
                style={{ paddingRight: '40px', fontSize: '13.5px' }}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#64748B',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
                tabIndex={-1}
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label" style={{ fontSize: '12.5px', fontWeight: 600 }}>Confirm New Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirm ? 'text' : 'password'}
                className="input-field"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                required
                style={{ paddingRight: '40px', fontSize: '13.5px' }}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#64748B',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
              style={{ flex: 1, padding: '10px' }}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1.5, padding: '10px', backgroundColor: '#059669', borderColor: '#059669' }}
              disabled={loading}
            >
              {loading ? 'Updating Password...' : 'Save & Re-login'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
