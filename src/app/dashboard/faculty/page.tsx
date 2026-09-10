'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Compass,
  Award,
  Users,
  Calendar,
  CheckCircle,
  Clock,
  MapPin,
  Video,
  FileText,
  AlertTriangle,
  Send,
  ExternalLink,
  ShieldAlert,
  ChevronRight,
  UserCheck,
  RefreshCw,
  X,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function FacultyDashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'supervisor' | 'panel'>('supervisor');

  // Supervisor Mode State
  const [guidedTeams, setGuidedTeams] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [supTab, setSupTab] = useState<'problem' | 'meetings' | 'clearance'>('problem');
  const [problemReviewText, setProblemReviewText] = useState('');
  const [reviewActionLoading, setReviewActionLoading] = useState(false);

  // Meeting Schedule Modal
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [targetMeetingId, setTargetMeetingId] = useState('');
  const [schedDate, setSchedDate] = useState('');
  const [schedTime, setSchedTime] = useState('');
  const [schedVenue, setSchedVenue] = useState('');

  // Meeting Logging Modal
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [logMeetingId, setLogMeetingId] = useState('');
  const [logMeetingIndex, setLogMeetingIndex] = useState(1);
  const [meetingSummary, setMeetingSummary] = useState('');
  const [actionDirectives, setActionDirectives] = useState('');
  const [attendanceList, setAttendanceList] = useState<{ studentId: string; name: string; roll: string; isPresent: boolean }[]>([]);

  // Panel Mode State
  const [panelData, setPanelData] = useState<any[]>([]);
  const [selectedPanelTeam, setSelectedPanelTeam] = useState<any>(null);
  const [panelTeamMembers, setPanelTeamMembers] = useState<any[]>([]);
  const [studentScores, setStudentScores] = useState<Record<string, { score: string; isAbsent: boolean; remarks: string }>>({});
  const [scoringLoading, setScoringLoading] = useState(false);
  const [scoreMessage, setScoreMessage] = useState('');

  const loadFacultyData = async () => {
    try {
      const authRes = await fetch('/api/auth/me');
      if (!authRes.ok) {
        router.push('/login');
        return;
      }
      const authData = await authRes.json();
      if (authData.user?.role !== 'supervisor' && authData.user?.role !== 'admin') {
        router.push('/dashboard/leader');
        return;
      }
      setCurrentUser(authData.user);

      const teamsRes = await fetch('/api/team');
      if (teamsRes.ok) {
        const tData = await teamsRes.json();
        const teams = tData.teams || [];
        setGuidedTeams(teams);
        if (teams.length > 0 && !selectedTeam) {
          setSelectedTeam(teams[0]);
        }
      }

      const panelRes = await fetch('/api/panels');
      if (panelRes.ok) {
        const pData = await panelRes.json();
        setPanelData(pData.panels || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFacultyData();
  }, []);

  const handleReviewProblemStatement = async (action: 'approve' | 'revise') => {
    if (!selectedTeam) return;
    setReviewActionLoading(true);

    try {
      const res = await fetch('/api/problem-statement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: selectedTeam.id,
          action,
          remarks: problemReviewText,
        }),
      });

      if (res.ok) {
        alert(action === 'approve' ? 'Problem Statement Approved and Permanently Locked!' : 'Revision Requested!');
        setProblemReviewText('');
        loadFacultyData();
      } else {
        const data = await res.json();
        alert(`Error: ${data.error}`);
      }
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    } finally {
      setReviewActionLoading(false);
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'schedule',
          meetingId: targetMeetingId,
          date: schedDate,
          timeSlot: schedTime,
          venue: schedVenue,
        }),
      });

      if (res.ok) {
        setScheduleModalOpen(false);
        loadFacultyData();
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const openLoggingModal = async (meeting: any) => {
    setLogMeetingId(meeting.id);
    setLogMeetingIndex(meeting.meeting_index);
    setMeetingSummary(meeting.summary_notes || '');
    setActionDirectives(meeting.action_directives || '');

    const teamMembers = selectedTeam?.members || [];
    setAttendanceList(
      teamMembers.map((m: any) => ({
        studentId: m.id,
        name: m.full_name,
        roll: m.roll_no,
        isPresent: true,
      }))
    );
    setLogModalOpen(true);
  };

  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'log',
          meetingId: logMeetingId,
          summaryNotes: meetingSummary,
          actionDirectives,
          attendance: attendanceList.map((a) => ({
            studentId: a.studentId,
            isPresent: a.isPresent,
          })),
        }),
      });

      if (res.ok) {
        setLogModalOpen(false);
        loadFacultyData();
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleTogglePhaseClearance = async (phaseNum: 1 | 2 | 3, currentApproved: boolean) => {
    if (!selectedTeam) return;

    try {
      const res = await fetch('/api/phases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'supervisor_approval',
          teamId: selectedTeam.id,
          phaseNumber: phaseNum,
          approved: !currentApproved,
        }),
      });

      if (res.ok) {
        loadFacultyData();
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleOpenPanelTeamScoring = async (team: any, phaseNumber: number) => {
    setSelectedPanelTeam(team);
    setScoreMessage('');

    try {
      const res = await fetch(`/api/team?teamId=${team.id}`);
      const data = await res.json();
      const students = data.members || [];
      setPanelTeamMembers(students);

      const evRes = await fetch(`/api/evaluations?phaseNumber=${phaseNumber}&teamId=${team.id}`);
      const evData = await evRes.json();
      const evals = evData.evaluations || [];

      const initialScores: Record<string, any> = {};
      students.forEach((s: any) => {
        const existing = evals.find((e: any) => e.student_id === s.id);
        initialScores[s.id] = {
          score: existing?.score !== null && existing?.score !== undefined ? String(existing.score) : '',
          isAbsent: existing ? existing.is_absent : false,
          remarks: existing?.remarks || '',
        };
      });
      setStudentScores(initialScores);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmitScores = async (phaseNumber: number) => {
    if (!selectedPanelTeam) return;
    setScoringLoading(true);
    setScoreMessage('');

    const payloadScores = Object.entries(studentScores).map(([studentId, item]) => ({
      studentId,
      score: item.isAbsent ? null : item.score !== '' ? parseFloat(item.score) : null,
      isAbsent: item.isAbsent,
      remarks: item.remarks,
    }));

    try {
      const res = await fetch('/api/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit_scores',
          phaseNumber,
          teamId: selectedPanelTeam.id,
          scores: payloadScores,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setScoreMessage(`Error: ${data.error}`);
      } else {
        setScoreMessage('Scores successfully recorded.');
        loadFacultyData();
      }
    } catch (e: any) {
      setScoreMessage(`Error: ${e.message}`);
    } finally {
      setScoringLoading(false);
    }
  };

  const handleReportClearance = async (cleared: boolean) => {
    if (!selectedPanelTeam) return;
    try {
      const res = await fetch('/api/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'report_clearance',
          teamId: selectedPanelTeam.id,
          cleared,
        }),
      });

      if (res.ok) {
        alert('Phase 3 Report Clearance submitted successfully.');
        loadFacultyData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <RefreshCw size={28} className="spin" style={{ color: 'var(--color-ink)' }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-canvas)' }}>
      <Navbar
        user={currentUser}
        activeFacultyMode={mode}
        onFacultyModeChange={(newMode) => {
          setMode(newMode);
          setSelectedPanelTeam(null);
        }}
      />

      <main className="container" style={{ flex: 1, paddingBottom: '60px' }}>
        {/* Mode Switcher Pill */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <span className="badge badge-neutral" style={{ marginBottom: '8px' }}>
                {mode === 'supervisor' ? <Compass size={12} /> : <Award size={12} />}
                {mode === 'supervisor' ? ' Faculty Mentor Mode' : ' Evaluation Panel Judge Mode'}
              </span>
              <h1 style={{ fontSize: '30px', fontWeight: 700, letterSpacing: '-0.025em' }}>
                {mode === 'supervisor' ? `Guided Project Teams (${guidedTeams.length})` : 'Evaluation Panel Console'}
              </h1>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginTop: '4px' }}>
                {mode === 'supervisor'
                  ? 'Review problem statements, coordinate meetings, and grant presentation clearance.'
                  : 'Score candidate teams with automated conflict-of-interest safeguards.'}
              </p>
            </div>

            {/* Stadium Mode Switcher */}
            <div className="segmented-control">
              <button
                className={`segmented-pill ${mode === 'supervisor' ? 'active' : ''}`}
                onClick={() => {
                  setMode('supervisor');
                  setSelectedPanelTeam(null);
                }}
              >
                <Users size={14} /> Guided Teams
              </button>
              <button
                className={`segmented-pill ${mode === 'panel' ? 'active' : ''}`}
                onClick={() => {
                  setMode('panel');
                  setSelectedPanelTeam(null);
                }}
              >
                <Award size={14} /> Panel Evaluations
              </button>
            </div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* SUPERVISOR VIEW */}
        {/* =================================================================== */}
        {mode === 'supervisor' && (
          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px' }}>
            {/* Left Column: Team Selector List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Your Assigned Teams
              </div>

              {guidedTeams.map((t) => {
                const isSelected = selectedTeam?.id === t.id;
                const hasLeader = Boolean(t.leader_id);

                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTeam(t)}
                    style={{
                      padding: '14px 16px',
                      borderRadius: 'var(--rounded-sm)',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? 'var(--color-canvas-soft)' : 'var(--color-canvas)',
                      border: isSelected ? '1px solid var(--color-ink)' : '1px solid var(--color-hairline)',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '14px', color: 'var(--color-ink)' }}>{t.team_name}</strong>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{t.program}</span>
                    </div>

                    <div style={{ marginBottom: '8px' }}>
                      {hasLeader ? (
                        <span className="badge badge-neutral" style={{ fontSize: '10px', padding: '2px 8px' }}>
                          <UserCheck size={10} /> {t.leader?.fullName}
                        </span>
                      ) : (
                        <span className="badge badge-danger" style={{ fontSize: '10px', padding: '2px 8px' }}>
                          Leader Not Selected
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      {t.members?.length || 0} Members • {t.totalMeetings || 0} Meets
                      {t.pendingMeetings > 0 && (
                        <span style={{ color: 'var(--color-warning)', fontWeight: 600, marginLeft: '6px' }}>
                          ({t.pendingMeetings} req)
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Column: Active Team Operations */}
            {selectedTeam ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Header Card */}
                <div className="card-soft" style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 700 }}>{selectedTeam.team_name}</h2>
                        <span className="badge badge-neutral">{selectedTeam.program}</span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                        Leader:{' '}
                        {selectedTeam.leader ? (
                          <strong style={{ color: 'var(--color-ink)' }}>
                            {selectedTeam.leader.fullName} ({selectedTeam.leader.phone || selectedTeam.leader.email})
                          </strong>
                        ) : (
                          <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>Not designated via /leader</span>
                        )}
                      </div>
                    </div>

                    {/* Segmented Control for Sub-actions */}
                    <div className="segmented-control">
                      <button
                        className={`segmented-pill ${supTab === 'problem' ? 'active' : ''}`}
                        onClick={() => setSupTab('problem')}
                      >
                        Problem Statement
                      </button>
                      <button
                        className={`segmented-pill ${supTab === 'meetings' ? 'active' : ''}`}
                        onClick={() => setSupTab('meetings')}
                      >
                        Meetings ({selectedTeam.meetings?.length || 0})
                      </button>
                      <button
                        className={`segmented-pill ${supTab === 'clearance' ? 'active' : ''}`}
                        onClick={() => setSupTab('clearance')}
                      >
                        Gatekeeper Permissions
                      </button>
                    </div>
                  </div>
                </div>

                {/* SUB-TAB 1: PROBLEM STATEMENT */}
                {supTab === 'problem' && (
                  <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Problem Statement Review</h3>
                      <div>
                        {selectedTeam.problemStatement?.status === 'approved' && (
                          <span className="badge badge-success">✓ Finalized & Locked</span>
                        )}
                        {selectedTeam.problemStatement?.status === 'pending' && (
                          <span className="badge badge-warning">Awaiting Your Review</span>
                        )}
                        {selectedTeam.problemStatement?.status === 'revision_requested' && (
                          <span className="badge badge-danger">Revision Requested</span>
                        )}
                        {!selectedTeam.problemStatement && (
                          <span className="badge badge-neutral">Not Submitted Yet</span>
                        )}
                      </div>
                    </div>

                    {selectedTeam.problemStatement ? (
                      <div>
                        <div style={{ backgroundColor: 'var(--color-canvas-soft)', padding: '16px', borderRadius: 'var(--rounded-sm)', marginBottom: '18px' }}>
                          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-ink)', marginBottom: '6px' }}>
                            {selectedTeam.problemStatement.title}
                          </div>
                          <p style={{ fontSize: '13px', color: 'var(--color-ink-soft)', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                            {selectedTeam.problemStatement.description}
                          </p>
                        </div>

                        {selectedTeam.problemStatement.status !== 'approved' && (
                          <div>
                            <div className="input-group">
                              <label className="input-label">Written Remarks / Revision Feedback:</label>
                              <textarea
                                className="textarea-field"
                                rows={3}
                                value={problemReviewText}
                                onChange={(e) => setProblemReviewText(e.target.value)}
                                placeholder="State specific improvements or guidance directives..."
                              />
                            </div>

                            <div style={{ display: 'flex', gap: '10px' }}>
                              <button
                                onClick={() => handleReviewProblemStatement('approve')}
                                className="btn btn-primary"
                                disabled={reviewActionLoading}
                              >
                                <CheckCircle size={15} /> Approve & Lock Statement
                              </button>
                              <button
                                onClick={() => handleReviewProblemStatement('revise')}
                                className="btn btn-outline"
                                disabled={reviewActionLoading || !problemReviewText}
                              >
                                Request Revision
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                        Team has not yet submitted a problem statement proposal.
                      </p>
                    )}
                  </div>
                )}

                {/* SUB-TAB 2: MEETINGS & LOGS */}
                {supTab === 'meetings' && (
                  <div className="card">
                    <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>
                      Review Sessions & Attendance Logs
                    </h3>

                    {/* Pending Requests */}
                    {selectedTeam.meetings?.filter((m: any) => m.status === 'requested').length > 0 && (
                      <div style={{ marginBottom: '20px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-warning)', marginBottom: '8px' }}>
                          Pending "Want to Meet" Requests:
                        </div>
                        {selectedTeam.meetings
                          .filter((m: any) => m.status === 'requested')
                          .map((m: any) => (
                            <div
                              key={m.id}
                              style={{
                                backgroundColor: 'var(--color-warning-bg)',
                                border: '1px solid var(--color-warning-border)',
                                borderRadius: 'var(--rounded-sm)',
                                padding: '14px 18px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '8px',
                              }}
                            >
                              <div>
                                <strong style={{ color: 'var(--color-ink)', fontSize: '13px' }}>
                                  Meet {m.meeting_index} Requested
                                </strong>
                                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                                  {new Date(m.requested_at).toLocaleDateString('en-IN')}
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  setTargetMeetingId(m.id);
                                  setScheduleModalOpen(true);
                                }}
                                className="btn btn-primary"
                                style={{ padding: '6px 14px', fontSize: '12px' }}
                              >
                                Schedule Session
                              </button>
                            </div>
                          ))}
                      </div>
                    )}

                    {/* Scheduled Meetings ready to log */}
                    {selectedTeam.meetings?.filter((m: any) => m.status === 'scheduled').length > 0 && (
                      <div style={{ marginBottom: '20px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-accent)', marginBottom: '8px' }}>
                          Upcoming Confirmed Sessions:
                        </div>
                        {selectedTeam.meetings
                          .filter((m: any) => m.status === 'scheduled')
                          .map((m: any) => (
                            <div
                              key={m.id}
                              style={{
                                backgroundColor: 'var(--color-canvas-soft)',
                                border: '1px solid var(--color-hairline)',
                                borderRadius: 'var(--rounded-sm)',
                                padding: '14px 18px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '8px',
                              }}
                            >
                              <div>
                                <strong style={{ color: 'var(--color-ink)', fontSize: '13px' }}>
                                  Meet {m.meeting_index}
                                </strong>
                                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                                  {m.scheduled_date} at {m.time_slot} | {m.venue}
                                </div>
                              </div>
                              <button
                                onClick={() => openLoggingModal(m)}
                                className="btn btn-outline"
                                style={{ padding: '6px 14px', fontSize: '12px' }}
                              >
                                Log Attendance & Summary
                              </button>
                            </div>
                          ))}
                      </div>
                    )}

                    {/* Completed Meeting Logs */}
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                        Archived Meeting History:
                      </div>
                      {selectedTeam.meetings?.filter((m: any) => m.status === 'completed').length === 0 ? (
                        <p style={{ fontSize: '12px', color: 'var(--color-text-faint)' }}>No completed meetings logged yet.</p>
                      ) : (
                        selectedTeam.meetings
                          ?.filter((m: any) => m.status === 'completed')
                          .map((m: any) => (
                            <div
                              key={m.id}
                              style={{
                                backgroundColor: 'var(--color-canvas-soft)',
                                borderRadius: 'var(--rounded-sm)',
                                padding: '12px 16px',
                                marginBottom: '8px',
                                fontSize: '13px',
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <strong style={{ color: 'var(--color-ink)' }}>Meet {m.meeting_index} Info</strong>
                                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{m.scheduled_date}</span>
                              </div>
                              <p style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>{m.summary_notes}</p>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                )}

                {/* SUB-TAB 3: GATEKEEPER CLEARANCES */}
                {supTab === 'clearance' && (
                  <div className="card">
                    <div style={{ marginBottom: '16px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Phase Gatekeeper Permissions</h3>
                      <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                        Per SRS Section 7: Panels cannot view or score any team without your approval.
                      </p>
                    </div>

                    <div className="grid-cols-3">
                      <div style={{ backgroundColor: 'var(--color-canvas-soft)', padding: '18px', borderRadius: 'var(--rounded-sm)' }}>
                        <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '4px' }}>Phase 1 (PPT)</div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '14px' }}>
                          Concept Pitch & Ideation
                        </div>
                        <button
                          onClick={() => handleTogglePhaseClearance(1, selectedTeam.phase1_approved)}
                          className={selectedTeam.phase1_approved ? 'btn btn-primary' : 'btn btn-outline'}
                          style={{ width: '100%', fontSize: '12px' }}
                        >
                          {selectedTeam.phase1_approved ? '✓ Approved (Revoke)' : 'Grant Permission'}
                        </button>
                      </div>

                      <div style={{ backgroundColor: 'var(--color-canvas-soft)', padding: '18px', borderRadius: 'var(--rounded-sm)' }}>
                        <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '4px' }}>Phase 2 (Demo)</div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '14px' }}>
                          Working Prototype
                        </div>
                        <button
                          onClick={() => handleTogglePhaseClearance(2, selectedTeam.phase2_approved)}
                          className={selectedTeam.phase2_approved ? 'btn btn-primary' : 'btn btn-outline'}
                          style={{ width: '100%', fontSize: '12px' }}
                        >
                          {selectedTeam.phase2_approved ? '✓ Approved (Revoke)' : 'Grant Permission'}
                        </button>
                      </div>

                      <div style={{ backgroundColor: 'var(--color-canvas-soft)', padding: '18px', borderRadius: 'var(--rounded-sm)' }}>
                        <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '4px' }}>Phase 3 (Defense)</div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '14px' }}>
                          Final Report & Paper
                        </div>
                        <button
                          onClick={() => handleTogglePhaseClearance(3, selectedTeam.phase3_approved)}
                          className={selectedTeam.phase3_approved ? 'btn btn-primary' : 'btn btn-outline'}
                          style={{ width: '100%', fontSize: '12px' }}
                        >
                          {selectedTeam.phase3_approved ? '✓ Approved (Revoke)' : 'Grant Permission'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
                <p style={{ color: 'var(--color-text-muted)' }}>Select an assigned team from the left column.</p>
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* PANEL (JUDGE) VIEW */}
        {/* =================================================================== */}
        {mode === 'panel' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="card-soft" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <ShieldAlert size={18} color="var(--color-ink)" />
              <div style={{ fontSize: '13px', color: 'var(--color-ink)' }}>
                <strong>Conflict Safeguard Active:</strong> Teams you personally supervise are strictly excluded. Panels only display teams with supervisor clearance once the phase is set to Live.
              </div>
            </div>

            {panelData.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
                <Award size={40} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
                <h4 style={{ fontSize: '16px', fontWeight: 700 }}>No Panel Assignments Yet</h4>
                <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  The Project Incharge will allocate your evaluation panels for the upcoming phase.
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: selectedPanelTeam ? '340px 1fr' : '1fr', gap: '24px' }}>
                {/* Panel Listings */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {panelData.map((p) => (
                    <div key={p.id} className="card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <div>
                          <h4 style={{ fontSize: '16px', fontWeight: 700 }}>{p.panel_name}</h4>
                          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                            {p.room_number || 'TBA'} • {p.academic_block || 'AB1'}
                          </div>
                        </div>
                        {p.isPhaseLive ? (
                          <span className="badge badge-success" style={{ fontSize: '11px' }}>● Live</span>
                        ) : (
                          <span className="badge badge-neutral" style={{ fontSize: '11px' }}>Not Live</span>
                        )}
                      </div>

                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                        Ready Teams ({p.evaluableTeams?.length || 0}):
                      </div>

                      {p.evaluableTeams?.length === 0 ? (
                        <p style={{ fontSize: '12px', color: 'var(--color-text-faint)' }}>
                          No teams currently cleared for this live phase.
                        </p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {p.evaluableTeams.map((t: any) => (
                            <button
                              key={t.id}
                              onClick={() => handleOpenPanelTeamScoring(t, p.phase_number)}
                              style={{
                                padding: '10px 14px',
                                borderRadius: 'var(--rounded-sm)',
                                border: selectedPanelTeam?.id === t.id ? '1px solid var(--color-ink)' : '1px solid var(--color-hairline)',
                                backgroundColor: selectedPanelTeam?.id === t.id ? 'var(--color-canvas-soft)' : 'var(--color-canvas)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                cursor: 'pointer',
                                textAlign: 'left',
                              }}
                            >
                              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-ink)' }}>{t.team_name}</span>
                              <ChevronRight size={14} color="var(--color-text-muted)" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Scoring Console */}
                {selectedPanelTeam && (
                  <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: 700 }}>
                        Scoring Console: {selectedPanelTeam.team_name}
                      </h3>
                      <button onClick={() => setSelectedPanelTeam(null)} className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '12px' }}>
                        Close
                      </button>
                    </div>

                    {/* Phase 3 Docs */}
                    {(selectedPanelTeam.paper_url || selectedPanelTeam.report_url) && (
                      <div style={{ backgroundColor: 'var(--color-canvas-soft)', padding: '14px', borderRadius: 'var(--rounded-sm)', marginBottom: '18px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-ink)', marginBottom: '8px' }}>
                          Phase 3 Deliverables:
                        </div>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                          {selectedPanelTeam.report_url && (
                            <a href={selectedPanelTeam.report_url} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ fontSize: '12px', padding: '6px 12px' }}>
                              <ExternalLink size={12} /> Project Report PDF
                            </a>
                          )}
                          {selectedPanelTeam.paper_url && (
                            <a href={selectedPanelTeam.paper_url} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ fontSize: '12px', padding: '6px 12px' }}>
                              <ExternalLink size={12} /> Research Paper PDF
                            </a>
                          )}
                          <button onClick={() => handleReportClearance(true)} className="btn btn-primary" style={{ fontSize: '12px', padding: '6px 12px' }}>
                            Submit Clearance
                          </button>
                        </div>
                      </div>
                    )}

                    {scoreMessage && (
                      <div className="alert-banner alert-success" style={{ fontSize: '13px' }}>
                        {scoreMessage}
                      </div>
                    )}

                    {/* Member Scoring Inputs */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                      {panelTeamMembers.map((student) => {
                        const current = studentScores[student.id] || { score: '', isAbsent: false, remarks: '' };

                        return (
                          <div
                            key={student.id}
                            style={{
                              padding: '12px 16px',
                              borderRadius: 'var(--rounded-sm)',
                              border: '1px solid var(--color-hairline)',
                              backgroundColor: current.isAbsent ? 'var(--color-danger-bg)' : 'var(--color-canvas)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              flexWrap: 'wrap',
                              gap: '12px',
                            }}
                          >
                            <div>
                              <strong style={{ fontSize: '13px', color: 'var(--color-ink)' }}>{student.full_name}</strong>
                              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Roll #{student.roll_no}</div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                              <div style={{ width: '110px' }}>
                                <input
                                  type="number"
                                  min="0"
                                  max="10"
                                  step="0.5"
                                  className="input-field"
                                  style={{ padding: '6px 10px', height: '36px' }}
                                  disabled={current.isAbsent}
                                  value={current.isAbsent ? '' : current.score}
                                  onChange={(e) => {
                                    setStudentScores({
                                      ...studentScores,
                                      [student.id]: { ...current, score: e.target.value },
                                    });
                                  }}
                                  placeholder="Score / 10"
                                />
                              </div>

                              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                                <input
                                  type="checkbox"
                                  checked={current.isAbsent}
                                  onChange={(e) => {
                                    setStudentScores({
                                      ...studentScores,
                                      [student.id]: { ...current, isAbsent: e.target.checked },
                                    });
                                  }}
                                />
                                <span style={{ color: current.isAbsent ? 'var(--color-danger)' : 'var(--color-text-muted)' }}>
                                  Absent
                                </span>
                              </label>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleSubmitScores(1)}
                        className="btn btn-primary"
                        disabled={scoringLoading}
                      >
                        {scoringLoading ? 'Recording...' : 'Submit Evaluation Scores'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* SCHEDULE MODAL */}
      {scheduleModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)',
            padding: '20px',
          }}
          onClick={() => setScheduleModalOpen(false)}
        >
          <div className="card" style={{ width: '100%', maxWidth: '440px', backgroundColor: '#FFFFFF' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Schedule Meeting</h3>
            <form onSubmit={handleScheduleSubmit}>
              <div className="input-group">
                <label className="input-label">Date</label>
                <input
                  type="date"
                  className="input-field"
                  value={schedDate}
                  onChange={(e) => setSchedDate(e.target.value)}
                  required
                />
              </div>
              <div className="input-group">
                <label className="input-label">Time Slot</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. 11:30 AM - 12:15 PM"
                  value={schedTime}
                  onChange={(e) => setSchedTime(e.target.value)}
                  required
                />
              </div>
              <div className="input-group">
                <label className="input-label">Venue (Room/Cabin OR Meet Link)</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Room 304 or https://meet.google.com/..."
                  value={schedVenue}
                  onChange={(e) => setSchedVenue(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setScheduleModalOpen(false)} style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1.5 }}>
                  Confirm Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LOG MODAL */}
      {logModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)',
            padding: '20px',
          }}
          onClick={() => setLogModalOpen(false)}
        >
          <div className="card" style={{ width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', backgroundColor: '#FFFFFF' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>
              Log Meet {logMeetingIndex} Attendance & Notes
            </h3>
            <form onSubmit={handleLogSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label className="input-label">Attendance Roster:</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {attendanceList.map((att, idx) => (
                    <div
                      key={att.studentId}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 'var(--rounded-sm)',
                        backgroundColor: 'var(--color-canvas-soft)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>{att.name}</span>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={att.isPresent}
                          onChange={(e) => {
                            const updated = [...attendanceList];
                            updated[idx].isPresent = e.target.checked;
                            setAttendanceList(updated);
                          }}
                        />
                        <span>{att.isPresent ? 'Present' : 'Absent'}</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Discussion Summary & Progress Directives</label>
                <textarea
                  className="textarea-field"
                  rows={4}
                  value={meetingSummary}
                  onChange={(e) => setMeetingSummary(e.target.value)}
                  placeholder="Record guidance notes..."
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setLogModalOpen(false)} style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1.5 }}>
                  Save Record
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
