'use client';

import React, { useState, Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Lock,
  Mail,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Compass,
  Shield,
  X,
  Sparkles,
  Award,
  Layers,
  Users,
  CheckCircle,
  FileCheck,
  Calendar,
  MapPin,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessionConflict, setSessionConflict] = useState(false);

  // Forgot password modal state
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [generatedResetLink, setGeneratedResetLink] = useState('');

  // Auto-fill activated leader email if redirected
  useEffect(() => {
    const activatedEmail = searchParams.get('activatedEmail');
    if (activatedEmail) {
      setEmail(activatedEmail);
    }
  }, [searchParams]);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            if (data.user.role === 'admin') router.push('/admin');
            else if (data.user.role === 'supervisor') router.push('/dashboard/faculty');
            else router.push('/dashboard/leader');
          }
        }
      } catch (e) {
        // Not logged in
      }
    }
    checkSession();
  }, [router]);

  // Lock body scroll when modal open
  useEffect(() => {
    if (forgotModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [forgotModalOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSessionConflict(false);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setSessionConflict(true);
          setError(data.error || 'Account is already active on another device.');
        } else {
          setError(data.error || 'Invalid email or password');
        }
        setLoading(false);
        return;
      }

      if (data.token) {
        localStorage.setItem('codeshastra_token', data.token);
      }

      const role = data.user?.role;
      if (role === 'admin') {
        router.push('/admin');
      } else if (role === 'supervisor') {
        router.push('/dashboard/faculty');
      } else {
        router.push('/dashboard/leader');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');
    setGeneratedResetLink('');
    setForgotLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        setForgotError(data.error || 'Failed to process request');
        setForgotLoading(false);
        return;
      }

      setForgotSuccess(data.message);
      if (data.resetLink) {
        setGeneratedResetLink(data.resetLink);
      }
    } catch (err: any) {
      setForgotError(err.message || 'An error occurred');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-canvas)', width: '100%', overflowX: 'hidden' }}>
      <Navbar />

      {/* Full-bleed, edge-to-edge container covering the entire viewport */}
      <main style={{ flex: 1, width: '100%', display: 'flex', margin: 0, padding: 0 }}>
        <div
          style={{
            width: '100%',
            minHeight: 'calc(100vh - 72px)',
            display: 'grid',
            gridTemplateColumns: '55% 45%',
            backgroundColor: '#FFFFFF',
          }}
          className="login-split-container"
        >
          {/* =================================================================== */}
          {/* LEFT SIDE: THREE PHASES MILESTONE SHOWCASE (DESKTOP ONLY) */}
          {/* =================================================================== */}
          <div
            style={{
              backgroundColor: '#F8F9FB',
              borderRight: '1px solid var(--color-hairline)',
              padding: '32px 44px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: '16px',
              boxSizing: 'border-box',
            }}
            className="login-left-showcase"
          >
            {/* Header Content */}
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 12px',
                  borderRadius: 'var(--rounded-full)',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid var(--color-hairline)',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--color-ink)',
                  marginBottom: '12px',
                }}
              >
                <Sparkles size={12} color="var(--color-ink)" /> Three-Phase Academic Lifecycle
              </div>

              <h1
                style={{
                  fontSize: 'clamp(22px, 2.2vw, 28px)',
                  fontWeight: 700,
                  lineHeight: 1.15,
                  letterSpacing: '-0.03em',
                  color: 'var(--color-ink)',
                  marginBottom: '8px',
                }}
              >
                Precision Project Lifecycle & Milestone Evaluation.
              </h1>
              <p
                style={{
                  fontSize: '12px',
                  color: 'var(--color-text-muted)',
                  lineHeight: '1.45',
                  maxWidth: '480px',
                }}
              >
                Coordinating 102 project teams, 601 students, and 23 faculty mentors across sequential evaluation phases with conflict-free panel judgment.
              </p>
            </div>

            {/* Visual: Compact Single-Screen 16:9 Three-Phase Graphic */}
            <div
              style={{
                position: 'relative',
                borderRadius: '12px',
                overflow: 'hidden',
                border: '1px solid var(--color-hairline)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
                backgroundColor: '#FFFFFF',
                maxHeight: '260px',
              }}
            >
              <img
                src="/images/single_screen_hero.jpg"
                alt="Three-Phase Academic Evaluation Lifecycle (Phase 1: Idea Pitch, Phase 2: Prototype Review, Phase 3: Final Defense)"
                style={{
                  width: '100%',
                  maxHeight: '240px',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            </div>

            {/* Bottom Safeguards */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                fontSize: '11px',
                color: 'var(--color-text-muted)',
                borderTop: '1px solid var(--color-hairline)',
                paddingTop: '12px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Shield size={12} color="var(--color-ink)" /> Conflict Safeguard
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Lock size={12} color="var(--color-ink)" /> Single Active Session
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <MapPin size={12} color="var(--color-ink)" /> Fixed Venue: AB10
              </div>
            </div>
          </div>

          {/* =================================================================== */}
          {/* RIGHT SIDE: AUTHENTICATION FORM (FULL HEIGHT CENTERED) */}
          {/* =================================================================== */}
          <div
            style={{
              padding: '48px 40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#FFFFFF',
              boxSizing: 'border-box',
            }}
            className="login-right-form"
          >
            <div style={{ width: '100%', maxWidth: '400px' }}>
              <div style={{ marginBottom: '28px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--color-ink)' }}>
                  Sign In to ProjectHub
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  Institutional project coordination and evaluation portal
                </p>
              </div>

              {error && (
                <div
                  className="alert-banner alert-danger"
                  style={{
                    marginBottom: '16px',
                    borderColor: sessionConflict ? 'var(--color-danger)' : undefined,
                  }}
                >
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <div style={{ fontSize: '12px', lineHeight: '1.5' }}>{error}</div>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="input-group">
                  <label className="input-label">Institutional Email ID</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="email"
                      className="input-field"
                      style={{ paddingLeft: '38px', height: '42px', fontSize: '13px' }}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@gla.ac.in or leader email"
                      required
                    />
                    <Mail
                      size={15}
                      style={{
                        position: 'absolute',
                        left: '13px',
                        top: '13px',
                        color: 'var(--color-text-muted)',
                      }}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label className="input-label" style={{ marginBottom: 0 }}>Password</label>
                    <button
                      type="button"
                      onClick={() => setForgotModalOpen(true)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        fontSize: '12px',
                        color: 'var(--color-text-muted)',
                        cursor: 'pointer',
                        padding: 0,
                        textDecoration: 'underline',
                      }}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="password"
                      className="input-field"
                      style={{ paddingLeft: '38px', height: '42px', fontSize: '13px' }}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      required
                    />
                    <Lock
                      size={15}
                      style={{
                        position: 'absolute',
                        left: '13px',
                        top: '13px',
                        color: 'var(--color-text-muted)',
                      }}
                    />
                  </div>
                </div>

                <div style={{ fontSize: '11px', color: 'var(--color-text-faint)', marginBottom: '16px', lineHeight: '1.4' }}>
                  • Faculty: CodeShastra@&lt;Last 4 digits of phone&gt;<br />
                  • Student Leader: Preloaded student mobile number
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', height: '44px', fontSize: '14px', borderRadius: 'var(--rounded-full)' }}
                  disabled={loading}
                >
                  {loading ? 'Authenticating...' : 'Sign In'}
                </button>
              </form>

              <div
                style={{
                  marginTop: '24px',
                  paddingTop: '20px',
                  borderTop: '1px solid var(--color-hairline)',
                  textAlign: 'center',
                  fontSize: '13px',
                  color: 'var(--color-text-muted)',
                }}
              >
                Has your team elected a leader?{' '}
                <Link href="/leader" style={{ fontWeight: 600, color: 'var(--color-ink)', textDecoration: 'underline' }}>
                  Elect Leader at /leader
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style jsx global>{`
        /* Responsive Split Screen */
        @media (max-width: 899px) {
          .login-split-container {
            grid-template-columns: 1fr !important;
            width: 100% !important;
            min-height: auto !important;
          }
          .login-left-showcase {
            display: none !important; /* Hide image completely on mobile per user instruction */
          }
          .login-right-form {
            padding: 36px 20px !important;
            width: 100% !important;
          }
        }
      `}</style>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            padding: '20px',
          }}
          onClick={() => setForgotModalOpen(false)}
        >
          <div
            className="card animate-scale-in"
            style={{ width: '100%', maxWidth: '420px', padding: '28px', backgroundColor: '#FFFFFF' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Reset Password</h3>
              <button onClick={() => setForgotModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
              Enter your registered institutional email ID to receive a secure 15-minute reset link.
            </p>

            {forgotError && (
              <div className="alert-banner alert-danger" style={{ fontSize: '13px', marginBottom: '12px' }}>
                {forgotError}
              </div>
            )}

            {forgotSuccess && (
              <div className="alert-banner alert-success" style={{ fontSize: '13px', marginBottom: '12px' }}>
                {forgotSuccess}
              </div>
            )}

            {generatedResetLink && (
              <div style={{ backgroundColor: 'var(--color-canvas-soft)', padding: '10px 14px', borderRadius: 'var(--rounded-sm)', marginBottom: '14px', fontSize: '12px' }}>
                <strong>Reset Link:</strong>{' '}
                <Link href={generatedResetLink} style={{ color: 'var(--color-ink)', fontWeight: 600, wordBreak: 'break-all', textDecoration: 'underline' }}>
                  {generatedResetLink}
                </Link>
              </div>
            )}

            <form onSubmit={handleForgotPassword}>
              <div className="input-group">
                <label className="input-label">Registered Email</label>
                <input
                  type="email"
                  className="input-field"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="name@gla.ac.in"
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setForgotModalOpen(false)} style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1.5 }} disabled={forgotLoading}>
                  {forgotLoading ? 'Dispatching...' : 'Send Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Unified Footer */}
      <Footer />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ padding: '60px', textAlign: 'center' }}>Loading authentication...</div>}>
      <LoginForm />
    </Suspense>
  );
}
