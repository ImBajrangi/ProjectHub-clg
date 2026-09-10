'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  FileText,
  Calendar,
  Award,
  Lock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Send,
  Phone,
  Mail,
  ShieldCheck,
  Bold,
  MapPin,
  Clock,
  Building,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function LeaderDashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [teamData, setTeamData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 4 Tabs: overview, problem, meetings, schedule (PDF uploads removed per user request)
  const [activeTab, setActiveTab] = useState<'overview' | 'problem' | 'meetings' | 'schedule'>('overview');

  // Problem statement form
  const [psTitle, setPsTitle] = useState('');
  const [psDescription, setPsDescription] = useState('');
  const [submittingPs, setSubmittingPs] = useState(false);
  const [psMessage, setPsMessage] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);

  // Meeting request
  const [requestingMeeting, setRequestingMeeting] = useState(false);
  const [meetingMessage, setMeetingMessage] = useState('');

  const loadDashboard = async () => {
    try {
      const authRes = await fetch('/api/auth/me');
      if (!authRes.ok) {
        router.push('/login');
        return;
      }
      const authData = await authRes.json();
      if (authData.user?.role !== 'leader') {
        router.push(authData.user?.role === 'supervisor' ? '/dashboard/faculty' : '/admin');
        return;
      }
      setCurrentUser(authData.user);

      const teamRes = await fetch('/api/team');
      if (teamRes.ok) {
        const tData = await teamRes.json();
        setTeamData(tData);
        if (tData.problemStatement) {
          setPsTitle(tData.problemStatement.title || '');
          const desc = tData.problemStatement.description || '';
          setPsDescription(desc);
          if (editorRef.current) {
            editorRef.current.innerHTML = desc;
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  // Sync editor content when problem statement data loads or changes
  useEffect(() => {
    if (editorRef.current && psDescription && editorRef.current.innerHTML !== psDescription) {
      editorRef.current.innerHTML = psDescription;
    }
  }, [activeTab]);

  const handleBoldClick = () => {
    document.execCommand('bold', false);
    if (editorRef.current) {
      setPsDescription(editorRef.current.innerHTML);
    }
  };

  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      document.execCommand('bold', false);
      if (editorRef.current) {
        setPsDescription(editorRef.current.innerHTML);
      }
    }
  };

  const handleEditorInput = (e: React.FormEvent<HTMLDivElement>) => {
    setPsDescription(e.currentTarget.innerHTML);
  };

  const handleProblemStatementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingPs(true);
    setPsMessage('');

    const finalDescription = editorRef.current ? editorRef.current.innerHTML : psDescription;

    try {
      const res = await fetch('/api/problem-statement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: psTitle, description: finalDescription }),
      });
      const data = await res.json();

      if (!res.ok) {
        setPsMessage(`Error: ${data.error}`);
      } else {
        setPsMessage('Problem statement submitted successfully for supervisor review.');
        loadDashboard();
      }
    } catch (e: any) {
      setPsMessage(`Error: ${e.message}`);
    } finally {
      setSubmittingPs(false);
    }
  };

  const handleWantToMeet = async () => {
    setRequestingMeeting(true);
    setMeetingMessage('');

    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request' }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMeetingMessage(`Error: ${data.error}`);
      } else {
        setMeetingMessage('Meeting request sent! Your supervisor has received an immediate alert.');
        loadDashboard();
      }
    } catch (e: any) {
      setMeetingMessage(`Error: ${e.message}`);
    } finally {
      setRequestingMeeting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <RefreshCw size={28} className="spin" style={{ color: 'var(--color-ink)' }} />
      </div>
    );
  }

  const team = teamData?.team;
  const supervisor = teamData?.supervisor;
  const members = teamData?.members || [];
  const problemStatement = teamData?.problemStatement;
  const meetings = teamData?.meetings || [];
  const schedules = teamData?.schedules || [];
  const isLocked = problemStatement?.locked || problemStatement?.status === 'approved';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-canvas)' }}>
      <Navbar user={currentUser} teamCode={team?.team_code} />

      <main className="container" style={{ flex: 1, paddingBottom: '60px' }}>
        {/* Team Banner */}
        <div className="card-soft" style={{ padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span className="badge badge-neutral">{team?.program}</span>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Code: {team?.team_code}</span>
              </div>
              <h1 style={{ fontSize: '26px', fontWeight: 700 }}>{team?.team_name}</h1>
              <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                Leader: <strong style={{ color: 'var(--color-ink)' }}>{currentUser?.fullName}</strong> ({currentUser?.email})
              </div>
            </div>

            {/* Guide Info */}
            <div style={{ backgroundColor: '#FFFFFF', padding: '12px 18px', borderRadius: 'var(--rounded-sm)', border: '1px solid var(--color-hairline)' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                Assigned Supervisor
              </div>
              <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-ink)', marginTop: '2px' }}>
                {supervisor?.fullName || 'Not Allocated'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                {supervisor?.email} • {supervisor?.phone}
              </div>
            </div>
          </div>
        </div>

        {/* Mobbin Segmented Pill Navigation */}
        <div style={{ marginBottom: '24px' }}>
          <div className="segmented-control" style={{ width: '100%', justifyContent: 'flex-start' }}>
            <button
              className={`segmented-pill ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Team Roster ({members.length})
            </button>
            <button
              className={`segmented-pill ${activeTab === 'problem' ? 'active' : ''}`}
              onClick={() => setActiveTab('problem')}
            >
              Problem Statement {isLocked && '✓'}
            </button>
            <button
              className={`segmented-pill ${activeTab === 'meetings' ? 'active' : ''}`}
              onClick={() => setActiveTab('meetings')}
            >
              Meetings ({meetings.length})
            </button>
            <button
              className={`segmented-pill ${activeTab === 'schedule' ? 'active' : ''}`}
              onClick={() => setActiveTab('schedule')}
            >
              Evaluation Schedule
            </button>
          </div>
        </div>

        {/* TAB 1: OVERVIEW & ROSTER */}
        {activeTab === 'overview' && (
          <div className="card">
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px' }}>
              Student Team Members ({members.length})
            </h3>
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Roll No</th>
                    <th>Full Name</th>
                    <th>Email ID</th>
                    <th>Mobile</th>
                    <th>CPI</th>
                    <th>Designation</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m: any) => (
                    <tr key={m.id}>
                      <td style={{ color: 'var(--color-text-muted)' }}>{m.roll_no}</td>
                      <td style={{ fontWeight: 600 }}>{m.full_name}</td>
                      <td style={{ color: 'var(--color-text-muted)' }}>{m.email}</td>
                      <td>{m.mobile}</td>
                      <td>{m.cpi || 'N/A'}</td>
                      <td>
                        {m.is_leader ? (
                          <span className="badge badge-ink" style={{ fontSize: '10px' }}>Leader</span>
                        ) : (
                          <span style={{ color: 'var(--color-text-faint)', fontSize: '11px' }}>Member</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: PROBLEM STATEMENT (WITH RICH AUTO-EXPANDING BOLD TEXTAREA) */}
        {activeTab === 'problem' && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Milestone 1: Problem Statement Proposal</h3>
                <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                  Once approved by your supervisor, this proposal is permanently locked against further edits.
                </p>
              </div>

              <div>
                {problemStatement?.status === 'approved' ? (
                  <span className="badge badge-success">✓ Approved & Locked</span>
                ) : problemStatement?.status === 'revision_requested' ? (
                  <span className="badge badge-warning">⚠ Revision Requested</span>
                ) : problemStatement?.status === 'pending' ? (
                  <span className="badge badge-warning">Pending Supervisor Review</span>
                ) : (
                  <span className="badge badge-neutral">Not Submitted</span>
                )}
              </div>
            </div>

            {problemStatement?.status === 'revision_requested' && problemStatement?.supervisor_remarks && (
              <div className="alert-banner alert-warning" style={{ marginBottom: '16px' }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <div>
                  <strong>Supervisor Feedback:</strong> {problemStatement.supervisor_remarks}
                </div>
              </div>
            )}

            {isLocked && (
              <div className="alert-banner alert-success" style={{ marginBottom: '16px' }}>
                <Lock size={16} style={{ flexShrink: 0 }} />
                <div>
                  <strong>Immutable Lock Enforced:</strong> This proposal has been formally reviewed and approved by your supervisor. Fields are permanently read-only.
                </div>
              </div>
            )}

            {psMessage && (
              <div className={`alert-banner ${psMessage.includes('Error') ? 'alert-danger' : 'alert-success'}`}>
                {psMessage}
              </div>
            )}

            <form onSubmit={handleProblemStatementSubmit}>
              <div className="input-group">
                <label className="input-label">Project Title</label>
                <input
                  type="text"
                  className="input-field"
                  value={psTitle}
                  onChange={(e) => setPsTitle(e.target.value)}
                  placeholder="Enter project title..."
                  disabled={isLocked || submittingPs}
                  required
                />
              </div>

              {/* Dynamic Auto-Expanding Rich Bold Text Area */}
              <div className="input-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="input-label" style={{ marginBottom: 0 }}>
                    Problem Scope & Methodology Description
                  </label>
                  {!isLocked && (
                    <button
                      type="button"
                      onClick={handleBoldClick}
                      className="btn btn-soft"
                      style={{ padding: '4px 10px', fontSize: '12px', fontWeight: 700 }}
                      title="Make selected text Bold (Ctrl+B)"
                    >
                      <Bold size={13} /> Bold (Ctrl+B)
                    </button>
                  )}
                </div>

                {isLocked ? (
                  <div
                    style={{
                      padding: '14px 16px',
                      backgroundColor: 'var(--color-canvas-soft)',
                      borderRadius: 'var(--rounded-sm)',
                      border: '1px solid var(--color-hairline)',
                      fontSize: '14px',
                      lineHeight: '1.6',
                      minHeight: '140px',
                      color: 'var(--color-ink)',
                    }}
                    dangerouslySetInnerHTML={{ __html: psDescription || 'No description provided.' }}
                  />
                ) : (
                  <div
                    ref={editorRef}
                    contentEditable={!submittingPs}
                    onInput={handleEditorInput}
                    onKeyDown={handleEditorKeyDown}
                    style={{
                      width: '100%',
                      minHeight: '160px',
                      height: 'auto',
                      padding: '14px 16px',
                      backgroundColor: 'var(--color-field)',
                      borderRadius: 'var(--rounded-sm)',
                      border: '1px solid transparent',
                      color: 'var(--color-ink)',
                      fontSize: '14px',
                      lineHeight: '1.6',
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s ease',
                      whiteSpace: 'pre-wrap',
                      overflowY: 'visible',
                    }}
                    className="rich-bold-editor"
                    data-placeholder="Detail the technical approach, system design, and expected deliverables... (Select text and press Ctrl+B or click Bold button)"
                  />
                )}
                <span style={{ fontSize: '11px', color: 'var(--color-text-faint)', marginTop: '6px', display: 'block' }}>
                  • Box automatically expands to fit your text without scrollbars. Format bold text with Ctrl+B or the Bold button.
                </span>
              </div>

              {!isLocked && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                  <button type="submit" className="btn btn-primary" disabled={submittingPs}>
                    <Send size={14} />
                    {submittingPs ? 'Submitting...' : 'Submit for Review'}
                  </button>
                </div>
              )}
            </form>
          </div>
        )}

        {/* TAB 3: MEETINGS */}
        {activeTab === 'meetings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Action Bar */}
            <div className="card-soft" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', padding: '20px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Request Supervisor Review</h3>
                <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                  Click "Want to Meet" to notify Prof. {supervisor?.fullName || 'Supervisor'} immediately.
                </p>
              </div>

              <button
                onClick={handleWantToMeet}
                className="btn btn-primary"
                disabled={requestingMeeting}
              >
                <Send size={14} />
                {requestingMeeting ? 'Dispatching...' : 'Want to Meet'}
              </button>
            </div>

            {meetingMessage && (
              <div className={`alert-banner ${meetingMessage.includes('Error') ? 'alert-danger' : 'alert-success'}`}>
                {meetingMessage}
              </div>
            )}

            {/* Meetings History */}
            <div className="card">
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px' }}>
                Chronological Meeting Logs
              </h3>

              {meetings.length === 0 ? (
                <p style={{ fontSize: '13px', color: 'var(--color-text-faint)', textAlign: 'center', padding: '40px' }}>
                  No meetings requested or logged yet.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {meetings.map((m: any) => (
                    <div
                      key={m.id}
                      style={{
                        backgroundColor: 'var(--color-canvas-soft)',
                        borderRadius: 'var(--rounded-sm)',
                        padding: '16px',
                        border: '1px solid var(--color-hairline)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <strong style={{ fontSize: '14px', color: 'var(--color-ink)' }}>Meet {m.meeting_index} Info</strong>
                        <span className="badge badge-neutral" style={{ fontSize: '10px' }}>{m.status}</span>
                      </div>

                      {m.scheduled_date && (
                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                          Scheduled: <strong>{m.scheduled_date}</strong> at <strong>{m.time_slot}</strong> • Venue: <strong>{m.venue}</strong>
                        </div>
                      )}

                      {m.summary_notes && (
                        <p style={{ fontSize: '13px', color: 'var(--color-ink-soft)', whiteSpace: 'pre-wrap' }}>
                          {m.summary_notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: EVALUATION SCHEDULE (DETAILED BULLET POINTS & FULL PANEL JUDGE CONTACTS) */}
        {activeTab === 'schedule' && (
          <div className="card">
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Published Presentation Logistics</h3>
              <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                Official venue and faculty evaluation panel assigned to your team.
              </p>
            </div>

            {schedules.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '48px 24px',
                  backgroundColor: 'var(--color-canvas-soft)',
                  borderRadius: 'var(--rounded-sm)',
                  border: '1px dashed var(--color-hairline)',
                }}
              >
                <Calendar size={36} style={{ opacity: 0.35, margin: '0 auto 12px' }} />
                <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-ink)' }}>
                  No Panel Assigned Yet
                </h4>
                <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px', maxWidth: '440px', margin: '4px auto 0' }}>
                  The Project Incharge has not yet allocated an evaluation panel for your team in this phase. Once published, complete schedule and faculty judge details will appear here.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {schedules.map((sc: any) => (
                  <div
                    key={sc.id}
                    style={{
                      backgroundColor: 'var(--color-canvas-soft)',
                      borderRadius: 'var(--rounded-md)',
                      padding: '24px',
                      border: '1px solid var(--color-hairline)',
                    }}
                  >
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid var(--color-hairline)', paddingBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Award size={20} color="var(--color-accent)" />
                        <h4 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-ink)' }}>
                          {sc.panel_name}
                        </h4>
                      </div>
                      <span className="badge badge-ink" style={{ fontSize: '12px', padding: '4px 12px' }}>
                        Phase {sc.phase_number} Evaluation
                      </span>
                    </div>

                    {/* Clean Bullet Points for Logistics */}
                    <div style={{ marginBottom: '20px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-faint)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px' }}>
                        Schedule & Location Logistics
                      </div>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: 'var(--color-ink)', fontWeight: 700 }}>• Venue:</span>
                          <span>{sc.academic_block || 'Academic Block AB10'}</span>
                        </li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: 'var(--color-ink)', fontWeight: 700 }}>• Room Number:</span>
                          <span>{sc.room_number || 'Room TBA'}</span>
                        </li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: 'var(--color-ink)', fontWeight: 700 }}>• Date:</span>
                          <span>{sc.date || 'To Be Announced'}</span>
                        </li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: 'var(--color-ink)', fontWeight: 700 }}>• Time Window / Shift:</span>
                          <span>{sc.time_window || 'Shift 1: Morning (09:00 AM - 01:00 PM)'}</span>
                        </li>
                      </ul>
                    </div>

                    {/* Assigned Faculty Panel Judges with Name, Email, Phone */}
                    <div style={{ borderTop: '1px solid var(--color-hairline)', paddingTop: '16px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-faint)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px' }}>
                        Assigned Faculty Panel Judges
                      </div>

                      {sc.judges && sc.judges.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                          {sc.judges.map((j: any) => (
                            <div
                              key={j.id || j.email}
                              style={{
                                backgroundColor: '#FFFFFF',
                                borderRadius: 'var(--rounded-sm)',
                                border: '1px solid var(--color-hairline)',
                                padding: '14px 16px',
                              }}
                            >
                              <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-ink)', marginBottom: '4px' }}>
                                • {j.name}
                              </div>
                              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                                <Mail size={12} /> {j.email}
                              </div>
                              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Phone size={12} /> {j.phone || 'N/A'}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ fontSize: '12px', color: 'var(--color-text-faint)' }}>
                          Faculty judge assignments are being finalized by Project Incharge.
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Unified Footer */}
      <Footer />
    </div>
  );
}
