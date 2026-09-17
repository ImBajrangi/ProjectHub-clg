'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Shield,
  ShieldCheck,
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
  Crown,
  Key,
  UserPlus,
  Play,
  ArrowRightLeft,
  ShieldAlert,
  BadgeCheck,
  Lock,
  UserX,
  Download,
  Settings,
  Edit2,
  RotateCcw,
  Pencil,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import LoadingScreen from '@/components/LoadingScreen';
import EmptyStateGraphic from '@/components/EmptyStateGraphic';
import { clientCache } from '@/lib/clientCache';
import {
  exportPanelsData,
  exportTeamsAndStudents,
  exportFacultyDirectory,
  exportAbsentAndShiftData,
  exportDefaultingTeams,
  exportMasterWorkbook,
} from '@/lib/exportUtils';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [adminData, setAdminData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Segmented Navigation: Overview, Teams & Students, Supervisors, Panels & Shifts, Defaulting, Attendance
  const [activeTab, setActiveTab] = useState<'overview' | 'teams' | 'supervisors' | 'panels' | 'defaulting' | 'attendance'>('overview');

  // Attendance & Shift Segregation State
  const [attendancePhaseFilter, setAttendancePhaseFilter] = useState<'all' | 1 | 2 | 3>('all');
  const [attendanceStatusFilter, setAttendanceStatusFilter] = useState<'all' | 'early_joining' | 'absent'>('all');
  const [attendanceSearch, setAttendanceSearch] = useState('');
  const [segregationModalItem, setSegregationModalItem] = useState<any>(null);
  const [segregationLoading, setSegregationLoading] = useState(false);
  const [segregationCustomRemark, setSegregationCustomRemark] = useState('');

  // Teams & Students Directory State
  const [searchQuery, setSearchQuery] = useState('');
  const [programFilter, setProgramFilter] = useState<'all' | 'BCA' | 'BCA - DS'>('all');
  const [phaseClearanceFilter, setPhaseClearanceFilter] = useState<
    'all' | 'p1_approved' | 'p1_pending' | 'p2_synopsis_submitted' | 'p2_synopsis_pending' | 'p3_report_submitted' | 'p3_report_pending' | 'p1' | 'p2' | 'p3'
  >('all');
  const [adminMilestoneSaving, setAdminMilestoneSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTeamModal, setSelectedTeamModal] = useState<any>(null);
  const PAGE_SIZE = 10;

  // Defaulting Teams Modal State
  const [defaultingModalOpen, setDefaultingModalOpen] = useState(false);
  const [defaultingSearch, setDefaultingSearch] = useState('');
  const [defaultingReasonFilter, setDefaultingReasonFilter] = useState<'all' | 'no_leader' | 'no_ps' | 'pending_p1'>('all');

  // Supervisors Directory State
  const [supervisorSearch, setSupervisorSearch] = useState('');
  const [selectedSupervisorModal, setSelectedSupervisorModal] = useState<any>(null);

  // Panels Directory State
  const [panelPhaseFilter, setPanelPhaseFilter] = useState<1 | 2 | 3>(1);
  const [panelSearch, setPanelSearch] = useState('');
  const [togglingPhase, setTogglingPhase] = useState<number | null>(null);

  // Admin Authority Governance & Creation State
  const [authorityModalOpen, setAuthorityModalOpen] = useState(false);
  const [authorityActiveTab, setAuthorityActiveTab] = useState<'transfer' | 'create'>('transfer');
  const [selectedTeacherForTransfer, setSelectedTeacherForTransfer] = useState<string>('');
  const [transferDemoteCurrent, setTransferDemoteCurrent] = useState(true);
  const [transferConfirmOpen, setTransferConfirmOpen] = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferMessage, setTransferMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [demotedRedirectCountdown, setDemotedRedirectCountdown] = useState<number | null>(null);
  const [teacherSearchInModal, setTeacherSearchInModal] = useState('');
  const [copiedCreds, setCopiedCreds] = useState(false);

  // New Faculty / Admin Form State
  const [createTeacherForm, setCreateTeacherForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    employeeId: '',
    designation: 'Faculty Mentor',
    department: 'Dept. of Computer Applications',
    cabinNumber: 'Academic Block AB10',
    role: 'supervisor' as 'admin' | 'supervisor',
    password: '',
    transferCurrentAdmin: false,
  });
  const [createTeacherLoading, setCreateTeacherLoading] = useState(false);
  const [createTeacherSuccess, setCreateTeacherSuccess] = useState<any | null>(null);

  // Interactive Visual Panel Builder State
  const [createPanelModalOpen, setCreatePanelModalOpen] = useState(false);
  const [editingPanel, setEditingPanel] = useState<any | null>(null);
  const [panelFormPhase, setPanelFormPhase] = useState<1 | 2 | 3>(1);
  const [panelFormNumber, setPanelFormNumber] = useState<number | ''>('');
  const [panelFormProgram, setPanelFormProgram] = useState<'all' | 'BCA' | 'BCA - DS'>('all');
  const [panelFormName, setPanelFormName] = useState('');
  const [panelFormRangeStart, setPanelFormRangeStart] = useState<number>(1);
  const [panelFormRangeEnd, setPanelFormRangeEnd] = useState<number>(10);
  const [panelFormSelectedJudges, setPanelFormSelectedJudges] = useState<string[]>([]);
  const [panelFormShift, setPanelFormShift] = useState('Batch 1: Morning (08:00 AM - 10:00 AM)');
  const [panelFormCustomShift, setPanelFormCustomShift] = useState('');
  const [panelFormRoom, setPanelFormRoom] = useState('Room 402');
  const [panelFormCustomRoom, setPanelFormCustomRoom] = useState('');
  const [panelFormVenue, setPanelFormVenue] = useState('Academic Block AB10');
  const [panelFormDate, setPanelFormDate] = useState('2026-09-15');
  const [panelFormLoading, setPanelFormLoading] = useState(false);
  const [panelFormError, setPanelFormError] = useState<string | null>(null);
  const [judgeSearchQuery, setJudgeSearchQuery] = useState('');
  const [facultyAvailabilityFilter, setFacultyAvailabilityFilter] = useState<'all' | 'available' | 'busy'>('all');

  // Dynamic Rooms & Shifts Management State (Direct Supabase Sync)
  const [dbRooms, setDbRooms] = useState<any[]>([]);
  const [dbShifts, setDbShifts] = useState<any[]>([]);
  const [manageRoomsModalOpen, setManageRoomsModalOpen] = useState(false);
  const [manageShiftsModalOpen, setManageShiftsModalOpen] = useState(false);

  // Standard Shift Time & Preset Configuration Helpers (15-min intervals, strictly 08:00 AM - 06:00 PM)
  const STANDARD_TIME_OPTIONS = [
    '08:00 AM', '08:15 AM', '08:30 AM', '08:45 AM',
    '09:00 AM', '09:15 AM', '09:30 AM', '09:45 AM',
    '10:00 AM', '10:15 AM', '10:30 AM', '10:45 AM',
    '11:00 AM', '11:15 AM', '11:30 AM', '11:45 AM',
    '12:00 PM', '12:15 PM', '12:30 PM', '12:45 PM',
    '01:00 PM', '01:15 PM', '01:30 PM', '01:45 PM',
    '02:00 PM', '02:15 PM', '02:30 PM', '02:45 PM',
    '03:00 PM', '03:15 PM', '03:30 PM', '03:45 PM',
    '04:00 PM', '04:15 PM', '04:30 PM', '04:45 PM',
    '05:00 PM', '05:15 PM', '05:30 PM', '05:45 PM',
    '06:00 PM'
  ];

  const SHIFT_TEMPLATES = [
    { label: 'Shift 1: Morning', startTime: '08:00 AM', endTime: '10:00 AM', color: '#059669', colorBg: '#ECFDF5', colorBorder: '#A7F3D0' },
    { label: 'Shift 2: Midday', startTime: '10:15 AM', endTime: '12:15 PM', color: '#2563EB', colorBg: '#EFF6FF', colorBorder: '#BFDBFE' },
    { label: 'Shift 3: Afternoon', startTime: '01:15 PM', endTime: '03:15 PM', color: '#D97706', colorBg: '#FFFBEB', colorBorder: '#FDE68A' },
    { label: 'Shift 4: Evening', startTime: '03:45 PM', endTime: '05:45 PM', color: '#7C3AED', colorBg: '#FAF5FF', colorBorder: '#E9D5FF' },
  ];

  // Room Edit / Add State
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomBuilding, setNewRoomBuilding] = useState('Academic Block AB10');
  const [editingRoom, setEditingRoom] = useState<{ id?: string; oldName: string; name: string; building?: string } | null>(null);
  const [roomModalLoading, setRoomModalLoading] = useState(false);

  // Shift Edit / Add State (Dropdown & Auto-Fill Driven)
  const [newShiftForm, setNewShiftForm] = useState({
    label: 'Shift 1: Morning',
    startTime: '08:00 AM',
    endTime: '10:00 AM',
    timeWindow: 'Batch 1: Morning (08:00 AM - 10:00 AM)',
    timeShort: '08:00 AM - 10:00 AM',
    icon: 'clock',
    color: '#059669',
    colorBg: '#ECFDF5',
    colorBorder: '#A7F3D0',
  });
  const [editingShift, setEditingShift] = useState<any | null>(null);
  const [shiftModalLoading, setShiftModalLoading] = useState(false);

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

  // In-Software Confirmation Dialog & Toast System (Zero Browser Alert/Confirm Popups)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    loadingText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
    onConfirm: () => void | Promise<void>;
    loading?: boolean;
  } | null>(null);

  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const showConfirmDialog = (options: {
    title: string;
    message: string;
    confirmText?: string;
    loadingText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
    onConfirm: () => void | Promise<void>;
  }) => {
    setConfirmDialog({
      isOpen: true,
      ...options,
    });
  };


  // Lock background scroll and handle Escape key to close modals
  useEffect(() => {
    const isAnyModalOpen = jsonModalOpen || selectedTeamModal || createPanelModalOpen || selectedSupervisorModal || authorityModalOpen || manageRoomsModalOpen || manageShiftsModalOpen || defaultingModalOpen;
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setSelectedTeamModal(null);
          setSelectedSupervisorModal(null);
          setJsonModalOpen(false);
          setCreatePanelModalOpen(false);
          setAuthorityModalOpen(false);
          setManageRoomsModalOpen(false);
          setManageShiftsModalOpen(false);
          setDefaultingModalOpen(false);
          setEditingRoom(null);
          setEditingShift(null);
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
  }, [jsonModalOpen, selectedTeamModal, createPanelModalOpen, selectedSupervisorModal, authorityModalOpen, manageRoomsModalOpen, manageShiftsModalOpen, segregationModalItem, defaultingModalOpen]);

  const loadRoomsAndShifts = async () => {
    try {
      const res = await fetch(`/api/admin/rooms-shifts?_t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setDbRooms(Array.isArray(data.rawRooms) ? data.rawRooms : (Array.isArray(data.rooms) ? data.rooms.map((r: string) => ({ name: r, building: 'Academic Block AB10' })) : []));
        setDbShifts(Array.isArray(data.shifts) ? data.shifts : []);
      }
    } catch (err) {
      console.error('Failed to load presentation rooms and shifts:', err);
    }
  };

  // --- ROOM HANDLERS ---
  const handleAddRoom = async (name: string, building = 'Academic Block AB10') => {
    if (!name.trim()) return;
    setRoomModalLoading(true);
    try {
      const res = await fetch('/api/admin/rooms-shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add_room', name: name.trim(), building }),
      });
      const data = await res.json();
      if (!res.ok) {
        setToastMessage({ type: 'error', text: data.error || 'Failed to add room' });
      } else {
        setToastMessage({ type: 'success', text: `Room "${name.trim()}" added successfully` });
        await loadRoomsAndShifts();
        setNewRoomName('');
      }
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err.message || 'Error adding room' });
    } finally {
      setRoomModalLoading(false);
    }
  };

  const handleEditRoom = async (id: string | undefined, oldName: string, newName: string, building?: string) => {
    if (!newName.trim()) return;
    setRoomModalLoading(true);
    try {
      const res = await fetch('/api/admin/rooms-shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'edit_room', id, oldName, newName: newName.trim(), building }),
      });
      const data = await res.json();
      if (!res.ok) {
        setToastMessage({ type: 'error', text: data.error || 'Failed to update room' });
      } else {
        setToastMessage({ type: 'success', text: `Room updated to "${newName.trim()}"` });
        if (panelFormRoom === oldName) setPanelFormRoom(newName.trim());
        await loadRoomsAndShifts();
        setEditingRoom(null);
      }
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err.message || 'Error updating room' });
    } finally {
      setRoomModalLoading(false);
    }
  };

  const handleDeleteRoom = async (id: string | undefined, name: string) => {
    showConfirmDialog({
      title: 'Delete Room',
      message: `Are you sure you want to remove "${name}" from available presentation rooms?`,
      confirmText: 'Delete Room',
      type: 'danger',
      onConfirm: async () => {
        try {
          // Optimistic local update
          setDbRooms((prev) => prev.filter((r) => (id ? r.id !== id : r.name !== name)));
          const res = await fetch('/api/admin/rooms-shifts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete_room', id, name }),
          });
          const data = await res.json();
          if (!res.ok) {
            setToastMessage({ type: 'error', text: data.error || 'Failed to delete room' });
            await loadRoomsAndShifts();
          } else {
            setToastMessage({ type: 'success', text: `Room "${name}" deleted` });
            await loadRoomsAndShifts();
          }
        } catch (err: any) {
          setToastMessage({ type: 'error', text: err.message || 'Error deleting room' });
          await loadRoomsAndShifts();
        }
      },
    });
  };

  const handleClearAllRooms = () => {
    showConfirmDialog({
      title: 'Clear All Presentation Rooms?',
      message: 'Are you sure you want to delete all presentation rooms from the database? This cannot be undone.',
      confirmText: 'Delete All Rooms',
      type: 'danger',
      onConfirm: async () => {
        try {
          setDbRooms([]);
          const res = await fetch('/api/admin/rooms-shifts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'clear_all_rooms' }),
          });
          const data = await res.json();
          if (!res.ok) {
            setToastMessage({ type: 'error', text: data.error || 'Failed to clear rooms' });
          } else {
            setToastMessage({ type: 'success', text: 'All presentation rooms removed successfully' });
          }
          await loadRoomsAndShifts();
        } catch (err: any) {
          setToastMessage({ type: 'error', text: err.message || 'Error clearing rooms' });
          await loadRoomsAndShifts();
        }
      },
    });
  };

  // --- SHIFT HANDLERS ---
  const handleAddShift = async (shiftData: any) => {
    setShiftModalLoading(true);
    try {
      const res = await fetch('/api/admin/rooms-shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add_shift', ...shiftData }),
      });
      const data = await res.json();
      if (!res.ok) {
        setToastMessage({ type: 'error', text: data.error || 'Failed to add shift' });
      } else {
        setToastMessage({ type: 'success', text: `Shift "${shiftData.label}" added` });
        await loadRoomsAndShifts();
        setNewShiftForm({
          label: 'Shift 1: Morning',
          startTime: '08:00 AM',
          endTime: '10:00 AM',
          timeWindow: 'Batch 1: Morning (08:00 AM - 10:00 AM)',
          timeShort: '08:00 AM - 10:00 AM',
          icon: 'clock',
          color: '#059669',
          colorBg: '#ECFDF5',
          colorBorder: '#A7F3D0',
        });
      }
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err.message || 'Error adding shift' });
    } finally {
      setShiftModalLoading(false);
    }
  };

  const handleEditShift = async (id: string, shiftData: any) => {
    setShiftModalLoading(true);
    try {
      const res = await fetch('/api/admin/rooms-shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'edit_shift', id, ...shiftData }),
      });
      const data = await res.json();
      if (!res.ok) {
        setToastMessage({ type: 'error', text: data.error || 'Failed to update shift' });
      } else {
        setToastMessage({ type: 'success', text: `Shift updated successfully` });
        await loadRoomsAndShifts();
        setEditingShift(null);
      }
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err.message || 'Error updating shift' });
    } finally {
      setShiftModalLoading(false);
    }
  };

  const handleDeleteShift = async (id: string, label: string) => {
    showConfirmDialog({
      title: 'Delete Shift',
      message: `Are you sure you want to remove presentation shift "${label}"?`,
      confirmText: 'Delete Shift',
      type: 'danger',
      onConfirm: async () => {
        try {
          // Optimistic local update
          setDbShifts((prev) => prev.filter((s) => s.id !== id && s.label !== label));
          const res = await fetch('/api/admin/rooms-shifts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete_shift', id, label }),
          });
          const data = await res.json();
          if (!res.ok) {
            setToastMessage({ type: 'error', text: data.error || 'Failed to delete shift' });
            await loadRoomsAndShifts();
          } else {
            setToastMessage({ type: 'success', text: `Shift "${label}" deleted` });
            await loadRoomsAndShifts();
          }
        } catch (err: any) {
          setToastMessage({ type: 'error', text: err.message || 'Error deleting shift' });
          await loadRoomsAndShifts();
        }
      },
    });
  };

  const handleClearAllShifts = () => {
    showConfirmDialog({
      title: 'Clear All Presentation Shifts?',
      message: 'Are you sure you want to delete all presentation shifts from the database? This cannot be undone.',
      confirmText: 'Delete All Shifts',
      type: 'danger',
      onConfirm: async () => {
        try {
          setDbShifts([]);
          const res = await fetch('/api/admin/rooms-shifts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'clear_all_shifts' }),
          });
          const data = await res.json();
          if (!res.ok) {
            setToastMessage({ type: 'error', text: data.error || 'Failed to clear shifts' });
          } else {
            setToastMessage({ type: 'success', text: 'All presentation shifts removed successfully' });
          }
          await loadRoomsAndShifts();
        } catch (err: any) {
          setToastMessage({ type: 'error', text: err.message || 'Error clearing shifts' });
          await loadRoomsAndShifts();
        }
      },
    });
  };

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
      clientCache.set(clientCache.keys.USER_ME, authData.user);

      // Concurrently load admin data and dynamic rooms/shifts
      loadRoomsAndShifts();

      const res = await fetch('/api/admin', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (res.ok) {
        const data = await res.json();
        setAdminData(data);
        clientCache.set(clientCache.keys.ADMIN_DATA, data);

        // Update selectedTeamModal if currently open to reflect updated scores
        if (selectedTeamModal) {
          const freshTeam = data.teams?.find((t: any) => t.id === selectedTeamModal.id);
          if (freshTeam) setSelectedTeamModal(freshTeam);
        }
      }
    } catch {
      // Ignore network errors
    } finally {
      setLoading(false);
    }
  };

  const handleSegregateAttendance = async (
    phaseNumber: number,
    teamId: string,
    studentId: string,
    newStatus: 'early_joining' | 'absent',
    customRemark?: string
  ) => {
    setSegregationLoading(true);
    try {
      const res = await fetch('/api/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'segregate_attendance',
          phaseNumber,
          teamId,
          studentId,
          attendanceStatus: newStatus,
          remarks: customRemark || (newStatus === 'early_joining' ? 'Admin moved to Early Joining' : 'Admin marked as Absent'),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setToastMessage({ type: 'error', text: `Failed to update attendance status: ${data.error}` });
      } else {
        await loadAdminData();
        setSegregationModalItem(null);
        setSegregationCustomRemark('');
        setToastMessage({ type: 'success', text: 'Attendance record updated successfully.' });
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('codeshastra_notification_update'));
          try {
            const bc = new BroadcastChannel('codeshastra_notifications_channel');
            bc.postMessage({ type: 'UPDATE' });
            setTimeout(() => { try { bc.close(); } catch { } }, 1000);
          } catch { }
        }
      }
    } catch (err: any) {
      setToastMessage({ type: 'error', text: `Error updating attendance: ${err.message}` });
    } finally {
      setSegregationLoading(false);
    }
  };

  const handleToggleAdminMilestone = async (teamId: string, phaseNum: 1 | 2 | 3, currentValue: boolean) => {
    setAdminMilestoneSaving(true);
    try {
      const res = await fetch('/api/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'panel_milestone_action',
          teamId,
          phaseNumber: phaseNum,
          approved: !currentValue,
          type: phaseNum === 3 ? 'report_clearance' : undefined,
        }),
      });
      const result = await res.json();
      if (result.success) {
        setToastMessage({ type: 'success', text: `Phase ${phaseNum} milestone updated successfully.` });
        setAdminData((prev: any) => {
          if (!prev) return prev;
          const updatedTeams = (prev.teams || []).map((t: any) => {
            if (t.id !== teamId) return t;
            if (phaseNum === 1) return { ...t, phase1_approved: !currentValue };
            if (phaseNum === 2) return { ...t, phase2_approved: !currentValue };
            return { ...t, phase3_report_clearance: !currentValue, phase3_approved: !currentValue };
          });
          const updated = { ...prev, teams: updatedTeams };
          clientCache.set(clientCache.keys.ADMIN_DATA, updated);
          return updated;
        });
        if (selectedTeamModal && selectedTeamModal.id === teamId) {
          setSelectedTeamModal((prev: any) => {
            if (!prev) return null;
            if (phaseNum === 1) return { ...prev, phase1_approved: !currentValue };
            if (phaseNum === 2) return { ...prev, phase2_approved: !currentValue };
            return { ...prev, phase3_report_clearance: !currentValue, phase3_approved: !currentValue };
          });
        }
      } else {
        setToastMessage({ type: 'error', text: result.error || 'Failed to update milestone.' });
      }
    } catch (err) {
      console.error('Failed to toggle milestone:', err);
      setToastMessage({ type: 'error', text: 'Network error updating milestone.' });
    } finally {
      setAdminMilestoneSaving(false);
    }
  };

  useEffect(() => {
    const cachedUser = clientCache.get<any>(clientCache.keys.USER_ME);
    if (cachedUser && cachedUser.role === 'admin') {
      setCurrentUser(cachedUser);
      const cachedData = clientCache.get<any>(clientCache.keys.ADMIN_DATA);
      if (cachedData) {
        setAdminData(cachedData);
        setLoading(false);
      }
    }
    loadAdminData();
  }, []);

  const [editingPhaseMarks, setEditingPhaseMarks] = useState<{ [key: number]: number }>({});
  const [savingPhaseMarks, setSavingPhaseMarks] = useState<number | null>(null);

  const handleUpdatePhaseMarks = async (phaseNumber: 1 | 2 | 3, marksWeightage: number) => {
    if (!marksWeightage || marksWeightage <= 0) {
      setToastMessage({ type: 'error', text: 'Please enter a valid positive number for maximum marks.' });
      return;
    }
    setSavingPhaseMarks(phaseNumber);
    try {
      const res = await fetch('/api/phases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_marks',
          phaseNumber,
          marksWeightage,
        }),
      });

      if (res.ok) {
        await loadAdminData();
        setEditingPhaseMarks((prev) => {
          const next = { ...prev };
          delete next[phaseNumber];
          return next;
        });
        setToastMessage({ type: 'success', text: `Phase ${phaseNumber} maximum marks updated to ${marksWeightage}.` });
      } else {
        const data = await res.json();
        setToastMessage({ type: 'error', text: data.error || 'Failed to update maximum marks' });
      }
    } catch {
      setToastMessage({ type: 'error', text: 'Network error while updating maximum marks' });
    } finally {
      setSavingPhaseMarks(null);
    }
  };

  const handleTogglePhaseLive = async (phaseNumber: 1 | 2 | 3, currentLive: boolean) => {
    if (togglingPhase) return;
    setTogglingPhase(phaseNumber);
    const willBeLive = !currentLive;

    // Optimistic local state update for zero UI lag
    setAdminData((prev: any) => {
      if (!prev) return prev;
      const updatedPhases = (prev.phases || []).map((ph: any) =>
        Number(ph.phase_number) === Number(phaseNumber) ? { ...ph, is_live: willBeLive } : ph
      );
      return { ...prev, phases: updatedPhases };
    });

    try {
      const res = await fetch('/api/phases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_live',
          phaseNumber,
          isLive: willBeLive,
        }),
      });

      if (res.ok) {
        setToastMessage({
          type: 'success',
          text: willBeLive
            ? `Phase ${phaseNumber} evaluation is now LIVE. Panel members can record and update marks.`
            : `Phase ${phaseNumber} evaluation STOPPED & LOCKED. Panel members can no longer modify marks.`,
        });
        clientCache.invalidate(clientCache.keys.ADMIN_DATA);
        await loadAdminData();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('codeshastra_notification_update'));
          try {
            const bc = new BroadcastChannel('codeshastra_notifications_channel');
            bc.postMessage({ type: 'UPDATE' });
            setTimeout(() => { try { bc.close(); } catch { } }, 1000);
          } catch { }
          try {
            const bc2 = new BroadcastChannel('codeshastra_phases_channel');
            bc2.postMessage({ type: 'PHASE_TOGGLE', phaseNumber, isLive: willBeLive });
            setTimeout(() => { try { bc2.close(); } catch { } }, 1000);
          } catch { }
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        setToastMessage({ type: 'error', text: errData.error || 'Failed to update phase status' });
        await loadAdminData();
      }
    } catch {
      setToastMessage({ type: 'error', text: 'Network error while updating phase status' });
      await loadAdminData();
    } finally {
      setTogglingPhase(null);
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
        clientCache.invalidate(clientCache.keys.ADMIN_DATA);
        await loadAdminData();
      }
    } catch (err: any) {
      setPanelsMessage({ type: 'error', text: err.message || 'Error occurred' });
    } finally {
      setPanelsSubmitLoading(false);
    }
  };

  // Open Visual Panel Edit Modal
  const handleOpenEditPanel = (p: any) => {
    setEditingPanel(p);
    setPanelFormPhase(p.phase_number as 1 | 2 | 3);
    setPanelFormNumber(p.panel_number || '');
    setPanelFormName(p.panel_name || '');
    setPanelFormRangeStart(p.team_range_start || 1);
    setPanelFormRangeEnd(p.team_range_end || 1);
    setPanelFormSelectedJudges((p.judges || []).map((j: any) => j.id));
    setPanelFormShift(p.time_window || 'Batch 1: Morning (08:00 AM - 10:00 AM)');
    setPanelFormDate(p.date || '2026-09-17');
    setPanelFormVenue(p.academic_block || 'Academic Block AB10');
    setPanelFormRoom(p.room_number || 'Room 402');
    setPanelFormError(null);
    setCreatePanelModalOpen(true);
  };

  // Interactive Visual Panel Creation & Editing
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

    const isEditing = Boolean(editingPanel);
    const finalShift = panelFormShift?.trim() || 'Batch 1: Morning (08:00 AM - 10:00 AM)';
    const finalRoom = panelFormRoom === 'Custom' ? panelFormCustomRoom : panelFormRoom;
    const finalVenue = panelFormVenue?.trim() || 'Academic Block AB10';
    const finalPanelNumber = Number(panelFormNumber) || (editingPanel ? editingPanel.panel_number : nextSequentialPanelNumber);
    const finalPanelName = panelFormName.trim() || `Panel ${finalPanelNumber} (${getFormattedTeamRange(panelFormRangeStart, panelFormRangeEnd, panelFormProgram)})`;

    try {
      const res = await fetch('/api/panels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(isEditing ? { action: 'edit_panel', panelId: editingPanel.id } : {}),
          panelNumber: finalPanelNumber,
          panelName: finalPanelName,
          phaseNumber: panelFormPhase,
          teamRangeStart: Number(panelFormRangeStart),
          teamRangeEnd: Number(panelFormRangeEnd),
          supervisorIds: panelFormSelectedJudges,
          schedule: {
            date: panelFormDate,
            timeWindow: finalShift,
            academicBlock: finalVenue,
            roomNumber:
              finalRoom.startsWith('Room') || finalRoom.startsWith('Lab') || finalRoom.startsWith('Seminar') || finalRoom.startsWith('Hall') || isNaN(Number(finalRoom.trim()))
                ? finalRoom.trim()
                : `Room ${finalRoom.trim()}`,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setPanelFormError(data.error || (isEditing ? 'Failed to update panel.' : 'Failed to create panel.'));
      } else {
        setCreatePanelModalOpen(false);
        setEditingPanel(null);
        setPanelFormName('');
        setPanelFormNumber('');
        setPanelFormSelectedJudges([]);
        setToastMessage({ type: 'success', text: isEditing ? `Successfully updated ${finalPanelName}.` : `Successfully created ${finalPanelName}.` });
        clientCache.invalidate(clientCache.keys.ADMIN_DATA);
        await loadAdminData();
      }
    } catch (err: any) {
      setPanelFormError(err.message || (isEditing ? 'Error updating panel.' : 'Error creating panel.'));
    } finally {
      setPanelFormLoading(false);
    }
  };

  // Delete Panel with Software Confirmation Dialog & Instant Loader
  const handleDeletePanel = (panelId: string, panelName: string) => {
    showConfirmDialog({
      title: 'Delete Evaluation Panel?',
      message: `Are you sure you want to delete ${panelName}? This will permanently remove the panel schedule, room allotment, and faculty assignments.`,
      confirmText: 'Delete Panel',
      loadingText: 'Deleting Panel...',
      cancelText: 'Cancel',
      type: 'danger',
      onConfirm: async () => {
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
            setConfirmDialog(null);
            setToastMessage({ type: 'success', text: `Successfully removed ${panelName}.` });
            clientCache.invalidate(clientCache.keys.ADMIN_DATA);
            await loadAdminData();
          } else {
            const data = await res.json();
            setToastMessage({ type: 'error', text: data.error || 'Failed to delete panel' });
            setConfirmDialog(null);
          }
        } catch (e: any) {
          setToastMessage({ type: 'error', text: e.message || 'Error deleting panel' });
          setConfirmDialog(null);
        }
      },
    });
  };

  // Authority Transfer Handlers
  const handleTransferAuthority = async (targetUserId: string, demoteCurrent: boolean) => {
    setTransferLoading(true);
    setTransferMessage(null);

    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'transfer_authority',
          targetUserId,
          demoteCurrentAdmin: demoteCurrent,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setTransferMessage({ type: 'error', text: data.error || 'Failed to transfer admin authority.' });
        setTransferLoading(false);
        return;
      }

      setTransferMessage({ type: 'success', text: data.message });
      setTransferConfirmOpen(false);
      clientCache.invalidate(clientCache.keys.ADMIN_DATA);

      if (data.currentUserDemoted) {
        clientCache.invalidate(clientCache.keys.USER_ME);
        let count = 4;
        setDemotedRedirectCountdown(count);
        const timer = setInterval(() => {
          count -= 1;
          setDemotedRedirectCountdown(count);
          if (count <= 0) {
            clearInterval(timer);
            router.push('/dashboard/faculty');
          }
        }, 1000);
      } else {
        await loadAdminData();
      }
    } catch (err: any) {
      setTransferMessage({ type: 'error', text: err.message || 'Error occurred during authority transfer.' });
    } finally {
      setTransferLoading(false);
    }
  };

  // Direct Role Toggle Handler
  const handleQuickSetRole = async (targetUserId: string, role: 'admin' | 'supervisor') => {
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'set_role',
          targetUserId,
          role,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setToastMessage({ type: 'error', text: data.error || 'Failed to update role' });
        return;
      }
      setToastMessage({ type: 'success', text: 'Faculty role updated successfully.' });
      clientCache.invalidate(clientCache.keys.ADMIN_DATA);
      await loadAdminData();
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err.message || 'Error updating role' });
    }
  };

  // Direct Teacher / Admin Creation Handler
  const handleCreateTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateTeacherLoading(true);
    setTransferMessage(null);

    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_teacher_admin',
          ...createTeacherForm,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setTransferMessage({ type: 'error', text: data.error || 'Failed to create faculty account.' });
        setCreateTeacherLoading(false);
        return;
      }

      clientCache.invalidate(clientCache.keys.ADMIN_DATA);

      if (data.currentUserDemoted) {
        clientCache.invalidate(clientCache.keys.USER_ME);
        let count = 4;
        setDemotedRedirectCountdown(count);
        const timer = setInterval(() => {
          count -= 1;
          setDemotedRedirectCountdown(count);
          if (count <= 0) {
            clearInterval(timer);
            router.push('/dashboard/faculty');
          }
        }, 1000);
      } else {
        setCreateTeacherSuccess({
          user: data.user,
          supervisor: data.supervisor,
          password: createTeacherForm.password || (createTeacherForm.role === 'admin' ? 'Admin@CodeShastra2026' : `CodeShastra@${createTeacherForm.phone ? createTeacherForm.phone.slice(-4) : '2026'}`),
        });
        await loadAdminData();
      }
    } catch (err: any) {
      setTransferMessage({ type: 'error', text: err.message || 'Error creating teacher account.' });
    } finally {
      setCreateTeacherLoading(false);
    }
  };

  const summary = adminData?.summary || {};
  const teams = adminData?.teams || [];
  const supervisors = (adminData?.supervisors || []).filter((s: any) => !s.isAdmin && s.role !== 'admin');
  const phases = adminData?.phases || [];
  const panels = adminData?.panels || [];

  // Computed Absent & Early Joining Students list across all phases
  const absentAndShiftEntries = useMemo(() => {
    const entries: any[] = [];
    (teams || []).forEach((t: any) => {
      (t.students || []).forEach((st: any) => {
        [1, 2, 3].forEach((phaseNum) => {
          const phaseEval = phaseNum === 1 ? st.phase1 : phaseNum === 2 ? st.phase2 : st.phase3;
          if (phaseEval && phaseEval.isAbsent) {
            const status: 'early_joining' | 'absent' = (phaseEval.attendanceStatus === 'early_joining' || phaseEval.attendanceStatus === 'next_shift') ? 'early_joining' : 'absent';
            const panel = (panels || []).find((p: any) => p.phase_number === phaseNum && (p.assigned_team_ids || []).includes(t.id));
            entries.push({
              studentId: st.id,
              studentName: st.full_name,
              rollNo: st.roll_no,
              email: st.email,
              isLeader: st.isLeader,
              teamId: t.id,
              teamCode: t.team_code,
              teamName: t.team_name,
              teamNumber: t.team_number,
              program: t.program,
              supervisor: t.supervisor?.name || 'Unassigned',
              phaseNumber: phaseNum,
              attendanceStatus: status,
              remarks: phaseEval.remarks || '',
              submittedAt: phaseEval.submittedAt,
              panelName: panel?.name || 'Unassigned Panel',
              roomNumber: panel?.room_number || 'TBD',
              timeWindow: panel?.time_window || 'Shift 1',
              evaluators: (panel?.members || []).map((m: any) => m.name).join(', ') || 'Pending',
            });
          }
        });
      });
    });
    return entries;
  }, [teams, panels]);

  const earlyJoiningCount = useMemo(() => absentAndShiftEntries.filter((e) => e.attendanceStatus === 'early_joining').length, [absentAndShiftEntries]);
  const absentCount = useMemo(() => absentAndShiftEntries.filter((e) => e.attendanceStatus === 'absent').length, [absentAndShiftEntries]);

  // Filtered entries for Tab 6: Absent & Early Joining
  const filteredAbsentAndShiftEntries = useMemo(() => {
    return absentAndShiftEntries.filter((item) => {
      if (attendancePhaseFilter !== 'all' && item.phaseNumber !== attendancePhaseFilter) return false;
      if (attendanceStatusFilter !== 'all' && item.attendanceStatus !== attendanceStatusFilter) return false;
      if (attendanceSearch.trim()) {
        const q = attendanceSearch.toLowerCase().trim();
        const matches =
          item.studentName.toLowerCase().includes(q) ||
          item.rollNo.toLowerCase().includes(q) ||
          item.teamCode.toLowerCase().includes(q) ||
          item.teamName.toLowerCase().includes(q) ||
          item.supervisor.toLowerCase().includes(q) ||
          item.remarks.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [absentAndShiftEntries, attendancePhaseFilter, attendanceStatusFilter, attendanceSearch]);

  const getPhaseMaxMarks = (pNum: number) => {
    const p = phases.find((phase: any) => phase.phase_number === pNum);
    return p?.marks_weightage ?? (pNum === 1 ? 20 : pNum === 2 ? 40 : 40);
  };

  // Helper to get granular batch breakdowns for a panel range
  // Helper to get granular batch breakdowns for a panel range (Strict BCA vs BCA DS separation)
  const getPanelBatches = (startNum: number, endNum: number, programFilter?: string, panelName?: string) => {
    let matching = (teams || []).filter((t: any) => t.team_number >= startNum && t.team_number <= endNum);
    
    // Auto-detect program from parameter or panel name if available
    const pUpper = (panelName || '').toUpperCase();
    const isDsFromName = pUpper.includes('DS') || pUpper.includes('BCA - DS') || pUpper.includes('BCA-DS');
    // In college presentation naming, 'G' stands for General/Group (BCA), e.g. G1-G10, G1–G10, Panel 2 (G1–G10)
    const isBcaFromName = pUpper.includes('BCA') || /\bG\d+/i.test(pUpper) || /\(G\d+/i.test(pUpper) || pUpper.includes('(G');

    const prog = programFilter && programFilter !== 'all'
      ? programFilter
      : isDsFromName
      ? 'BCA - DS'
      : isBcaFromName
      ? 'BCA'
      : undefined;

    if (prog === 'BCA') {
      matching = matching.filter((t: any) => t.program === 'BCA' || t.team_code?.startsWith('BCA'));
    } else if (prog === 'BCA - DS') {
      matching = matching.filter((t: any) => t.program?.includes('DS') || t.team_code?.startsWith('DS'));
    }

    const bcaList = matching.filter((t: any) => t.program === 'BCA' || t.team_code?.startsWith('BCA'));
    const dsList = matching.filter((t: any) => t.program?.includes('DS') || t.team_code?.startsWith('DS'));
    const otherList = matching.filter((t: any) => !t.team_code?.startsWith('BCA') && !t.team_code?.startsWith('DS'));

    const batches: { program: string; label: string; count: number; colorBg: string; colorText: string; colorBorder: string }[] = [];

    if (bcaList.length > 0) {
      const first = bcaList[0];
      const last = bcaList[bcaList.length - 1];
      const rangeLabel = first.team_code === last.team_code ? first.team_code : `${first.team_code} → ${last.team_code}`;
      batches.push({
        program: 'BCA',
        label: rangeLabel,
        count: bcaList.length,
        colorBg: '#EFF6FF',
        colorText: '#1D4ED8',
        colorBorder: '#BFDBFE',
      });
    }

    if (dsList.length > 0) {
      const first = dsList[0];
      const last = dsList[dsList.length - 1];
      const rangeLabel = first.team_code === last.team_code ? first.team_code : `${first.team_code} → ${last.team_code}`;
      batches.push({
        program: 'BCA - DS',
        label: rangeLabel,
        count: dsList.length,
        colorBg: '#FAF5FF',
        colorText: '#7E22CE',
        colorBorder: '#E9D5FF',
      });
    }

    if (otherList.length > 0) {
      const first = otherList[0];
      const last = otherList[otherList.length - 1];
      batches.push({
        program: 'Other',
        label: `${first.team_code} → ${last.team_code}`,
        count: otherList.length,
        colorBg: '#F1F5F9',
        colorText: '#475569',
        colorBorder: '#CBD5E1',
      });
    }

    return batches;
  };

  // Helper to get formatted team range label from start and end numbers
  const getFormattedTeamRange = (startNum: number, endNum: number, programFilter?: string, panelName?: string) => {
    const batches = getPanelBatches(startNum, endNum, programFilter, panelName);
    if (batches.length === 0) return `Teams #${startNum}–#${endNum}`;
    return batches.map(b => b.label).join(' & ');
  };

  // Categorized teams for batch selection
  const bcaTeams = useMemo(() => (teams || []).filter((t: any) => t.program === 'BCA' || t.team_code?.startsWith('BCA')), [teams]);
  const dsTeams = useMemo(() => (teams || []).filter((t: any) => t.program?.includes('DS') || t.team_code?.startsWith('DS')), [teams]);

  // Helper to extract clean Section from a Team (from student record or fallback)
  const getTeamSection = (t: any): string => {
    const sSec = t.students?.find((s: any) => s.section)?.section || t.section;
    if (sSec) return String(sSec).trim().toUpperCase();
    return '';
  };

  // Dynamic Section Distribution Presets (Academic Sections e.g. Sec A, Sec B...)
  const bcaPresets = useMemo(() => {
    if (!bcaTeams || bcaTeams.length === 0) return [];
    const secMap = new Map<string, any[]>();
    bcaTeams.forEach((t: any) => {
      const sec = getTeamSection(t) || 'A';
      if (!secMap.has(sec)) secMap.set(sec, []);
      secMap.get(sec)!.push(t);
    });

    const presets: { label: string; shortLabel: string; sectionName: string; program: string; startNum: number; endNum: number; count: number }[] = [];
    Array.from(secMap.keys()).sort().forEach((sec) => {
      const group = secMap.get(sec)!;
      group.sort((a: any, b: any) => (a.team_number || 0) - (b.team_number || 0));
      const first = group[0];
      const last = group[group.length - 1];
      presets.push({
        label: `BCA Sec ${sec} (${first.team_code} → ${last.team_code})`,
        shortLabel: `BCA Sec ${sec}`,
        sectionName: `Sec ${sec}`,
        program: 'BCA',
        startNum: first.team_number,
        endNum: last.team_number,
        count: group.length,
      });
    });
    return presets;
  }, [bcaTeams]);

  const dsPresets = useMemo(() => {
    if (!dsTeams || dsTeams.length === 0) return [];
    const secMap = new Map<string, any[]>();
    dsTeams.forEach((t: any) => {
      const sec = getTeamSection(t) || 'A';
      if (!secMap.has(sec)) secMap.set(sec, []);
      secMap.get(sec)!.push(t);
    });

    const presets: { label: string; shortLabel: string; sectionName: string; program: string; startNum: number; endNum: number; count: number }[] = [];
    Array.from(secMap.keys()).sort().forEach((sec) => {
      const group = secMap.get(sec)!;
      group.sort((a: any, b: any) => (a.team_number || 0) - (b.team_number || 0));
      const first = group[0];
      const last = group[group.length - 1];
      presets.push({
        label: `DS Sec ${sec} (${first.team_code} → ${last.team_code})`,
        shortLabel: `DS Sec ${sec}`,
        sectionName: `DS Sec ${sec}`,
        program: 'BCA - DS',
        startNum: first.team_number,
        endNum: last.team_number,
        count: group.length,
      });
    });
    return presets;
  }, [dsTeams]);

  // Teams currently included within the selected start and end range (Strictly isolated by Program)
  const selectedRangeTeams = useMemo(() => {
    const candidateList = panelFormProgram === 'BCA' 
      ? bcaTeams 
      : panelFormProgram === 'BCA - DS' 
      ? dsTeams 
      : teams;
    return (candidateList || []).filter(
      (t: any) => t.team_number >= panelFormRangeStart && t.team_number <= panelFormRangeEnd
    );
  }, [teams, bcaTeams, dsTeams, panelFormProgram, panelFormRangeStart, panelFormRangeEnd]);

  const selectedRangeStudentCount = useMemo(() => {
    return selectedRangeTeams.reduce((acc: number, t: any) => acc + (t.students?.length || 0), 0);
  }, [selectedRangeTeams]);

  // Normalize shift helper for precise multi-shift occupancy matching
  const normalizeShiftKey = (s: string) => {
    if (!s) return '';
    const lower = s.toLowerCase().trim();
    if (lower.includes('morning') || lower.includes('batch 1') || lower.includes('shift 1') || lower.includes('08:00') || lower.includes('09:00') || lower.includes('10:00')) return 'shift1';
    if (lower.includes('afternoon') || lower.includes('batch 2') || lower.includes('shift 2') || lower.includes('12:00') || lower.includes('01:00') || lower.includes('02:00') || lower.includes('13:00') || lower.includes('14:00')) return 'shift2';
    if (lower.includes('evening') || lower.includes('batch 3') || lower.includes('shift 3') || lower.includes('03:00') || lower.includes('04:00') || lower.includes('05:00') || lower.includes('15:00') || lower.includes('16:00') || lower.includes('17:00')) return 'shift3';
    return lower.replace(/[^a-z0-9]/g, '');
  };

  const normalizeRoomName = (r: string) => {
    if (!r) return '';
    return r.toLowerCase().replace(/^(room|lab|hall|seminar)\s+/i, '').replace(/[^a-z0-9]/g, '').trim();
  };

  // Check for potential mentor relationships with selected judges in this range (informational note)
  const panelJudgeConflicts = useMemo(() => {
    if (panelFormSelectedJudges.length === 0 || selectedRangeTeams.length === 0) return [];
    const conflicts: { judgeName: string; teamCode: string }[] = [];
    panelFormSelectedJudges.forEach((judgeId) => {
      const sup = (supervisors || []).find((s: any) => s.id === judgeId);
      const conflictTeam = selectedRangeTeams.find((t: any) => t.supervisor?.id === judgeId || t.supervisor_id === judgeId);
      if (conflictTeam && sup) {
        conflicts.push({ judgeName: sup.full_name, teamCode: conflictTeam.team_code });
      }
    });
    return conflicts;
  }, [panelFormSelectedJudges, selectedRangeTeams, supervisors]);

  // Faculty Availability calculations renewed for selected Phase, Shift & Date
  const getFacultyAvailability = (facultyId: string) => {
    const assignedPhasePanels = (panels || []).filter(
      (p: any) =>
        p.phase_number === panelFormPhase &&
        (p.judges || []).some((j: any) => j.id === facultyId)
    );
    const assignedInThisShift = assignedPhasePanels.find((p: any) => {
      if (editingPanel && p.id === editingPanel.id) return false;
      const pShift = (p.time_window || '').trim();
      const curShift = (panelFormShift || '').trim();
      const pDate = (p.date || '').trim();
      const curDate = (panelFormDate || '').trim();
      const sameDate = !pDate || !curDate || pDate.toLowerCase() === curDate.toLowerCase();
      const sameShift = !pShift || !curShift || normalizeShiftKey(pShift) === normalizeShiftKey(curShift);
      return sameDate && sameShift;
    });
    const conflictTeam = selectedRangeTeams.find(
      (t: any) => t.supervisor_id === facultyId || t.supervisor?.id === facultyId
    );
    return {
      isAvailable: !assignedInThisShift,
      assignedInThisShift,
      assignedPanels: assignedPhasePanels,
      conflictTeam,
    };
  };

  const facultyAvailabilityStats = useMemo(() => {
    let availableCount = 0;
    let busyCount = 0;
    (supervisors || []).forEach((s: any) => {
      const avail = getFacultyAvailability(s.id);
      if (avail.isAvailable) availableCount++;
      else busyCount++;
    });
    return { availableCount, busyCount };
  }, [supervisors, panels, panelFormPhase, panelFormShift, panelFormDate, editingPanel]);

  // Compute next sequential panel number for the selected phase
  const nextSequentialPanelNumber = useMemo(() => {
    const phasePanels = (panels || []).filter((p: any) => p.phase_number === panelFormPhase);
    return phasePanels.reduce((max: number, p: any) => Math.max(max, p.panel_number || 0), 0) + 1;
  }, [panels, panelFormPhase]);

  // Dynamic AB10 Rooms List synchronized with Database
  const AB10_ROOMS = useMemo(() => {
    return (dbRooms || []).map((r: any) => (typeof r === 'string' ? r : r?.name)).filter(Boolean);
  }, [dbRooms]);

  // All Display Rooms (including custom room if editing existing panel)
  const ALL_DISPLAY_ROOMS = useMemo(() => {
    const list = [...AB10_ROOMS];
    if (editingPanel?.room_number && !list.includes(editingPanel.room_number)) {
      list.push(editingPanel.room_number);
    }
    return list;
  }, [AB10_ROOMS, editingPanel]);

  // Auto-sync panelFormRoom when rooms list loads
  useEffect(() => {
    if (ALL_DISPLAY_ROOMS.length > 0 && !editingPanel) {
      if (!panelFormRoom || !ALL_DISPLAY_ROOMS.includes(panelFormRoom)) {
        setPanelFormRoom(ALL_DISPLAY_ROOMS[0]);
      }
    }
  }, [ALL_DISPLAY_ROOMS, editingPanel, panelFormRoom]);

  // Standard Shift Presets with Time Slots
  const SHIFT_PRESETS = useMemo(() => {
    return dbShifts || [];
  }, [dbShifts]);

  // Real occupancy check helper for any room renewed dynamically for phase, shift & date
  const getOccupyingPanelForRoom = (roomName: string) => {
    if (!roomName) return null;
    const cleanRoom = normalizeRoomName(roomName);

    return (panels || []).find((p: any) => {
      // Exclude the current panel being edited
      if (editingPanel && p.id === editingPanel.id) return false;

      // Match evaluation phase
      if (p.phase_number !== panelFormPhase) return false;

      // Match presentation date (if both have date values)
      const pDate = (p.date || '').trim().toLowerCase();
      const curDate = (panelFormDate || '').trim().toLowerCase();
      if (pDate && curDate && pDate !== curDate) return false;

      // Match shift / time window
      const pShift = (p.time_window || '').trim();
      const curShift = (panelFormShift || '').trim();
      if (pShift && curShift && normalizeShiftKey(pShift) !== normalizeShiftKey(curShift)) {
        return false;
      }

      // Match room number normalized
      const pCleanRoom = normalizeRoomName(p.room_number || '');
      return pCleanRoom === cleanRoom || (p.room_number || '').toLowerCase().trim() === roomName.toLowerCase().trim();
    });
  };

  // Calculate Live Room Occupancy & Availability for displayed rooms
  const roomOccupancyMap = useMemo(() => {
    const map: Record<string, { isAvailable: boolean; occupiedByPanel?: string }> = {};

    ALL_DISPLAY_ROOMS.forEach((room) => {
      const occ = getOccupyingPanelForRoom(room);
      map[room] = {
        isAvailable: !occ,
        occupiedByPanel: occ ? (occ.panel_name || `Panel #${occ.panel_number}`) : undefined,
      };
    });

    return map;
  }, [ALL_DISPLAY_ROOMS, panels, panelFormDate, panelFormShift, panelFormPhase, editingPanel]);

  // Occupying panel for currently selected room (strictly real check)
  const occupyingPanelForSelected = useMemo(() => {
    return getOccupyingPanelForRoom(panelFormRoom);
  }, [panelFormRoom, panels, panelFormDate, panelFormShift, panelFormPhase, editingPanel]);

  // First available vacant room
  const firstAvailableRoom = useMemo(() => {
    return ALL_DISPLAY_ROOMS.find((r) => roomOccupancyMap[r]?.isAvailable) || ALL_DISPLAY_ROOMS[0];
  }, [ALL_DISPLAY_ROOMS, roomOccupancyMap]);

  // Auto-allot available room helper
  const handleAutoAllotRoom = () => {
    if (firstAvailableRoom) {
      setPanelFormRoom(firstAvailableRoom);
    }
  };



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
      (phaseClearanceFilter === 'p1_approved' && t.phase1_approved) ||
      (phaseClearanceFilter === 'p1_pending' && !t.phase1_approved) ||
      (phaseClearanceFilter === 'p2' && t.phase2_approved) ||
      (phaseClearanceFilter === 'p2_synopsis_submitted' && t.phase2_approved) ||
      (phaseClearanceFilter === 'p2_synopsis_pending' && !t.phase2_approved) ||
      (phaseClearanceFilter === 'p3' && (t.phase3_report_clearance || t.phase3_approved)) ||
      (phaseClearanceFilter === 'p3_report_submitted' && (t.phase3_report_clearance || t.phase3_approved)) ||
      (phaseClearanceFilter === 'p3_report_pending' && !(t.phase3_report_clearance || t.phase3_approved));

    return matchesSearch && matchesProgram && matchesClearance;
  });

  const totalPages = Math.ceil(filteredTeams.length / PAGE_SIZE) || 1;
  const paginatedTeams = filteredTeams.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Filtered supervisors for Tab 3
  const filteredSupervisors = supervisors.filter((s: any) => {
    if (s.isAdmin || s.role === 'admin') return false;
    const q = supervisorSearch.toLowerCase().trim();
    return (
      !q ||
      s.name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.phone?.toLowerCase().includes(q) ||
      s.assignedTeams?.some((t: any) => t.team_name?.toLowerCase().includes(q) || t.team_code?.toLowerCase().includes(q))
    );
  });

  // Filtered panels for Tab 4
  const filteredPanels = panels.filter((p: any) => {
    const matchesPhase = Number(p.phase_number) === Number(panelPhaseFilter);
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
    const marks = getPhaseMaxMarks(phase);
    const roundName = phase === 1 ? `Round 1 (Phase 1 • ${marks} Marks)` : phase === 2 ? `Round 2 (Phase 2 • ${marks} Marks)` : `Round 3 (Final Defense • ${marks} Marks)`;
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

  if (loading) {
    return <LoadingScreen label="Loading administration portal..." />;
  }

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

            {/* Quick Actions (Responsive: Desktop 4-in-a-row, Mobile 2x2 grid) */}
            <div className="admin-header-actions">
              <Link
                href="/dashboard/faculty"
                className="btn btn-outline"
                style={{
                  height: '38px',
                  padding: '0 14px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  gap: '6px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxSizing: 'border-box',
                }}
                title="Switch to Faculty Mentor & Evaluation Panel Workspace"
              >
                <Users size={15} color="var(--color-primary)" /> Faculty Portal
              </Link>

              <button
                type="button"
                onClick={() => {
                  setToastMessage({ type: 'info', text: 'Generating Master Excel Workbook...' });
                  exportMasterWorkbook({
                    panels,
                    teams,
                    supervisors,
                    absentEntries: absentAndShiftEntries,
                    defaultingTeams,
                  });
                  setToastMessage({ type: 'success', text: 'Master Excel Workbook downloaded.' });
                }}
                className="btn btn-outline"
                style={{
                  height: '38px',
                  padding: '0 14px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  gap: '6px',
                  borderRadius: '8px',
                  borderColor: '#2563EB',
                  color: '#1D4ED8',
                  backgroundColor: '#EFF6FF',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxSizing: 'border-box',
                }}
                title="Download all platform data across 5 sections in a multi-sheet Excel file"
              >
                <Download size={14} /> Master Report (.xlsx)
              </button>

              <button
                type="button"
                onClick={() => {
                  setCreatePanelModalOpen(true);
                  setPanelFormError(null);
                }}
                className="btn btn-primary"
                style={{
                  height: '38px',
                  padding: '0 16px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  gap: '6px',
                  borderRadius: '8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxSizing: 'border-box',
                }}
              >
                <Plus size={15} /> Assign Panel
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
            <button
              className={`segmented-pill ${activeTab === 'attendance' ? 'active' : ''}`}
              onClick={() => setActiveTab('attendance')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>Absent & Early Joining</span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: '10px',
                  backgroundColor: activeTab === 'attendance' ? 'var(--color-primary)' : '#FEF3C7',
                  color: activeTab === 'attendance' ? '#FFFFFF' : '#B45309',
                }}
              >
                {absentAndShiftEntries.length}
              </span>
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
              <div
                className="landing-stat-card"
                onClick={() => setActiveTab('teams')}
                style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', textAlign: 'left', padding: '16px 18px', position: 'relative', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s ease' }}
                title="Click to view full Teams & Students Directory"
              >
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

              <div
                className="landing-stat-card"
                onClick={() => { setActiveTab('teams'); setSearchQuery(''); }}
                style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', textAlign: 'left', padding: '16px 18px', position: 'relative', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s ease' }}
                title="Click to view team leader activation status"
              >
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

              <div
                className="landing-stat-card"
                onClick={() => setActiveTab('supervisors')}
                style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', textAlign: 'left', padding: '16px 18px', position: 'relative', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s ease' }}
                title="Click to view Faculty Mentors Directory"
              >
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

              <div
                className="landing-stat-card"
                onClick={() => setDefaultingModalOpen(true)}
                style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', textAlign: 'left', padding: '16px 18px', position: 'relative', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s ease', border: defaultingTeams.length > 0 ? '1px solid #FECACA' : undefined }}
                title="Click to pop up the full list of Defaulting Teams"
              >
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
                  <div style={{ fontSize: '11.5px', color: defaultingTeams.length > 0 ? '#B91C1C' : '#16A34A', marginTop: '4px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>{defaultingTeams.length > 0 ? 'Action Required' : '0 Compliance Issues'}</span>
                    <span style={{ fontSize: '10.5px', color: '#DC2626', textDecoration: 'underline' }}>View List →</span>
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
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px', alignItems: 'center' }}>
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

                          {editingPhaseMarks[ph.phase_number] !== undefined ? (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <input
                                type="number"
                                min="1"
                                max="500"
                                value={editingPhaseMarks[ph.phase_number]}
                                onChange={(e) =>
                                  setEditingPhaseMarks({
                                    ...editingPhaseMarks,
                                    [ph.phase_number]: Number(e.target.value),
                                  })
                                }
                                style={{
                                  width: '60px',
                                  padding: '2px 6px',
                                  fontSize: '11.5px',
                                  fontWeight: 700,
                                  borderRadius: '4px',
                                  border: '1px solid var(--color-primary)',
                                  outline: 'none',
                                }}
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdatePhaseMarks(
                                    ph.phase_number,
                                    editingPhaseMarks[ph.phase_number]
                                  )
                                }
                                disabled={savingPhaseMarks === ph.phase_number}
                                className="btn btn-primary"
                                style={{ padding: '2px 7px', fontSize: '11px', borderRadius: '4px' }}
                              >
                                {savingPhaseMarks === ph.phase_number ? '...' : 'Save'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingPhaseMarks((prev) => {
                                    const next = { ...prev };
                                    delete next[ph.phase_number];
                                    return next;
                                  });
                                }}
                                className="btn btn-outline"
                                style={{ padding: '2px 6px', fontSize: '11px', borderRadius: '4px' }}
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                setEditingPhaseMarks({
                                  ...editingPhaseMarks,
                                  [ph.phase_number]: marks,
                                })
                              }
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
                                border: '1px solid #A7F3D0',
                                cursor: 'pointer',
                              }}
                              title="Click to change max marks for this round"
                            >
                              <Award size={11} /> {marks} Max Marks <Edit3 size={10} style={{ opacity: 0.7 }} />
                            </button>
                          )}
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

                      {(() => {
                        const isTogglingPh = togglingPhase === ph.phase_number;
                        return (
                          <button
                            type="button"
                            disabled={isTogglingPh}
                            onClick={() => handleTogglePhaseLive(ph.phase_number, ph.is_live)}
                            className={ph.is_live ? 'btn btn-outline' : 'btn btn-primary'}
                            style={{
                              width: '100%',
                              fontSize: '13px',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              cursor: isTogglingPh ? 'wait' : 'pointer',
                              opacity: isTogglingPh ? 0.75 : 1,
                              backgroundColor: ph.is_live ? '#FEF2F2' : undefined,
                              color: ph.is_live ? '#DC2626' : undefined,
                              borderColor: ph.is_live ? '#FCA5A5' : undefined,
                            }}
                          >
                            {isTogglingPh ? (
                              <>
                                <RefreshCw size={13} className="animate-spin" />
                                <span>{ph.is_live ? `Stopping Phase ${ph.phase_number}...` : `Starting Phase ${ph.phase_number}...`}</span>
                              </>
                            ) : ph.is_live ? (
                              <>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#DC2626', display: 'inline-block' }} />
                                <span>Stop Phase {ph.phase_number} (Lock Marks)</span>
                              </>
                            ) : (
                              <>
                                <Play size={13} fill="currentColor" />
                                <span>Start Phase {ph.phase_number} (Go Live)</span>
                              </>
                            )}
                          </button>
                        );
                      })()}
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

                {/* Phase Milestones Clearance Filter Strip */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', width: '100%', paddingTop: '6px', borderTop: '1px dashed #E2E8F0' }}>
                  <span style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--color-text-faint)', textTransform: 'uppercase', letterSpacing: '0.04em', marginRight: '4px' }}>
                    Phase Milestones:
                  </span>
                  <button
                    type="button"
                    onClick={() => { setPhaseClearanceFilter('all'); setCurrentPage(1); }}
                    style={{
                      padding: '3px 9px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: phaseClearanceFilter === 'all' ? 800 : 600,
                      backgroundColor: phaseClearanceFilter === 'all' ? '#1E293B' : '#F1F5F9',
                      color: phaseClearanceFilter === 'all' ? '#FFFFFF' : '#475569',
                      border: '1px solid #CBD5E1',
                      cursor: 'pointer',
                    }}
                  >
                    All Teams
                  </button>
                  <button
                    type="button"
                    onClick={() => { setPhaseClearanceFilter('p1_approved'); setCurrentPage(1); }}
                    style={{
                      padding: '3px 9px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: phaseClearanceFilter === 'p1_approved' ? 800 : 600,
                      backgroundColor: phaseClearanceFilter === 'p1_approved' ? '#059669' : '#ECFDF5',
                      color: phaseClearanceFilter === 'p1_approved' ? '#FFFFFF' : '#047857',
                      border: '1px solid #A7F3D0',
                      cursor: 'pointer',
                    }}
                  >
                    Permitted P1 ({teams.filter((t: any) => t.phase1_approved).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => { setPhaseClearanceFilter('p1_pending'); setCurrentPage(1); }}
                    style={{
                      padding: '3px 9px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: phaseClearanceFilter === 'p1_pending' ? 800 : 600,
                      backgroundColor: phaseClearanceFilter === 'p1_pending' ? '#64748B' : '#F8FAFC',
                      color: phaseClearanceFilter === 'p1_pending' ? '#FFFFFF' : '#64748B',
                      border: '1px solid #E2E8F0',
                      cursor: 'pointer',
                    }}
                  >
                    Non-Permitted P1 ({teams.filter((t: any) => !t.phase1_approved).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => { setPhaseClearanceFilter('p2_synopsis_submitted'); setCurrentPage(1); }}
                    style={{
                      padding: '3px 9px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: phaseClearanceFilter === 'p2_synopsis_submitted' ? 800 : 600,
                      backgroundColor: phaseClearanceFilter === 'p2_synopsis_submitted' ? '#2563EB' : '#EFF6FF',
                      color: phaseClearanceFilter === 'p2_synopsis_submitted' ? '#FFFFFF' : '#1D4ED8',
                      border: '1px solid #BFDBFE',
                      cursor: 'pointer',
                    }}
                  >
                    Synopsis Done ({teams.filter((t: any) => t.phase2_approved).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => { setPhaseClearanceFilter('p2_synopsis_pending'); setCurrentPage(1); }}
                    style={{
                      padding: '3px 9px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: phaseClearanceFilter === 'p2_synopsis_pending' ? 800 : 600,
                      backgroundColor: phaseClearanceFilter === 'p2_synopsis_pending' ? '#D97706' : '#FFFBEB',
                      color: phaseClearanceFilter === 'p2_synopsis_pending' ? '#FFFFFF' : '#B45309',
                      border: '1px solid #FDE68A',
                      cursor: 'pointer',
                    }}
                  >
                    Synopsis Due ({teams.filter((t: any) => !t.phase2_approved).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => { setPhaseClearanceFilter('p3_report_submitted'); setCurrentPage(1); }}
                    style={{
                      padding: '3px 9px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: phaseClearanceFilter === 'p3_report_submitted' ? 800 : 600,
                      backgroundColor: phaseClearanceFilter === 'p3_report_submitted' ? '#7C3AED' : '#F5F3FF',
                      color: phaseClearanceFilter === 'p3_report_submitted' ? '#FFFFFF' : '#6D28D9',
                      border: '1px solid #DDD6FE',
                      cursor: 'pointer',
                    }}
                  >
                    Report &amp; Cert Done ({teams.filter((t: any) => t.phase3_report_clearance || t.phase3_approved).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => { setPhaseClearanceFilter('p3_report_pending'); setCurrentPage(1); }}
                    style={{
                      padding: '3px 9px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: phaseClearanceFilter === 'p3_report_pending' ? 800 : 600,
                      backgroundColor: phaseClearanceFilter === 'p3_report_pending' ? '#9333EA' : '#FAF5FF',
                      color: phaseClearanceFilter === 'p3_report_pending' ? '#FFFFFF' : '#7E22CE',
                      border: '1px solid #E9D5FF',
                      cursor: 'pointer',
                    }}
                  >
                    ⏳ Report Due ({teams.filter((t: any) => !(t.phase3_report_clearance || t.phase3_approved)).length})
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', width: '100%', justifyContent: 'space-between', paddingTop: '4px' }}>
                  <div style={{ fontSize: '12.5px', color: 'var(--color-text-muted)' }}>
                    Found <strong>{filteredTeams.length}</strong> teams matching filters
                  </div>

                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        exportTeamsAndStudents(filteredTeams, 'xlsx');
                        setToastMessage({ type: 'success', text: 'Teams & Students Excel roster downloaded.' });
                      }}
                      className="btn btn-outline"
                      style={{ padding: '5px 10px', fontSize: '11.5px', gap: '4px', borderRadius: '6px' }}
                      title="Download Teams roster as Excel (.xlsx)"
                    >
                      <Download size={12} /> Excel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        exportTeamsAndStudents(filteredTeams, 'csv');
                        setToastMessage({ type: 'success', text: 'Teams & Students CSV downloaded.' });
                      }}
                      className="btn btn-outline"
                      style={{ padding: '5px 10px', fontSize: '11.5px', gap: '4px', borderRadius: '6px' }}
                      title="Download Teams roster as CSV (.csv)"
                    >
                      CSV
                    </button>
                  </div>
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
                    <th>Phase Milestones</th>
                    <th>Students & Marks</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTeams.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '24px 12px' }}>
                        <EmptyStateGraphic
                          type="search"
                          title="No Teams Match Your Criteria"
                          description="Try adjusting your search query, roll number, or program filter to find registered teams."
                        />
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
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                              <span
                                className={`badge ${t.phase1_approved ? 'badge-success' : 'badge-neutral'}`}
                                style={{ fontSize: '10px', padding: '1px 6px', fontWeight: 700 }}
                              >
                                {t.phase1_approved ? 'Permitted (P1)' : 'Non-Permitted (P1)'}
                              </span>
                              <span
                                className={`badge ${t.phase2_approved ? 'badge-success' : 'badge-warning'}`}
                                style={{ fontSize: '10px', padding: '1px 6px', fontWeight: 700 }}
                              >
                                {t.phase2_approved ? 'Synopsis Done' : 'Synopsis Due'}
                              </span>
                            </div>
                            <span
                              className={`badge ${(t.phase3_report_clearance || t.phase3_approved) ? 'badge-success' : 'badge-neutral'}`}
                              style={{ fontSize: '10px', padding: '1px 6px', fontWeight: 700, width: 'fit-content' }}
                            >
                              {(t.phase3_report_clearance || t.phase3_approved) ? 'Report Cleared' : 'Report Due'}
                            </span>
                          </div>
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
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleAdminMilestone(t.id, 1, Boolean(t.phase1_approved));
                              }}
                              style={{
                                padding: '5px 10px',
                                fontSize: '11px',
                                fontWeight: 700,
                                borderRadius: '6px',
                                border: t.phase1_approved ? '1px solid #BBF7D0' : '1px solid #CBD5E1',
                                backgroundColor: t.phase1_approved ? '#F0FDF4' : '#F8FAFC',
                                color: t.phase1_approved ? '#15803D' : '#475569',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                              title={t.phase1_approved ? 'Click to revoke Phase 1 permission' : 'Click to permit team for Phase 1'}
                            >
                              {t.phase1_approved ? (
                                <>
                                  <CheckCircle2 size={12} color="#16A34A" /> Permitted
                                </>
                              ) : (
                                <>
                                  <ShieldCheck size={12} color="#64748B" /> Permit P1
                                </>
                              )}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTeamModal(t);
                              }}
                              className="btn btn-outline"
                              style={{ padding: '5px 10px', fontSize: '11px', gap: '4px' }}
                            >
                              <Eye size={12} /> View
                            </button>
                          </div>
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
                <EmptyStateGraphic
                  type="search"
                  title="No Teams Found"
                  description="No teams matched your active search query or filter."
                />
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
                    {/* Top Row: Team Name & Quick Action */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-ink)', lineHeight: 1.2 }}>
                          {t.team_name}
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', marginTop: '2px', fontWeight: 500 }}>
                          {t.program} • {t.studentCount || (t.students?.length || 0)} Members
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleAdminMilestone(t.id, 1, Boolean(t.phase1_approved));
                        }}
                        style={{
                          padding: '4px 8px',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          borderRadius: '6px',
                          border: t.phase1_approved ? '1px solid #BBF7D0' : '1px solid #CBD5E1',
                          backgroundColor: t.phase1_approved ? '#F0FDF4' : '#F8FAFC',
                          color: t.phase1_approved ? '#15803D' : '#475569',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                        }}
                      >
                        {t.phase1_approved ? <><CheckCircle2 size={11} color="#16A34A" /> Permitted</> : <><ShieldCheck size={11} /> Permit</>}
                      </button>
                    </div>

                    {/* Phase Milestones Bar */}
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                      <span
                        className={`badge ${t.phase1_approved ? 'badge-success' : 'badge-neutral'}`}
                        style={{ fontSize: '10px', padding: '2px 6px', fontWeight: 700 }}
                      >
                        {t.phase1_approved ? 'Permitted (P1)' : 'Non-Permitted (P1)'}
                      </span>
                      <span
                        className={`badge ${t.phase2_approved ? 'badge-success' : 'badge-warning'}`}
                        style={{ fontSize: '10px', padding: '2px 6px', fontWeight: 700 }}
                      >
                        {t.phase2_approved ? 'Synopsis Done' : 'Synopsis Due'}
                      </span>
                      <span
                        className={`badge ${(t.phase3_report_clearance || t.phase3_approved) ? 'badge-success' : 'badge-neutral'}`}
                        style={{ fontSize: '10px', padding: '2px 6px', fontWeight: 700 }}
                      >
                        {(t.phase3_report_clearance || t.phase3_approved) ? 'Report Cleared' : 'Report Due'}
                      </span>
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
            {/* Search Bar & Add Faculty Button */}
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

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <div style={{ fontSize: '12.5px', color: 'var(--color-text-muted)' }}>
                    Total <strong>{filteredSupervisors.length}</strong> Faculty Members
                  </div>

                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        exportFacultyDirectory(filteredSupervisors, panels, 'xlsx');
                        setToastMessage({ type: 'success', text: 'Faculty Directory Excel downloaded.' });
                      }}
                      className="btn btn-outline"
                      style={{ padding: '5px 10px', fontSize: '11.5px', gap: '4px', borderRadius: '6px' }}
                      title="Download Faculty Directory as Excel (.xlsx)"
                    >
                      <Download size={12} /> Excel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        exportFacultyDirectory(filteredSupervisors, panels, 'csv');
                        setToastMessage({ type: 'success', text: 'Faculty Directory CSV downloaded.' });
                      }}
                      className="btn btn-outline"
                      style={{ padding: '5px 10px', fontSize: '11.5px', gap: '4px', borderRadius: '6px' }}
                      title="Download Faculty Directory as CSV (.csv)"
                    >
                      CSV
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setAuthorityModalOpen(true);
                      setAuthorityActiveTab('create');
                      setTransferMessage(null);
                      setCreateTeacherSuccess(null);
                    }}
                    className="btn btn-primary"
                    style={{ padding: '8px 16px', fontSize: '12.5px', fontWeight: 600, gap: '6px', borderRadius: '8px' }}
                  >
                    <UserPlus size={14} /> + Add Mentor
                  </button>
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-ink)' }}>{s.name}</h4>
                          {s.isAdmin && (
                            <span
                              className="badge"
                              style={{
                                fontSize: '10.5px',
                                backgroundColor: '#FEF3C7',
                                color: '#92400E',
                                border: '1px solid #FCD34D',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                padding: '2px 6px',
                              }}
                            >
                              <Crown size={11} color="#D97706" /> Admin
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                          {s.designation} {s.employee_id ? `• ${s.employee_id}` : ''}
                        </div>
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
                        {s.assignedTeams?.length === 0 ? (
                          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                            No teams assigned yet
                          </span>
                        ) : (
                          s.assignedTeams?.map((t: any) => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const fullTeam = teams.find((team: any) => team.id === t.id) || t;
                                setSelectedTeamModal(fullTeam);
                              }}
                              style={{
                                fontSize: '10.5px',
                                padding: '2px 7px',
                                borderRadius: '4px',
                                backgroundColor: 'var(--color-canvas-soft)',
                                border: '1px solid var(--color-hairline)',
                                color: 'var(--color-ink)',
                                cursor: 'pointer',
                              }}
                              className="btn-icon-hover"
                              title={`Click to view ${t.team_name} details & marks`}
                            >
                              {t.team_name}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px', alignItems: 'center' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSupervisorModal(s);
                      }}
                      className="btn btn-outline"
                      style={{ flex: 1, fontSize: '12px', padding: '6px 12px' }}
                    >
                      View Details
                    </button>
                    {s.isAdmin && (
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          backgroundColor: 'rgba(16, 185, 129, 0.1)',
                          color: '#059669',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <BadgeCheck size={13} /> Active Admin
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 4: PANELS & PRESENTATION LOGISTICS (2 Batches, Rooms, Dates)    */}
        {/* =================================================================== */}
        {activeTab === 'panels' && (() => {
          const currentPanelPhaseObj = phases.find((ph: any) => ph.phase_number === panelPhaseFilter);
          const isCurrentPanelPhaseLive = currentPanelPhaseObj ? currentPanelPhaseObj.is_live : false;

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Header & Controls */}
              <div className="card" style={{ padding: '16px 18px', width: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Top Row: Phase Selection Pills + Live/Stop Status Button */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  {/* Phase Selection Pills */}
                  <div className="segmented-control touch-scroll-x" style={{ padding: '3px', boxSizing: 'border-box', overflowX: 'auto', display: 'flex', flexShrink: 0 }}>
                    <button
                      className={`segmented-pill ${panelPhaseFilter === 1 ? 'active' : ''}`}
                      onClick={() => setPanelPhaseFilter(1)}
                      style={{ padding: '6px 14px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', flexShrink: 0 }}
                    >
                      <Target size={13} color={panelPhaseFilter === 1 ? '#2563EB' : 'currentColor'} />
                      <span>Round 1 (19-Sep)</span>
                    </button>
                    <button
                      className={`segmented-pill ${panelPhaseFilter === 2 ? 'active' : ''}`}
                      onClick={() => setPanelPhaseFilter(2)}
                      style={{ padding: '6px 14px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', flexShrink: 0 }}
                    >
                      <Layers size={13} color={panelPhaseFilter === 2 ? '#059669' : 'currentColor'} />
                      <span>Round 2 (17-Oct)</span>
                    </button>
                    <button
                      className={`segmented-pill ${panelPhaseFilter === 3 ? 'active' : ''}`}
                      onClick={() => setPanelPhaseFilter(3)}
                      style={{ padding: '6px 14px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', flexShrink: 0 }}
                    >
                      <Award size={13} color={panelPhaseFilter === 3 ? '#D97706' : 'currentColor'} />
                      <span>Round 3 (Final Defense)</span>
                    </button>
                  </div>

                  {/* Direct Stop / Start Phase Button with Integrated Spinner Loader */}
                  {(() => {
                    const isToggling = togglingPhase === panelPhaseFilter;
                    return (
                      <button
                        type="button"
                        disabled={isToggling}
                        onClick={() => handleTogglePhaseLive(panelPhaseFilter as (1 | 2 | 3), isCurrentPanelPhaseLive)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          height: '36px',
                          padding: '0 14px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: isToggling ? 'wait' : 'pointer',
                          opacity: isToggling ? 0.75 : 1,
                          transition: 'all 0.15s ease',
                          backgroundColor: isCurrentPanelPhaseLive ? '#FEF2F2' : '#ECFDF5',
                          color: isCurrentPanelPhaseLive ? '#DC2626' : '#059669',
                          border: isCurrentPanelPhaseLive ? '1.5px solid #FCA5A5' : '1.5px solid #A7F3D0',
                          whiteSpace: 'nowrap',
                          boxShadow: isToggling ? 'inset 0 1px 3px rgba(0,0,0,0.1)' : '0 1px 2px rgba(0,0,0,0.03)',
                        }}
                        title={
                          isCurrentPanelPhaseLive
                            ? `Phase ${panelPhaseFilter} is currently LIVE. Click to STOP this phase and immediately lock marks from panel members.`
                            : `Phase ${panelPhaseFilter} is currently STOPPED. Click to GO LIVE so panel members can record marks.`
                        }
                      >
                        {isToggling ? (
                          <>
                            <RefreshCw size={13} className="animate-spin" />
                            <span>{isCurrentPanelPhaseLive ? `Stopping Phase ${panelPhaseFilter}...` : `Starting Phase ${panelPhaseFilter}...`}</span>
                          </>
                        ) : isCurrentPanelPhaseLive ? (
                          <>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#DC2626', display: 'inline-block' }} />
                            <span>Stop Phase {panelPhaseFilter} (Lock Marks)</span>
                          </>
                        ) : (
                          <>
                            <Play size={13} fill="#059669" color="#059669" />
                            <span>Start Phase {panelPhaseFilter} (Go Live)</span>
                          </>
                        )}
                      </button>
                    );
                  })()}
                </div>

                {/* Bottom Row: Search Bar on Left + Export & Add Actions on Right */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', paddingTop: '12px', borderTop: '1px solid #F1F5F9' }}>
                  <div className="search-input-wrapper" style={{ minWidth: '220px', maxWidth: '340px', flex: '1 1 auto' }}>
                    <input
                      type="text"
                      className="input-field"
                      style={{ height: '36px', fontSize: '12.5px' }}
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

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {/* Export Panels Buttons */}
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          exportPanelsData(filteredPanels, 'xlsx');
                          setToastMessage({ type: 'success', text: `Phase ${panelPhaseFilter} Panels Excel report downloaded.` });
                        }}
                        className="btn btn-outline"
                        style={{ height: '36px', padding: '0 10px', fontSize: '11.5px', gap: '4px', borderRadius: '7px' }}
                        title="Export Panels Schedule as Excel (.xlsx)"
                      >
                        <Download size={13} /> Excel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          exportPanelsData(filteredPanels, 'csv');
                          setToastMessage({ type: 'success', text: `Phase ${panelPhaseFilter} Panels CSV report downloaded.` });
                        }}
                        className="btn btn-outline"
                        style={{ height: '36px', padding: '0 10px', fontSize: '11.5px', gap: '4px', borderRadius: '7px' }}
                        title="Export Panels Schedule as CSV (.csv)"
                      >
                        CSV
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        setPanelFormPhase(panelPhaseFilter);
                        setCreatePanelModalOpen(true);
                        setPanelFormError(null);
                      }}
                      className="btn btn-primary"
                      style={{ fontSize: '12px', height: '36px', padding: '0 14px', gap: '6px', whiteSpace: 'nowrap', borderRadius: '7px' }}
                    >
                      <Plus size={14} /> Add Single Panel
                    </button>
                  </div>
                </div>
              </div>

              {/* Panels Display Grid */}
              {filteredPanels.length === 0 ? (
                <EmptyStateGraphic
                  type="panels"
                  title={`No Panels Configured for Phase ${panelPhaseFilter}`}
                  description="Click 'Assign Panel' above to configure team ranges, presentation shifts (e.g. 8–10 AM / 12–2 PM), room numbers in AB10, and faculty judges."
                  actionText="Create Phase Panel"
                  actionIcon={<Plus size={14} />}
                  onAction={() => setCreatePanelModalOpen(true)}
                />
              ) : (
                <div className="grid-cols-3">
                  {filteredPanels.map((p: any) => {
                    const pBatches = getPanelBatches(p.team_range_start, p.team_range_end, undefined, p.panel_name);
                    return (
                      <div
                        key={p.id}
                        className="card"
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          padding: '18px 20px',
                          borderRadius: '14px',
                          border: '1px solid var(--color-hairline)',
                          backgroundColor: '#FFFFFF',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                        }}
                      >
                        <div>
                          {/* Top Meta Badges & Actions */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              <span
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  backgroundColor: '#F1F5F9',
                                  color: '#334155',
                                  border: '1px solid #E2E8F0',
                                  letterSpacing: '0.2px',
                                }}
                              >
                                Phase {p.phase_number}
                              </span>
                              <span
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  backgroundColor: '#EFF6FF',
                                  color: '#1D4ED8',
                                  border: '1px solid #DBEAFE',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <Users size={11} />
                                {p.teamsCount || 0} Teams
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <button
                                onClick={() => handleOpenEditPanel(p)}
                                style={{
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '7px',
                                  background: '#EFF6FF',
                                  border: '1px solid #BFDBFE',
                                  cursor: 'pointer',
                                  color: '#2563EB',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'all 0.15s ease',
                                }}
                                title="Edit Panel Details & Judges"
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#2563EB';
                                  e.currentTarget.style.color = '#FFFFFF';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = '#EFF6FF';
                                  e.currentTarget.style.color = '#2563EB';
                                }}
                              >
                                <Pencil size={13} />
                              </button>

                              <button
                                onClick={() => handleDeletePanel(p.id, p.panel_name)}
                                style={{
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '7px',
                                  background: '#FEE2E2',
                                  border: '1px solid #FECACA',
                                  cursor: 'pointer',
                                  color: '#DC2626',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'all 0.15s ease',
                                }}
                                title="Delete Panel"
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#DC2626';
                                  e.currentTarget.style.color = '#FFFFFF';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = '#FEE2E2';
                                  e.currentTarget.style.color = '#DC2626';
                                }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>

                          {/* Panel Title */}
                          <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-ink)', marginBottom: '12px', lineHeight: 1.3 }}>
                            {p.panel_name}
                          </h4>

                          {/* Batch / Team Coverage Chips */}
                          <div style={{ marginBottom: '14px' }}>
                            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-faint)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '5px' }}>
                              Allocated Batches
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                              {pBatches.map((b, idx) => (
                                <div
                                  key={idx}
                                  style={{
                                    fontSize: '11.5px',
                                    fontWeight: 600,
                                    backgroundColor: b.colorBg,
                                    color: b.colorText,
                                    border: `1px solid ${b.colorBorder}`,
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                  }}
                                >
                                  <span>{b.label}</span>
                                  <span style={{ opacity: 0.75, fontSize: '10.5px' }}>({b.count} teams)</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Session Metadata Box */}
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '7px',
                              fontSize: '12px',
                              backgroundColor: '#F8FAFC',
                              padding: '10px 12px',
                              borderRadius: '8px',
                              border: '1px solid #EDF2F7',
                              marginBottom: '14px',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                              <div style={{ width: '22px', height: '22px', borderRadius: '5px', backgroundColor: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <MapPin size={12} color="#2563EB" />
                              </div>
                              <span style={{ color: 'var(--color-text-muted)' }}>
                                Venue: <strong style={{ color: 'var(--color-ink)' }}>Academic Block AB10</strong> ({p.room_number || 'Room TBA'})
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                              <div style={{ width: '22px', height: '22px', borderRadius: '5px', backgroundColor: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Clock size={12} color="#059669" />
                              </div>
                              <span style={{ color: 'var(--color-text-muted)' }}>
                                Shift: <strong style={{ color: 'var(--color-ink)' }}>{p.time_window || 'Batch 1: Morning'}</strong>
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                              <div style={{ width: '22px', height: '22px', borderRadius: '5px', backgroundColor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Calendar size={12} color="#D97706" />
                              </div>
                              <span style={{ color: 'var(--color-text-muted)' }}>
                                Date: <strong style={{ color: 'var(--color-ink)' }}>{p.date || 'TBA'}</strong>
                              </span>
                            </div>
                          </div>

                          {/* Assigned Faculty Section */}
                          {p.judges && p.judges.length > 0 ? (
                            <div>
                              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-faint)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span>Assigned Faculty Judges</span>
                                <span style={{ fontSize: '10.5px', color: 'var(--color-text-muted)' }}>{p.judges.length} Evaluators</span>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                {p.judges.map((j: any) => {
                                  const initials = (j.full_name || 'Faculty')
                                    .split(' ')
                                    .filter(Boolean)
                                    .map((n: string) => n[0])
                                    .slice(0, 2)
                                    .join('')
                                    .toUpperCase();

                                  return (
                                    <div
                                      key={j.id}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '6px 8px',
                                        borderRadius: '7px',
                                        backgroundColor: '#F8FAFC',
                                        border: '1px solid #E2E8F0',
                                      }}
                                    >
                                      <div
                                        style={{
                                          width: '24px',
                                          height: '24px',
                                          borderRadius: '50%',
                                          backgroundColor: '#3B82F6',
                                          color: '#FFFFFF',
                                          fontSize: '10px',
                                          fontWeight: 700,
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          flexShrink: 0,
                                        }}
                                      >
                                        {initials}
                                      </div>
                                      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                          {j.full_name}
                                        </span>
                                        {j.email && (
                                          <a
                                            href={`mailto:${j.email}`}
                                            style={{ fontSize: '10.5px', color: 'var(--color-text-muted)', textDecoration: 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                            title={j.email}
                                          >
                                            {j.email}
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ) : (
                            <div
                              style={{
                                padding: '10px 12px',
                                borderRadius: '8px',
                                backgroundColor: '#FFFBEB',
                                border: '1px solid #FDE68A',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                fontSize: '11.5px',
                                color: '#92400E',
                              }}
                            >
                              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                                <AlertTriangle size={13} color="#D97706" /> No Judges Assigned
                              </span>
                              <button
                                onClick={() => handleOpenEditPanel(p)}
                                style={{
                                  background: '#F59E0B',
                                  color: '#FFFFFF',
                                  border: 'none',
                                  borderRadius: '5px',
                                  padding: '3px 8px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  fontSize: '11px',
                                }}
                              >
                                + Assign Judges
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* =================================================================== */}
        {/* TAB 5: DEFAULTING AUDIT                                             */}
        {/* =================================================================== */}
        {activeTab === 'defaulting' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-danger)' }}>
                  <AlertTriangle size={20} />
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-danger)' }}>
                      Defaulting Teams Audit ({defaultingTeams.length})
                    </h3>
                    <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                      Teams missing designated leaders awaiting student activation at /leader.
                    </p>
                  </div>
                </div>

                {defaultingTeams.length > 0 && (
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        exportDefaultingTeams(defaultingTeams, 'xlsx');
                        setToastMessage({ type: 'success', text: 'Defaulting Teams Excel report downloaded.' });
                      }}
                      className="btn btn-outline"
                      style={{ padding: '6px 12px', fontSize: '12px', gap: '5px', borderRadius: '7px' }}
                    >
                      <Download size={13} /> Export Excel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        exportDefaultingTeams(defaultingTeams, 'csv');
                        setToastMessage({ type: 'success', text: 'Defaulting Teams CSV report downloaded.' });
                      }}
                      className="btn btn-outline"
                      style={{ padding: '6px 12px', fontSize: '12px', gap: '5px', borderRadius: '7px' }}
                    >
                      CSV
                    </button>
                  </div>
                )}
              </div>
            </div>

            {defaultingTeams.length === 0 ? (
              <EmptyStateGraphic
                type="compliance"
                title="Zero Defaulting Teams Detected"
                description="All supervised teams are fully compliant with mandatory submissions and scheduled review milestones."
              />
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
                          {!t.leader_id && !t.leader ? (
                            <span className="badge badge-danger" style={{ fontSize: '9.5px' }}>Leader Missing</span>
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

        {/* =================================================================== */}
        {/* TAB 6: ABSENT & NEXT SHIFT DIRECTORY                                */}
        {/* =================================================================== */}
        {activeTab === 'attendance' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Header / Intro Card */}
            <div className="card" style={{ padding: '20px 24px', borderRadius: '14px', border: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Clock size={18} color="#D97706" />
                    </div>
                    <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--color-ink)' }}>
                      Absent &amp; Early Joining Student Directory
                    </h2>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '6px', margin: 0 }}>
                    Segregate students who could not attend their scheduled defense slot. Reassign students to <strong>Early Joining</strong> or confirm their <strong>Absence</strong> without modifying examination marks.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        exportAbsentAndShiftData(filteredAbsentAndShiftEntries, 'xlsx');
                        setToastMessage({ type: 'success', text: 'Absent & Early Joining Excel roster downloaded.' });
                      }}
                      className="btn btn-outline"
                      style={{ padding: '7px 12px', fontSize: '12px', gap: '5px', borderRadius: '7px' }}
                      title="Export Absent & Early Joining Roster as Excel (.xlsx)"
                    >
                      <Download size={13} /> Excel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        exportAbsentAndShiftData(filteredAbsentAndShiftEntries, 'csv');
                        setToastMessage({ type: 'success', text: 'Absent & Early Joining CSV downloaded.' });
                      }}
                      className="btn btn-outline"
                      style={{ padding: '7px 12px', fontSize: '12px', gap: '5px', borderRadius: '7px' }}
                      title="Export Absent & Early Joining Roster as CSV (.csv)"
                    >
                      CSV
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => loadAdminData()}
                    className="btn btn-outline"
                    style={{ padding: '7px 14px', fontSize: '12.5px', gap: '6px' }}
                  >
                    <RefreshCw size={13} /> Refresh List
                  </button>
                </div>
              </div>

              {/* 3 Metric Stat Cards */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '14px',
                  marginTop: '18px',
                }}
              >
                <div
                  style={{
                    padding: '14px 18px',
                    borderRadius: '12px',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Total Non-Present
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--color-ink)', marginTop: '4px' }}>
                    {absentAndShiftEntries.length}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--color-text-faint)', marginTop: '2px' }}>
                    Across all 3 evaluation phases
                  </div>
                </div>

                <div
                  style={{
                    padding: '14px 18px',
                    borderRadius: '12px',
                    backgroundColor: '#FFFBEB',
                    border: '1.5px solid #FCD34D',
                  }}
                >
                  <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Clock size={13} color="#D97706" /> Moved to Early Joining
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: '#B45309', marginTop: '4px' }}>
                    {earlyJoiningCount}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#92400E', marginTop: '2px' }}>
                    Eligible for rescheduled viva slot
                  </div>
                </div>

                <div
                  style={{
                    padding: '14px 18px',
                    borderRadius: '12px',
                    backgroundColor: '#FEF2F2',
                    border: '1.5px solid #FCA5A5',
                  }}
                >
                  <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#991B1B', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <UserX size={13} color="#DC2626" /> Confirmed Absent
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: '#DC2626', marginTop: '4px' }}>
                    {absentCount}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#991B1B', marginTop: '2px' }}>
                    Absent from scheduled defense
                  </div>
                </div>
              </div>
            </div>

            {/* Filter Deck & Search */}
            <div className="card" style={{ padding: '16px 20px', borderRadius: '14px', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                {/* Status Filter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-muted)', marginRight: '4px' }}>Status:</span>
                  <button
                    type="button"
                    onClick={() => setAttendanceStatusFilter('all')}
                    className={`segmented-pill ${attendanceStatusFilter === 'all' ? 'active' : ''}`}
                    style={{ fontSize: '11.5px', padding: '4px 12px' }}
                  >
                    All ({absentAndShiftEntries.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttendanceStatusFilter('early_joining')}
                    className={`segmented-pill ${attendanceStatusFilter === 'early_joining' ? 'active' : ''}`}
                    style={{ fontSize: '11.5px', padding: '4px 12px' }}
                  >
                    🕒 Early Joining ({earlyJoiningCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttendanceStatusFilter('absent')}
                    className={`segmented-pill ${attendanceStatusFilter === 'absent' ? 'active' : ''}`}
                    style={{ fontSize: '11.5px', padding: '4px 12px' }}
                  >
                    ✕ Absent ({absentCount})
                  </button>
                </div>

                {/* Phase Filter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-muted)', marginRight: '4px' }}>Phase:</span>
                  <button
                    type="button"
                    onClick={() => setAttendancePhaseFilter('all')}
                    className={`segmented-pill ${attendancePhaseFilter === 'all' ? 'active' : ''}`}
                    style={{ fontSize: '11.5px', padding: '4px 10px' }}
                  >
                    All Phases
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttendancePhaseFilter(1)}
                    className={`segmented-pill ${attendancePhaseFilter === 1 ? 'active' : ''}`}
                    style={{ fontSize: '11.5px', padding: '4px 10px' }}
                  >
                    Phase 1
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttendancePhaseFilter(2)}
                    className={`segmented-pill ${attendancePhaseFilter === 2 ? 'active' : ''}`}
                    style={{ fontSize: '11.5px', padding: '4px 10px' }}
                  >
                    Phase 2
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttendancePhaseFilter(3)}
                    className={`segmented-pill ${attendancePhaseFilter === 3 ? 'active' : ''}`}
                    style={{ fontSize: '11.5px', padding: '4px 10px' }}
                  >
                    Phase 3
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div style={{ position: 'relative', width: '100%' }}>
                <Search
                  size={15}
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-faint)' }}
                />
                <input
                  type="text"
                  className="input-field"
                  style={{
                    paddingLeft: '36px',
                    fontSize: '13px',
                    height: '40px',
                    borderRadius: '9px',
                    width: '100%',
                  }}
                  placeholder="Search by student name, roll number, team code, supervisor, or reason note..."
                  value={attendanceSearch}
                  onChange={(e) => setAttendanceSearch(e.target.value)}
                />
                {attendanceSearch && (
                  <button
                    type="button"
                    onClick={() => setAttendanceSearch('')}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-text-faint)',
                      cursor: 'pointer',
                    }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Attendance & Shift Segregation Table */}
            <div className="card" style={{ padding: 0, borderRadius: '14px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
              {filteredAbsentAndShiftEntries.length === 0 ? (
                <EmptyStateGraphic
                  type="attendance"
                  title="No Absent or Re-scheduled Students"
                  description={absentAndShiftEntries.length === 0
                    ? 'All students evaluated by examination panels are present, or evaluations have not yet commenced.'
                    : 'No students match the current phase, attendance filter, or search query.'}
                />
              ) : (
                <div className="data-table-container" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%' }}>
                  <table className="data-table" style={{ width: '100%', minWidth: '850px', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ width: '25%', minWidth: '180px' }}>Student Details</th>
                        <th style={{ width: '22%', minWidth: '160px' }}>Team &amp; Guide</th>
                        <th style={{ width: '12%', minWidth: '95px', textAlign: 'center' }}>Phase</th>
                        <th style={{ width: '18%', minWidth: '150px' }}>Assigned Slot &amp; Room</th>
                        <th style={{ width: '13%', minWidth: '120px', textAlign: 'center' }}>Status</th>
                        <th style={{ width: '10%', minWidth: '110px', textAlign: 'center' }}>Segregate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAbsentAndShiftEntries.map((item, idx) => {
                        const isEarly = item.attendanceStatus === 'early_joining' || item.attendanceStatus === 'next_shift';
                        return (
                          <tr key={`${item.studentId}-${item.phaseNumber}-${idx}`}>
                            {/* Student Details */}
                            <td>
                              <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--color-ink)' }}>
                                {item.studentName}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', flexWrap: 'wrap' }}>
                                <span style={{ fontFamily: 'monospace', fontSize: '11.5px', color: 'var(--color-text-muted)', backgroundColor: '#F1F5F9', padding: '1px 5px', borderRadius: '4px' }}>
                                  {item.rollNo}
                                </span>
                                {item.isLeader && (
                                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#059669' }}>
                                    ● Leader
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Team & Guide */}
                            <td>
                              <div style={{ fontWeight: 600, fontSize: '12.5px', color: 'var(--color-ink)' }}>
                                {item.teamCode}: {item.teamName}
                              </div>
                              <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                                Guide: <strong>{item.supervisor}</strong>
                              </div>
                            </td>

                            {/* Phase */}
                            <td style={{ textAlign: 'center' }}>
                              <span
                                className="badge"
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  backgroundColor: item.phaseNumber === 1 ? '#ECFDF5' : item.phaseNumber === 2 ? '#EFF6FF' : '#F5F3FF',
                                  color: item.phaseNumber === 1 ? '#059669' : item.phaseNumber === 2 ? '#2563EB' : '#7C3AED',
                                  border: `1px solid ${item.phaseNumber === 1 ? '#A7F3D0' : item.phaseNumber === 2 ? '#BFDBFE' : '#DDD6FE'}`,
                                }}
                              >
                                Phase {item.phaseNumber} ({getPhaseMaxMarks(item.phaseNumber)}M)
                              </span>
                            </td>

                            {/* Scheduled Slot & Room */}
                            <td>
                              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-ink)' }}>
                                📍 {item.roomNumber} • {item.panelName}
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                                🕒 {item.timeWindow}
                              </div>
                            </td>

                            {/* Attendance Status */}
                            <td style={{ textAlign: 'center' }}>
                              {isEarly ? (
                                <span
                                  className="badge"
                                  style={{
                                    backgroundColor: '#FEF3C7',
                                    color: '#B45309',
                                    border: '1px solid #FCD34D',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                  }}
                                  title={item.remarks || 'Moved to Early Joining'}
                                >
                                  <Clock size={11} /> Early Joining
                                </span>
                              ) : (
                                <span
                                  className="badge badge-danger"
                                  style={{
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                  }}
                                  title={item.remarks || 'Marked Absent'}
                                >
                                  <UserX size={11} /> Absent
                                </span>
                              )}
                              {item.remarks && (
                                <div
                                  style={{
                                    fontSize: '10.5px',
                                    color: 'var(--color-text-muted)',
                                    marginTop: '4px',
                                    maxWidth: '140px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    margin: '4px auto 0',
                                  }}
                                  title={item.remarks}
                                >
                                  {item.remarks}
                                </div>
                              )}
                            </td>

                            {/* Segregation Action */}
                            <td style={{ textAlign: 'center' }}>
                              {isEarly ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSegregationModalItem({
                                      item,
                                      targetStatus: 'absent',
                                    });
                                    setSegregationCustomRemark('Confirmed absent by admin');
                                  }}
                                  className="btn"
                                  style={{
                                    padding: '5px 10px',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    backgroundColor: '#FFFFFF',
                                    color: '#DC2626',
                                    border: '1px solid #FCA5A5',
                                    borderRadius: '7px',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    transition: 'all 0.15s ease',
                                  }}
                                  title="Change status to Confirmed Absent"
                                >
                                  <UserX size={12} /> Mark Absent
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSegregationModalItem({
                                      item,
                                      targetStatus: 'early_joining',
                                    });
                                    setSegregationCustomRemark('Shifted for early joining rescheduled viva');
                                  }}
                                  className="btn"
                                  style={{
                                    padding: '5px 10px',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    backgroundColor: '#FFFBEB',
                                    color: '#B45309',
                                    border: '1px solid #FCD34D',
                                    borderRadius: '7px',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    transition: 'all 0.15s ease',
                                  }}
                                  title="Shift candidate to Early Joining"
                                >
                                  <Clock size={12} /> Early Joining
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* =================================================================== */}
      {/* MODAL 0: DEFAULTING TEAMS COMPLIANCE AUDIT POP-UP                   */}
      {/* =================================================================== */}
      {defaultingModalOpen && (
        <div
          className="modal-overlay-responsive"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1300,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(5px)',
            WebkitBackdropFilter: 'blur(5px)',
            padding: '32px 16px',
            overflowY: 'auto',
          }}
          onClick={() => setDefaultingModalOpen(false)}
        >
          <div
            className="card animate-scale-in modal-card-responsive"
            style={{
              width: '100%',
              maxWidth: 'min(96vw, 1000px)',
              maxHeight: 'min(92vh, 850px)',
              backgroundColor: '#FFFFFF',
              borderRadius: '18px',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
              border: '1px solid var(--color-border)',
              margin: 'auto 0',
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid var(--color-hairline)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                backgroundColor: '#FEF2F2',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    backgroundColor: '#FEE2E2',
                    color: '#DC2626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#991B1B', margin: 0 }}>
                      Defaulting Teams List ({defaultingTeams.length})
                    </h3>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: '#DC2626',
                        color: '#FFFFFF',
                        padding: '2px 8px',
                        borderRadius: '999px',
                      }}
                    >
                      Action Required
                    </span>
                  </div>
                  <p style={{ fontSize: '12.5px', color: '#7F1D1D', marginTop: '4px', margin: 0 }}>
                    Teams with missing leaders, unapproved problem statements, or pending phase reviews.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDefaultingModalOpen(false)}
                className="btn-icon"
                style={{ borderRadius: '50%', color: '#991B1B', backgroundColor: '#FEE2E2', border: 'none', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Compliance Reason Guide & Summary Metrics */}
            <div style={{ padding: '16px 24px', backgroundColor: '#FFF5F5', borderBottom: '1px solid #FEE2E2', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 300px', padding: '12px 16px', backgroundColor: '#FFFFFF', borderRadius: '10px', border: '1px solid #FECACA' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#991B1B', textTransform: 'uppercase' }}>Missing Team Leaders</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#DC2626', marginTop: '2px' }}>
                  {defaultingTeams.length} <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748B' }}>/ {teams.length} Total Teams</span>
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '4px' }}>
                  Students must claim and elect their leader by visiting <code style={{ backgroundColor: '#F1F5F9', padding: '1px 5px', borderRadius: '3px', color: '#1E293B', fontWeight: 600 }}>/leader</code>.
                </div>
              </div>

              <div style={{ flex: '1 1 300px', padding: '12px 16px', backgroundColor: '#FFFFFF', borderRadius: '10px', border: '1px solid #BBF7D0' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>Elected Leaders Active</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#16A34A', marginTop: '2px' }}>
                  {teams.length - defaultingTeams.length} <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748B' }}>Teams Ready</span>
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '4px' }}>
                  Leaders actively assigned and synchronized across the database.
                </div>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--color-hairline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flex: 1 }}>
                <div style={{ position: 'relative', minWidth: '260px', flex: '1 1 300px' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Search by team code, program, or mentor..."
                    value={defaultingSearch}
                    onChange={(e) => setDefaultingSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '7px 12px 7px 32px',
                      fontSize: '12px',
                      borderRadius: '7px',
                      border: '1px solid var(--color-border)',
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setDefaultingReasonFilter('all')}
                    style={{
                      padding: '5px 12px',
                      fontSize: '11px',
                      fontWeight: 600,
                      borderRadius: '6px',
                      border: '1px solid #DC2626',
                      backgroundColor: '#FEF2F2',
                      color: '#DC2626',
                      cursor: 'pointer',
                    }}
                  >
                    Awaiting Leader ({defaultingTeams.length})
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => {
                    exportDefaultingTeams(defaultingTeams, 'xlsx');
                    setToastMessage({ type: 'success', text: 'Defaulting Teams Excel downloaded.' });
                  }}
                  className="btn btn-outline"
                  style={{ padding: '5px 10px', fontSize: '11px', gap: '4px', borderRadius: '6px' }}
                >
                  <Download size={12} /> Excel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    exportDefaultingTeams(defaultingTeams, 'csv');
                    setToastMessage({ type: 'success', text: 'Defaulting Teams CSV downloaded.' });
                  }}
                  className="btn btn-outline"
                  style={{ padding: '5px 10px', fontSize: '11px', gap: '4px', borderRadius: '6px' }}
                >
                  CSV
                </button>
              </div>
            </div>

            {/* Team Rows List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(() => {
                const filtered = defaultingTeams.filter((t: any) => {
                  const q = defaultingSearch.toLowerCase().trim();
                  const matchesSearch =
                    !q ||
                    (t.team_name && t.team_name.toLowerCase().includes(q)) ||
                    (t.team_code && t.team_code.toLowerCase().includes(q)) ||
                    (t.program && t.program.toLowerCase().includes(q)) ||
                    (t.supervisor?.name && t.supervisor.name.toLowerCase().includes(q));

                  return matchesSearch;
                });

                if (filtered.length === 0) {
                  return (
                    <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                      <AlertTriangle size={32} color="#CBD5E1" style={{ margin: '0 auto 10px' }} />
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-ink)' }}>No Teams Match Search</div>
                      <div style={{ fontSize: '12px', marginTop: '4px' }}>Try clearing your search query.</div>
                    </div>
                  );
                }

                return filtered.map((t: any) => {
                  const hasLeader = Boolean(t.leader || t.leader_id);

                  return (
                    <div
                      key={t.id}
                      style={{
                        padding: '14px 16px',
                        borderRadius: '10px',
                        border: '1px solid #F1F5F9',
                        backgroundColor: '#FFFFFF',
                        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '12px',
                        transition: 'all 0.15s ease',
                      }}
                      className="hover-card"
                    >
                      <div style={{ minWidth: '220px', flex: '1 1 240px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-ink)' }}>{t.team_name}</span>
                          <span style={{ fontSize: '10.5px', fontWeight: 600, padding: '1px 6px', borderRadius: '4px', backgroundColor: '#EFF6FF', color: '#1D4ED8' }}>
                            {t.program || 'BCA'}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                            ({t.studentCount || t.students?.length || 0} Members)
                          </span>
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', marginTop: '3px' }}>
                          Mentor: <strong style={{ color: 'var(--color-ink)' }}>{t.supervisor?.name || 'Unassigned'}</strong>
                          {t.supervisor?.phone && <span style={{ marginLeft: '6px' }}>• {t.supervisor.phone}</span>}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', flex: '1 1 200px' }}>
                        {!hasLeader && (
                          <span style={{ fontSize: '10.5px', fontWeight: 700, padding: '3px 10px', borderRadius: '5px', backgroundColor: '#FEE2E2', color: '#991B1B', border: '1px solid #FECACA' }}>
                            Leader Not Elected at /leader
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTeamModal(t);
                            setDefaultingModalOpen(false);
                          }}
                          className="btn btn-outline"
                          style={{
                            padding: '6px 12px',
                            fontSize: '11px',
                            fontWeight: 700,
                            borderRadius: '7px',
                            backgroundColor: '#FFFFFF',
                            color: '#2563EB',
                            borderColor: '#BFDBFE',
                            cursor: 'pointer',
                          }}
                        >
                          Inspect Team →
                        </button>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Footer */}
            <div
              style={{
                padding: '14px 24px',
                borderTop: '1px solid var(--color-hairline)',
                backgroundColor: '#F8FAFC',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                Showing <strong>{defaultingTeams.length}</strong> total defaulting teams needing compliance follow-up.
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('defaulting');
                    setDefaultingModalOpen(false);
                  }}
                  className="btn btn-primary"
                  style={{ padding: '7px 16px', fontSize: '12px', borderRadius: '7px' }}
                >
                  Open Full Audit Management Tab →
                </button>
                <button
                  type="button"
                  onClick={() => setDefaultingModalOpen(false)}
                  className="btn btn-outline"
                  style={{ padding: '7px 14px', fontSize: '12px', borderRadius: '7px' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
            justifyContent: 'flex-start',
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(5px)',
            WebkitBackdropFilter: 'blur(5px)',
            padding: '32px 16px',
            overflowY: 'auto',
          }}
          onClick={() => setCreatePanelModalOpen(false)}
        >
          <div
            className="card animate-scale-in modal-card-responsive"
            style={{
              width: '100%',
              maxWidth: 'min(96vw, 1120px)',
              maxHeight: 'min(92vh, 880px)',
              backgroundColor: '#FFFFFF',
              borderRadius: '18px',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
              border: '1px solid var(--color-border)',
              margin: 'auto 0',
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Pinned Modal Header */}
            <div
              className="modal-header-responsive"
              style={{
                padding: '18px 24px',
                borderBottom: '1px solid var(--color-hairline)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                backgroundColor: '#FFFFFF',
                flexShrink: 0,
              }}
            >
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-ink)', margin: 0 }}>
                  {editingPanel ? (
                    <>
                      <Pencil size={18} color="#2563EB" /> Edit Panel #{editingPanel.panel_number}: {editingPanel.panel_name}
                    </>
                  ) : (
                    <>
                      <PlusCircle size={18} color="#2563EB" /> Add Evaluation Panel (Phase {panelFormPhase})
                    </>
                  )}
                </h3>
                <p style={{ fontSize: '12.5px', color: 'var(--color-text-muted)', marginTop: '3px', marginBottom: 0 }}>
                  {editingPanel
                    ? 'Reassign faculty judges, modify presentation shifts, update dates or room allotments with live conflict checks.'
                    : 'Assign team batches, schedule presentation shifts, allocate rooms, and appoint conflict-free faculty judges.'}
                </p>
              </div>
              <button
                onClick={() => {
                  setCreatePanelModalOpen(false);
                  setEditingPanel(null);
                }}
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

            {/* Scrollable 2-Column Responsive Form Body */}
            <form onSubmit={handleCreateVisualPanel} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <div
                className="modal-body-responsive"
                style={{
                  padding: '20px 24px',
                  overflowY: 'auto',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                {panelFormError && (
                  <div className="alert-banner alert-danger" style={{ fontSize: '13px' }}>
                    {panelFormError}
                  </div>
                )}

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                    gap: '20px',
                    alignItems: 'start',
                  }}
                >
                  {/* ========================================================= */}
                  {/* LEFT COLUMN: PHASE, PANEL IDENTITY & TEAM BATCH ALLOTMENT */}
                  {/* ========================================================= */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Phase Selection & Panel Number Header */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '14px 16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label className="input-label" style={{ fontSize: '12.5px', fontWeight: 800, margin: 0, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Layers size={15} color="#2563EB" /> 1. Evaluation Phase &amp; Identity
                        </label>
                        <span className="badge badge-brand" style={{ fontSize: '10.5px', fontWeight: 700 }}>
                          Phase {panelFormPhase} Active
                        </span>
                      </div>

                      {/* Phase Selection Tabs */}
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '5px' }}>
                          Select Phase:
                        </div>
                        <div style={{ display: 'flex', gap: '4px', backgroundColor: '#E2E8F0', padding: '3px', borderRadius: '8px' }}>
                          {([1, 2, 3] as const).map((pNum) => {
                            const isCur = panelFormPhase === pNum;
                            const phaseCount = (panels || []).filter((p: any) => p.phase_number === pNum).length;
                            return (
                              <button
                                key={pNum}
                                type="button"
                                onClick={() => {
                                  setPanelFormPhase(pNum);
                                  const phasePanels = (panels || []).filter((p: any) => p.phase_number === pNum);
                                  const nextNum = phasePanels.reduce((max: number, p: any) => Math.max(max, p.panel_number || 0), 0) + 1;
                                  setPanelFormNumber(nextNum);
                                }}
                                style={{
                                  flex: 1,
                                  padding: '6px 8px',
                                  fontSize: '11.5px',
                                  fontWeight: isCur ? 700 : 500,
                                  backgroundColor: isCur ? '#2563EB' : 'transparent',
                                  color: isCur ? '#FFFFFF' : '#475569',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease',
                                  textAlign: 'center',
                                  boxShadow: isCur ? '0 1px 3px rgba(37,99,235,0.3)' : 'none',
                                }}
                              >
                                Phase {pNum} <span style={{ fontSize: '10px', opacity: isCur ? 0.9 : 0.7 }}>({phaseCount})</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Panel Number and Optional Name */}
                      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '10px' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <label className="input-label" style={{ fontSize: '11px', fontWeight: 700, margin: 0, color: '#0F172A' }}>
                              Panel #
                            </label>
                            <span style={{ fontSize: '9.5px', color: '#2563EB', fontWeight: 600 }}>Next: #{nextSequentialPanelNumber}</span>
                          </div>
                          <input
                            type="number"
                            min={1}
                            className="input-field"
                            style={{ height: '36px', fontSize: '12.5px', fontWeight: 700 }}
                            placeholder={`#${nextSequentialPanelNumber}`}
                            value={panelFormNumber}
                            onChange={(e) => setPanelFormNumber(e.target.value === '' ? '' : Number(e.target.value))}
                          />
                        </div>
                        <div>
                          <label className="input-label" style={{ fontSize: '11px', fontWeight: 700, marginBottom: '4px', color: '#0F172A' }}>
                            Panel Label (Optional)
                          </label>
                          <input
                            type="text"
                            className="input-field"
                            style={{ height: '36px', fontSize: '12px' }}
                            placeholder={`Panel ${panelFormNumber || nextSequentialPanelNumber} (${getFormattedTeamRange(panelFormRangeStart, panelFormRangeEnd, panelFormProgram)})`}
                            value={panelFormName}
                            onChange={(e) => setPanelFormName(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Team Range & Batch Allotment */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '14px 16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label className="input-label" style={{ fontSize: '12.5px', fontWeight: 800, margin: 0, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Users size={15} color="#2563EB" /> 2. Assign Teams / Batch
                        </label>
                        <span className="badge badge-neutral" style={{ fontSize: '11px', fontWeight: 700 }}>
                          {selectedRangeTeams.length} Teams ({selectedRangeStudentCount} Students)
                        </span>
                      </div>

                      {/* Program Stream Selector */}
                      <div style={{ display: 'flex', gap: '6px', backgroundColor: '#F1F5F9', padding: '3px', borderRadius: '8px' }}>
                        <button
                          type="button"
                          onClick={() => setPanelFormProgram('all')}
                          style={{
                            flex: 1,
                            padding: '6px 8px',
                            fontSize: '11px',
                            fontWeight: panelFormProgram === 'all' ? 700 : 500,
                            backgroundColor: panelFormProgram === 'all' ? '#FFFFFF' : 'transparent',
                            color: panelFormProgram === 'all' ? '#2563EB' : 'var(--color-text-muted)',
                            border: 'none',
                            borderRadius: '6px',
                            boxShadow: panelFormProgram === 'all' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          All ({teams.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPanelFormProgram('BCA');
                            if (bcaTeams.length > 0 && panelFormRangeStart > (bcaTeams[bcaTeams.length - 1]?.team_number || 102)) {
                              setPanelFormRangeStart(bcaTeams[0].team_number);
                              setPanelFormRangeEnd(Math.min(bcaTeams[0].team_number + 9, bcaTeams[bcaTeams.length - 1].team_number));
                            }
                          }}
                          style={{
                            flex: 1,
                            padding: '6px 8px',
                            fontSize: '11px',
                            fontWeight: panelFormProgram === 'BCA' ? 700 : 500,
                            backgroundColor: panelFormProgram === 'BCA' ? '#FFFFFF' : 'transparent',
                            color: panelFormProgram === 'BCA' ? '#2563EB' : 'var(--color-text-muted)',
                            border: 'none',
                            borderRadius: '6px',
                            boxShadow: panelFormProgram === 'BCA' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          BCA Core ({bcaTeams.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPanelFormProgram('BCA - DS');
                            if (dsTeams.length > 0 && (panelFormRangeStart < dsTeams[0].team_number || panelFormRangeStart > dsTeams[dsTeams.length - 1].team_number)) {
                              setPanelFormRangeStart(dsTeams[0].team_number);
                              setPanelFormRangeEnd(Math.min(dsTeams[0].team_number + 9, dsTeams[dsTeams.length - 1].team_number));
                            }
                          }}
                          style={{
                            flex: 1,
                            padding: '6px 8px',
                            fontSize: '11px',
                            fontWeight: panelFormProgram === 'BCA - DS' ? 700 : 500,
                            backgroundColor: panelFormProgram === 'BCA - DS' ? '#FFFFFF' : 'transparent',
                            color: panelFormProgram === 'BCA - DS' ? '#2563EB' : 'var(--color-text-muted)',
                            border: 'none',
                            borderRadius: '6px',
                            boxShadow: panelFormProgram === 'BCA - DS' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          BCA DS ({dsTeams.length})
                        </button>
                      </div>

                      {/* Section Distribution Batch Presets */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: '#334155' }}>
                            ⚡ Section Distribution Batches:
                          </div>
                          <span style={{ fontSize: '9.5px', color: 'var(--color-text-muted)' }}>
                            Click a section to auto-fill range
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', maxHeight: '115px', overflowY: 'auto', paddingRight: '2px' }}>
                          {(panelFormProgram === 'BCA - DS' ? dsPresets : panelFormProgram === 'BCA' ? bcaPresets : [...bcaPresets, ...dsPresets]).map((preset, idx) => {
                            const isSelected = panelFormRangeStart === preset.startNum && panelFormRangeEnd === preset.endNum;
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  setPanelFormRangeStart(preset.startNum);
                                  setPanelFormRangeEnd(preset.endNum);
                                  if (preset.program) {
                                    setPanelFormProgram(preset.program as any);
                                  }
                                  if (!panelFormName || panelFormName.startsWith('Panel ')) {
                                    setPanelFormName(`Panel ${panelFormNumber || nextSequentialPanelNumber} (${preset.shortLabel || preset.sectionName})`);
                                  }
                                }}
                                style={{
                                  padding: '5px 9px',
                                  fontSize: '10.5px',
                                  fontWeight: isSelected ? 700 : 500,
                                  backgroundColor: isSelected ? '#2563EB' : '#FFFFFF',
                                  color: isSelected ? '#FFFFFF' : '#1E293B',
                                  border: isSelected ? '1.5px solid #2563EB' : '1px solid #CBD5E1',
                                  borderRadius: '7px',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  boxShadow: isSelected ? '0 2px 4px rgba(37,99,235,0.2)' : 'none',
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                <span>{preset.label}</span>
                                <span style={{
                                  fontSize: '9px',
                                  fontWeight: 700,
                                  padding: '1px 5px',
                                  borderRadius: '4px',
                                  backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : '#F1F5F9',
                                  color: isSelected ? '#FFFFFF' : '#64748B'
                                }}>
                                  {preset.count} teams
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Dropdown Selectors for Custom Team Code Start & End */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                          <label className="input-label" style={{ fontSize: '11px', fontWeight: 600, marginBottom: '3px' }}>
                            Start Team (From)
                          </label>
                          <select
                            className="input-field"
                            style={{ fontSize: '11.5px', height: '36px' }}
                            value={panelFormRangeStart}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setPanelFormRangeStart(val);
                              if (val > panelFormRangeEnd) {
                                setPanelFormRangeEnd(val);
                              }
                            }}
                          >
                            {(panelFormProgram === 'BCA' ? bcaTeams : panelFormProgram === 'BCA - DS' ? dsTeams : teams).map((t: any) => (
                              <option key={t.id} value={t.team_number}>
                                {t.team_code} — {t.team_name ? (t.team_name.length > 20 ? t.team_name.slice(0, 20) + '...' : t.team_name) : `Team #${t.team_number}`}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="input-label" style={{ fontSize: '11px', fontWeight: 600, marginBottom: '3px' }}>
                            End Team (To)
                          </label>
                          <select
                            className="input-field"
                            style={{ fontSize: '11.5px', height: '36px' }}
                            value={panelFormRangeEnd}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setPanelFormRangeEnd(val);
                              if (val < panelFormRangeStart) {
                                setPanelFormRangeStart(val);
                              }
                            }}
                          >
                            {(panelFormProgram === 'BCA' ? bcaTeams : panelFormProgram === 'BCA - DS' ? dsTeams : teams).map((t: any) => (
                              <option key={t.id} value={t.team_number}>
                                {t.team_code} — {t.team_name ? (t.team_name.length > 20 ? t.team_name.slice(0, 20) + '...' : t.team_name) : `Team #${t.team_number}`}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Selected Range Live Badge Display & Judge Conflict Warnings */}
                      <div style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '10px', padding: '10px 12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#1E40AF', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>Selected Batch:</span>
                            <span style={{ backgroundColor: '#DBEAFE', padding: '2px 8px', borderRadius: '4px', border: '1px solid #93C5FD' }}>
                              {getFormattedTeamRange(panelFormRangeStart, panelFormRangeEnd, panelFormProgram)}
                            </span>
                          </div>
                          <div style={{ fontSize: '10.5px', color: '#3B82F6', fontWeight: 600 }}>
                            {selectedRangeTeams.length} Teams • {selectedRangeStudentCount} Students
                          </div>
                        </div>

                        {/* Preview of team code pills */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxHeight: '54px', overflowY: 'auto' }}>
                          {selectedRangeTeams.map((t: any) => (
                            <span
                              key={t.id}
                              style={{
                                fontSize: '10px',
                                fontWeight: 600,
                                padding: '2px 6px',
                                borderRadius: '4px',
                                backgroundColor: '#FFFFFF',
                                border: '1px solid #CBD5E1',
                                color: '#334155',
                              }}
                              title={`${t.team_code}: ${t.team_name || 'No Title'} (Guide: ${t.supervisor?.full_name || 'Unassigned'})`}
                            >
                              {t.team_code}
                            </span>
                          ))}
                        </div>

                        {/* Judge Guide / Mentor Informational Note */}
                        {panelJudgeConflicts.length > 0 && (
                          <div style={{ marginTop: '8px', padding: '6px 10px', borderRadius: '8px', backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', fontSize: '11px', color: '#1E40AF', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '13px' }}>ℹ️</span>
                            <span><strong>Mentor Notice:</strong> {panelJudgeConflicts.map(c => `${c.judgeName} mentors ${c.teamCode}`).join(', ')} (assigned to evaluate this panel).</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ========================================================= */}
                  {/* RIGHT COLUMN: SHIFTS, VENUE/ROOM & FACULTY JUDGES         */}
                  {/* ========================================================= */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Presentation Shift & Time Window */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '14px 16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                        <label className="input-label" style={{ fontSize: '12.5px', fontWeight: 800, margin: 0, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Clock size={15} color="#2563EB" /> 3. Presentation Shift &amp; Timing
                        </label>
                        <button
                          type="button"
                          onClick={() => setManageShiftsModalOpen(true)}
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            border: '1px solid #CBD5E1',
                            backgroundColor: '#FFFFFF',
                            color: '#334155',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                          }}
                        >
                          <Settings size={12} /> Manage Shifts
                        </button>
                      </div>

                      {/* Preset Shift Cards */}
                      {SHIFT_PRESETS.length > 0 && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '6px' }}>
                          {SHIFT_PRESETS.map((shift, idx) => {
                            const isSelected = panelFormShift === shift.timeWindow;
                            const panelsInThisShift = (panels || []).filter((p: any) =>
                              p.phase_number === panelFormPhase &&
                              (p.time_window || '').toLowerCase().includes(shift.label.slice(0, 7).toLowerCase())
                            ).length;

                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setPanelFormShift(shift.timeWindow)}
                                style={{
                                  padding: '8px 10px',
                                  borderRadius: '8px',
                                  border: `1.5px solid ${isSelected ? shift.color : '#E2E8F0'}`,
                                  backgroundColor: isSelected ? shift.colorBg : '#FFFFFF',
                                  textAlign: 'left',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '2px',
                                  transition: 'all 0.15s ease',
                                  boxShadow: isSelected ? `0 2px 6px ${shift.color}25` : 'none',
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: '11px', fontWeight: 700, color: isSelected ? shift.color : '#1E293B' }}>
                                    {shift.label}
                                  </span>
                                  <span style={{ fontSize: '9px', fontWeight: 700, color: isSelected ? shift.color : '#64748B' }}>
                                    {panelsInThisShift > 0 ? `${panelsInThisShift}p` : '0p'}
                                  </span>
                                </div>
                                <div style={{ fontSize: '9.5px', color: isSelected ? shift.color : '#64748B', opacity: 0.9 }}>
                                  {shift.timeShort}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Dropdown Selector for Shift / Time Slot */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '0 10px', height: '36px' }}>
                        <Clock size={14} color="#64748B" style={{ flexShrink: 0 }} />
                        <select
                          style={{
                            border: 'none',
                            backgroundColor: 'transparent',
                            fontSize: '11.5px',
                            fontWeight: 600,
                            color: '#0F172A',
                            outline: 'none',
                            cursor: 'pointer',
                            width: '100%',
                            height: '100%',
                            padding: '0',
                          }}
                          value={panelFormShift}
                          onChange={(e) => setPanelFormShift(e.target.value)}
                        >
                          {SHIFT_PRESETS.length > 0 && (
                            <optgroup label="Active Presentation Shifts">
                              {SHIFT_PRESETS.map((s: any) => (
                                <option key={s.id || s.label} value={s.timeWindow}>
                                  {s.label} ({s.timeShort})
                                </option>
                              ))}
                            </optgroup>
                          )}
                          <optgroup label="Standard Time Slots">
                            {SHIFT_TEMPLATES.map((tmpl) => {
                              const val = `Batch: ${tmpl.label} (${tmpl.startTime} - ${tmpl.endTime})`;
                              return (
                                <option key={tmpl.label} value={val}>
                                  {tmpl.label} ({tmpl.startTime} - {tmpl.endTime})
                                </option>
                              );
                            })}
                          </optgroup>
                        </select>
                      </div>
                    </div>

                    {/* Venue & Available Room Allotment */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '14px 16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <label className="input-label" style={{ fontSize: '12.5px', fontWeight: 800, margin: 0, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Building size={15} color="#2563EB" /> 4. Presentation Venue &amp; Date
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={handleAutoAllotRoom}
                            disabled={!firstAvailableRoom}
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '4px 9px',
                              borderRadius: '6px',
                              backgroundColor: firstAvailableRoom ? '#2563EB' : '#94A3B8',
                              color: '#FFFFFF',
                              border: 'none',
                              cursor: firstAvailableRoom ? 'pointer' : 'not-allowed',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Zap size={12} /> Auto-Allot ({firstAvailableRoom || 'None'})
                          </button>
                          <button
                            type="button"
                            onClick={() => setManageRoomsModalOpen(true)}
                            style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              padding: '4px 8px',
                              borderRadius: '6px',
                              backgroundColor: '#FFFFFF',
                              color: '#334155',
                              border: '1px solid #CBD5E1',
                              cursor: 'pointer',
                            }}
                          >
                            <Settings size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Venue & Date Pickers Row */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '4px 10px', height: '34px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Building size={12} color="#64748B" /> Venue:
                          </span>
                          <input
                            type="text"
                            placeholder="e.g. Academic Block AB10"
                            style={{ border: 'none', background: 'transparent', fontSize: '11.5px', fontWeight: 600, color: '#0F172A', outline: 'none', width: '100%' }}
                            value={panelFormVenue}
                            onChange={(e) => setPanelFormVenue(e.target.value)}
                            required
                          />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '4px 10px', height: '34px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={12} color="#64748B" /> Date:
                          </span>
                          <input
                            type="date"
                            style={{ border: 'none', background: 'transparent', fontSize: '11.5px', fontWeight: 600, color: '#0F172A', outline: 'none', cursor: 'pointer', width: '100%' }}
                            value={panelFormDate}
                            onChange={(e) => setPanelFormDate(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      {/* Room Selector Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(Math.max(ALL_DISPLAY_ROOMS.length, 1), 4)}, 1fr)`, gap: '6px' }}>
                        {ALL_DISPLAY_ROOMS.map((room) => {
                          const occ = roomOccupancyMap[room];
                          const isSelected = panelFormRoom === room;
                          const isVacant = occ?.isAvailable;

                          return (
                            <button
                              key={room}
                              type="button"
                              onClick={() => setPanelFormRoom(room)}
                              style={{
                                padding: '8px',
                                borderRadius: '8px',
                                border: `1.5px solid ${isSelected ? '#2563EB' : isVacant ? '#CBD5E1' : '#FECACA'}`,
                                backgroundColor: isSelected ? '#EFF6FF' : isVacant ? '#FFFFFF' : '#FFF1F2',
                                textAlign: 'left',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '3px',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '11.5px', fontWeight: 700, color: isSelected ? '#1D4ED8' : isVacant ? '#1E293B' : '#991B1B' }}>
                                  {room}
                                </span>
                                {isSelected && (
                                  <span style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: '#2563EB', color: '#FFFFFF', fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                                    ✓
                                  </span>
                                )}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: isVacant ? '#16A34A' : '#DC2626', display: 'inline-block' }} />
                                <span style={{ fontSize: '9.5px', fontWeight: 700, color: isVacant ? '#15803D' : '#991B1B' }}>
                                  {isVacant ? 'Available' : 'In Use'}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Room Occupancy Warning */}
                      {occupyingPanelForSelected && (
                        <div style={{ padding: '6px 10px', borderRadius: '6px', backgroundColor: '#FFF1F2', border: '1px solid #FECACA', fontSize: '10.5px', color: '#991B1B', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                          <span>⚠️ <strong>Occupied:</strong> {panelFormRoom} is booked by {occupyingPanelForSelected.panel_name || `Panel #${occupyingPanelForSelected.panel_number}`}.</span>
                          {firstAvailableRoom && firstAvailableRoom !== panelFormRoom && (
                            <button
                              type="button"
                              onClick={handleAutoAllotRoom}
                              style={{ fontSize: '10.5px', color: '#2563EB', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 700, textDecoration: 'underline' }}
                            >
                              Use {firstAvailableRoom}
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Faculty Judges Assignment Deck */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '14px 16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label className="input-label" style={{ fontSize: '12.5px', fontWeight: 800, margin: 0, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Award size={15} color="#2563EB" /> 5. Appoint Faculty Judges
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="badge badge-brand" style={{ fontSize: '10.5px', fontWeight: 700 }}>
                            {panelFormSelectedJudges.length} Selected
                          </span>
                          {panelFormSelectedJudges.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setPanelFormSelectedJudges([])}
                              style={{ fontSize: '10.5px', color: '#DC2626', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Faculty Availability Filter Pills & Search */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', gap: '4px', backgroundColor: '#F1F5F9', padding: '2px', borderRadius: '6px' }}>
                          <button
                            type="button"
                            onClick={() => setFacultyAvailabilityFilter('all')}
                            style={{
                              flex: 1,
                              padding: '4px 6px',
                              fontSize: '10.5px',
                              fontWeight: facultyAvailabilityFilter === 'all' ? 700 : 500,
                              backgroundColor: facultyAvailabilityFilter === 'all' ? '#FFFFFF' : 'transparent',
                              color: facultyAvailabilityFilter === 'all' ? '#2563EB' : 'var(--color-text-muted)',
                              border: 'none',
                              borderRadius: '5px',
                              boxShadow: facultyAvailabilityFilter === 'all' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                              cursor: 'pointer',
                            }}
                          >
                            All ({supervisors.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setFacultyAvailabilityFilter('available')}
                            style={{
                              flex: 1,
                              padding: '4px 6px',
                              fontSize: '10.5px',
                              fontWeight: facultyAvailabilityFilter === 'available' ? 700 : 500,
                              backgroundColor: facultyAvailabilityFilter === 'available' ? '#FFFFFF' : 'transparent',
                              color: facultyAvailabilityFilter === 'available' ? '#059669' : 'var(--color-text-muted)',
                              border: 'none',
                              borderRadius: '5px',
                              boxShadow: facultyAvailabilityFilter === 'available' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                              cursor: 'pointer',
                            }}
                          >
                            🟢 Available ({facultyAvailabilityStats.availableCount})
                          </button>
                          <button
                            type="button"
                            onClick={() => setFacultyAvailabilityFilter('busy')}
                            style={{
                              flex: 1,
                              padding: '4px 6px',
                              fontSize: '10.5px',
                              fontWeight: facultyAvailabilityFilter === 'busy' ? 700 : 500,
                              backgroundColor: facultyAvailabilityFilter === 'busy' ? '#FFFFFF' : 'transparent',
                              color: facultyAvailabilityFilter === 'busy' ? '#D97706' : 'var(--color-text-muted)',
                              border: 'none',
                              borderRadius: '5px',
                              boxShadow: facultyAvailabilityFilter === 'busy' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                              cursor: 'pointer',
                            }}
                          >
                            🟡 Busy ({facultyAvailabilityStats.busyCount})
                          </button>
                        </div>

                        {/* Search Bar */}
                        <div className="search-input-wrapper" style={{ width: '100%' }}>
                          <input
                            type="text"
                            className="input-field"
                            style={{ height: '32px', fontSize: '11.5px' }}
                            placeholder="Search faculty name, email, or cabin..."
                            value={judgeSearchQuery}
                            onChange={(e) => setJudgeSearchQuery(e.target.value)}
                          />
                          <div className="search-icon">
                            <Search size={12} />
                          </div>
                        </div>
                      </div>

                      {/* Scrollable Faculty Checklist */}
                      <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid var(--color-hairline)', borderRadius: '8px', padding: '4px', display: 'flex', flexDirection: 'column', gap: '3px', backgroundColor: '#FAFAFA' }}>
                        {supervisors
                          .filter((s: any) => {
                            const availability = getFacultyAvailability(s.id);
                            if (facultyAvailabilityFilter === 'available' && !availability.isAvailable) return false;
                            if (facultyAvailabilityFilter === 'busy' && availability.isAvailable) return false;

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
                            const availability = getFacultyAvailability(s.id);
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
                                  fontSize: '11.5px',
                                  transition: 'all 0.12s ease',
                                  gap: '6px',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1 }}>
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
                                    style={{ accentColor: '#2563EB', cursor: 'pointer', flexShrink: 0 }}
                                  />
                                  <div style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    <span style={{ fontWeight: 700, color: 'var(--color-ink)' }}>{s.name}</span>
                                    {s.cabin && (
                                      <span style={{ color: '#64748B', fontSize: '10px', marginLeft: '4px' }}>
                                        ({s.cabin})
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                                  {availability.conflictTeam && (
                                    <span style={{ fontSize: '9.5px', fontWeight: 700, padding: '1px 6px', borderRadius: '6px', backgroundColor: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
                                      👑 Mentors {availability.conflictTeam.team_code}
                                    </span>
                                  )}
                                  {availability.isAvailable ? (
                                    <span style={{ fontSize: '9.5px', fontWeight: 600, padding: '1px 5px', borderRadius: '6px', backgroundColor: '#DEF7EC', color: '#03543F' }}>
                                      🟢 Free
                                    </span>
                                  ) : (
                                    <span style={{ fontSize: '9.5px', fontWeight: 600, padding: '1px 5px', borderRadius: '6px', backgroundColor: '#FEF3C7', color: '#92400E' }}>
                                      🟡 In {availability.assignedInThisShift?.panel_name || availability.assignedPanels[0]?.panel_name || 'Panel'}
                                    </span>
                                  )}
                                </div>
                              </label>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pinned Modal Footer with Live Summary Indicator */}
              <div
                className="modal-footer-responsive"
                style={{
                  padding: '14px 24px',
                  borderTop: '1px solid var(--color-hairline)',
                  backgroundColor: '#FFFFFF',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                  flexShrink: 0,
                }}
              >
                {/* Live Panel Configuration Badges */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span className="badge badge-brand" style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px' }}>
                    Phase {panelFormPhase}
                  </span>
                  <span className="badge badge-neutral" style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px' }}>
                    Panel #{panelFormNumber || nextSequentialPanelNumber}
                  </span>
                  <span className="badge badge-success" style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px' }}>
                    {selectedRangeTeams.length} Teams ({selectedRangeStudentCount} Students)
                  </span>
                  <span className="badge" style={{ backgroundColor: '#F1F5F9', color: '#334155', border: '1px solid #CBD5E1', fontSize: '11px', fontWeight: 700, padding: '3px 8px' }}>
                    📍 {panelFormRoom}
                  </span>
                  <span className="badge" style={{ backgroundColor: panelFormSelectedJudges.length > 0 ? '#EFF6FF' : '#FEF2F2', color: panelFormSelectedJudges.length > 0 ? '#1D4ED8' : '#DC2626', border: panelFormSelectedJudges.length > 0 ? '1px solid #BFDBFE' : '1px solid #FCA5A5', fontSize: '11px', fontWeight: 700, padding: '3px 8px' }}>
                    👨‍🏫 {panelFormSelectedJudges.length} Judges
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => {
                      setCreatePanelModalOpen(false);
                      setEditingPanel(null);
                    }}
                    style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 600 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={panelFormLoading || panelFormSelectedJudges.length === 0}
                    style={{
                      padding: '8px 20px',
                      fontSize: '13px',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'linear-gradient(135deg, #1E40AF 0%, #2563EB 100%)',
                      boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
                    }}
                  >
                    {panelFormLoading ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" /> Saving Panel to Database...
                      </>
                    ) : editingPanel ? (
                      <>
                        <Check size={14} /> Update Panel #{editingPanel.panel_number}
                      </>
                    ) : (
                      <>
                        <Plus size={14} /> Create Panel for Phase {panelFormPhase}
                      </>
                    )}
                  </button>
                </div>
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
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              backdropFilter: 'blur(5px)',
              WebkitBackdropFilter: 'blur(5px)',
              padding: '32px 16px',
              overflowY: 'auto',
            }}
            onClick={() => setJsonModalOpen(false)}
          >
            <div
              className="card animate-scale-in modal-card-responsive"
              style={{
                width: '100%',
                maxWidth: '860px',
                margin: 'auto 0',
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
                          min="08:00"
                          max="18:00"
                          step="900"
                          className="input-field"
                          style={{ height: '32px', fontSize: '12px', fontWeight: 600, padding: '2px 6px' }}
                          value={shift1StartTime}
                          onChange={(e) => setShift1StartTime(e.target.value)}
                          required
                        />
                        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>to</span>
                        <input
                          type="time"
                          min="08:00"
                          max="18:00"
                          step="900"
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
                          min="08:00"
                          max="18:00"
                          step="900"
                          className="input-field"
                          style={{ height: '32px', fontSize: '12px', fontWeight: 600, padding: '2px 6px' }}
                          value={shift2StartTime}
                          onChange={(e) => setShift2StartTime(e.target.value)}
                          required
                        />
                        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>to</span>
                        <input
                          type="time"
                          min="08:00"
                          max="18:00"
                          step="900"
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
            justifyContent: 'flex-start',
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(5px)',
            WebkitBackdropFilter: 'blur(5px)',
            padding: '32px 16px',
            overflowY: 'auto',
          }}
          onClick={() => setSelectedTeamModal(null)}
        >
          <div
            className="card animate-scale-in modal-card-responsive"
            style={{
              width: '100%',
              maxWidth: '880px',
              maxHeight: 'min(90vh, 760px)',
              display: 'flex',
              flexDirection: 'column',
              padding: 0,
              borderRadius: '16px',
              backgroundColor: '#FFFFFF',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
              border: '1px solid var(--color-border)',
              margin: 'auto 0',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Pinned Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', backgroundColor: '#FFFFFF', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
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
                  <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-ink)', letterSpacing: '-0.02em', margin: '0 0 8px 0', lineHeight: 1.25 }}>
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
            </div>

            {/* Scrollable Body */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
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

              {/* 3-Phase Milestone Clearance Status & Admin Override Deck */}
              <div
                style={{
                  backgroundColor: '#F8FAFC',
                  borderRadius: '12px',
                  padding: '16px 18px',
                  marginBottom: '20px',
                  border: '1.5px solid #E2E8F0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={16} color="#4F46E5" />
                    <span style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--color-ink)' }}>
                      Team Phase Progression Milestones &amp; Clearances
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                    Direct Administrator Verification &amp; Override
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                  {/* Phase 1: Approved to Go Forward */}
                  <div
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      border: selectedTeamModal.phase1_approved ? '1.5px solid #86EFAC' : '1.5px solid #E2E8F0',
                      backgroundColor: selectedTeamModal.phase1_approved ? '#F0FDF4' : '#FFFFFF',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '8px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#166534', textTransform: 'uppercase' }}>
                          Phase 1 Milestone
                        </span>
                        <span
                          className={`badge ${selectedTeamModal.phase1_approved ? 'badge-success' : 'badge-neutral'}`}
                          style={{ fontSize: '10px', fontWeight: 700 }}
                        >
                          {selectedTeamModal.phase1_approved ? 'Approved' : 'Pending'}
                        </span>
                      </div>
                      <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--color-ink)', marginTop: '4px' }}>
                        Approved to Go Forward
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={adminMilestoneSaving}
                      onClick={() => handleToggleAdminMilestone(selectedTeamModal.id, 1, Boolean(selectedTeamModal.phase1_approved))}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: adminMilestoneSaving ? 'not-allowed' : 'pointer',
                        border: selectedTeamModal.phase1_approved ? '1px solid #BBF7D0' : '1px solid #CBD5E1',
                        backgroundColor: selectedTeamModal.phase1_approved ? '#DCFCE7' : '#F1F5F9',
                        color: selectedTeamModal.phase1_approved ? '#15803D' : '#475569',
                      }}
                    >
                      {selectedTeamModal.phase1_approved ? '✓ Approved (Click to Revoke)' : 'Approve to Go Forward'}
                    </button>
                  </div>

                  {/* Phase 2: Synopsis Submitted */}
                  <div
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      border: selectedTeamModal.phase2_approved ? '1.5px solid #86EFAC' : '1.5px solid #E2E8F0',
                      backgroundColor: selectedTeamModal.phase2_approved ? '#F0FDF4' : '#FFFFFF',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '8px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#166534', textTransform: 'uppercase' }}>
                          Phase 2 Milestone
                        </span>
                        <span
                          className={`badge ${selectedTeamModal.phase2_approved ? 'badge-success' : 'badge-warning'}`}
                          style={{ fontSize: '10px', fontWeight: 700 }}
                        >
                          {selectedTeamModal.phase2_approved ? 'Submitted' : 'Pending'}
                        </span>
                      </div>
                      <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--color-ink)', marginTop: '4px' }}>
                        Synopsis Submitted
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={adminMilestoneSaving}
                      onClick={() => handleToggleAdminMilestone(selectedTeamModal.id, 2, Boolean(selectedTeamModal.phase2_approved))}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: adminMilestoneSaving ? 'not-allowed' : 'pointer',
                        border: selectedTeamModal.phase2_approved ? '1px solid #BBF7D0' : '1px solid #CBD5E1',
                        backgroundColor: selectedTeamModal.phase2_approved ? '#DCFCE7' : '#F1F5F9',
                        color: selectedTeamModal.phase2_approved ? '#15803D' : '#475569',
                      }}
                    >
                      {selectedTeamModal.phase2_approved ? '✓ Synopsis Verified' : 'Mark Synopsis Submitted'}
                    </button>
                  </div>

                  {/* Phase 3: Final Report & Certificate Submitted */}
                  <div
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      border: (selectedTeamModal.phase3_report_clearance || selectedTeamModal.phase3_approved) ? '1.5px solid #86EFAC' : '1.5px solid #E2E8F0',
                      backgroundColor: (selectedTeamModal.phase3_report_clearance || selectedTeamModal.phase3_approved) ? '#F0FDF4' : '#FFFFFF',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '8px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#166534', textTransform: 'uppercase' }}>
                          Phase 3 Milestone
                        </span>
                        <span
                          className={`badge ${(selectedTeamModal.phase3_report_clearance || selectedTeamModal.phase3_approved) ? 'badge-success' : 'badge-neutral'}`}
                          style={{ fontSize: '10px', fontWeight: 700 }}
                        >
                          {(selectedTeamModal.phase3_report_clearance || selectedTeamModal.phase3_approved) ? 'Submitted' : 'Pending'}
                        </span>
                      </div>
                      <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--color-ink)', marginTop: '4px' }}>
                        Report &amp; Certificate Submitted
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={adminMilestoneSaving}
                      onClick={() => handleToggleAdminMilestone(selectedTeamModal.id, 3, Boolean(selectedTeamModal.phase3_report_clearance || selectedTeamModal.phase3_approved))}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: adminMilestoneSaving ? 'not-allowed' : 'pointer',
                        border: (selectedTeamModal.phase3_report_clearance || selectedTeamModal.phase3_approved) ? '1px solid #BBF7D0' : '1px solid #CBD5E1',
                        backgroundColor: (selectedTeamModal.phase3_report_clearance || selectedTeamModal.phase3_approved) ? '#DCFCE7' : '#F1F5F9',
                        color: (selectedTeamModal.phase3_report_clearance || selectedTeamModal.phase3_approved) ? '#15803D' : '#475569',
                      }}
                    >
                      {(selectedTeamModal.phase3_report_clearance || selectedTeamModal.phase3_approved) ? '✓ Report Cleared' : 'Mark Report Submitted'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Students Scorecard & Marks Roster */}
              <div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: 'var(--color-ink)' }}>
                        Student Scorecard &amp; Rubrics Breakdown
                      </h4>
                      <span className="badge badge-neutral" style={{ fontSize: '11px', padding: '2px 8px' }}>
                        {selectedTeamModal.students?.length || 0} Students
                      </span>
                    </div>
                    <span style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                      P1/P2: 3 Rubric Categories • P3: 4 Rubric Categories
                    </span>
                  </div>
                </div>

                <div className="data-table-container" style={{ border: '1px solid var(--color-border)', borderRadius: '10px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%' }}>
                  <table className="data-table" style={{ width: '100%', minWidth: '650px', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ width: '28%', minWidth: '150px' }}>Student</th>
                        <th style={{ width: '16%', minWidth: '100px' }}>Roll No</th>
                        <th style={{ width: '18%', minWidth: '130px', textAlign: 'center' }}>Phase 1 ({getPhaseMaxMarks(1)}M)</th>
                        <th style={{ width: '18%', minWidth: '130px', textAlign: 'center' }}>Phase 2 ({getPhaseMaxMarks(2)}M)</th>
                        <th style={{ width: '20%', minWidth: '140px', textAlign: 'center' }}>Phase 3 ({getPhaseMaxMarks(3)}M)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedTeamModal.students?.map((s: any) => {
                        const isStudentLeader = Boolean(
                          s.isLeader ||
                          s.is_leader ||
                          (selectedTeamModal.leader_id && (String(selectedTeamModal.leader_id) === String(s.id) || String(selectedTeamModal.leader_id) === String(s.user_id))) ||
                          (selectedTeamModal.leader && (
                            String(selectedTeamModal.leader.id) === String(s.id) ||
                            String(selectedTeamModal.leader.id) === String(s.user_id) ||
                            (selectedTeamModal.leader.name && s.full_name && selectedTeamModal.leader.name.toLowerCase().trim() === s.full_name.toLowerCase().trim()) ||
                            (selectedTeamModal.leader.email && s.email && selectedTeamModal.leader.email.toLowerCase().trim() === s.email.toLowerCase().trim())
                          ))
                        );

                        return (
                          <tr key={s.id}>
                            <td>
                              <div style={{ fontWeight: 600, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.full_name}</div>
                              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                                {isStudentLeader ? <span style={{ color: '#059669', fontWeight: 700 }}>● Team Leader</span> : 'Member'}
                              </div>
                            </td>
                            <td style={{ color: 'var(--color-text-muted)', fontSize: '12px', fontFamily: 'monospace' }}>{s.roll_no}</td>
                            <td style={{ textAlign: 'center' }}>
                              {s.phase1 ? (
                                s.phase1.attendanceStatus === 'early_joining' || s.phase1.attendanceStatus === 'next_shift' ? (
                                  <span className="badge" style={{ backgroundColor: '#FEF3C7', color: '#B45309', border: '1px solid #FCD34D', fontSize: '10.5px', fontWeight: 700 }} title={s.phase1.remarks || 'Moved to Early Joining'}>
                                    🕒 Early Joining
                                  </span>
                                ) : s.phase1.isAbsent ? (
                                  <span className="badge badge-danger" style={{ fontSize: '10px' }} title={s.phase1.remarks || 'Marked Absent'}>
                                    Absent
                                  </span>
                                ) : (
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                                    <span style={{ fontWeight: 700, color: '#059669', fontSize: '12.5px' }}>{s.phase1.score} / {getPhaseMaxMarks(1)}</span>
                                    {s.phase1.criteria_scores && (
                                      <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                        <span style={{ fontSize: '9px', background: '#EFF6FF', color: '#1D4ED8', padding: '1px 4px', borderRadius: '4px', border: '1px solid #DBEAFE' }} title="Presentation">📊 {s.phase1.criteria_scores.presentation ?? '-'}</span>
                                        <span style={{ fontSize: '9px', background: '#F5F3FF', color: '#6D28D9', padding: '1px 4px', borderRadius: '4px', border: '1px solid #EDE9FE' }} title="Code">💻 {s.phase1.criteria_scores.code ?? '-'}</span>
                                        <span style={{ fontSize: '9px', background: '#ECFDF5', color: '#047857', padding: '1px 4px', borderRadius: '4px', border: '1px solid #D1FAE5' }} title="Query Handling">💬 {s.phase1.criteria_scores.query_handling ?? '-'}</span>
                                      </div>
                                    )}
                                  </div>
                                )
                              ) : (
                                <span style={{ color: 'var(--color-text-faint)', fontSize: '11px' }}>—</span>
                              )}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {s.phase2 ? (
                                s.phase2.attendanceStatus === 'early_joining' || s.phase2.attendanceStatus === 'next_shift' ? (
                                  <span className="badge" style={{ backgroundColor: '#FEF3C7', color: '#B45309', border: '1px solid #FCD34D', fontSize: '10.5px', fontWeight: 700 }} title={s.phase2.remarks || 'Moved to Early Joining'}>
                                    🕒 Early Joining
                                  </span>
                                ) : s.phase2.isAbsent ? (
                                  <span className="badge badge-danger" style={{ fontSize: '10px' }} title={s.phase2.remarks || 'Marked Absent'}>
                                    Absent
                                  </span>
                                ) : (
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                                    <span style={{ fontWeight: 700, color: '#2563EB', fontSize: '12.5px' }}>{s.phase2.score} / {getPhaseMaxMarks(2)}</span>
                                    {s.phase2.criteria_scores && (
                                      <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                        <span style={{ fontSize: '9px', background: '#EFF6FF', color: '#1D4ED8', padding: '1px 4px', borderRadius: '4px', border: '1px solid #DBEAFE' }} title="Presentation">📊 {s.phase2.criteria_scores.presentation ?? '-'}</span>
                                        <span style={{ fontSize: '9px', background: '#F5F3FF', color: '#6D28D9', padding: '1px 4px', borderRadius: '4px', border: '1px solid #EDE9FE' }} title="Code">💻 {s.phase2.criteria_scores.code ?? '-'}</span>
                                        <span style={{ fontSize: '9px', background: '#ECFDF5', color: '#047857', padding: '1px 4px', borderRadius: '4px', border: '1px solid #D1FAE5' }} title="Query Handling">💬 {s.phase2.criteria_scores.query_handling ?? '-'}</span>
                                      </div>
                                    )}
                                  </div>
                                )
                              ) : (
                                <span style={{ color: 'var(--color-text-faint)', fontSize: '11px' }}>—</span>
                              )}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {s.phase3 ? (
                                s.phase3.attendanceStatus === 'early_joining' || s.phase3.attendanceStatus === 'next_shift' ? (
                                  <span className="badge" style={{ backgroundColor: '#FEF3C7', color: '#B45309', border: '1px solid #FCD34D', fontSize: '10.5px', fontWeight: 700 }} title={s.phase3.remarks || 'Moved to Early Joining'}>
                                    🕒 Early Joining
                                  </span>
                                ) : s.phase3.isAbsent ? (
                                  <span className="badge badge-danger" style={{ fontSize: '10px' }} title={s.phase3.remarks || 'Marked Absent'}>
                                    Absent
                                  </span>
                                ) : (
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                                    <span style={{ fontWeight: 700, color: '#7C3AED', fontSize: '12.5px' }}>{s.phase3.score} / {getPhaseMaxMarks(3)}</span>
                                    {s.phase3.criteria_scores && (
                                      <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                        <span style={{ fontSize: '9px', background: '#EFF6FF', color: '#1D4ED8', padding: '1px 4px', borderRadius: '4px', border: '1px solid #DBEAFE' }} title="Presentation">📊 {s.phase3.criteria_scores.presentation ?? '-'}</span>
                                        <span style={{ fontSize: '9px', background: '#F5F3FF', color: '#6D28D9', padding: '1px 4px', borderRadius: '4px', border: '1px solid #EDE9FE' }} title="Code">💻 {s.phase3.criteria_scores.code ?? '-'}</span>
                                        <span style={{ fontSize: '9px', background: '#ECFDF5', color: '#047857', padding: '1px 4px', borderRadius: '4px', border: '1px solid #D1FAE5' }} title="Query Handling">💬 {s.phase3.criteria_scores.query_handling ?? '-'}</span>
                                        <span style={{ fontSize: '9px', background: '#FFFBEB', color: '#B45309', padding: '1px 4px', borderRadius: '4px', border: '1px solid #FDE68A' }} title="Report & Certificate">📑 {s.phase3.criteria_scores.report ?? '-'}</span>
                                      </div>
                                    )}
                                  </div>
                                )
                              ) : (
                                <span style={{ color: 'var(--color-text-faint)', fontSize: '11px' }}>—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Pinned Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--color-border)', backgroundColor: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', flexShrink: 0 }}>
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
            justifyContent: 'flex-start',
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(5px)',
            WebkitBackdropFilter: 'blur(5px)',
            padding: '32px 16px',
            overflowY: 'auto',
          }}
          onClick={() => setSelectedSupervisorModal(null)}
        >
          <div
            className="card animate-scale-in modal-card-responsive"
            style={{
              width: '100%',
              maxWidth: '720px',
              maxHeight: 'min(90vh, 720px)',
              borderRadius: '16px',
              backgroundColor: '#FFFFFF',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
              border: '1px solid var(--color-border)',
              margin: 'auto 0',
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Pinned Header */}
            <div
              className="modal-header-responsive"
              style={{
                padding: '18px 24px',
                borderBottom: '1px solid var(--color-hairline)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '12px',
                backgroundColor: '#FFFFFF',
                flexShrink: 0,
              }}
            >
              <div style={{ flex: 1 }}>
                <span className="badge badge-brand" style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
                  Faculty Supervisor
                </span>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-ink)', letterSpacing: '-0.02em', margin: '2px 0 6px 0' }}>
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

            {/* Scrollable Body */}
            <div
              className="modal-body-responsive"
              style={{
                padding: '20px 24px',
                overflowY: 'auto',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
              }}
            >
              {/* Authority & Role Governance */}
              <div style={{ padding: '16px 18px', borderRadius: '12px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-canvas-soft)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '8px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Shield size={16} color="var(--color-brand)" /> Authority &amp; Access Governance
                  </h4>
                  {selectedSupervisorModal.isAdmin ? (
                    <span
                      className="badge"
                      style={{
                        fontSize: '11px',
                        backgroundColor: '#FEF3C7',
                        color: '#92400E',
                        border: '1px solid #FCD34D',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Crown size={12} color="#D97706" /> System Administrator
                    </span>
                  ) : (
                    <span className="badge badge-neutral" style={{ fontSize: '11px' }}>
                      Faculty Supervisor
                    </span>
                  )}
                </div>

                <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: selectedSupervisorModal.isAdmin ? '14px' : '0' }}>
                  {selectedSupervisorModal.isAdmin
                    ? 'This faculty member currently holds full administrative authority over all teams, evaluations, panels, and project timelines.'
                    : 'This faculty member currently operates with Faculty Supervisor rights to guide assigned project teams and serve on examination panels.'}
                </p>

                {selectedSupervisorModal.isAdmin && (
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => {
                        showConfirmDialog({
                          title: 'Revert Administrator Role?',
                          message: `Are you sure you want to demote ${selectedSupervisorModal.name} back to Faculty Supervisor?`,
                          confirmText: 'Revert Role',
                          cancelText: 'Keep Admin',
                          type: 'warning',
                          onConfirm: async () => {
                            await handleQuickSetRole(selectedSupervisorModal.id, 'supervisor');
                            setSelectedSupervisorModal(null);
                            setConfirmDialog(null);
                          },
                        });
                      }}
                      className="btn btn-outline"
                      style={{
                        fontSize: '12px',
                        padding: '6px 14px',
                        borderColor: '#EF4444',
                        color: '#DC2626',
                      }}
                    >
                      Revert to Faculty Mentor Role
                    </button>
                  </div>
                )}
              </div>

              {/* Assigned Teams */}
              <div>
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
                      </tr>
                    </thead>
                    <tbody>
                      {selectedSupervisorModal.assignedTeams?.length === 0 ? (
                        <tr>
                          <td colSpan={3} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '16px' }}>
                            No teams currently assigned.
                          </td>
                        </tr>
                      ) : (
                        selectedSupervisorModal.assignedTeams?.map((t: any) => (
                          <tr
                            key={t.id}
                            className="clickable-row"
                            onClick={() => {
                              const fullTeam = teams.find((team: any) => team.id === t.id) || t;
                              setSelectedTeamModal(fullTeam);
                              setSelectedSupervisorModal(null);
                            }}
                            title="Click to view team details & score roster"
                          >
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <strong style={{ color: 'var(--color-brand)' }}>{t.team_name}</strong>
                                <ExternalLink size={12} style={{ opacity: 0.6 }} />
                              </div>
                            </td>
                            <td style={{ fontSize: '12px' }}>{t.leaderName}</td>
                            <td style={{ fontSize: '12px' }}>{t.studentCount} Students</td>
                          </tr>
                        ))
                      )}
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
                      <div
                        key={p.id}
                        onClick={() => {
                          setPanelPhaseFilter(p.phase_number);
                          setActiveTab('panels');
                          setSelectedSupervisorModal(null);
                        }}
                        className="clickable-card"
                        style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-canvas-soft)', fontSize: '12.5px', cursor: 'pointer' }}
                        title="Click to view panel in Panels tab"
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontWeight: 700, color: 'var(--color-ink)' }}>{p.panel_name} (Phase {p.phase_number})</div>
                          <span className="badge badge-brand" style={{ fontSize: '10px' }}>View Panel →</span>
                        </div>
                        <div style={{ color: 'var(--color-text-muted)', fontSize: '11.5px', marginTop: '3px' }}>
                          {p.range} • {p.time_window} • Venue: {p.room_number || 'Room 402 (AB10)'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Pinned Footer */}
            <div
              className="modal-footer-responsive"
              style={{
                padding: '16px 24px',
                borderTop: '1px solid var(--color-hairline)',
                backgroundColor: '#FFFFFF',
                display: 'flex',
                justifyContent: selectedSupervisorModal.isAdmin ? 'space-between' : 'flex-end',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                flexShrink: 0,
              }}
            >
              {selectedSupervisorModal.isAdmin && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#059669', fontSize: '12px', fontWeight: 600 }}>
                  <BadgeCheck size={16} /> Currently Assigned as Portal Administrator
                </div>
              )}
              <button type="button" onClick={() => setSelectedSupervisorModal(null)} className="btn btn-outline" style={{ minWidth: '100px', padding: '8px 18px', fontWeight: 600 }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 6: ADMIN AUTHORITY TRANSFER & NEW TEACHER DIRECT CREATION    */}
      {/* =================================================================== */}
      {authorityModalOpen && (
        <div
          className="modal-overlay-responsive"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1350,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            padding: '32px 16px',
            overflowY: 'auto',
          }}
          onClick={() => {
            if (!transferLoading && !createTeacherLoading) {
              setAuthorityModalOpen(false);
            }
          }}
        >
          <div
            className="card animate-scale-in modal-card-responsive"
            style={{
              width: '100%',
              maxWidth: '780px',
              maxHeight: 'min(92vh, 780px)',
              borderRadius: '16px',
              backgroundColor: '#FFFFFF',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.3)',
              border: '1px solid var(--color-border)',
              margin: 'auto 0',
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              className="modal-header-responsive"
              style={{
                padding: '18px 24px',
                borderBottom: '1px solid var(--color-hairline)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '12px',
                backgroundColor: '#FFFFFF',
                flexShrink: 0,
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span
                    className="badge"
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor: '#FEF3C7',
                      color: '#92400E',
                      border: '1px solid #FCD34D',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Crown size={12} color="#D97706" /> Master Governance
                  </span>
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-ink)', letterSpacing: '-0.02em', margin: '2px 0 4px 0' }}>
                  Admin Authority &amp; Faculty Management
                </h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '12.5px', margin: 0 }}>
                  Transfer system administrator authority to any registered faculty supervisor, or provision a new teacher/admin directly.
                </p>
              </div>
              <button
                onClick={() => setAuthorityModalOpen(false)}
                disabled={transferLoading || createTeacherLoading}
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

            {/* Modal Segmented Tabs */}
            <div style={{ padding: '12px 24px 0 24px', backgroundColor: '#FFFFFF', borderBottom: '1px solid var(--color-hairline)', flexShrink: 0 }}>
              <div className="segmented-control" style={{ width: '100%', justifyContent: 'flex-start' }}>
                <button
                  className={`segmented-pill ${authorityActiveTab === 'transfer' ? 'active' : ''}`}
                  onClick={() => {
                    setAuthorityActiveTab('transfer');
                    setTransferMessage(null);
                    setCreateTeacherSuccess(null);
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px' }}
                >
                  <ArrowRightLeft size={14} /> Transfer Authority
                </button>
                <button
                  className={`segmented-pill ${authorityActiveTab === 'create' ? 'active' : ''}`}
                  onClick={() => {
                    setAuthorityActiveTab('create');
                    setTransferMessage(null);
                    setCreateTeacherSuccess(null);
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px' }}
                >
                  <UserPlus size={14} /> + Add Mentor / Admin
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div
              className="modal-body-responsive"
              style={{
                padding: '20px 24px',
                overflowY: 'auto',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '18px',
              }}
            >
              {/* Alert Feedback Banner */}
              {transferMessage && (
                <div
                  className={`alert-banner ${transferMessage.type === 'error' ? 'alert-danger' : 'alert-success'}`}
                  style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  {transferMessage.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
                  <span>{transferMessage.text}</span>
                </div>
              )}

              {/* ============================================================= */}
              {/* TAB 1: TRANSFER AUTHORITY TO EXISTING TEACHER                 */}
              {/* ============================================================= */}
              {authorityActiveTab === 'transfer' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Current Active Admin Card */}
                  <div style={{ padding: '14px 16px', borderRadius: '12px', border: '1px solid #FCD34D', backgroundColor: '#FFFBEB', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#FDE68A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B45309', fontWeight: 800 }}>
                        <Crown size={20} />
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#B45309', letterSpacing: '0.04em' }}>
                          Current Active Administrator
                        </div>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: '#78350F' }}>
                          {currentUser?.fullName || 'Dr. Project Incharge'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#92400E' }}>
                          {currentUser?.email}
                        </div>
                      </div>
                    </div>
                    <span className="badge" style={{ backgroundColor: '#FEF3C7', color: '#92400E', border: '1px solid #FCD34D', fontWeight: 700 }}>
                      Active Authority
                    </span>
                  </div>

                  {/* Step 1: Select Target Teacher */}
                  <div>
                    <label className="input-label" style={{ fontSize: '13px', fontWeight: 700, marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>1. Select Faculty Member to Grant Authority</span>
                      <span style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', fontWeight: 400 }}>
                        {supervisors.length} faculty members registered
                      </span>
                    </label>

                    {/* Teacher Search Filter in Modal */}
                    <div className="search-input-wrapper" style={{ marginBottom: '10px' }}>
                      <input
                        type="text"
                        className="input-field"
                        style={{ height: '38px', fontSize: '12.5px' }}
                        placeholder="Type to filter teachers by name, email, or department..."
                        value={teacherSearchInModal}
                        onChange={(e) => setTeacherSearchInModal(e.target.value)}
                      />
                      <div className="search-icon">
                        <Search size={14} />
                      </div>
                      {teacherSearchInModal && (
                        <button
                          type="button"
                          onClick={() => setTeacherSearchInModal('')}
                          className="clear-btn"
                          aria-label="Clear filter"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>

                    {/* Teachers List Grid / Picker */}
                    <div style={{ maxHeight: '220px', overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '6px', display: 'flex', flexDirection: 'column', gap: '6px', backgroundColor: 'var(--color-canvas-soft)' }}>
                      {supervisors
                        .filter((s: any) => {
                          const q = teacherSearchInModal.toLowerCase().trim();
                          return !q || s.name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q) || s.employee_id?.toLowerCase().includes(q);
                        })
                        .map((s: any) => {
                          const isSelected = selectedTeacherForTransfer === s.id;
                          const isSelf = currentUser?.id === s.id;

                          return (
                            <div
                              key={s.id}
                              onClick={() => {
                                if (!isSelf) setSelectedTeacherForTransfer(s.id);
                              }}
                              style={{
                                padding: '10px 14px',
                                borderRadius: '8px',
                                border: isSelected ? '2px solid var(--color-primary, #2563eb)' : '1px solid var(--color-border)',
                                backgroundColor: isSelected ? 'rgba(37, 99, 235, 0.06)' : '#FFFFFF',
                                cursor: isSelf ? 'default' : 'pointer',
                                opacity: isSelf ? 0.6 : 1,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div
                                  style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '8px',
                                    backgroundColor: isSelected ? 'var(--color-primary, #2563eb)' : 'var(--color-canvas-soft)',
                                    color: isSelected ? '#FFFFFF' : 'var(--color-ink)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '13px',
                                    fontWeight: 700,
                                  }}
                                >
                                  {s.name ? s.name.charAt(0) : 'T'}
                                </div>
                                <div>
                                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    {s.name} {isSelf && <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 400 }}>(You)</span>}
                                    {s.isAdmin && (
                                      <span className="badge badge-success" style={{ fontSize: '10px', padding: '1px 5px' }}>Admin</span>
                                    )}
                                  </div>
                                  <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted)' }}>
                                    {s.email} • {s.employee_id} • {s.assignedTeamsCount} Teams
                                  </div>
                                </div>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {isSelected ? (
                                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-primary, #2563eb)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <CheckCircle size={15} /> Selected
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                                    {isSelf ? 'Current Account' : 'Click to select'}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* Step 2: Authority Mode Option */}
                  {selectedTeacherForTransfer && (
                    <div style={{ padding: '16px', borderRadius: '12px', border: '1px solid var(--color-border)', backgroundColor: '#FFFFFF' }}>
                      <label className="input-label" style={{ fontSize: '13px', fontWeight: 700, marginBottom: '10px' }}>
                        2. Select Authority Handover Mode
                      </label>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {/* Option 1: Full Authority Transfer (Handover) */}
                        <label
                          style={{
                            padding: '12px 14px',
                            borderRadius: '10px',
                            border: transferDemoteCurrent ? '2px solid #F59E0B' : '1px solid var(--color-border)',
                            backgroundColor: transferDemoteCurrent ? '#FFFBEB' : 'var(--color-canvas-soft)',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '12px',
                            cursor: 'pointer',
                          }}
                        >
                          <input
                            type="radio"
                            name="transferMode"
                            checked={transferDemoteCurrent}
                            onChange={() => setTransferDemoteCurrent(true)}
                            style={{ marginTop: '3px', accentColor: '#D97706' }}
                          />
                          <div>
                            <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#78350F', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>👑 Transfer Full Administrative Authority (Handover)</span>
                              <span className="badge badge-neutral" style={{ fontSize: '10px', backgroundColor: '#FDE68A', color: '#92400E' }}>Recommended</span>
                            </div>
                            <div style={{ fontSize: '12px', color: '#92400E', marginTop: '3px', lineHeight: 1.4 }}>
                              The selected teacher becomes the Primary System Administrator (Project Incharge). Your account will be transitioned to Faculty Supervisor with full mentoring access.
                            </div>
                          </div>
                        </label>

                        {/* Option 2: Co-Admin Elevation */}
                        <label
                          style={{
                            padding: '12px 14px',
                            borderRadius: '10px',
                            border: !transferDemoteCurrent ? '2px solid var(--color-primary, #2563eb)' : '1px solid var(--color-border)',
                            backgroundColor: !transferDemoteCurrent ? 'rgba(37, 99, 235, 0.05)' : 'var(--color-canvas-soft)',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '12px',
                            cursor: 'pointer',
                          }}
                        >
                          <input
                            type="radio"
                            name="transferMode"
                            checked={!transferDemoteCurrent}
                            onChange={() => setTransferDemoteCurrent(false)}
                            style={{ marginTop: '3px', accentColor: 'var(--color-primary, #2563eb)' }}
                          />
                          <div>
                            <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--color-ink)' }}>
                              🛡️ Grant Co-Admin Rights (Joint Administration)
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '3px', lineHeight: 1.4 }}>
                              Elevate this teacher to Administrator without modifying your existing account. Both accounts will share full administrative governance, and this teacher will receive the direct <strong>'Use Admin Access'</strong> button to switch to the Admin console anytime.
                            </div>
                          </div>
                        </label>
                      </div>

                      {/* Safeguard Warning */}
                      <div style={{ marginTop: '14px', padding: '10px 12px', borderRadius: '8px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#991B1B' }}>
                        <ShieldAlert size={16} style={{ flexShrink: 0 }} />
                        <span>
                          {transferDemoteCurrent
                            ? 'Warning: Upon confirmation, master authority will transfer immediately and an official notification letter will be issued to both accounts.'
                            : 'Notice: Both administrators will possess unrestricted control over evaluations, panels, score edits, and phases.'}
                        </span>
                      </div>

                      {/* Confirmation Checkbox */}
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', fontSize: '12.5px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={transferConfirmOpen}
                          onChange={(e) => setTransferConfirmOpen(e.target.checked)}
                          style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary, #2563eb)' }}
                        />
                        <span style={{ fontWeight: 600, color: 'var(--color-ink)' }}>
                          I confirm and authorize this administrative governance update.
                        </span>
                      </label>
                    </div>
                  )}

                  {/* Transfer Action Button */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '10px', borderTop: '1px solid var(--color-hairline)' }}>
                    <button
                      type="button"
                      onClick={() => setAuthorityModalOpen(false)}
                      className="btn btn-outline"
                      disabled={transferLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!selectedTeacherForTransfer) {
                          setToastMessage({ type: 'error', text: 'Please select a teacher from the list first.' });
                          return;
                        }
                        if (!transferConfirmOpen) {
                          setToastMessage({ type: 'error', text: 'Please check the confirmation box to authorize the transfer.' });
                          return;
                        }
                        handleTransferAuthority(selectedTeacherForTransfer, transferDemoteCurrent);
                      }}
                      className="btn btn-primary"
                      disabled={!selectedTeacherForTransfer || !transferConfirmOpen || transferLoading}
                      style={{
                        padding: '9px 20px',
                        fontSize: '13px',
                        fontWeight: 700,
                        backgroundColor: transferDemoteCurrent ? '#D97706' : 'var(--color-primary, #2563eb)',
                        borderColor: transferDemoteCurrent ? '#D97706' : 'var(--color-primary, #2563eb)',
                      }}
                    >
                      {transferLoading ? 'Authorizing & Updating...' : transferDemoteCurrent ? '👑 Confirm Authority Transfer' : '🛡️ Grant Co-Admin Rights'}
                    </button>
                  </div>
                </div>
              )}

              {/* ============================================================= */}
              {/* TAB 2: CREATE NEW TEACHER / ADMIN DIRECTLY                   */}
              {/* ============================================================= */}
              {authorityActiveTab === 'create' && (
                <div>
                  {createTeacherSuccess ? (
                    /* Account Provisioned Success Slip */
                    <div style={{ padding: '20px', borderRadius: '12px', border: '1px solid #86EFAC', backgroundColor: '#F0FDF4', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#22C55E', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Check size={20} />
                        </div>
                        <div>
                          <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#14532D', margin: 0 }}>
                            Account Successfully Provisioned!
                          </h4>
                          <p style={{ fontSize: '12px', color: '#166534', margin: 0 }}>
                            The new faculty record has been saved and registered to the ProjectHub system.
                          </p>
                        </div>
                      </div>

                      {/* Credentials Slip Card */}
                      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '10px', padding: '16px', border: '1px solid #BBF7D0', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-hairline)', paddingBottom: '6px' }}>
                          <span style={{ color: 'var(--color-text-muted)' }}>Full Name:</span>
                          <strong>{createTeacherSuccess.user.full_name}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-hairline)', paddingBottom: '6px' }}>
                          <span style={{ color: 'var(--color-text-muted)' }}>Login Email:</span>
                          <strong style={{ fontFamily: 'monospace' }}>{createTeacherSuccess.user.email}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-hairline)', paddingBottom: '6px' }}>
                          <span style={{ color: 'var(--color-text-muted)' }}>Initial Password:</span>
                          <strong style={{ fontFamily: 'monospace', color: 'var(--color-brand)' }}>{createTeacherSuccess.password}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-hairline)', paddingBottom: '6px' }}>
                          <span style={{ color: 'var(--color-text-muted)' }}>Employee ID:</span>
                          <strong>{createTeacherSuccess.supervisor?.employee_id || 'FAC-001'}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--color-text-muted)' }}>Assigned Role:</span>
                          <span className={`badge ${createTeacherSuccess.user.role === 'admin' ? 'badge-success' : 'badge-neutral'}`}>
                            {createTeacherSuccess.user.role === 'admin' ? '👑 Administrator' : '🎓 Faculty Supervisor'}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => {
                            const credsText = `CodeShastra ProjectHub Portal Credentials:\nName: ${createTeacherSuccess.user.full_name}\nEmail: ${createTeacherSuccess.user.email}\nPassword: ${createTeacherSuccess.password}\nRole: ${createTeacherSuccess.user.role === 'admin' ? 'System Administrator' : 'Faculty Supervisor'}\nEmployee ID: ${createTeacherSuccess.supervisor?.employee_id}\nPortal URL: ${window.location.origin}/login`;
                            navigator.clipboard.writeText(credsText);
                            setCopiedCreds(true);
                            setTimeout(() => setCopiedCreds(false), 2500);
                          }}
                          className="btn btn-outline"
                          style={{ flex: 1, fontSize: '12.5px', padding: '8px 14px', gap: '6px', justifyContent: 'center' }}
                        >
                          {copiedCreds ? <Check size={14} color="#16A34A" /> : <Copy size={14} />}
                          {copiedCreds ? 'Credentials Copied!' : 'Copy Login Details'}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setCreateTeacherSuccess(null);
                            setCreateTeacherForm({
                              fullName: '',
                              email: '',
                              phone: '',
                              employeeId: '',
                              designation: 'Faculty Mentor',
                              department: 'Dept. of Computer Applications',
                              cabinNumber: 'Academic Block AB10',
                              role: 'supervisor',
                              password: '',
                              transferCurrentAdmin: false,
                            });
                          }}
                          className="btn btn-primary"
                          style={{ padding: '8px 18px', fontSize: '12.5px', fontWeight: 600 }}
                        >
                          + Add Another Teacher
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Creation Form */
                    <form onSubmit={handleCreateTeacherSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                        <div>
                          <label className="input-label" style={{ fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                            Full Name <span style={{ color: 'var(--color-danger)' }}>*</span>
                          </label>
                          <input
                            type="text"
                            required
                            className="input-field"
                            placeholder="e.g. Dr. Rajesh Sharma"
                            value={createTeacherForm.fullName}
                            onChange={(e) => setCreateTeacherForm({ ...createTeacherForm, fullName: e.target.value })}
                            style={{ fontSize: '13px' }}
                          />
                        </div>

                        <div>
                          <label className="input-label" style={{ fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                            Official Email <span style={{ color: 'var(--color-danger)' }}>*</span>
                          </label>
                          <input
                            type="email"
                            required
                            className="input-field"
                            placeholder="e.g. rajesh.sharma@college.edu"
                            value={createTeacherForm.email}
                            onChange={(e) => setCreateTeacherForm({ ...createTeacherForm, email: e.target.value })}
                            style={{ fontSize: '13px' }}
                          />
                        </div>

                        <div>
                          <label className="input-label" style={{ fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                            Phone Number
                          </label>
                          <input
                            type="text"
                            className="input-field"
                            placeholder="e.g. 9876543210"
                            value={createTeacherForm.phone}
                            onChange={(e) => setCreateTeacherForm({ ...createTeacherForm, phone: e.target.value })}
                            style={{ fontSize: '13px' }}
                          />
                        </div>

                        <div>
                          <label className="input-label" style={{ fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                            Faculty Employee ID
                          </label>
                          <input
                            type="text"
                            className="input-field"
                            placeholder="e.g. EMP125 (leave blank for auto)"
                            value={createTeacherForm.employeeId}
                            onChange={(e) => setCreateTeacherForm({ ...createTeacherForm, employeeId: e.target.value })}
                            style={{ fontSize: '13px' }}
                          />
                        </div>

                        <div>
                          <label className="input-label" style={{ fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                            Designation
                          </label>
                          <input
                            type="text"
                            className="input-field"
                            placeholder="e.g. Assistant Professor / Associate Professor"
                            value={createTeacherForm.designation}
                            onChange={(e) => setCreateTeacherForm({ ...createTeacherForm, designation: e.target.value })}
                            style={{ fontSize: '13px' }}
                          />
                        </div>

                        <div>
                          <label className="input-label" style={{ fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                            Cabin / Office Location
                          </label>
                          <input
                            type="text"
                            className="input-field"
                            placeholder="e.g. AB10 - Room 402"
                            value={createTeacherForm.cabinNumber}
                            onChange={(e) => setCreateTeacherForm({ ...createTeacherForm, cabinNumber: e.target.value })}
                            style={{ fontSize: '13px' }}
                          />
                        </div>
                      </div>

                      {/* Custom Password Input */}
                      <div>
                        <label className="input-label" style={{ fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                          Custom Password (Optional)
                        </label>
                        <input
                          type="text"
                          className="input-field"
                          placeholder={createTeacherForm.role === 'admin' ? 'Default: Admin@CodeShastra2026' : 'Default: CodeShastra@<Last4DigitsOfPhone>'}
                          value={createTeacherForm.password}
                          onChange={(e) => setCreateTeacherForm({ ...createTeacherForm, password: e.target.value })}
                          style={{ fontSize: '13px', fontFamily: 'monospace' }}
                        />
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '3px' }}>
                          Leave empty to use automatic standard password format.
                        </div>
                      </div>

                      {/* Form Actions */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px', paddingTop: '12px', borderTop: '1px solid var(--color-hairline)' }}>
                        <button
                          type="button"
                          onClick={() => setAuthorityModalOpen(false)}
                          className="btn btn-outline"
                          disabled={createTeacherLoading}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="btn btn-primary"
                          disabled={createTeacherLoading}
                          style={{ padding: '9px 20px', fontSize: '13px', fontWeight: 700 }}
                        >
                          {createTeacherLoading ? 'Provisioning Account...' : '+ Provision & Create Account'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TRANSITION SCREEN: GRACEFUL DEMOTION REDIRECT                      */}
      {/* =================================================================== */}
      {demotedRedirectCountdown !== null && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(15, 23, 42, 0.92)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            color: '#FFFFFF',
            textAlign: 'center',
          }}
        >
          <div
            className="card animate-scale-in"
            style={{
              maxWidth: '480px',
              padding: '32px 28px',
              borderRadius: '20px',
              backgroundColor: '#1E293B',
              border: '1px solid #334155',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                color: '#F59E0B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Crown size={32} />
            </div>

            <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
              Authority Handover Complete
            </h3>

            <p style={{ fontSize: '14px', color: '#94A3B8', lineHeight: 1.5, margin: 0 }}>
              Administrative authority has been officially transferred. Your account has transitioned to a <strong>Faculty Mentor</strong>.
            </p>

            <div style={{ padding: '10px 18px', borderRadius: '10px', backgroundColor: '#0F172A', border: '1px solid #334155', fontSize: '13px', color: '#38BDF8' }}>
              Redirecting to Faculty Dashboard in <strong>{demotedRedirectCountdown}s</strong>...
            </div>

            <button
              onClick={() => router.push('/dashboard/faculty')}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '8px', padding: '10px', fontWeight: 700 }}
            >
              Go to Faculty Dashboard Now
            </button>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 5: ATTENDANCE & SHIFT SEGREGATION CONFIRMATION DIALOG         */}
      {/* =================================================================== */}
      {segregationModalItem && (
        <div
          className="modal-overlay-responsive"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1400,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(5px)',
            WebkitBackdropFilter: 'blur(5px)',
            padding: '24px 16px',
            overflowY: 'auto',
          }}
          onClick={() => {
            if (!segregationLoading) setSegregationModalItem(null);
          }}
        >
          <div
            className="card animate-scale-in"
            style={{
              width: '100%',
              maxWidth: '520px',
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
              border: '1px solid var(--color-border)',
              padding: 0,
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid var(--color-border)',
                backgroundColor: segregationModalItem.targetStatus === 'early_joining' ? '#FFFBEB' : '#FEF2F2',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: segregationModalItem.targetStatus === 'early_joining' ? '#FEF3C7' : '#FEE2E2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {segregationModalItem.targetStatus === 'early_joining' ? (
                    <Clock size={18} color="#D97706" />
                  ) : (
                    <UserX size={18} color="#DC2626" />
                  )}
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--color-ink)' }}>
                    {segregationModalItem.targetStatus === 'early_joining' ? 'Move Candidate to Early Joining' : 'Mark Candidate as Absent'}
                  </h3>
                  <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    Phase {segregationModalItem.item.phaseNumber} Viva Attendance Segregation
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!segregationLoading) setSegregationModalItem(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-faint)',
                  cursor: 'pointer',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Student info box */}
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: '10px',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, fontSize: '14px', color: 'var(--color-ink)' }}>
                    {segregationModalItem.item.studentName}
                  </span>
                  <span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--color-text-muted)', backgroundColor: '#FFFFFF', padding: '2px 6px', borderRadius: '4px', border: '1px solid #CBD5E1' }}>
                    {segregationModalItem.item.rollNo}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  Team: <strong>{segregationModalItem.item.teamCode}: {segregationModalItem.item.teamName}</strong>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  Assigned Slot: <strong>{segregationModalItem.item.roomNumber}</strong> • {segregationModalItem.item.timeWindow}
                </div>
              </div>

              {/* Status Change Description */}
              <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.5 }}>
                {segregationModalItem.targetStatus === 'early_joining'
                  ? 'Moving this candidate to Early Joining preserves their eligibility to be evaluated during the rescheduled batch slot without penalizing their defense records.'
                  : 'Marking this candidate as Confirmed Absent records their non-attendance for this defense phase.'}
              </p>

              {/* Remarks / Reason input */}
              <div>
                <label className="input-label" style={{ fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                  Reason / Notes (Optional):
                </label>
                <input
                  type="text"
                  className="input-field"
                  style={{
                    fontSize: '13px',
                    height: '42px',
                    borderRadius: '10px',
                    width: '100%',
                  }}
                  value={segregationCustomRemark}
                  onChange={(e) => setSegregationCustomRemark(e.target.value)}
                  placeholder={
                    segregationModalItem.targetStatus === 'early_joining'
                      ? 'e.g. Rescheduled for early joining session due to morning exam collision'
                      : 'e.g. Candidate did not report for defense'
                  }
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '16px 24px',
                borderTop: '1px solid var(--color-border)',
                backgroundColor: '#F8FAFC',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
              }}
            >
              <button
                type="button"
                onClick={() => setSegregationModalItem(null)}
                className="btn btn-outline"
                disabled={segregationLoading}
                style={{ padding: '8px 18px', fontSize: '13px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() =>
                  handleSegregateAttendance(
                    segregationModalItem.item.phaseNumber,
                    segregationModalItem.item.teamId,
                    segregationModalItem.item.studentId,
                    segregationModalItem.targetStatus,
                    segregationCustomRemark
                  )
                }
                className="btn"
                disabled={segregationLoading}
                style={{
                  padding: '8px 20px',
                  fontSize: '13px',
                  fontWeight: 700,
                  backgroundColor: segregationModalItem.targetStatus === 'early_joining' ? '#F59E0B' : '#DC2626',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {segregationLoading ? (
                  'Updating...'
                ) : segregationModalItem.targetStatus === 'early_joining' ? (
                  <>
                    <Clock size={14} /> Confirm Early Joining
                  </>
                ) : (
                  <>
                    <UserX size={14} /> Confirm Absent
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: MANAGE PRESENTATION ROOMS (Direct Supabase Sync)             */}
      {/* =================================================================== */}
      {manageRoomsModalOpen && (
        <div
          className="modal-overlay-responsive"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1350,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(5px)',
            WebkitBackdropFilter: 'blur(5px)',
            padding: '24px 16px',
            overflowY: 'auto',
          }}
          onClick={() => {
            if (!roomModalLoading) {
              setManageRoomsModalOpen(false);
              setEditingRoom(null);
            }
          }}
        >
          <div
            className="card animate-scale-in"
            style={{
              width: '100%',
              maxWidth: '680px',
              maxHeight: '90vh',
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
              border: '1px solid var(--color-border)',
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                padding: '18px 24px',
                borderBottom: '1px solid var(--color-border)',
                backgroundColor: '#F8FAFC',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#2563EB',
                  }}
                >
                  <Building size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                    Manage Presentation Rooms
                  </h3>
                  <p style={{ fontSize: '11.5px', color: '#64748B', margin: '2px 0 0 0' }}>
                    Add, edit, or delete venue rooms (synced directly to database)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setManageRoomsModalOpen(false);
                  setEditingRoom(null);
                }}
                className="btn-icon-hover"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Add Room Quick Bar */}
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#1E293B' }}>
                  + Add New Presentation Room
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAddRoom(newRoomName, newRoomBuilding);
                  }}
                  style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}
                >
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Room 409 or Seminar Hall 3"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    style={{ flex: '1 1 200px', height: '36px', fontSize: '12.5px' }}
                    required
                  />
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Building (e.g. Academic Block AB10)"
                    value={newRoomBuilding}
                    onChange={(e) => setNewRoomBuilding(e.target.value)}
                    style={{ flex: '1 1 180px', height: '36px', fontSize: '12.5px' }}
                  />
                  <button
                    type="submit"
                    disabled={roomModalLoading || !newRoomName.trim()}
                    className="btn btn-primary"
                    style={{ height: '36px', padding: '0 14px', fontSize: '12px', fontWeight: 700, gap: '4px' }}
                  >
                    <Plus size={14} /> Add Room
                  </button>
                </form>
              </div>

              {/* Active Rooms Grid / List */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0F172A' }}>
                    Active Rooms List ({AB10_ROOMS.length})
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {AB10_ROOMS.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAllRooms}
                        disabled={roomModalLoading}
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '4px 9px',
                          borderRadius: '6px',
                          border: '1px solid #FEE2E2',
                          backgroundColor: '#FEF2F2',
                          color: '#DC2626',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                        title="Delete all rooms permanently from database"
                      >
                        <Trash2 size={12} /> Clear All
                      </button>
                    )}
                  </div>
                </div>

                {AB10_ROOMS.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '36px 16px', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px dashed #CBD5E1' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                      <Building size={32} color="#94A3B8" />
                    </div>
                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0F172A' }}>No Presentation Rooms Configured</div>
                    <p style={{ fontSize: '12px', color: '#64748B', maxWidth: '360px', margin: '4px auto 0 auto' }}>
                      All presentation rooms have been removed. Add new rooms using the form above.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px' }}>
                    {AB10_ROOMS.map((room) => {
                      const dbRecord = dbRooms.find((r: any) => (typeof r === 'string' ? r === room : r.name === room));
                      const isEditing = Boolean(editingRoom && editingRoom.oldName === room);
                      const assignedPanelCount = (panels || []).filter((p: any) => p.room_number === room).length;

                      if (isEditing && editingRoom) {
                        return (
                          <div
                            key={room}
                            style={{
                              padding: '12px',
                              borderRadius: '10px',
                              backgroundColor: '#EFF6FF',
                              border: '1.5px solid #2563EB',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '8px',
                            }}
                          >
                            <div style={{ fontSize: '11px', fontWeight: 700, color: '#1D4ED8' }}>Edit Room Name</div>
                            <input
                              type="text"
                              className="input-field"
                              value={editingRoom.name}
                              onChange={(e) => {
                                const newNameVal = e.target.value;
                                setEditingRoom((prev) => prev ? { ...prev, name: newNameVal } : null);
                              }}
                              style={{ height: '32px', fontSize: '12px', backgroundColor: '#FFFFFF' }}
                              autoFocus
                            />
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                              <button
                                type="button"
                                onClick={() => setEditingRoom(null)}
                                className="btn btn-outline"
                                style={{ height: '28px', padding: '0 8px', fontSize: '11px' }}
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (editingRoom) {
                                    handleEditRoom(editingRoom.id, editingRoom.oldName, editingRoom.name, editingRoom.building);
                                  }
                                }}
                                className="btn btn-primary"
                                style={{ height: '28px', padding: '0 10px', fontSize: '11px', fontWeight: 700 }}
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={room}
                          style={{
                            padding: '10px 14px',
                            borderRadius: '10px',
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #E2E8F0',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {room}
                            </span>
                            <span style={{ fontSize: '10.5px', color: '#64748B' }}>
                              {assignedPanelCount > 0 ? `${assignedPanelCount} Panels using` : 'AB10 Venue'}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <button
                              type="button"
                              onClick={() => setEditingRoom({ id: dbRecord?.id, oldName: room, name: room, building: dbRecord?.building || 'Academic Block AB10' })}
                              style={{
                                padding: '5px',
                                borderRadius: '6px',
                                border: '1px solid #E2E8F0',
                                backgroundColor: '#F8FAFC',
                                color: '#475569',
                                cursor: 'pointer',
                              }}
                              title="Rename Room"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRoom(dbRecord?.id, room)}
                              style={{
                                padding: '5px',
                                borderRadius: '6px',
                                border: '1px solid #FEE2E2',
                                backgroundColor: '#FEF2F2',
                                color: '#DC2626',
                                cursor: 'pointer',
                              }}
                              title="Delete Room"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                padding: '12px 24px',
                borderTop: '1px solid var(--color-border)',
                backgroundColor: '#F8FAFC',
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setManageRoomsModalOpen(false);
                  setEditingRoom(null);
                }}
                className="btn btn-outline"
                style={{ padding: '6px 16px', fontSize: '12.5px', fontWeight: 600 }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: MANAGE PRESENTATION SHIFTS (Direct Supabase Sync)            */}
      {/* =================================================================== */}
      {manageShiftsModalOpen && (
        <div
          className="modal-overlay-responsive"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1350,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(5px)',
            WebkitBackdropFilter: 'blur(5px)',
            padding: '24px 16px',
            overflowY: 'auto',
          }}
          onClick={() => {
            if (!shiftModalLoading) {
              setManageShiftsModalOpen(false);
              setEditingShift(null);
            }
          }}
        >
          <div
            className="card animate-scale-in"
            style={{
              width: '100%',
              maxWidth: '720px',
              maxHeight: '90vh',
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
              border: '1px solid var(--color-border)',
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                padding: '18px 24px',
                borderBottom: '1px solid var(--color-border)',
                backgroundColor: '#F8FAFC',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: '#FEF3C7',
                    border: '1px solid #FDE68A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#D97706',
                  }}
                >
                  <Clock size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                    Manage Presentation Shifts
                  </h3>
                  <p style={{ fontSize: '11.5px', color: '#64748B', margin: '2px 0 0 0' }}>
                    Configure timing windows, short labels, and color presets (synced directly to database)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setManageShiftsModalOpen(false);
                  setEditingShift(null);
                }}
                className="btn-icon-hover"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Add / Edit Shift Form with Dropdowns & Quick Select */}
              <div
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  backgroundColor: editingShift ? '#EFF6FF' : '#F8FAFC',
                  border: `1px solid ${editingShift ? '#BFDBFE' : '#E2E8F0'}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12.5px', fontWeight: 700, color: editingShift ? '#1D4ED8' : '#1E293B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={15} color={editingShift ? '#1D4ED8' : '#2563EB'} />
                    {editingShift ? 'Edit Shift Timing & Details' : '+ Add New Presentation Shift'}
                  </span>
                  {editingShift && (
                    <button
                      type="button"
                      onClick={() => setEditingShift(null)}
                      style={{ fontSize: '11px', color: '#64748B', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Cancel Editing
                    </button>
                  )}
                </div>

                {/* Quick Shift Template Dropdown */}
                <div>
                  <label className="input-label" style={{ fontSize: '11px', fontWeight: 700, marginBottom: '4px', color: '#475569' }}>
                    Quick Select Template (Optional Auto-Fill)
                  </label>
                  <select
                    className="input-field"
                    style={{ height: '34px', fontSize: '12px', fontWeight: 600, backgroundColor: '#FFFFFF' }}
                    value=""
                    onChange={(e) => {
                      const t = SHIFT_TEMPLATES.find((x) => x.label === e.target.value);
                      if (t) {
                        const short = `${t.startTime} - ${t.endTime}`;
                        const win = `Batch: ${t.label} (${short})`;
                        if (editingShift) {
                          setEditingShift({
                            ...editingShift,
                            label: t.label,
                            startTime: t.startTime,
                            endTime: t.endTime,
                            timeShort: short,
                            timeWindow: win,
                            color: t.color,
                            colorBg: t.colorBg,
                            colorBorder: t.colorBorder,
                          });
                        } else {
                          setNewShiftForm({
                            ...newShiftForm,
                            label: t.label,
                            startTime: t.startTime,
                            endTime: t.endTime,
                            timeShort: short,
                            timeWindow: win,
                            color: t.color,
                            colorBg: t.colorBg,
                            colorBorder: t.colorBorder,
                          });
                        }
                      }
                    }}
                  >
                    <option value="" disabled>Choose a template to fill in one click...</option>
                    {SHIFT_TEMPLATES.map((tmpl) => (
                      <option key={tmpl.label} value={tmpl.label}>
                        {tmpl.label} ({tmpl.startTime} - {tmpl.endTime})
                      </option>
                    ))}
                  </select>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (editingShift) {
                      handleEditShift(editingShift.id, editingShift);
                    } else {
                      handleAddShift(newShiftForm);
                    }
                  }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                    {/* Shift Label / Preset */}
                    <div>
                      <label className="input-label" style={{ fontSize: '11px', fontWeight: 700, marginBottom: '4px' }}>
                        Shift Label / Name
                      </label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="e.g. Shift 1: Morning"
                        value={editingShift ? editingShift.label : newShiftForm.label}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (editingShift) {
                            setEditingShift({
                              ...editingShift,
                              label: val,
                              timeWindow: `Batch: ${val} (${editingShift.timeShort || '08:00 AM - 10:00 AM'})`,
                            });
                          } else {
                            setNewShiftForm({
                              ...newShiftForm,
                              label: val,
                              timeWindow: `Batch: ${val} (${newShiftForm.timeShort || '08:00 AM - 10:00 AM'})`,
                            });
                          }
                        }}
                        style={{ height: '34px', fontSize: '12px' }}
                        required
                      />
                    </div>

                    {/* Short Time Slot Dropdowns with Clock Icon */}
                    <div>
                      <label className="input-label" style={{ fontSize: '11px', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} color="#2563EB" /> Short Time Slot (Dropdown)
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '6px' }}>
                        <select
                          className="input-field"
                          style={{ height: '34px', fontSize: '11.5px', padding: '0 6px' }}
                          value={
                            editingShift
                              ? (editingShift.startTime || editingShift.timeShort?.split(' - ')[0] || '08:00 AM')
                              : (newShiftForm.startTime || '08:00 AM')
                          }
                          onChange={(e) => {
                            const newStart = e.target.value;
                            const curEnd = editingShift
                              ? (editingShift.endTime || editingShift.timeShort?.split(' - ')[1] || '10:00 AM')
                              : (newShiftForm.endTime || '10:00 AM');
                            const combined = `${newStart} - ${curEnd}`;
                            if (editingShift) {
                              setEditingShift({
                                ...editingShift,
                                startTime: newStart,
                                endTime: curEnd,
                                timeShort: combined,
                                timeWindow: `Batch: ${editingShift.label || 'Shift'} (${combined})`,
                              });
                            } else {
                              setNewShiftForm({
                                ...newShiftForm,
                                startTime: newStart,
                                endTime: curEnd,
                                timeShort: combined,
                                timeWindow: `Batch: ${newShiftForm.label || 'Shift'} (${combined})`,
                              });
                            }
                          }}
                        >
                          {STANDARD_TIME_OPTIONS.map((opt) => (
                            <option key={`start-${opt}`} value={opt}>{opt}</option>
                          ))}
                        </select>
                        <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#64748B' }}>to</span>
                        <select
                          className="input-field"
                          style={{ height: '34px', fontSize: '11.5px', padding: '0 6px' }}
                          value={
                            editingShift
                              ? (editingShift.endTime || editingShift.timeShort?.split(' - ')[1] || '10:00 AM')
                              : (newShiftForm.endTime || '10:00 AM')
                          }
                          onChange={(e) => {
                            const newEnd = e.target.value;
                            const curStart = editingShift
                              ? (editingShift.startTime || editingShift.timeShort?.split(' - ')[0] || '08:00 AM')
                              : (newShiftForm.startTime || '08:00 AM');
                            const combined = `${curStart} - ${newEnd}`;
                            if (editingShift) {
                              setEditingShift({
                                ...editingShift,
                                startTime: curStart,
                                endTime: newEnd,
                                timeShort: combined,
                                timeWindow: `Batch: ${editingShift.label || 'Shift'} (${combined})`,
                              });
                            } else {
                              setNewShiftForm({
                                ...newShiftForm,
                                startTime: curStart,
                                endTime: newEnd,
                                timeShort: combined,
                                timeWindow: `Batch: ${newShiftForm.label || 'Shift'} (${combined})`,
                              });
                            }
                          }}
                        >
                          {STANDARD_TIME_OPTIONS.map((opt) => (
                            <option key={`end-${opt}`} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                    <button
                      type="submit"
                      disabled={shiftModalLoading}
                      className="btn btn-primary"
                      style={{ height: '34px', padding: '0 16px', fontSize: '12px', fontWeight: 700, gap: '6px' }}
                    >
                      {editingShift ? <Check size={14} /> : <Plus size={14} />}
                      {editingShift ? 'Save Shift Changes' : 'Add Shift Preset'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Existing Shifts List */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0F172A' }}>
                    Current Shift Presets ({SHIFT_PRESETS.length})
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {SHIFT_PRESETS.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAllShifts}
                        disabled={shiftModalLoading}
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '4px 9px',
                          borderRadius: '6px',
                          border: '1px solid #FEE2E2',
                          backgroundColor: '#FEF2F2',
                          color: '#DC2626',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                        title="Delete all shifts permanently from database"
                      >
                        <Trash2 size={12} /> Clear All
                      </button>
                    )}
                  </div>
                </div>

                {SHIFT_PRESETS.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '36px 16px', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px dashed #CBD5E1' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                      <Clock size={32} color="#94A3B8" />
                    </div>
                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0F172A' }}>No Presentation Shifts Configured</div>
                    <p style={{ fontSize: '12px', color: '#64748B', maxWidth: '360px', margin: '4px auto 0 auto' }}>
                      All presentation shifts have been removed. Add new shifts using the form above.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                    {SHIFT_PRESETS.map((shift: any, idx: number) => {
                      const panelsInThisShift = (panels || []).filter((p: any) =>
                        (p.time_window || '').toLowerCase().includes(shift.label?.slice(0, 7)?.toLowerCase())
                      ).length;

                      return (
                        <div
                          key={shift.id || idx}
                          style={{
                            padding: '12px 14px',
                            borderRadius: '10px',
                            border: `1.5px solid ${shift.color || '#CBD5E1'}`,
                            backgroundColor: shift.colorBg || '#FFFFFF',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', color: shift.color || '#2563EB' }}>
                              <Clock size={15} />
                            </span>
                            <span style={{ fontSize: '10.5px', fontWeight: 700, color: shift.color || '#64748B' }}>
                              {panelsInThisShift} Panels
                            </span>
                          </div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>
                            {shift.label}
                          </div>
                          <div style={{ fontSize: '11px', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={11} color="#64748B" />
                            {shift.timeShort}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '6px' }}>
                            <button
                              type="button"
                              onClick={() => setEditingShift(shift)}
                              style={{
                                padding: '4px 8px',
                                borderRadius: '6px',
                                border: '1px solid #CBD5E1',
                                backgroundColor: '#FFFFFF',
                                color: '#334155',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <Edit3 size={12} /> Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteShift(shift.id, shift.label)}
                              style={{
                                padding: '4px 8px',
                                borderRadius: '6px',
                                border: '1px solid #FEE2E2',
                                backgroundColor: '#FEF2F2',
                                color: '#DC2626',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <Trash2 size={12} /> Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                padding: '12px 24px',
                borderTop: '1px solid var(--color-border)',
                backgroundColor: '#F8FAFC',
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setManageShiftsModalOpen(false);
                  setEditingShift(null);
                }}
                className="btn btn-outline"
                style={{ padding: '6px 16px', fontSize: '12.5px', fontWeight: 600 }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* IN-SOFTWARE CONFIRMATION DIALOG (Zero browser alert/confirm popups)  */}
      {/* =================================================================== */}
      {confirmDialog && confirmDialog.isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(5px)',
            WebkitBackdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
            animation: 'fadeIn 0.15s ease',
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '440px',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.08)',
              border: '1px solid #E2E8F0',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: confirmDialog.type === 'danger' ? '#FEE2E2' : '#FEF3C7',
                  color: confirmDialog.type === 'danger' ? '#DC2626' : '#D97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {confirmDialog.type === 'danger' ? <Trash2 size={20} /> : <AlertTriangle size={20} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontSize: '16.5px', fontWeight: 700, color: '#0F172A', margin: 0, lineHeight: 1.3 }}>
                  {confirmDialog.title}
                </h3>
                <p style={{ fontSize: '13px', color: '#64748B', marginTop: '6px', marginBottom: 0, lineHeight: 1.5 }}>
                  {confirmDialog.message}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="btn btn-outline"
                disabled={confirmDialog.loading}
                style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 600 }}
              >
                {confirmDialog.cancelText || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (confirmDialog.loading) return;
                  setConfirmDialog((prev) => (prev ? { ...prev, loading: true } : null));
                  try {
                    await confirmDialog.onConfirm();
                  } catch (err) {
                    console.error('Confirm dialog error:', err);
                  } finally {
                    setConfirmDialog(null);
                  }
                }}
                disabled={confirmDialog.loading}
                style={{
                  padding: '8px 18px',
                  fontSize: '13px',
                  fontWeight: 700,
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: confirmDialog.type === 'danger' ? '#DC2626' : '#2563EB',
                  color: '#FFFFFF',
                  cursor: confirmDialog.loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                  opacity: confirmDialog.loading ? 0.85 : 1,
                }}
              >
                {confirmDialog.loading && <RefreshCw size={13} className="spin" />}
                {confirmDialog.loading
                  ? confirmDialog.loadingText || 'Processing...'
                  : confirmDialog.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* IN-SOFTWARE TOAST BANNER NOTIFICATION (Zero browser alert popups)    */}
      {/* =================================================================== */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: toastMessage.type === 'success' ? '#065F46' : '#991B1B',
            color: '#FFFFFF',
            padding: '12px 18px',
            borderRadius: '10px',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13px',
            fontWeight: 600,
            animation: 'slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {toastMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            style={{ background: 'transparent', border: 'none', color: '#FFFFFF', cursor: 'pointer', padding: '0 0 0 8px', opacity: 0.8 }}
            aria-label="Dismiss toast"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <Footer />
    </div>
  );
}

