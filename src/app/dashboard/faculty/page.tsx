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
  ChevronDown,
  ChevronUp,
  UserCheck,
  RefreshCw,
  X,
  Plus,
  Check,
  CheckCircle2,
  AlertCircle,
  Target,
  GraduationCap,
  ArrowLeft,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import LoadingScreen from '@/components/LoadingScreen';

export default function FacultyDashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'supervisor' | 'panel'>('supervisor');
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');

  // Supervisor Mode State
  const [guidedTeams, setGuidedTeams] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [supTab, setSupTab] = useState<'roster' | 'problem' | 'meetings' | 'clearance'>('problem');
  const [problemReviewText, setProblemReviewText] = useState('');
  const [reviewActionLoading, setReviewActionLoading] = useState(false);
  const [expandedMeetingIds, setExpandedMeetingIds] = useState<Set<string>>(new Set());

  const toggleMeetingExpand = (meetingId: string) => {
    setExpandedMeetingIds((prev) => {
      const next = new Set(prev);
      if (next.has(meetingId)) {
        next.delete(meetingId);
      } else {
        next.add(meetingId);
      }
      return next;
    });
  };

  // Meeting Schedule Modal (Real Clock Time Pickers)
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [targetMeetingId, setTargetMeetingId] = useState('');
  const [schedDate, setSchedDate] = useState('');
  const [schedStartTime, setSchedStartTime] = useState('11:00');
  const [schedEndTime, setSchedEndTime] = useState('11:45');
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
  const [selectedPanelPhase, setSelectedPanelPhase] = useState<number>(1);
  const [panelTeamMembers, setPanelTeamMembers] = useState<any[]>([]);
  const [studentScores, setStudentScores] = useState<Record<string, { score: string; isAbsent: boolean; remarks: string }>>({});
  const [scoringLoading, setScoringLoading] = useState(false);
  const [scoreMessage, setScoreMessage] = useState('');

  // Auto-hide score status message after 4s
  useEffect(() => {
    if (scoreMessage) {
      const timer = setTimeout(() => {
        setScoreMessage('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [scoreMessage]);

  const loadFacultyData = async () => {
    try {
      const [authRes, teamsRes, panelRes] = await Promise.all([
        currentUser ? Promise.resolve(null) : fetch('/api/auth/me'),
        fetch('/api/team'),
        fetch('/api/panels'),
      ]);

      if (authRes) {
        if (!authRes.ok) {
          router.push('/login');
          return;
        }
        const authData = await authRes.json();
        if (!authData.authenticated || !authData.user) {
          router.push('/login');
          return;
        }
        if (authData.user.role !== 'supervisor' && authData.user.role !== 'admin') {
          router.push('/dashboard/leader');
          return;
        }
        setCurrentUser(authData.user);
      }

      if (teamsRes && teamsRes.ok) {
        const tData = await teamsRes.json();
        const teams = tData.teams || [];
        setGuidedTeams(teams);
        setSelectedTeam((prev: any) => {
          if (!prev && teams.length > 0) return teams[0];
          if (prev) {
            const fresh = teams.find((t: any) => t.id === prev.id);
            return fresh || teams[0] || null;
          }
          return null;
        });
      }

      if (panelRes && panelRes.ok) {
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

    const updatedPs = selectedTeam.problemStatement
      ? {
        ...selectedTeam.problemStatement,
        status: action === 'approve' ? 'approved' : 'revision_requested',
        locked: action === 'approve',
        supervisor_remarks: problemReviewText || (action === 'approve' ? 'Approved without modifications.' : 'Revisions required.'),
      }
      : null;

    // Optimistic update (0ms)
    setSelectedTeam((prev: any) => (prev ? { ...prev, problemStatement: updatedPs } : prev));
    setGuidedTeams((prev: any[]) =>
      prev.map((t) => (t.id === selectedTeam.id ? { ...t, problemStatement: updatedPs } : t))
    );

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
        setProblemReviewText('');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('codeshastra_notification_update'));
          try {
            const bc = new BroadcastChannel('codeshastra_notifications_channel');
            bc.postMessage({ type: 'UPDATE' });
            bc.close();
          } catch { }
        }
      } else {
        const data = await res.json();
        alert(`Error: ${data.error}`);
        loadFacultyData();
      }
    } catch (e: any) {
      alert(`Error: ${e.message}`);
      loadFacultyData();
    } finally {
      setReviewActionLoading(false);
    }
  };

  const format12Hour = (timeStr: string) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    let h = parseInt(hours, 10);
    const m = minutes || '00';
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12;
    return `${h}:${m} ${ampm}`;
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const timeSlotFormatted = schedEndTime
      ? `${format12Hour(schedStartTime)} - ${format12Hour(schedEndTime)}`
      : format12Hour(schedStartTime);

    // Close modal instantly (0ms)
    setScheduleModalOpen(false);

    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'schedule',
          meetingId: targetMeetingId || undefined,
          teamId: selectedTeam?.id,
          date: schedDate,
          timeSlot: timeSlotFormatted,
          venue: schedVenue,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const updatedMeeting = data.meeting;
        if (updatedMeeting && selectedTeam) {
          setSelectedTeam((prev: any) => {
            if (!prev) return prev;
            const existingIdx = (prev.meetings || []).findIndex((m: any) => m.id === updatedMeeting.id);
            let nextMeetings = [...(prev.meetings || [])];
            if (existingIdx !== -1) {
              nextMeetings[existingIdx] = { ...nextMeetings[existingIdx], ...updatedMeeting };
            } else {
              nextMeetings.push(updatedMeeting);
            }
            return {
              ...prev,
              meetings: nextMeetings,
              totalMeetings: nextMeetings.length,
              pendingMeetings: nextMeetings.filter((m: any) => m.status === 'requested').length,
            };
          });
          setGuidedTeams((prev: any[]) =>
            prev.map((t) => {
              if (t.id !== selectedTeam.id) return t;
              const existingIdx = (t.meetings || []).findIndex((m: any) => m.id === updatedMeeting.id);
              let nextMeetings = [...(t.meetings || [])];
              if (existingIdx !== -1) {
                nextMeetings[existingIdx] = { ...nextMeetings[existingIdx], ...updatedMeeting };
              } else {
                nextMeetings.push(updatedMeeting);
              }
              return {
                ...t,
                meetings: nextMeetings,
                totalMeetings: nextMeetings.length,
                pendingMeetings: nextMeetings.filter((m: any) => m.status === 'requested').length,
              };
            })
          );
        }
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('codeshastra_notification_update'));
          try {
            const bc = new BroadcastChannel('codeshastra_notifications_channel');
            bc.postMessage({ type: 'UPDATE' });
            bc.close();
          } catch { }
        }
      } else {
        const data = await res.json();
        alert(data.error);
        loadFacultyData();
      }
    } catch (e: any) {
      alert(e.message);
      loadFacultyData();
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
    setLogModalOpen(false);

    // 1. INSTANT OPTIMISTIC UPDATE (0ms) — reflect changes before API call
    const optimisticAttendance = attendanceList.map((a) => ({
      id: a.studentId,
      meeting_id: logMeetingId,
      student_id: a.studentId,
      is_present: a.isPresent,
      created_at: new Date().toISOString(),
    }));

    const applyOptimistic = (meeting: any) => {
      if (meeting.id !== logMeetingId) return meeting;
      return {
        ...meeting,
        status: 'completed',
        summary_notes: meetingSummary,
        action_directives: actionDirectives,
        attendance: optimisticAttendance,
        updated_at: new Date().toISOString(),
      };
    };

    if (selectedTeam) {
      setSelectedTeam((prev: any) => {
        if (!prev) return prev;
        return { ...prev, meetings: (prev.meetings || []).map(applyOptimistic) };
      });
      setGuidedTeams((prev: any[]) =>
        prev.map((t) =>
          t.id === selectedTeam.id
            ? { ...t, meetings: (t.meetings || []).map(applyOptimistic) }
            : t
        )
      );
    }

    // 2. Persist in background — reconcile or rollback
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
        const data = await res.json();
        const updatedMeeting = data.meeting;
        // Reconcile with server truth
        if (updatedMeeting && selectedTeam) {
          const fullMeeting = { ...updatedMeeting, attendance: optimisticAttendance };
          setSelectedTeam((prev: any) => {
            if (!prev) return prev;
            return { ...prev, meetings: (prev.meetings || []).map((m: any) => m.id === logMeetingId ? fullMeeting : m) };
          });
          setGuidedTeams((prev: any[]) =>
            prev.map((t) =>
              t.id === selectedTeam!.id
                ? { ...t, meetings: (t.meetings || []).map((m: any) => m.id === logMeetingId ? fullMeeting : m) }
                : t
            )
          );
        }
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('codeshastra_notification_update'));
          try {
            const bc = new BroadcastChannel('codeshastra_notifications_channel');
            bc.postMessage({ type: 'UPDATE' });
            bc.close();
          } catch { }
        }
      } else {
        const data = await res.json();
        alert(data.error);
        loadFacultyData(); // Rollback on server error
      }
    } catch (e: any) {
      alert(e.message);
      loadFacultyData(); // Rollback on network error
    }
  };

  const handleTogglePhaseClearance = async (phaseNum: 1 | 2 | 3, currentApproved: boolean) => {
    if (!selectedTeam) return;
    const newApproved = !currentApproved;
    const key = `phase${phaseNum}_approved` as 'phase1_approved' | 'phase2_approved' | 'phase3_approved';

    // 1. INSTANT OPTIMISTIC UPDATE (0ms)
    setSelectedTeam((prev: any) => (prev ? { ...prev, [key]: newApproved } : prev));
    setGuidedTeams((prev: any[]) =>
      prev.map((t) => (t.id === selectedTeam.id ? { ...t, [key]: newApproved } : t))
    );

    // 2. Persist in background
    try {
      const res = await fetch('/api/phases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'supervisor_approval',
          teamId: selectedTeam.id,
          phaseNumber: phaseNum,
          approved: newApproved,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error);
        // Rollback on failure
        setSelectedTeam((prev: any) => (prev ? { ...prev, [key]: currentApproved } : prev));
        setGuidedTeams((prev: any[]) =>
          prev.map((t) => (t.id === selectedTeam.id ? { ...t, [key]: currentApproved } : t))
        );
      }
    } catch (e: any) {
      alert(e.message);
      setSelectedTeam((prev: any) => (prev ? { ...prev, [key]: currentApproved } : prev));
      setGuidedTeams((prev: any[]) =>
        prev.map((t) => (t.id === selectedTeam.id ? { ...t, [key]: currentApproved } : t))
      );
    }
  };

  const handleOpenPanelTeamScoring = async (team: any, phaseNumber: number) => {
    setSelectedPanelTeam(team);
    setSelectedPanelPhase(phaseNumber);
    setScoreMessage('');

    try {
      const [teamRes, evRes] = await Promise.all([
        fetch(`/api/team?teamId=${team.id}`),
        fetch(`/api/evaluations?phaseNumber=${phaseNumber}&teamId=${team.id}`),
      ]);

      const data = teamRes.ok ? await teamRes.json() : {};
      const students = data.members || [];
      setPanelTeamMembers(students);

      const evData = evRes.ok ? await evRes.json() : {};
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
    return <LoadingScreen label="Loading faculty portal..." />;
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
          <div className="faculty-split-layout">
            {/* Left Column: Team Selector List */}
            <div className={`faculty-list-col ${mobileView === 'detail' && selectedTeam ? 'mobile-hidden' : ''}`} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Your Assigned Teams ({guidedTeams.length})
              </div>

              {guidedTeams.map((t) => {
                const isSelected = selectedTeam?.id === t.id;
                const hasLeader = Boolean(t.leader_id);

                return (
                  <div
                    key={t.id}
                    onClick={() => {
                      setSelectedTeam(t);
                      setMobileView('detail');
                    }}
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

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                        {t.members?.length || 0} Members • {t.totalMeetings || 0} Meets
                        {t.pendingMeetings > 0 && (
                          <span style={{ color: 'var(--color-warning)', fontWeight: 600, marginLeft: '6px' }}>
                            ({t.pendingMeetings} req)
                          </span>
                        )}
                      </div>
                      <ChevronRight size={14} className="mobile-chevron-indicator" style={{ color: 'var(--color-text-muted)' }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Column: Active Team Operations */}
            {selectedTeam ? (
              <div className={`faculty-detail-col ${mobileView === 'list' ? 'mobile-hidden' : ''}`} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Mobile Back Button */}
                <div className="mobile-detail-nav-bar" style={{ display: 'none' }}>
                  <button
                    type="button"
                    onClick={() => setMobileView('list')}
                    className="btn btn-outline"
                    style={{ fontSize: '12.5px', padding: '6px 14px', gap: '6px', fontWeight: 600 }}
                  >
                    <ArrowLeft size={14} /> Back to Assigned Teams ({guidedTeams.length})
                  </button>
                </div>

                {/* Header Card */}
                <div className="card-soft" style={{ padding: '18px 20px', width: '100%', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h2 style={{ fontSize: '19px', fontWeight: 700 }}>{selectedTeam.team_name}</h2>
                        <span className="badge badge-neutral">{selectedTeam.program}</span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
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
                    <div className="segmented-control" style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch', display: 'flex' }}>
                      <button
                        className={`segmented-pill ${supTab === 'roster' ? 'active' : ''}`}
                        onClick={() => setSupTab('roster')}
                        style={{ flexShrink: 0 }}
                      >
                        <Users size={13} /> Team Roster ({selectedTeam.members?.length || 0})
                      </button>
                      <button
                        className={`segmented-pill ${supTab === 'problem' ? 'active' : ''}`}
                        onClick={() => setSupTab('problem')}
                        style={{ flexShrink: 0 }}
                      >
                        Problem Statement
                      </button>
                      <button
                        className={`segmented-pill ${supTab === 'meetings' ? 'active' : ''}`}
                        onClick={() => setSupTab('meetings')}
                        style={{ flexShrink: 0 }}
                      >
                        Meetings ({selectedTeam.meetings?.length || 0})
                      </button>
                      <button
                        className={`segmented-pill ${supTab === 'clearance' ? 'active' : ''}`}
                        onClick={() => setSupTab('clearance')}
                        style={{ flexShrink: 0 }}
                      >
                        Gatekeeper Permissions
                      </button>
                    </div>

                    {/* Selected Team Members Badges - visible only on non-roster tabs to avoid redundancy */}
                    {supTab !== 'roster' && selectedTeam.members && selectedTeam.members.length > 0 && (
                      <div style={{ paddingTop: '10px', borderTop: '1px solid rgba(226, 232, 240, 0.8)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Team Members ({selectedTeam.members.length}):
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            {[...selectedTeam.members]
                              .sort((a: any, b: any) => {
                                const aIsLeader = Boolean(selectedTeam.leader_id && (a.id === selectedTeam.leader_id || a.user_id === selectedTeam.leader_id || (selectedTeam.leader && a.full_name === selectedTeam.leader.fullName)));
                                const bIsLeader = Boolean(selectedTeam.leader_id && (b.id === selectedTeam.leader_id || b.user_id === selectedTeam.leader_id || (selectedTeam.leader && b.full_name === selectedTeam.leader.fullName)));
                                if (aIsLeader && !bIsLeader) return -1;
                                if (!aIsLeader && bIsLeader) return 1;
                                return (a.roll_no || '').localeCompare(b.roll_no || '');
                              })
                              .map((m: any) => {
                                const isLeader = Boolean(selectedTeam.leader_id && (m.id === selectedTeam.leader_id || m.user_id === selectedTeam.leader_id || (selectedTeam.leader && m.full_name === selectedTeam.leader.fullName)));
                                const roll = m.roll_no || m.university_roll_no;
                                return (
                                  <div
                                    key={m.id}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '5px',
                                      padding: '3px 9px',
                                      fontSize: '11.5px',
                                      borderRadius: '7px',
                                      backgroundColor: isLeader ? '#EFF6FF' : '#FFFFFF',
                                      border: isLeader ? '1px solid #BFDBFE' : '1px solid #E2E8F0',
                                      color: isLeader ? '#1D4ED8' : '#334155',
                                      boxShadow: '0 1px 2px rgba(15, 23, 42, 0.03)',
                                    }}
                                  >
                                    {isLeader ? (
                                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: 700, color: '#2563EB', fontSize: '10.5px' }}>
                                        <UserCheck size={12} strokeWidth={2.5} />
                                        Leader:
                                      </span>
                                    ) : (
                                      <span
                                        style={{
                                          width: '16px',
                                          height: '16px',
                                          borderRadius: '4px',
                                          backgroundColor: '#F1F5F9',
                                          color: '#64748B',
                                          fontSize: '9px',
                                          fontWeight: 700,
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                        }}
                                      >
                                        {m.full_name ? m.full_name.trim().charAt(0).toUpperCase() : 'S'}
                                      </span>
                                    )}
                                    <strong style={{ fontWeight: 600 }}>{m.full_name}</strong>
                                    {roll && (
                                      <span style={{ fontSize: '10px', color: '#64748B', fontFamily: 'var(--font-mono)' }}>
                                        ({roll})
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* SUB-TAB 0: TEAM ROSTER VIEW */}
                {supTab === 'roster' && (
                  <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '2px' }}>
                          Registered Team Members ({selectedTeam.members?.length || 0})
                        </h3>
                        <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                          Official academic student profiles allocated to {selectedTeam.team_name}.
                        </p>
                      </div>
                      <span className="badge badge-neutral" style={{ fontSize: '11px' }}>
                        {selectedTeam.program || 'BCA'} • {selectedTeam.academic_year || '2026-27'}
                      </span>
                    </div>

                    <div className="data-table-container">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Student Name</th>
                            <th>University Roll No</th>
                            <th>Official Email</th>
                            <th>Mobile Phone</th>
                            <th>Section</th>
                            <th>CPI</th>
                            <th>Designation</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedTeam.members && selectedTeam.members.length > 0 ? (
                            [...selectedTeam.members]
                              .sort((a: any, b: any) => {
                                const aIsLeader = Boolean(selectedTeam.leader_id && (a.id === selectedTeam.leader_id || a.user_id === selectedTeam.leader_id || (selectedTeam.leader && a.full_name === selectedTeam.leader.fullName)));
                                const bIsLeader = Boolean(selectedTeam.leader_id && (b.id === selectedTeam.leader_id || b.user_id === selectedTeam.leader_id || (selectedTeam.leader && b.full_name === selectedTeam.leader.fullName)));
                                if (aIsLeader && !bIsLeader) return -1;
                                if (!aIsLeader && bIsLeader) return 1;
                                return (a.roll_no || '').localeCompare(b.roll_no || '');
                              })
                              .map((m: any) => {
                                const isLeader = Boolean(selectedTeam.leader_id && (m.id === selectedTeam.leader_id || m.user_id === selectedTeam.leader_id || (selectedTeam.leader && m.full_name === selectedTeam.leader.fullName)));
                                const roll = m.roll_no || m.university_roll_no;
                                const email = m.email || m.gla_email;
                                const phone = m.mobile || m.phone;
                                return (
                                  <tr key={m.id}>
                                    <td style={{ whiteSpace: 'nowrap' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div
                                          style={{
                                            width: '30px',
                                            height: '30px',
                                            borderRadius: '8px',
                                            backgroundColor: isLeader ? '#EFF6FF' : '#F1F5F9',
                                            color: isLeader ? '#1D4ED8' : '#475569',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '11px',
                                            fontWeight: 700,
                                            border: isLeader ? '1px solid #BFDBFE' : '1px solid #E2E8F0',
                                            flexShrink: 0,
                                          }}
                                        >
                                          {m.full_name ? m.full_name.trim().slice(0, 2).toUpperCase() : 'ST'}
                                        </div>
                                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-ink)' }}>
                                          {m.full_name}
                                        </span>
                                      </div>
                                    </td>
                                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '12.5px', whiteSpace: 'nowrap', color: '#1E293B' }}>
                                      {roll || '—'}
                                    </td>
                                    <td style={{ whiteSpace: 'nowrap' }}>
                                      {email ? (
                                        <a
                                          href={`mailto:${email}`}
                                          style={{
                                            color: '#2563EB',
                                            textDecoration: 'none',
                                            fontSize: '12.5px',
                                            fontWeight: 500,
                                          }}
                                          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                                          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                                        >
                                          {email}
                                        </a>
                                      ) : (
                                        <span style={{ color: 'var(--color-text-muted)' }}>—</span>
                                      )}
                                    </td>
                                    <td style={{ fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', fontSize: '12.5px' }}>
                                      {phone ? (
                                        <a
                                          href={`tel:${phone}`}
                                          style={{
                                            color: '#475569',
                                            textDecoration: 'none',
                                          }}
                                          onMouseEnter={(e) => (e.currentTarget.style.color = '#0F172A')}
                                          onMouseLeave={(e) => (e.currentTarget.style.color = '#475569')}
                                        >
                                          {phone}
                                        </a>
                                      ) : (
                                        <span style={{ color: 'var(--color-text-muted)' }}>—</span>
                                      )}
                                    </td>
                                    <td style={{ whiteSpace: 'nowrap' }}>
                                      <span className="badge badge-neutral" style={{ fontSize: '11px', fontWeight: 600 }}>
                                        {m.section || selectedTeam.section || 'Sec A'}
                                      </span>
                                    </td>
                                    <td style={{ whiteSpace: 'nowrap' }}>
                                      <span style={{ fontWeight: 700, color: 'var(--color-ink)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                                        {m.cpi ? Number(m.cpi).toFixed(2) : '—'}
                                      </span>
                                    </td>
                                    <td style={{ whiteSpace: 'nowrap' }}>
                                      {isLeader ? (
                                        <span
                                          style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            padding: '3px 8px',
                                            borderRadius: '6px',
                                            backgroundColor: '#EFF6FF',
                                            color: '#1D4ED8',
                                            border: '1px solid #BFDBFE',
                                          }}
                                        >
                                          <UserCheck size={11} strokeWidth={2.5} /> Team Leader
                                        </span>
                                      ) : (
                                        <span
                                          style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            fontSize: '11px',
                                            fontWeight: 500,
                                            padding: '3px 8px',
                                            borderRadius: '6px',
                                            backgroundColor: '#F8FAFC',
                                            color: '#64748B',
                                            border: '1px solid #E2E8F0',
                                          }}
                                        >
                                          Member
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })
                          ) : (
                            <tr>
                              <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-muted)' }}>
                                No student members registered in this team.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* SUB-TAB 1: PROBLEM STATEMENT */}
                {supTab === 'problem' && (
                  <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Problem Statement Review</h3>
                      <div>
                        {selectedTeam.problemStatement?.status === 'approved' && (
                          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={12} /> Finalized & Locked
                          </span>
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
                          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-ink)', marginBottom: '8px' }}>
                            {selectedTeam.problemStatement.title}
                          </div>
                          {selectedTeam.problemStatement.description ? (
                            <div
                              className="rich-text-content"
                              style={{ fontSize: '13.5px', color: 'var(--color-ink-soft)', lineHeight: '1.6' }}
                              dangerouslySetInnerHTML={{ __html: selectedTeam.problemStatement.description }}
                            />
                          ) : (
                            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                              No detailed description provided.
                            </p>
                          )}
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                      <div>
                        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '2px' }}>
                          Review Sessions & Attendance Logs
                        </h3>
                        <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                          Coordinate milestone meetings, log attendance, and record action directives.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setTargetMeetingId('');
                          setSchedDate('');
                          setSchedStartTime('11:00');
                          setSchedEndTime('11:45');
                          setSchedVenue('');
                          setScheduleModalOpen(true);
                        }}
                        className="btn btn-primary"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '13px',
                          padding: '8px 16px',
                          borderRadius: 'var(--rounded-full)',
                          boxShadow: '0 2px 8px rgba(37, 99, 235, 0.2)',
                        }}
                      >
                        <Plus size={14} /> Add Meeting Schedule
                      </button>
                    </div>

                    {/* Empty State when no meetings exist */}
                    {(!selectedTeam.meetings || selectedTeam.meetings.length === 0) && (
                      <div
                        style={{
                          padding: '36px 20px',
                          textAlign: 'center',
                          backgroundColor: 'var(--color-canvas-soft)',
                          borderRadius: 'var(--rounded-md)',
                          border: '1px dashed var(--color-hairline)',
                          margin: '12px 0 24px',
                        }}
                      >
                        <Calendar size={36} style={{ color: 'var(--color-text-muted)', margin: '0 auto 12px' }} />
                        <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-ink)', marginBottom: '4px' }}>
                          No Scheduled Review Sessions Yet
                        </h4>
                        <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', maxWidth: '420px', margin: '0 auto 16px' }}>
                          Set a confirmed date, time, and venue or Google Meet link for this team's next milestone review session.
                        </p>
                        <button
                          onClick={() => {
                            setTargetMeetingId('');
                            setSchedDate('');
                            setSchedStartTime('11:00');
                            setSchedEndTime('11:45');
                            setSchedVenue('');
                            setScheduleModalOpen(true);
                          }}
                          className="btn btn-primary"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '13px',
                            padding: '8px 18px',
                            borderRadius: 'var(--rounded-full)',
                          }}
                        >
                          <Plus size={14} /> Schedule First Meeting
                        </button>
                      </div>
                    )}

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
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                                  <strong style={{ color: 'var(--color-ink)', fontSize: '13px' }}>
                                    Meet {m.meeting_index}
                                  </strong>
                                  {m.meeting_index === 1 ? (
                                    <span className="badge badge-success" style={{ fontSize: '10px', padding: '2px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                      <GraduationCap size={11} /> Student Requested
                                    </span>
                                  ) : (
                                    <span style={{ fontSize: '10px', padding: '2px 8px', backgroundColor: '#EEF2FF', color: '#4F46E5', border: '1px solid #C7D2FE', borderRadius: 'var(--rounded-full)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                      <UserCheck size={11} /> Faculty Scheduled
                                    </span>
                                  )}
                                </div>
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
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '10px' }}>
                        Archived Meeting History:
                      </div>
                      {selectedTeam.meetings?.filter((m: any) => m.status === 'completed').length === 0 ? (
                        <p style={{ fontSize: '12px', color: 'var(--color-text-faint)' }}>No completed meetings logged yet.</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {selectedTeam.meetings
                            ?.filter((m: any) => m.status === 'completed')
                            .map((m: any) => {
                              const isExpanded = expandedMeetingIds.has(m.id);
                              const presentStudents = selectedTeam.members?.filter((s: any) =>
                                m.attendance?.some((a: any) => a.student_id === s.id && a.is_present)
                              ) || [];
                              const absentStudents = selectedTeam.members?.filter((s: any) =>
                                m.attendance?.some((a: any) => a.student_id === s.id && !a.is_present)
                              ) || [];
                              const totalCount = selectedTeam.members?.length || (presentStudents.length + absentStudents.length);

                              return (
                                <div
                                  key={m.id}
                                  style={{
                                    backgroundColor: '#FFFFFF',
                                    borderTop: '1px solid var(--color-hairline)',
                                    borderRight: '1px solid var(--color-hairline)',
                                    borderBottom: '1px solid var(--color-hairline)',
                                    borderLeft: '4px solid #059669',
                                    borderRadius: '10px',
                                    overflow: 'hidden',
                                    boxShadow: isExpanded ? '0 4px 16px rgba(15, 23, 42, 0.05)' : '0 1px 3px rgba(15, 23, 42, 0.02)',
                                  }}
                                >
                                  {/* Header Summary Row */}
                                  <div
                                    onClick={() => toggleMeetingExpand(m.id)}
                                    style={{
                                      padding: '12px 18px',
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      flexWrap: 'wrap',
                                      gap: '12px',
                                      cursor: 'pointer',
                                      userSelect: 'none',
                                      backgroundColor: isExpanded ? '#F8FAFC' : '#FFFFFF',
                                      borderBottom: isExpanded ? '1px solid var(--color-hairline)' : 'none',
                                    }}
                                  >
                                    {/* Left Badges & Meeting Index */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                      <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-ink)', letterSpacing: '-0.02em', minWidth: '54px' }}>
                                        Meet {m.meeting_index}
                                      </span>

                                      <span
                                        style={{
                                          fontSize: '11px',
                                          padding: '3px 9px',
                                          borderRadius: '6px',
                                          fontWeight: 600,
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '4px',
                                          backgroundColor: '#ECFDF5',
                                          color: '#065F46',
                                          border: '1px solid #A7F3D0',
                                        }}
                                      >
                                        <CheckCircle2 size={12} /> Completed
                                      </span>

                                      <span
                                        style={{
                                          fontSize: '11px',
                                          padding: '3px 9px',
                                          borderRadius: '6px',
                                          fontWeight: 500,
                                          backgroundColor: '#F1F5F9',
                                          color: '#475569',
                                          border: '1px solid #E2E8F0',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '4px',
                                        }}
                                      >
                                        {m.meeting_index === 1 ? (
                                          <>
                                            <GraduationCap size={11} /> Student Initiated
                                          </>
                                        ) : (
                                          <>
                                            <UserCheck size={11} /> Supervisor Scheduled
                                          </>
                                        )}
                                      </span>

                                      <span
                                        style={{
                                          fontSize: '11px',
                                          padding: '3px 9px',
                                          borderRadius: '6px',
                                          fontWeight: 600,
                                          backgroundColor: absentStudents.length === 0 ? '#ECFDF5' : '#FFFBEB',
                                          color: absentStudents.length === 0 ? '#047857' : '#B45309',
                                          border: '1px solid',
                                          borderColor: absentStudents.length === 0 ? '#A7F3D0' : '#FDE68A',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '4px',
                                        }}
                                      >
                                        <Users size={11} /> {presentStudents.length}/{totalCount || 'All'} Present
                                      </span>
                                    </div>

                                    {/* Right Metadata & Action Button */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                                      {m.scheduled_date && (
                                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                            <Calendar size={12} /> {m.scheduled_date}
                                          </span>
                                          {m.time_slot && (
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                              <Clock size={12} /> {m.time_slot}
                                            </span>
                                          )}
                                          {m.venue && (
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                              <MapPin size={12} /> {m.venue}
                                            </span>
                                          )}
                                        </div>
                                      )}

                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleMeetingExpand(m.id);
                                        }}
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '5px',
                                          padding: '5px 12px',
                                          fontSize: '11px',
                                          fontWeight: 600,
                                          color: isExpanded ? '#1D4ED8' : 'var(--color-ink-soft)',
                                          backgroundColor: isExpanded ? '#EFF6FF' : '#FFFFFF',
                                          border: '1px solid',
                                          borderColor: isExpanded ? '#BFDBFE' : 'var(--color-hairline)',
                                          borderRadius: '6px',
                                          cursor: 'pointer',
                                        }}
                                      >
                                        <span>{isExpanded ? 'Hide Details' : 'View Details'}</span>
                                        {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                      </button>
                                    </div>
                                  </div>

                                  {/* Collapsible Details: Balanced 2-Column Layout */}
                                  {isExpanded && (
                                    <div
                                      style={{
                                        padding: '18px 20px',
                                        backgroundColor: '#F8FAFC',
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                                        gap: '16px',
                                        alignItems: 'stretch',
                                      }}
                                    >
                                      {/* Left Column: Meeting Notes & Actions */}
                                      <div
                                        style={{
                                          backgroundColor: '#FFFFFF',
                                          border: '1px solid var(--color-hairline)',
                                          borderRadius: '8px',
                                          padding: '16px',
                                          display: 'flex',
                                          flexDirection: 'column',
                                          justifyContent: 'space-between',
                                          gap: '12px',
                                        }}
                                      >
                                        <div>
                                          <div style={{ fontSize: '11px', fontWeight: 800, color: '#1D4ED8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <FileText size={13} color="#2563EB" /> Discussion Summary & Feedback
                                          </div>
                                          {m.summary_notes ? (
                                            <div
                                              style={{
                                                backgroundColor: '#F8FAFC',
                                                padding: '12px 14px',
                                                borderRadius: '6px',
                                                borderLeft: '3px solid #2563EB',
                                                color: 'var(--color-ink)',
                                                fontSize: '13px',
                                                lineHeight: '1.6',
                                                whiteSpace: 'pre-wrap',
                                              }}
                                            >
                                              {m.summary_notes}
                                            </div>
                                          ) : (
                                            <p style={{ fontSize: '12px', color: 'var(--color-text-faint)', fontStyle: 'italic', margin: 0 }}>
                                              No discussion notes recorded for this session.
                                            </p>
                                          )}
                                        </div>

                                        {m.action_directives && (
                                          <div
                                            style={{
                                              backgroundColor: '#FFFBEB',
                                              padding: '12px 14px',
                                              borderRadius: '6px',
                                              borderTop: '1px solid #FDE68A',
                                              borderRight: '1px solid #FDE68A',
                                              borderBottom: '1px solid #FDE68A',
                                              borderLeft: '3px solid #D97706',
                                            }}
                                          >
                                            <div style={{ fontSize: '10px', fontWeight: 800, color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                              <Target size={12} color="#D97706" /> Action Directives & Next Tasks
                                            </div>
                                            <p style={{ color: '#78350F', fontSize: '12px', margin: 0, whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                                              {m.action_directives}
                                            </p>
                                          </div>
                                        )}
                                      </div>

                                      {/* Right Column: Attendance Registry */}
                                      <div
                                        style={{
                                          backgroundColor: '#FFFFFF',
                                          border: '1px solid var(--color-hairline)',
                                          borderRadius: '8px',
                                          padding: '16px',
                                          display: 'flex',
                                          flexDirection: 'column',
                                          gap: '10px',
                                        }}
                                      >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', borderBottom: '1px solid var(--color-hairline)', paddingBottom: '8px' }}>
                                          <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--color-ink-soft)', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                            <Users size={12} color="#475569" /> Attendance Registry
                                          </span>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', backgroundColor: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0', whiteSpace: 'nowrap' }}>
                                              {presentStudents.length} Present
                                            </span>
                                            {absentStudents.length > 0 && (
                                              <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', backgroundColor: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA', whiteSpace: 'nowrap' }}>
                                                {absentStudents.length} Absent
                                              </span>
                                            )}
                                          </div>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '240px', overflowY: 'auto' }}>
                                          {presentStudents.map((s: any) => (
                                            <div
                                              key={s.id}
                                              style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '7px 10px',
                                                borderRadius: '6px',
                                                backgroundColor: '#F8FAFC',
                                                border: '1px solid var(--color-hairline)',
                                              }}
                                            >
                                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span
                                                  style={{
                                                    width: '18px',
                                                    height: '18px',
                                                    borderRadius: '50%',
                                                    backgroundColor: '#D1FAE5',
                                                    color: '#047857',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '11px',
                                                    fontWeight: 800,
                                                  }}
                                                >
                                                  <Check size={11} strokeWidth={2.6} />
                                                </span>
                                                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-ink)' }}>
                                                  {s.full_name}
                                                </span>
                                              </div>
                                              <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--color-text-muted)', backgroundColor: '#FFFFFF', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--color-hairline)' }}>
                                                {s.roll_no}
                                              </span>
                                            </div>
                                          ))}

                                          {absentStudents.map((s: any) => (
                                            <div
                                              key={s.id}
                                              style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '7px 10px',
                                                borderRadius: '6px',
                                                backgroundColor: '#FEF2F2',
                                                border: '1px solid #FECACA',
                                              }}
                                            >
                                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span
                                                  style={{
                                                    width: '18px',
                                                    height: '18px',
                                                    borderRadius: '50%',
                                                    backgroundColor: '#FEE2E2',
                                                    color: '#DC2626',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '11px',
                                                    fontWeight: 800,
                                                  }}
                                                >
                                                  <X size={11} strokeWidth={2.6} />
                                                </span>
                                                <span style={{ fontSize: '12px', fontWeight: 600, color: '#991B1B' }}>
                                                  {s.full_name}
                                                </span>
                                              </div>
                                              <span style={{ fontSize: '10px', fontWeight: 700, color: '#B91C1C', backgroundColor: '#FFFFFF', padding: '2px 6px', borderRadius: '4px', border: '1px solid #FECACA' }}>
                                                Absent
                                              </span>
                                            </div>
                                          ))}

                                          {presentStudents.length === 0 && absentStudents.length === 0 && (
                                            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', textAlign: 'center', padding: '12px', margin: 0 }}>
                                              All registered team members recorded present.
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                        </div>
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
                          style={{ width: '100%', fontSize: '12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                        >
                          {selectedTeam.phase1_approved ? (
                            <>
                              <CheckCircle2 size={13} /> Approved (Revoke)
                            </>
                          ) : (
                            'Grant Permission'
                          )}
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
                          style={{ width: '100%', fontSize: '12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                        >
                          {selectedTeam.phase2_approved ? (
                            <>
                              <CheckCircle2 size={13} /> Approved (Revoke)
                            </>
                          ) : (
                            'Grant Permission'
                          )}
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
                          style={{ width: '100%', fontSize: '12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                        >
                          {selectedTeam.phase3_approved ? (
                            <>
                              <CheckCircle2 size={13} /> Approved (Revoke)
                            </>
                          ) : (
                            'Grant Permission'
                          )}
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
              <div className={selectedPanelTeam ? 'panel-split-layout' : ''}>
                {/* Panel Listings */}
                <div className={`panel-list-col ${selectedPanelTeam ? 'mobile-hidden' : ''}`} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                              onClick={() => {
                                handleOpenPanelTeamScoring(t, p.phase_number);
                                setMobileView('detail');
                              }}
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
                  <div className={`panel-detail-col ${!selectedPanelTeam ? 'mobile-hidden' : ''}`} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Mobile Back Button */}
                    <div className="mobile-detail-nav-bar" style={{ display: 'none' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedPanelTeam(null)}
                        className="btn btn-outline"
                        style={{ fontSize: '12.5px', padding: '6px 14px', gap: '6px', fontWeight: 600 }}
                      >
                        <ArrowLeft size={14} /> Back to Panel Teams
                      </button>
                    </div>

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
                        <div
                          className={`alert-banner ${scoreMessage.includes('Error') ? 'alert-danger' : 'alert-success'}`}
                          style={{
                            fontSize: '13px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '12px',
                            padding: '10px 14px',
                            borderRadius: '8px',
                            marginBottom: '16px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}>
                            {scoreMessage.includes('Error') ? (
                              <AlertCircle size={16} style={{ flexShrink: 0 }} />
                            ) : (
                              <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                            )}
                            <span>{scoreMessage}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setScoreMessage('')}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '2px',
                              color: 'inherit',
                              opacity: 0.7,
                              display: 'flex',
                              alignItems: 'center',
                            }}
                            title="Dismiss notification"
                            aria-label="Dismiss"
                          >
                            <X size={15} />
                          </button>
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
                          onClick={() => handleSubmitScores(selectedPanelPhase || 1)}
                          className="btn btn-primary"
                          disabled={scoringLoading}
                        >
                          {scoringLoading ? 'Recording...' : 'Submit Evaluation Scores'}
                        </button>
                      </div>
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
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>
              {targetMeetingId ? 'Schedule Requested Meeting' : `Schedule Meeting with ${selectedTeam?.team_name || 'Team'}`}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '18px' }}>
              {targetMeetingId
                ? 'Confirm date, time slot, and cabin/Google Meet link for this requested session.'
                : 'Set a formal review milestone session for student team members.'}
            </p>
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
              {/* Real Clock Time Pickers */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '6px' }}>
                <div className="input-group" style={{ marginBottom: '8px' }}>
                  <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} /> Start Time
                  </label>
                  <input
                    type="time"
                    className="input-field"
                    value={schedStartTime}
                    onChange={(e) => setSchedStartTime(e.target.value)}
                    required
                  />
                </div>
                <div className="input-group" style={{ marginBottom: '8px' }}>
                  <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} /> End Time
                  </label>
                  <input
                    type="time"
                    className="input-field"
                    value={schedEndTime}
                    onChange={(e) => setSchedEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Formatted Clock Time Preview */}
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--color-text-muted)',
                  marginTop: '0px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>Selected Time Slot:</span>
                <span className="badge badge-neutral" style={{ fontSize: '11px', padding: '2px 8px', fontWeight: 600 }}>
                  {format12Hour(schedStartTime)} – {format12Hour(schedEndTime)}
                </span>
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
