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
                position: 'relative',
                minHeight: '400px',
                borderRadius: '16px',
                padding: '20px 18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                overflow: 'hidden',
                background: 'linear-gradient(145deg, #EFF6FF 0%, #F8FAFC 50%, #ECFDF5 100%)',
                boxShadow: '0 2px 16px rgba(15, 23, 42, 0.04)',
                border: '1px solid #E2E8F0',
              }}
            >
              {/* Floating Pill Top */}
              <div
                style={{
                  alignSelf: 'flex-end',
                  backgroundColor: '#FFFFFF',
                  padding: '7px 12px',
                  borderRadius: 'var(--rounded-full)',
                  boxShadow: '0 2px 10px rgba(15, 23, 42, 0.05)',
                  border: '1px solid var(--color-hairline)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '11px',
                  color: 'var(--color-ink)',
                }}
              >
                <span style={{ fontWeight: 800, color: '#1E40AF', fontSize: '10px' }}>MILESTONE</span>
                <span>Team #042 • Phase 1 Approved</span>
                <div
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    backgroundColor: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                  }}
                >
                  <Check size={10} />
                </div>
              </div>

              {/* Center Student Project Card */}
              <div
                style={{
                  margin: '8px auto',
                  width: '100%',
                  maxWidth: '350px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '14px',
                  padding: '18px 16px',
                  boxShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.06)',
                  border: '1px solid #E2E8F0',
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: '#EFF6FF', color: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <GraduationCap size={13} />
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--color-ink)' }}>BCA Major Project</div>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Team CS-2026-042</div>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '10px',
                      padding: '2px 8px',
                      borderRadius: 'var(--rounded-full)',
                      fontWeight: 700,
                      backgroundColor: '#ECFDF5',
                      color: '#047857',
                      border: '1px solid #A7F3D0',
                    }}
                  >
                    Phase 2 Active
                  </span>
                </div>

                {/* Project Title */}
                <div style={{ marginBottom: '12px', backgroundColor: '#F8FAFC', padding: '9px 11px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>
                    Problem Statement
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-ink)' }}>
                    AI Crop Pathology & Irrigation Diagnostics
                  </div>
                </div>

                {/* Details */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', borderTop: '1px solid #F1F5F9', paddingTop: '8px' }}>
                  <div>
                    <div style={{ fontSize: '9px', color: 'var(--color-text-muted)' }}>Leader</div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-ink)' }}>Arpit Pandey</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '9px', color: 'var(--color-text-muted)' }}>Team Size</div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-ink)' }}>6 Members</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '9px', color: 'var(--color-text-muted)' }}>Panel Score</div>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#059669' }}>9.4 / 10</div>
                  </div>
                </div>
              </div>

              {/* Floating Pill Bottom */}
              <div
                style={{
                  alignSelf: 'flex-start',
                  backgroundColor: '#FFFFFF',
                  padding: '7px 12px',
                  borderRadius: 'var(--rounded-full)',
                  boxShadow: '0 2px 10px rgba(15, 23, 42, 0.05)',
                  border: '1px solid var(--color-hairline)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '11px',
                  color: 'var(--color-ink)',
                }}
              >
                <span>👨‍🏫 Panel 3: 6 Evaluations Scheduled in AB10</span>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#059669' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4 AUDITED STATS                                                           */}
      {/* ========================================================================= */}
      <section style={{ padding: '24px 20px', borderTop: '1px solid var(--color-hairline)', borderBottom: '1px solid var(--color-hairline)', backgroundColor: '#FAFAFA' }}>
        <div className="container" style={{ maxWidth: '1180px' }}>
          <div className="grid-cols-4" style={{ textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-ink)', letterSpacing: '-0.03em' }}>
                102
              </div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', marginTop: '2px' }}>
                Project Teams
              </div>
            </div>

            <div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-ink)', letterSpacing: '-0.03em' }}>
                601
              </div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', marginTop: '2px' }}>
                Allocated Students
              </div>
            </div>

            <div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-ink)', letterSpacing: '-0.03em' }}>
                23
              </div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', marginTop: '2px' }}>
                Faculty Mentors
              </div>
            </div>

            <div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-ink)', letterSpacing: '-0.03em' }}>
                3
              </div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', marginTop: '2px' }}>
                Milestones (Phases 1-3)
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
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '13px', color: 'var(--color-ink-soft)', lineHeight: '1.8' }}>
                <li>✓ Submit and lock problem statements</li>
                <li>✓ Request mentor meetings via &quot;Want to Meet&quot;</li>
                <li>✓ Upload finalized Phase 3 documentation</li>
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
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '13px', color: 'var(--color-ink-soft)', lineHeight: '1.8' }}>
                <li>✓ Approve and lock problem statements</li>
                <li>✓ Schedule meetings & log attendance rosters</li>
                <li>✓ Grant Phase 1, Phase 2 & Phase 3 clearances</li>
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
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '13px', color: 'var(--color-ink-soft)', lineHeight: '1.8' }}>
                <li>✓ Conflict-free panel assignment</li>
                <li>✓ Score presentation rounds out of 10 points</li>
                <li>✓ Final defense & viva evaluation</li>
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
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '13px', color: 'var(--color-ink-soft)', lineHeight: '1.8' }}>
                <li>✓ Manage presentation dates & venue halls (AB10)</li>
                <li>✓ Toggle phases to Live & audit defaulting teams</li>
                <li>✓ Export verified marks to institutional Excel sheets</li>
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
