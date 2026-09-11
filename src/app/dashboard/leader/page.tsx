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
  ChevronDown,
  ChevronUp,
  X,
  Check,
  CheckCircle2,
  Target,
  GraduationCap,
  UserCheck,
  ArrowRight,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import LoadingScreen from '@/components/LoadingScreen';
import { clientCache } from '@/lib/clientCache';

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
  const titleTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Meeting request
  const [wantToMeetExpanded, setWantToMeetExpanded] = useState(false);
  const [requestingMeeting, setRequestingMeeting] = useState(false);
  const [cancellingMeetingId, setCancellingMeetingId] = useState<string | null>(null);
  const [meetingMessage, setMeetingMessage] = useState('');
  const [meetingConfirmation, setMeetingConfirmation] = useState<{
    show: boolean;
    title: string;
    message: string;
    mentorName: string;
    meetIndex: number;
    timestamp: string;
  } | null>(null);
  const [expandedMeetingIds, setExpandedMeetingIds] = useState<Set<string>>(new Set());

  // Auto-resize title textarea as text changes
  const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPsTitle(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.max(42, e.target.scrollHeight)}px`;
  };

  useEffect(() => {
    if (titleTextareaRef.current) {
      titleTextareaRef.current.style.height = 'auto';
      titleTextareaRef.current.style.height = `${Math.max(42, titleTextareaRef.current.scrollHeight)}px`;
    }
  }, [psTitle, activeTab]);

  // Auto-hide alert messages after 4 seconds for a clean, non-intrusive layout
  useEffect(() => {
    if (meetingMessage && !meetingMessage.includes('Withdrawing')) {
      const timer = setTimeout(() => {
        setMeetingMessage('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [meetingMessage]);

  useEffect(() => {
    if (psMessage) {
      const timer = setTimeout(() => {
        setPsMessage('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [psMessage]);

  const scrollToCenter = (elementId: string) => {
    setTimeout(() => {
      const el = document.getElementById(elementId);
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const navOffset = 70; // Top fixed navbar height
      const availableHeight = window.innerHeight - navOffset;
      if (rect.height >= availableHeight) {
        const targetScroll = window.scrollY + rect.top - navOffset - 16;
        window.scrollTo({ top: Math.max(0, targetScroll), behavior: 'smooth' });
      } else {
        const centerOffset = (availableHeight - rect.height) / 2;
        const targetScroll = window.scrollY + rect.top - navOffset - centerOffset;
        window.scrollTo({ top: Math.max(0, targetScroll), behavior: 'smooth' });
      }
    }, 60);
  };

  const toggleMeetingExpand = (meetingId: string) => {
    setExpandedMeetingIds((prev) => {
      const next = new Set(prev);
      const isOpening = !next.has(meetingId);
      if (next.has(meetingId)) {
        next.delete(meetingId);
      } else {
        next.add(meetingId);
      }
      if (isOpening) {
        scrollToCenter(`meeting-card-${meetingId}`);
      }
      return next;
    });
  };

  const toggleWantToMeet = () => {
    setWantToMeetExpanded((prev) => {
      const next = !prev;
      if (next) {
        scrollToCenter('want-to-meet-card');
      }
      return next;
    });
  };

  const handleCancelMeeting = async (meetingId: string) => {
    if (!meetingId) return;
    setCancellingMeetingId(meetingId);
    setMeetingMessage('Withdrawing meeting request...');

    const targetMeeting = (teamData?.meetings || []).find((m: any) => m.id === meetingId);
    const meetIdx = targetMeeting?.meeting_index || 1;

    // 1. Instant 0ms Notification Dispatch
    const cancelNotif = {
      id: 'temp-cancel-' + Date.now(),
      user_id: currentUser?.id,
      type: 'category_b',
      category: 'Category B: Meeting Logistics & Records',
      subject: `Meeting Request Withdrawn: Meet ${meetIdx} – ${teamData?.team?.team_name || 'Team'}`,
      salutation: `Dear ${currentUser?.fullName || 'Project Leader'},`,
      body: `Your pending meeting request for Meet ${meetIdx} with ${teamData?.supervisor?.full_name || 'your supervisor'} has been successfully cancelled and withdrawn.`,
      metadata: {
        meetingLabel: `Meet ${meetIdx}`,
        teamName: teamData?.team?.team_name,
        supervisorName: teamData?.supervisor?.full_name,
      },
      is_read: false,
      created_at: new Date().toISOString(),
    };

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('codeshastra_notification_instant', { detail: { notification: cancelNotif } }));
      try {
        const bc = new BroadcastChannel('codeshastra_notifications_channel');
        bc.postMessage({ type: 'INSTANT_NOTIFICATION', notification: cancelNotif });
        bc.close();
      } catch {}
    }

    // 2. Optimistic UI update (0ms)
    setTeamData((prev: any) => {
      if (!prev) return prev;
      const filtered = (prev.meetings || []).filter((m: any) => m.id !== meetingId);
      const reindexed = filtered.map((m: any, idx: number) => ({
        ...m,
        meeting_index: idx + 1,
      }));
      return {
        ...prev,
        meetings: reindexed,
      };
    });

    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', meetingId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMeetingMessage(`Error: ${data.error}`);
        loadDashboard();
      } else {
        setMeetingMessage('Meeting request was successfully withdrawn.');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('codeshastra_notification_update'));
          try {
            const bc = new BroadcastChannel('codeshastra_notifications_channel');
            bc.postMessage({ type: 'UPDATE' });
            bc.close();
          } catch {}
        }
      }
    } catch (e: any) {
      setMeetingMessage(`Error: ${e.message}`);
      loadDashboard();
    } finally {
      setCancellingMeetingId(null);
    }
  };

  const loadDashboard = async () => {
    try {
      const [authRes, teamRes] = await Promise.all([
        currentUser ? Promise.resolve(null) : fetch('/api/auth/me', { cache: 'no-store' }),
        fetch('/api/team', { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } }),
      ]);

      let loggedInUser = currentUser;

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
        if (authData.user.role !== 'leader') {
          router.push(authData.user.role === 'supervisor' ? '/dashboard/faculty' : '/admin');
          return;
        }
        loggedInUser = authData.user;
        setCurrentUser(authData.user);
        clientCache.set(clientCache.keys.USER_ME, authData.user);
      }

      if (teamRes && teamRes.ok) {
        const tData = await teamRes.json();
        setTeamData(tData);

        if (loggedInUser?.id) {
          clientCache.set(clientCache.keys.LEADER_TEAM(loggedInUser.id), tData);
        }

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
    // 1. Instant 0ms cache hydration
    const cachedUser = clientCache.get<any>(clientCache.keys.USER_ME);
    if (cachedUser && cachedUser.role === 'leader') {
      setCurrentUser(cachedUser);
      const cachedTeam = clientCache.get<any>(clientCache.keys.LEADER_TEAM(cachedUser.id));
      if (cachedTeam) {
        setTeamData(cachedTeam);
        if (cachedTeam.problemStatement) {
          setPsTitle(cachedTeam.problemStatement.title || '');
          const desc = cachedTeam.problemStatement.description || '';
          setPsDescription(desc);
        }
        setLoading(false);
      }
    }

    // 2. Fetch fresh on load/reload
    loadDashboard();

    if (typeof window === 'undefined') return;

    // Real-time broadcast and event sync with Faculty / Admin actions
    const handleUpdate = () => {
      loadDashboard();
    };

    window.addEventListener('codeshastra_notification_update', handleUpdate);

    let bc: BroadcastChannel | null = null;
    if ('BroadcastChannel' in window) {
      try {
        bc = new BroadcastChannel('codeshastra_notifications_channel');
        bc.onmessage = (event) => {
          if (event.data?.type === 'UPDATE' || event.data?.type === 'INSTANT_NOTIFICATION') {
            loadDashboard();
          }
        };
      } catch {}
    }

    return () => {
      window.removeEventListener('codeshastra_notification_update', handleUpdate);
      if (bc) bc.close();
    };
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

    // Optimistic UI update (0ms)
    setTeamData((prev: any) => ({
      ...prev,
      problemStatement: {
        ...(prev?.problemStatement || {}),
        title: psTitle,
        description: finalDescription,
        status: 'pending',
      },
    }));
    setPsMessage('Problem statement submitted successfully for supervisor review.');

    try {
      const res = await fetch('/api/problem-statement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: psTitle, description: finalDescription }),
      });
      const data = await res.json();

      if (!res.ok) {
        setPsMessage(`Error: ${data.error}`);
        loadDashboard();
      }
    } catch (e: any) {
      setPsMessage(`Error: ${e.message}`);
      loadDashboard();
    } finally {
      setSubmittingPs(false);
    }
  };

  const handleWantToMeet = async () => {
    setRequestingMeeting(true);
    const supervisorName = teamData?.supervisor?.full_name || 'Supervisor';
    const nextMeetIdx = (teamData?.meetings?.length || 0) + 1;

    // Set dedicated in-software confirmation state
    setMeetingConfirmation({
      show: true,
      title: `Meeting Request Dispatched (Meet ${nextMeetIdx})`,
      message: `Your milestone review request has been recorded and transmitted to Prof. ${supervisorName}. An official notification is now active in their mentor console in real time.`,
      mentorName: supervisorName,
      meetIndex: nextMeetIdx,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
    setMeetingMessage(`Milestone review request for Meet ${nextMeetIdx} submitted to Prof. ${supervisorName}.`);

    // 1. Instant 0ms Notification Dispatch
    const optimisticNotif = {
      id: 'temp-notif-' + Date.now(),
      user_id: currentUser?.id,
      type: 'category_b',
      category: 'Category B: Meeting Logistics & Records',
      subject: `Meeting Request Submitted: Meet ${nextMeetIdx} – ${teamData?.team?.team_name || 'Team'}`,
      salutation: `Dear ${currentUser?.fullName || 'Project Leader'},`,
      body: `Your milestone / progress review meeting request for Meet ${nextMeetIdx} has been officially recorded and submitted to your supervisor ${teamData?.supervisor?.full_name || 'Supervisor'}.`,
      metadata: {
        meetingLabel: `Meet ${nextMeetIdx}`,
        teamName: teamData?.team?.team_name,
        supervisorName: teamData?.supervisor?.full_name,
      },
      is_read: false,
      created_at: new Date().toISOString(),
    };

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('codeshastra_notification_instant', { detail: { notification: optimisticNotif } }));
      try {
        const bc = new BroadcastChannel('codeshastra_notifications_channel');
        bc.postMessage({ type: 'INSTANT_NOTIFICATION', notification: optimisticNotif });
        bc.close();
      } catch {}
    }

    // 2. Optimistic UI update (0ms)
    setTeamData((prev: any) => {
      if (!prev) return prev;
      const currentMeetings = prev.meetings || [];
      const newMeet = {
        id: 'temp-' + Date.now(),
        meeting_index: nextMeetIdx,
        status: 'requested',
        requested_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
      return {
        ...prev,
        meetings: [...currentMeetings, newMeet],
      };
    });

    setWantToMeetExpanded(false);
    scrollToCenter('meeting-confirmation-bar');

    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request' }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMeetingMessage(`Error: ${data.error}`);
        setMeetingConfirmation(null);
        loadDashboard();
      } else if (data.meeting) {
        setTeamData((prev: any) => {
          if (!prev) return prev;
          const filtered = (prev.meetings || []).filter((m: any) => !m.id.startsWith('temp-'));
          return {
            ...prev,
            meetings: [...filtered, data.meeting],
          };
        });
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('codeshastra_notification_update'));
          try {
            const bc = new BroadcastChannel('codeshastra_notifications_channel');
            bc.postMessage({ type: 'UPDATE' });
            bc.close();
          } catch {}
        }
      }
    } catch (e: any) {
      setMeetingMessage(`Error: ${e.message}`);
      setMeetingConfirmation(null);
      loadDashboard();
    } finally {
      setRequestingMeeting(false);
    }
  };

  if (loading) {
    return <LoadingScreen label="Loading project workspace..." />;
  }

  const team = teamData?.team;
  const supervisor = teamData?.supervisor;
  const members = teamData?.members || [];
  const problemStatement = teamData?.problemStatement;
  const meetings = teamData?.meetings || [];
  const schedules = teamData?.schedules || [];
  const isLocked = problemStatement?.locked || problemStatement?.status === 'approved';

  return (
    <div className="page-fade-in" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-canvas)' }}>
      <Navbar user={currentUser} teamCode={team?.team_code} />

      <main className="container" style={{ flex: 1, paddingBottom: '60px' }}>
        {/* Team Banner */}
        <div className="card-soft" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span className="badge badge-neutral">{team?.program}</span>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Code: {team?.team_code}</span>
              </div>
              <h1 style={{ fontSize: 'clamp(20px, 4vw, 26px)', fontWeight: 700 }}>{team?.team_name}</h1>
              <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                Leader: <strong style={{ color: 'var(--color-ink)' }}>{currentUser?.fullName}</strong> ({currentUser?.email})
              </div>
            </div>

            {/* Guide Info */}
            <div style={{ backgroundColor: '#FFFFFF', padding: '12px 16px', borderRadius: 'var(--rounded-sm)', border: '1px solid var(--color-hairline)', width: '100%', maxWidth: '360px', boxSizing: 'border-box' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Assigned Supervisor
              </div>
              <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-ink)', marginTop: '2px' }}>
                {supervisor?.fullName || 'Not Allocated'}
              </div>
              {supervisor?.email && (
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <a href={`mailto:${supervisor.email}`} style={{ color: 'var(--color-accent)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Mail size={12} /> {supervisor.email}
                  </a>
                  {supervisor.phone && (
                    <a href={`tel:${supervisor.phone}`} style={{ color: 'var(--color-ink-soft)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Phone size={12} /> {supervisor.phone}
                    </a>
                  )}
                </div>
              )}
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
              style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
            >
              Problem Statement {isLocked && <Check size={12} color="#059669" strokeWidth={2.5} />}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--color-ink)' }}>
                  Problem Statement Proposal
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: '2px 0 0' }}>
                  Formal project definition. Immutable once approved by your assigned supervisor.
                </p>
              </div>

              <div style={{ flexShrink: 0 }}>
                {problemStatement?.status === 'approved' ? (
                  <span className="badge badge-success" style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', padding: '4px 10px', fontWeight: 600 }}>
                    <CheckCircle2 size={13} /> Approved & Locked
                  </span>
                ) : problemStatement?.status === 'revision_requested' ? (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    padding: '4px 10px',
                    borderRadius: '6px',
                    backgroundColor: '#FFFBEB',
                    color: '#B45309',
                    border: '1px solid #FDE68A',
                    whiteSpace: 'nowrap'
                  }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#D97706' }} />
                    Revision Requested
                  </div>
                ) : problemStatement?.status === 'pending' ? (
                  <span className="badge badge-warning" style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', padding: '4px 10px' }}>
                    <Clock size={13} /> Pending Supervisor Review
                  </span>
                ) : (
                  <span className="badge badge-neutral" style={{ whiteSpace: 'nowrap', fontSize: '12px', padding: '4px 10px' }}>Draft (Not Submitted)</span>
                )}
              </div>
            </div>

            {/* HIGH-PRIORITY REVISION REQUESTED CALLOUT */}
            {problemStatement?.status === 'revision_requested' && (
              <div
                style={{
                  marginBottom: '20px',
                  borderRadius: '8px',
                  border: '1px solid #FDE68A',
                  backgroundColor: '#FEFDFB',
                  overflow: 'hidden',
                }}
              >
                {/* Header bar */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 14px',
                    backgroundColor: '#FFFBEB',
                    borderBottom: '1px solid #FDE68A',
                    gap: '8px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '4px',
                        backgroundColor: '#FDE68A',
                        color: '#B45309',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <AlertCircle size={12} strokeWidth={2.5} />
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#92400E' }}>
                      Supervisor Revision Notes
                    </span>
                  </div>

                  {supervisor?.fullName && (
                    <span
                      style={{
                        fontSize: '11.5px',
                        fontWeight: 500,
                        color: '#78350F',
                        backgroundColor: '#FEF3C7',
                        border: '1px solid #FDE68A',
                        padding: '2px 8px',
                        borderRadius: '4px',
                      }}
                    >
                      {supervisor.fullName}
                    </span>
                  )}
                </div>

                {/* Directive body */}
                <div style={{ padding: '14px 16px' }}>
                  <div
                    style={{
                      borderLeft: '3px solid #D97706',
                      paddingLeft: '12px',
                      margin: '0 0 12px 0',
                    }}
                  >
                    <p
                      style={{
                        fontSize: '13px',
                        color: '#1E293B',
                        lineHeight: '1.6',
                        margin: 0,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}
                    >
                      {problemStatement.supervisor_remarks || 'Please refine the problem scope and methodology according to mentor discussion.'}
                    </p>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      color: '#B45309',
                      paddingTop: '8px',
                      borderTop: '1px solid #FEF3C7',
                    }}
                  >
                    <ArrowRight size={13} style={{ flexShrink: 0, color: '#D97706' }} />
                    <span>Update the title and scope fields below, then submit your revised proposal.</span>
                  </div>
                </div>
              </div>
            )}

            {/* PREVIOUS SUPERVISOR REMARKS (IF CURRENTLY PENDING REVIEW AFTER RE-SUBMISSION) */}
            {problemStatement?.status === 'pending' && problemStatement?.supervisor_remarks && (
              <div
                style={{
                  marginBottom: '18px',
                  padding: '12px 16px',
                  backgroundColor: 'var(--color-canvas-soft)',
                  border: '1px solid var(--color-hairline)',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  color: 'var(--color-text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <Clock size={15} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
                <div>
                  <strong>Previous Mentor Feedback:</strong> &ldquo;{problemStatement.supervisor_remarks}&rdquo; (Updated proposal is now awaiting supervisor re-review).
                </div>
              </div>
            )}

            {isLocked && (
              <div className="alert-banner alert-success" style={{ marginBottom: '16px' }}>
                <Lock size={16} style={{ flexShrink: 0 }} />
                <div>
                  <strong>Immutable Lock Enforced:</strong> This proposal has been formally reviewed and approved by {supervisor?.fullName || 'your supervisor'}. Fields are permanently locked.
                </div>
              </div>
            )}

            {psMessage && (
              <div
                className={`alert-banner ${psMessage.includes('Error') ? 'alert-danger' : 'alert-success'}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  marginBottom: '16px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 500 }}>
                  {psMessage.includes('Error') ? (
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  ) : (
                    <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                  )}
                  <span>{psMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPsMessage('')}
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
                  <X size={14} />
                </button>
              </div>
            )}

            <form onSubmit={handleProblemStatementSubmit}>
              <div className="input-group" style={{ marginBottom: '16px' }}>
                <label className="input-label" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-ink)' }}>
                  Project Title
                </label>
                {isLocked ? (
                  <div
                    style={{
                      padding: '10px 14px',
                      backgroundColor: 'var(--color-canvas-soft)',
                      borderRadius: 'var(--rounded-sm)',
                      border: '1px solid var(--color-hairline)',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: 'var(--color-ink)',
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                      lineHeight: '1.45',
                      minHeight: '42px',
                    }}
                  >
                    {psTitle || 'Untitled Project'}
                  </div>
                ) : (
                  <>
                    <textarea
                      ref={titleTextareaRef}
                      rows={1}
                      className="input-field"
                      value={psTitle}
                      onChange={handleTitleChange}
                      placeholder="Enter project title..."
                      required
                      disabled={submittingPs}
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        resize: 'none',
                        overflow: 'hidden',
                        lineHeight: '1.45',
                        minHeight: '42px',
                        padding: '10px 14px',
                        width: '100%',
                        boxSizing: 'border-box',
                        display: 'block',
                      }}
                    />
                    <span style={{ fontSize: '11px', color: 'var(--color-text-faint)', marginTop: '4px', display: 'block' }}>
                      Auto-expanding field • Automatically expands to accommodate multi-line project titles.
                    </span>
                  </>
                )}
              </div>

              {/* Dynamic Auto-Expanding Rich Bold Text Area */}
              <div className="input-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <label className="input-label" style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--color-ink)', whiteSpace: 'nowrap' }}>
                    Scope & Methodology
                  </label>
                  {!isLocked && (
                    <button
                      type="button"
                      onClick={handleBoldClick}
                      className="editor-format-btn"
                      title="Format selected text as Bold (Ctrl+B / ⌘+B)"
                      style={{ padding: '2px 7px', fontSize: '11px', flexShrink: 0 }}
                    >
                      <Bold size={11} strokeWidth={2.6} />
                      <span>Bold</span>
                      <span
                        style={{
                          fontSize: '8.5px',
                          fontWeight: 700,
                          padding: '0 3px',
                          borderRadius: '3px',
                          backgroundColor: '#F1F5F9',
                          color: '#64748B',
                          border: '1px solid #E2E8F0',
                        }}
                      >
                        ⌘B
                      </span>
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
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
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
                      color: 'var(--color-ink)',
                      fontSize: '14px',
                      lineHeight: '1.6',
                      outline: 'none',
                      boxSizing: 'border-box',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                      overflowY: 'visible',
                    }}
                    className="rich-bold-editor"
                    data-placeholder="Detail the technical approach, system design, and expected deliverables... (Select text and click Bold or press Ctrl+B)"
                  />
                )}
                <span style={{ fontSize: '11px', color: 'var(--color-text-faint)', marginTop: '6px', display: 'block' }}>
                  Auto-expanding field • Select text and click <strong>Bold</strong> or press <strong>Ctrl+B / ⌘+B</strong> to format key terms.
                </span>
              </div>

              {!isLocked && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submittingPs}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 20px',
                      fontWeight: 600,
                      backgroundColor: problemStatement?.status === 'revision_requested' ? '#D97706' : undefined,
                      borderColor: problemStatement?.status === 'revision_requested' ? '#D97706' : undefined,
                    }}
                  >
                    {submittingPs && <span className="spinner spinner-sm" style={{ borderTopColor: '#FFFFFF', borderColor: 'rgba(255,255,255,0.25)' }} />}
                    <Send size={14} />
                    <span>
                      {submittingPs
                        ? 'Submitting...'
                        : problemStatement?.status === 'revision_requested'
                          ? 'Submit Revised Proposal'
                          : problemStatement?.status === 'pending'
                            ? 'Update Proposal'
                            : 'Submit for Review'}
                    </span>
                  </button>
                </div>
              )}
            </form>
          </div>
        )}

        {/* TAB 3: MEETINGS */}
        {activeTab === 'meetings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Want to Meet Accordion Card */}
            <div
              id="want-to-meet-card"
              style={{
                backgroundColor: '#F8FAFC',
                border: '1.5px solid #E2E8F0',
                borderRadius: '12px',
                overflow: 'hidden',
                transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
              }}
            >
              <div
                onClick={toggleWantToMeet}
                style={{
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      backgroundColor: '#EFF6FF',
                      border: '1px solid #DBEAFE',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--color-primary)',
                      flexShrink: 0,
                    }}
                  >
                    <Send size={18} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--color-ink)' }}>
                      Request Supervisor Review
                    </h3>
                    <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--color-ink-soft)' }}>
                      Official request to mentor • Prof. {supervisor?.fullName || 'Supervisor'}
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid var(--color-hairline)',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--color-ink)',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                  }}
                >
                  <span>{wantToMeetExpanded ? 'Close' : 'Expand'}</span>
                  {wantToMeetExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
              </div>

              {/* Expanded Confirmation Area */}
              {wantToMeetExpanded && (
                <div
                  style={{
                    padding: '14px 16px',
                    borderTop: '1px solid var(--color-hairline)',
                    backgroundColor: '#FFFFFF',
                  }}
                >
                  <p style={{ fontSize: '12.5px', color: 'var(--color-ink-soft)', lineHeight: 1.45, margin: '0 0 12px 0' }}>
                    Request a milestone / progress review meeting with <strong>Prof. {supervisor?.fullName || 'Supervisor'}</strong>? An official notice will appear in their mentor console.
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setWantToMeetExpanded(false)}
                      className="btn btn-outline"
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        borderRadius: '7px',
                        cursor: 'pointer',
                        height: '32px',
                        minWidth: 'auto',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <X size={13} /> Cancel
                    </button>

                    <button
                      type="button"
                      onClick={handleWantToMeet}
                      className="btn btn-primary"
                      disabled={requestingMeeting}
                      style={{
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        borderRadius: '7px',
                        cursor: requestingMeeting ? 'not-allowed' : 'pointer',
                        height: '32px',
                        minWidth: 'auto',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {requestingMeeting && <span className="spinner spinner-sm" style={{ borderTopColor: '#FFFFFF', borderColor: 'rgba(255,255,255,0.25)', width: '12px', height: '12px' }} />}
                      <Send size={12} />
                      <span>{requestingMeeting ? 'Requesting...' : 'Request Meeting'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Dedicated In-Software Confirmation Bar */}
            {meetingConfirmation && meetingConfirmation.show && (
              <div
                id="meeting-confirmation-bar"
                style={{
                  padding: '16px 18px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
                  border: '1.5px solid #86EFAC',
                  boxShadow: '0 4px 16px -2px rgba(16, 185, 129, 0.14), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  animation: 'fadeIn 0.25s ease-out',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        backgroundColor: '#16A34A',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: '0 2px 6px rgba(22, 163, 74, 0.25)',
                      }}
                    >
                      <CheckCircle2 size={20} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#14532D' }}>
                          {meetingConfirmation.title}
                        </h4>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#15803D',
                            backgroundColor: '#BBF7D0',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                          }}
                        >
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#16A34A' }} />
                          Live Transmitted • {meetingConfirmation.timestamp}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '13px', color: '#166534', lineHeight: 1.5 }}>
                        {meetingConfirmation.message}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMeetingConfirmation(null)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#15803D',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0.75,
                      transition: 'opacity 0.15s ease',
                    }}
                    title="Dismiss confirmation bar"
                    aria-label="Dismiss confirmation bar"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            )}

            {meetingMessage && (
              <div
                className={`alert-banner ${meetingMessage.includes('Error') ? 'alert-danger' : meetingMessage.includes('Withdrawing') ? 'alert-warning' : 'alert-success'}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  marginBottom: '16px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 500 }}>
                  {meetingMessage.includes('Error') ? (
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  ) : meetingMessage.includes('Withdrawing') ? (
                    <RefreshCw size={15} className="spin" style={{ flexShrink: 0 }} />
                  ) : (
                    <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                  )}
                  <span>{meetingMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMeetingMessage('')}
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {meetings.map((m: any) => {
                    const isCompleted = m.status === 'completed';
                    const isExpanded = expandedMeetingIds.has(m.id);
                    const presentStudents = members?.filter((s: any) =>
                      m.attendance?.some((a: any) => a.student_id === s.id && a.is_present)
                    ) || [];
                    const absentStudents = members?.filter((s: any) =>
                      m.attendance?.some((a: any) => a.student_id === s.id && !a.is_present)
                    ) || [];
                    const totalCount = members?.length || (presentStudents.length + absentStudents.length);

                    return (
                      <div
                        key={m.id}
                        id={`meeting-card-${m.id}`}
                        style={{
                          backgroundColor: '#FFFFFF',
                          borderTop: '1px solid var(--color-hairline)',
                          borderRight: '1px solid var(--color-hairline)',
                          borderBottom: '1px solid var(--color-hairline)',
                          borderLeft: isCompleted ? '4px solid #059669' : m.status === 'scheduled' ? '4px solid #2563EB' : '4px solid #D97706',
                          borderRadius: '10px',
                          overflow: 'hidden',
                          boxShadow: isExpanded ? '0 4px 16px rgba(15, 23, 42, 0.05)' : '0 1px 3px rgba(15, 23, 42, 0.02)',
                        }}
                      >
                        {/* Header Summary Row */}
                        <div
                          onClick={() => {
                            if (isCompleted || m.summary_notes) {
                              toggleMeetingExpand(m.id);
                            }
                          }}
                          style={{
                            padding: '14px 18px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px',
                            cursor: (isCompleted || m.summary_notes) ? 'pointer' : 'default',
                            userSelect: 'none',
                            backgroundColor: isExpanded ? '#F8FAFC' : '#FFFFFF',
                            borderBottom: isExpanded ? '1px solid var(--color-hairline)' : 'none',
                          }}
                        >
                          {/* Row 1: Meet Index + Primary Status Badge + Action Button */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-ink)', letterSpacing: '-0.02em' }}>
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
                                  backgroundColor: isCompleted ? '#ECFDF5' : m.status === 'scheduled' ? '#EFF6FF' : '#FFFBEB',
                                  color: isCompleted ? '#065F46' : m.status === 'scheduled' ? '#1E40AF' : '#92400E',
                                  border: '1px solid',
                                  borderColor: isCompleted ? '#A7F3D0' : m.status === 'scheduled' ? '#BFDBFE' : '#FDE68A',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {isCompleted ? (
                                  <>
                                    <CheckCircle2 size={12} /> Completed
                                  </>
                                ) : m.status === 'scheduled' ? (
                                  <>
                                    <Calendar size={12} /> Scheduled
                                  </>
                                ) : (
                                  <>
                                    <Clock size={12} /> Requested
                                  </>
                                )}
                              </span>
                            </div>

                            {/* Right Action Button */}
                            <div>
                              {(isCompleted || m.summary_notes) ? (
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
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  <span>{isExpanded ? 'Hide Details' : 'View Details'}</span>
                                  {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                </button>
                              ) : m.status === 'requested' ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCancelMeeting(m.id);
                                  }}
                                  disabled={cancellingMeetingId === m.id}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '4px 10px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    color: '#DC2626',
                                    backgroundColor: '#FEF2F2',
                                    border: '1px solid #FECACA',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                    whiteSpace: 'nowrap',
                                  }}
                                  title="Withdraw / Cancel this request"
                                >
                                  <X size={12} />
                                  <span>{cancellingMeetingId === m.id ? 'Withdrawing...' : 'Cancel Request'}</span>
                                </button>
                              ) : (
                                <span style={{ fontSize: '11px', fontWeight: 600, color: '#2563EB', backgroundColor: '#EFF6FF', padding: '4px 10px', borderRadius: '6px', border: '1px solid #DBEAFE', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <Calendar size={12} /> Confirmed Session
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Row 2: Initiator Tag, Attendance, and Scheduled Meta Chips */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span
                              style={{
                                fontSize: '11px',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontWeight: 500,
                                backgroundColor: '#F1F5F9',
                                color: '#475569',
                                border: '1px solid #E2E8F0',
                                whiteSpace: 'nowrap',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              {m.status === 'requested' || (!m.scheduled_date && m.meeting_index === 1) ? (
                                <>
                                  <GraduationCap size={12} /> Student Requested
                                </>
                              ) : (
                                <>
                                  <UserCheck size={12} /> Supervisor Scheduled
                                </>
                              )}
                            </span>

                            {isCompleted && (
                              <span
                                style={{
                                  fontSize: '11px',
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  fontWeight: 600,
                                  backgroundColor: absentStudents.length === 0 ? '#ECFDF5' : '#FFFBEB',
                                  color: absentStudents.length === 0 ? '#047857' : '#B45309',
                                  border: '1px solid',
                                  borderColor: absentStudents.length === 0 ? '#A7F3D0' : '#FDE68A',
                                  whiteSpace: 'nowrap',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <Users size={12} /> {presentStudents.length}/{totalCount || 'All'} Present
                              </span>
                            )}

                            {m.status === 'requested' && (
                              <span
                                style={{
                                  fontSize: '11px',
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  fontWeight: 600,
                                  backgroundColor: '#FFFBEB',
                                  color: '#B45309',
                                  border: '1px solid #FDE68A',
                                  whiteSpace: 'nowrap',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <Clock size={12} /> Awaiting Faculty Schedule
                              </span>
                            )}

                            {m.scheduled_date && (
                              <span style={{ fontSize: '11px', color: '#334155', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', padding: '2px 8px', borderRadius: '5px', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <Calendar size={12} /> {m.scheduled_date}
                              </span>
                            )}

                            {m.time_slot && (
                              <span style={{ fontSize: '11px', color: '#334155', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', padding: '2px 8px', borderRadius: '5px', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <Clock size={12} /> {m.time_slot}
                              </span>
                            )}

                            {m.venue && (
                              <span style={{ fontSize: '11px', color: '#334155', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', padding: '2px 8px', borderRadius: '5px', wordBreak: 'break-word', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <MapPin size={12} /> {m.venue}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Collapsible Session Brief, Directives & Attendance Drawer */}
                        {isExpanded && (
                          <div
                            style={{
                              borderTop: '1px solid var(--color-hairline)',
                              backgroundColor: '#F8FAFC',
                              padding: '16px',
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                              gap: '16px',
                            }}
                          >
                            {/* Left Column: Summary & Directives */}
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

                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
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
                                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#DC2626', backgroundColor: '#FFFFFF', padding: '2px 6px', borderRadius: '4px', border: '1px solid #FECACA' }}>
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
