'use client';

import React from 'react';
import Link from 'next/link';
import {
  Layers,
  ArrowRight,
  ShieldCheck,
  Users,
  Compass,
  Award,
  Calendar,
  CheckCircle2,
  FileText,
  Shield,
  Phone,
  Sparkles,
  Lock,
  GraduationCap,
  Clock,
  MapPin,
  Check,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function HomePage() {
  const [user, setUser] = React.useState<any>(null);

  React.useEffect(() => {
    async function checkUser() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user) setUser(data.user);
        }
      } catch (e) {
        // Not logged in
      }
    }
    checkUser();
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF' }}>
      <Navbar user={user} />

      {/* ========================================================================= */}
      {/* HERO SECTION: Concise, Direct, High-Impact                                */}
      {/* ========================================================================= */}
      <section style={{ padding: '36px 20px 40px' }}>
        <div className="container" style={{ maxWidth: '1180px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.05fr 1fr',
              gap: '40px',
              alignItems: 'center',
            }}
            className="hero-split-grid"
          >
            {/* Left Column: Punchy & Direct Text */}
            <div>
              {/* Badge */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 12px',
                  borderRadius: 'var(--rounded-full)',
                  backgroundColor: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#1D4ED8',
                  marginBottom: '16px',
                }}
              >
                <Sparkles size={13} color="#2563EB" /> CodeShastra ProjectHub
              </div>

              {/* Main Headline */}
              <h1
                style={{
                  fontSize: 'clamp(32px, 4.2vw, 48px)',
                  fontWeight: 800,
                  lineHeight: 1.12,
                  letterSpacing: '-0.03em',
                  color: 'var(--color-ink)',
                  marginBottom: '14px',
                }}
              >
                Academic Project Governance.{' '}
                <span style={{ color: '#2563EB' }}>
                  Simplified.
                </span>
              </h1>

              {/* Short & Direct Context */}
              <p
                style={{
                  fontSize: '15px',
                  color: 'var(--color-text-muted)',
                  lineHeight: '1.5',
                  maxWidth: '480px',
                  marginBottom: '24px',
                }}
              >
                Coordinating <strong>102 student teams</strong>, <strong>601 students</strong>, and <strong>23 faculty mentors</strong> across 3 milestones with conflict-free evaluation.
              </p>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
                <Link
                  href="/leader"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '11px 22px',
                    borderRadius: 'var(--rounded-full)',
                    backgroundColor: '#2563EB',
                    color: '#FFFFFF',
                    fontSize: '14px',
                    fontWeight: 600,
                    border: '1px solid #1D4ED8',
                  }}
                >
                  Elect Team Leader <ArrowRight size={14} />
                </Link>

                <Link
                  href="/login"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '11px 22px',
                    borderRadius: 'var(--rounded-full)',
                    backgroundColor: '#FFFFFF',
                    color: 'var(--color-ink)',
                    fontSize: '14px',
                    fontWeight: 600,
                    border: '1px solid var(--color-hairline-strong)',
                  }}
                >
                  Portal Login
                </Link>
              </div>

              {/* Scannable Highlights */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: 'var(--color-text-muted)', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <ShieldCheck size={14} color="#059669" /> Single-Device Security
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Compass size={14} color="#2563EB" /> 3 Mentor Clearances
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Award size={14} color="#D97706" /> 3-Judge Panels
                </div>
              </div>
            </div>

            {/* Right Column: Clean Student Project Milestone Showcase */}
            <div
              style={{
                borderRadius: '16px',
                padding: '16px',
                background: 'linear-gradient(135deg, #F0FDF4 0%, #EFF6FF 50%, #FAF5FF 100%)',
                border: '1px solid #E2E8F0',
                boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.04)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {/* Top Meta Bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: '#1E40AF', backgroundColor: '#DBEAFE', padding: '3px 9px', borderRadius: 'var(--rounded-full)' }}>
                  <Sparkles size={12} color="#2563EB" />
                  <span>Team CS-2026-042</span>
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, color: '#047857', backgroundColor: '#D1FAE5', padding: '3px 9px', borderRadius: 'var(--rounded-full)' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#059669' }} />
                  Phase 2 Active
                </div>
              </div>

              {/* Main Project Card */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  padding: '16px',
                  border: '1px solid rgba(226, 232, 240, 0.9)',
                  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
                }}
              >
                {/* Project Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <div
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '8px',
                      backgroundColor: '#EFF6FF',
                      color: '#2563EB',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <GraduationCap size={18} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-ink)', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                      BCA Major Project
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                      Dept. of Computer Applications • GLA Univ
                    </div>
                  </div>
                </div>

                {/* Problem Statement Box */}
                <div
                  style={{
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    marginBottom: '12px',
                  }}
                >
                  <div style={{ fontSize: '9.5px', fontWeight: 800, color: 'var(--color-text-faint)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '3px' }}>
                    Approved Problem Statement
                  </div>
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--color-ink)', lineHeight: 1.35 }}>
                    AI Crop Pathology & Smart Irrigation Diagnostics
                  </div>
                </div>

                {/* Milestone Progress Tracker */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '12px' }}>
                  <div style={{ backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '6px', padding: '6px 8px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '10px', fontWeight: 700, color: '#065F46' }}>
                      <Check size={11} strokeWidth={3} /> Phase 1
                    </div>
                    <div style={{ fontSize: '9px', color: '#047857', marginTop: '1px' }}>Approved</div>
                  </div>

                  <div style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '6px', padding: '6px 8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: '#1E40AF' }}>
                      Phase 2
                    </div>
                    <div style={{ fontSize: '9px', color: '#2563EB', fontWeight: 600, marginTop: '1px' }}>Evaluating</div>
                  </div>

                  <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '6px 8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                      Phase 3
                    </div>
                    <div style={{ fontSize: '9px', color: 'var(--color-text-faint)', marginTop: '1px' }}>Report</div>
                  </div>
                </div>

                {/* 3-Col Meta Summary */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', borderTop: '1px solid #F1F5F9', paddingTop: '10px', textAlign: 'center' }}>
                  <div>
                    <div style={{ fontSize: '9.5px', color: 'var(--color-text-muted)' }}>Leader</div>
                    <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--color-ink)', marginTop: '1px' }}>Arpit Pandey</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '9.5px', color: 'var(--color-text-muted)' }}>Team Size</div>
                    <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--color-ink)', marginTop: '1px' }}>6 Students</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '9.5px', color: 'var(--color-text-muted)' }}>Panel Score</div>
                    <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#059669', marginTop: '1px' }}>9.4 / 10</div>
                  </div>
                </div>
              </div>

              {/* Bottom Evaluation Banner */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '10px',
                  padding: '9px 12px',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  fontSize: '11.5px',
                  color: 'var(--color-ink)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                  <Award size={14} color="#2563EB" />
                  <span>Panel 3 Defense • Hall AB10 Scheduled</span>
                </div>
                <span className="badge badge-success" style={{ fontSize: '10px', padding: '1px 6px' }}>
                  Live
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4 AUDITED STATS (Responsive 2x2 Grid on Mobile, 4 Cols on Desktop)       */}
      {/* ========================================================================= */}
      <section style={{ padding: '24px 20px', borderTop: '1px solid var(--color-hairline)', borderBottom: '1px solid var(--color-hairline)', backgroundColor: '#FAFAFA' }}>
        <div className="container" style={{ maxWidth: '1180px' }}>
          <div className="landing-stats-grid">
            <div className="landing-stat-card">
              <div style={{ fontSize: 'clamp(26px, 3.5vw, 36px)', fontWeight: 800, color: 'var(--color-ink)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                102
              </div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', marginTop: '4px' }}>
                Project Teams
              </div>
            </div>

            <div className="landing-stat-card">
              <div style={{ fontSize: 'clamp(26px, 3.5vw, 36px)', fontWeight: 800, color: 'var(--color-ink)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                601
              </div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', marginTop: '4px' }}>
                Allocated Students
              </div>
            </div>

            <div className="landing-stat-card">
              <div style={{ fontSize: 'clamp(26px, 3.5vw, 36px)', fontWeight: 800, color: 'var(--color-ink)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                23
              </div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', marginTop: '4px' }}>
                Faculty Mentors
              </div>
            </div>

            <div className="landing-stat-card">
              <div style={{ fontSize: 'clamp(26px, 3.5vw, 36px)', fontWeight: 800, color: 'var(--color-ink)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                3
              </div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', marginTop: '4px' }}>
                Milestones (Phases 1–3)
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4 STAKEHOLDER ROLES (Direct, Scannable Bullets)                            */}
      {/* ========================================================================= */}
      <section style={{ padding: '40px 20px 60px' }}>
        <div className="container" style={{ maxWidth: '1180px' }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Four Platform Roles
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', marginTop: '4px' }}>
              Clear workflows for students, mentors, judges, and administration.
            </p>
          </div>

          <div className="grid-cols-2">
            {/* Student Leader */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: 'var(--color-canvas-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={15} color="var(--color-ink)" />
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Student Team Leader</h3>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '13px', color: 'var(--color-ink-soft)', lineHeight: '1.8', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '7px' }}><Check size={14} color="#059669" strokeWidth={2.4} /> Submit and lock problem statements</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '7px' }}><Check size={14} color="#059669" strokeWidth={2.4} /> Request mentor meetings via &quot;Want to Meet&quot;</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '7px' }}><Check size={14} color="#059669" strokeWidth={2.4} /> Upload finalized Phase 3 documentation</li>
              </ul>
            </div>

            {/* Supervisor Mentor */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: 'var(--color-canvas-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Compass size={15} color="var(--color-ink)" />
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Faculty Supervisor (Mentor)</h3>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '13px', color: 'var(--color-ink-soft)', lineHeight: '1.8', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '7px' }}><Check size={14} color="#059669" strokeWidth={2.4} /> Approve and lock problem statements</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '7px' }}><Check size={14} color="#059669" strokeWidth={2.4} /> Schedule meetings & log attendance rosters</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '7px' }}><Check size={14} color="#059669" strokeWidth={2.4} /> Grant Phase 1, Phase 2 & Phase 3 clearances</li>
              </ul>
            </div>

            {/* Evaluation Judge */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: 'var(--color-canvas-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Award size={15} color="var(--color-ink)" />
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Panel Judge (Faculty)</h3>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '13px', color: 'var(--color-ink-soft)', lineHeight: '1.8', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '7px' }}><Check size={14} color="#059669" strokeWidth={2.4} /> Conflict-free panel assignment</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '7px' }}><Check size={14} color="#059669" strokeWidth={2.4} /> Score presentation rounds out of 10 points</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '7px' }}><Check size={14} color="#059669" strokeWidth={2.4} /> Final defense & viva evaluation</li>
              </ul>
            </div>

            {/* Project Incharge */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: 'var(--color-canvas-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield size={15} color="var(--color-ink)" />
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Project Incharge (Admin)</h3>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '13px', color: 'var(--color-ink-soft)', lineHeight: '1.8', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '7px' }}><Check size={14} color="#059669" strokeWidth={2.4} /> Manage presentation dates & venue halls (AB10)</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '7px' }}><Check size={14} color="#059669" strokeWidth={2.4} /> Toggle phases to Live & audit defaulting teams</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '7px' }}><Check size={14} color="#059669" strokeWidth={2.4} /> Export verified marks to institutional Excel sheets</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Unified Footer */}
      <Footer />
    </div>
  );
}
