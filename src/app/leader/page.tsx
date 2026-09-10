'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  UserCheck,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

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

export default function LeaderRegistrationPage() {
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

  useEffect(() => {
    // If user is already logged in, redirect to their appropriate dashboard
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

      // Perform immediate auto-login: No redirect to login page!
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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-canvas)', width: '100%', overflowX: 'hidden' }}>
      <Navbar />

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '28px 16px 48px', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ width: '100%', maxWidth: '640px', boxSizing: 'border-box' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '24px', padding: '0 8px' }}>
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
                marginBottom: '14px',
                border: '1px solid var(--color-hairline)',
              }}
            >
              <Sparkles size={13} color="var(--color-accent)" /> Zero-Email Direct Activation
            </div>

            <h1 style={{ fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 700, letterSpacing: '-0.03em' }}>
              Designate Team Leader.
            </h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', marginTop: '6px', maxWidth: '480px', margin: '6px auto 0', lineHeight: '1.5' }}>
              Teams elect their leader offline. Select your project group to activate your credentials and land directly in your dashboard.
            </p>
          </div>

          {/* Form Card */}
          <div className="card" style={{ padding: '24px 20px', width: '100%', boxSizing: 'border-box' }}>
            {error && (
              <div className="alert-banner alert-danger">
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <div>{error}</div>
              </div>
            )}

            {successMessage && (
              <div className="alert-banner alert-success">
                <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
                <div>{successMessage}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ width: '100%', boxSizing: 'border-box' }}>
              <div className="input-group" style={{ width: '100%', boxSizing: 'border-box' }}>
                <label className="input-label">1. Select Project Team</label>
                <select
                  className="select-field"
                  style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', fontSize: '13px' }}
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  disabled={loadingTeams || submitting}
                  required
                >
                  <option value="">
                    {loadingTeams ? 'Loading eligible teams...' : '-- Choose your team --'}
                  </option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.team_name} ({t.program})
                    </option>
                  ))}
                </select>
                <span style={{ fontSize: '12px', color: 'var(--color-text-faint)', marginTop: '4px', display: 'block' }}>
                  Teams with an active leader are dynamically filtered out.
                </span>
              </div>

              <div className="input-group">
                <label className="input-label">2. Select Leader Email Address</label>
                <select
                  className="select-field"
                  style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', fontSize: '13px' }}
                  value={selectedEmail}
                  onChange={(e) => setSelectedEmail(e.target.value)}
                  disabled={!selectedTeamId || loadingMembers || submitting}
                  required
                >
                  <option value="">
                    {!selectedTeamId
                      ? '-- Select team first --'
                      : loadingMembers
                      ? 'Loading members...'
                      : '-- Select registered email --'}
                  </option>
                  {members.map((m) => (
                    <option key={m.id} value={m.email}>
                      {m.full_name} ({m.email})
                    </option>
                  ))}
                </select>
                <span style={{ fontSize: '12px', color: 'var(--color-text-faint)', marginTop: '4px', display: 'block' }}>
                  Displays only registered student members belonging strictly to the selected team.
                </span>
              </div>

              {/* Verified Member Preview */}
              {selectedMemberObj && (
                <div
                  className="card-soft"
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--rounded-sm)',
                    marginBottom: '20px',
                    fontSize: '13px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--color-ink)', marginBottom: '8px' }}>
                    <ShieldCheck size={16} color="var(--color-accent)" /> Verified Roster Record:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
                    <div>
                      <span style={{ color: 'var(--color-text-muted)' }}>Name:</span>{' '}
                      <strong>{selectedMemberObj.full_name}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--color-text-muted)' }}>Roll No:</span>{' '}
                      <strong>{selectedMemberObj.roll_no}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--color-text-muted)' }}>Phone:</span>{' '}
                      <strong>{selectedMemberObj.mobile}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--color-text-muted)' }}>Course:</span>{' '}
                      <strong>{selectedMemberObj.course}</strong>
                    </div>
                  </div>
                  <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--color-hairline)', fontSize: '12px', color: 'var(--color-ink)' }}>
                    ✓ Initial Password will be configured as the preloaded mobile number: <strong>{selectedMemberObj.mobile}</strong>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginTop: '12px' }}>
                <Link href="/login" style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                  Already registered? Sign In
                </Link>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!selectedTeamId || !selectedEmail || submitting}
                  style={{ padding: '12px 24px' }}
                >
                  {submitting ? 'Activating Credentials...' : 'Confirm & Activate Leader'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Unified Footer */}
      <Footer />
    </div>
  );
}
