'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Search,
  X,
  ExternalLink,
} from 'lucide-react';
import LoadingScreen from '@/components/LoadingScreen';

interface DevProfile {
  name: string;
  role: string;
  link: string;
  image: string;
  fallback: string;
  initials: string;
}

const developers: DevProfile[] = [
  {
    name: 'Arpit Pandey',
    role: 'BCA (DS)',
    link: 'https://www.linkedin.com/in/dev-arpit/',
    image: '/image/arpit.webp',
    fallback: '/image/arpit.png',
    initials: 'AP',
  },
  {
    name: 'Rishabh Mishra',
    role: 'BCA (DS)',
    link: 'https://www.linkedin.com/in/rishabh-mishra-bab420309/',
    image: '/image/rishabh.webp',
    fallback: '/image/rishabh.png',
    initials: 'RM',
  },
  {
    name: 'Harsh Sharma',
    role: 'BCA (DS)',
    link: 'https://www.linkedin.com/in/harshiitm/',
    image: '/image/harsh.webp',
    fallback: '/image/harsh.png',
    initials: 'HS',
  },
  {
    name: 'CodeShastra',
    role: 'Team',
    link: 'https://www.instagram.com/code___shastra/',
    image: '/image/CodeShastra.webp',
    fallback: '/image/CodeShastra.png',
    initials: 'CS',
  },
];

function FooterDevPill({ dev }: { dev: DevProfile }) {
  const [imgSrc, setImgSrc] = useState(dev.image);
  const [hasError, setHasError] = useState(false);

  return (
    <a
      href={dev.link}
      target="_blank"
      rel="noopener noreferrer"
      className="cohere-dev-pill"
      title={`${dev.name} • ${dev.role}`}
    >
      <div className="cohere-dev-avatar-box">
        {!hasError ? (
          <img
            src={imgSrc}
            alt={dev.name}
            className="cohere-dev-avatar-img"
            onError={() => {
              if (imgSrc === dev.image && dev.fallback) {
                setImgSrc(dev.fallback);
              } else {
                setHasError(true);
              }
            }}
          />
        ) : (
          <span className="cohere-dev-avatar-fallback">{dev.initials}</span>
        )}
      </div>
      <span className="cohere-dev-name mono">{dev.name}</span>
      <ExternalLink size={9} className="cohere-dev-ext-icon" />
    </a>
  );
}

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

