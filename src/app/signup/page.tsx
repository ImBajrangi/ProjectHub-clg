'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';

interface AvailableTeam {
  id: string;
  team_code: string;
  team_name: string;
  program: string;
}

interface TeamMember {
  id: string;
  roll_no: string;
  full_name: string;
  email: string;
  mobile: string;
  course: string;
  section: string;
}

function SignUpForm() {
  const router = useRouter();
  const [teams, setTeams] = useState<AvailableTeam[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [selectedEmail, setSelectedEmail] = useState('');
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Check if session exists
  useEffect(() => {
    async function checkExistingSession() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user?.role === 'leader') {
            router.replace('/dashboard/leader');
            return;
          } else if (data.user?.role === 'supervisor') {
            router.replace('/dashboard/faculty');
            return;
          } else if (data.user?.role === 'admin') {
            router.replace('/admin');
            return;
          }
        }
      } catch (e) {
        // Not logged in, continue
      }
    }
    checkExistingSession();

    async function loadAvailableTeams() {
      try {
        const res = await fetch('/api/leader/available');
        const data = await res.json();
        setTeams(data.teams || []);
      } catch (err) {
        setError('Failed to fetch available teams. Please try again.');
      } finally {
        setLoadingTeams(false);
      }
    }
    loadAvailableTeams();
  }, [router]);

  useEffect(() => {
    if (!selectedTeamId) {
      setMembers([]);
      setSelectedEmail('');
      return;
    }

    async function loadMembers() {
      setLoadingMembers(true);
      setSelectedEmail('');
      setError('');
      try {
        const res = await fetch(`/api/leader/available?teamId=${selectedTeamId}`);
        const data = await res.json();
        setMembers(data.students || []);
      } catch (err) {
        setError('Failed to fetch members for the selected team.');
      } finally {
        setLoadingMembers(false);
      }
    }

    loadMembers();
  }, [selectedTeamId]);

  const selectedMemberObj = members.find(
    (m) => m.email.toLowerCase() === selectedEmail.toLowerCase()
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedTeamId || !selectedEmail) {
      setError('Please select both a Team and a Member Email address.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/leader/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: selectedTeamId,
          studentEmail: selectedEmail,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to claim team leadership.');
        setSubmitting(false);
        return;
      }

      setSuccessMessage(
        'Leader account designated successfully! Logging you directly into your project dashboard...'
      );

      // Perform immediate direct login
      try {
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: data.email, password: data.phone }),
        });
        const loginData = await loginRes.json();

        if (loginData.token) {
          localStorage.setItem('codeshastra_token', loginData.token);
        }
      } catch (loginErr) {
        console.error('Direct login error:', loginErr);
      }

      setTimeout(() => {
        window.location.href = '/dashboard/leader';
      }, 700);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      setSubmitting(false);
    }
  };

  return (
    <div className="cohere-page-wrapper">
      {/* Top Header */}
      <header className="cohere-top-header">
        <Link href="/" className="cohere-brand-link">
          <span className="cohere-brand-name">
            CodeShastra <span style={{ color: '#64748B', fontWeight: 500 }}>Hub</span>
          </span>
        </Link>

        <div className="cohere-top-right">
          <Link href="/login" className="cohere-top-signup-btn">
            Log in
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="cohere-main-container">
        {/* Centered Spacious White Card */}
        <div className="cohere-login-card">
          <h1 className="cohere-login-title">Sign up</h1>

          {/* Error Message Banner */}
          {error && (
            <div className="cohere-alert-box">
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message Banner */}
          {successMessage && (
            <div className="cohere-success-box" style={{ marginBottom: '18px' }}>
              <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="cohere-form">
            {/* Signature Cohere Stacked Compartment Box */}
            <div className="cohere-stacked-box">
              {/* Team Selector Compartment */}
              <div className="cohere-compartment">
                <label htmlFor="cohere-team-select" className="cohere-comp-label">
                  PROJECT TEAM
                </label>
                <div className="cohere-select-wrapper">
                  <select
                    id="cohere-team-select"
                    className="cohere-comp-select mono"
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    disabled={loadingTeams || submitting}
                    required
                  >
                    <option value="">
                      {loadingTeams ? 'Loading eligible teams...' : '-- Choose your project team --'}
                    </option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.team_name} ({t.program})
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={15} className="cohere-select-chevron" />
                </div>
              </div>

              {/* Compartment Divider */}
              <div className="cohere-comp-divider" />

              {/* Leader Email Selector Compartment */}
              <div className="cohere-compartment">
                <label htmlFor="cohere-email-select" className="cohere-comp-label">
                  LEADER EMAIL
                </label>
                <div className="cohere-select-wrapper">
                  <select
                    id="cohere-email-select"
                    className="cohere-comp-select mono"
                    value={selectedEmail}
                    onChange={(e) => setSelectedEmail(e.target.value)}
                    disabled={!selectedTeamId || loadingMembers || submitting}
                    required
                  >
                    <option value="">
                      {!selectedTeamId
                        ? '-- Select team first --'
                        : loadingMembers
                        ? 'Loading team members...'
                        : '-- Select your student email --'}
                    </option>
                    {members.map((m) => (
                      <option key={m.id} value={m.email}>
                        {m.full_name} ({m.email})
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={15} className="cohere-select-chevron" />
                </div>
              </div>
            </div>

            {/* Verified Member Details Badge */}
            {selectedMemberObj && (
              <div className="cohere-member-preview">
                <div className="cohere-preview-header">
                  <ShieldCheck size={14} color="#344D41" />
                  <span>Verified Roster Record</span>
                </div>
                <div className="cohere-preview-grid mono">
                  <div>
                    <span className="cohere-preview-label">Name:</span> {selectedMemberObj.full_name}
                  </div>
                  <div>
                    <span className="cohere-preview-label">Roll:</span> {selectedMemberObj.roll_no}
                  </div>
                  <div>
                    <span className="cohere-preview-label">Course:</span> {selectedMemberObj.course}
                  </div>
                  <div>
                    <span className="cohere-preview-label">Phone:</span> {selectedMemberObj.mobile}
                  </div>
                </div>
              </div>
            )}

            {/* Signature Cohere Slanted Split Button */}
            <div className="cohere-btn-container" style={{ marginTop: selectedMemberObj ? '22px' : '28px' }}>
              <button
                type="submit"
                className="cohere-slant-btn-root"
                disabled={!selectedTeamId || !selectedEmail || submitting}
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
                  {submitting ? 'Activating...' : 'Sign up'}
                </span>

                <span className="cohere-slant-icon-overlay">
                  {submitting ? (
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

            {/* Login Navigation Link */}
            <div className="cohere-signup-footer">
              Already registered?{' '}
              <Link href="/login" className="cohere-signup-link">
                Sign in to your account
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

        <div className="cohere-footer-right">
          <span className="cohere-curated-text">powered by</span>
          <span className="cohere-curated-brand">ProjectHub 2026</span>
        </div>
      </footer>

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
          transition: opacity 0.15s ease;
        }
        .cohere-top-signup-btn:hover {
          opacity: 0.75;
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

        /* Stacked Compartment Box */
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
          padding: 14px 20px;
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

        .cohere-select-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }

        .cohere-comp-select {
          width: 100%;
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
          -webkit-box-shadow: none !important;
          background: transparent !important;
          font-size: 15px;
          color: #111827;
          padding: 4px 24px 0 0;
          margin: 0;
          line-height: 1.4;
          appearance: none;
          -webkit-appearance: none;
          cursor: pointer;
        }

        .cohere-comp-select:focus,
        .cohere-comp-select:focus-visible,
        .cohere-comp-select:active {
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
        }

        .cohere-comp-select.mono {
          font-family: 'JetBrains Mono', 'SFMono-Regular', Consolas, Menlo, monospace;
          font-size: 14.5px;
          letter-spacing: -0.01em;
        }

        .cohere-select-chevron {
          position: absolute;
          right: 0;
          pointer-events: none;
          color: #6b7280;
        }

        .cohere-comp-divider {
          height: 1px;
          background-color: #e5e7eb;
          width: 100%;
        }

        /* Member Preview Badge */
        .cohere-member-preview {
          margin-top: 14px;
          padding: 12px 16px;
          background-color: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-size: 12.5px;
        }

        .cohere-preview-header {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 8px;
        }

        .cohere-preview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
          gap: 8px;
          font-size: 12px;
          color: #374151;
        }

        .cohere-preview-grid.mono {
          font-family: 'JetBrains Mono', 'SFMono-Regular', Consolas, Menlo, monospace;
        }

        .cohere-preview-label {
          color: #6b7280;
          font-weight: 500;
        }

        /* Signature Cohere Slanted Split Button */
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
          transition: transform 0.05s ease, opacity 0.15s ease;
        }

        .cohere-slant-btn-root:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .cohere-slant-btn-root:active:not(:disabled) {
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

        .cohere-slant-btn-root:hover:not(:disabled) .cohere-slant-svg-path {
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

        /* Bottom Bar */
        .cohere-bottom-bar {
          background-color: #1e2229;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 44px;
          position: relative;
          z-index: 10;
        }

        .cohere-footer-left {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .cohere-footer-brand {
          font-size: 15px;
          font-weight: 600;
          letter-spacing: -0.02em;
          color: #ffffff;
        }

        .cohere-footer-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .cohere-curated-text {
          color: #9ca3af;
          font-size: 12px;
        }

        .cohere-curated-brand {
          font-weight: 700;
          color: #ffffff;
          font-size: 14px;
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

export default function SignUpPage() {
  return (
    <Suspense fallback={<div style={{ padding: '60px', textAlign: 'center' }}>Loading sign up...</div>}>
      <SignUpForm />
    </Suspense>
  );
}
