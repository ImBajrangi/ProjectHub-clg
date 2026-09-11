'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  UserX,
  RefreshCw,
  X,
  Plus,
  Check,
  CheckCircle2,
  AlertCircle,
  Target,
  GraduationCap,
  ArrowLeft,
  ArrowRight,
  Search,
  ShieldCheck,
  Bookmark,
  Sparkles,
  Star,
  ThumbsUp,
  MessageSquare,
  Eye,
  EyeOff,
  Lock,
  Shield,
  Edit3,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import LoadingScreen from '@/components/LoadingScreen';
import { clientCache } from '@/lib/clientCache';

export default function FacultyDashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [guidedTeams, setGuidedTeams] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [panelData, setPanelData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [mode, setMode] = useState<'supervisor' | 'panel'>('supervisor');
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');

  // Supervisor Mode State
  const [facultyTeamSearch, setFacultyTeamSearch] = useState('');
  const [supTab, setSupTab] = useState<'roster' | 'problem' | 'meetings'>('problem');
  const [problemReviewText, setProblemReviewText] = useState('');
  const [reviewActionLoading, setReviewActionLoading] = useState(false);
  const [expandedMeetingIds, setExpandedMeetingIds] = useState<Set<string>>(new Set());

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
        scrollToCenter(`faculty-meeting-card-${meetingId}`);
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
  const [panelTeamSearch, setPanelTeamSearch] = useState('');
  const [panelTeamLoading, setPanelTeamLoading] = useState(false);
  const [selectedPanelTeam, setSelectedPanelTeam] = useState<any>(null);
  const [selectedPanelPhase, setSelectedPanelPhase] = useState<number>(1);
  const [panelTeamMembers, setPanelTeamMembers] = useState<any[]>([]);
  const [studentScores, setStudentScores] = useState<Record<string, { score: string; isAbsent: boolean; attendanceStatus?: 'present' | 'absent' | 'next_shift'; remarks: string }>>({});
  const [scoringLoading, setScoringLoading] = useState(false);
  const [savingStudentId, setSavingStudentId] = useState<string | null>(null);
  const [evaluationPhases, setEvaluationPhases] = useState<any[]>([]);
  const [scoreMessage, setScoreMessage] = useState('');
  const [scorePrivacy, setScorePrivacy] = useState<boolean>(true); // Score Privacy Mode (Dots Only)
  const [revealedStudentIds, setRevealedStudentIds] = useState<Set<string>>(new Set());
  const [submittedStudentIds, setSubmittedStudentIds] = useState<Set<string>>(new Set());
  const [editingStudentIds, setEditingStudentIds] = useState<Set<string>>(new Set());

  const getPresetsForMaxMarks = (max: number) => {
    if (max === 10) return ['7.0', '8.0', '8.5', '9.0', '9.5', '10.0'];
    if (max === 20) return ['14.0', '16.0', '17.0', '18.0', '19.0', '20.0'];
    if (max === 25) return ['18.0', '20.0', '21.5', '23.0', '24.0', '25.0'];
    if (max === 40) return ['28.0', '32.0', '34.0', '36.0', '38.0', '40.0'];
    if (max === 50) return ['35.0', '40.0', '43.0', '46.0', '48.0', '50.0'];
    if (max === 100) return ['70', '80', '85', '90', '95', '100'];
    const ratios = [0.7, 0.8, 0.85, 0.9, 0.95, 1.0];
    return ratios.map((r) => {
      const v = max * r;
      return Number.isInteger(v) ? `${v}.0` : v.toFixed(1);
    });
  };

  const toggleStudentPrivacy = (studentId: string) => {
    setRevealedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  };

  // Auto-hide score status message after 4s
  useEffect(() => {
    if (scoreMessage) {
      const timer = setTimeout(() => {
        setScoreMessage('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [scoreMessage]);

  // Lock background scroll and handle Escape key to close modals
  useEffect(() => {
    if (scheduleModalOpen || logModalOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setScheduleModalOpen(false);
          setLogModalOpen(false);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = 'unset';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [scheduleModalOpen, logModalOpen]);

  const loadFacultyData = async () => {
    try {
      const [authRes, teamsRes, panelRes, phasesRes] = await Promise.all([
        currentUser ? Promise.resolve(null) : fetch('/api/auth/me'),
        fetch('/api/team', { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } }),
        fetch('/api/panels'),
        fetch('/api/phases', { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } }),
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
        if (authData.user.role !== 'supervisor' && authData.user.role !== 'admin') {
          router.push('/dashboard/leader');
          return;
        }
        if (authData.user.email?.toLowerCase() === 'admin@codeshastra.edu') {
          router.push('/admin');
          return;
        }
        loggedInUser = authData.user;
        setCurrentUser(authData.user);
        clientCache.set(clientCache.keys.USER_ME, authData.user);
      }

      let loadedTeams = guidedTeams;
      let loadedPanels = panelData;

      if (teamsRes && teamsRes.ok) {
        const tData = await teamsRes.json();
        const teams = tData.teams || [];
        loadedTeams = teams;
        setGuidedTeams(teams);
        setSelectedTeam((prev: any) => {
          if (!prev && teams.length > 0) return teams[0];
          if (prev) {
            const fresh = teams.find((t: any) => String(t.id) === String(prev.id));
            return fresh || teams[0] || null;
          }
          return null;
        });
      }

      if (panelRes && panelRes.ok) {
        const pData = await panelRes.json();
        loadedPanels = pData.panels || [];
        setPanelData(loadedPanels);
      }

      if (phasesRes && phasesRes.ok) {
        const phData = await phasesRes.json();
        setEvaluationPhases(phData.phases || []);
      }

      if (loggedInUser?.id) {
        clientCache.set(clientCache.keys.FACULTY_DATA(loggedInUser.id), {
          teams: loadedTeams,
          panels: loadedPanels,
        });
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
    if (cachedUser && (cachedUser.role === 'supervisor' || cachedUser.role === 'admin')) {
      setCurrentUser(cachedUser);
      const cachedData = clientCache.get<any>(clientCache.keys.FACULTY_DATA(cachedUser.id));
      if (cachedData) {
        if (cachedData.teams && cachedData.teams.length > 0) {
          setGuidedTeams(cachedData.teams);
          setSelectedTeam(cachedData.teams[0]);
        }
        if (cachedData.panels) {
          setPanelData(cachedData.panels);
        }
        setLoading(false);
      }
    }

    // 2. Single fresh fetch on load/refresh
    loadFacultyData();

    if (typeof window === 'undefined') return;

    const handleUpdate = () => {
      loadFacultyData();
    };

    window.addEventListener('codeshastra_notification_update', handleUpdate);

    let bc: BroadcastChannel | null = null;
    if ('BroadcastChannel' in window) {
      try {
        bc = new BroadcastChannel('codeshastra_notifications_channel');
        bc.onmessage = (event) => {
          if (event.data?.type === 'UPDATE' || event.data?.type === 'INSTANT_NOTIFICATION') {
            loadFacultyData();
          }
        };
      } catch {}
    }

    return () => {
      window.removeEventListener('codeshastra_notification_update', handleUpdate);
      if (bc) {
        try {
          bc.close();
        } catch {}
      }
    };
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
            setTimeout(() => { try { bc.close(); } catch {} }, 1000);
          } catch { }
        }
      } else {
        const data = await res.json();
        setScoreMessage(`Error: ${data.error}`);
        loadFacultyData();
      }
    } catch (e: any) {
      setScoreMessage(`Error: ${e.message}`);
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
        setScoreMessage(`Error: ${data.error}`);
        loadFacultyData();
      }
    } catch (e: any) {
      setScoreMessage(`Error: ${e.message}`);
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
        setScoreMessage(`Error: ${data.error}`);
        loadFacultyData(); // Rollback on server error
      }
    } catch (e: any) {
      setScoreMessage(`Error: ${e.message}`);
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
        setScoreMessage(`Error: ${data.error}`);
        // Rollback on failure
        setSelectedTeam((prev: any) => (prev ? { ...prev, [key]: currentApproved } : prev));
        setGuidedTeams((prev: any[]) =>
          prev.map((t) => (t.id === selectedTeam.id ? { ...t, [key]: currentApproved } : t))
        );
      }
    } catch (e: any) {
      setScoreMessage(`Error: ${e.message}`);
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
    setPanelTeamLoading(true);

    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    try {
      const [teamRes, evRes] = await Promise.all([
        fetch(`/api/team?teamId=${team.id}`, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } }),
        fetch(`/api/evaluations?phaseNumber=${phaseNumber}&teamId=${team.id}`, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } }),
      ]);

      const data = teamRes.ok ? await teamRes.json() : {};
      const students = data.members || [];
      setPanelTeamMembers(students);

      const evData = evRes.ok ? await evRes.json() : {};
      const evals = evData.evaluations || [];

      const initialScores: Record<string, any> = {};
      const initialSubmitted = new Set<string>();
      const initialEditing = new Set<string>();

      students.forEach((s: any) => {
        const existing = evals.find((e: any) => e.student_id === s.id);
        const hasScore = existing?.score !== null && existing?.score !== undefined && String(existing?.score) !== '';
        const status: 'present' | 'absent' | 'next_shift' = existing?.attendance_status || (existing?.is_absent ? (existing?.remarks?.toLowerCase().includes('next shift') ? 'next_shift' : 'absent') : 'present');
        const isAbsent = status !== 'present';
        initialScores[s.id] = {
          score: hasScore ? String(existing.score) : '',
          isAbsent,
          attendanceStatus: status,
          remarks: existing?.remarks || '',
        };
        if (hasScore || isAbsent) {
          initialSubmitted.add(s.id);
        } else {
          initialEditing.add(s.id);
        }
      });
      setStudentScores(initialScores);
      setSubmittedStudentIds(initialSubmitted);
      setEditingStudentIds(initialEditing);
      setRevealedStudentIds(new Set());
    } catch (e) {
      console.error(e);
    } finally {
      setPanelTeamLoading(false);
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
      attendanceStatus: item.attendanceStatus || (item.isAbsent ? 'absent' : 'present'),
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
        setScoreMessage('Scores successfully recorded and synchronized to academic ledger.');
        
        // Immediately mask all candidates with dots and close active editing
        const allSubmitted = new Set<string>();
        panelTeamMembers.forEach((m) => {
          const sc = studentScores[m.id];
          if ((sc?.score !== '' && sc?.score !== null && sc?.score !== undefined) || sc?.isAbsent) {
            allSubmitted.add(m.id);
          }
        });
        setSubmittedStudentIds(allSubmitted);
        setEditingStudentIds(new Set());
        setRevealedStudentIds(new Set());

        loadFacultyData();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('codeshastra_notification_update'));
          try {
            const bc = new BroadcastChannel('codeshastra_notifications_channel');
            bc.postMessage({ type: 'UPDATE' });
            setTimeout(() => { try { bc.close(); } catch {} }, 1000);
          } catch { }
        }
      }
    } catch (e: any) {
      setScoreMessage(`Error: ${e.message}`);
    } finally {
      setScoringLoading(false);
    }
  };

  const handleConfirmSingleScore = async (studentId: string) => {
    if (!selectedPanelTeam) return;
    const current = studentScores[studentId];
    if (!current || (current.score === '' && !current.isAbsent)) return;

    setSavingStudentId(studentId);
    try {
      const parsedScore = current.isAbsent ? null : current.score !== '' ? parseFloat(current.score) : null;
      const res = await fetch('/api/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit_scores',
          phaseNumber: selectedPanelPhase || 1,
          teamId: selectedPanelTeam.id,
          scores: [
            {
              studentId,
              score: parsedScore,
              isAbsent: current.isAbsent,
              attendanceStatus: current.attendanceStatus || (current.isAbsent ? 'absent' : 'present'),
              remarks: current.remarks,
            },
          ],
        }),
      });

      if (res.ok) {
        setSubmittedStudentIds((prev) => new Set(prev).add(studentId));
        setEditingStudentIds((prev) => {
          const next = new Set(prev);
          next.delete(studentId);
          return next;
        });
        setRevealedStudentIds((prev) => {
          const next = new Set(prev);
          next.delete(studentId);
          return next;
        });
        setScoreMessage('Score successfully confirmed & locked to academic ledger.');
        loadFacultyData();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('codeshastra_notification_update'));
          try {
            const bc = new BroadcastChannel('codeshastra_notifications_channel');
            bc.postMessage({ type: 'UPDATE' });
            setTimeout(() => { try { bc.close(); } catch {} }, 1000);
          } catch { }
        }
      } else {
        const data = await res.json();
        setScoreMessage(`Error: ${data.error}`);
      }
    } catch (e: any) {
      setScoreMessage(`Error: ${e.message}`);
    } finally {
      setSavingStudentId(null);
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
        setScoreMessage('Phase 3 Report Clearance submitted successfully.');
        loadFacultyData();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('codeshastra_notification_update'));
          try {
            const bc = new BroadcastChannel('codeshastra_notifications_channel');
            bc.postMessage({ type: 'UPDATE' });
            setTimeout(() => { try { bc.close(); } catch {} }, 1000);
          } catch { }
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return <LoadingScreen label="Loading faculty portal..." />;
  }

  return (
    <div className="page-fade-in" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-canvas)' }}>
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

            {/* Stadium Mode Switcher & Admin Quick Action */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {currentUser?.role === 'admin' && (
                <Link
                  href="/admin"
                  className="btn btn-outline"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 15px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    borderRadius: '20px',
                    borderColor: 'var(--color-primary-border, #DBEAFE)',
                    backgroundColor: 'var(--color-primary-light, #EFF6FF)',
                    color: 'var(--color-primary, #2563EB)',
                    textDecoration: 'none',
                    transition: 'all 0.15s ease',
                  }}
                  title="Open Master Academic Administration Console"
                >
                  <Shield size={13} style={{ color: 'var(--color-primary)' }} />
                  <span>Use Admin Access</span>
                </Link>
              )}

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
        </div>

        {/* Co-Admin Privilege Info Ribbon */}
        {currentUser?.role === 'admin' && (
          <div
            className="card"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              padding: '12px 18px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.03) 0%, rgba(59, 130, 246, 0.05) 100%)',
              border: '1px solid var(--color-hairline)',
              marginBottom: '20px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-ink)', fontWeight: 600 }}>
              <Shield size={16} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
              <span>Administrative Authority Active: You have full access to manage panels, phases, student scores, and faculty governance.</span>
            </div>
            <Link
              href="/admin"
              className="btn btn-outline"
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--color-primary)',
                borderColor: 'var(--color-primary-border, #DBEAFE)',
                backgroundColor: 'var(--color-primary-light, #EFF6FF)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 12px',
                borderRadius: '6px',
              }}
            >
              <Shield size={13} /> Open Admin Console →
            </Link>
          </div>
        )}

        {!selectedPanelTeam && scoreMessage && (
          <div
            className={`alert-banner ${scoreMessage.includes('Error') ? 'alert-danger' : 'alert-success'}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              marginBottom: '20px',
              padding: '12px 16px',
              borderRadius: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', fontWeight: 600 }}>
              {scoreMessage.includes('Error') ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
              <span>{scoreMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setScoreMessage('')}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit', opacity: 0.7 }}
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* =================================================================== */}
        {/* SUPERVISOR VIEW */}
        {/* =================================================================== */}
        {mode === 'supervisor' && (
          <div className="faculty-split-layout">
            {/* Left Column: Team Selector List */}
            <div className={`faculty-list-col ${mobileView === 'detail' && selectedTeam ? 'mobile-hidden' : ''}`} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Your Assigned Teams ({guidedTeams.length})
                </div>
              </div>

              {/* Search Team Bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 12px',
                  backgroundColor: 'var(--color-canvas)',
                  border: '1px solid var(--color-hairline)',
                  borderRadius: 'var(--rounded-sm)',
                }}
              >
                <Search size={14} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                <input
                  type="text"
                  value={facultyTeamSearch}
                  onChange={(e) => setFacultyTeamSearch(e.target.value)}
                  placeholder="Search team or leader..."
                  style={{
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    fontSize: '12.5px',
                    color: 'var(--color-ink)',
                    width: '100%',
                  }}
                />
                {facultyTeamSearch && (
                  <button
                    type="button"
                    onClick={() => setFacultyTeamSearch('')}
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '2px' }}
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {guidedTeams
                .filter((t) => {
                  if (!facultyTeamSearch.trim()) return true;
                  const q = facultyTeamSearch.toLowerCase().trim();
                  return (
                    (t.team_name || '').toLowerCase().includes(q) ||
                    (t.program || '').toLowerCase().includes(q) ||
                    (t.leader?.fullName || '').toLowerCase().includes(q)
                  );
                })
                .map((t) => {
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
                                type="button"
                                onClick={() => handleReviewProblemStatement('approve')}
                                className="btn btn-primary"
                                disabled={reviewActionLoading}
                              >
                                <CheckCircle size={15} /> Approve & Lock Statement
                              </button>
                              <button
                                type="button"
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
                                  id={`faculty-meeting-card-${m.id}`}
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

              </div>
            ) : (
              <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
                <p style={{ color: 'var(--color-text-muted)' }}>Select an assigned team from the left column.</p>
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* PANEL (JUDGE) VIEW: FULL PAGE TEAM SCORING & ASSIGNED PANELS HUB    */}
        {/* =================================================================== */}
        {mode === 'panel' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* ------------------------------------------------------------- */}
            {/* VIEW A: FULL PAGE TEAM SCORING CONSOLE (when team selected)   */}
            {/* ------------------------------------------------------------- */}
            {selectedPanelTeam ? (
              <div className="page-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Top Sticky Navigation Bar with Back Button */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '14px',
                    padding: '14px 20px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '14px',
                    border: '1px solid var(--color-hairline)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedPanelTeam(null)}
                      className="btn btn-outline"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 18px',
                        fontSize: '13px',
                        fontWeight: 700,
                        borderRadius: '10px',
                        color: 'var(--color-ink)',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      }}
                    >
                      <ArrowLeft size={16} /> Back to All Assigned Teams
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                      <span>Panel Evaluations</span>
                      <span>/</span>
                      <span className="badge badge-brand" style={{ fontSize: '11px', fontWeight: 700 }}>
                        Phase {selectedPanelPhase} Evaluation
                      </span>
                      <span>/</span>
                      <strong style={{ color: 'var(--color-ink)' }}>{selectedPanelTeam.team_name}</strong>
                    </div>
                  </div>

                  {(() => {
                    const activePhaseConfig = evaluationPhases.find((p: any) => p.phase_number === (selectedPanelPhase || 1));
                    const maxMarks = activePhaseConfig?.marks_weightage || activePhaseConfig?.max_marks || (selectedPanelPhase === 1 ? 20 : selectedPanelPhase === 2 ? 40 : 40);
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span className="badge badge-success" style={{ fontSize: '11.5px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          <CheckCircle2 size={13} /> Live Defense Mode
                        </span>
                        <span className="badge badge-brand" style={{ fontSize: '11px', fontWeight: 700 }}>
                          Rubric: {maxMarks} Marks Scale
                        </span>
                      </div>
                    );
                  })()}
                </div>

                {/* Score Status Notification Banner */}
                {scoreMessage && (
                  <div
                    className={`alert-banner ${scoreMessage.includes('Error') ? 'alert-danger' : 'alert-success'}`}
                    style={{
                      fontSize: '13.5px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      padding: '12px 18px',
                      borderRadius: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600 }}>
                      {scoreMessage.includes('Error') ? (
                        <AlertCircle size={18} style={{ flexShrink: 0 }} />
                      ) : (
                        <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
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
                        padding: '4px',
                        color: 'inherit',
                        opacity: 0.8,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      title="Dismiss notification"
                      aria-label="Dismiss"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}

                {/* SECTION 1: Team & Project Intelligence Overview */}
                <div
                  className="card"
                  style={{
                    padding: '24px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    border: '1px solid var(--color-hairline)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '18px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                        <span className="badge badge-brand" style={{ fontSize: '12px', fontWeight: 800 }}>
                          Team #{selectedPanelTeam.team_number || selectedPanelTeam.id?.slice(0, 6)}
                        </span>
                        {selectedPanelTeam.program && (
                          <span className="badge badge-neutral" style={{ fontSize: '11px', fontWeight: 600 }}>
                            {selectedPanelTeam.program}
                          </span>
                        )}
                        <span className="badge badge-success" style={{ fontSize: '11px', fontWeight: 700 }}>
                          ● Supervisor Cleared
                        </span>
                      </div>
                      <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-ink)', letterSpacing: '-0.02em', margin: 0 }}>
                        {selectedPanelTeam.team_name}
                      </h2>
                    </div>

                    {(() => {
                      const activePhaseConfig = evaluationPhases.find((p: any) => p.phase_number === (selectedPanelPhase || 1));
                      const maxMarks = activePhaseConfig?.marks_weightage || activePhaseConfig?.max_marks || (selectedPanelPhase === 1 ? 20 : selectedPanelPhase === 2 ? 40 : 40);
                      const deliverableName = activePhaseConfig?.name || (selectedPanelPhase === 1 ? 'Concept PPT' : selectedPanelPhase === 2 ? 'Working Demo' : 'Final Defense');
                      return (
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <div style={{ padding: '8px 14px', backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', textAlign: 'right' }}>
                            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-faint)', textTransform: 'uppercase' }}>Target Deliverable</div>
                            <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--color-ink)', marginTop: '2px' }}>
                              {deliverableName} ({maxMarks}M)
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Project Problem Statement */}
                  {selectedPanelTeam.problemStatement && (
                    <div
                      style={{
                        padding: '14px 18px',
                        backgroundColor: '#F8FAFC',
                        borderRadius: '12px',
                        border: '1px solid var(--color-hairline)',
                        marginBottom: '18px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <Bookmark size={14} color="#2563EB" />
                        <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#1E40AF', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Approved Project Topic &amp; Problem Statement
                        </span>
                        {selectedPanelTeam.problemStatement.domain && (
                          <span className="badge badge-neutral" style={{ fontSize: '10.5px' }}>
                            {selectedPanelTeam.problemStatement.domain}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-ink)', marginBottom: '4px' }}>
                        {selectedPanelTeam.problemStatement.title || selectedPanelTeam.project_title || 'Untitled Project'}
                      </div>
                      {selectedPanelTeam.problemStatement.description && (
                        <p style={{ fontSize: '12.5px', color: 'var(--color-text-muted)', lineHeight: '1.5', margin: 0 }}>
                          {selectedPanelTeam.problemStatement.description}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Quick Meta Grid: Supervisor & Presentation Venue */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                    {/* Supervisor Info */}
                    <div style={{ padding: '12px 16px', backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '12.5px' }}>
                      <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--color-text-faint)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
                        Faculty Supervisor
                      </div>
                      <div style={{ fontWeight: 700, color: 'var(--color-ink)', fontSize: '13.5px' }}>
                        {selectedPanelTeam.supervisor?.name || 'Assigned Supervisor'}
                      </div>
                      <div style={{ color: 'var(--color-text-muted)', fontSize: '11.5px', marginTop: '3px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        {selectedPanelTeam.supervisor?.email && <span>{selectedPanelTeam.supervisor.email}</span>}
                        {selectedPanelTeam.supervisor?.phone && <span>Tel: {selectedPanelTeam.supervisor.phone}</span>}
                        {selectedPanelTeam.supervisor?.cabin && <span>Cabin: {selectedPanelTeam.supervisor.cabin}</span>}
                      </div>
                    </div>

                    {/* Venue & Shift */}
                    <div style={{ padding: '12px 16px', backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '12.5px' }}>
                      <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--color-text-faint)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
                        Evaluation Venue &amp; Batch
                      </div>
                      <div style={{ fontWeight: 700, color: 'var(--color-ink)', fontSize: '13.5px' }}>
                        Academic Block AB10 (Room 402 / 405)
                      </div>
                      <div style={{ color: 'var(--color-text-muted)', fontSize: '11.5px', marginTop: '3px' }}>
                        Conflict-Free 3-Judge Faculty Panel Assessment
                      </div>
                    </div>
                  </div>

                  {/* Phase 3 Deliverables & Clearance (if Phase 3) */}
                  {(selectedPanelTeam.paper_url || selectedPanelTeam.report_url || selectedPanelPhase === 3) && (
                    <div
                      style={{
                        marginTop: '16px',
                        padding: '14px 18px',
                        backgroundColor: '#EFF6FF',
                        borderRadius: '12px',
                        border: '1px solid #BFDBFE',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '12px',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 800, color: '#1E40AF', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Phase 3 Institutional Deliverables
                        </div>
                        <div style={{ fontSize: '12px', color: '#1E3A8A', marginTop: '2px' }}>
                          Review uploaded research manuscript and complete project report before defense evaluation.
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {selectedPanelTeam.report_url && (
                          <a href={selectedPanelTeam.report_url} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ fontSize: '12px', padding: '6px 12px', backgroundColor: '#FFFFFF' }}>
                            <ExternalLink size={12} /> Project Report PDF
                          </a>
                        )}
                        {selectedPanelTeam.paper_url && (
                          <a href={selectedPanelTeam.paper_url} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ fontSize: '12px', padding: '6px 12px', backgroundColor: '#FFFFFF' }}>
                            <ExternalLink size={12} /> Research Paper PDF
                          </a>
                        )}
                        <button type="button" onClick={() => handleReportClearance(true)} className="btn btn-primary" style={{ fontSize: '12px', padding: '6px 14px' }}>
                          Grant Phase 3 Report Clearance
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* SECTION 2: Direct Individual Member Scoring Deck */}
                <div
                  className="card"
                  style={{
                    padding: '24px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    border: '1px solid var(--color-hairline)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                  }}
                >
                  {/* SECTION 2: Interactive Individual Student Scoring Cards Deck */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '16px',
                      marginBottom: '22px',
                      paddingBottom: '18px',
                      borderBottom: '1px solid var(--color-hairline)',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h3 style={{ fontSize: '19px', fontWeight: 800, color: 'var(--color-ink)', letterSpacing: '-0.01em', margin: 0, display: 'flex', alignItems: 'center', gap: '9px' }}>
                          <Award size={21} className="text-indigo-600" color="#4F46E5" /> Individual Candidate Scoring Deck
                        </h3>
                        <span className="badge badge-brand" style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px' }}>
                          Phase {selectedPanelPhase}
                        </span>
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px', marginBottom: 0 }}>
                        Score each candidate with instant presets, individual confirmation safeguards, and viva defense feedback.
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      {/* Metric summary badges */}
                      {(() => {
                        const total = panelTeamMembers.length;
                        const scoredCount = panelTeamMembers.filter((m) => {
                          const s = studentScores[m.id];
                          return s && (s.isAbsent || (s.score !== '' && !isNaN(parseFloat(s.score))));
                        }).length;
                        const activePhaseConfig = evaluationPhases.find((p: any) => p.phase_number === (selectedPanelPhase || 1));
                        const maxMarks = activePhaseConfig?.marks_weightage || activePhaseConfig?.max_marks || (selectedPanelPhase === 1 ? 20 : selectedPanelPhase === 2 ? 40 : 40);

                        const validNumericScores = panelTeamMembers
                          .map((m) => studentScores[m.id])
                          .filter((s) => s && !s.isAbsent && s.score !== '' && !isNaN(parseFloat(s.score)))
                          .map((s) => parseFloat(s.score));

                        const avg = validNumericScores.length > 0
                          ? (validNumericScores.reduce((a, b) => a + b, 0) / validNumericScores.length).toFixed(1)
                          : '—';

                        return (
                          <>
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 14px',
                                borderRadius: '8px',
                                backgroundColor: scoredCount === total && total > 0 ? '#ECFDF5' : '#F1F5F9',
                                border: scoredCount === total && total > 0 ? '1px solid #A7F3D0' : '1px solid #CBD5E1',
                                fontSize: '12.5px',
                                color: scoredCount === total && total > 0 ? '#059669' : '#475569',
                                fontWeight: 700,
                              }}
                            >
                              <CheckCircle2 size={14} color={scoredCount === total && total > 0 ? '#059669' : '#64748B'} />
                              <span>Progress: <strong>{scoredCount} / {total} Scored</strong></span>
                            </div>

                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 14px',
                                borderRadius: '8px',
                                backgroundColor: '#EFF6FF',
                                border: '1px solid #BFDBFE',
                                fontSize: '12.5px',
                                color: '#1E40AF',
                                fontWeight: 600,
                              }}
                            >
                              <Star size={14} color="#2563EB" fill="#2563EB" />
                              <span>Average: <strong>{scorePrivacy ? '● ● ●' : avg} / {maxMarks}</strong></span>
                            </div>
                          </>
                        );
                      })()}

                      {/* Score Privacy Toggle Button */}
                      <button
                        type="button"
                        onClick={() => setScorePrivacy(!scorePrivacy)}
                        className="btn btn-outline"
                        style={{
                          fontSize: '12px',
                          padding: '6px 14px',
                          fontWeight: 700,
                          borderRadius: '8px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          backgroundColor: scorePrivacy ? '#EFF6FF' : '#FFFFFF',
                          color: scorePrivacy ? '#1D4ED8' : '#475569',
                          border: scorePrivacy ? '1.5px solid #93C5FD' : '1px solid #CBD5E1',
                        }}
                        title={scorePrivacy ? 'Scores are hidden with dots. Click to reveal.' : 'Scores are visible. Click to mask with dots.'}
                      >
                        {scorePrivacy ? (
                          <>
                            <Lock size={13} color="#2563EB" /> Privacy: Dots Only (Active)
                          </>
                        ) : (
                          <>
                            <Eye size={13} /> Privacy: Off (Scores Visible)
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const next = { ...studentScores };
                          panelTeamMembers.forEach((m) => {
                            if (next[m.id]) {
                              next[m.id] = { ...next[m.id], isAbsent: false };
                            }
                          });
                          setStudentScores(next);
                        }}
                        className="btn btn-outline"
                        style={{ fontSize: '12px', padding: '6px 14px', fontWeight: 600, borderRadius: '8px' }}
                      >
                        <UserCheck size={13} /> Mark All Present
                      </button>
                    </div>
                  </div>

                  {panelTeamLoading ? (
                    <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                      <RefreshCw size={26} className="animate-spin" style={{ margin: '0 auto 12px', opacity: 0.6, color: '#2563EB' }} />
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-ink)' }}>Loading candidate roster &amp; records...</div>
                      <p style={{ fontSize: '12.5px', marginTop: '4px' }}>Fetching student profiles and prior phase marks from database.</p>
                    </div>
                  ) : panelTeamMembers.length === 0 ? (
                    <div style={{ padding: '40px 20px', textAlign: 'center', backgroundColor: '#F8FAFC', borderRadius: '14px', color: 'var(--color-text-muted)', fontSize: '13px', border: '1px dashed #CBD5E1' }}>
                      No registered student candidates found for this team.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {panelTeamMembers.map((student, idx) => {
                        const current = studentScores[student.id] || { score: '', isAbsent: false, remarks: '' };
                        const isLeader = student.id === selectedPanelTeam.leader_id || student.role === 'leader';
                        const numScore = parseFloat(current.score);
                        const hasScore = current.score !== '' && !isNaN(numScore);

                        // Dynamic max marks from active phase configuration
                        const activePhaseConfig = evaluationPhases.find((p: any) => p.phase_number === (selectedPanelPhase || 1));
                        const maxMarks = activePhaseConfig?.marks_weightage || activePhaseConfig?.max_marks || (selectedPanelPhase === 1 ? 20 : selectedPanelPhase === 2 ? 40 : 40);
                        const dynamicPresets = getPresetsForMaxMarks(maxMarks);

                        // Student is actively being edited if they are in editingStudentIds or not yet submitted
                        const isStudentSubmitted = submittedStudentIds.has(student.id);
                        const isEditing = editingStudentIds.has(student.id) || (!isStudentSubmitted && hasScore);
                        
                        // Masked dots mode applies when submitted AND not actively editing, OR when scorePrivacy is ON and not revealed
                        const isMasked = (!isEditing && isStudentSubmitted) || (scorePrivacy && !isEditing && !revealedStudentIds.has(student.id));

                        // Score grade rating tier
                        const pctScore = hasScore ? (numScore / maxMarks) * 100 : 0;
                        const scoreRating = hasScore
                          ? pctScore >= 90
                            ? { label: 'Outstanding (90%+)', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' }
                            : pctScore >= 80
                            ? { label: 'Very Good (80%+)', color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' }
                            : pctScore >= 70
                            ? { label: 'Good (70%+)', color: '#2563EB', bg: '#EFF6FF', border: '#DBEAFE' }
                            : { label: 'Average (<70%)', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' }
                          : null;

                        const feedbackPresets = [
                          '🌟 Excellent demonstration & confident viva',
                          '💡 Good conceptual clarity & code walkthrough',
                          '🔧 Functional implementation, needs better error handling',
                          '📊 Strong architecture & clean system design',
                          '⚠️ Needs deeper understanding of backend workflow',
                        ];

                        const isNextShift = current.attendanceStatus === 'next_shift';
                        const isAbsentOnly = current.attendanceStatus === 'absent' || (current.isAbsent && !isNextShift);
                        const isPresent = !current.isAbsent && !isNextShift && !isAbsentOnly;

                        return (
                          <div
                            key={student.id}
                            style={{
                              padding: '20px 24px',
                              borderRadius: '16px',
                              border: isNextShift
                                ? '1.5px solid #FCD34D'
                                : isAbsentOnly
                                ? '1.5px solid #FCA5A5'
                                : hasScore
                                ? isMasked
                                  ? '1.5px solid #CBD5E1'
                                  : '1.5px solid #93C5FD'
                                : '1px solid #E2E8F0',
                              backgroundColor: isNextShift
                                ? '#FFFDF5'
                                : isAbsentOnly
                                ? '#FFF5F5'
                                : hasScore
                                ? isMasked
                                  ? '#FAFAFA'
                                  : '#F8FAFC'
                                : '#FFFFFF',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '16px',
                              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                              boxShadow: hasScore && !isMasked
                                ? '0 4px 14px rgba(37, 99, 235, 0.08)'
                                : '0 1px 3px rgba(0,0,0,0.02)',
                              position: 'relative',
                            }}
                          >
                            {/* Left accent color strip */}
                            <div
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                bottom: 0,
                                width: '5px',
                                borderTopLeftRadius: '16px',
                                borderBottomLeftRadius: '16px',
                                backgroundColor: isNextShift
                                  ? '#F59E0B'
                                  : isAbsentOnly
                                  ? '#EF4444'
                                  : hasScore
                                  ? isMasked
                                    ? '#94A3B8'
                                    : '#2563EB'
                                  : '#CBD5E1',
                              }}
                            />

                            {/* Candidate Header Row */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', paddingLeft: '6px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
                                {/* Gradient Avatar with Ring */}
                                <div
                                  style={{
                                    width: '42px',
                                    height: '42px',
                                    borderRadius: '12px',
                                    background: isNextShift
                                      ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
                                      : isAbsentOnly
                                      ? 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)'
                                      : hasScore
                                      ? isMasked
                                        ? 'linear-gradient(135deg, #64748B 0%, #475569 100%)'
                                        : 'linear-gradient(135deg, #1E40AF 0%, #2563EB 100%)'
                                      : 'linear-gradient(135deg, #64748B 0%, #475569 100%)',
                                    color: '#FFFFFF',
                                    fontWeight: 800,
                                    fontSize: '14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                                    letterSpacing: '0.5px',
                                  }}
                                >
                                  {student.full_name?.slice(0, 2).toUpperCase() || `S${idx + 1}`}
                                </div>

                                <div style={{ minWidth: 0 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    <span
                                      style={{
                                        fontSize: '15.5px',
                                        fontWeight: 800,
                                        color: isNextShift ? '#92400E' : isAbsentOnly ? '#991B1B' : 'var(--color-ink)',
                                        letterSpacing: '-0.01em',
                                        textDecoration: isAbsentOnly ? 'line-through' : 'none',
                                      }}
                                    >
                                      {student.full_name}
                                    </span>

                                    {isLeader ? (
                                      <span
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '4px',
                                          fontSize: '10.5px',
                                          fontWeight: 800,
                                          padding: '2.5px 8px',
                                          borderRadius: '6px',
                                          backgroundColor: '#FEF3C7',
                                          color: '#92400E',
                                          border: '1px solid #FCD34D',
                                        }}
                                      >
                                        👑 Team Leader
                                      </span>
                                    ) : (
                                      <span
                                        style={{
                                          fontSize: '10.5px',
                                          fontWeight: 600,
                                          padding: '2px 7px',
                                          borderRadius: '6px',
                                          backgroundColor: '#F1F5F9',
                                          color: '#64748B',
                                        }}
                                      >
                                        Candidate #{idx + 1}
                                      </span>
                                    )}
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '3px', flexWrap: 'wrap' }}>
                                    <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontWeight: 600, color: 'var(--color-ink)', backgroundColor: '#F1F5F9', padding: '1px 6px', borderRadius: '4px' }}>
                                      Roll #{student.roll_no}
                                    </span>
                                    {student.email && (
                                      <span style={{ color: '#64748B' }}>
                                        {student.email}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Status Badges & Attendance Segmented Control */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                {isNextShift ? (
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '5px',
                                      fontSize: '11.5px',
                                      fontWeight: 700,
                                      padding: '4px 10px',
                                      borderRadius: '8px',
                                      backgroundColor: '#FEF3C7',
                                      color: '#B45309',
                                      border: '1px solid #FCD34D',
                                    }}
                                  >
                                    <Clock size={13} /> Moved to Next Shift
                                  </span>
                                ) : isAbsentOnly ? (
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '5px',
                                      fontSize: '11.5px',
                                      fontWeight: 700,
                                      padding: '4px 10px',
                                      borderRadius: '8px',
                                      backgroundColor: '#FEE2E2',
                                      color: '#DC2626',
                                      border: '1px solid #FCA5A5',
                                    }}
                                  >
                                    <UserX size={13} /> Marked Absent
                                  </span>
                                ) : hasScore ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    {isMasked ? (
                                      <>
                                        <span
                                          style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '5px',
                                            fontSize: '11.5px',
                                            fontWeight: 700,
                                            padding: '4px 10px',
                                            borderRadius: '8px',
                                            backgroundColor: '#F1F5F9',
                                            color: '#475569',
                                            border: '1px solid #CBD5E1',
                                          }}
                                        >
                                          <CheckCircle2 size={13} color="#059669" /> Recorded ••••
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditingStudentIds((prev) => new Set(prev).add(student.id));
                                            setRevealedStudentIds((prev) => new Set(prev).add(student.id));
                                          }}
                                          style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            padding: '4px 9px',
                                            fontSize: '11.5px',
                                            fontWeight: 700,
                                            borderRadius: '7px',
                                            border: '1px solid #BFDBFE',
                                            backgroundColor: '#EFF6FF',
                                            color: '#1D4ED8',
                                            cursor: 'pointer',
                                          }}
                                          title="Click to edit and view candidate marks"
                                        >
                                          <Edit3 size={12} /> Edit
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <span
                                          style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '5px',
                                            fontSize: '12px',
                                            fontWeight: 800,
                                            padding: '4px 11px',
                                            borderRadius: '8px',
                                            backgroundColor: '#ECFDF5',
                                            color: '#059669',
                                            border: '1px solid #A7F3D0',
                                          }}
                                        >
                                          <CheckCircle2 size={14} /> Score: {current.score} / {maxMarks}
                                        </span>
                                        {scoreRating && (
                                          <span
                                            style={{
                                              fontSize: '11px',
                                              fontWeight: 700,
                                              padding: '3px 8px',
                                              borderRadius: '6px',
                                              backgroundColor: scoreRating.bg,
                                              color: scoreRating.color,
                                              border: `1px solid ${scoreRating.border}`,
                                            }}
                                          >
                                            {scoreRating.label}
                                          </span>
                                        )}
                                        {isStudentSubmitted && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setEditingStudentIds((prev) => {
                                                const next = new Set(prev);
                                                next.delete(student.id);
                                                return next;
                                              });
                                              setRevealedStudentIds((prev) => {
                                                const next = new Set(prev);
                                                next.delete(student.id);
                                                return next;
                                              });
                                            }}
                                            style={{
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              gap: '4px',
                                              padding: '4px 8px',
                                              fontSize: '11px',
                                              fontWeight: 600,
                                              borderRadius: '6px',
                                              border: '1px solid #CBD5E1',
                                              backgroundColor: '#F8FAFC',
                                              color: '#64748B',
                                              cursor: 'pointer',
                                            }}
                                            title="Lock and mask score with dots"
                                          >
                                            <Lock size={11} /> Mask
                                          </button>
                                        )}
                                      </>
                                    )}
                                  </div>
                                ) : (
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '5px',
                                      fontSize: '11px',
                                      fontWeight: 600,
                                      padding: '4px 9px',
                                      borderRadius: '6px',
                                      backgroundColor: '#F1F5F9',
                                      color: '#64748B',
                                    }}
                                  >
                                    <Clock size={12} /> Score Pending
                                  </span>
                                )}

                                {/* Interactive Attendance Segmented Control */}
                                <div style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: '#F1F5F9', padding: '3px', borderRadius: '10px', gap: '2px', border: '1px solid #E2E8F0' }}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setStudentScores({
                                        ...studentScores,
                                        [student.id]: {
                                          ...current,
                                          isAbsent: false,
                                          attendanceStatus: 'present',
                                        },
                                      });
                                    }}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      padding: '4px 9px',
                                      borderRadius: '7px',
                                      fontSize: '11.5px',
                                      fontWeight: isPresent ? 700 : 500,
                                      cursor: 'pointer',
                                      border: 'none',
                                      backgroundColor: isPresent ? '#10B981' : 'transparent',
                                      color: isPresent ? '#FFFFFF' : '#64748B',
                                      transition: 'all 0.15s ease',
                                    }}
                                    title="Student is present and participating"
                                  >
                                    <CheckCircle2 size={12} /> Present
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setStudentScores({
                                        ...studentScores,
                                        [student.id]: {
                                          ...current,
                                          isAbsent: true,
                                          attendanceStatus: 'next_shift',
                                          score: '',
                                          remarks: current.remarks || 'Scheduled for next shift',
                                        },
                                      });
                                    }}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      padding: '4px 9px',
                                      borderRadius: '7px',
                                      fontSize: '11.5px',
                                      fontWeight: isNextShift ? 700 : 500,
                                      cursor: 'pointer',
                                      border: 'none',
                                      backgroundColor: isNextShift ? '#F59E0B' : 'transparent',
                                      color: isNextShift ? '#FFFFFF' : '#64748B',
                                      transition: 'all 0.15s ease',
                                    }}
                                    title="Unable to attend current shift; shift to next shift"
                                  >
                                    <Clock size={12} /> Next Shift
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setStudentScores({
                                        ...studentScores,
                                        [student.id]: {
                                          ...current,
                                          isAbsent: true,
                                          attendanceStatus: 'absent',
                                          score: '',
                                        },
                                      });
                                    }}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      padding: '4px 9px',
                                      borderRadius: '7px',
                                      fontSize: '11.5px',
                                      fontWeight: isAbsentOnly ? 700 : 500,
                                      cursor: 'pointer',
                                      border: 'none',
                                      backgroundColor: isAbsentOnly ? '#EF4444' : 'transparent',
                                      color: isAbsentOnly ? '#FFFFFF' : '#64748B',
                                      transition: 'all 0.15s ease',
                                    }}
                                    title="Mark student absent"
                                  >
                                    <UserX size={12} /> Absent
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Scoring Controls & Feedback Section */}
                            {!current.isAbsent ? (
                              <div
                                style={{
                                  display: 'grid',
                                  gridTemplateColumns: 'minmax(280px, 350px) 1fr',
                                  gap: '20px',
                                  alignItems: 'start',
                                  paddingTop: '12px',
                                  borderTop: '1px solid #F1F5F9',
                                  paddingLeft: '6px',
                                }}
                              >
                                {/* Column 1: Direct Score Input & Quick Preset Buttons */}
                                <div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <label
                                      style={{
                                        fontSize: '12px',
                                        fontWeight: 800,
                                        color: 'var(--color-ink)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        margin: 0,
                                      }}
                                    >
                                      <Target size={14} color="#2563EB" /> Viva Score (0 – {maxMarks})
                                    </label>

                                    {/* Individual Score Mask/Reveal / Edit Mode Indicator */}
                                    {hasScore && (
                                      isMasked ? (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditingStudentIds((prev) => new Set(prev).add(student.id));
                                            setRevealedStudentIds((prev) => new Set(prev).add(student.id));
                                          }}
                                          style={{
                                            background: 'none',
                                            border: 'none',
                                            padding: '2px 6px',
                                            fontSize: '11px',
                                            fontWeight: 700,
                                            color: '#2563EB',
                                            cursor: 'pointer',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                          }}
                                          title="Click to unlock edit mode and view marks"
                                        >
                                          <Edit3 size={12} /> Edit Marks
                                        </button>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditingStudentIds((prev) => {
                                              const next = new Set(prev);
                                              next.delete(student.id);
                                              return next;
                                            });
                                            setRevealedStudentIds((prev) => {
                                              const next = new Set(prev);
                                              next.delete(student.id);
                                              return next;
                                            });
                                          }}
                                          style={{
                                            background: 'none',
                                            border: 'none',
                                            padding: '2px 6px',
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            color: '#64748B',
                                            cursor: 'pointer',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                          }}
                                          title="Lock marks and display dots only"
                                        >
                                          <Lock size={12} /> Lock &amp; Mask
                                        </button>
                                      )
                                    )}
                                  </div>

                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      {/* Numeric Score Box with suffix and privacy dot masking */}
                                      <div style={{ position: 'relative', width: '130px' }}>
                                        <input
                                          type={isMasked ? 'password' : 'text'}
                                          inputMode="decimal"
                                          readOnly={isMasked}
                                          style={{
                                            width: '100%',
                                            height: '42px',
                                            padding: '8px 44px 8px 14px',
                                            fontSize: isMasked ? '20px' : '16px',
                                            fontWeight: 800,
                                            borderRadius: '10px',
                                            border: hasScore
                                              ? isMasked
                                                ? '1.5px solid #CBD5E1'
                                                : '2px solid #2563EB'
                                              : '1.5px solid #CBD5E1',
                                            backgroundColor: isMasked && hasScore ? '#F8FAFC' : '#FFFFFF',
                                            color: 'var(--color-ink)',
                                            letterSpacing: isMasked ? '3px' : 'normal',
                                            outline: 'none',
                                            boxShadow: hasScore && !isMasked ? '0 0 0 3px rgba(37, 99, 235, 0.12)' : 'none',
                                            transition: 'all 0.15s ease',
                                            cursor: isMasked ? 'pointer' : 'text',
                                          }}
                                          value={isMasked && hasScore ? '••••' : current.score}
                                          onClick={() => {
                                            if (isMasked) {
                                              setEditingStudentIds((prev) => new Set(prev).add(student.id));
                                              setRevealedStudentIds((prev) => new Set(prev).add(student.id));
                                            }
                                          }}
                                          onChange={(e) => {
                                            const rawVal = e.target.value;
                                            // Strictly allow numbers and at most 1 decimal point
                                            const clean = rawVal.replace(/[^0-9.]/g, '');
                                            const parts = clean.split('.');
                                            let sanitized = parts[0];
                                            if (parts.length > 1) {
                                              sanitized += '.' + parts.slice(1).join('').slice(0, 1);
                                            }
                                            const num = parseFloat(sanitized);
                                            if (!isNaN(num) && num > maxMarks) {
                                              sanitized = String(maxMarks);
                                            }
                                            setEditingStudentIds((prev) => new Set(prev).add(student.id));
                                            setStudentScores({
                                              ...studentScores,
                                              [student.id]: { ...current, score: sanitized },
                                            });
                                          }}
                                          placeholder={isMasked ? '••••' : '0.0'}
                                        />
                                        <span
                                          style={{
                                            position: 'absolute',
                                            right: '12px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            fontSize: '11.5px',
                                            fontWeight: 700,
                                            color: '#64748B',
                                            pointerEvents: 'none',
                                          }}
                                        >
                                          / {maxMarks}
                                        </span>
                                      </div>

                                      {/* Individual Confirm Score Button */}
                                      {!isMasked && (
                                        <button
                                          type="button"
                                          disabled={!hasScore || savingStudentId === student.id}
                                          onClick={() => handleConfirmSingleScore(student.id)}
                                          style={{
                                            height: '42px',
                                            padding: '0 15px',
                                            borderRadius: '10px',
                                            background: hasScore ? 'linear-gradient(135deg, #1E40AF 0%, #2563EB 100%)' : '#F1F5F9',
                                            color: hasScore ? '#FFFFFF' : '#94A3B8',
                                            border: hasScore ? '1px solid #1E40AF' : '1px solid #CBD5E1',
                                            fontSize: '12px',
                                            fontWeight: 700,
                                            cursor: hasScore ? 'pointer' : 'not-allowed',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '5px',
                                            boxShadow: hasScore ? '0 2px 6px rgba(37, 99, 235, 0.22)' : 'none',
                                            transition: 'all 0.15s ease',
                                          }}
                                          title="Save and safely lock this score so it won't be lost"
                                        >
                                          {savingStudentId === student.id ? (
                                            <>
                                              <RefreshCw size={13} className="animate-spin" /> Saving...
                                            </>
                                          ) : (
                                            <>
                                              <Check size={14} /> Confirm
                                            </>
                                          )}
                                        </button>
                                      )}

                                      {/* Edit button when masked */}
                                      {isMasked && hasScore && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditingStudentIds((prev) => new Set(prev).add(student.id));
                                            setRevealedStudentIds((prev) => new Set(prev).add(student.id));
                                          }}
                                          style={{
                                            height: '42px',
                                            padding: '0 14px',
                                            borderRadius: '10px',
                                            backgroundColor: '#EFF6FF',
                                            color: '#1D4ED8',
                                            border: '1px solid #BFDBFE',
                                            fontSize: '12px',
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '5px',
                                            transition: 'all 0.15s ease',
                                          }}
                                          title="Click to edit and view candidate marks"
                                        >
                                          <Edit3 size={13} /> Edit
                                        </button>
                                      )}

                                      {/* Clear Score Button if present and editing */}
                                      {hasScore && !isMasked && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setStudentScores({
                                              ...studentScores,
                                              [student.id]: { ...current, score: '' },
                                            });
                                          }}
                                          style={{
                                            height: '42px',
                                            background: '#F8FAFC',
                                            border: '1px solid #CBD5E1',
                                            borderRadius: '10px',
                                            padding: '0 12px',
                                            fontSize: '11.5px',
                                            color: '#64748B',
                                            cursor: 'pointer',
                                            fontWeight: 600,
                                            transition: 'all 0.15s ease',
                                          }}
                                          title="Reset candidate score"
                                        >
                                          Reset
                                        </button>
                                      )}
                                    </div>

                                    {/* Quick 1-Tap Preset Pills: ONLY highlight when in active unmasked edit mode */}
                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '3px' }}>
                                      {dynamicPresets.map((val) => {
                                        // CRITICAL: NEVER highlight the preset button when masked/submitted to avoid leaking marks!
                                        const isSelected = !isMasked && isEditing && (current.score === val || current.score === parseFloat(val).toString());
                                        return (
                                          <button
                                            key={val}
                                            type="button"
                                            onClick={() => {
                                              setEditingStudentIds((prev) => new Set(prev).add(student.id));
                                              setRevealedStudentIds((prev) => new Set(prev).add(student.id));
                                              setStudentScores({
                                                ...studentScores,
                                                [student.id]: { ...current, score: val },
                                              });
                                            }}
                                            style={{
                                              padding: '5px 10px',
                                              fontSize: '11.5px',
                                              fontWeight: isSelected ? 800 : 600,
                                              borderRadius: '8px',
                                              border: isSelected ? '1.5px solid #1E40AF' : '1px solid #E2E8F0',
                                              background: isSelected ? 'linear-gradient(135deg, #1E40AF 0%, #2563EB 100%)' : isMasked ? '#F8FAFC' : '#FFFFFF',
                                              color: isSelected ? '#FFFFFF' : isMasked ? '#64748B' : '#334155',
                                              cursor: 'pointer',
                                              transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                                              boxShadow: isSelected ? '0 2px 6px rgba(37, 99, 235, 0.22)' : '0 1px 2px rgba(0,0,0,0.02)',
                                            }}
                                            title={isMasked ? `Set to ${val} (Switches to Edit Mode)` : `Set score to ${val}`}
                                          >
                                            {val}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>

                                {/* Column 2: Individual Remarks & Quick Feedback Suggestions */}
                                <div>
                                  <label
                                    style={{
                                      fontSize: '12px',
                                      fontWeight: 800,
                                      color: 'var(--color-ink)',
                                      marginBottom: '8px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                    }}
                                  >
                                    <MessageSquare size={14} color="#2563EB" /> Viva Remarks &amp; Feedback
                                  </label>

                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <input
                                      type="text"
                                      className="input-field"
                                      style={{
                                        fontSize: '13px',
                                        height: '42px',
                                        padding: '8px 14px',
                                        borderRadius: '10px',
                                        backgroundColor: '#FFFFFF',
                                        border: '1px solid #CBD5E1',
                                      }}
                                      value={current.remarks || ''}
                                      onChange={(e) => {
                                        setStudentScores({
                                          ...studentScores,
                                          [student.id]: { ...current, remarks: e.target.value },
                                        });
                                      }}
                                      placeholder="e.g. Good conceptual clarity, clear presentation on system architecture"
                                    />

                                    {/* Preset Feedback Pills */}
                                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                                      {feedbackPresets.map((preset, pIdx) => {
                                        const isApplied = current.remarks === preset;
                                        return (
                                          <button
                                            key={pIdx}
                                            type="button"
                                            onClick={() => {
                                              setStudentScores({
                                                ...studentScores,
                                                [student.id]: { ...current, remarks: preset },
                                              });
                                            }}
                                            style={{
                                              padding: '4px 9px',
                                              fontSize: '10.5px',
                                              fontWeight: isApplied ? 700 : 500,
                                              borderRadius: '6px',
                                              border: isApplied ? '1px solid #93C5FD' : '1px solid #E2E8F0',
                                              backgroundColor: isApplied ? '#EFF6FF' : '#F8FAFC',
                                              color: isApplied ? '#1D4ED8' : '#475569',
                                              cursor: 'pointer',
                                              transition: 'all 0.15s ease',
                                            }}
                                          >
                                            {preset}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : isNextShift ? (
                              /* Moved to Next Shift Banner inside Card */
                              <div
                                style={{
                                  padding: '14px 18px',
                                  borderRadius: '12px',
                                  backgroundColor: '#FFFBEB',
                                  border: '1.5px dashed #FCD34D',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '10px',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#92400E', fontWeight: 600 }}>
                                    <Clock size={16} color="#D97706" />
                                    <span>Candidate shifted to <strong>Next Shift / Batch</strong>. Score marked pending for next shift evaluation.</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setStudentScores({
                                        ...studentScores,
                                        [student.id]: { ...current, isAbsent: false, attendanceStatus: 'present' },
                                      });
                                    }}
                                    style={{
                                      fontSize: '11.5px',
                                      fontWeight: 700,
                                      padding: '4px 12px',
                                      borderRadius: '6px',
                                      backgroundColor: '#FFFFFF',
                                      color: '#D97706',
                                      border: '1px solid #FCD34D',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    Mark Present
                                  </button>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <input
                                    type="text"
                                    className="input-field"
                                    style={{
                                      fontSize: '12px',
                                      height: '36px',
                                      padding: '6px 12px',
                                      borderRadius: '8px',
                                      backgroundColor: '#FFFFFF',
                                      border: '1px solid #FDE68A',
                                      flex: 1,
                                    }}
                                    value={current.remarks || ''}
                                    onChange={(e) => {
                                      setStudentScores({
                                        ...studentScores,
                                        [student.id]: { ...current, remarks: e.target.value },
                                      });
                                    }}
                                    placeholder="Note/Reason for next shift (e.g. Attending afternoon batch due to morning exam collision)"
                                  />
                                </div>
                              </div>
                            ) : (
                              /* Marked Absent Banner inside Card */
                              <div
                                style={{
                                  padding: '14px 18px',
                                  borderRadius: '12px',
                                  backgroundColor: '#FEF2F2',
                                  border: '1.5px dashed #FCA5A5',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '10px',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#991B1B', fontWeight: 600 }}>
                                    <UserX size={16} color="#DC2626" />
                                    <span>Candidate marked <strong>Absent</strong> for this viva defense phase. Score recorded as null.</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setStudentScores({
                                        ...studentScores,
                                        [student.id]: { ...current, isAbsent: false, attendanceStatus: 'present' },
                                      });
                                    }}
                                    style={{
                                      fontSize: '11.5px',
                                      fontWeight: 700,
                                      padding: '4px 12px',
                                      borderRadius: '6px',
                                      backgroundColor: '#FFFFFF',
                                      color: '#DC2626',
                                      border: '1px solid #FCA5A5',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    Undo Absent
                                  </button>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <input
                                    type="text"
                                    className="input-field"
                                    style={{
                                      fontSize: '12px',
                                      height: '36px',
                                      padding: '6px 12px',
                                      borderRadius: '8px',
                                      backgroundColor: '#FFFFFF',
                                      border: '1px solid #FECACA',
                                      flex: 1,
                                    }}
                                    value={current.remarks || ''}
                                    onChange={(e) => {
                                      setStudentScores({
                                        ...studentScores,
                                        [student.id]: { ...current, remarks: e.target.value },
                                      });
                                    }}
                                    placeholder="Optional note / reason for absence"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Bottom Action Deck */}
                  <div
                    style={{
                      marginTop: '28px',
                      paddingTop: '20px',
                      borderTop: '1px solid var(--color-hairline)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '14px',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedPanelTeam(null)}
                      className="btn btn-outline"
                      style={{ padding: '10px 20px', fontSize: '13px', fontWeight: 600, borderRadius: '10px' }}
                    >
                      <ArrowLeft size={15} /> Back to Assigned Teams
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSubmitScores(selectedPanelPhase || 1)}
                      className="btn btn-primary"
                      disabled={scoringLoading || panelTeamMembers.length === 0}
                      style={{
                        padding: '11px 26px',
                        fontSize: '14px',
                        fontWeight: 700,
                        gap: '8px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #1E40AF 0%, #2563EB 100%)',
                        boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
                      }}
                    >
                      {scoringLoading ? (
                        <>
                          <RefreshCw size={16} className="animate-spin" /> Synchronizing Scores with Database...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={17} /> Save &amp; Submit Scores for Phase {selectedPanelPhase}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* ------------------------------------------------------------- */
              /* VIEW B: ASSIGNED PANELS & READY TEAMS HUB (when no team open) */
              /* ------------------------------------------------------------- */
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
                  <>
                    {/* Search Bar for Assigned Teams */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                      <div className="search-input-wrapper" style={{ flex: 1, minWidth: '280px', maxWidth: '520px' }}>
                        <input
                          type="text"
                          className="input-field"
                          placeholder="Search assigned teams by team name, number, or supervisor..."
                          value={panelTeamSearch}
                          onChange={(e) => setPanelTeamSearch(e.target.value)}
                        />
                        <div className="search-icon">
                          <Search size={14} />
                        </div>
                        {panelTeamSearch && (
                          <button
                            type="button"
                            onClick={() => setPanelTeamSearch('')}
                            className="clear-btn"
                            aria-label="Clear search"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>

                      <div style={{ fontSize: '12.5px', color: 'var(--color-text-muted)' }}>
                        Assigned to <strong>{panelData.length} Evaluation Panels</strong>
                      </div>
                    </div>

                    {/* Panels Grid */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {panelData.map((p) => {
                        const matchingTeams = (p.evaluableTeams || []).filter((t: any) => {
                          if (!panelTeamSearch.trim()) return true;
                          const q = panelTeamSearch.toLowerCase();
                          return (
                            (t.team_name || '').toLowerCase().includes(q) ||
                            (t.program || '').toLowerCase().includes(q) ||
                            String(t.team_number || '').includes(q) ||
                            (t.supervisor?.name || '').toLowerCase().includes(q) ||
                            (t.problemStatement?.title || '').toLowerCase().includes(q)
                          );
                        });

                        return (
                          <div
                            key={p.id}
                            className="card"
                            style={{
                              padding: '22px',
                              backgroundColor: '#FFFFFF',
                              borderRadius: '16px',
                              border: '1px solid var(--color-hairline)',
                              boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                            }}
                          >
                            {/* Panel Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px', paddingBottom: '14px', borderBottom: '1px solid var(--color-hairline)' }}>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                  <span className="badge badge-brand" style={{ fontSize: '11px', fontWeight: 800 }}>
                                    Phase {p.phase_number} Evaluation
                                  </span>
                                  {p.isPhaseLive ? (
                                    <span className="badge badge-success" style={{ fontSize: '11px', fontWeight: 700 }}>
                                      ● Live Evaluation Active
                                    </span>
                                  ) : (
                                    <span className="badge badge-neutral" style={{ fontSize: '11px' }}>
                                      Scheduled (Not Live)
                                    </span>
                                  )}
                                </div>
                                <h3 style={{ fontSize: '19px', fontWeight: 800, color: 'var(--color-ink)' }}>
                                  {p.panel_name}
                                </h3>
                                <div style={{ fontSize: '12.5px', color: 'var(--color-text-muted)', marginTop: '2px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                  <span>Venue: <strong>{p.room_number || 'Room 402'} ({p.academic_block || 'AB10'})</strong></span>
                                  {p.time_window && <span>• Shift: <strong>{p.time_window}</strong></span>}
                                  {p.range && <span>• Teams: <strong>{p.range}</strong></span>}
                                </div>
                              </div>

                              <div style={{ textAlign: 'right' }}>
                                <span className="badge badge-neutral" style={{ fontSize: '12px', fontWeight: 700 }}>
                                  {matchingTeams.length} Cleared Teams Ready
                                </span>
                              </div>
                            </div>

                            {/* Teams Grid inside Panel */}
                            {matchingTeams.length === 0 ? (
                              <div style={{ padding: '24px', textAlign: 'center', backgroundColor: '#F8FAFC', borderRadius: '10px', color: 'var(--color-text-muted)', fontSize: '12.5px' }}>
                                {panelTeamSearch
                                  ? `No teams in this panel matched "${panelTeamSearch}"`
                                  : 'No teams currently cleared for evaluation in this live phase.'}
                              </div>
                            ) : (
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
                                {matchingTeams.map((t: any) => (
                                  <div
                                    key={t.id}
                                    style={{
                                      padding: '16px',
                                      borderRadius: '12px',
                                      border: '1px solid var(--color-hairline)',
                                      backgroundColor: '#FFFFFF',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      justifyContent: 'space-between',
                                      gap: '12px',
                                      transition: 'all 0.15s ease',
                                      boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                                    }}
                                  >
                                    <div>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                                        <div>
                                          <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-ink)' }}>
                                            {t.team_name}
                                          </div>
                                          <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted)' }}>
                                            {t.program || 'Computer Science & Engineering'} • Team #{t.team_number || ''}
                                          </div>
                                        </div>
                                        <span className="badge badge-success" style={{ fontSize: '10px', fontWeight: 700 }}>
                                          Cleared
                                        </span>
                                      </div>

                                      {/* Topic preview */}
                                      {t.problemStatement?.title && (
                                        <div style={{ fontSize: '12px', color: 'var(--color-ink)', fontWeight: 600, marginBottom: '8px', lineHeight: '1.4' }}>
                                          {t.problemStatement.title}
                                        </div>
                                      )}

                                      <div style={{ fontSize: '11.5px', backgroundColor: '#F8FAFC', padding: '6px 10px', borderRadius: '6px', border: '1px solid #F1F5F9', color: 'var(--color-text-muted)' }}>
                                        Supervisor: <strong>{t.supervisor?.name || 'Assigned Mentor'}</strong>
                                      </div>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => handleOpenPanelTeamScoring(t, p.phase_number)}
                                      className="btn btn-primary"
                                      style={{
                                        width: '100%',
                                        padding: '9px 14px',
                                        fontSize: '13px',
                                        fontWeight: 700,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px',
                                        borderRadius: '8px',
                                      }}
                                    >
                                      <Award size={15} /> Open Scoring Page <ArrowRight size={14} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* SCHEDULE MODAL */}
      {scheduleModalOpen && (
        <div
          className="modal-overlay-responsive"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            padding: '16px',
            overflowY: 'auto',
          }}
          onClick={() => setScheduleModalOpen(false)}
        >
          <div
            className="card animate-scale-in modal-card-responsive"
            style={{
              width: '100%',
              maxWidth: '460px',
              maxHeight: 'min(90vh, 600px)',
              overflowY: 'auto',
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
              border: '1px solid var(--color-border)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
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
          className="modal-overlay-responsive"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            padding: '16px',
            overflowY: 'auto',
          }}
          onClick={() => setLogModalOpen(false)}
        >
          <div
            className="card animate-scale-in modal-card-responsive"
            style={{
              width: '100%',
              maxWidth: '520px',
              maxHeight: 'min(90vh, 640px)',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
              border: '1px solid var(--color-border)',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ marginBottom: '14px', flexShrink: 0 }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>
                Log Meet {logMeetingIndex} Attendance & Notes
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                Mark student attendance and enter brief minutes of meeting.
              </p>
            </div>
            
            <form onSubmit={handleLogSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <div style={{ marginBottom: '14px' }}>
                <label className="input-label" style={{ marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Attendance Roster</span>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                    {attendanceList.filter(a => a.isPresent).length} / {attendanceList.length} Present
                  </span>
                </label>
                <div 
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '6px',
                    maxHeight: '180px',
                    overflowY: 'auto',
                    paddingRight: '4px',
                  }}
                >
                  {attendanceList.map((att, idx) => (
                    <div
                      key={att.studentId}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        backgroundColor: att.isPresent ? '#F0FDF4' : 'var(--color-canvas-soft)',
                        border: `1px solid ${att.isPresent ? '#BBF7D0' : 'var(--color-hairline)'}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span style={{ fontSize: '13px', fontWeight: 600, color: att.isPresent ? '#15803D' : 'var(--color-ink)' }}>
                        {att.name}
                      </span>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 600, color: att.isPresent ? '#15803D' : 'var(--color-text-muted)' }}>
                        <input
                          type="checkbox"
                          checked={att.isPresent}
                          onChange={(e) => {
                            const updated = [...attendanceList];
                            updated[idx].isPresent = e.target.checked;
                            setAttendanceList(updated);
                          }}
                          style={{ accentColor: '#16A34A', width: '15px', height: '15px' }}
                        />
                        <span>{att.isPresent ? 'Present' : 'Absent'}</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="input-group" style={{ marginBottom: '16px' }}>
                <label className="input-label">Discussion Summary & Progress Directives</label>
                <textarea
                  className="textarea-field"
                  rows={3}
                  value={meetingSummary}
                  onChange={(e) => setMeetingSummary(e.target.value)}
                  placeholder="Record guidance notes and task directives for next meeting..."
                  required
                  style={{ minHeight: '70px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', paddingTop: '8px' }}>
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
