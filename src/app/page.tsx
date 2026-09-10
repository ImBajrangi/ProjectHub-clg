'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Compass,
  Award,
  Users,
  Shield,
  GraduationCap,
  Check,
  Sparkles,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

interface DevProfile {
  name: string;
  role: string;
  link: string;
  image: string;
  fallback: string;
  initials: string;
}

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

export default function HomePage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function checkUser() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user) setUser(data.user);
        }
      } catch (e) {
        // Unauthenticated visitor
      }
    }
    checkUser();
  }, []);

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

  const dashboardHref = user
    ? user.role === 'admin'
      ? '/admin'
      : user.role === 'supervisor'
        ? '/dashboard/faculty'
        : '/dashboard/leader'
    : '/login';

  return (
    <div className="cohere-page-wrapper">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER                                                             */}
      {/* ========================================================================= */}
      <header className="cohere-top-header">
        <Link href="/" className="cohere-brand-link">
          <span className="cohere-brand-name">
            CodeShastra <span style={{ color: '#64748B', fontWeight: 500 }}>Hub</span>
          </span>
        </Link>

        <div className="cohere-top-right">
          {user ? (
            <Link href={dashboardHref} className="cohere-top-dash-btn">
              Go to Dashboard <ArrowRight size={13} />
            </Link>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <Link href="/signup" className="cohere-top-link">
                Sign Up
              </Link>
              <Link href="/login" className="cohere-top-login-pill">
                Log in
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. HERO SECTION: Seamless Surreal Artwork + Direct Punchy Copy            */}
      {/* ========================================================================= */}
      <section className="cohere-hero-section">
        <div className="cohere-hero-container">
          <div className="cohere-hero-grid">
            {/* Left Content */}
            <div className="cohere-hero-content">
              <div className="cohere-hero-pill">
                <span className="cohere-pill-dot" />
                <span className="mono">ACADEMIC PROJECT PLATFORM • GLA UNIVERSITY</span>
              </div>

              <h1 className="cohere-hero-title">
                Academic Project Governance.{' '}
                <span className="cohere-title-accent">Pure Clarity.</span>
              </h1>

              <p className="cohere-hero-desc">
                Synchronized milestone tracking, faculty mentorship, and conflict-free panel defenses.
              </p>

              {/* Action Buttons */}
              <div className="cohere-hero-actions">
                <Link href={user ? dashboardHref : '/signup'} className="cohere-slant-btn-root">
                  <svg viewBox="0 0 176 44" className="cohere-slant-unified-svg" aria-hidden="true">
                    <path
                      d="M 8,0 L 118.25,0 Q 122.75,0 121.5,3.5 L 109,40.5 Q 107.75,44 103.25,44 L 8,44 Q 0,44 0,36 L 0,8 Q 0,0 8,0 Z"
                      className="cohere-slant-svg-path"
                    />
                    <path
                      d="M 134.75,0 L 168,0 Q 176,0 176,8 L 176,36 Q 176,44 168,44 L 120.75,44 Q 116.25,44 117.5,40.5 L 130,3.5 Q 131.25,0 134.75,0 Z"
                      className="cohere-slant-svg-path"
                    />
                  </svg>

                  <span className="cohere-slant-text-overlay" style={{ width: '114px' }}>
                    {user ? 'Open Portal' : 'Elect Leader'}
                  </span>

                  <span className="cohere-slant-icon-overlay" style={{ left: '120px', width: '56px' }}>
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#FFFFFF"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="4" y1="12" x2="20" y2="12" />
                      <polyline points="14 6 20 12 14 18" />
                    </svg>
                  </span>
                </Link>

                {!user && (
                  <Link href="/login" className="cohere-secondary-btn">
                    Portal Login
                  </Link>
                )}
              </div>

              {/* Scannable Monospace Highlights */}
              <div className="cohere-hero-highlights mono">
                <div className="cohere-highlight-item">
                  <ShieldCheck size={14} color="#344D41" /> Single-Device Auth
                </div>
                <div className="cohere-highlight-item">
                  <Compass size={14} color="#344D41" /> 3 Mentor Clearances
                </div>
                <div className="cohere-highlight-item">
                  <Award size={14} color="#344D41" /> 3-Judge Panels
                </div>
              </div>
            </div>

            {/* Right Hero Art - Transhumans by Pablo Stanley */}
            <div className="cohere-hero-art-wrapper">
              <div className="cohere-art-composition">
                <div className="cohere-art-glow" />
                <img
                  src="/images/transhumans/rogue.svg"
                  alt="Transhumans Rogue Illustration by Pablo Stanley on Blush"
                  className="cohere-transhuman-img"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. AUDITED STATS METRICS                                                  */}
      {/* ========================================================================= */}
      <section className="cohere-stats-section">
        <div className="cohere-section-container">
          <div className="cohere-stats-grid">
            <div className="cohere-stat-box">
              <div className="cohere-stat-num">102</div>
              <div className="cohere-stat-label mono">PROJECT TEAMS</div>
            </div>

            <div className="cohere-stat-box">
              <div className="cohere-stat-num">601</div>
              <div className="cohere-stat-label mono">ALLOCATED STUDENTS</div>
            </div>

            <div className="cohere-stat-box">
              <div className="cohere-stat-num">23</div>
              <div className="cohere-stat-label mono">FACULTY MENTORS</div>
            </div>

            <div className="cohere-stat-box">
              <div className="cohere-stat-num">3</div>
              <div className="cohere-stat-label mono">MILESTONE PHASES</div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. EDITORIAL STORY 1: GUIDING THE BUILD (Meaningful Visual Integration)  */}
      {/* ========================================================================= */}
      <section className="cohere-story-section">
        <div className="cohere-section-container">
          <div className="cohere-story-grid">
            {/* Visual on Left */}
            <div className="cohere-story-visual">
              <img
                src="/images/absurd/mentor.webp"
                alt="Human connection and mentorship art by absurd.design"
                className="cohere-blended-illustration story-img"
              />
            </div>

            {/* Content on Right */}
            <div className="cohere-story-content">
              <div className="cohere-section-tag mono">FACULTY SUPERVISION</div>
              <h2 className="cohere-story-title">
                Direct Mentorship. <br />
                Accountability at every sprint.
              </h2>
              <p className="cohere-story-desc">
                Teams schedule one-on-one consultations via the &quot;Want to Meet&quot; request queue. Mentors log verified student attendance rosters and unlock milestone gates upon satisfactory code reviews.
              </p>

              <div className="cohere-story-features mono">
                <div className="cohere-story-item">
                  <Check size={14} strokeWidth={2.5} color="#344D41" />
                  <span>Problem Statement Lock & Revision Approvals</span>
                </div>
                <div className="cohere-story-item">
                  <Check size={14} strokeWidth={2.5} color="#344D41" />
                  <span>Verified Attendance Logs per Consultation</span>
                </div>
                <div className="cohere-story-item">
                  <Check size={14} strokeWidth={2.5} color="#344D41" />
                  <span>Phase 1, Phase 2, and Phase 3 Clearance Permissions</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. EDITORIAL STORY 2: OBJECTIVE DEFENSE (Meaningful Visual Integration)   */}
      {/* ========================================================================= */}
      <section className="cohere-story-section alt">
        <div className="cohere-section-container">
          <div className="cohere-story-grid reverse">
            {/* Content on Left */}
            <div className="cohere-story-content">
              <div className="cohere-section-tag mono">OBJECTIVE DEFENSE</div>
              <h2 className="cohere-story-title">
                Three-Judge Panels. <br />
                Strict conflict-free evaluation.
              </h2>
              <p className="cohere-story-desc">
                Judges evaluate project defenses across 10-point standardized criteria in Hall AB10. Automated business logic guarantees that supervisors never judge their own assigned teams.
              </p>

              <div className="cohere-story-features mono">
                <div className="cohere-story-item">
                  <Check size={14} strokeWidth={2.5} color="#344D41" />
                  <span>Conflict-free panel assignments</span>
                </div>
                <div className="cohere-story-item">
                  <Check size={14} strokeWidth={2.5} color="#344D41" />
                  <span>Live 10-point rubric scoring & viva feedback</span>
                </div>
                <div className="cohere-story-item">
                  <Check size={14} strokeWidth={2.5} color="#344D41" />
                  <span>Tamper-proof final grade export for academic records</span>
                </div>
              </div>
            </div>

            {/* Visual on Right */}
            <div className="cohere-story-visual">
              <img
                src="/images/absurd/judge.webp"
                alt="Objective balance and judgment art by absurd.design"
                className="cohere-blended-illustration story-img"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5.5 EDITORIAL STORY 3: REAL-TIME DATA SYNC & SERIALIZED LEDGERS           */}
      {/* ========================================================================= */}
      <section className="cohere-story-section">
        <div className="cohere-section-container">
          <div className="cohere-story-grid">
            {/* Visual on Left */}
            <div className="cohere-story-visual">
              <img
                src="/images/undraw/transactions-themed.svg"
                alt="Synchronized data exchange and academic roster transactions"
                className="cohere-story-vector-img"
              />
            </div>

            {/* Content on Right */}
            <div className="cohere-story-content">
              <div className="cohere-section-tag mono">TRANSACTIONAL INTEGRITY</div>
              <h2 className="cohere-story-title">
                Continuous Roster Sync. <br />
                Zero Lost Submissions.
              </h2>
              <p className="cohere-story-desc">
                Every student milestone upload, supervisor consultation note, and panel defense score is serialized into centralized, tamper-proof academic ledgers in real time.
              </p>

              <div className="cohere-story-features mono">
                <div className="cohere-story-item">
                  <Check size={14} strokeWidth={2.5} color="#344D41" />
                  <span>Instant multi-device attendance reconciliation</span>
                </div>
                <div className="cohere-story-item">
                  <Check size={14} strokeWidth={2.5} color="#344D41" />
                  <span>Hardware-bound cryptographic leader token verification</span>
                </div>
                <div className="cohere-story-item">
                  <Check size={14} strokeWidth={2.5} color="#344D41" />
                  <span>Automated final CSV/PDF export for university records</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5.6 EDITORIAL STORY 4: ROLE ARCHITECTURE & PERSONA GOVERNANCE             */}
      {/* ========================================================================= */}
      <section className="cohere-story-section alt">
        <div className="cohere-section-container">
          <div className="cohere-story-grid reverse">
            {/* Content on Left */}
            <div className="cohere-story-content">
              <div className="cohere-section-tag mono">PERSONA ARCHITECTURE</div>
              <h2 className="cohere-story-title">
                Three Distinct Roles. <br />
                Tailored for every stakeholder.
              </h2>
              <p className="cohere-story-desc">
                From student team leaders managing submissions and meeting logs, to faculty supervisors issuing phase clearances, and department admins configuring conflict-free panels.
              </p>

              <div className="cohere-story-features mono">
                <div className="cohere-story-item">
                  <Check size={14} strokeWidth={2.5} color="#344D41" />
                  <span>Team Leader: Milestone deliverables, meeting requests & token auth</span>
                </div>
                <div className="cohere-story-item">
                  <Check size={14} strokeWidth={2.5} color="#344D41" />
                  <span>Faculty Mentor: Attendance rosters, problem lock & phase approvals</span>
                </div>
                <div className="cohere-story-item">
                  <Check size={14} strokeWidth={2.5} color="#344D41" />
                  <span>Department Admin: Roster allocation, judge assignment & grade audit</span>
                </div>
              </div>
            </div>

            {/* Visual on Right */}
            <div className="cohere-story-visual">
              <img
                src="/images/undraw/select-character-themed.svg"
                alt="Role-based access and persona governance"
                className="cohere-story-vector-img"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. THREE MILESTONE COMPARTMENTS                                           */}
      {/* ========================================================================= */}
      <section className="cohere-milestones-section">
        <div className="cohere-section-container">
          <div className="cohere-section-header">
            <div className="cohere-section-tag mono">EVALUATION ROADMAP</div>
            <h2 className="cohere-section-title">The Three Milestones</h2>
            <p className="cohere-section-desc">
              Structured progressive deliverables guiding projects from proposal to final defense.
            </p>
          </div>

          <div className="cohere-milestones-grid">
            <div className="cohere-milestone-card">
              <div className="cohere-card-img-box">
                <img
                  src="/images/absurd/phase1.webp"
                  alt="Phase 1 Genesis - Surreal line art by absurd.design"
                  className="cohere-milestone-img"
                />
              </div>
              <div className="cohere-card-tag mono">PHASE 01</div>
              <h3 className="cohere-card-title">Genesis & Problem Lock</h3>
              <p className="cohere-card-desc">
                Teams elect their leader offline, select their registered domain, and lock the problem statement for supervisor clearance.
              </p>
            </div>

            <div className="cohere-milestone-card active">
              <div className="cohere-card-img-box">
                <img
                  src="/images/absurd/phase2.webp"
                  alt="Phase 2 Sprint & Mentorship - Surreal line art by absurd.design"
                  className="cohere-milestone-img"
                />
              </div>
              <div className="cohere-card-tag mono">PHASE 02</div>
              <h3 className="cohere-card-title">Sprint & Mentorship</h3>
              <p className="cohere-card-desc">
                Core development sprints, active consultations with faculty supervisors, and mid-term technical progress verification.
              </p>
            </div>

            <div className="cohere-milestone-card">
              <div className="cohere-card-img-box">
                <img
                  src="/images/absurd/phase3.webp"
                  alt="Phase 3 Defense & Final Marks - Surreal line art by absurd.design"
                  className="cohere-milestone-img"
                />
              </div>
              <div className="cohere-card-tag mono">PHASE 03</div>
              <h3 className="cohere-card-title">Defense & Final Marks</h3>
              <p className="cohere-card-desc">
                Final report submission, Hall AB10 panel presentations, standardized judge rubric scoring, and institutional grade publishing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. BOTTOM CTA BANNER: Single-Device Protected Governance                  */}
      {/* ========================================================================= */}
      <section className="cohere-cta-section">
        <div className="cohere-section-container">
          <div className="cohere-cta-card">
            <div className="cohere-cta-left">
              <div className="cohere-protection-badge">
                <img
                  src="/images/undraw/protection-dark.svg"
                  alt="Single-Device Protection & Integrity Guarantee"
                  className="cohere-protection-img"
                />
              </div>
              <div className="cohere-cta-content">
                <div className="cohere-cta-tag mono">INSTITUTIONAL INTEGRITY GUARANTEE</div>
                <h2 className="cohere-cta-title">Single-Device Protected Governance.</h2>
                <p className="cohere-cta-subtitle">
                  Hardware-bound leader authentication ensures single-device session integrity, preventing proxy registrations and unauthorized milestone edits.
                </p>
              </div>
            </div>

            <div className="cohere-cta-actions">
              <Link href={user ? dashboardHref : '/signup'} className="cohere-slant-btn-root">
                <svg viewBox="0 0 176 44" className="cohere-slant-unified-svg" aria-hidden="true">
                  <path
                    d="M 8,0 L 118.25,0 Q 122.75,0 121.5,3.5 L 109,40.5 Q 107.75,44 103.25,44 L 8,44 Q 0,44 0,36 L 0,8 Q 0,0 8,0 Z"
                    className="cohere-slant-svg-path"
                  />
                  <path
                    d="M 134.75,0 L 168,0 Q 176,0 176,8 L 176,36 Q 176,44 168,44 L 120.75,44 Q 116.25,44 117.5,40.5 L 130,3.5 Q 131.25,0 134.75,0 Z"
                    className="cohere-slant-svg-path"
                  />
                </svg>

                <span className="cohere-slant-text-overlay" style={{ width: '114px' }}>
                  {user ? 'Dashboard' : 'Claim Team'}
                </span>

                <span className="cohere-slant-icon-overlay" style={{ left: '120px', width: '56px' }}>
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="4" y1="12" x2="20" y2="12" />
                    <polyline points="14 6 20 12 14 18" />
                  </svg>
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. COHERE BOTTOM BAR                                                      */}
      {/* ========================================================================= */}
      <footer className="cohere-bottom-bar">
        <div className="cohere-footer-left">
          <span className="cohere-footer-brand">CodeShastra Hub</span>
          <span className="cohere-footer-subline mono">GLA UNIVERSITY • DEPT. OF COMPUTER APPLICATIONS</span>
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

      {/* ========================================================================= */}
      {/* COHERE GLOBAL STYLING SYSTEM                                              */}
      {/* ========================================================================= */}
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

        .mono {
          font-family: 'JetBrains Mono', 'SFMono-Regular', Consolas, Menlo, monospace;
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

        .cohere-top-link {
          font-size: 13.5px;
          font-weight: 500;
          color: #1e293b;
          text-decoration: none;
          position: relative;
          display: inline-block;
          padding: 2px 0;
          transition: color 0.2s ease;
        }

        .cohere-top-link::after {
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

        .cohere-top-link:hover {
          color: #0f172a;
        }

        .cohere-top-link:hover::after {
          transform: scaleX(1);
          transform-origin: bottom left;
        }

        .cohere-top-login-pill {
          font-size: 13px;
          font-weight: 600;
          color: #ffffff !important;
          background-color: #344d41;
          padding: 7px 16px;
          border-radius: 999px;
          text-decoration: none;
          transition: background-color 0.15s ease;
        }
        .cohere-top-login-pill:hover {
          background-color: #263c32;
          color: #ffffff !important;
        }

        .cohere-top-dash-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
          color: #ffffff !important;
          background-color: #344d41;
          padding: 7px 16px;
          border-radius: 999px;
          text-decoration: none;
          transition: background-color 0.15s ease;
        }
        .cohere-top-dash-btn:hover {
          background-color: #263c32;
          color: #ffffff !important;
        }

        /* Hero Section */
        .cohere-hero-section {
          padding: 40px 24px 60px;
        }

        .cohere-hero-container {
          max-width: 1180px;
          margin: 0 auto;
        }

        .cohere-hero-grid {
          display: grid;
          grid-template-columns: 1.15fr 1fr;
          gap: 48px;
          align-items: center;
        }

        .cohere-hero-pill {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background-color: #e9ece8;
          border: 1px solid #d8ded6;
          border-radius: 999px;
          padding: 5px 12px;
          font-size: 11px;
          font-weight: 700;
          color: #344d41;
          margin-bottom: 20px;
          letter-spacing: 0.04em;
        }

        .cohere-pill-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: #344d41;
        }

        .cohere-hero-title {
          font-size: clamp(34px, 4.5vw, 52px);
          font-weight: 700;
          line-height: 1.1;
          letter-spacing: -0.035em;
          color: #111827;
          margin-bottom: 18px;
        }

        .cohere-title-accent {
          color: #344d41;
        }

        .cohere-hero-desc {
          font-size: 15.5px;
          color: #4b5563;
          line-height: 1.55;
          max-width: 520px;
          margin-bottom: 28px;
        }

        .cohere-hero-actions {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
          margin-bottom: 30px;
        }

        .cohere-secondary-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 44px;
          padding: 0 22px;
          background-color: #ffffff;
          border: 1px solid #d1d5db;
          border-radius: 999px;
          font-size: 14px;
          font-weight: 500;
          color: #111827 !important;
          text-decoration: none;
          transition: border-color 0.15s ease, background-color 0.15s ease;
        }
        .cohere-secondary-btn:hover {
          border-color: #111827;
          background-color: #f9fafb;
          color: #111827 !important;
        }

        .cohere-hero-highlights {
          display: flex;
          align-items: center;
          gap: 18px;
          font-size: 11.5px;
          color: #4b5563;
          flex-wrap: wrap;
        }

        .cohere-highlight-item {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        /* Seamless Blended Art in Hero */
        .cohere-hero-art-wrapper {
          position: relative;
        }

        .cohere-art-composition {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .cohere-art-glow {
          position: absolute;
          width: 320px;
          height: 320px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(248, 196, 22, 0.15) 0%, rgba(102, 54, 221, 0.08) 50%, transparent 70%);
          filter: blur(24px);
          pointer-events: none;
          z-index: 0;
        }

        .cohere-transhuman-img {
          width: 100%;
          max-width: 390px;
          max-height: 450px;
          object-fit: contain;
          display: block;
          position: relative;
          z-index: 1;
          transform: scaleX(-1);
          -webkit-mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 1) 82%, rgba(0, 0, 0, 0) 100%);
          mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 1) 82%, rgba(0, 0, 0, 0) 100%);
          filter: drop-shadow(0 14px 28px rgba(0, 0, 0, 0.06));
        }

        .cohere-blended-illustration {
          width: 100%;
          max-height: 420px;
          object-fit: contain;
          display: block;
          mix-blend-mode: multiply;
          opacity: 0.88;
          filter: contrast(108%);
        }

        /* Slanted Button */
        .cohere-slant-btn-root {
          position: relative;
          display: inline-flex;
          align-items: center;
          background: transparent;
          border: none;
          padding: 0;
          cursor: pointer;
          outline: none;
          width: 176px;
          height: 44px;
          text-decoration: none;
          transition: transform 0.05s ease;
        }

        .cohere-slant-btn-root:active {
          transform: scale(0.99);
        }

        .cohere-slant-unified-svg {
          width: 176px;
          height: 44px;
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
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-size: 14.5px;
          font-weight: 500;
          letter-spacing: -0.01em;
          user-select: none;
          pointer-events: none;
          padding-left: 4px;
        }

        .cohere-slant-icon-overlay {
          position: absolute;
          top: 0;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          pointer-events: none;
          padding-left: 2px;
        }

        .cohere-slant-icon-overlay svg {
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .cohere-slant-btn-root:hover .cohere-slant-icon-overlay svg {
          transform: translateX(3px);
        }

        /* Stats Section */
        .cohere-stats-section {
          padding: 28px 24px;
          border-top: 1px solid #e5e7eb;
          border-bottom: 1px solid #e5e7eb;
          background-color: #fafbfa;
        }

        .cohere-section-container {
          max-width: 1180px;
          margin: 0 auto;
        }

        .cohere-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }

        .cohere-stat-box {
          background-color: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 18px 16px;
          text-align: center;
        }

        .cohere-stat-num {
          font-size: clamp(28px, 3.5vw, 36px);
          font-weight: 700;
          letter-spacing: -0.03em;
          color: #111827;
          line-height: 1;
        }

        .cohere-stat-label {
          font-size: 10.5px;
          font-weight: 600;
          color: #6b7280;
          margin-top: 8px;
          letter-spacing: 0.05em;
        }

        /* Editorial Stories */
        .cohere-story-section {
          padding: 70px 24px;
        }

        .cohere-story-section.alt {
          background-color: #ffffff;
          border-top: 1px solid #e5e7eb;
          border-bottom: 1px solid #e5e7eb;
        }

        .cohere-story-grid {
          display: grid;
          grid-template-columns: 1fr 1.15fr;
          gap: 60px;
          align-items: center;
        }

        .cohere-story-grid.reverse {
          grid-template-columns: 1.15fr 1fr;
        }

        .cohere-story-visual {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .cohere-blended-illustration.story-img {
          max-height: 340px;
          width: auto;
        }

        .cohere-story-vector-img {
          max-width: 100%;
          max-height: 290px;
          object-fit: contain;
          display: block;
        }

        .cohere-story-title {
          font-size: clamp(28px, 3.5vw, 38px);
          font-weight: 700;
          letter-spacing: -0.03em;
          line-height: 1.15;
          color: #111827;
          margin: 8px 0 16px;
        }

        .cohere-story-desc {
          font-size: 15px;
          color: #4b5563;
          line-height: 1.6;
          margin-bottom: 24px;
        }

        .cohere-story-features {
          display: flex;
          flex-direction: column;
          gap: 12px;
          font-size: 13px;
          color: #374151;
        }

        .cohere-story-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* Milestone Compartments Section */
        .cohere-milestones-section {
          padding: 60px 24px 70px;
        }

        .cohere-section-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .cohere-section-tag {
          font-size: 11px;
          font-weight: 700;
          color: #344d41;
          letter-spacing: 0.08em;
          margin-bottom: 8px;
        }

        .cohere-section-title {
          font-size: clamp(24px, 3vw, 32px);
          font-weight: 700;
          letter-spacing: -0.025em;
          color: #111827;
          margin-bottom: 8px;
        }

        .cohere-section-desc {
          font-size: 14.5px;
          color: #4b5563;
          max-width: 520px;
          margin: 0 auto;
          line-height: 1.5;
        }

        .cohere-milestones-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }

        .cohere-milestone-card {
          background-color: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px 20px 24px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .cohere-milestone-card.active {
          border-color: #344d41;
          box-shadow: 0 4px 16px rgba(52, 77, 65, 0.08);
        }

        .cohere-card-img-box {
          width: 100%;
          height: 150px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fafbfa;
          border: 1px solid #f0f2f0;
          border-radius: 8px;
          overflow: hidden;
          margin-bottom: 6px;
        }

        .cohere-milestone-img {
          max-width: 100%;
          max-height: 140px;
          object-fit: contain;
          mix-blend-mode: multiply;
          opacity: 0.9;
          filter: contrast(110%);
        }

        .cohere-card-tag {
          font-size: 10.5px;
          font-weight: 700;
          color: #344d41;
          letter-spacing: 0.06em;
        }

        .cohere-card-title {
          font-size: 16px;
          font-weight: 700;
          color: #111827;
          margin: 0;
        }

        .cohere-card-desc {
          font-size: 13px;
          color: #4b5563;
          line-height: 1.5;
          margin: 0;
        }

        /* CTA Section */
        .cohere-cta-section {
          padding: 0 24px 60px;
        }

        .cohere-cta-card {
          background-color: #1e2229;
          border-radius: 14px;
          padding: 40px 40px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 28px;
          color: #ffffff;
        }

        .cohere-cta-left {
          display: flex;
          align-items: center;
          gap: 24px;
          max-width: 680px;
        }

        .cohere-protection-badge {
          width: 72px;
          height: 72px;
          min-width: 72px;
          border-radius: 14px;
          background: rgba(52, 77, 65, 0.35);
          border: 1px solid rgba(52, 77, 65, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 10px;
        }

        .cohere-protection-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .cohere-cta-tag {
          font-size: 10.5px;
          font-weight: 700;
          color: #10b981;
          letter-spacing: 0.08em;
          margin-bottom: 6px;
        }

        .cohere-cta-title {
          font-size: 24px;
          font-weight: 700;
          letter-spacing: -0.025em;
          margin-bottom: 6px;
          color: #ffffff;
        }

        .cohere-cta-subtitle {
          font-size: 13.5px;
          color: #9ca3af;
          max-width: 540px;
          line-height: 1.5;
        }

        /* Unified Theme-Relatable Cohere Footer */
        .cohere-bottom-bar {
          background-color: #fafbfa;
          border-top: 1px solid #e5e7eb;
          color: #374151;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 22px 48px 30px;
          position: relative;
          z-index: 10;
          flex-wrap: wrap;
          gap: 20px;
        }

        .cohere-footer-left {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .cohere-footer-brand {
          font-size: 15px;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: #111827;
        }

        .cohere-footer-subline {
          font-size: 10px;
          color: #64748b;
          letter-spacing: 0.05em;
          font-weight: 600;
        }

        .cohere-footer-devs {
          display: flex;
          align-items: center;
          gap: 12px;
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

        /* Responsive Layout */
        @media (max-width: 960px) {
          .cohere-hero-grid {
            grid-template-columns: 1fr;
            gap: 36px;
          }
          .cohere-stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .cohere-story-grid,
          .cohere-story-grid.reverse {
            grid-template-columns: 1fr;
            gap: 36px;
          }
          .cohere-milestones-grid {
            grid-template-columns: 1fr;
          }
          .cohere-bottom-bar {
            padding: 20px 24px 30px;
          }
        }

        @media (max-width: 640px) {
          .cohere-top-header {
            padding: 16px 20px;
          }
          .cohere-hero-section {
            padding: 24px 16px 40px;
          }
          .cohere-story-section {
            padding: 40px 16px;
          }
          .cohere-cta-card {
            padding: 28px 20px;
          }
          .cohere-bottom-bar {
            padding: 20px 20px 32px;
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
        }
      `}</style>
    </div>
  );
}
