'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Search,
  ChevronUp,
  ChevronDown,
  BookOpen,
  CheckCircle,
  AlertTriangle,
  Lock,
  Users,
  Calendar,
  Award,
  Shield,
  FileText,
  Upload,
  Compass,
  ArrowRight,
} from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: 'leader' | 'supervisor' | 'admin';
}

interface HelpSection {
  id: string;
  title: string;
  badge?: string;
  paragraphs: string[];
  bulletPoints?: string[];
  alertNotice?: string;
}

export default function HelpModal({ isOpen, onClose, userRole }: HelpModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);
  const contentContainerRef = useRef<HTMLDivElement>(null);

  // Define comprehensive role-specific content
  const getSections = (): HelpSection[] => {
    if (userRole === 'leader') {
      return [
        {
          id: 'leader-overview',
          title: '1. Role & Representation Overview',
          badge: 'Team Leader',
          paragraphs: [
            'Welcome to the CodeShastra ProjectHub Student Team Leader Console. As the designated leader of your academic group, you serve as the sole official representative for your entire team. All milestone deliverables, supervisor meeting coordination, problem statement approvals, and project evaluations are conducted through your account.',
            'To maintain session security and institutional integrity, your account enforces a strict single-device concurrent session policy. You may be logged in on only one browser or device at a time. If you sign in on a secondary device, your existing session must be formally concluded first.',
          ],
          bulletPoints: [
            'You speak for all registered students in your project team.',
            'Initial credentials use your preloaded university email and mobile number.',
            'Always log out cleanly when switching workstations.',
          ],
        },
        {
          id: 'leader-roster',
          title: '2. Team Roster & Member Verification',
          badge: 'Roster',
          paragraphs: [
            'The "Team Roster" tab displays all student members pre-allocated to your project group from official university records. Each record includes University Roll Number, Full Name, Official GLA Email ID, Mobile Number, Program (BCA or BCA-DS), and Section.',
            'Verify that all listed team members accurately reflect your group. Any attendance recorded by your faculty supervisor or individual presentation scores submitted by evaluation panels are tied directly to these registered student profiles.',
          ],
        },
        {
          id: 'leader-problem-statement',
          title: '3. Problem Statement Submission & Immutable Lock',
          badge: 'Problem Statement',
          paragraphs: [
            'Before milestone evaluations begin, you must submit a formal Project Problem Statement under the "Problem Statement" tab. Provide a concise, professional Project Title and a comprehensive Problem Scope detailing the technical methodology, expected algorithms, and system architecture.',
            'Once submitted, your statement status becomes "Awaiting Supervisor Review". Your faculty mentor will evaluate the proposal. They may either "Request Revision" with written guidance notes or "Approve" the proposal.',
            'CRITICAL IMMUTABLE LOCK: When your supervisor approves the problem statement, it enters a permanent immutable lock state. The fields become permanently read-only and cannot be altered by students or faculty. This ensures academic rigor and prevents scope drift.',
          ],
          alertNotice:
            'Approved problem statements are permanently locked. Make sure all technical details and title phrasing are finalized before seeking supervisor approval.',
        },
        {
          id: 'leader-meetings',
          title: '4. Meeting Coordination & "Want to Meet" Feature',
          badge: 'Meetings',
          paragraphs: [
            'Regular project progress reviews with your assigned supervisor are mandatory. The "Want to Meet" button in the Meetings tab allows you to notify your supervisor whenever your team requires guidance, review, or code inspection.',
            'Clicking "Want to Meet" instantly dispatches a high-priority operational notification to your supervisor. Once your supervisor reviews your request, they will schedule a meeting date, time slot, and venue (physical faculty cabin or Google Meet video link).',
            'Following each session, your supervisor will record student attendance (marking present or absent) and log discussion notes and directives under auto-incrementing records (e.g., Meet 1 Info, Meet 2 Info, Meet 3 Info). Review these logs to keep your team aligned with mentor expectations.',
          ],
          bulletPoints: [
            'Trigger "Want to Meet" whenever significant milestones or blockers arise.',
            'Check the meeting status for scheduled cabin or Google Meet venue details.',
            'Ensure all team members attend; absent members are flagged in the official log.',
          ],
        },
        {
          id: 'leader-phases',
          title: '5. Milestone Clearances & Gatekeeper Rules',
          badge: 'Gatekeeper',
          paragraphs: [
            'The academic project lifecycle progresses through three distinct evaluation phases: Phase 1 (Concept Pitch & Presentation Deck), Phase 2 (Working Prototype & Technical Demo), and Phase 3 (Comprehensive Final Defense, Project Report & Research Paper).',
            'SUPERVISOR GATEKEEPER RULE: Evaluation panels are strictly prohibited from viewing, assessing, or grading any team that has not received explicit clearance from their faculty supervisor. Your supervisor maintains three independent toggles ("Approve for Phase 1", "Approve for Phase 2", and "Approve for Phase 3"). You can track these clearance badges directly in the "Phase Deliverables & Uploads" tab.',
          ],
        },
        {
          id: 'leader-uploads',
          title: '6. Phase 3 Deliverables Upload (Report & Research Paper)',
          badge: 'Uploads',
          paragraphs: [
            'In Phase 3, you are required to submit two key academic documents: the Final Project Report (PDF) and the Research Paper (PDF). Under the "Phase Deliverables & Uploads" tab, click the upload button to select and submit your PDF files.',
            'Uploaded documents are securely transmitted and stored in the dedicated cloud storage repository. Once uploaded, evaluation judges on your assigned panel can inspect your documents directly and issue official report clearance.',
          ],
        },
        {
          id: 'leader-schedule',
          title: '7. Presentation Logistics & Evaluation Schedule',
          badge: 'Schedule',
          paragraphs: [
            'When the Project Incharge publishes the evaluation schedule for a live phase, your specific presentation details will appear under the "Evaluation Schedule" tab. This includes your allocated Panel Name, Assigned Date, Presentation Time Window, Academic Block (e.g., AB1), and Physical Room Number.',
            'Arrive at the designated room at least 15 minutes prior to your allocated time window with all required slides and demo equipment ready.',
          ],
        },
        {
          id: 'leader-security',
          title: '8. Account Security & Password Management',
          badge: 'Security',
          paragraphs: [
            'You can update your portal password anytime by clicking the key icon in the navigation bar. Changing your password requires your current password and enforces a mandatory security flush that immediately invalidates sessions on all devices.',
            'If you ever forget your password, navigate to the Sign In page and click "Forgot Password?". Entering your registered email will generate a secure, 15-minute tokenized password reset link.',
          ],
        },
      ];
    }

    if (userRole === 'supervisor') {
      return [
        {
          id: 'faculty-overview',
          title: '1. Faculty Dual Mode: Mentor vs. Judge',
          badge: 'Faculty Roles',
          paragraphs: [
            'The Unified Faculty Portal gives you seamless access to both of your academic roles: Faculty Supervisor (Mentor) for your guided project teams, and Evaluation Panel Member (Judge) for assessing candidate teams.',
            'You can toggle between "Mentor" and "Judge" modes anytime using the segmented pill switch in the top navigation bar or portal header. Each mode provides dedicated tools tailored strictly to that responsibility.',
          ],
          bulletPoints: [
            'Mentor Mode: Guide, review problem statements, schedule meetings, and control phase clearances.',
            'Judge Mode: Evaluate presentations, enter scores out of 10, mark absences, and approve Phase 3 papers.',
          ],
        },
        {
          id: 'faculty-guided-teams',
          title: '2. Guided Teams Management & Leader Tracking',
          badge: 'Supervisor',
          paragraphs: [
            'In Supervisor Mode, the left column lists all project groups assigned to you. Selecting a team loads their comprehensive dashboard, showing student member rosters, leader registration status, problem statement proposals, meeting history, and gatekeeper clearances.',
            'If a team has not yet elected a leader, a red "Leader Not Selected" badge will appear. Student teams elect their leader offline and claim credentials at /leader.',
          ],
        },
        {
          id: 'faculty-problem-statement',
          title: '3. Problem Statement Review & Immutable Locking',
          badge: 'Problem Statement',
          paragraphs: [
            'Under the "Problem Statement" tab for any guided team, you can inspect their proposed project title and technical description. You have two review actions:',
            '1. Request Revision: Enter written feedback notes pointing out missing literature, unclear methodology, or feasibility issues, and click "Request Revision". The team will be notified to revise their proposal.',
            '2. Approve & Lock: Once the proposal meets academic standards, click "Approve & Lock Statement". This enforces an IMMUTABLE LOCK on the problem statement. Form fields become permanently disabled to prevent unauthorized scope alteration during the semester.',
          ],
          alertNotice:
            'Approving a problem statement irreversibly locks it. Ensure the scope and methodology are satisfactory before granting final approval.',
        },
        {
          id: 'faculty-meetings',
          title: '4. Meeting Scheduling & Attendance Logging',
          badge: 'Meetings',
          paragraphs: [
            'When a student team clicks "Want to Meet", you receive an immediate in-portal notification and a warning badge on their team record. Under the "Meetings" tab, click "Schedule Session" to enter the Date, Time Slot, and Venue (either a physical cabin number like "AB1 Room 304" or a Google Meet URL).',
            'After conducting the meeting, click "Log Attendance & Summary". Check the presence/absence box for every student member, and record discussion notes and action directives. Submitting the form archives the record under an auto-indexed label (e.g., Meet 1 Info, Meet 2 Info).',
          ],
          bulletPoints: [
            'Accurate attendance logging is critical for auditing student course participation.',
            'Action directives provide students with clear next steps for their upcoming reviews.',
          ],
        },
        {
          id: 'faculty-gatekeeper',
          title: '5. Three-Phase Gatekeeper Clearances',
          badge: 'Gatekeeper Rule',
          paragraphs: [
            'Per academic regulation, evaluation panels cannot view or grade any team that has not received explicit clearance from their supervisor. In the "Gatekeeper Permissions" tab, you maintain three independent approval buttons:',
            '• Approve for Phase 1: Concept Pitch & Ideation clearance.',
            '• Approve for Phase 2: Working Prototype clearance.',
            '• Approve for Phase 3: Final Defense, Project Report & Research Paper clearance.',
            'You may grant or revoke these permissions at any time prior to panel evaluation rounds.',
          ],
        },
        {
          id: 'faculty-panel-eval',
          title: '6. Panel Evaluation Console & Conflict Safeguard',
          badge: 'Panel Judge',
          paragraphs: [
            'Switch to "Judge Mode" to access your assigned evaluation panels. The system automatically enforces a strict CONFLICT-OF-INTEREST SAFEGUARD: you will never be assigned to evaluate any team that you personally supervise.',
            'Panels only display teams that: (1) fall within your assigned team range, (2) have received supervisor clearance for that phase, and (3) when the Project Incharge has set the phase status to LIVE.',
            'Selecting a team opens the scoring console. Enter individual student marks (from 0 to 10 in steps of 0.5) or check the "Absent" checkbox for students who did not attend. In Phase 3, review their uploaded Report and Paper PDFs and click "Submit Clearance".',
          ],
        },
      ];
    }

    // Admin
    return [
      {
        id: 'admin-overview',
        title: '1. Master Administrative Governance & Live Overview',
        badge: 'Project Incharge',
        paragraphs: [
          'As the Project Incharge, you oversee the entire academic project lifecycle across all 102 project teams (93 BCA and 9 BCA-DS groups), 601 students, and 23 faculty supervisors.',
          'The "Overview & Calendar" tab provides executive metrics tracking total teams, leader activation counts, logged meetings, and defaulting teams in real time.',
        ],
      },
      {
        id: 'admin-calendar',
        title: '2. Milestone Presentation Calendar & Live Phase Control',
        badge: 'Calendar',
        paragraphs: [
          'The presentation calendar controls evaluation rounds for Phase 1 (Pitch), Phase 2 (Demo), and Phase 3 (Final Defense). Clicking "Set Phase to LIVE" activates the evaluation period, allowing assigned panels to inspect and score cleared teams.',
          'Once evaluation concludes, click "End Live Session" to freeze score submissions and archive the milestone.',
        ],
        alertNotice:
          'Panels can only submit scores when the phase is set to LIVE. Ensure phase activation is synchronized with your scheduled presentation windows.',
      },
      {
        id: 'admin-panels',
        title: '3. Panel Formation & Automated Conflict Validation',
        badge: 'Panels & Logistics',
        paragraphs: [
          'Under the "Panels" tab or by clicking "Form Evaluation Panel", you can create presentation panels, define team number ranges (e.g. Teams 1 to 15), allocate date and time windows, and assign academic blocks and room numbers (e.g. AB1 Room 402).',
          'AUTOMATED CONFLICT-OF-INTEREST ENGINE: The platform mathematically validates every assigned faculty judge against the team range. If a selected faculty member supervises any team within that range, the system rejects the assignment with an explicit conflict warning, guaranteeing fair evaluations.',
        ],
      },
      {
        id: 'admin-directory',
        title: '4. Teams Directory, Search & Pagination',
        badge: 'Directory',
        paragraphs: [
          'The "Teams Directory" provides an organized, paginated table (10 teams per page) with instant multi-field search. You can search by team name, team code, supervisor name, leader name, or student roll number.',
          'Filter by academic program (All, BCA, or BCA-DS) to quickly audit specific cohorts. Clicking "View" opens a detailed slide-up card displaying the full student roster, individual CPIs, and problem statement submissions.',
        ],
      },
      {
        id: 'admin-defaulting',
        title: '5. Defaulting Teams Audit & Compliance Resolution',
        badge: 'Audit',
        paragraphs: [
          'The "Defaulting Audit" tab isolates teams requiring administrative attention. It automatically flags teams that have not designated a leader at /leader, teams whose problem statements remain unapproved, and teams missing supervisor phase clearance.',
          'Use this view to contact supervisors or student teams before presentation rounds commence.',
        ],
      },
    ];
  };

  const sections = getSections();

  // Highlight helper and match counter
  useEffect(() => {
    if (!searchQuery.trim()) {
      setTotalMatches(0);
      setCurrentMatchIndex(0);
      return;
    }

    const query = searchQuery.toLowerCase();
    let count = 0;

    sections.forEach((sec) => {
      if (sec.title.toLowerCase().includes(query)) count++;
      sec.paragraphs.forEach((p) => {
        const matches = p.toLowerCase().split(query).length - 1;
        count += matches;
      });
      sec.bulletPoints?.forEach((b) => {
        const matches = b.toLowerCase().split(query).length - 1;
        count += matches;
      });
      if (sec.alertNotice && sec.alertNotice.toLowerCase().includes(query)) count++;
    });

    setTotalMatches(count);
    setCurrentMatchIndex(count > 0 ? 1 : 0);
  }, [searchQuery]);

  const handleNextMatch = () => {
    if (totalMatches <= 1) return;
    const nextIdx = currentMatchIndex >= totalMatches ? 1 : currentMatchIndex + 1;
    setCurrentMatchIndex(nextIdx);
    scrollToMatch(nextIdx);
  };

  const handlePrevMatch = () => {
    if (totalMatches <= 1) return;
    const prevIdx = currentMatchIndex <= 1 ? totalMatches : currentMatchIndex - 1;
    setCurrentMatchIndex(prevIdx);
    scrollToMatch(prevIdx);
  };

  const scrollToMatch = (idx: number) => {
    setTimeout(() => {
      const el = document.getElementById(`help-match-${idx}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 50);
  };

  let globalMatchTracker = 0;

  const renderHighlightedText = (text: string) => {
    if (!searchQuery.trim()) return text;

    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) => {
      if (part.toLowerCase() === searchQuery.toLowerCase()) {
        globalMatchTracker++;
        const isCurrent = globalMatchTracker === currentMatchIndex;
        return (
          <mark
            key={i}
            id={`help-match-${globalMatchTracker}`}
            className={isCurrent ? 'help-highlight help-highlight-active' : 'help-highlight'}
          >
            {part}
          </mark>
        );
      }
      return part;
    });
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(1.5px)',
        WebkitBackdropFilter: 'blur(1.5px)',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        className="card animate-scale-in"
        style={{
          width: '100%',
          maxWidth: '820px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#FFFFFF',
          padding: 0,
          overflow: 'hidden',
          boxShadow: '0 20px 48px rgba(0, 0, 0, 0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div
          style={{
            padding: '20px 28px',
            borderBottom: '1px solid var(--color-hairline)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#FFFFFF',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'var(--color-primary)',
                color: '#FFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BookOpen size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700 }}>
                  Portal User Guide & Feature Documentation
                </h3>
                <span className="badge badge-neutral" style={{ textTransform: 'capitalize' }}>
                  {userRole} Guide
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                Exhaustive operational handbook tailored strictly to your {userRole} role.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
              padding: '6px',
              borderRadius: '8px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Bar with Counter & Up/Down Navigation */}
        <div
          style={{
            padding: '14px 28px',
            backgroundColor: 'var(--color-canvas-soft)',
            borderBottom: '1px solid var(--color-hairline)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div className="search-input-wrapper" style={{ flex: 1 }}>
            <input
              type="text"
              className="input-field"
              placeholder="Search help documentation (e.g. meet, lock, attendance, score, panel)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                height: '40px',
                fontSize: '13px',
                backgroundColor: '#FFFFFF',
                border: '1px solid var(--color-hairline)',
              }}
            />
            <div className="search-icon">
              <Search size={16} />
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

          {searchQuery.trim() && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <span
                className={`badge ${totalMatches > 0 ? 'badge-accent' : 'badge-neutral'}`}
                style={{ fontSize: '12px' }}
              >
                {totalMatches > 0 ? `${currentMatchIndex} of ${totalMatches} matches` : '0 matches'}
              </span>

              <button
                type="button"
                className="btn btn-outline"
                style={{ width: '32px', height: '32px', padding: 0 }}
                onClick={handlePrevMatch}
                disabled={totalMatches <= 1}
                title="Previous match"
              >
                <ChevronUp size={16} />
              </button>

              <button
                type="button"
                className="btn btn-outline"
                style={{ width: '32px', height: '32px', padding: 0 }}
                onClick={handleNextMatch}
                disabled={totalMatches <= 1}
                title="Next match"
              >
                <ChevronDown size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Scrollable Documentation Content */}
        <div
          ref={contentContainerRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            backgroundColor: '#FFFFFF',
          }}
        >
          {searchQuery.trim() && totalMatches === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <img
                src="/images/undraw/searching-themed.svg"
                alt="No documentation matches found"
                style={{ width: '190px', height: 'auto', opacity: 0.9, marginBottom: '6px' }}
              />
              <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-ink)', margin: 0 }}>
                No documentation matches for &ldquo;{searchQuery}&rdquo;
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', maxWidth: '380px', margin: 0 }}>
                Try searching for keywords like <em>milestone</em>, <em>clearance</em>, <em>attendance</em>, <em>panel</em>, or <em>upload</em>.
              </p>
              <button
                type="button"
                className="btn btn-outline"
                style={{ marginTop: '6px', fontSize: '12px', padding: '6px 14px' }}
                onClick={() => setSearchQuery('')}
              >
                Clear Search
              </button>
            </div>
          ) : (
            sections.map((section) => (
            <div
              key={section.id}
              style={{
                borderBottom: '1px solid var(--color-hairline)',
                paddingBottom: '24px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '10px',
                }}
              >
                <h4 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--color-ink)' }}>
                  {renderHighlightedText(section.title)}
                </h4>
                {section.badge && (
                  <span className="badge badge-neutral" style={{ fontSize: '11px' }}>
                    {section.badge}
                  </span>
                )}
              </div>

              {section.paragraphs.map((p, pIdx) => (
                <p
                  key={pIdx}
                  style={{
                    fontSize: '14px',
                    color: 'var(--color-ink-soft)',
                    lineHeight: '1.6',
                    marginBottom: '10px',
                  }}
                >
                  {renderHighlightedText(p)}
                </p>
              ))}

              {section.bulletPoints && (
                <ul
                  style={{
                    paddingLeft: '20px',
                    marginBottom: '12px',
                    fontSize: '13px',
                    color: 'var(--color-ink)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  {section.bulletPoints.map((b, bIdx) => (
                    <li key={bIdx}>{renderHighlightedText(b)}</li>
                  ))}
                </ul>
              )}

              {section.alertNotice && (
                <div
                  className="alert-banner alert-warning"
                  style={{ fontSize: '13px', marginTop: '10px', marginBottom: 0 }}
                >
                  <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                  <div>{renderHighlightedText(section.alertNotice)}</div>
                </div>
              )}
            </div>
          )))}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 28px',
            borderTop: '1px solid var(--color-hairline)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'var(--color-canvas-soft)',
          }}
        >
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            CodeShastra ProjectHub Documentation v3.0 • Role: <strong>{userRole}</strong>
          </div>
          <button onClick={onClose} className="btn btn-primary" style={{ padding: '8px 20px', fontSize: '13px' }}>
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
}