function SignUpForm() {
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

  // Team search & dropdown state
  const [teamSearchQuery, setTeamSearchQuery] = useState('');
  const [teamDropdownOpen, setTeamDropdownOpen] = useState(false);
  const teamDropdownRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Email search & dropdown state
  const [emailSearchQuery, setEmailSearchQuery] = useState('');
  const [emailDropdownOpen, setEmailDropdownOpen] = useState(false);
  const emailDropdownRef = React.useRef<HTMLDivElement>(null);
  const emailSearchInputRef = React.useRef<HTMLInputElement>(null);

  // Close dropdowns on outside click or Escape key
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (teamDropdownRef.current && !teamDropdownRef.current.contains(e.target as Node)) {
        setTeamDropdownOpen(false);
      }
      if (emailDropdownRef.current && !emailDropdownRef.current.contains(e.target as Node)) {
        setEmailDropdownOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setTeamDropdownOpen(false);
        setEmailDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Auto-focus search input when team dropdown opens
  useEffect(() => {
    if (teamDropdownOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setTeamSearchQuery('');
    }
  }, [teamDropdownOpen]);

  // Auto-focus search input when email dropdown opens
  useEffect(() => {
    if (emailDropdownOpen) {
      setTimeout(() => {
        emailSearchInputRef.current?.focus();
      }, 50);
    } else {
      setEmailSearchQuery('');
    }
  }, [emailDropdownOpen]);

  const selectedTeamObj = teams.find((t) => t.id === selectedTeamId);

  const filteredTeams = teams.filter((t) => {
    if (!teamSearchQuery.trim()) return true;
    const q = teamSearchQuery.toLowerCase().trim();
    return (
      (t.team_name || '').toLowerCase().includes(q) ||
      (t.team_code || '').toLowerCase().includes(q) ||
      (t.program || '').toLowerCase().includes(q)
    );
  });

  const filteredMembers = members.filter((m) => {
    if (!emailSearchQuery.trim()) return true;
    const q = emailSearchQuery.toLowerCase().trim();
    return (
      (m.full_name || '').toLowerCase().includes(q) ||
      (m.email || '').toLowerCase().includes(q) ||
      (m.roll_no || '').toLowerCase().includes(q) ||
      (m.course || '').toLowerCase().includes(q)
    );
  });

  // Check if session exists
  useEffect(() => {
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

      // Perform immediate direct login
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
      }, 1800);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      setSubmitting(false);
    }
  };

  return (
    <div className="cohere-page-wrapper">
      {/* Top Header */}
      <header className="cohere-top-header">
        <Link href="/" className="cohere-brand-link">
          <span className="cohere-brand-name">
            CodeShastra <span style={{ color: '#64748B', fontWeight: 500 }}>Hub</span>
          </span>
        </Link>

        <div className="cohere-top-right">
          <Link href="/login" className="cohere-top-signup-btn">
            Log in
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="cohere-main-container">
        {/* Themed Single Botanical Growth Background Graphic */}
        <div className="cohere-bg-hero-graphic" aria-hidden="true">
          <img
            src="/images/undraw/plants-themed.svg"
            alt="Nurturing & Cultivating Projects"
            className="cohere-bg-plants-img"
          />
        </div>

        {/* Centered Spacious White Card */}
        <div className="cohere-login-card">
          <h1 className="cohere-login-title">Sign up</h1>

          {/* Error Message Banner */}
          {error && (
            <div className="cohere-alert-box">
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Congratulations Success Bar with Themed Join Illustration */}
          {successMessage && (
            <div className="cohere-congrats-bar" role="status" aria-live="polite">
              <div className="cohere-congrats-art">
                <img
                  src="/images/undraw/join-themed.svg"
                  alt="Team designated successfully - Congratulations!"
                  className="cohere-congrats-img"
                />
              </div>
              <div className="cohere-congrats-content">
                <div className="cohere-congrats-pill mono">
                  <CheckCircle2 size={12} strokeWidth={2.5} />
                  <span>LEADERSHIP CONFIRMED</span>
                </div>
                <h3 className="cohere-congrats-heading">Congratulations!</h3>
                <p className="cohere-congrats-sub">
                  Your team leader account has been activated. Directing you to your workspace.
                </p>
                <div className="cohere-congrats-progress-track">
                  <div className="cohere-congrats-progress-fill" />
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="cohere-form">
            {/* Signature Cohere Stacked Compartment Box */}
            <div className="cohere-stacked-box">
              {/* Team Selector Compartment with Search Team Bar */}
              <div className="cohere-compartment" ref={teamDropdownRef} style={{ position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label htmlFor="cohere-team-select-trigger" className="cohere-comp-label">
                    PROJECT TEAM
                  </label>
                  {teams.length > 0 && (
                    <span style={{ fontSize: '10.5px', color: '#64748B', fontFamily: 'monospace' }}>
                      {teams.length} teams
                    </span>
                  )}
                </div>

                {/* Searchable Combobox Trigger */}
                <div
                  id="cohere-team-select-trigger"
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    if (!loadingTeams && !submitting) {
                      setEmailDropdownOpen(false);
                      setTeamDropdownOpen((prev) => !prev);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      if (!loadingTeams && !submitting) {
                        setEmailDropdownOpen(false);
                        setTeamDropdownOpen((prev) => !prev);
                      }
                    }
                  }}
                  className="cohere-select-wrapper"
                  style={{
                    cursor: loadingTeams || submitting ? 'not-allowed' : 'pointer',
                    padding: '3px 0 1px 0',
                    userSelect: 'none',
                  }}
                >
                  <div
                    className="mono"
                    style={{
                      fontSize: '14.5px',
                      color: selectedTeamObj ? '#111827' : '#6B7280',
                      fontWeight: selectedTeamObj ? 600 : 400,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      width: '100%',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      paddingRight: '24px',
                    }}
                  >
                    {loadingTeams ? (
                      'Loading eligible teams...'
                    ) : selectedTeamObj ? (
                      <>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedTeamObj.team_name}</span>
                        <span
                          style={{
                            fontSize: '10.5px',
                            color: '#475569',
                            fontWeight: 600,
                            backgroundColor: '#F1F5F9',
                            border: '1px solid #E2E8F0',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            flexShrink: 0,
                          }}
                        >
                          {selectedTeamObj.program}
                        </span>
                      </>
                    ) : (
                      '-- Choose your project team --'
                    )}
                  </div>
                  <div className="cohere-select-chevron" style={{ color: '#6B7280' }}>
                    {teamDropdownOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </div>
                </div>

                {/* Hidden input to ensure HTML form validity */}
                <input type="hidden" name="teamId" value={selectedTeamId} required />

                {/* Searchable Dropdown Menu with Search Team Bar */}
                {teamDropdownOpen && (
                  <div
                    className="team-search-dropdown-popup"
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      left: 0,
                      right: 0,
                      zIndex: 1000,
                      backgroundColor: '#FFFFFF',
                      borderRadius: '12px',
                      border: '1px solid #E2E8F0',
                      boxShadow: '0 20px 35px -4px rgba(15, 23, 42, 0.16), 0 8px 16px -4px rgba(15, 23, 42, 0.08)',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Search Team Bar Header */}
                    <div
                      style={{
                        padding: '10px 14px',
                        borderBottom: '1px solid #F1F5F9',
                        backgroundColor: '#F8FAFC',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                      }}
                    >
                      <Search size={15} style={{ color: '#64748B', flexShrink: 0 }} />
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={teamSearchQuery}
                        onChange={(e) => setTeamSearchQuery(e.target.value)}
                        placeholder="Search team name, code, program..."
                        className="cohere-team-search-input"
                        style={{
                          border: 'none',
                          outline: 'none',
                          boxShadow: 'none',
                          WebkitBoxShadow: 'none',
                          background: 'transparent',
                          fontSize: '13.5px',
                          color: '#0F172A',
                          width: '100%',
                          fontFamily: 'inherit',
                          padding: '2px 0',
                          lineHeight: '1.4',
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      {teamSearchQuery && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTeamSearchQuery('');
                            searchInputRef.current?.focus();
                          }}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: '#94A3B8',
                            cursor: 'pointer',
                            padding: '3px',
                            display: 'flex',
                            alignItems: 'center',
                            borderRadius: '4px',
                          }}
                          aria-label="Clear search"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    {/* Filtered Team List */}
                    <div
                      style={{
                        maxHeight: '210px',
                        overflowY: 'auto',
                        padding: '6px',
                      }}
                    >
                      {filteredTeams.length === 0 ? (
                        <div style={{ padding: '24px 14px', textAlign: 'center' }}>
                          <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#64748B' }}>
                            No teams match &ldquo;<strong>{teamSearchQuery}</strong>&rdquo;
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setTeamSearchQuery('');
                              searchInputRef.current?.focus();
                            }}
                            style={{
                              fontSize: '12px',
                              color: '#2563EB',
                              background: 'transparent',
                              border: 'none',
                              fontWeight: 600,
                              cursor: 'pointer',
                              padding: '2px 6px',
                            }}
                          >
                            Clear search filter
                          </button>
                        </div>
                      ) : (
                        filteredTeams.map((t) => {
                          const isSelected = t.id === selectedTeamId;
                          return (
                            <div
                              key={t.id}
                              onClick={() => {
                                setSelectedTeamId(t.id);
                                setTeamDropdownOpen(false);
                              }}
                              style={{
                                padding: '10px 12px',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '8px',
                                cursor: 'pointer',
                                backgroundColor: isSelected ? '#EFF6FF' : 'transparent',
                                transition: 'all 0.12s ease',
                                margin: '1px 0',
                              }}
                              onMouseEnter={(e) => {
                                if (!isSelected) e.currentTarget.style.backgroundColor = '#F8FAFC';
                              }}
                              onMouseLeave={(e) => {
                                if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                            >
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                                <span
                                  style={{
                                    fontSize: '13.5px',
                                    fontWeight: isSelected ? 700 : 500,
                                    color: isSelected ? '#1D4ED8' : '#0F172A',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {t.team_name}
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748B' }}>
                                  <span style={{ fontFamily: 'monospace' }}>{t.team_code}</span>
                                  <span>•</span>
                                  <span
                                    style={{
                                      backgroundColor: '#F1F5F9',
                                      padding: '1px 6px',
                                      borderRadius: '4px',
                                      border: '1px solid #E2E8F0',
                                      fontWeight: 500,
                                    }}
                                  >
                                    {t.program}
                                  </span>
                                </div>
                              </div>
                              {isSelected && (
                                <CheckCircle2 size={16} style={{ color: '#2563EB', flexShrink: 0 }} />
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Compartment Divider */}
              <div className="cohere-comp-divider" />

              {/* Leader Email Selector Compartment with Search Bar */}
              <div className="cohere-compartment" ref={emailDropdownRef} style={{ position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label htmlFor="cohere-email-select-trigger" className="cohere-comp-label">
                    LEADER EMAIL
                  </label>
                  {selectedTeamId && members.length > 0 && (
                    <span style={{ fontSize: '10.5px', color: '#64748B', fontFamily: 'monospace' }}>
                      {members.length} members
                    </span>
                  )}
                </div>

                {/* Searchable Combobox Trigger */}
                <div
                  id="cohere-email-select-trigger"
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    if (!selectedTeamId || loadingMembers || submitting) return;
                    setTeamDropdownOpen(false);
                    setEmailDropdownOpen((prev) => !prev);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      if (selectedTeamId && !loadingMembers && !submitting) {
                        setTeamDropdownOpen(false);
                        setEmailDropdownOpen((prev) => !prev);
                      }
                    }
                  }}
                  className="cohere-select-wrapper"
                  style={{
                    cursor: !selectedTeamId || loadingMembers || submitting ? 'not-allowed' : 'pointer',
                    padding: '3px 0 1px 0',
                    userSelect: 'none',
                  }}
                >
                  <div
                    className="mono"
                    style={{
                      fontSize: '14.5px',
                      color: selectedMemberObj ? '#111827' : '#6B7280',
                      fontWeight: selectedMemberObj ? 600 : 400,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      width: '100%',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      paddingRight: '24px',
                    }}
                  >
                    {!selectedTeamId ? (
                      '-- Select team first --'
                    ) : loadingMembers ? (
                      'Loading team members...'
                    ) : selectedMemberObj ? (
                      <>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedMemberObj.full_name}</span>
                        <span
                          style={{
                            fontSize: '10.5px',
                            color: '#475569',
                            fontWeight: 600,
                            backgroundColor: '#F1F5F9',
                            border: '1px solid #E2E8F0',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            flexShrink: 0,
                          }}
                        >
                          {selectedMemberObj.email}
                        </span>
                      </>
                    ) : (
                      '-- Select your student email --'
                    )}
                  </div>
                  <div className="cohere-select-chevron" style={{ color: '#6B7280' }}>
                    {emailDropdownOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </div>
                </div>

                {/* Hidden input to ensure HTML form validity */}
                <input type="hidden" name="studentEmail" value={selectedEmail} required />

                {/* Searchable Dropdown Menu with Search Member Bar */}
                {emailDropdownOpen && (
                  <div
                    className="team-search-dropdown-popup"
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      left: 0,
                      right: 0,
                      zIndex: 1000,
                      backgroundColor: '#FFFFFF',
                      borderRadius: '12px',
                      border: '1px solid #E2E8F0',
                      boxShadow: '0 20px 35px -4px rgba(15, 23, 42, 0.16), 0 8px 16px -4px rgba(15, 23, 42, 0.08)',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Search Member Bar Header */}
                    <div
                      style={{
                        padding: '10px 14px',
                        borderBottom: '1px solid #F1F5F9',
                        backgroundColor: '#F8FAFC',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                      }}
                    >
                      <Search size={15} style={{ color: '#64748B', flexShrink: 0 }} />
                      <input
                        ref={emailSearchInputRef}
                        type="text"
                        value={emailSearchQuery}
                        onChange={(e) => setEmailSearchQuery(e.target.value)}
                        placeholder="Search student name, email, roll no..."
                        className="cohere-team-search-input"
                        style={{
                          border: 'none',
                          outline: 'none',
                          boxShadow: 'none',
                          WebkitBoxShadow: 'none',
                          background: 'transparent',
                          fontSize: '13.5px',
                          color: '#0F172A',
                          width: '100%',
                          fontFamily: 'inherit',
                          padding: '2px 0',
                          lineHeight: '1.4',
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      {emailSearchQuery && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEmailSearchQuery('');
                            emailSearchInputRef.current?.focus();
                          }}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: '#94A3B8',
                            cursor: 'pointer',
                            padding: '3px',
                            display: 'flex',
                            alignItems: 'center',
                            borderRadius: '4px',
                          }}
                          aria-label="Clear search"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    {/* Filtered Member List */}
                    <div
                      style={{
                        maxHeight: '210px',
                        overflowY: 'auto',
                        padding: '6px',
                      }}
                    >
                      {filteredMembers.length === 0 ? (
                        <div style={{ padding: '24px 14px', textAlign: 'center' }}>
                          <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#64748B' }}>
                            No team members match &ldquo;<strong>{emailSearchQuery}</strong>&rdquo;
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setEmailSearchQuery('');
                              emailSearchInputRef.current?.focus();
                            }}
                            style={{
                              fontSize: '12px',
                              color: '#2563EB',
                              background: 'transparent',
                              border: 'none',
                              fontWeight: 600,
                              cursor: 'pointer',
                              padding: '2px 6px',
                            }}
                          >
                            Clear search filter
                          </button>
                        </div>
                      ) : (
                        filteredMembers.map((m) => {
                          const isSelected = m.email.toLowerCase() === selectedEmail.toLowerCase();
                          return (
                            <div
                              key={m.id || m.email}
                              onClick={() => {
                                setSelectedEmail(m.email);
                                setEmailDropdownOpen(false);
                              }}
                              style={{
                                padding: '10px 12px',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '8px',
                                cursor: 'pointer',
                                backgroundColor: isSelected ? '#EFF6FF' : 'transparent',
                                transition: 'all 0.12s ease',
                                margin: '1px 0',
                              }}
                              onMouseEnter={(e) => {
                                if (!isSelected) e.currentTarget.style.backgroundColor = '#F8FAFC';
                              }}
                              onMouseLeave={(e) => {
                                if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                            >
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                                <span
                                  style={{
                                    fontSize: '13.5px',
                                    fontWeight: isSelected ? 700 : 500,
                                    color: isSelected ? '#1D4ED8' : '#0F172A',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {m.full_name}
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748B', flexWrap: 'wrap' }}>
                                  <span style={{ fontFamily: 'monospace' }}>{m.email}</span>
                                  {m.roll_no && (
                                    <>
                                      <span>•</span>
                                      <span
                                        style={{
                                          backgroundColor: '#F1F5F9',
                                          padding: '1px 6px',
                                          borderRadius: '4px',
                                          border: '1px solid #E2E8F0',
                                          fontWeight: 500,
                                        }}
                                      >
                                        Roll: {m.roll_no}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                              {isSelected && (
                                <CheckCircle2 size={16} style={{ color: '#2563EB', flexShrink: 0 }} />
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Verified Member Details Badge */}
            {selectedMemberObj && (
              <div className="cohere-member-preview">
                <div className="cohere-preview-header">
                  <div className="cohere-preview-header-left">
                    <ShieldCheck size={14} color="#344D41" strokeWidth={2.5} />
                    <span>Verified Roster Record</span>
                  </div>
                  <span className="cohere-preview-status-tag mono">ELIGIBLE LEADER</span>
                </div>

                <div className="cohere-preview-details mono">
                  <div className="cohere-preview-row">
                    <div className="cohere-preview-field">
                      <span className="cohere-preview-label">NAME</span>
                      <span className="cohere-preview-val">{selectedMemberObj.full_name}</span>
                    </div>
                    <div className="cohere-preview-field">
                      <span className="cohere-preview-label">ROLL NO</span>
                      <span className="cohere-preview-val">{selectedMemberObj.roll_no}</span>
                    </div>
                  </div>

                  <div className="cohere-preview-row">
                    <div className="cohere-preview-field">
                      <span className="cohere-preview-label">COURSE</span>
                      <span className="cohere-preview-val">{selectedMemberObj.course}</span>
                    </div>
                    <div className="cohere-preview-field">
                      <span className="cohere-preview-label">PHONE</span>
                      <span className="cohere-preview-val">{selectedMemberObj.mobile || '—'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Signature Cohere Slanted Split Button */}
            <div className="cohere-btn-container" style={{ marginTop: selectedMemberObj ? '22px' : '28px' }}>
              <button
                type="submit"
                className="cohere-slant-btn-root"
                disabled={!selectedTeamId || !selectedEmail || submitting}
              >
                <svg
                  viewBox="0 0 148 42"
                  className="cohere-slant-unified-svg"
                  aria-hidden="true"
                >
                  {/* Left piece */}
                  <path
                    d="M 8,0 L 91.25,0 Q 95.75,0 94.5,3.5 L 82,38.5 Q 80.75,42 76.25,42 L 8,42 Q 0,42 0,34 L 0,8 Q 0,0 8,0 Z"
                    className="cohere-slant-svg-path"
                  />
                  {/* Right piece */}
                  <path
                    d="M 107.75,0 L 140,0 Q 148,0 148,8 L 148,34 Q 148,42 140,42 L 92.75,42 Q 88.25,42 89.5,38.5 L 102,3.5 Q 103.25,0 107.75,0 Z"
                    className="cohere-slant-svg-path"
                  />
                </svg>

                <span className="cohere-slant-text-overlay">
                  {submitting ? 'Activating...' : 'Sign up'}
                </span>

                <span className="cohere-slant-icon-overlay">
                  {submitting ? (
                    <span className="cohere-mini-spinner" />
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="4" y1="12" x2="20" y2="12" />
                      <polyline points="14 6 20 12 14 18" />
                    </svg>
                  )}
                </span>
              </button>
            </div>

            {/* Terms and Policies */}
            <p className="cohere-terms-text">
              By signing up, you agree to the{' '}
              <a href="#" className="cohere-text-link" onClick={(e) => e.preventDefault()}>
                Terms of Use
              </a>{' '}
              and{' '}
              <a href="#" className="cohere-text-link" onClick={(e) => e.preventDefault()}>
                Privacy Policy
              </a>
              .
            </p>

            {/* Login Navigation Link */}
            <div className="cohere-signup-footer">
              Already registered?{' '}
              <Link href="/login" className="cohere-signup-link">
                Sign in to your account
              </Link>
            </div>
          </form>
        </div>
      </main>

      {/* Cohere Sleek Dark Footer Bar */}
      <footer className="cohere-bottom-bar">
        <div className="cohere-footer-left">
          <span className="cohere-footer-brand">CodeShastra Hub</span>
        </div>

        <div className="cohere-footer-devs">
          <span className="cohere-dev-tag mono">DEVELOPED BY:</span>
          <div className="cohere-dev-list">
            {developers.map((dev) => (
              <FooterDevPill key={dev.name} dev={dev} />
            ))}
          </div>
        </div>

        <div className="cohere-footer-right">
          <span className="cohere-curated-text">Partnership with</span>
          <span className="cohere-curated-brand">Vrindopnishad</span>
        </div>
      </footer>

      {/* Exact Cohere Design System Styling */}
      <style jsx global>{`
        .cohere-page-wrapper {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background-color: #f4f5f4;
          color: #111827;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          position: relative;
          overflow-x: hidden;
        }

        /* Top Header */
        .cohere-top-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 44px;
          position: relative;
          z-index: 10;
        }

        .cohere-brand-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          color: #111827;
        }

        .cohere-brand-name {
          font-size: 19px;
          font-weight: 600;
          letter-spacing: -0.03em;
          color: #1e293b;
        }

        .cohere-top-right {
          display: flex;
          align-items: center;
        }

        .cohere-top-signup-btn {
          font-size: 13.5px;
          font-weight: 500;
          color: #1e293b;
          text-decoration: none;
          position: relative;
          display: inline-block;
          padding: 2px 0;
          transition: color 0.2s ease;
        }

        .cohere-top-signup-btn::after {
          content: '';
          position: absolute;
          left: 0;
          bottom: 0;
          width: 100%;
          height: 1.5px;
          background-color: #1e293b;
          transform: scaleX(0);
          transform-origin: bottom right;
          transition: transform 0.28s cubic-bezier(0.65, 0, 0.35, 1);
        }

        .cohere-top-signup-btn:hover {
          color: #0f172a;
        }

        .cohere-top-signup-btn:hover::after {
          transform: scaleX(1);
          transform-origin: bottom left;
        }

        /* Main Container */
        .cohere-main-container {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 36px 20px 110px;
          min-height: calc(100vh - 140px);
          position: relative;
          z-index: 20;
          overflow: visible;
        }

        /* Single Professional Botanical Background Graphic */
        .cohere-bg-hero-graphic {
          position: absolute;
          right: 3%;
          top: 50%;
          transform: translateY(-50%);
          width: 370px;
          max-width: 26vw;
          pointer-events: none;
          z-index: 0;
          user-select: none;
          opacity: 0.85;
          transition: opacity 0.3s ease;
        }

        .cohere-bg-plants-img {
          width: 100%;
          height: auto;
          display: block;
          filter: drop-shadow(0 14px 28px rgba(0, 0, 0, 0.04));
        }

        @media (max-width: 1100px) {
          .cohere-bg-hero-graphic {
            right: -10px;
            opacity: 0.35;
            width: 290px;
          }
        }

        @media (max-width: 880px) {
          .cohere-bg-hero-graphic {
            display: none;
          }
        }

        /* Centered Spacious White Card */
        .cohere-login-card {
          width: 100%;
          max-width: 580px;
          background-color: #ffffff;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
          padding: 48px 44px 38px 44px;
          position: relative;
          z-index: 30;
          box-sizing: border-box;
          margin: auto 0;
        }

        .cohere-login-title {
          font-size: 32px;
          font-weight: 600;
          letter-spacing: -0.025em;
          color: #111827;
          text-align: center;
          margin-bottom: 34px;
        }

        /* Stacked Compartment Box */
        .cohere-stacked-box {
          border: 1px solid #d1d5db;
          border-radius: 10px;
          background-color: #ffffff;
          position: relative;
          overflow: visible !important;
          transition: border-color 0.15s ease;
        }

        .cohere-stacked-box:focus-within {
          border-color: #111827;
        }

        .cohere-compartment:first-child {
          border-top-left-radius: 9px;
          border-top-right-radius: 9px;
        }

        .cohere-compartment:last-child {
          border-bottom-left-radius: 9px;
          border-bottom-right-radius: 9px;
        }

        .cohere-compartment {
          padding: 14px 20px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .cohere-comp-label {
          font-family: 'JetBrains Mono', 'SFMono-Regular', Consolas, Menlo, monospace;
          font-size: 11.5px;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: #111827;
          margin: 0;
          line-height: 1.2;
          user-select: none;
        }

        .cohere-select-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }

        .cohere-comp-select {
          width: 100%;
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
          -webkit-box-shadow: none !important;
          background: transparent !important;
          font-size: 15px;
          color: #111827;
          padding: 4px 24px 0 0;
          margin: 0;
          line-height: 1.4;
          appearance: none;
          -webkit-appearance: none;
          cursor: pointer;
        }

        .cohere-comp-select:focus,
        .cohere-comp-select:focus-visible,
        .cohere-comp-select:active {
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
        }

        .cohere-team-search-input {
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
          -webkit-box-shadow: none !important;
          -webkit-appearance: none !important;
          background: transparent !important;
        }

        .cohere-team-search-input:focus,
        .cohere-team-search-input:focus-visible,
        .cohere-team-search-input:active {
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
          -webkit-box-shadow: none !important;
        }

        .cohere-comp-select.mono {
          font-family: 'JetBrains Mono', 'SFMono-Regular', Consolas, Menlo, monospace;
          font-size: 14.5px;
          letter-spacing: -0.01em;
        }

        .cohere-select-chevron {
          position: absolute;
          right: 0;
          pointer-events: none;
          color: #6b7280;
        }

        .cohere-comp-divider {
          height: 1px;
          background-color: #e5e7eb;
          width: 100%;
        }

        /* Member Preview Badge */
        .cohere-member-preview {
          margin-top: 14px;
          padding: 14px 18px;
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          font-size: 12.5px;
        }

        .cohere-preview-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #edf2f7;
        }

        .cohere-preview-header-left {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12.5px;
          font-weight: 600;
          color: #1e293b;
        }

        .cohere-preview-status-tag {
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0.06em;
          color: #166534;
          background: #dcfce7;
          border: 1px solid #bbf7d0;
          padding: 2px 7px;
          border-radius: 4px;
        }

        .cohere-preview-details {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .cohere-preview-details.mono {
          font-family: 'JetBrains Mono', 'SFMono-Regular', Consolas, Menlo, monospace;
        }

        .cohere-preview-row {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 14px;
        }

        .cohere-preview-field {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .cohere-preview-label {
          font-size: 10.5px;
          font-weight: 500;
          letter-spacing: 0.05em;
          color: #64748b;
        }

        .cohere-preview-val {
          font-size: 13px;
          font-weight: 400;
          color: #1e293b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        @media (max-width: 500px) {
          .cohere-preview-row {
            grid-template-columns: 1fr;
            gap: 8px;
          }
        }

        /* Signature Cohere Slanted Split Button */
        .cohere-btn-container {
          display: flex;
          justify-content: center;
          margin-bottom: 28px;
        }

        .cohere-slant-btn-root {
          position: relative;
          display: inline-flex;
          align-items: center;
          background: transparent;
          border: none;
          padding: 0;
          cursor: pointer;
          outline: none;
          width: 148px;
          height: 42px;
          transition: transform 0.05s ease, opacity 0.15s ease;
        }

        .cohere-slant-btn-root:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .cohere-slant-btn-root:active:not(:disabled) {
          transform: scale(0.99);
        }

        .cohere-slant-unified-svg {
          width: 148px;
          height: 42px;
          display: block;
          pointer-events: none;
        }

        .cohere-slant-svg-path {
          fill: #344d41;
          transition: fill 0.15s ease;
        }

        .cohere-slant-btn-root:hover:not(:disabled) .cohere-slant-svg-path {
          fill: #263c32;
        }

        .cohere-slant-text-overlay {
          position: absolute;
          left: 0;
          top: 0;
          width: 88px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-size: 14.5px;
          font-weight: 500;
          letter-spacing: -0.01em;
          user-select: none;
          pointer-events: none;
          padding-left: 2px;
        }

        .cohere-slant-icon-overlay {
          position: absolute;
          left: 93px;
          top: 0;
          width: 55px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          pointer-events: none;
          padding-left: 1px;
        }

        .cohere-slant-icon-overlay svg {
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .cohere-slant-btn-root:hover .cohere-slant-icon-overlay svg {
          transform: translateX(3px);
        }

        .cohere-mini-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: cohere-spin 0.6s linear infinite;
        }

        @keyframes cohere-spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* Terms text */
        .cohere-terms-text {
          font-size: 11px;
          color: #4b5563;
          text-align: center;
          line-height: 1.5;
          margin-bottom: 20px;
        }

        .cohere-text-link {
          color: #374151;
          text-decoration: underline;
        }
        .cohere-text-link:hover {
          color: #111827;
        }

        /* Signup footer */
        .cohere-signup-footer {
          font-size: 12.5px;
          color: #4b5563;
          text-align: center;
        }

        .cohere-signup-link {
          color: #111827;
          font-weight: 500;
          text-decoration: underline;
          margin-left: 3px;
        }

        /* Unified Theme-Relatable Cohere Footer */
        .cohere-bottom-bar {
          background-color: #fafbfa;
          border-top: 1px solid #e5e7eb;
          color: #374151;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 48px 24px;
          position: relative;
          z-index: 10;
          flex-wrap: wrap;
          gap: 16px;
        }

        .cohere-footer-left {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .cohere-footer-brand {
          font-size: 15px;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: #111827;
        }

        .cohere-footer-devs {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .cohere-dev-tag {
          font-size: 10px;
          color: #64748b;
          font-weight: 700;
          letter-spacing: 0.06em;
        }

        .cohere-dev-list {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .cohere-dev-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 11px 4px 4px;
          background-color: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 999px;
          text-decoration: none;
          color: #1e293b !important;
          transition: all 0.15s ease;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
        }

        .cohere-dev-pill:hover {
          background-color: #ffffff;
          border-color: #344d41;
          color: #344d41 !important;
          box-shadow: 0 3px 8px rgba(52, 77, 65, 0.08);
        }

        .cohere-dev-avatar-box {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          overflow: hidden;
          background-color: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border: 1px solid #cbd5e1;
        }

        .cohere-dev-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .cohere-dev-avatar-fallback {
          font-size: 8.5px;
          font-weight: 700;
          color: #344d41;
          line-height: 1;
        }

        .cohere-dev-name {
          font-size: 11.5px;
          font-weight: 600;
          color: #1e293b;
        }

        .cohere-dev-pill:hover .cohere-dev-name {
          color: #344d41;
        }

        .cohere-dev-ext-icon {
          color: #94a3b8;
          transition: color 0.15s ease;
          margin-left: -1px;
        }

        .cohere-dev-pill:hover .cohere-dev-ext-icon {
          color: #344d41;
        }

        .cohere-footer-right {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .cohere-curated-text {
          color: #64748b;
          font-size: 11.5px;
        }

        .cohere-curated-brand {
          font-weight: 700;
          color: #111827;
          font-size: 13.5px;
          letter-spacing: -0.02em;
        }

        /* High-End Congratulations Bar */
        .cohere-congrats-bar {
          display: flex;
          align-items: center;
          gap: 20px;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 12px;
          padding: 20px 24px;
          margin-bottom: 26px;
          animation: cohereFadeScale 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .cohere-congrats-art {
          flex-shrink: 0;
          width: 90px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .cohere-congrats-img {
          width: 100%;
          height: auto;
          display: block;
          filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.05));
        }

        .cohere-congrats-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .cohere-congrats-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: #166534;
          background: #dcfce7;
          border: 1px solid #86efac;
          padding: 2px 8px;
          border-radius: 20px;
          width: fit-content;
        }

        .cohere-congrats-heading {
          font-size: 18px;
          font-weight: 700;
          color: #14532d;
          letter-spacing: -0.02em;
          margin: 2px 0 0 0;
        }

        .cohere-congrats-sub {
          font-size: 13px;
          color: #15803d;
          line-height: 1.4;
          margin: 0;
        }

        .cohere-congrats-progress-track {
          width: 100%;
          height: 4px;
          background: #dcfce7;
          border-radius: 2px;
          overflow: hidden;
          margin-top: 8px;
        }

        .cohere-congrats-progress-fill {
          height: 100%;
          background: #16a34a;
          border-radius: 2px;
          width: 0%;
          animation: cohereFillProgress 1.8s ease-in-out forwards;
        }

        @keyframes cohereFadeScale {
          from {
            opacity: 0;
            transform: translateY(-6px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes cohereFillProgress {
          0% {
            width: 0%;
          }
          60% {
            width: 75%;
          }
          100% {
            width: 100%;
          }
        }

        /* Alerts */
        .cohere-alert-box {
          display: flex;
          align-items: center;
          gap: 8px;
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          border-radius: 6px;
          padding: 9px 12px;
          font-size: 12px;
          margin-bottom: 16px;
        }

        .cohere-success-box {
          display: flex;
          align-items: center;
          gap: 8px;
          background-color: #ecfdf5;
          border: 1px solid #a7f3d0;
          color: #059669;
          border-radius: 6px;
          padding: 9px 12px;
          font-size: 12px;
        }

        /* Responsiveness */
        @media (max-width: 640px) {
          .cohere-top-header {
            padding: 16px 20px;
          }
          .cohere-main-container {
            padding: 20px 16px 40px;
          }
          .cohere-login-card {
            padding: 32px 20px;
            max-width: 100%;
          }
          .cohere-bottom-bar {
            padding: 14px 20px;
            flex-direction: column;
            gap: 8px;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<LoadingScreen label="Loading CodeShastra Team Activation..." sublabel="Fetching project teams & rosters" />}>
      <SignUpForm />
    </Suspense>
  );
}
