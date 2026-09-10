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
  Lightbulb,
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

            {/* Interactive Precision 3-Phase Stepper Journey Component */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid var(--color-hairline)',
                borderRadius: '14px',
                padding: '18px',
                boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              {/* Connected 3-Phase Cards Pipeline */}
              <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {/* Connecting Track Line */}
                <div
                  style={{
                    position: 'absolute',
                    top: '22px',
                    left: '14%',
                    right: '14%',
                    height: '2px',
                    background: 'linear-gradient(90deg, #2563EB 0%, #059669 50%, #D97706 100%)',
                    zIndex: 0,
                    opacity: 0.3,
                  }}
                />

                {/* Phase 1 Card */}
                <div
                  style={{
                    position: 'relative',
                    zIndex: 1,
                    backgroundColor: '#F8FAFC',
                    borderTop: '3px solid #2563EB',
                    borderRight: '1px solid #E2E8F0',
                    borderBottom: '1px solid #E2E8F0',
                    borderLeft: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    padding: '12px 10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '9px', fontWeight: 800, color: '#2563EB', letterSpacing: '0.06em' }}>
                      PHASE 1
                    </span>
                    <div
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        backgroundColor: '#EFF6FF',
                        border: '1px solid #BFDBFE',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#2563EB',
                      }}
                    >
                      <Lightbulb size={11} />
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--color-ink)', letterSpacing: '-0.01em' }}>
                      IDEA PITCH
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '2px', lineHeight: 1.3 }}>
                      Problem statement review & immutable lock.
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginTop: 'auto', paddingTop: '4px' }}>
                    <span style={{ fontSize: '9px', fontWeight: 600, padding: '1px 6px', borderRadius: '3px', backgroundColor: '#EFF6FF', color: '#1D4ED8', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <Lock size={9} /> Locked PS
                    </span>
                  </div>
                </div>

                {/* Phase 2 Card */}
                <div
                  style={{
                    position: 'relative',
                    zIndex: 1,
                    backgroundColor: '#F8FAFC',
                    borderTop: '3px solid #059669',
                    borderRight: '1px solid #E2E8F0',
                    borderBottom: '1px solid #E2E8F0',
                    borderLeft: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    padding: '12px 10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '9px', fontWeight: 800, color: '#059669', letterSpacing: '0.06em' }}>
                      PHASE 2
                    </span>
                    <div
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        backgroundColor: '#ECFDF5',
                        border: '1px solid #A7F3D0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#059669',
                      }}
                    >
                      <Layers size={11} />
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--color-ink)', letterSpacing: '-0.01em' }}>
                      PROTOTYPE
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '2px', lineHeight: 1.3 }}>
                      Working demo & 3-judge panel rubric scoring.
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginTop: 'auto', paddingTop: '4px' }}>
                    <span style={{ fontSize: '9px', fontWeight: 600, padding: '1px 6px', borderRadius: '3px', backgroundColor: '#ECFDF5', color: '#047857', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <Users size={9} /> 3 Judges
                    </span>
                  </div>
                </div>

                {/* Phase 3 Card */}
                <div
                  style={{
                    position: 'relative',
                    zIndex: 1,
                    backgroundColor: '#F8FAFC',
                    borderTop: '3px solid #D97706',
                    borderRight: '1px solid #E2E8F0',
                    borderBottom: '1px solid #E2E8F0',
                    borderLeft: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    padding: '12px 10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '9px', fontWeight: 800, color: '#D97706', letterSpacing: '0.06em' }}>
                      PHASE 3
                    </span>
                    <div
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        backgroundColor: '#FFFBEB',
                        border: '1px solid #FDE68A',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#D97706',
                      }}
                    >
                      <Award size={11} />
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--color-ink)', letterSpacing: '-0.01em' }}>
                      FINAL DEFENSE
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '2px', lineHeight: 1.3 }}>
                      Report clearance, viva voce & final grades.
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginTop: 'auto', paddingTop: '4px' }}>
                    <span style={{ fontSize: '9px', fontWeight: 600, padding: '1px 6px', borderRadius: '3px', backgroundColor: '#FFFBEB', color: '#B45309', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <FileCheck size={9} /> Clearance
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Quick-Audit Stat Bar */}
              <div
                style={{
                  backgroundColor: '#F8FAFC',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  border: '1px solid var(--color-hairline)',
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-ink)' }}>102</div>
                  <div style={{ fontSize: '9px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Project Teams</div>
                </div>
                <div style={{ width: '1px', height: '18px', backgroundColor: 'var(--color-hairline)' }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-ink)' }}>601</div>
                  <div style={{ fontSize: '9px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Students</div>
                </div>
                <div style={{ width: '1px', height: '18px', backgroundColor: 'var(--color-hairline)' }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-ink)' }}>23</div>
                  <div style={{ fontSize: '9px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Mentors & Judges</div>
                </div>
                <div style={{ width: '1px', height: '18px', backgroundColor: 'var(--color-hairline)' }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#059669' }}>100%</div>
                  <div style={{ fontSize: '9px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Audit Integrity</div>
                </div>
              </div>
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
                  style={{ width: '100%', height: '44px', fontSize: '14px', borderRadius: 'var(--rounded-full)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  disabled={loading}
                >
                  {loading && <span className="spinner spinner-sm" style={{ borderTopColor: '#FFFFFF', borderColor: 'rgba(255,255,255,0.25)' }} />}
                  <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
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
            padding: 20px 16px !important;
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
