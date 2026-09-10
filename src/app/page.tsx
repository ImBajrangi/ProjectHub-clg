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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-canvas)' }}>
      <Navbar user={user} />

      {/* Hero Section */}
      <section style={{ padding: '60px 20px 48px', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: '840px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              backgroundColor: 'var(--color-canvas-soft)',
              borderRadius: 'var(--rounded-full)',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--color-ink)',
              marginBottom: '24px',
              border: '1px solid var(--color-hairline)',
            }}
          >
            <Sparkles size={13} color="var(--color-accent)" /> CodeShastra ProjectHub v3.0
          </div>

          <h1
            style={{
              fontSize: 'clamp(36px, 6vw, 64px)',
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: '-0.035em',
              color: 'var(--color-ink)',
              marginBottom: '20px',
            }}
          >
            Academic project management. Engineered to get out of the way.
          </h1>

          <p
            style={{
              fontSize: '18px',
              fontWeight: 400,
              color: 'var(--color-text-muted)',
              maxWidth: '640px',
              margin: '0 auto 36px',
              lineHeight: 1.5,
            }}
          >
            A unified milestone evaluation platform coordinating 102 student teams, 601 students, and 23 faculty mentors with strict single-device concurrency and supervisor gatekeeping.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <Link
              href="/leader"
              className="btn btn-primary"
              style={{ padding: '12px 28px', fontSize: '15px' }}
            >
              Elect Team Leader (/leader) <ArrowRight size={15} />
            </Link>

            <Link
              href="/login"
              className="btn btn-outline"
              style={{ padding: '12px 28px', fontSize: '15px' }}
            >
              Portal Login
            </Link>
          </div>
        </div>
      </section>

      {/* 4 Library Counters (Per Mobbin Section 329 display style) */}
      <section style={{ padding: '20px 20px 48px' }}>
        <div className="container" style={{ maxWidth: '1080px' }}>
          <div className="card-soft" style={{ padding: '32px 24px' }}>
            <div className="grid-cols-4" style={{ textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: '48px', fontWeight: 700, color: 'var(--color-ink)', letterSpacing: '-0.04em' }}>
                  102
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  Project Groups (BCA & BCA-DS)
                </div>
              </div>

              <div>
                <div style={{ fontSize: '48px', fontWeight: 700, color: 'var(--color-ink)', letterSpacing: '-0.04em' }}>
                  601
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  Pre-Allocated Students
                </div>
              </div>

              <div>
                <div style={{ fontSize: '48px', fontWeight: 700, color: 'var(--color-ink)', letterSpacing: '-0.04em' }}>
                  23
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  Faculty Mentors & Judges
                </div>
              </div>

              <div>
                <div style={{ fontSize: '48px', fontWeight: 700, color: 'var(--color-ink)', letterSpacing: '-0.04em' }}>
                  3
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  Evaluation Milestones
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Clean Stakeholder Feature Cards */}
      <section style={{ padding: '20px 20px 80px' }}>
        <div className="container" style={{ maxWidth: '1080px' }}>
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.025em' }}>
              Four Dedicated Stakeholder Experiences.
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '15px', marginTop: '6px' }}>
              Structured workflows designed around institutional governance and academic integrity.
            </p>
          </div>

          <div className="grid-cols-2">
            {/* Student Leader */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'var(--color-canvas-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={16} color="var(--color-ink)" />
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Student Team Leader</h3>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '14px', lineHeight: '1.5' }}>
                  Elected by their academic group to manage project milestones. Submits the official problem statement, coordinates review meetings via "Want to Meet", and uploads finalized Phase 3 documentation deliverables.
                </p>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-ink)', fontWeight: 600 }}>
                • Single Active Workstation Session Security
              </div>
            </div>

            {/* Supervisor Mentor */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'var(--color-canvas-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Compass size={16} color="var(--color-ink)" />
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Faculty Supervisor (Mentor)</h3>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '14px', lineHeight: '1.5' }}>
                  Reviews proposed problem statements with immutable lock enforcement, schedules meetings with venue or Google Meet links, and logs student attendance rosters (*Meet 1*, *Meet 2*...).
                </p>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-ink)', fontWeight: 600 }}>
                • Supervisor Gatekeeper: 3 Independent Phase Clearances
              </div>
            </div>

            {/* Evaluation Judge */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'var(--color-canvas-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Award size={16} color="var(--color-ink)" />
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Panel Member (Faculty Judge)</h3>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '14px', lineHeight: '1.5' }}>
                  Shuffled into panels by the Project Incharge. Evaluates presentation rounds, enters individual scores out of 10 or marks absent, and submits Phase 3 report clearances.
                </p>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-ink)', fontWeight: 600 }}>
                • Automated Conflict-of-Interest Safeguard
              </div>
            </div>

            {/* Project Incharge */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'var(--color-canvas-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Shield size={16} color="var(--color-ink)" />
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Project Incharge (Head Admin)</h3>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '14px', lineHeight: '1.5' }}>
                  Master administrative oversight. Controls the presentation calendar, toggles phases to Live, creates panels, schedules logistical venues (AB1/AB2, rooms), and audits defaulting teams.
                </p>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-ink)', fontWeight: 600 }}>
                • Live Presentation Calendar & Master Excel Ingestion
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Unified Footer with LinkedIn Developer Showcase */}
      <Footer />
    </div>
  );
}
