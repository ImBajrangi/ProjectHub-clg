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
  Copy,
  Send,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import LoadingScreen from '@/components/LoadingScreen';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [adminData, setAdminData] = useState<any>(null);

  // Segmented Navigation: Avoid cluttering everything on one page!
  const [activeTab, setActiveTab] = useState<'overview' | 'teams' | 'panels' | 'defaulting'>('overview');

  // Teams Directory State
  const [searchQuery, setSearchQuery] = useState('');
  const [programFilter, setProgramFilter] = useState<'all' | 'BCA' | 'BCA - DS'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTeamModal, setSelectedTeamModal] = useState<any>(null);
  const PAGE_SIZE = 10;

  // JSON Batch Modal State (Per user specification)
  const [jsonModalOpen, setJsonModalOpen] = useState(false);
  const [jsonModalTab, setJsonModalTab] = useState<'panels' | 'schedules'>('panels');
  const [targetPhase, setTargetPhase] = useState<1 | 2 | 3>(1);

  // JSON 1: Panel Assignment Input (No panel name, range start, range end, comma-separated emails)
  const [panelsJsonInput, setPanelsJsonInput] = useState('');
  const [panelsSubmitLoading, setPanelsSubmitLoading] = useState(false);
  const [panelsMessage, setPanelsMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // JSON 2: Presentation Schedules Input (Date, shift, room; AB10 fixed)
  const [schedulesJsonInput, setSchedulesJsonInput] = useState('');
  const [schedulesSubmitLoading, setSchedulesSubmitLoading] = useState(false);
  const [schedulesMessage, setSchedulesMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // Lock background scroll when modals are open
  useEffect(() => {
    if (jsonModalOpen || selectedTeamModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [jsonModalOpen, selectedTeamModal]);

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
      }
    } catch (e) {
      console.error(e);
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
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Example JSON Templates
  const EXAMPLE_PANELS_JSON = `[
  {
    "range_start": 1,
    "range_end": 10,
    "panel_emails": "narendra.mohan@gla.ac.in, sachin.sharma@gla.ac.in"
  },
  {
    "range_start": 11,
    "range_end": 20,
    "panel_emails": "anuj.mangal@gla.ac.in, dheerendra.prasad@gla.ac.in"
  },
  {
    "range_start": 21,
    "range_end": 30,
    "panel_emails": "harish.kumar@gla.ac.in, ashish.sharma@gla.ac.in"
  }
]`;

  const EXAMPLE_SCHEDULES_JSON = `[
  {
    "panel_index": 1,
    "date": "2026-09-15",
    "shift": "Shift 1: Morning (09:00 AM - 01:00 PM)",
    "room": "Room 402"
  },
  {
    "panel_index": 1,
    "date": "2026-09-15",
    "shift": "Shift 2: Evening (02:00 PM - 06:00 PM)",
    "room": "Room 402"
  },
  {
    "panel_index": 2,
    "date": "2026-09-15",
    "shift": "Shift 1: Morning (09:00 AM - 01:00 PM)",
    "room": "Room 405"
  }
]`;

  // Submit JSON 1: Batch Panels
  const handleBatchPanelsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPanelsMessage(null);
    setPanelsSubmitLoading(true);

    try {
      const res = await fetch('/api/panels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'batch_json_panels',
          phaseNumber: targetPhase,
          panelsData: panelsJsonInput,
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

  // Submit JSON 2: Batch Schedules
  const handleBatchSchedulesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSchedulesMessage(null);
    setSchedulesSubmitLoading(true);

    try {
      const res = await fetch('/api/panels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'batch_json_schedules',
          phaseNumber: targetPhase,
          schedulesData: schedulesJsonInput,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSchedulesMessage({ type: 'error', text: data.error || 'Failed to update schedules' });
      } else {
        setSchedulesMessage({ type: 'success', text: data.message });
        loadAdminData();
      }
    } catch (err: any) {
      setSchedulesMessage({ type: 'error', text: err.message || 'Error occurred' });
    } finally {
      setSchedulesSubmitLoading(false);
    }
  };

  if (loading) {
    return <LoadingScreen label="Loading administration portal..." />;
  }

  const summary = adminData?.summary || {};
  const teams = adminData?.teams || [];
  const phases = adminData?.phases || [];
  const panels = adminData?.panels || [];

  // Filtered teams for Tab 2
  const filteredTeams = teams.filter((t: any) => {
    const matchesSearch =
      t.team_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.team_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.supervisor?.name && t.supervisor.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.leader?.name && t.leader.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesProgram =
      programFilter === 'all' ||
      (programFilter === 'BCA' && t.program === 'BCA') ||
      (programFilter === 'BCA - DS' && t.program.includes('DS'));

    return matchesSearch && matchesProgram;
  });

  const totalPages = Math.ceil(filteredTeams.length / PAGE_SIZE) || 1;
  const paginatedTeams = filteredTeams.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Defaulting teams for Tab 4
  const defaultingTeams = teams.filter((t: any) => t.isDefaulting);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-canvas)' }}>
      <Navbar user={currentUser} />

      <main className="container" style={{ flex: 1, paddingBottom: '60px' }}>
        {/* Page Title & Navigation */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
            <div>
              <span className="badge badge-neutral" style={{ marginBottom: '8px' }}>
                <Shield size={12} /> Project Incharge Administration
              </span>
              <h1 style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-0.03em' }}>
                Academic Operations Hub
              </h1>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginTop: '4px' }}>
                Governance across 102 project teams, 601 students, and 23 faculty mentors.
              </p>
            </div>

            {/* Main Action: Assign Panels & Shift Logistics via JSON */}
            <button
              onClick={() => {
                setJsonModalOpen(true);
                setPanelsMessage(null);
                setSchedulesMessage(null);
              }}
              className="btn btn-primary"
              style={{ padding: '10px 20px', fontSize: '14px' }}
            >
              <FileCode size={16} /> Assign Panels & Logistics (JSON)
            </button>
          </div>

          {/* Mobbin Segmented Stadium Control */}
          <div className="segmented-control" style={{ width: '100%', justifyContent: 'flex-start' }}>
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
              Teams Directory ({teams.length})
            </button>
            <button
              className={`segmented-pill ${activeTab === 'panels' ? 'active' : ''}`}
              onClick={() => setActiveTab('panels')}
            >
              Panels & Schedules ({panels.length})
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
        {/* TAB 1: OVERVIEW & LIVE CALENDAR */}
        {/* =================================================================== */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {/* 4 Metric Cards */}
            <div className="grid-cols-4">
              <div className="card-soft">
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                  Total Project Teams
                </div>
                <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--color-ink)', marginTop: '4px' }}>
                  {summary.totalTeams || 102}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  {summary.totalStudents || 601} Registered Students
                </div>
              </div>

              <div className="card-soft">
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                  Team Leaders
                </div>
                <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--color-ink)', marginTop: '4px' }}>
                  {summary.claimedLeaders || 0}
                </div>
                <div style={{ fontSize: '12px', color: summary.unclaimedLeaders > 0 ? 'var(--color-danger)' : 'var(--color-success)', marginTop: '4px' }}>
                  {summary.unclaimedLeaders || 0} Awaiting Election at /leader
                </div>
              </div>

              <div className="card-soft">
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                  Faculty Supervisors
                </div>
                <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--color-ink)', marginTop: '4px' }}>
                  {summary.totalSupervisors || 23}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  {summary.totalMeetings || 0} Review Sessions Logged
                </div>
              </div>

              <div className="card-soft">
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                  Defaulting Teams
                </div>
                <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--color-danger)', marginTop: '4px' }}>
                  {defaultingTeams.length}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  Missing leader or approvals
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
                {phases.map((ph: any) => (
                  <div
                    key={ph.id}
                    style={{
                      backgroundColor: ph.is_live ? 'var(--color-canvas-soft)' : 'var(--color-canvas)',
                      border: '1px solid var(--color-hairline)',
                      borderRadius: 'var(--rounded-sm)',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span className="badge badge-neutral" style={{ fontSize: '11px' }}>Phase {ph.phase_number}</span>
                        {ph.is_live ? (
                          <span className="badge badge-success" style={{ fontSize: '11px' }}>● Live</span>
                        ) : (
                          <span className="badge badge-neutral" style={{ fontSize: '11px' }}>Inactive</span>
                        )}
                      </div>
                      <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px' }}>{ph.phase_name}</h4>
                      <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
                        {ph.description}
                      </p>
                    </div>

                    <button
                      onClick={() => handleTogglePhaseLive(ph.phase_number, ph.is_live)}
                      className={ph.is_live ? 'btn btn-outline' : 'btn btn-primary'}
                      style={{ width: '100%', fontSize: '13px' }}
                    >
                      {ph.is_live ? 'End Live Session' : 'Set Phase to LIVE'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 2: TEAMS DIRECTORY */}
        {/* =================================================================== */}
        {activeTab === 'teams' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Filter Bar */}
            <div className="card" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ position: 'relative', minWidth: '260px' }}>
                  <input
                    type="text"
                    className="input-field"
                    style={{ paddingLeft: '36px', height: '40px', fontSize: '13px' }}
                    placeholder="Search team, student, or supervisor..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                  <Search size={15} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--color-text-muted)' }} />
                </div>

                <div className="segmented-control" style={{ padding: '3px' }}>
                  <button
                    className={`segmented-pill ${programFilter === 'all' ? 'active' : ''}`}
                    onClick={() => {
                      setProgramFilter('all');
                      setCurrentPage(1);
                    }}
                    style={{ padding: '6px 14px', fontSize: '12px' }}
                  >
                    All Programs ({teams.length})
                  </button>
                  <button
                    className={`segmented-pill ${programFilter === 'BCA' ? 'active' : ''}`}
                    onClick={() => {
                      setProgramFilter('BCA');
                      setCurrentPage(1);
                    }}
                    style={{ padding: '6px 14px', fontSize: '12px' }}
                  >
                    BCA (93)
                  </button>
                  <button
                    className={`segmented-pill ${programFilter === 'BCA - DS' ? 'active' : ''}`}
                    onClick={() => {
                      setProgramFilter('BCA - DS');
                      setCurrentPage(1);
                    }}
                    style={{ padding: '6px 14px', fontSize: '12px' }}
                  >
                    BCA-DS (9)
                  </button>
                </div>

                <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                  Showing <strong>{filteredTeams.length}</strong> matching teams
                </div>
              </div>
            </div>

            {/* Paginated Data Table */}
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Team</th>
                    <th>Faculty Supervisor</th>
                    <th>Leader</th>
                    <th>Problem Statement</th>
                    <th>Phase Clearances</th>
                    <th>Meets</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTeams.map((t: any) => (
                    <tr key={t.id}>
                      <td>
                        <strong style={{ color: 'var(--color-ink)' }}>{t.team_name}</strong>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                          {t.program} • {t.studentCount} Members
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{t.supervisor?.name || 'N/A'}</div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                          {t.supervisor?.phone}
                        </div>
                      </td>
                      <td>
                        {t.leader ? (
                          <div>
                            <div style={{ color: 'var(--color-success)', fontWeight: 600 }}>
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
                        {t.problemStatement?.status === 'approved' ? (
                          <span className="badge badge-success" style={{ fontSize: '10px' }}>Approved</span>
                        ) : t.problemStatement?.status === 'pending' ? (
                          <span className="badge badge-warning" style={{ fontSize: '10px' }}>Pending</span>
                        ) : (
                          <span style={{ color: 'var(--color-text-faint)', fontSize: '11px' }}>None</span>
                        )}
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
                      <td style={{ color: 'var(--color-text-muted)' }}>{t.meetingCount}</td>
                      <td>
                        <button
                          onClick={() => setSelectedTeamModal(t)}
                          className="btn btn-outline"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          <Eye size={13} /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
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
        {/* TAB 3: PANELS & SCHEDULES DIRECTORY */}
        {/* =================================================================== */}
        {activeTab === 'panels' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Allocated Evaluation Panels</h3>
                <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                  Fixed Venue: <strong>Academic Block AB10</strong> • Conflict-checked faculty judge rosters.
                </p>
              </div>
              <button
                onClick={() => {
                  setJsonModalOpen(true);
                  setPanelsMessage(null);
                  setSchedulesMessage(null);
                }}
                className="btn btn-primary"
              >
                <FileCode size={15} /> Paste JSON Configuration
              </button>
            </div>

            {panels.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
                <Award size={40} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
                <h4 style={{ fontSize: '16px', fontWeight: 700 }}>No Panels Allocated Yet</h4>
                <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  Click "Paste JSON Configuration" to allocate team ranges, faculty judge emails, and presentation shifts.
                </p>
              </div>
            ) : (
              <div className="grid-cols-3">
                {panels.map((p: any) => (
                  <div key={p.id} className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <h4 style={{ fontSize: '16px', fontWeight: 700 }}>{p.panel_name}</h4>
                      <span className="badge badge-neutral" style={{ fontSize: '11px' }}>Phase {p.phase_number}</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '14px' }}>
                      <div>Range: <strong>Teams #{p.team_range_start} – #{p.team_range_end}</strong></div>
                      <div>Venue: <strong>Academic Block AB10</strong> ({p.room_number || 'Room TBA'})</div>
                      <div>Shift / Time: <strong>{p.time_window || 'Morning (09:00 AM - 01:00 PM)'}</strong></div>
                      <div>Date: <strong>{p.date || 'To Be Announced'}</strong></div>
                    </div>

                    {p.judges && p.judges.length > 0 && (
                      <div style={{ borderTop: '1px solid var(--color-hairline)', paddingTop: '10px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-faint)', marginBottom: '4px' }}>
                          Assigned Faculty Judges:
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
                ))}
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 4: DEFAULTING AUDIT */}
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
              <div className="data-table-container">
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
                      <tr key={t.id}>
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
                            onClick={() => setSelectedTeamModal(t)}
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
            )}
          </div>
        )}
      </main>

      {/* =================================================================== */}
      {/* DEDICATED JSON PASTING CONSOLE (Per User Specification) */}
      {/* =================================================================== */}
      {jsonModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(6px)',
            padding: '20px',
          }}
          onClick={() => setJsonModalOpen(false)}
        >
          <div
            className="card animate-scale-in"
            style={{
              width: '100%',
              maxWidth: '780px',
              maxHeight: '92vh',
              overflowY: 'auto',
              padding: 0,
              backgroundColor: '#FFFFFF',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '20px 28px',
                borderBottom: '1px solid var(--color-hairline)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h3 style={{ fontSize: '19px', fontWeight: 700 }}>
                  Assign Panels & Shift Logistics via JSON
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  Fast batch assignment without manual form typing. Fixed Venue: <strong>Academic Block AB10</strong>.
                </p>
              </div>
              <button
                onClick={() => setJsonModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '24px 28px' }}>
              {/* Step 1: Select Target Phase */}
              <div style={{ marginBottom: '20px' }}>
                <label className="input-label" style={{ fontSize: '14px' }}>
                  Step 1: Select Target Evaluation Phase
                </label>
                <div className="segmented-control" style={{ width: '100%', justifyContent: 'flex-start' }}>
                  <button
                    type="button"
                    className={`segmented-pill ${targetPhase === 1 ? 'active' : ''}`}
                    onClick={() => setTargetPhase(1)}
                  >
                    Phase 1 (Concept Pitch)
                  </button>
                  <button
                    type="button"
                    className={`segmented-pill ${targetPhase === 2 ? 'active' : ''}`}
                    onClick={() => setTargetPhase(2)}
                  >
                    Phase 2 (Working Demo)
                  </button>
                  <button
                    type="button"
                    className={`segmented-pill ${targetPhase === 3 ? 'active' : ''}`}
                    onClick={() => setTargetPhase(3)}
                  >
                    Phase 3 (Final Defense)
                  </button>
                </div>
              </div>

              {/* Step 2: Choose JSON Mode */}
              <div style={{ marginBottom: '20px' }}>
                <label className="input-label" style={{ fontSize: '14px' }}>
                  Step 2: Choose Configuration Type
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setJsonModalTab('panels')}
                    className={jsonModalTab === 'panels' ? 'btn btn-primary' : 'btn btn-outline'}
                    style={{ flex: 1, fontSize: '13px' }}
                  >
                    <Users size={14} /> 1. Team Ranges & Judge Emails
                  </button>
                  <button
                    type="button"
                    onClick={() => setJsonModalTab('schedules')}
                    className={jsonModalTab === 'schedules' ? 'btn btn-primary' : 'btn btn-outline'}
                    style={{ flex: 1, fontSize: '13px' }}
                  >
                    <Calendar size={14} /> 2. Dates, Shifts & Rooms (AB10)
                  </button>
                </div>
              </div>

              {/* TAB A: JSON 1 - PANELS & TEAM RANGES */}
              {jsonModalTab === 'panels' && (
                <form onSubmit={handleBatchPanelsSubmit}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label className="input-label" style={{ marginBottom: 0 }}>
                      Paste JSON (Range Start, Range End, Comma-Separated Judge Emails)
                    </label>
                    <button
                      type="button"
                      onClick={() => setPanelsJsonInput(EXAMPLE_PANELS_JSON)}
                      className="btn btn-soft"
                      style={{ padding: '4px 10px', fontSize: '11px' }}
                    >
                      <Copy size={12} /> Load Example JSON
                    </button>
                  </div>

                  <textarea
                    className="textarea-field"
                    rows={10}
                    style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', lineHeight: '1.5' }}
                    value={panelsJsonInput}
                    onChange={(e) => setPanelsJsonInput(e.target.value)}
                    placeholder={EXAMPLE_PANELS_JSON}
                    required
                  />

                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '8px', lineHeight: '1.5' }}>
                    • No panel name required; system auto-indexes panels.<br />
                    • Comma-separated supervisor emails are validated against the roster.<br />
                    • <strong>Conflict Safeguard:</strong> Automatically checks that no assigned supervisor guides any team in that range.
                  </div>

                  {panelsMessage && (
                    <div
                      className={`alert-banner ${panelsMessage.type === 'error' ? 'alert-danger' : 'alert-success'}`}
                      style={{ marginTop: '16px', whiteSpace: 'pre-wrap' }}
                    >
                      {panelsMessage.text}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => setJsonModalOpen(false)}
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={panelsSubmitLoading || !panelsJsonInput.trim()}
                    >
                      <Send size={14} />
                      {panelsSubmitLoading ? 'Validating Conflicts...' : `Assign Panels for Phase ${targetPhase}`}
                    </button>
                  </div>
                </form>
              )}

              {/* TAB B: JSON 2 - PRESENTATION SHIFTS & ROOMS */}
              {jsonModalTab === 'schedules' && (
                <form onSubmit={handleBatchSchedulesSubmit}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label className="input-label" style={{ marginBottom: 0 }}>
                      Paste JSON (Panel Index, Date, Shift 1 or 2, Room) • Venue Fixed: AB10
                    </label>
                    <button
                      type="button"
                      onClick={() => setSchedulesJsonInput(EXAMPLE_SCHEDULES_JSON)}
                      className="btn btn-soft"
                      style={{ padding: '4px 10px', fontSize: '11px' }}
                    >
                      <Copy size={12} /> Load Example JSON
                    </button>
                  </div>

                  <textarea
                    className="textarea-field"
                    rows={10}
                    style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', lineHeight: '1.5' }}
                    value={schedulesJsonInput}
                    onChange={(e) => setSchedulesJsonInput(e.target.value)}
                    placeholder={EXAMPLE_SCHEDULES_JSON}
                    required
                  />

                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '8px', lineHeight: '1.5' }}>
                    • Venue is automatically set to <strong>Academic Block AB10</strong>.<br />
                    • Supports 2 presentation shifts (Morning and Evening) per panel index.<br />
                    • Updates live schedules published to student team leaders.
                  </div>

                  {schedulesMessage && (
                    <div
                      className={`alert-banner ${schedulesMessage.type === 'error' ? 'alert-danger' : 'alert-success'}`}
                      style={{ marginTop: '16px' }}
                    >
                      {schedulesMessage.text}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => setJsonModalOpen(false)}
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={schedulesSubmitLoading || !schedulesJsonInput.trim()}
                    >
                      <Send size={14} />
                      {schedulesSubmitLoading ? 'Saving Logistics...' : `Save Schedules for Phase ${targetPhase}`}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TEAM DETAIL MODAL */}
      {selectedTeamModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(6px)',
            padding: '20px',
          }}
          onClick={() => setSelectedTeamModal(null)}
        >
          <div
            className="card animate-scale-in"
            style={{
              width: '100%',
              maxWidth: '680px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '28px',
              borderRadius: 'var(--rounded-md)',
              backgroundColor: '#FFFFFF',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <span className="badge badge-neutral" style={{ marginBottom: '6px' }}>{selectedTeamModal.program}</span>
                <h3 style={{ fontSize: '22px', fontWeight: 700 }}>{selectedTeamModal.team_name}</h3>
                <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                  Supervisor: <strong>{selectedTeamModal.supervisor?.name}</strong> ({selectedTeamModal.supervisor?.phone})
                </p>
              </div>
              <button
                onClick={() => setSelectedTeamModal(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Problem Statement Box */}
            <div style={{ backgroundColor: 'var(--color-canvas-soft)', borderRadius: 'var(--rounded-sm)', padding: '16px', marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                Problem Statement ({selectedTeamModal.problemStatement?.status || 'Not Submitted'})
              </div>
              <strong style={{ fontSize: '14px', color: 'var(--color-ink)' }}>
                {selectedTeamModal.problemStatement?.title || 'No Title Submitted'}
              </strong>
              <p style={{ fontSize: '12px', marginTop: '6px', color: 'var(--color-text-muted)', whiteSpace: 'pre-wrap' }}>
                {selectedTeamModal.problemStatement?.description || 'No description submitted yet.'}
              </p>
            </div>

            {/* Students Roster */}
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '10px' }}>
                Team Members ({selectedTeamModal.students?.length || 0})
              </h4>
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Roll No</th>
                      <th>Name</th>
                      <th>Mobile</th>
                      <th>CPI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedTeamModal.students?.map((s: any) => (
                      <tr key={s.id}>
                        <td style={{ color: 'var(--color-text-muted)' }}>{s.roll_no}</td>
                        <td style={{ fontWeight: 600 }}>{s.full_name}</td>
                        <td>{s.mobile}</td>
                        <td>{s.cpi || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedTeamModal(null)} className="btn btn-outline">
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
