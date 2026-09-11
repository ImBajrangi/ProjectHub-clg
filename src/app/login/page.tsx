'use client';

import React, { useState, Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  X,
  ExternalLink,
} from 'lucide-react';
import { requestDeviceNotificationPermission } from '@/lib/deviceNotification';
import LoadingScreen from '@/components/LoadingScreen';

interface DevProfile {
  name: string;
  role: string;
  link: string;
  image: string;
  fallback: string;
  initials: string;
}

const developers: DevProfile[] = [
  {
    name: 'Arpit Pandey',
    role: 'BCA (DS)',
    link: 'https://www.linkedin.com/in/dev-arpit/',
    image: '/image/arpit.webp',
    fallback: '/image/arpit.png',
    initials: 'AP',
  },
  {
    name: 'Rishabh Mishra',
    role: 'BCA (DS)',
    link: 'https://www.linkedin.com/in/rishabh-mishra-bab420309/',
    image: '/image/rishabh.webp',
    fallback: '/image/rishabh.png',
    initials: 'RM',
  },
  {
    name: 'Harsh Sharma',
    role: 'BCA (DS)',
    link: 'https://www.linkedin.com/in/harshiitm/',
    image: '/image/harsh.webp',
    fallback: '/image/harsh.png',
    initials: 'HS',
  },
  {
    name: 'CodeShastra',
    role: 'Team',
    link: 'https://www.instagram.com/code___shastra/',
    image: '/image/CodeShastra.webp',
    fallback: '/image/CodeShastra.png',
    initials: 'CS',
  },
];

