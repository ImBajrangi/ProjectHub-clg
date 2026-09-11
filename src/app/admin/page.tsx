'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield,
  Users,
  Award,
  Layers,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Plus,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  MapPin,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  UserCheck,
  Check,
  FileCode,
  FileText,
  Sparkles,
  Copy,
  Send,
  Edit3,
  Trash2,
  Phone,
  Mail,
  Building,
  Briefcase,
  GraduationCap,
  Zap,
  Target,
  PlusCircle,
  Bookmark,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import LoadingScreen from '@/components/LoadingScreen';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [adminData, setAdminData] = useState<any>(null);

  // Segmented Navigation: Overview, Teams & Students, Supervisors, Panels & Shifts, Defaulting
  const [activeTab, setActiveTab] = useState<'overview' | 'teams' | 'supervisors' | 'panels' | 'defaulting'>('overview');

  // Teams & Students Directory State
  const [searchQuery, setSearchQuery] = useState('');
  const [programFilter, setProgramFilter] = useState<'all' | 'BCA' | 'BCA - DS'>('all');
  const [phaseClearanceFilter, setPhaseClearanceFilter] = useState<'all' | 'p1' | 'p2' | 'p3'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTeamModal, setSelectedTeamModal] = useState<any>(null);
  const PAGE_SIZE = 10;

  // Supervisors Directory State
  const [supervisorSearch, setSupervisorSearch] = useState('');
  const [selectedSupervisorModal, setSelectedSupervisorModal] = useState<any>(null);

  // Panels Directory State
  const [panelPhaseFilter, setPanelPhaseFilter] = useState<1 | 2 | 3>(1);
  const [panelSearch, setPanelSearch] = useState('');

  // Interactive Visual Panel Builder State
  const [createPanelModalOpen, setCreatePanelModalOpen] = useState(false);
  const [panelFormPhase, setPanelFormPhase] = useState<1 | 2 | 3>(1);
  const [panelFormName, setPanelFormName] = useState('');
  const [panelFormRangeStart, setPanelFormRangeStart] = useState<number>(1);
  const [panelFormRangeEnd, setPanelFormRangeEnd] = useState<number>(10);
  const [panelFormSelectedJudges, setPanelFormSelectedJudges] = useState<string[]>([]);
  const [panelFormShift, setPanelFormShift] = useState('Batch 1: Morning (08:00 AM - 10:00 AM)');
  const [panelFormCustomShift, setPanelFormCustomShift] = useState('');
  const [panelFormRoom, setPanelFormRoom] = useState('Room 402');
  const [panelFormCustomRoom, setPanelFormCustomRoom] = useState('');
  const [panelFormDate, setPanelFormDate] = useState('2026-09-15');
  const [panelFormLoading, setPanelFormLoading] = useState(false);
  const [panelFormError, setPanelFormError] = useState<string | null>(null);
  const [judgeSearchQuery, setJudgeSearchQuery] = useState('');

  // JSON Batch Modal State
  const [jsonModalOpen, setJsonModalOpen] = useState(false);
  const [targetPhase, setTargetPhase] = useState<1 | 2 | 3>(1);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [roundJsonMap, setRoundJsonMap] = useState<Record<number, string>>({ 1: '', 2: '', 3: '' });
  
  // Dedicated Original Clock Timings (24-hour format bound to native HTML5 time pickers)
  const [shift1StartTime, setShift1StartTime] = useState('08:00');
  const [shift1EndTime, setShift1EndTime] = useState('10:00');
  const [shift2StartTime, setShift2StartTime] = useState('12:00');
  const [shift2EndTime, setShift2EndTime] = useState('14:00');

  const format24To12 = (t: string): string => {
    if (!t) return '';
    const [hh, mm] = t.split(':');
    let h = parseInt(hh, 10);
    const m = mm || '00';
    if (isNaN(h)) return t;
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    const hStr = h < 10 ? `0${h}` : `${h}`;
    return `${hStr}:${m} ${ampm}`;
  };

  const getShift1Formatted = () => `${format24To12(shift1StartTime)} - ${format24To12(shift1EndTime)}`;
  const getShift2Formatted = () => `${format24To12(shift2StartTime)} - ${format24To12(shift2EndTime)}`;

  // Direct Unified JSON Input
  const [panelsSubmitLoading, setPanelsSubmitLoading] = useState(false);
  const [panelsMessage, setPanelsMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // Admin Student Score Edit Modal State
  const [scoreEditModalOpen, setScoreEditModalOpen] = useState(false);
  const [editingStudentData, setEditingStudentData] = useState<{
    teamId: string;
    teamName: string;
    studentId: string;
    studentName: string;
    rollNo: string;
    phaseNumber: 1 | 2 | 3;
    currentScore: string;
    isAbsent: boolean;
    remarks: string;
  } | null>(null);
  const [scoreEditLoading, setScoreEditLoading] = useState(false);
  const [scoreEditMessage, setScoreEditMessage] = useState<string | null>(null);

  // Lock background scroll and handle Escape key to close modals
  useEffect(() => {
    const isAnyModalOpen = jsonModalOpen || selectedTeamModal || createPanelModalOpen || scoreEditModalOpen || selectedSupervisorModal;
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setSelectedTeamModal(null);
          setSelectedSupervisorModal(null);
          setJsonModalOpen(false);
          setCreatePanelModalOpen(false);
          setScoreEditModalOpen(false);
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
  }, [jsonModalOpen, selectedTeamModal, createPanelModalOpen, scoreEditModalOpen, selectedSupervisorModal]);

  const loadAdminData = async () => {
    try {
      const authRes = await fetch('/api/auth/me');
      if (!authRes.ok) {
        router.push('/login');
        return;
      }
      const authData = await authRes.json();
      if (!authData.authenticated || !authData.user) {
        router.push('/login');
        return;
      }
      if (authData.user.role !== 'admin') {
        router.push(authData.user.role === 'supervisor' ? '/dashboard/faculty' : '/dashboard/leader');
        return;
      }
      setCurrentUser(authData.user);

      const res = await fetch('/api/admin');
      if (res.ok) {
        const data = await res.json();
        setAdminData(data);

        // Update selectedTeamModal if currently open to reflect updated scores
        if (selectedTeamModal) {
          const freshTeam = data.teams.find((t: any) => t.id === selectedTeamModal.id);
          if (freshTeam) setSelectedTeamModal(freshTeam);
        }
      }
    } catch {
      // Ignore network errors
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleTogglePhaseLive = async (phaseNumber: 1 | 2 | 3, currentLive: boolean) => {
    try {
      const res = await fetch('/api/phases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_live',
          phaseNumber,
          isLive: !currentLive,
        }),
      });

      if (res.ok) {
        loadAdminData();
      }
    } catch {
      // Ignore network errors
    }
  };

  // Submit JSON 1: Batch Panels
  const handleBatchPanelsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPanelsMessage(null);
    setPanelsSubmitLoading(true);

    const jsonToSubmit = roundJsonMap[targetPhase] || '';

    try {
      const res = await fetch('/api/panels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'batch_json_panels',
          phaseNumber: targetPhase,
          panelsData: jsonToSubmit,
          shift1Timing: `Batch 1: Morning (${getShift1Formatted()})`,
          shift2Timing: `Batch 2: Afternoon (${getShift2Formatted()})`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setPanelsMessage({ type: 'error', text: data.error || 'Failed to assign panels' });
      } else {
        setPanelsMessage({ type: 'success', text: data.message });
        loadAdminData();
      }
    } catch (err: any) {
      setPanelsMessage({ type: 'error', text: err.message || 'Error occurred' });
    } finally {
      setPanelsSubmitLoading(false);
    }
  };

  // Interactive Visual Panel Creation
  const handleCreateVisualPanel = async (e: React.FormEvent) => {
    e.preventDefault();
    setPanelFormError(null);
    setPanelFormLoading(true);

    if (panelFormSelectedJudges.length === 0) {
      setPanelFormError('Please select at least one faculty judge for this panel.');
      setPanelFormLoading(false);
      return;
    }

    if (panelFormRangeStart > panelFormRangeEnd) {
      setPanelFormError('Range Start must be less than or equal to Range End.');
      setPanelFormLoading(false);
      return;
    }

    const finalShift = panelFormShift === 'Custom' ? panelFormCustomShift : panelFormShift;
    const finalRoom = panelFormRoom === 'Custom' ? panelFormCustomRoom : panelFormRoom;

    try {
      const res = await fetch('/api/panels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          panelName: panelFormName || `Panel ${panelFormRangeStart}-${panelFormRangeEnd}`,
          phaseNumber: panelFormPhase,
          teamRangeStart: Number(panelFormRangeStart),
          teamRangeEnd: Number(panelFormRangeEnd),
          supervisorIds: panelFormSelectedJudges,
          schedule: {
            date: panelFormDate,
            timeWindow: finalShift,
            academicBlock: 'Academic Block AB10',
            roomNumber: finalRoom.startsWith('Room') ? finalRoom : `Room ${finalRoom}`,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setPanelFormError(data.error || 'Failed to create panel.');
      } else {
        setCreatePanelModalOpen(false);
        setPanelFormName('');
        setPanelFormSelectedJudges([]);
        loadAdminData();
      }
    } catch (err: any) {
      setPanelFormError(err.message || 'Error creating panel.');
    } finally {
      setPanelFormLoading(false);
    }
  };

  // Delete Panel
  const handleDeletePanel = async (panelId: string, panelName: string) => {
    if (!confirm(`Are you sure you want to delete ${panelName}?`)) return;

    try {
      const res = await fetch('/api/panels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_panel',
          panelId,
        }),
      });

      if (res.ok) {
        loadAdminData();
      } else {
        const data = await res.json();
        setPanelFormError(data.error || 'Failed to delete panel');
      }
    } catch (e: any) {
      setPanelFormError(e.message || 'Error deleting panel');
    }
  };

  // Open Score Editor Modal
  const handleOpenScoreEditor = (team: any, student: any, phaseNum: 1 | 2 | 3) => {
    const evalData = student[`phase${phaseNum}`];
    setEditingStudentData({
      teamId: team.id,
      teamName: team.team_name,
      studentId: student.id,
      studentName: student.full_name,
      rollNo: student.roll_no,
      phaseNumber: phaseNum,
      currentScore: evalData?.score !== null && evalData?.score !== undefined ? String(evalData.score) : '',
      isAbsent: evalData ? evalData.isAbsent : false,
      remarks: evalData?.remarks || '',
    });
    setScoreEditMessage(null);
    setScoreEditModalOpen(true);
  };

  // Submit Admin Score Edit
  const handleSubmitScoreEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudentData) return;

    setScoreEditLoading(true);
    setScoreEditMessage(null);

    try {
      const res = await fetch('/api/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'admin_edit_score',
          phaseNumber: editingStudentData.phaseNumber,
          teamId: editingStudentData.teamId,
          studentId: editingStudentData.studentId,
          score: editingStudentData.isAbsent ? null : editingStudentData.currentScore,
          isAbsent: editingStudentData.isAbsent,
          remarks: editingStudentData.remarks || 'Updated by Project Incharge',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setScoreEditMessage(`Error: ${data.error || 'Failed to update score'}`);
      } else {
        setScoreEditMessage('Score updated successfully.');
        setTimeout(() => {
          setScoreEditModalOpen(false);
          loadAdminData();
        }, 600);
      }
    } catch (err: any) {
      setScoreEditMessage(`Error: ${err.message}`);
    } finally {
      setScoreEditLoading(false);
    }
  };

  if (loading) {
    return <LoadingScreen label="Loading administration portal..." />;
  }

  const summary = adminData?.summary || {};
  const teams = adminData?.teams || [];
  const supervisors = adminData?.supervisors || [];
  const phases = adminData?.phases || [];
  const panels = adminData?.panels || [];

  // Filtered teams for Tab 2 (Universal Search across team name, code, supervisor, leader, students roll/name, problem statement)
  const filteredTeams = teams.filter((t: any) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      t.team_name.toLowerCase().includes(q) ||
      t.team_code.toLowerCase().includes(q) ||
      (t.supervisor?.name && t.supervisor.name.toLowerCase().includes(q)) ||
      (t.leader?.name && t.leader.name.toLowerCase().includes(q)) ||
      (t.problemStatement?.title && t.problemStatement.title.toLowerCase().includes(q)) ||
      t.students?.some(
        (s: any) =>
          s.full_name.toLowerCase().includes(q) ||
          s.roll_no.toLowerCase().includes(q) ||
          (s.mobile && s.mobile.includes(q))
      );

    const matchesProgram =
      programFilter === 'all' ||
      (programFilter === 'BCA' && t.program === 'BCA') ||
      (programFilter === 'BCA - DS' && t.program.includes('DS'));

    const matchesClearance =
      phaseClearanceFilter === 'all' ||
      (phaseClearanceFilter === 'p1' && t.phase1_approved) ||
      (phaseClearanceFilter === 'p2' && t.phase2_approved) ||
      (phaseClearanceFilter === 'p3' && t.phase3_approved);

    return matchesSearch && matchesProgram && matchesClearance;
  });

  const totalPages = Math.ceil(filteredTeams.length / PAGE_SIZE) || 1;
  const paginatedTeams = filteredTeams.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Filtered supervisors for Tab 3
  const filteredSupervisors = supervisors.filter((s: any) => {
    const q = supervisorSearch.toLowerCase().trim();
    return (
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.phone.toLowerCase().includes(q) ||
      s.assignedTeams?.some((t: any) => t.team_name.toLowerCase().includes(q) || t.team_code.toLowerCase().includes(q))
    );
  });

  // Filtered panels for Tab 4
  const filteredPanels = panels.filter((p: any) => {
    const matchesPhase = p.phase_number === panelPhaseFilter;
    const q = panelSearch.toLowerCase().trim();
    const matchesQuery =
      !q ||
      p.panel_name.toLowerCase().includes(q) ||
      (p.room_number && p.room_number.toLowerCase().includes(q)) ||
      (p.time_window && p.time_window.toLowerCase().includes(q)) ||
      p.judges?.some((j: any) => j.full_name?.toLowerCase().includes(q) || j.email?.toLowerCase().includes(q));

    return matchesPhase && matchesQuery;
  });

  // Defaulting teams for Tab 5
  const defaultingTeams = teams.filter((t: any) => t.isDefaulting);

  // Dynamic Simplified Example JSON & AI Prompt Generator per Round
  const getExampleJsonForPhase = (_phase: number) => {
    return `[
  {
    "panel_number": 1,
    "faculty_employee_ids": ["EMP101", "EMP104"],
    "shift": 1,
    "team_range_start": 1,
    "team_range_end": 12,
    "room_number": "Room 402"
  },
  {
    "panel_number": 2,
    "faculty_employee_ids": ["EMP102"],
    "shift": 2,
    "team_range_start": 13,
    "team_range_end": 24,
    "room_number": "Room 405"
  },
  {
    "panel_number": 3,
    "faculty_employee_ids": ["EMP103", "EMP106"],
    "shift": 1,
    "team_range_start": 25,
    "team_range_end": 36,
    "room_number": "Seminar Hall 1"
  }
]`;
  };

  const getAiPromptForPhase = (phase: number) => {
    const roundName = phase === 1 ? 'Round 1 (Phase 1 • 20 Marks)' : phase === 2 ? 'Round 2 (Phase 2 • 40 Marks)' : 'Round 3 (Final Defense • 40 Marks)';
    return `Please convert the provided faculty panel and team allocation Excel sheet for ${roundName} into a clean raw JSON array matching this exact simple schema for ProjectHub:

[
  {
    "panel_number": 1,
    "faculty_employee_ids": ["EMP101", "EMP104"],
    "shift": 1,
    "team_range_start": 1,
    "team_range_end": 12,
    "room_number": "Room 402"
  },
  {
    "panel_number": 2,
    "faculty_employee_ids": ["EMP102"],
    "shift": 2,
    "team_range_start": 13,
    "team_range_end": 24,
    "room_number": "Room 405"
  }
]

Field Rules:
1. 'panel_number': Integer panel number (1, 2, 3...).
2. 'faculty_employee_ids': Array or comma-separated list of faculty Employee IDs (1 or more per panel).
3. 'shift': 1 (Shift 1 / Morning) or 2 (Shift 2 / Afternoon).
4. 'team_range_start' & 'team_range_end': Integer team numbers assigned to this panel.
5. 'room_number': Room number in AB10 (e.g. "Room 402", "Room 405", "Seminar Hall 1").
Output ONLY the raw valid JSON array.`;
  };

  return (
    <div className="page-fade-in" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-canvas)' }}>
      <Navbar user={currentUser} />

      <main className="container" style={{ flex: 1, paddingBottom: '60px' }}>
        {/* Page Title & Navigation */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
            <div>
              <span className="badge badge-neutral" style={{ marginBottom: '8px' }}>
                <Shield size={12} /> Project Incharge Administration
              </span>
              <h1 style={{ fontSize: '30px', fontWeight: 800, letterSpacing: '-0.03em' }}>
                Academic Operations Hub
              </h1>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '13.5px', marginTop: '4px' }}>
                Governance across 102 project teams, 601 students, and 23 faculty mentors.
              </p>
            </div>

            {/* Quick Actions (Responsive: Desktop side-by-side, Mobile 2-column grid) */}
            <div className="admin-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  setCreatePanelModalOpen(true);
                  setPanelFormError(null);
                }}
                className="btn btn-primary"
                style={{ padding: '9px 18px', fontSize: '13px', fontWeight: 600, gap: '6px', borderRadius: '8px' }}
              >
                <Plus size={15} /> Assign New Panel
              </button>

              <button
                onClick={() => {
                  setJsonModalOpen(true);
                  setPanelsMessage(null);
                }}
                className="btn btn-outline"
                style={{ padding: '9px 18px', fontSize: '13px', fontWeight: 600, gap: '6px', borderRadius: '8px' }}
              >
                <FileCode size={15} /> Batch JSON Import
              </button>
            </div>
          </div>

          {/* Segmented Navigation Bar */}
          <div className="segmented-control" style={{ width: '100%', justifyContent: 'flex-start', overflowX: 'auto' }}>
            <button
              className={`segmented-pill ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview & Calendar
            </button>
            <button
              className={`segmented-pill ${activeTab === 'teams' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('teams');
                setCurrentPage(1);
              }}
            >
              Teams & Students ({teams.length})
            </button>
            <button
              className={`segmented-pill ${activeTab === 'supervisors' ? 'active' : ''}`}
              onClick={() => setActiveTab('supervisors')}
            >
              All Supervisors ({supervisors.length})
            </button>
            <button
              className={`segmented-pill ${activeTab === 'panels' ? 'active' : ''}`}
              onClick={() => setActiveTab('panels')}
            >
              Panels & Shifts ({panels.length})
            </button>
            <button
              className={`segmented-pill ${activeTab === 'defaulting' ? 'active' : ''}`}
              onClick={() => setActiveTab('defaulting')}
            >
              Defaulting Audit ({defaultingTeams.length})
            </button>
          </div>
        </div>

        {/* =================================================================== */}
        {/* TAB 1: OVERVIEW & LIVE CALENDAR                                     */}
        {/* =================================================================== */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* 4 Metric Cards */}
            <div className="landing-stats-grid">
              <div className="landing-stat-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', textAlign: 'left', padding: '16px 18px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Project Teams
                  </span>
                  <div style={{ width: '28px', height: '28px', borderRadius: '7px', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Layers size={15} />
                  </div>
                </div>
                <div style={{ marginTop: '8px' }}>
                  <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-ink)', lineHeight: 1 }}>
                    {summary.totalTeams || 102}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', marginTop: '4px', fontWeight: 500 }}>
                    {summary.totalStudents || 601} Students Enrolled
                  </div>
                </div>
              </div>

              <div className="landing-stat-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', textAlign: 'left', padding: '16px 18px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Team Leaders
                  </span>
                  <div style={{ width: '28px', height: '28px', borderRadius: '7px', backgroundColor: '#F0FDF4', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <UserCheck size={15} />
                  </div>
                </div>
                <div style={{ marginTop: '8px' }}>
                  <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-ink)', lineHeight: 1 }}>
                    {summary.claimedLeaders || 0}
                  </div>
                  <div style={{ fontSize: '11.5px', color: summary.unclaimedLeaders > 0 ? '#DC2626' : '#16A34A', marginTop: '4px', fontWeight: 600 }}>
                    {summary.unclaimedLeaders > 0 ? `${summary.unclaimedLeaders} Awaiting Election` : 'All Leaders Elected'}
                  </div>
                </div>
              </div>

              <div className="landing-stat-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', textAlign: 'left', padding: '16px 18px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Faculty Mentors
                  </span>
                  <div style={{ width: '28px', height: '28px', borderRadius: '7px', backgroundColor: '#FAF5FF', color: '#9333EA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={15} />
                  </div>
                </div>
                <div style={{ marginTop: '8px' }}>
                  <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-ink)', lineHeight: 1 }}>
                    {summary.totalSupervisors || 23}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', marginTop: '4px', fontWeight: 500 }}>
                    {summary.totalMeetings || 0} Meetings Logged
                  </div>
                </div>
              </div>

              <div className="landing-stat-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', textAlign: 'left', padding: '16px 18px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Defaulting Teams
                  </span>
                  <div style={{ width: '28px', height: '28px', borderRadius: '7px', backgroundColor: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AlertTriangle size={15} />
                  </div>
                </div>
                <div style={{ marginTop: '8px' }}>
                  <div style={{ fontSize: '32px', fontWeight: 800, color: defaultingTeams.length > 0 ? '#DC2626' : 'var(--color-ink)', lineHeight: 1 }}>
                    {defaultingTeams.length}
                  </div>
                  <div style={{ fontSize: '11.5px', color: defaultingTeams.length > 0 ? '#B91C1C' : '#16A34A', marginTop: '4px', fontWeight: 600 }}>
                    {defaultingTeams.length > 0 ? 'Action Required' : '0 Compliance Issues'}
                  </div>
                </div>
              </div>
            </div>

            {/* Top Official Schedule Banner (Executive Visual Roadmap) */}
            <div
              className="card"
              style={{
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '18px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              {/* Header Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      backgroundColor: '#EFF6FF',
                      color: '#2563EB',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid #DBEAFE',
                      flexShrink: 0,
                    }}
                  >
                    <Calendar size={18} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-ink)', letterSpacing: '-0.01em', margin: 0 }}>
                      Official Academic Evaluation Calendar &amp; Milestones
                    </h4>
                    <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                      Odd Semester 2026–27 • Central Department of Computer Applications
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <span className="badge" style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', fontSize: '11px', fontWeight: 700 }}>
                    Total: 100 Marks
                  </span>
                  <span className="badge" style={{ backgroundColor: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA', fontSize: '11px', fontWeight: 700 }}>
                    Mid-Terms: 28-Sep to 07-Oct
                  </span>
                </div>
              </div>

              {/* 4-Step Milestone Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px' }}>
                {/* Milestone 1 */}
                <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#2563EB', textTransform: 'uppercase' }}>Round 1</span>
                    <span className="badge" style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8', fontSize: '9.5px', padding: '1px 5px', fontWeight: 700 }}>20 Marks</span>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-ink)' }}>19-Sep-2026</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>30% Coding / Ideation Approval</div>
                </div>

                {/* Milestone 2: Mid-Exams Break */}
                <div style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '8px', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#B45309', textTransform: 'uppercase' }}>Exams Break</span>
                    <span className="badge" style={{ backgroundColor: '#FEF3C7', color: '#92400E', fontSize: '9.5px', padding: '1px 5px', fontWeight: 700 }}>University</span>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#92400E' }}>28-Sep to 07-Oct</div>
                  <div style={{ fontSize: '11px', color: '#B45309' }}>Mid-Term Examinations</div>
                </div>

                {/* Milestone 3 */}
                <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>Round 2</span>
                    <span className="badge" style={{ backgroundColor: '#ECFDF5', color: '#047857', fontSize: '9.5px', padding: '1px 5px', fontWeight: 700 }}>40 Marks</span>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-ink)' }}>17-Oct-2026</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>70% Coding / Prototype Demo</div>
                </div>

                {/* Milestone 4 */}
                <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#7C3AED', textTransform: 'uppercase' }}>Final Defense</span>
                    <span className="badge" style={{ backgroundColor: '#F5F3FF', color: '#6D28D9', fontSize: '9.5px', padding: '1px 5px', fontWeight: 700 }}>40 Marks</span>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-ink)' }}>20-Nov-2026</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Report + Certificate + Defense</div>
                </div>
              </div>
            </div>

            {/* Presentation Phases Live Controls */}
            <div className="card">
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Milestone Presentation Calendar</h3>
                <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                  Activate phases when evaluation rounds commence. Panels can only score teams during live phases.
                </p>
              </div>

              <div className="grid-cols-3">
                {phases.map((ph: any) => {
                  const targetDate =
                    ph.target_date ||
                    (ph.phase_number === 1 ? '19-Sep' : ph.phase_number === 2 ? '17-Oct' : 'Final Defense');
                  const marks = ph.marks_weightage || (ph.phase_number === 1 ? 20 : ph.phase_number === 2 ? 40 : 40);
                  const deliverable =
                    ph.deliverables ||
                    (ph.phase_number === 1
                      ? '30% Coding / Approval & Ideation'
                      : ph.phase_number === 2
                      ? '70% Coding / Prototype Demo'
                      : 'Report + Certificate + Synopsis');

                  return (
                    <div
                      key={ph.id}
                      style={{
                        backgroundColor: ph.is_live ? 'var(--color-canvas-soft)' : 'var(--color-canvas)',
                        border: ph.is_live ? '2px solid var(--color-ink)' : '1px solid var(--color-hairline)',
                        borderRadius: 'var(--rounded-sm)',
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: ph.is_live ? '0 4px 12px rgba(0,0,0,0.06)' : 'none',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <span className="badge badge-neutral" style={{ fontSize: '11px', fontWeight: 700 }}>
                            Phase {ph.phase_number}
                          </span>
                          {ph.is_live ? (
                            <span className="badge badge-success" style={{ fontSize: '11px', fontWeight: 700 }}>
                              ● Live Active
                            </span>
                          ) : (
                            <span className="badge badge-neutral" style={{ fontSize: '11px' }}>Inactive</span>
                          )}
                        </div>

                        {/* Date & Marks Chips */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: '#EFF6FF',
                              color: '#1D4ED8',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Calendar size={11} /> {targetDate}
                          </span>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: '#ECFDF5',
                              color: '#047857',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Award size={11} /> {marks} Marks
                          </span>
                        </div>

                        <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px' }}>{ph.phase_name}</h4>
                        
                        <div
                          style={{
                            fontSize: '11.5px',
                            fontWeight: 600,
                            color: 'var(--color-ink)',
                            backgroundColor: 'var(--color-canvas-soft)',
                            padding: '6px 8px',
                            borderRadius: '4px',
                            marginBottom: '10px',
                            border: '1px solid var(--color-hairline)',
                          }}
                        >
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                            <Bookmark size={12} color="#2563EB" />
                            <span>Deliverable: {deliverable}</span>
                          </span>
                        </div>

                        <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
                          {ph.description}
                        </p>
                      </div>

                      <button
                        onClick={() => handleTogglePhaseLive(ph.phase_number, ph.is_live)}
                        className={ph.is_live ? 'btn btn-outline' : 'btn btn-primary'}
                        style={{ width: '100%', fontSize: '13px' }}
                      >
                        {ph.is_live ? 'End Live Session' : `Set Phase ${ph.phase_number} to LIVE`}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 2: TEAMS & STUDENTS DIRECTORY (Universal Search & Mark View)    */}
        {/* =================================================================== */}
        {activeTab === 'teams' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Universal Filter Bar */}
            <div className="card" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                {/* Search across team, student name, roll number, supervisor */}
                <div className="search-input-wrapper" style={{ flex: '1 1 300px', minWidth: '260px' }}>
                  <input
                    type="text"
                    className="input-field"
                    style={{ height: '40px', fontSize: '13px' }}
                    placeholder="Search by student name, roll number, team name, supervisor..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                  <div className="search-icon">
                    <Search size={15} />
                  </div>
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="clear-btn"
                      aria-label="Clear search"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Program Filter */}
                <div className="segmented-control" style={{ padding: '3px' }}>
                  <button
                    className={`segmented-pill ${programFilter === 'all' ? 'active' : ''}`}
                    onClick={() => {
                      setProgramFilter('all');
                      setCurrentPage(1);
                    }}
                    style={{ padding: '5px 12px', fontSize: '11.5px' }}
                  >
                    All ({teams.length})
                  </button>
                  <button
                    className={`segmented-pill ${programFilter === 'BCA' ? 'active' : ''}`}
                    onClick={() => {
                      setProgramFilter('BCA');
                      setCurrentPage(1);
                    }}
                    style={{ padding: '5px 12px', fontSize: '11.5px' }}
                  >
                    BCA
                  </button>
                  <button
                    className={`segmented-pill ${programFilter === 'BCA - DS' ? 'active' : ''}`}
                    onClick={() => {
                      setProgramFilter('BCA - DS');
                      setCurrentPage(1);
                    }}
                    style={{ padding: '5px 12px', fontSize: '11.5px' }}
                  >
                    BCA-DS
                  </button>
                </div>

                <div style={{ fontSize: '12.5px', color: 'var(--color-text-muted)' }}>
                  Found <strong>{filteredTeams.length}</strong> teams
                </div>
              </div>
            </div>

            {/* Desktop Paginated Data Table */}
            <div className="desktop-only data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Team</th>
                    <th>Supervisor</th>
                    <th>Leader</th>
                    <th>Students & Marks</th>
                    <th>Clearances</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTeams.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--color-text-muted)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                          <img
                            src="/images/undraw/searching-themed.svg"
                            alt="No teams match search query"
                            style={{ width: '160px', height: 'auto', opacity: 0.85, marginBottom: '4px' }}
                          />
                          <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-ink)' }}>
                            No teams match your search or filter criteria
                          </span>
                          <span style={{ fontSize: '12.5px', color: 'var(--color-text-muted)', maxWidth: '420px' }}>
                            Try searching for another team name, team code, supervisor name, or student roll number.
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedTeams.map((t: any) => (
                      <tr
                        key={t.id}
                        onClick={() => setSelectedTeamModal(t)}
                        className="clickable-row"
                        title="Click to view & score team"
                      >
                        <td>
                          <strong style={{ color: 'var(--color-ink)', fontSize: '13.5px' }}>{t.team_name}</strong>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                            {t.program} • {t.studentCount} Members
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '13px' }}>{t.supervisor?.name || 'N/A'}</div>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{t.supervisor?.email}</div>
                        </td>
                        <td>
                          {t.leader ? (
                            <div>
                              <div style={{ color: 'var(--color-success)', fontWeight: 600, fontSize: '12.5px' }}>
                                {t.leader.name}
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                                {t.leader.email}
                              </div>
                            </div>
                          ) : (
                            <span className="badge badge-danger" style={{ fontSize: '10px' }}>
                              Not Selected
                            </span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <span style={{ fontSize: '12px', color: 'var(--color-ink)' }}>
                              {t.students?.length || 0} Registered
                            </span>
                            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                              Evaluated: {t.evaluationsCount || 0} marks records
                            </span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <span className={`badge ${t.phase1_approved ? 'badge-success' : 'badge-neutral'}`} style={{ fontSize: '10px' }}>
                              P1
                            </span>
                            <span className={`badge ${t.phase2_approved ? 'badge-success' : 'badge-neutral'}`} style={{ fontSize: '10px' }}>
                              P2
                            </span>
                            <span className={`badge ${t.phase3_approved ? 'badge-success' : 'badge-neutral'}`} style={{ fontSize: '10px' }}>
                              P3
                            </span>
                          </div>
                        </td>
                        <td>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTeamModal(t);
                            }}
                            className="btn btn-outline"
                            style={{ padding: '6px 12px', fontSize: '12px', gap: '5px' }}
                          >
                            <Eye size={13} /> View &amp; Score
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Responsive Cards View */}
            <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {paginatedTeams.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '30px 16px', color: 'var(--color-text-muted)' }}>
                  No teams match your search query. Try another keyword or roll number.
                </div>
              ) : (
                paginatedTeams.map((t: any) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTeamModal(t)}
                    className="card clickable-card"
                    style={{
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid var(--color-hairline)',
                      borderRadius: '12px',
                      boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
                    }}
                  >
                    {/* Top Row: Team Name & Clearances */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-ink)', lineHeight: 1.2 }}>
                          {t.team_name}
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', marginTop: '2px', fontWeight: 500 }}>
                          {t.program} • {t.studentCount || (t.students?.length || 0)} Members
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                        <span className={`badge ${t.phase1_approved ? 'badge-success' : 'badge-neutral'}`} style={{ fontSize: '9.5px', padding: '2px 6px', fontWeight: 700 }}>P1</span>
                        <span className={`badge ${t.phase2_approved ? 'badge-success' : 'badge-neutral'}`} style={{ fontSize: '9.5px', padding: '2px 6px', fontWeight: 700 }}>P2</span>
                        <span className={`badge ${t.phase3_approved ? 'badge-success' : 'badge-neutral'}`} style={{ fontSize: '9.5px', padding: '2px 6px', fontWeight: 700 }}>P3</span>
                      </div>
                    </div>

                    {/* Supervisor & Leader Section */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px', backgroundColor: '#F8FAFC', padding: '10px 12px', borderRadius: '8px', border: '1px solid #F1F5F9' }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-faint)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Supervisor
                        </div>
                        <div style={{ fontWeight: 600, color: 'var(--color-ink)', marginTop: '2px', fontSize: '12px', wordBreak: 'break-word', lineHeight: 1.3 }}>
                          {t.supervisor?.name || 'Not Assigned'}
                        </div>
                        <div style={{ fontSize: '10.5px', color: 'var(--color-text-muted)', wordBreak: 'break-all', marginTop: '1px' }}>
                          {t.supervisor?.email || ''}
                        </div>
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-faint)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Leader
                        </div>
                        {t.leader ? (
                          <div>
                            <div style={{ fontWeight: 700, color: '#15803D', marginTop: '2px', fontSize: '12px', wordBreak: 'break-word', lineHeight: 1.3 }}>
                              {t.leader.name}
                            </div>
                            <div style={{ fontSize: '10.5px', color: 'var(--color-text-muted)', wordBreak: 'break-all', marginTop: '1px' }}>
                              {t.leader.email}
                            </div>
                          </div>
                        ) : (
                          <span className="badge badge-danger" style={{ fontSize: '9.5px', marginTop: '3px', display: 'inline-block' }}>
                            Not Selected
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTeamModal(t);
                      }}
                      className="btn btn-primary"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        fontSize: '12px',
                        fontWeight: 600,
                        gap: '6px',
                        justifyContent: 'center',
                      }}
                    >
                      <Eye size={13} /> View Students &amp; Clearances
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Pagination Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({filteredTeams.length} total)
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-outline"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={{ padding: '6px 14px', fontSize: '12px' }}
                >
                  <ChevronLeft size={14} /> Previous
                </button>
                <button
                  className="btn btn-outline"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  style={{ padding: '6px 14px', fontSize: '12px' }}
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 3: ALL SUPERVISORS DIRECTORY (View faculty & assigned teams)    */}
        {/* =================================================================== */}
        {activeTab === 'supervisors' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Search Bar */}
            <div className="card" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div className="search-input-wrapper" style={{ flex: '1 1 300px', minWidth: '260px' }}>
                  <input
                    type="text"
                    className="input-field"
                    style={{ height: '40px', fontSize: '13px' }}
                    placeholder="Search supervisor by name, email, or team..."
                    value={supervisorSearch}
                    onChange={(e) => setSupervisorSearch(e.target.value)}
                  />
                  <div className="search-icon">
                    <Search size={15} />
                  </div>
                  {supervisorSearch && (
                    <button
                      type="button"
                      onClick={() => setSupervisorSearch('')}
                      className="clear-btn"
                      aria-label="Clear search"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--color-text-muted)' }}>
                  Total <strong>{filteredSupervisors.length}</strong> Faculty Supervisors
                </div>
              </div>
            </div>

            {/* Supervisors Grid */}
            <div className="grid-cols-3">
              {filteredSupervisors.map((s: any) => (
                <div
                  key={s.id}
                  onClick={() => setSelectedSupervisorModal(s)}
                  className="card clickable-card"
                  title="Click to view supervisor details & teams"
                  style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div>
                        <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-ink)' }}>{s.name}</h4>
                        <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted)' }}>{s.designation}</div>
                      </div>
                      <span className="badge badge-neutral" style={{ fontSize: '11px' }}>
                        {s.assignedTeamsCount} Teams
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Mail size={13} color="var(--color-text-faint)" />
                        <span>{s.email}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Phone size={13} color="var(--color-text-faint)" />
                        <span>{s.phone}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Building size={13} color="var(--color-text-faint)" />
                        <span>{s.cabin}</span>
                      </div>
                    </div>

                    {/* Assigned Teams Pills */}
                    <div style={{ borderTop: '1px solid var(--color-hairline)', paddingTop: '10px', marginBottom: '12px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-faint)', marginBottom: '6px' }}>
                        Supervised Teams:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {s.assignedTeams?.map((t: any) => (
                          <span
                            key={t.id}
                            style={{
                              fontSize: '10.5px',
                              padding: '2px 7px',
                              borderRadius: '4px',
                              backgroundColor: 'var(--color-canvas-soft)',
                              border: '1px solid var(--color-hairline)',
                              color: 'var(--color-ink)',
                            }}
                          >
                            {t.team_name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedSupervisorModal(s);
                    }}
                    className="btn btn-outline"
                    style={{ width: '100%', fontSize: '12px', padding: '6px 12px' }}
                  >
                    View Assigned Teams &amp; Panels
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 4: PANELS & PRESENTATION LOGISTICS (2 Batches, Rooms, Dates)    */}
        {/* =================================================================== */}
        {activeTab === 'panels' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Header & Controls */}
            <div className="card" style={{ padding: '14px 16px', width: '100%', boxSizing: 'border-box' }}>
              <div className="panels-toolbar" style={{ width: '100%', boxSizing: 'border-box' }}>
                {/* Phase Selection Pills */}
                <div className="segmented-control touch-scroll-x" style={{ padding: '3px', boxSizing: 'border-box', overflowX: 'auto', display: 'flex', flexShrink: 0 }}>
                  <button
                    className={`segmented-pill ${panelPhaseFilter === 1 ? 'active' : ''}`}
                    onClick={() => setPanelPhaseFilter(1)}
                    style={{ padding: '6px 12px', fontSize: '11.5px', display: 'inline-flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap', flexShrink: 0 }}
                  >
                    <Target size={13} color={panelPhaseFilter === 1 ? '#2563EB' : 'currentColor'} />
                    <span>Round 1 (19-Sep)</span>
                  </button>
                  <button
                    className={`segmented-pill ${panelPhaseFilter === 2 ? 'active' : ''}`}
                    onClick={() => setPanelPhaseFilter(2)}
                    style={{ padding: '6px 12px', fontSize: '11.5px', display: 'inline-flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap', flexShrink: 0 }}
                  >
                    <Layers size={13} color={panelPhaseFilter === 2 ? '#059669' : 'currentColor'} />
                    <span>Round 2 (17-Oct)</span>
                  </button>
                  <button
                    className={`segmented-pill ${panelPhaseFilter === 3 ? 'active' : ''}`}
                    onClick={() => setPanelPhaseFilter(3)}
                    style={{ padding: '6px 12px', fontSize: '11.5px', display: 'inline-flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap', flexShrink: 0 }}
                  >
                    <Award size={13} color={panelPhaseFilter === 3 ? '#D97706' : 'currentColor'} />
                    <span>Round 3 (Final Defense)</span>
                  </button>
                </div>

                {/* Right Controls: Search + Unified Action Buttons */}
                <div className="panels-actions-group">
                  <div className="search-input-wrapper" style={{ minWidth: '160px', maxWidth: '240px', flex: '1 1 auto' }}>
                    <input
                      type="text"
                      className="input-field"
                      style={{ height: '38px', fontSize: '12.5px' }}
                      placeholder="Search panel, room, judge..."
                      value={panelSearch}
                      onChange={(e) => setPanelSearch(e.target.value)}
                    />
                    <div className="search-icon">
                      <Search size={14} />
                    </div>
                    {panelSearch && (
                      <button
                        type="button"
                        onClick={() => setPanelSearch('')}
                        className="clear-btn"
                        aria-label="Clear search"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  <div className="panels-actions-buttons" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <button
                      onClick={() => {
                        setTargetPhase(panelPhaseFilter);
                        setJsonModalOpen(true);
                        setPanelsMessage(null);
                      }}
                      className="btn btn-primary"
                      style={{
                        fontSize: '12px',
                        height: '38px',
                        padding: '0 14px',
                        gap: '6px',
                        backgroundColor: panelPhaseFilter === 1 ? '#2563EB' : panelPhaseFilter === 2 ? '#059669' : '#D97706',
                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <Zap size={13} fill="#FFFFFF" /> Batch JSON Import
                    </button>

                    <button
                      onClick={() => {
                        setPanelFormPhase(panelPhaseFilter);
                        setCreatePanelModalOpen(true);
                        setPanelFormError(null);
                      }}
                      className="btn btn-outline"
                      style={{ fontSize: '12px', height: '38px', padding: '0 13px', gap: '6px', whiteSpace: 'nowrap' }}
                    >
                      <Plus size={14} /> Add Single Panel
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Panels Display Grid */}
            {filteredPanels.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
                <Award size={40} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
                <h4 style={{ fontSize: '16px', fontWeight: 700 }}>No Panels Configured for Phase {panelPhaseFilter}</h4>
                <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  Click &quot;Assign Panel&quot; above to configure team ranges, presentation shifts (e.g. 8–10 AM / 12–2 PM), room numbers in AB10, and faculty judges.
                </p>
              </div>
            ) : (
              <div className="grid-cols-3">
                {filteredPanels.map((p: any) => (
                  <div key={p.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <div>
                          <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-ink)' }}>{p.panel_name}</h4>
                          <span className="badge badge-neutral" style={{ fontSize: '10.5px', marginTop: '2px' }}>Phase {p.phase_number}</span>
                        </div>
                        <button
                          onClick={() => handleDeletePanel(p.id, p.panel_name)}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', opacity: 0.8 }}
                          title="Delete Panel"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '14px' }}>
                        <div>Range: <strong>Teams #{p.team_range_start} – #{p.team_range_end}</strong> ({p.teamsCount || 0} teams)</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <MapPin size={13} color="#2563EB" />
                          <span>Venue: <strong>Academic Block AB10</strong> ({p.room_number || 'Room TBA'})</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Clock size={13} color="#059669" />
                          <span>Shift: <strong>{p.time_window || 'Batch 1: Morning'}</strong></span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Calendar size={13} color="#D97706" />
                          <span>Date: <strong>{p.date || 'TBA'}</strong></span>
                        </div>
                      </div>

                      {p.judges && p.judges.length > 0 && (
                        <div style={{ borderTop: '1px solid var(--color-hairline)', paddingTop: '10px' }}>
                          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-faint)', marginBottom: '4px' }}>
                            Assigned Faculty Judges ({p.judges.length}):
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            {p.judges.map((j: any) => (
                              <div key={j.id} style={{ fontSize: '12px', color: 'var(--color-ink)' }}>
                                • {j.full_name} <span style={{ color: 'var(--color-text-muted)', fontSize: '11px' }}>({j.email})</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 5: DEFAULTING AUDIT                                             */}
        {/* =================================================================== */}
        {activeTab === 'defaulting' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-danger)' }}>
                <AlertTriangle size={20} />
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-danger)' }}>
                    Defaulting Teams Audit ({defaultingTeams.length})
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                    Teams missing designated leaders, lacking approved problem statements, or awaiting supervisor clearance.
                  </p>
                </div>
              </div>
            </div>

            {defaultingTeams.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
                <CheckCircle2 size={40} color="var(--color-success)" style={{ margin: '0 auto 12px' }} />
                <h4 style={{ fontSize: '16px', fontWeight: 700 }}>Zero Defaulting Teams!</h4>
                <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>All teams are fully compliant with operational milestones.</p>
              </div>
            ) : (
              <>
                <div className="desktop-only data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Team</th>
                        <th>Supervisor</th>
                        <th>Issue Detected</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {defaultingTeams.map((t: any) => (
                        <tr
                          key={t.id}
                          onClick={() => setSelectedTeamModal(t)}
                          className="clickable-row"
                          title="Click anywhere to inspect & clear team"
                        >
                          <td>
                            <strong>{t.team_name}</strong>
                            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{t.program}</div>
                          </td>
                          <td>
                            <div>{t.supervisor?.name || 'Unassigned'}</div>
                            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{t.supervisor?.phone}</div>
                          </td>
                          <td>
                            {!t.leader_id ? (
                              <span className="badge badge-danger" style={{ fontSize: '10px' }}>Leader Not Elected at /leader</span>
                            ) : t.problemStatement?.status !== 'approved' ? (
                              <span className="badge badge-warning" style={{ fontSize: '10px' }}>Problem Statement Unapproved</span>
                            ) : (
                              <span className="badge badge-warning" style={{ fontSize: '10px' }}>Phase Clearance Pending</span>
                            )}
                          </td>
                          <td>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTeamModal(t);
                              }}
                              className="btn btn-outline"
                              style={{ padding: '6px 12px', fontSize: '12px' }}
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {defaultingTeams.map((t: any) => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTeamModal(t)}
                      className="card clickable-card"
                      title="Click to inspect & clear team"
                      style={{
                        padding: '14px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid var(--color-hairline)',
                        borderRadius: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <div>
                          <div style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--color-ink)' }}>{t.team_name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{t.program}</div>
                        </div>
                        <div>
                          {!t.leader_id ? (
                            <span className="badge badge-danger" style={{ fontSize: '9.5px' }}>Leader Missing</span>
                          ) : t.problemStatement?.status !== 'approved' ? (
                            <span className="badge badge-warning" style={{ fontSize: '9.5px' }}>Topic Unapproved</span>
                          ) : (
                            <span className="badge badge-warning" style={{ fontSize: '9.5px' }}>Clearance Pending</span>
                          )}
                        </div>
                      </div>

                      <div style={{ fontSize: '12px', backgroundColor: '#F8FAFC', padding: '8px 10px', borderRadius: '8px', border: '1px solid #F1F5F9' }}>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-faint)', textTransform: 'uppercase' }}>Supervisor</div>
                        <div style={{ fontWeight: 600, color: 'var(--color-ink)', marginTop: '2px' }}>{t.supervisor?.name || 'Unassigned'}</div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{t.supervisor?.phone || ''}</div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTeamModal(t);
                        }}
                        className="btn btn-outline"
                        style={{ width: '100%', padding: '7px 12px', fontSize: '12px', justifyContent: 'center' }}
                      >
                        Inspect &amp; Clear
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {/* =================================================================== */}
      {/* MODAL 1: VISUAL PANEL ASSIGNMENT BUILDER (Batches, Rooms, Range)    */}
      {/* =================================================================== */}
      {createPanelModalOpen && (
        <div
          className="modal-overlay-responsive"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1300,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            padding: '24px 16px',
            overflowY: 'auto',
          }}
          onClick={() => setCreatePanelModalOpen(false)}
        >
          <div
            className="card animate-scale-in modal-card-responsive"
            style={{
              width: '100%',
              maxWidth: '640px',
              maxHeight: 'min(90vh, 700px)',
              overflowY: 'auto',
              padding: '24px',
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
              border: '1px solid var(--color-border)',
              margin: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-ink)' }}>
                  <PlusCircle size={18} color="#2563EB" /> Add Single Panel (Manual Configuration)
                </h3>
                <p style={{ fontSize: '12.5px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  Configure presentation shifts (e.g. 8–10 AM / 12–2 PM), room numbers in AB10, and assign conflict-free judges.
                </p>
              </div>
              <button
                onClick={() => setCreatePanelModalOpen(false)}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-canvas-soft)',
                  cursor: 'pointer',
                  color: 'var(--color-ink)',
                  transition: 'all 0.15s ease',
                  flexShrink: 0,
                }}
                className="btn-icon-hover"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {panelFormError && (
              <div className="alert-banner alert-danger" style={{ marginBottom: '16px', fontSize: '13px' }}>
                {panelFormError}
              </div>
            )}

            <form onSubmit={handleCreateVisualPanel} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Phase Selection */}
              <div>
                <label className="input-label" style={{ fontSize: '12px', fontWeight: 600 }}>Evaluation Phase</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {[
                    { num: 1, name: 'Phase 1', date: '2026-09-19', label: '19-Sep (20 M)' },
                    { num: 2, name: 'Phase 2', date: '2026-10-17', label: '17-Oct (40 M)' },
                    { num: 3, name: 'Phase 3', date: '2026-11-20', label: 'Final (40 M)' },
                  ].map((p) => (
                    <button
                      key={p.num}
                      type="button"
                      onClick={() => {
                        setPanelFormPhase(p.num as 1 | 2 | 3);
                        setPanelFormDate(p.date);
                      }}
                      className={panelFormPhase === p.num ? 'btn btn-primary' : 'btn btn-outline'}
                      style={{ padding: '8px', fontSize: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}
                    >
                      <span style={{ fontWeight: 700 }}>{p.name}</span>
                      <span style={{ fontSize: '10px', opacity: 0.85 }}>{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Panel Name */}
              <div>
                <label className="input-label" style={{ fontSize: '12px', fontWeight: 600 }}>Panel Title (Optional)</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Panel 1 (DS & AI Specialization)"
                  value={panelFormName}
                  onChange={(e) => setPanelFormName(e.target.value)}
                />
              </div>

              {/* Team Range */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="input-label" style={{ fontSize: '12px', fontWeight: 600 }}>Team Range Start (#)</label>
                  <input
                    type="number"
                    min="1"
                    max="102"
                    className="input-field"
                    required
                    value={panelFormRangeStart}
                    onChange={(e) => setPanelFormRangeStart(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="input-label" style={{ fontSize: '12px', fontWeight: 600 }}>Team Range End (#)</label>
                  <input
                    type="number"
                    min="1"
                    max="102"
                    className="input-field"
                    required
                    value={panelFormRangeEnd}
                    onChange={(e) => setPanelFormRangeEnd(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Presentation Shift / Batch (2 Batches Supported) */}
              <div>
                <label className="input-label" style={{ fontSize: '12px', fontWeight: 600 }}>Presentation Shift / Batch</label>
                <select
                  className="input-field"
                  value={panelFormShift}
                  onChange={(e) => setPanelFormShift(e.target.value)}
                >
                  <option value="Batch 1: Morning (08:00 AM - 10:00 AM)">Batch 1: Morning (08:00 AM - 10:00 AM)</option>
                  <option value="Batch 2: Afternoon (12:00 PM - 02:00 PM)">Batch 2: Afternoon (12:00 PM - 02:00 PM)</option>
                  <option value="Shift 1: Morning (09:00 AM - 01:00 PM)">Shift 1: Morning (09:00 AM - 01:00 PM)</option>
                  <option value="Shift 2: Evening (02:00 PM - 06:00 PM)">Shift 2: Evening (02:00 PM - 06:00 PM)</option>
                  <option value="Custom">Custom Shift Timing...</option>
                </select>
                {panelFormShift === 'Custom' && (
                  <input
                    type="text"
                    className="input-field"
                    style={{ marginTop: '8px' }}
                    placeholder="e.g. Batch 3: Evening (03:00 PM - 05:00 PM)"
                    value={panelFormCustomShift}
                    onChange={(e) => setPanelFormCustomShift(e.target.value)}
                    required
                  />
                )}
              </div>

              {/* Venue & Room Number (AB10) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="input-label" style={{ fontSize: '12px', fontWeight: 600 }}>Venue Block</label>
                  <input
                    type="text"
                    className="input-field"
                    value="Academic Block AB10"
                    disabled
                    style={{ backgroundColor: 'var(--color-canvas-soft)' }}
                  />
                </div>
                <div>
                  <label className="input-label" style={{ fontSize: '12px', fontWeight: 600 }}>Room Number</label>
                  <select
                    className="input-field"
                    value={panelFormRoom}
                    onChange={(e) => setPanelFormRoom(e.target.value)}
                  >
                    <option value="Room 402">Room 402</option>
                    <option value="Room 405">Room 405</option>
                    <option value="Room 408">Room 408</option>
                    <option value="Room 410">Room 410</option>
                    <option value="Seminar Hall 1">Seminar Hall 1</option>
                    <option value="Seminar Hall 2">Seminar Hall 2</option>
                    <option value="Custom">Custom Room...</option>
                  </select>
                  {panelFormRoom === 'Custom' && (
                    <input
                      type="text"
                      className="input-field"
                      style={{ marginTop: '8px' }}
                      placeholder="e.g. Room 501"
                      value={panelFormCustomRoom}
                      onChange={(e) => setPanelFormCustomRoom(e.target.value)}
                      required
                    />
                  )}
                </div>
              </div>

              {/* Date */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label className="input-label" style={{ fontSize: '12px', fontWeight: 600, margin: 0 }}>Presentation Date</label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      type="button"
                      onClick={() => setPanelFormDate('2026-09-19')}
                      className="btn"
                      style={{ padding: '2px 6px', fontSize: '10.5px', height: 'auto', backgroundColor: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}
                    >
                      19-Sep (Phase 1)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPanelFormDate('2026-10-17')}
                      className="btn"
                      style={{ padding: '2px 6px', fontSize: '10.5px', height: 'auto', backgroundColor: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0' }}
                    >
                      17-Oct (Phase 2)
                    </button>
                  </div>
                </div>
                <input
                  type="date"
                  className="input-field"
                  required
                  value={panelFormDate}
                  onChange={(e) => setPanelFormDate(e.target.value)}
                />
              </div>

              {/* Select Faculty Judges */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="input-label" style={{ fontSize: '12px', fontWeight: 600, margin: 0 }}>
                    Assign Faculty Judges ({panelFormSelectedJudges.length} selected)
                  </label>
                  {panelFormSelectedJudges.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setPanelFormSelectedJudges([])}
                      style={{ fontSize: '11px', color: '#2563EB', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Clear Selection ({panelFormSelectedJudges.length})
                    </button>
                  )}
                </div>

                {/* Faculty Search Bar */}
                <div className="search-input-wrapper" style={{ width: '100%' }}>
                  <input
                    type="text"
                    className="input-field"
                    style={{ height: '36px', fontSize: '12.5px' }}
                    placeholder="Search faculty by name, email, or phone..."
                    value={judgeSearchQuery}
                    onChange={(e) => setJudgeSearchQuery(e.target.value)}
                  />
                  <div className="search-icon">
                    <Search size={13} />
                  </div>
                  {judgeSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setJudgeSearchQuery('')}
                      className="clear-btn"
                      aria-label="Clear search"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Filtered Faculty Checklist */}
                <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--color-hairline)', borderRadius: '8px', padding: '6px', display: 'flex', flexDirection: 'column', gap: '4px', backgroundColor: '#FAFAFA' }}>
                  {supervisors
                    .filter((s: any) => {
                      if (!judgeSearchQuery.trim()) return true;
                      const q = judgeSearchQuery.toLowerCase();
                      return (
                        (s.name || '').toLowerCase().includes(q) ||
                        (s.email || '').toLowerCase().includes(q) ||
                        (s.phone || '').toLowerCase().includes(q) ||
                        (s.cabin || '').toLowerCase().includes(q)
                      );
                    })
                    .map((s: any) => {
                      const isSelected = panelFormSelectedJudges.includes(s.id);
                      return (
                        <label
                          key={s.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '6px 8px',
                            borderRadius: '6px',
                            backgroundColor: isSelected ? '#EFF6FF' : '#FFFFFF',
                            border: isSelected ? '1px solid #BFDBFE' : '1px solid var(--color-hairline)',
                            cursor: 'pointer',
                            fontSize: '12.5px',
                            transition: 'all 0.12s ease',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setPanelFormSelectedJudges([...panelFormSelectedJudges, s.id]);
                                } else {
                                  setPanelFormSelectedJudges(panelFormSelectedJudges.filter((id) => id !== s.id));
                                }
                              }}
                            />
                            <div style={{ minWidth: 0 }}>
                              <span style={{ fontWeight: 600, color: 'var(--color-ink)' }}>{s.name}</span>
                              <span style={{ color: 'var(--color-text-muted)', fontSize: '11px', marginLeft: '6px' }}>({s.email})</span>
                            </div>
                          </div>
                          <span className="badge badge-neutral" style={{ fontSize: '10px', flexShrink: 0, marginLeft: '8px' }}>
                            {s.assignedTeamsCount} teams supervised
                          </span>
                        </label>
                      );
                    })}
                  {supervisors.filter((s: any) => {
                    if (!judgeSearchQuery.trim()) return true;
                    const q = judgeSearchQuery.toLowerCase();
                    return (
                      (s.name || '').toLowerCase().includes(q) ||
                      (s.email || '').toLowerCase().includes(q) ||
                      (s.phone || '').toLowerCase().includes(q) ||
                      (s.cabin || '').toLowerCase().includes(q)
                    );
                  }).length === 0 && (
                    <div style={{ textAlign: 'center', padding: '16px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                      No faculty found matching &ldquo;{judgeSearchQuery}&rdquo;
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px', paddingTop: '14px', borderTop: '1px solid #F1F5F9' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setCreatePanelModalOpen(false)}
                  style={{ padding: '8px 16px', fontSize: '13px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={panelFormLoading || panelFormSelectedJudges.length === 0}
                  style={{ padding: '8px 18px', fontSize: '13px', fontWeight: 600 }}
                >
                  {panelFormLoading ? 'Creating Panel...' : `Create Panel for Phase ${panelFormPhase}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 2: DIRECT BULK JSON IMPORT CONSOLE (AI & Excel Converter)     */}
      {/* =================================================================== */}
      {jsonModalOpen && (() => {
        const currentJson = roundJsonMap[targetPhase] || '';
        let parsedCount = 0;
        let jsonParseError: string | null = null;
        if (currentJson.trim()) {
          try {
            const parsed = JSON.parse(currentJson);
            if (Array.isArray(parsed)) {
              parsedCount = parsed.length;
            } else {
              jsonParseError = 'Root element must be a JSON Array [ ... ]';
            }
          } catch {
            jsonParseError = 'Invalid JSON syntax. Please check brackets, quotes, or trailing commas.';
          }
        }

        return (
          <div
            className="modal-overlay-responsive"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1300,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(15, 23, 42, 0.5)',
              backdropFilter: 'blur(2px)',
              WebkitBackdropFilter: 'blur(2px)',
              padding: '20px',
            }}
            onClick={() => setJsonModalOpen(false)}
          >
            <div
              className="card animate-scale-in modal-card-responsive"
              style={{
                width: '100%',
                maxWidth: '860px',
                maxHeight: '94vh',
                overflowY: 'auto',
                padding: 0,
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
                border: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="modal-header-responsive" style={{ padding: '18px 24px', borderBottom: '1px solid var(--color-hairline)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-ink)' }}>
                      <Zap size={18} color="#2563EB" fill="#2563EB" /> Direct Bulk Panel Mapping &amp; Excel Import
                    </h3>
                    <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                      Paste a JSON array to map all panels, faculty employee IDs, team ranges, shifts, and rooms in 1 click.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setJsonModalOpen(false)}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-canvas-soft)',
                    cursor: 'pointer',
                    color: 'var(--color-ink)',
                    transition: 'all 0.15s ease',
                    flexShrink: 0,
                  }}
                  className="btn-icon-hover"
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="modal-body-responsive" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* 3 Dedicated Round Action Switchers */}
                <div className="round-action-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setTargetPhase(1);
                      setPanelsMessage(null);
                    }}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: targetPhase === 1 ? '2px solid #2563EB' : '1px solid var(--color-hairline)',
                      backgroundColor: targetPhase === 1 ? '#EFF6FF' : '#F8FAFC',
                      color: targetPhase === 1 ? '#1E40AF' : 'var(--color-ink)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: targetPhase === 1 ? '#2563EB' : 'var(--color-ink)' }}>
                      <Target size={13} color="#2563EB" /> Round 1 (19-Sep)
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--color-text-muted)' }}>
                      20 Marks • Idea &amp; 30% Coding
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTargetPhase(2);
                      setPanelsMessage(null);
                    }}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: targetPhase === 2 ? '2px solid #059669' : '1px solid var(--color-hairline)',
                      backgroundColor: targetPhase === 2 ? '#ECFDF5' : '#F8FAFC',
                      color: targetPhase === 2 ? '#065F46' : 'var(--color-ink)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: targetPhase === 2 ? '#059669' : 'var(--color-ink)' }}>
                      <Layers size={13} color="#059669" /> Round 2 (17-Oct)
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--color-text-muted)' }}>
                      40 Marks • 70% Prototype Demo
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTargetPhase(3);
                      setPanelsMessage(null);
                    }}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: targetPhase === 3 ? '2px solid #D97706' : '1px solid var(--color-hairline)',
                      backgroundColor: targetPhase === 3 ? '#FFFBEB' : '#F8FAFC',
                      color: targetPhase === 3 ? '#92400E' : 'var(--color-ink)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: targetPhase === 3 ? '#D97706' : 'var(--color-ink)' }}>
                      <Award size={13} color="#D97706" /> Round 3 (Final Defense)
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--color-text-muted)' }}>
                      40 Marks • Report & Viva
                    </div>
                  </button>
                </div>
                {/* Global Shift Timing Presets */}
                <div style={{ backgroundColor: '#F8FAFC', border: '1px solid var(--color-hairline)', borderRadius: '10px', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--color-ink)' }}>
                      <Clock size={14} color="#2563EB" /> Shift Timing Configuration (Original Clock Times)
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setShift1StartTime('08:00');
                          setShift1EndTime('10:00');
                          setShift2StartTime('12:00');
                          setShift2EndTime('14:00');
                        }}
                        className="btn"
                        style={{ padding: '2px 7px', fontSize: '10.5px', height: 'auto', backgroundColor: '#EFF6FF', color: '#1E40AF', border: '1px solid #BFDBFE' }}
                      >
                        Standard (8–10 AM / 12–2 PM)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShift1StartTime('09:00');
                          setShift1EndTime('13:00');
                          setShift2StartTime('14:00');
                          setShift2EndTime('18:00');
                        }}
                        className="btn"
                        style={{ padding: '2px 7px', fontSize: '10.5px', height: 'auto', backgroundColor: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0' }}
                      >
                        4-Hour Batches (9–1 PM / 2–6 PM)
                      </button>
                    </div>
                  </div>

                  <div className="shift-timings-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {/* Shift 1 Timing */}
                    <div style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--color-hairline)', borderRadius: '8px', padding: '8px 10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#1E40AF' }}>
                          Shift 1 Clock (Morning)
                        </span>
                        <span className="badge badge-neutral" style={{ fontSize: '10px', fontWeight: 700, color: '#1E40AF', backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                          {getShift1Formatted()}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input
                          type="time"
                          className="input-field"
                          style={{ height: '32px', fontSize: '12px', fontWeight: 600, padding: '2px 6px' }}
                          value={shift1StartTime}
                          onChange={(e) => setShift1StartTime(e.target.value)}
                          required
                        />
                        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>to</span>
                        <input
                          type="time"
                          className="input-field"
                          style={{ height: '32px', fontSize: '12px', fontWeight: 600, padding: '2px 6px' }}
                          value={shift1EndTime}
                          onChange={(e) => setShift1EndTime(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    {/* Shift 2 Timing */}
                    <div style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--color-hairline)', borderRadius: '8px', padding: '8px 10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#065F46' }}>
                          Shift 2 Clock (Afternoon)
                        </span>
                        <span className="badge badge-neutral" style={{ fontSize: '10px', fontWeight: 700, color: '#065F46', backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0' }}>
                          {getShift2Formatted()}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input
                          type="time"
                          className="input-field"
                          style={{ height: '32px', fontSize: '12px', fontWeight: 600, padding: '2px 6px' }}
                          value={shift2StartTime}
                          onChange={(e) => setShift2StartTime(e.target.value)}
                          required
                        />
                        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>to</span>
                        <input
                          type="time"
                          className="input-field"
                          style={{ height: '32px', fontSize: '12px', fontWeight: 600, padding: '2px 6px' }}
                          value={shift2EndTime}
                          onChange={(e) => setShift2EndTime(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Unified Code Workspace with Top Action Toolbar */}
                <div style={{ border: '1px solid var(--color-hairline)', borderRadius: '10px', overflow: 'hidden', backgroundColor: '#FFFFFF' }}>
                  {/* Toolbar */}
                  <div style={{ padding: '8px 14px', backgroundColor: '#F8FAFC', borderBottom: '1px solid var(--color-hairline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--color-ink)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        JSON Array Editor (Round {targetPhase})
                      </span>
                      {currentJson.trim() ? (
                        jsonParseError ? (
                          <span className="badge badge-danger" style={{ fontSize: '10px' }}>Syntax Error</span>
                        ) : (
                          <span className="badge badge-success" style={{ fontSize: '10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={11} /> {parsedCount} Panels Ready
                          </span>
                        )
                      ) : (
                        <span className="badge badge-neutral" style={{ fontSize: '10px' }}>Showing Example Schema</span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(getAiPromptForPhase(targetPhase));
                          setCopiedPrompt(true);
                          setTimeout(() => setCopiedPrompt(false), 2000);
                        }}
                        className="btn"
                        style={{ padding: '3px 9px', fontSize: '11px', height: 'auto', backgroundColor: '#EFF6FF', color: '#1E40AF', border: '1px solid #BFDBFE', gap: '4px' }}
                      >
                        {copiedPrompt ? <Check size={11} color="#059669" /> : <Copy size={11} />}
                        {copiedPrompt ? 'Prompt Copied!' : 'Copy AI Excel Prompt'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setRoundJsonMap((prev) => ({ ...prev, [targetPhase]: getExampleJsonForPhase(targetPhase) }));
                        }}
                        className="btn btn-outline"
                        style={{ padding: '3px 9px', fontSize: '11px', height: 'auto', gap: '4px' }}
                      >
                        <Sparkles size={11} /> Fill Example JSON
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const textToCopy = currentJson.trim() || getExampleJsonForPhase(targetPhase);
                          navigator.clipboard.writeText(textToCopy);
                          setCopiedJson(true);
                          setTimeout(() => setCopiedJson(false), 2000);
                        }}
                        className="btn btn-outline"
                        style={{ padding: '3px 9px', fontSize: '11px', height: 'auto', gap: '4px' }}
                      >
                        {copiedJson ? <Check size={11} color="#059669" /> : <Copy size={11} />}
                        {copiedJson ? 'Copied!' : 'Copy JSON'}
                      </button>

                      {currentJson && (
                        <button
                          type="button"
                          onClick={() => setRoundJsonMap((prev) => ({ ...prev, [targetPhase]: '' }))}
                          className="btn btn-outline"
                          style={{ padding: '3px 8px', fontSize: '11px', height: 'auto', color: 'var(--color-danger)' }}
                          title="Clear editor"
                        >
                          <Trash2 size={11} /> Clear
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Spacious Unified Editor */}
                  <form onSubmit={handleBatchPanelsSubmit}>
                    <textarea
                      className="textarea-field"
                      rows={14}
                      style={{
                        width: '100%',
                        minHeight: '320px',
                        border: 'none',
                        borderRadius: 0,
                        fontFamily: 'var(--font-mono)',
                        fontSize: '12px',
                        lineHeight: '1.6',
                        padding: '16px',
                        backgroundColor: '#FFFFFF',
                        color: 'var(--color-ink)',
                        outline: 'none',
                        boxShadow: 'none',
                        resize: 'vertical',
                      }}
                      value={currentJson}
                      onChange={(e) => {
                        const val = e.target.value;
                        setRoundJsonMap((prev) => ({ ...prev, [targetPhase]: val }));
                      }}
                      placeholder={getExampleJsonForPhase(targetPhase)}
                      required
                    />

                    {/* Syntax error or validation message */}
                    {jsonParseError && (
                      <div style={{ padding: '8px 16px', backgroundColor: '#FEF2F2', borderTop: '1px solid #FECACA', color: '#991B1B', fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <AlertTriangle size={13} /> {jsonParseError}
                      </div>
                    )}

                    {panelsMessage && (
                      <div className={`alert-banner ${panelsMessage.type === 'error' ? 'alert-danger' : 'alert-success'}`} style={{ margin: '12px 16px', fontSize: '12.5px' }}>
                        {panelsMessage.text}
                      </div>
                    )}

                    {/* Footer Actions */}
                    <div style={{ padding: '12px 16px', borderTop: '1px solid var(--color-hairline)', backgroundColor: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11.5px', color: 'var(--color-text-muted)' }}>
                        Target: <strong>Round {targetPhase}</strong> • {targetPhase === 1 ? '19-Sep (20 M)' : targetPhase === 2 ? '17-Oct (40 M)' : 'Final Defense (40 M)'}
                      </span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button type="button" className="btn btn-outline" onClick={() => setJsonModalOpen(false)}>
                          Close
                        </button>
                        <button
                          type="submit"
                          className="btn btn-primary"
                          disabled={panelsSubmitLoading || !currentJson.trim() || !!jsonParseError}
                          style={{
                            gap: '6px',
                            backgroundColor: targetPhase === 1 ? '#2563EB' : targetPhase === 2 ? '#059669' : '#D97706',
                          }}
                        >
                          {panelsSubmitLoading ? (
                            'Validating & Mapping...'
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              <Zap size={14} /> Map &amp; Assign Panels for Round {targetPhase}
                            </span>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* =================================================================== */}
      {/* MODAL 3: TEAM & STUDENT MARKS INSPECTION / SCORECARD CONSOLE        */}
      {/* =================================================================== */}
      {selectedTeamModal && (
        <div
          className="modal-overlay-responsive"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1300,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            padding: '24px 16px',
            overflowY: 'auto',
          }}
          onClick={() => setSelectedTeamModal(null)}
        >
          <div
            className="card animate-scale-in modal-card-responsive"
            style={{
              width: '100%',
              maxWidth: '800px',
              maxHeight: 'min(90vh, 720px)',
              overflowY: 'auto',
              padding: '24px',
              borderRadius: '16px',
              backgroundColor: '#FFFFFF',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
              border: '1px solid var(--color-border)',
              margin: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                  <span className="badge badge-brand" style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {selectedTeamModal.program}
                  </span>
                  {selectedTeamModal.panel_name && (
                    <span className="badge badge-neutral" style={{ fontSize: '11px' }}>
                      {selectedTeamModal.panel_name}
                    </span>
                  )}
                </div>
                <h3 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-ink)', letterSpacing: '-0.02em', margin: '0 0 8px 0', lineHeight: 1.25 }}>
                  {selectedTeamModal.team_name}
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', backgroundColor: 'var(--color-canvas-soft)', borderRadius: '6px', fontSize: '12px', border: '1px solid var(--color-border)' }}>
                    <span style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>Supervisor:</span>
                    <strong style={{ color: 'var(--color-ink)' }}>{selectedTeamModal.supervisor?.name || 'Unassigned'}</strong>
                  </div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', backgroundColor: 'var(--color-canvas-soft)', borderRadius: '6px', fontSize: '12px', border: '1px solid var(--color-border)' }}>
                    <span style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>Leader:</span>
                    <strong style={{ color: 'var(--color-ink)' }}>{selectedTeamModal.leader?.name || 'Not Elected'}</strong>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedTeamModal(null)}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-canvas-soft)',
                  cursor: 'pointer',
                  color: 'var(--color-ink)',
                  transition: 'all 0.15s ease',
                  flexShrink: 0,
                }}
                className="btn-icon-hover"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Problem Statement Box */}
            <div style={{ backgroundColor: 'var(--color-canvas-soft)', borderRadius: '12px', padding: '16px', marginBottom: '20px', border: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={14} style={{ color: 'var(--color-brand)' }} />
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Problem Statement
                  </span>
                </div>
                <span
                  className={`badge ${selectedTeamModal.problemStatement?.status === 'APPROVED' ? 'badge-success' : selectedTeamModal.problemStatement?.status === 'REJECTED' ? 'badge-danger' : 'badge-warning'}`}
                  style={{ fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px', textTransform: 'capitalize' }}
                >
                  {selectedTeamModal.problemStatement?.status === 'APPROVED' ? (
                    <><Check size={12} /> Approved</>
                  ) : (
                    selectedTeamModal.problemStatement?.status ? selectedTeamModal.problemStatement.status.toLowerCase() : 'Not Submitted'
                  )}
                </span>
              </div>
              <strong style={{ fontSize: '14.5px', color: 'var(--color-ink)', display: 'block', marginBottom: '4px', lineHeight: 1.4 }}>
                {selectedTeamModal.problemStatement?.title || 'No Title Submitted'}
              </strong>
              {selectedTeamModal.problemStatement?.description ? (
                <div
                  className="rich-text-content"
                  style={{ fontSize: '12.5px', marginTop: '6px', paddingTop: '8px', borderTop: '1px dashed var(--color-border)', color: 'var(--color-ink-soft)', lineHeight: 1.6 }}
                  dangerouslySetInnerHTML={{ __html: selectedTeamModal.problemStatement.description }}
                />
              ) : null}
            </div>

            {/* Students Scorecard & Marks Roster */}
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: 'var(--color-ink)' }}>
                      Student Scorecard & Evaluation Marks
                    </h4>
                    <span className="badge badge-neutral" style={{ fontSize: '11px', padding: '2px 8px' }}>
                      {selectedTeamModal.students?.length || 0} Students
                    </span>
                  </div>
                  <span style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                    Click &quot;Edit&quot; on any student to modify marks
                  </span>
                </div>
              </div>

              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Roll No</th>
                      <th>Phase 1</th>
                      <th>Phase 2</th>
                      <th>Phase 3</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedTeamModal.students?.map((s: any) => (
                      <tr key={s.id}>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '13px' }}>{s.full_name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                            {s.isLeader ? <span style={{ color: '#059669', fontWeight: 700 }}>● Team Leader</span> : 'Member'}
                          </div>
                        </td>
                        <td style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>{s.roll_no}</td>
                        <td>
                          {s.phase1 ? (
                            s.phase1.isAbsent ? (
                              <span className="badge badge-danger" style={{ fontSize: '10px' }}>Absent</span>
                            ) : (
                              <span style={{ fontWeight: 700, color: '#059669', fontSize: '12px' }}>{s.phase1.score} / 10</span>
                            )
                          ) : (
                            <span style={{ color: 'var(--color-text-faint)', fontSize: '11px' }}>—</span>
                          )}
                        </td>
                        <td>
                          {s.phase2 ? (
                            s.phase2.isAbsent ? (
                              <span className="badge badge-danger" style={{ fontSize: '10px' }}>Absent</span>
                            ) : (
                              <span style={{ fontWeight: 700, color: '#2563EB', fontSize: '12px' }}>{s.phase2.score} / 10</span>
                            )
                          ) : (
                            <span style={{ color: 'var(--color-text-faint)', fontSize: '11px' }}>—</span>
                          )}
                        </td>
                        <td>
                          {s.phase3 ? (
                            s.phase3.isAbsent ? (
                              <span className="badge badge-danger" style={{ fontSize: '10px' }}>Absent</span>
                            ) : (
                              <span style={{ fontWeight: 700, color: '#7C3AED', fontSize: '12px' }}>{s.phase3.score} / 10</span>
                            )
                          ) : (
                            <span style={{ color: 'var(--color-text-faint)', fontSize: '11px' }}>—</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                              onClick={() => handleOpenScoreEditor(selectedTeamModal, s, 1)}
                              className="btn btn-outline"
                              style={{ padding: '3px 8px', fontSize: '11px' }}
                              title="Edit Phase 1 Score"
                            >
                              P1
                            </button>
                            <button
                              onClick={() => handleOpenScoreEditor(selectedTeamModal, s, 2)}
                              className="btn btn-outline"
                              style={{ padding: '3px 8px', fontSize: '11px' }}
                              title="Edit Phase 2 Score"
                            >
                              P2
                            </button>
                            <button
                              onClick={() => handleOpenScoreEditor(selectedTeamModal, s, 3)}
                              className="btn btn-outline"
                              style={{ padding: '3px 8px', fontSize: '11px' }}
                              title="Edit Phase 3 Score"
                            >
                              P3
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                {selectedTeamModal.program} • {selectedTeamModal.team_name}
              </div>
              <button
                onClick={() => setSelectedTeamModal(null)}
                className="btn btn-outline"
                style={{ minWidth: '100px', padding: '8px 18px', fontWeight: 600 }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 4: ADMIN DIRECT SCORE OVERRIDE / EDIT MODAL                   */}
      {/* =================================================================== */}
      {scoreEditModalOpen && editingStudentData && (
        <div
          className="modal-overlay-responsive"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1400,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(3px)',
            WebkitBackdropFilter: 'blur(3px)',
            padding: '16px',
          }}
          onClick={() => setScoreEditModalOpen(false)}
        >
          <div
            className="card animate-scale-in modal-card-responsive"
            style={{
              width: '100%',
              maxWidth: '480px',
              padding: '24px',
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
              border: '1px solid var(--color-border)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', gap: '12px' }}>
              <div>
                <span className="badge badge-brand" style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Phase {editingStudentData.phaseNumber} Evaluation
                </span>
                <h3 style={{ fontSize: '18px', fontWeight: 800, marginTop: '4px', color: 'var(--color-ink)' }}>
                  Edit Student Score
                </h3>
              </div>
              <button
                onClick={() => setScoreEditModalOpen(false)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-canvas-soft)',
                  cursor: 'pointer',
                  color: 'var(--color-ink)',
                  flexShrink: 0,
                }}
                className="btn-icon-hover"
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ backgroundColor: 'var(--color-canvas-soft)', padding: '12px 14px', borderRadius: '10px', marginBottom: '16px', fontSize: '12.5px', border: '1px solid var(--color-border)' }}>
              <div style={{ fontWeight: 700, color: 'var(--color-ink)' }}>{editingStudentData.studentName} <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(Roll: {editingStudentData.rollNo})</span></div>
              <div style={{ color: 'var(--color-text-muted)', fontSize: '11.5px', marginTop: '2px' }}>Team: <strong>{editingStudentData.teamName}</strong></div>
            </div>

            {scoreEditMessage && (
              <div className={`alert-banner ${scoreEditMessage.includes('Error') ? 'alert-danger' : 'alert-success'}`} style={{ marginBottom: '14px', fontSize: '12px' }}>
                {scoreEditMessage}
              </div>
            )}

            <form onSubmit={handleSubmitScoreEdit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="input-label" style={{ fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>Score out of 10</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.5"
                  className="input-field"
                  disabled={editingStudentData.isAbsent}
                  value={editingStudentData.isAbsent ? '' : editingStudentData.currentScore}
                  onChange={(e) => setEditingStudentData({ ...editingStudentData, currentScore: e.target.value })}
                  placeholder="e.g. 9.5"
                  required={!editingStudentData.isAbsent}
                  style={{ fontSize: '14px', fontWeight: 600 }}
                />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', padding: '6px 0' }}>
                <input
                  type="checkbox"
                  checked={editingStudentData.isAbsent}
                  onChange={(e) => setEditingStudentData({ ...editingStudentData, isAbsent: e.target.checked })}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--color-danger)' }}
                />
                <span style={{ color: editingStudentData.isAbsent ? 'var(--color-danger)' : 'var(--color-ink)', fontWeight: 600 }}>
                  Mark Student as Absent
                </span>
              </label>

              <div>
                <label className="input-label" style={{ fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>Remarks / Modification Reason</label>
                <input
                  type="text"
                  className="input-field"
                  value={editingStudentData.remarks}
                  onChange={(e) => setEditingStudentData({ ...editingStudentData, remarks: e.target.value })}
                  placeholder="e.g. Verified by Project Incharge after viva"
                  style={{ fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--color-border)' }}>
                <button type="button" className="btn btn-outline" onClick={() => setScoreEditModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={scoreEditLoading}>
                  {scoreEditLoading ? 'Updating Score...' : 'Save Updated Score'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 5: SUPERVISOR DETAILS MODAL                                   */}
      {/* =================================================================== */}
      {selectedSupervisorModal && (
        <div
          className="modal-overlay-responsive"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1300,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            padding: '24px 16px',
            overflowY: 'auto',
          }}
          onClick={() => setSelectedSupervisorModal(null)}
        >
          <div
            className="card animate-scale-in modal-card-responsive"
            style={{
              width: '100%',
              maxWidth: '720px',
              maxHeight: 'min(90vh, 680px)',
              overflowY: 'auto',
              padding: '24px',
              borderRadius: '16px',
              backgroundColor: '#FFFFFF',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
              border: '1px solid var(--color-border)',
              margin: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <span className="badge badge-brand" style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
                  Faculty Supervisor
                </span>
                <h3 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-ink)', letterSpacing: '-0.02em', margin: '2px 0 6px 0' }}>
                  {selectedSupervisorModal.name}
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                  {selectedSupervisorModal.email && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                      <Mail size={13} style={{ color: 'var(--color-brand)' }} />
                      <span>{selectedSupervisorModal.email}</span>
                    </div>
                  )}
                  {selectedSupervisorModal.phone && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                      <Phone size={13} style={{ color: 'var(--color-brand)' }} />
                      <span>{selectedSupervisorModal.phone}</span>
                    </div>
                  )}
                  {selectedSupervisorModal.cabin && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                      <MapPin size={13} style={{ color: 'var(--color-brand)' }} />
                      <span>{selectedSupervisorModal.cabin}</span>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedSupervisorModal(null)}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-canvas-soft)',
                  cursor: 'pointer',
                  color: 'var(--color-ink)',
                  transition: 'all 0.15s ease',
                  flexShrink: 0,
                }}
                className="btn-icon-hover"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Assigned Teams */}
            <div style={{ marginBottom: '22px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '10px', color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Assigned Teams <span className="badge badge-neutral" style={{ fontSize: '11px' }}>{selectedSupervisorModal.assignedTeams?.length || 0}</span>
              </h4>
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Team</th>
                      <th>Leader</th>
                      <th>Members</th>
                      <th>Clearances</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSupervisorModal.assignedTeams?.map((t: any) => (
                      <tr key={t.id}>
                        <td><strong>{t.team_name}</strong></td>
                        <td style={{ fontSize: '12px' }}>{t.leaderName}</td>
                        <td style={{ fontSize: '12px' }}>{t.studentCount} Students</td>
                        <td>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <span className={`badge ${t.phase1_approved ? 'badge-success' : 'badge-neutral'}`} style={{ fontSize: '10px' }}>P1</span>
                            <span className={`badge ${t.phase2_approved ? 'badge-success' : 'badge-neutral'}`} style={{ fontSize: '10px' }}>P2</span>
                            <span className={`badge ${t.phase3_approved ? 'badge-success' : 'badge-neutral'}`} style={{ fontSize: '10px' }}>P3</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Assigned Panel Duties */}
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '10px', color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Panel Judge Duties <span className="badge badge-neutral" style={{ fontSize: '11px' }}>{selectedSupervisorModal.assignedPanels?.length || 0}</span>
              </h4>
              {selectedSupervisorModal.assignedPanels?.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', backgroundColor: 'var(--color-canvas-soft)', borderRadius: '10px', border: '1px dashed var(--color-border)', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                  No panel evaluation duties assigned.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedSupervisorModal.assignedPanels?.map((p: any) => (
                    <div key={p.id} style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-canvas-soft)', fontSize: '12.5px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--color-ink)' }}>{p.panel_name} (Phase {p.phase_number})</div>
                      <div style={{ color: 'var(--color-text-muted)', fontSize: '11.5px', marginTop: '3px' }}>
                        {p.range} • {p.time_window} • Venue: {p.room_number || 'Room 402 (AB10)'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedSupervisorModal(null)} className="btn btn-outline" style={{ minWidth: '100px', padding: '8px 18px', fontWeight: 600 }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