function FooterDevPill({ dev }: { dev: DevProfile }) {
  const [imgSrc, setImgSrc] = useState(dev.image);
  const [hasError, setHasError] = useState(false);

  return (
    <a
      href={dev.link}
      target="_blank"
      rel="noopener noreferrer"
      className="cohere-dev-pill"
      title={`${dev.name} • ${dev.role}`}
    >
      <div className="cohere-dev-avatar-box">
        {!hasError ? (
          <img
            src={imgSrc}
            alt={dev.name}
            className="cohere-dev-avatar-img"
            onError={() => {
              if (imgSrc === dev.image && dev.fallback) {
                setImgSrc(dev.fallback);
              } else {
                setHasError(true);
              }
            }}
          />
        ) : (
          <span className="cohere-dev-avatar-fallback">{dev.initials}</span>
        )}
      </div>
      <span className="cohere-dev-name mono">{dev.name}</span>
      <ExternalLink size={9} className="cohere-dev-ext-icon" />
    </a>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

    const attemptLogin = async (isRetry = false): Promise<boolean> => {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
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
          return true;
        }

        if (data.token) {
          localStorage.setItem('codeshastra_token', data.token);
        }

        // Proactively request native OS desktop notification permission on login user gesture
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
          try {
            await requestDeviceNotificationPermission();
          } catch {}
        }

        const role = data.user?.role;
        if (role === 'admin') {
          router.push('/admin');
        } else if (role === 'supervisor') {
          router.push('/dashboard/faculty');
        } else {
          router.push('/dashboard/leader');
        }
        return true;
      } catch (err: any) {
        if (!isRetry) {
          // Automatic 1-time retry on connection hiccup
          await new Promise((r) => setTimeout(r, 400));
          return await attemptLogin(true);
        }
        setError('Network connection lost or server unreachable. Please check your internet and try again.');
        setLoading(false);
        return false;
      }
    };

    await attemptLogin();
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
    <div className="cohere-page-wrapper">
      {/* Top Header */}
      <header className="cohere-top-header">
        <Link href="/" className="cohere-brand-link">
          <span className="cohere-brand-name">CodeShastra <span style={{ color: '#64748B', fontWeight: 500 }}>Hub</span></span>
        </Link>

        <div className="cohere-top-right">
          <Link href="/signup" className="cohere-top-signup-btn">
            Sign Up
          </Link>
        </div>
      </header>

      {/* Main Hero & Auth Area */}
      <main className="cohere-main-container">
        {/* Themed Single Professional Background Graphic */}
        <div className="cohere-bg-hero-graphic" aria-hidden="true">
          <img
            src="/images/undraw/happy-news-themed.svg"
            alt="Academic Notifications & Updates"
            className="cohere-bg-hero-img"
          />
        </div>

        {/* Center Cohere Login Card */}
        <div className="cohere-login-card">
          <h1 className="cohere-login-title">Log in</h1>

          {/* Error Message Banner */}
          {error && (
            <div className="cohere-alert-box">
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="cohere-form">
            {/* Signature Cohere Stacked Input Box */}
            <div className="cohere-stacked-box">
              {/* Email Compartment */}
              <div className="cohere-compartment">
                <label htmlFor="cohere-email" className="cohere-comp-label">
                  EMAIL
                </label>
                <input
                  id="cohere-email"
                  type="email"
                  className="cohere-comp-input mono"
                  placeholder="faculty@gla.ac.in or leader@gla.ac.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              {/* Compartment Divider */}
              <div className="cohere-comp-divider" />

              {/* Password Compartment */}
              <div className="cohere-compartment">
                <label htmlFor="cohere-password" className="cohere-comp-label">
                  PASSWORD
                </label>
                <div className="cohere-pwd-row">
                  <input
                    id="cohere-password"
                    type={showPassword ? 'text' : 'password'}
                    className="cohere-comp-input mono"
                    placeholder="••••••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="cohere-eye-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff size={15} strokeWidth={2} />
                    ) : (
                      <Eye size={15} strokeWidth={2} />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="cohere-forgot-row">
              <button
                type="button"
                className="cohere-forgot-btn"
                onClick={() => setForgotModalOpen(true)}
              >
                Forgot Password
              </button>
            </div>

            {/* Signature Cohere Slanted Split Button with Perfect Proportions */}
            <div className="cohere-btn-container">
              <button
                type="submit"
                className="cohere-slant-btn-root"
                disabled={loading}
              >
                <svg
                  viewBox="0 0 148 42"
                  className="cohere-slant-unified-svg"
                  aria-hidden="true"
                >
                  {/* Left piece */}
                  <path
                    d="M 8,0 L 91.25,0 Q 95.75,0 94.5,3.5 L 82,38.5 Q 80.75,42 76.25,42 L 8,42 Q 0,42 0,34 L 0,8 Q 0,0 8,0 Z"
                    className="cohere-slant-svg-path"
                  />
                  {/* Right piece */}
                  <path
                    d="M 107.75,0 L 140,0 Q 148,0 148,8 L 148,34 Q 148,42 140,42 L 92.75,42 Q 88.25,42 89.5,38.5 L 102,3.5 Q 103.25,0 107.75,0 Z"
                    className="cohere-slant-svg-path"
                  />
                </svg>

                <span className="cohere-slant-text-overlay">
                  {loading ? 'Logging in...' : 'Log in'}
                </span>

                <span className="cohere-slant-icon-overlay">
                  {loading ? (
                    <span className="cohere-mini-spinner" />
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="4" y1="12" x2="20" y2="12" />
                      <polyline points="14 6 20 12 14 18" />
                    </svg>
                  )}
                </span>
              </button>
            </div>

            {/* Terms and Policies */}
            <p className="cohere-terms-text">
              By signing up, you agree to the{' '}
              <a href="#" className="cohere-text-link" onClick={(e) => e.preventDefault()}>
                Terms of Use
              </a>{' '}
              and{' '}
              <a href="#" className="cohere-text-link" onClick={(e) => e.preventDefault()}>
                Privacy Policy
              </a>
              .
            </p>

            {/* Signup Navigation Link */}
            <div className="cohere-signup-footer">
              New team leader?{' '}
              <Link href="/signup" className="cohere-signup-link">
                Claim your team at Sign up
              </Link>
            </div>
          </form>
        </div>
      </main>

      {/* Cohere Sleek Dark Footer Bar */}
      <footer className="cohere-bottom-bar">
        <div className="cohere-footer-left">
          <span className="cohere-footer-brand">CodeShastra Hub</span>
        </div>

        <div className="cohere-footer-devs">
          <span className="cohere-dev-tag mono">DEVELOPED BY:</span>
          <div className="cohere-dev-list">
            {developers.map((dev) => (
              <FooterDevPill key={dev.name} dev={dev} />
            ))}
          </div>
        </div>

        <div className="cohere-footer-right">
          <span className="cohere-curated-text">Partnership with</span>
          <span className="cohere-curated-brand">Vrindopnishad</span>
        </div>
      </footer>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div
          className="cohere-modal-backdrop"
          onClick={() => setForgotModalOpen(false)}
        >
          <div
            className="cohere-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cohere-modal-header">
              <h3 className="cohere-modal-title">Reset Password</h3>
              <button
                className="cohere-modal-close"
                onClick={() => setForgotModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <p className="cohere-modal-desc">
              Enter your registered institutional email ID to receive a secure 15-minute reset link.
            </p>

            {forgotError && (
              <div className="cohere-alert-box" style={{ marginBottom: '14px' }}>
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotSuccess && (
              <div className="cohere-success-box" style={{ marginBottom: '14px' }}>
                <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
                <span>{forgotSuccess}</span>
              </div>
            )}

            {generatedResetLink && (
              <div className="cohere-reset-link-box">
                <strong>Reset Link:</strong>{' '}
                <Link href={generatedResetLink} className="cohere-reset-url">
                  {generatedResetLink}
                </Link>
              </div>
            )}

            <form onSubmit={handleForgotPassword}>
              <div className="cohere-stacked-box" style={{ marginBottom: '18px' }}>
                <div className="cohere-compartment">
                  <label className="cohere-comp-label">REGISTERED EMAIL</label>
                  <input
                    type="email"
                    className="cohere-comp-input mono"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@gla.ac.in"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="cohere-modal-cancel-btn"
                  onClick={() => setForgotModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="cohere-modal-submit-btn"
                  disabled={forgotLoading}
                >
                  {forgotLoading ? 'Dispatching...' : 'Send Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Exact Cohere Design System Styling */}
      <style jsx global>{`
        .cohere-page-wrapper {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background-color: #f4f5f4;
          color: #111827;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          position: relative;
          overflow-x: hidden;
        }

        /* Top Header */
        .cohere-top-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 44px;
          position: relative;
          z-index: 10;
        }

        .cohere-brand-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          color: #111827;
        }

        .cohere-logo-symbol {
          display: flex;
          align-items: center;
          gap: 2.5px;
        }

        .cohere-logo-symbol.small {
          gap: 2px;
        }

        .cohere-dot {
          width: 6.5px;
          height: 13px;
          border-radius: 3.5px;
          display: inline-block;
        }

        .cohere-logo-symbol.small .cohere-dot {
          width: 5px;
          height: 10px;
          border-radius: 3px;
        }

        .cohere-dot.coral {
          background: #e8705a;
        }
        .cohere-dot.green {
          background: #39704e;
        }
        .cohere-dot.purple {
          background: #8b5cf6;
        }

        .cohere-brand-name {
          font-size: 19px;
          font-weight: 600;
          letter-spacing: -0.03em;
          color: #1e293b;
        }

        .cohere-top-right {
          display: flex;
          align-items: center;
        }

        .cohere-top-signup-btn {
          font-size: 13.5px;
          font-weight: 500;
          color: #1e293b;
          text-decoration: none;
          position: relative;
          display: inline-block;
          padding: 2px 0;
          transition: color 0.2s ease;
        }

        .cohere-top-signup-btn::after {
          content: '';
          position: absolute;
          left: 0;
          bottom: 0;
          width: 100%;
          height: 1.5px;
          background-color: #1e293b;
          transform: scaleX(0);
          transform-origin: bottom right;
          transition: transform 0.28s cubic-bezier(0.65, 0, 0.35, 1);
        }

        .cohere-top-signup-btn:hover {
          color: #0f172a;
        }

        .cohere-top-signup-btn:hover::after {
          transform: scaleX(1);
          transform-origin: bottom left;
        }

        /* Main Container */
        .cohere-main-container {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 30px 20px 50px;
          position: relative;
          z-index: 1;
          overflow: hidden;
        }

        /* Single Professional Academic Background Graphic */
        .cohere-bg-hero-graphic {
          position: absolute;
          right: 3%;
          top: 50%;
          transform: translateY(-50%);
          width: 370px;
          max-width: 26vw;
          pointer-events: none;
          z-index: 0;
          user-select: none;
          opacity: 0.85;
          transition: opacity 0.3s ease;
        }

        .cohere-bg-hero-img,
        .cohere-bg-grading-img {
          width: 100%;
          height: auto;
          display: block;
          filter: drop-shadow(0 14px 28px rgba(0, 0, 0, 0.04));
        }

        @media (max-width: 1100px) {
          .cohere-bg-hero-graphic {
            right: -10px;
            opacity: 0.35;
            width: 290px;
          }
        }

        @media (max-width: 880px) {
          .cohere-bg-hero-graphic {
            display: none;
          }
        }

        /* Centered Spacious White Card */
        .cohere-login-card {
          width: 100%;
          max-width: 580px;
          background-color: #ffffff;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
          padding: 56px 48px 44px 48px;
          position: relative;
          z-index: 2;
          box-sizing: border-box;
        }

        .cohere-login-title {
          font-size: 32px;
          font-weight: 600;
          letter-spacing: -0.025em;
          color: #111827;
          text-align: center;
          margin-bottom: 34px;
        }

        /* SSO Row */
        /* Signature Cohere Stacked Input Box */
        .cohere-stacked-box {
          border: 1px solid #d1d5db;
          border-radius: 10px;
          background-color: #ffffff;
          overflow: hidden;
          transition: border-color 0.15s ease;
        }

        .cohere-stacked-box:focus-within {
          border-color: #111827;
        }

        .cohere-compartment {
          padding: 14px 20px 14px 20px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .cohere-comp-label {
          font-family: 'JetBrains Mono', 'SFMono-Regular', Consolas, Menlo, monospace;
          font-size: 11.5px;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: #111827;
          margin: 0;
          line-height: 1.2;
          user-select: none;
        }

        .cohere-comp-input {
          width: 100%;
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
          -webkit-box-shadow: none !important;
          background: transparent !important;
          font-size: 16px;
          color: #111827;
          padding: 4px 0 0 0;
          margin: 0;
          line-height: 1.4;
        }

        .cohere-comp-input:focus,
        .cohere-comp-input:focus-visible,
        .cohere-comp-input:active {
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
          -webkit-box-shadow: none !important;
        }

        .cohere-comp-input.mono {
          font-family: 'JetBrains Mono', 'SFMono-Regular', Consolas, Menlo, monospace;
          font-size: 15px;
          letter-spacing: -0.01em;
        }

        .cohere-comp-input::placeholder {
          color: #9ca3af;
          font-weight: 400;
        }

        .cohere-comp-divider {
          height: 1px;
          background-color: #e5e7eb;
          width: 100%;
        }

        .cohere-pwd-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
        }

        .cohere-eye-toggle {
          background: transparent;
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
          color: #111827;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: opacity 0.15s ease;
        }

        .cohere-eye-toggle:hover {
          opacity: 0.7;
        }

        /* Forgot Password */
        .cohere-forgot-row {
          display: flex;
          justify-content: flex-end;
          margin-top: 10px;
          margin-bottom: 28px;
        }

        .cohere-forgot-btn {
          background: transparent;
          border: none;
          font-size: 13px;
          font-weight: 500;
          color: #374151;
          cursor: pointer;
          padding: 0;
          transition: color 0.15s ease;
        }
        .cohere-forgot-btn:hover {
          color: #111827;
          text-decoration: underline;
        }

        /* Signature Cohere Slanted Split Button with Perfect Proportions */
        .cohere-btn-container {
          display: flex;
          justify-content: center;
          margin-bottom: 28px;
        }

        .cohere-slant-btn-root {
          position: relative;
          display: inline-flex;
          align-items: center;
          background: transparent;
          border: none;
          padding: 0;
          cursor: pointer;
          outline: none;
          width: 148px;
          height: 42px;
          transition: transform 0.05s ease;
        }

        .cohere-slant-btn-root:active {
          transform: scale(0.99);
        }

        .cohere-slant-unified-svg {
          width: 148px;
          height: 42px;
          display: block;
          pointer-events: none;
        }

        .cohere-slant-svg-path {
          fill: #344d41;
          transition: fill 0.15s ease;
        }

        .cohere-slant-btn-root:hover .cohere-slant-svg-path {
          fill: #263c32;
        }

        .cohere-slant-text-overlay {
          position: absolute;
          left: 0;
          top: 0;
          width: 88px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-size: 14.5px;
          font-weight: 500;
          letter-spacing: -0.01em;
          user-select: none;
          pointer-events: none;
          padding-left: 2px;
        }

        .cohere-slant-icon-overlay {
          position: absolute;
          left: 93px;
          top: 0;
          width: 55px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          pointer-events: none;
          padding-left: 1px;
        }

        .cohere-slant-icon-overlay svg {
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .cohere-slant-btn-root:hover .cohere-slant-icon-overlay svg {
          transform: translateX(3px);
        }

        .cohere-mini-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: cohere-spin 0.6s linear infinite;
        }

        @keyframes cohere-spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* Terms text */
        .cohere-terms-text {
          font-size: 11px;
          color: #4b5563;
          text-align: center;
          line-height: 1.5;
          margin-bottom: 20px;
        }

        .cohere-text-link {
          color: #374151;
          text-decoration: underline;
        }
        .cohere-text-link:hover {
          color: #111827;
        }

        /* Signup footer */
        .cohere-signup-footer {
          font-size: 12.5px;
          color: #4b5563;
          text-align: center;
        }

        .cohere-signup-link {
          color: #111827;
          font-weight: 500;
          text-decoration: underline;
          margin-left: 3px;
        }

        /* Unified Theme-Relatable Cohere Footer */
        .cohere-bottom-bar {
          background-color: #fafbfa;
          border-top: 1px solid #e5e7eb;
          color: #374151;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 48px 24px;
          position: relative;
          z-index: 10;
          flex-wrap: wrap;
          gap: 16px;
        }

        .cohere-footer-left {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .cohere-footer-brand {
          font-size: 15px;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: #111827;
        }

        .cohere-footer-devs {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .cohere-dev-tag {
          font-size: 10px;
          color: #64748b;
          font-weight: 700;
          letter-spacing: 0.06em;
        }

        .cohere-dev-list {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .cohere-dev-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 11px 4px 4px;
          background-color: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 999px;
          text-decoration: none;
          color: #1e293b !important;
          transition: all 0.15s ease;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
        }

        .cohere-dev-pill:hover {
          background-color: #ffffff;
          border-color: #344d41;
          color: #344d41 !important;
          box-shadow: 0 3px 8px rgba(52, 77, 65, 0.08);
        }

        .cohere-dev-avatar-box {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          overflow: hidden;
          background-color: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border: 1px solid #cbd5e1;
        }

        .cohere-dev-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .cohere-dev-avatar-fallback {
          font-size: 8.5px;
          font-weight: 700;
          color: #344d41;
          line-height: 1;
        }

        .cohere-dev-name {
          font-size: 11.5px;
          font-weight: 600;
          color: #1e293b;
        }

        .cohere-dev-pill:hover .cohere-dev-name {
          color: #344d41;
        }

        .cohere-dev-ext-icon {
          color: #94a3b8;
          transition: color 0.15s ease;
          margin-left: -1px;
        }

        .cohere-dev-pill:hover .cohere-dev-ext-icon {
          color: #344d41;
        }

        .cohere-footer-right {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .cohere-curated-text {
          color: #64748b;
          font-size: 11.5px;
        }

        .cohere-curated-brand {
          font-weight: 700;
          color: #111827;
          font-size: 13.5px;
          letter-spacing: -0.02em;
        }

        /* Alerts */
        .cohere-alert-box {
          display: flex;
          align-items: center;
          gap: 8px;
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          border-radius: 6px;
          padding: 9px 12px;
          font-size: 12px;
          margin-bottom: 16px;
        }

        .cohere-success-box {
          display: flex;
          align-items: center;
          gap: 8px;
          background-color: #ecfdf5;
          border: 1px solid #a7f3d0;
          color: #059669;
          border-radius: 6px;
          padding: 9px 12px;
          font-size: 12px;
        }

        /* Modal styling */
        .cohere-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 1200;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: rgba(17, 24, 39, 0.45);
          backdrop-filter: blur(4px);
          padding: 20px;
        }

        .cohere-modal-card {
          width: 100%;
          max-width: 420px;
          background-color: #ffffff;
          border-radius: 12px;
          padding: 32px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12);
        }

        .cohere-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .cohere-modal-title {
          font-size: 18px;
          font-weight: 700;
          color: #111827;
        }

        .cohere-modal-close {
          background: transparent;
          border: none;
          color: #6b7280;
          cursor: pointer;
        }

        .cohere-modal-desc {
          font-size: 13px;
          color: #6b7280;
          margin-bottom: 16px;
          line-height: 1.45;
        }

        .cohere-reset-link-box {
          background-color: #f3f4f6;
          padding: 10px 12px;
          border-radius: 6px;
          font-size: 12px;
          margin-bottom: 14px;
          word-break: break-all;
        }

        .cohere-reset-url {
          color: #2563eb;
          font-weight: 600;
          text-decoration: underline;
        }

        .cohere-modal-cancel-btn {
          flex: 1;
          height: 38px;
          background-color: #ffffff;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          cursor: pointer;
        }

        .cohere-modal-submit-btn {
          flex: 1.5;
          height: 38px;
          background-color: #344d41;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          color: #ffffff;
          cursor: pointer;
        }

        /* Responsiveness */
        @media (max-width: 640px) {
          .cohere-top-header {
            padding: 16px 20px;
          }
          .cohere-main-container {
            padding: 20px 16px 40px;
          }
          .cohere-login-card {
            padding: 32px 20px;
            max-width: 100%;
          }
          .cohere-sso-row {
            grid-template-columns: 1fr;
          }
          .cohere-bottom-bar {
            padding: 14px 20px;
            flex-direction: column;
            gap: 8px;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingScreen label="Loading CodeShastra Portal..." sublabel="Securing authentication & workspace" />}>
      <LoginForm />
    </Suspense>
  );
}


