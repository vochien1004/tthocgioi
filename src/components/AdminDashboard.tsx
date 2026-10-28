import React, { useState, useEffect } from 'react';
import {
  LayoutGrid,
  Building2,
  Users,
  GraduationCap,
  Calendar,
  Image as ImageIcon,
  FileSpreadsheet,
  FileText,
  Plus,
  Bell,
  LogOut,
  CheckCircle2,
  Trash2,
  Edit3,
  Save,
  RotateCcw,
  Search,
  Phone,
  ShieldCheck,
  ChevronDown,
  X,
  UserPlus,
  Sparkles,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import {
  SiteContentData,
  StudentRegistration,
  saveSiteContentToFirebase,
  createRegistrationInFirebase,
  updateRegistrationInFirebase,
  deleteRegistrationFromFirebase,
  DEFAULT_SITE_CONTENT,
  DEFAULT_TOP_BANNER_URL,
  DEFAULT_PORTAL_PREVIEW_URL,
  firebaseConfig,
} from '../firebase';
import { CourseClass, ActivityItem, TimetableSlot } from '../data/centerData';
import {
  CenterLogoMark,
  MiniAscendingBars,
  TopHeroBanner,
  ActivityIllustration,
} from './ActivityVisuals';

interface AdminDashboardProps {
  siteContent: SiteContentData;
  registrations: StudentRegistration[];
  syncedWithFirebase: boolean;
  firebaseError: string | null;
  adminEmail?: string;
  onUpdateSiteContent?: (updated: SiteContentData) => void;
  onExitAdmin: () => void;
  onLogoutAdmin?: () => void;
}

type AdminTab =
  | 'overview'
  | 'registrations'
  | 'classes'
  | 'timetable'
  | 'activities'
  | 'settings';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  siteContent,
  registrations,
  syncedWithFirebase,
  firebaseError,
  adminEmail,
  onUpdateSiteContent,
  onExitAdmin,
  onLogoutAdmin,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [savingStatus, setSavingStatus] = useState<{
    type: 'idle' | 'saving' | 'saved' | 'error';
    message?: string;
  }>({ type: 'idle' });

  // Registration filters & modals
  const [regSearch, setRegSearch] = useState('');
  const [regStatusFilter, setRegStatusFilter] = useState<string>('Tất cả');
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newStudentForm, setNewStudentForm] = useState({
    studentName: '',
    parentName: '',
    phone: '',
    grade: 'Khối 8',
    selectedClassId: siteContent.classes[0]?.id || '',
    note: '',
  });

  // Class Editor Modal state
  const [editingClass, setEditingClass] = useState<CourseClass | null>(null);
  const [isNewClass, setIsNewClass] = useState(false);

  // Activity Editor Modal state
  const [editingActivity, setEditingActivity] = useState<
    (ActivityItem & { customImageUrl?: string }) | null
  >(null);
  const [isNewActivity, setIsNewActivity] = useState(false);

  // Timetable Add Session state
  const [selectedDayForSession, setSelectedDayForSession] = useState<
    TimetableSlot['dayShort'] | null
  >(null);
  const [newSessionForm, setNewSessionForm] = useState({
    classId: siteContent.classes[0]?.id || '',
    className: siteContent.classes[0]?.name || 'Toán 8',
    subject: (siteContent.classes[0]?.subject || 'Toán') as CourseClass['subject'],
    teacher: `GV: ${siteContent.classes[0]?.teacher || 'thầy Chiến'}`,
    time: '18:00 - 20:00',
    room: 'P.101',
  });

  // Center Info & Activities draft state (for Settings & Activities tabs)
  const [centerInfoDraft, setCenterInfoDraft] = useState(siteContent.centerInfo);
  const [activitiesDraft, setActivitiesDraft] = useState(siteContent.activities);

  useEffect(() => {
    setCenterInfoDraft(siteContent.centerInfo);
  }, [siteContent.centerInfo]);

  useEffect(() => {
    setActivitiesDraft(siteContent.activities);
  }, [siteContent.activities]);

  const newRegistrationsCount = registrations.filter(
    (r) => r.status === 'Mới đăng ký'
  ).length;

  const triggerSaveSiteContent = async (
    updated: SiteContentData,
    successMsg = 'Đã lưu thay đổi lên Firebase (ttdaythemhocgioi)'
  ) => {
    if (onUpdateSiteContent) {
      onUpdateSiteContent(updated);
    }
    setSavingStatus({ type: 'saving', message: 'Đang đồng bộ lên Firebase...' });
    const res = await saveSiteContentToFirebase(updated);
    if (res.savedToCloud) {
      setSavingStatus({ type: 'saved', message: successMsg });
    } else {
      setSavingStatus({
        type: 'error',
        message: `Đã lưu cục bộ (Lưu ý quyền Firestore: ${res.error || 'Kiểm tra Firestore Rules'})`,
      });
    }
    setTimeout(() => {
      setSavingStatus((prev) => (prev.type === 'saved' ? { type: 'idle' } : prev));
    }, 4000);
  };

  // Export registrations & classes to Excel-compatible CSV (with UTF-8 BOM)
  const handleExportExcelCsv = () => {
    const headers = [
      'Mã đăng ký',
      'Họ tên Học sinh',
      'Họ tên Phụ huynh',
      'Số điện thoại',
      'Khối lớp',
      'Lớp đăng ký',
      'Lịch học',
      'Trạng thái',
      'Ghi chú PH/HS',
      'Ghi chú Admin',
      'Thời gian đăng ký',
    ];
    const rows = registrations.map((r) => [
      r.registrationCode || r.id,
      `"${(r.studentName || '').replace(/"/g, '""')}"`,
      `"${(r.parentName || '').replace(/"/g, '""')}"`,
      `"${r.phone || ''}"`,
      `"${r.grade || ''}"`,
      `"${(r.selectedClassName || '').replace(/"/g, '""')}"`,
      `"${(r.preferredSchedule || '').replace(/"/g, '""')}"`,
      `"${r.status || ''}"`,
      `"${(r.note || '').replace(/"/g, '""')}"`,
      `"${(r.adminNote || '').replace(/"/g, '""')}"`,
      `"${r.createdAt || ''}"`,
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `DS_DangKy_HocSinh_${siteContent.centerInfo.campus}_${new Date()
        .toISOString()
        .slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Approve registration & enroll student into class (+1 student count)
  const handleEnrollStudentToClass = async (reg: StudentRegistration) => {
    await updateRegistrationInFirebase(reg.id, { status: 'Đã xếp lớp' });
    const updatedClasses = siteContent.classes.map((c) =>
      c.id === reg.selectedClassId
        ? { ...c, studentsCount: Number(c.studentsCount || 0) + 1 }
        : c
    );
    const updatedStats = {
      ...siteContent.centerInfo.stats,
      students: Number(siteContent.centerInfo.stats.students || 0) + 1,
    };
    await triggerSaveSiteContent(
      {
        ...siteContent,
        classes: updatedClasses,
        centerInfo: {
          ...siteContent.centerInfo,
          stats: updatedStats,
        },
      },
      `Đã xếp lớp cho học sinh ${reg.studentName} và cập nhật sĩ số lên Firebase!`
    );
  };

  // Manual student creation from Admin
  const handleAdminAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentForm.studentName.trim() || !newStudentForm.phone.trim()) return;
    const chosenClass =
      siteContent.classes.find((c) => c.id === newStudentForm.selectedClassId) ||
      siteContent.classes[0];
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('vi-VN')} ${now.toLocaleTimeString(
      'vi-VN',
      { hour: '2-digit', minute: '2-digit' }
    )}`;

    await createRegistrationInFirebase({
      registrationCode: `AD-${Math.floor(100000 + Math.random() * 900000)}`,
      studentName: newStudentForm.studentName.trim(),
      parentName: newStudentForm.parentName.trim() || 'Phụ huynh học sinh',
      phone: newStudentForm.phone.trim(),
      grade: newStudentForm.grade,
      selectedClassId: chosenClass?.id || 'toan-8',
      selectedClassName: chosenClass
        ? `${chosenClass.name} (GV: ${chosenClass.teacher})`
        : 'Lớp tự chọn',
      preferredSchedule: chosenClass?.schedule || 'Thứ 2 - Thứ 4 - Thứ 6 (18:00 - 20:00)',
      note: newStudentForm.note.trim(),
      status: 'Đã xếp lớp',
      adminNote: 'Nhập trực tiếp từ Quản trị viên',
      createdAt: formattedDate,
      createdAtMs: Date.now(),
    });

    setNewStudentForm({
      studentName: '',
      parentName: '',
      phone: '',
      grade: 'Khối 8',
      selectedClassId: siteContent.classes[0]?.id || '',
      note: '',
    });
    setShowAddStudentModal(false);
  };

  // Open Modal to Add New Class
  const openCreateClassModal = () => {
    setIsNewClass(true);
    setEditingClass({
      id: `lop-${Date.now()}`,
      code: `LOP-${Math.floor(100 + Math.random() * 900)}`,
      subject: 'Toán',
      name: 'Toán 7',
      grade: 'Khối 7',
      teacher: 'thầy Chiến',
      teacherRole: 'Giáo viên Toán THCS',
      schedule: 'Thứ 2 - Thứ 4 - Thứ 6 (18:00 - 20:00)',
      days: ['T2', 'T4', 'T6'],
      timeSlot: '18:00 - 20:00',
      room: 'Phòng P.102 - Cơ sở Sa Thầy',
      studentsCount: 0,
      maxStudents: 20,
      status: 'Đang nhận học sinh',
      tuitionNote: 'Học thử 2 buổi đầu miễn phí',
      description:
        'Bồi dưỡng kiến thức nền tảng và nâng cao theo chương trình SGK mới, theo dõi sát sao qua Sổ liên lạc điện tử.',
      highlights: [
        'Phân dạng bài tập trọng tâm theo từng chuyên đề',
        'Điểm danh và gửi nhận xét sau mỗi buổi học',
        'Kiểm tra định kỳ hàng tháng đánh giá tiến độ',
      ],
      accentColor: 'blue',
    });
  };

  // Save Class (Create or Edit)
  const handleSaveClassModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass) return;

    const updatedClasses = isNewClass
      ? [...siteContent.classes, editingClass]
      : siteContent.classes.map((c) => (c.id === editingClass.id ? editingClass : c));

    await triggerSaveSiteContent(
      {
        ...siteContent,
        classes: updatedClasses,
        centerInfo: {
          ...siteContent.centerInfo,
          stats: {
            ...siteContent.centerInfo.stats,
            activeClasses: updatedClasses.length,
          },
        },
      },
      isNewClass
        ? `Đã thêm lớp "${editingClass.name}" lên trang chủ & Firebase!`
        : `Đã cập nhật lớp "${editingClass.name}" lên trang chủ & Firebase!`
    );
    setEditingClass(null);
  };

  const handleDeleteClass = async (classId: string, className: string) => {
    const updatedClasses = siteContent.classes.filter((c) => c.id !== classId);
    await triggerSaveSiteContent(
      {
        ...siteContent,
        classes: updatedClasses,
        centerInfo: {
          ...siteContent.centerInfo,
          stats: {
            ...siteContent.centerInfo.stats,
            activeClasses: updatedClasses.length,
          },
        },
      },
      `Đã xóa lớp "${className}" khỏi danh sách trang chủ.`
    );
  };

  // Open Modal to Add New Activity
  const openCreateActivityModal = () => {
    setIsNewActivity(true);
    setEditingActivity({
      id: `act-${Date.now()}`,
      title: 'Hoạt động học tập & rèn luyện chuyên đề mới tại Cơ sở Sa Thầy',
      category: 'Giờ học trên lớp',
      date: 'Thứ 6 · 18:00 - 20:00',
      teacher: 'GV: thầy Chiến',
      location: 'Cơ sở Sa Thầy',
      summary: 'Học sinh tích cực trao đổi và rèn kỹ năng giải bài tập vận dụng.',
      details:
        'Buổi học được thiết kế trực quan giúp học sinh nắm chắc kiến thức trọng tâm ngay trên lớp, đồng thời cập nhật kết quả lên Sổ liên lạc điện tử.',
      metrics: '100% học sinh hoàn thành bài tập tại lớp',
      illustrationType: 'math-board',
      customImageUrl:
        'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80',
    });
  };

  const handleSaveActivityModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingActivity) return;

    const cleanedActivity = {
      ...editingActivity,
      customImageUrl: (editingActivity.customImageUrl || '').trim(),
    };

    const updatedActivities = isNewActivity
      ? [cleanedActivity, ...activitiesDraft]
      : activitiesDraft.map((a) =>
          a.id === cleanedActivity.id ? cleanedActivity : a
        );

    setActivitiesDraft(updatedActivities);
    await triggerSaveSiteContent(
      {
        ...siteContent,
        centerInfo: centerInfoDraft,
        activities: updatedActivities,
      },
      'Đã cập nhật Hình ảnh & Hoạt động trên trang chủ và đồng bộ lên Firebase!'
    );
    setEditingActivity(null);
  };

  const handleDeleteActivity = async (actId: string) => {
    const updatedActivities = activitiesDraft.filter((a) => a.id !== actId);
    setActivitiesDraft(updatedActivities);
    await triggerSaveSiteContent(
      {
        ...siteContent,
        centerInfo: centerInfoDraft,
        activities: updatedActivities,
      },
      'Đã xóa hoạt động khỏi trang chủ và cập nhật Firebase.'
    );
  };

  // Timetable Management Helpers
  const handleAddSessionToDay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDayForSession) return;

    const updatedTimetable = siteContent.timetable.map((slot) => {
      if (slot.dayShort !== selectedDayForSession) return slot;
      return {
        ...slot,
        sessions: [
          ...slot.sessions,
          {
            classId: newSessionForm.classId,
            className: newSessionForm.className,
            subject: newSessionForm.subject,
            teacher: newSessionForm.teacher,
            time: newSessionForm.time,
            room: newSessionForm.room,
          },
        ],
      };
    });

    await triggerSaveSiteContent(
      {
        ...siteContent,
        timetable: updatedTimetable,
      },
      'Đã thêm ca học mới vào Thời khóa biểu trang chủ!'
    );
    setSelectedDayForSession(null);
  };

  const handleRemoveSessionFromDay = async (
    dayShort: TimetableSlot['dayShort'],
    sessionIndex: number
  ) => {
    const updatedTimetable = siteContent.timetable.map((slot) => {
      if (slot.dayShort !== dayShort) return slot;
      return {
        ...slot,
        sessions: slot.sessions.filter((_, idx) => idx !== sessionIndex),
      };
    });

    await triggerSaveSiteContent(
      {
        ...siteContent,
        timetable: updatedTimetable,
      },
      'Đã xóa ca học khỏi Thời khóa biểu.'
    );
  };

  const handleSyncTimetableFromClasses = async () => {
    const dayDefinitions: {
      dayShort: TimetableSlot['dayShort'];
      dayLabel: string;
      dateExample: string;
    }[] = [
      { dayShort: 'T2', dayLabel: 'Thứ 2', dateExample: 'Ca học trong tuần' },
      { dayShort: 'T3', dayLabel: 'Thứ 3', dateExample: 'Ca học trong tuần' },
      { dayShort: 'T4', dayLabel: 'Thứ 4', dateExample: 'Ca học trong tuần' },
      { dayShort: 'T5', dayLabel: 'Thứ 5', dateExample: 'Ca học trong tuần' },
      { dayShort: 'T6', dayLabel: 'Thứ 6', dateExample: 'Ca học trong tuần' },
      { dayShort: 'T7', dayLabel: 'Thứ 7', dateExample: 'Ca học cuối tuần' },
      { dayShort: 'CN', dayLabel: 'Chủ Nhật', dateExample: 'Ca học cuối tuần' },
    ];

    const generatedTimetable: TimetableSlot[] = dayDefinitions.map((d) => {
      const matchingClasses = siteContent.classes.filter(
        (c) => Array.isArray(c.days) && c.days.includes(d.dayShort)
      );
      return {
        dayShort: d.dayShort,
        dayLabel: d.dayLabel,
        dateExample: d.dateExample,
        sessions: matchingClasses.map((c) => ({
          classId: c.id,
          className: c.name,
          subject: c.subject,
          teacher: `GV: ${c.teacher}`,
          time: c.timeSlot || '18:00 - 20:00',
          room: c.room.split('-')[0].replace('Phòng', '').trim() || 'P.101',
        })),
      };
    });

    await triggerSaveSiteContent(
      {
        ...siteContent,
        timetable: generatedTimetable,
      },
      'Đã đồng bộ Thời khóa biểu tự động từ Danh sách Lớp học!'
    );
  };

  // Save Center Settings, Banner Info & Activity Image Links
  const handleSaveCenterSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedCenterInfo = {
      ...centerInfoDraft,
      topBannerImageUrl:
        (centerInfoDraft.topBannerImageUrl || '').trim() ||
        DEFAULT_TOP_BANNER_URL,
      portalPreviewImageUrl:
        (centerInfoDraft.portalPreviewImageUrl || '').trim() ||
        DEFAULT_PORTAL_PREVIEW_URL,
    };
    const cleanedActivities = activitiesDraft.map((act) => ({
      ...act,
      customImageUrl: (act.customImageUrl || '').trim(),
    }));
    await triggerSaveSiteContent(
      {
        ...siteContent,
        centerInfo: cleanedCenterInfo,
        activities: cleanedActivities,
      },
      'Đã cập nhật Thông tin Trung tâm, Ảnh Banner & Hình ảnh Hoạt động lên Firebase!'
    );
  };

  // Save a single Activity card's image link directly
  const handleSaveSingleActivityImageLink = async (
    actId: string,
    newImageUrl: string
  ) => {
    const trimmed = newImageUrl.trim();
    const updatedActivities = activitiesDraft.map((a) =>
      a.id === actId ? { ...a, customImageUrl: trimmed } : a
    );
    setActivitiesDraft(updatedActivities);
    await triggerSaveSiteContent(
      {
        ...siteContent,
        centerInfo: centerInfoDraft,
        activities: updatedActivities,
      },
      'Đã cập nhật link hình ảnh thẻ hoạt động và đồng bộ lên Firebase!'
    );
  };

  // Save Banner image link directly
  const handleSaveBannerLinkQuick = async () => {
    const cleanedBanner =
      (centerInfoDraft.topBannerImageUrl || '').trim() ||
      DEFAULT_TOP_BANNER_URL;
    const updatedCenterInfo = {
      ...centerInfoDraft,
      topBannerImageUrl: cleanedBanner,
    };
    setCenterInfoDraft(updatedCenterInfo);
    await triggerSaveSiteContent(
      {
        ...siteContent,
        centerInfo: updatedCenterInfo,
        activities: activitiesDraft,
      },
      'Đã cập nhật link ảnh Banner trang chủ và đồng bộ lên Firebase!'
    );
  };

  const handleResetDefaultContent = async () => {
    setCenterInfoDraft(DEFAULT_SITE_CONTENT.centerInfo);
    setActivitiesDraft(DEFAULT_SITE_CONTENT.activities);
    await triggerSaveSiteContent(
      DEFAULT_SITE_CONTENT,
      'Đã khôi phục nội dung mặc định trên Firebase!'
    );
  };

  const filteredRegistrations = registrations.filter((r) => {
    const matchesStatus =
      regStatusFilter === 'Tất cả' || r.status === regStatusFilter;
    const q = regSearch.trim().toLowerCase();
    const matchesQuery =
      !q ||
      (r.studentName || '').toLowerCase().includes(q) ||
      (r.parentName || '').toLowerCase().includes(q) ||
      (r.phone || '').toLowerCase().includes(q) ||
      (r.selectedClassName || '').toLowerCase().includes(q) ||
      (r.registrationCode || '').toLowerCase().includes(q);
    return matchesStatus && matchesQuery;
  });

  return (
    <div className="min-h-screen bg-[#AAB2BD] text-slate-900 flex flex-col lg:flex-row">
      {/* LEFT SIDEBAR — Matching exact design of attached screenshot */}
      <aside className="w-full lg:w-64 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col justify-between shrink-0">
        <div>
          {/* Brand Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center gap-3.5">
            <CenterLogoMark size="md" />
            <div className="min-w-0">
              <div className="text-[11px] font-extrabold tracking-wider text-[#005A8D] uppercase">
                HỆ THỐNG QUẢN LÝ
              </div>
              <div className="text-lg font-extrabold tracking-tight leading-tight">
                <span className="text-[#0066A2]">TRUNG </span>
                <span className="text-[#E11D48] bg-amber-100 px-1 rounded-xs">TÂM</span>
              </div>
              <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                Quản lý Lớp học, Điểm danh & Sổ liên lạc
              </div>
            </div>
          </div>

          {/* Navigation Group */}
          <div className="p-2 sm:p-3.5 flex flex-row lg:flex-col gap-1.5 lg:space-y-1.5 overflow-x-auto lg:overflow-visible max-w-full">
            <div className="hidden lg:flex px-3 py-2 items-center justify-between text-xs font-extrabold text-[#004E7C] uppercase tracking-wider">
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#0066A2]" />
                QUẢN TRỊ TRUNG TÂM
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors whitespace-nowrap shrink-0 lg:w-full cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-[#0066A2] text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100 bg-slate-50 lg:bg-transparent'
              }`}
            >
              <span className="flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 shrink-0" />
                <span>Tổng quan</span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('registrations')}
              className={`flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors whitespace-nowrap shrink-0 lg:w-full cursor-pointer ${
                activeTab === 'registrations'
                  ? 'bg-[#0066A2] text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100 bg-slate-50 lg:bg-transparent'
              }`}
            >
              <span className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 shrink-0" />
                <span>Đăng ký học</span>
              </span>
              {newRegistrationsCount > 0 && (
                <span
                  className={`text-[11px] font-mono-tabular font-extrabold px-1.5 py-0.2 rounded-md ${
                    activeTab === 'registrations'
                      ? 'bg-white text-[#0066A2]'
                      : 'bg-[#E11D48] text-white'
                  }`}
                >
                  {newRegistrationsCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('classes')}
              className={`flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors whitespace-nowrap shrink-0 lg:w-full cursor-pointer ${
                activeTab === 'classes'
                  ? 'bg-[#0066A2] text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100 bg-slate-50 lg:bg-transparent'
              }`}
            >
              <span className="flex items-center gap-2">
                <Building2 className="w-4 h-4 shrink-0" />
                <span>Lớp học</span>
              </span>
              <span className="text-xs font-mono-tabular opacity-80">
                {siteContent.classes.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('timetable')}
              className={`flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors whitespace-nowrap shrink-0 lg:w-full cursor-pointer ${
                activeTab === 'timetable'
                  ? 'bg-[#0066A2] text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100 bg-slate-50 lg:bg-transparent'
              }`}
            >
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4 shrink-0" />
                <span>Thời khóa biểu</span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('activities')}
              className={`flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors whitespace-nowrap shrink-0 lg:w-full cursor-pointer ${
                activeTab === 'activities'
                  ? 'bg-[#0066A2] text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100 bg-slate-50 lg:bg-transparent'
              }`}
            >
              <span className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 shrink-0" />
                <span>Hoạt động</span>
              </span>
              <span className="text-xs font-mono-tabular opacity-80">
                {siteContent.activities.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCenterInfoDraft(siteContent.centerInfo);
                setActiveTab('settings');
              }}
              className={`flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors whitespace-nowrap shrink-0 lg:w-full cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-[#0066A2] text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100 bg-slate-50 lg:bg-transparent'
              }`}
            >
              <span className="flex items-center gap-2">
                <Building2 className="w-4 h-4 shrink-0" />
                <span>Cấu hình & Banner</span>
              </span>
            </button>

            <a
              href={siteContent.centerInfo.managementUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 lg:w-full"
            >
              <span className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4 shrink-0 text-[#0066A2]" />
                <span>Cổng quanlytrungtam</span>
              </span>
            </a>
          </div>
        </div>

        {/* Bottom Campus Status & Support Cards matching screenshot */}
        <div className="hidden lg:block p-3.5 space-y-2.5 border-t border-slate-100">
          <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-3.5 space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase">
              <Building2 className="w-3.5 h-3.5 text-[#0066A2]" />
              <span>CƠ SỞ HOẠT ĐỘNG</span>
            </div>
            <div className="text-sm font-extrabold text-[#004E7C]">
              {siteContent.centerInfo.campus}
            </div>
            <div className="text-xs font-bold text-[#059669]">
              {syncedWithFirebase
                ? `• Trạng thái: Đồng bộ (${firebaseConfig.projectId})`
                : '• Trạng thái: Lưu cục bộ + Firebase'}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/90 bg-white px-3.5 py-2.5 flex items-center gap-2 text-xs text-slate-700">
            <Phone className="w-3.5 h-3.5 text-[#0066A2] shrink-0" />
            <span>Hỗ trợ:</span>
            <strong className="font-mono-tabular text-slate-900">
              {siteContent.centerInfo.hotline}
            </strong>
          </div>
        </div>
      </aside>

      {/* RIGHT MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP HEADER BAR matching screenshot */}
        <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#F0F7FF] border border-[#0066A2]/20 text-xs sm:text-sm text-[#004E7C]">
              <Building2 className="w-4 h-4 text-[#0066A2]" />
              <span>Cơ sở:</span>
              <strong className="font-extrabold">{siteContent.centerInfo.campus}</strong>
            </div>

            {savingStatus.type !== 'idle' && (
              <span
                className={`text-xs font-semibold px-3 py-1 rounded-lg ${
                  savingStatus.type === 'saving'
                    ? 'bg-sky-50 text-sky-700'
                    : savingStatus.type === 'saved'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-amber-50 text-amber-800'
                }`}
              >
                {savingStatus.message}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Notification Bell for New Student Registrations */}
            <button
              type="button"
              onClick={() => setActiveTab('registrations')}
              className="relative p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
              title="Xem danh sách đăng ký học mới"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 rounded-full bg-[#EA580C] text-white text-[11px] font-mono-tabular font-bold flex items-center justify-center">
                {registrations.length}
              </span>
            </button>

            <div className="h-6 w-px bg-slate-200 hidden sm:block" />

            {/* Admin Profile */}
            <div className="hidden sm:flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#059669] text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                AD
              </div>
              <div className="leading-tight">
                <div className="text-xs font-extrabold text-slate-900">
                  {adminEmail || 'admin@webapp.com'}
                </div>
                <div className="text-[11px] font-semibold text-[#0066A2]">
                  Role: admin • Cơ sở {siteContent.centerInfo.campus}
                </div>
              </div>
            </div>

            {/* Switch back to Homepage Button */}
            <button
              type="button"
              onClick={onExitAdmin}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title="Quay lại xem Trang chủ"
            >
              <span>Xem Trang Chủ</span>
            </button>

            {/* Sign Out Admin Button */}
            {onLogoutAdmin && (
              <button
                type="button"
                onClick={onLogoutAdmin}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-red-700 text-white text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                title="Đăng xuất khỏi phiên Quản trị viên"
              >
                <span>Đăng xuất</span>
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </header>

        {/* WORKSPACE CONTENT AREA */}
        <main className="flex-1 p-4 sm:p-7 space-y-6 overflow-y-auto max-w-6xl w-full mx-auto">
          {firebaseError && (
            <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-900 flex items-center justify-between gap-3">
              <span>
                <strong>Thông báo kết nối Firebase ({firebaseConfig.projectId}):</strong>{' '}
                {firebaseError}. Dữ liệu vẫn được lưu dự phòng trên trình duyệt. Hãy đảm bảo bạn đã bật Cloud Firestore và cấu hình Rules cho phép đọc/ghi trên Firebase Console.
              </span>
            </div>
          )}

          {/* TAB 1: TỔNG QUAN TRUNG TÂM (Matches attached screenshot 1:1) */}
          {activeTab === 'overview' && (
            <>
              {/* Top Admin Card with warm border */}
              <section className="bg-white rounded-3xl border-2 border-[#E6DFB8] shadow-xs p-5 sm:p-7 space-y-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-6 rounded-full bg-[#0066A2]" aria-hidden="true" />
                    <h1 className="text-lg sm:text-xl font-extrabold text-[#004E7C]">
                      Hệ Thống Quản Trị Admin
                    </h1>
                  </div>
                  <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">
                    Cập nhật hôm nay · Project: {firebaseConfig.projectId}
                  </span>
                </div>

                {/* 3 KPI Cards from screenshot */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Card 1: Danh Sách Lớp Học */}
                  <div
                    onClick={() => setActiveTab('classes')}
                    className="rounded-2xl border border-slate-200/90 bg-gradient-to-br from-[#F8FAFC] to-[#F0F7FF]/60 p-5 flex flex-col justify-between gap-4 cursor-pointer hover:border-[#0066A2] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-bold text-slate-700">
                        Danh Sách Lớp Học:
                      </span>
                      <Building2 className="w-4 h-4 text-[#0066A2]" />
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="text-3xl font-extrabold text-slate-900 font-mono-tabular">
                          {siteContent.classes.length}
                        </div>
                        <div className="text-xs font-medium text-[#0284C7] mt-2">
                          ↗ Đồng bộ Firestore
                        </div>
                      </div>
                      <MiniAscendingBars variant="blue" />
                    </div>
                  </div>

                  {/* Card 2: Giáo Viên */}
                  <div
                    onClick={() => setActiveTab('settings')}
                    className="rounded-2xl border border-slate-200/90 bg-gradient-to-br from-[#FFFBEB]/60 to-white p-5 flex flex-col justify-between gap-4 cursor-pointer hover:border-[#D97706] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-bold text-slate-700">
                        Giáo Viên:
                      </span>
                      <Users className="w-4 h-4 text-[#D97706]" />
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="text-3xl font-extrabold text-[#B45309] font-mono-tabular">
                          {siteContent.centerInfo.stats.teachers}
                        </div>
                        <div className="text-xs font-medium text-[#D97706] mt-2">
                          ↗ Tài khoản active
                        </div>
                      </div>
                      <MiniAscendingBars variant="amber" />
                    </div>
                  </div>

                  {/* Card 3: Học Sinh & Đăng Ký */}
                  <div
                    onClick={() => setActiveTab('registrations')}
                    className="rounded-2xl border border-slate-200/90 bg-gradient-to-br from-[#ECFDF5]/60 to-white p-5 flex flex-col justify-between gap-4 cursor-pointer hover:border-[#059669] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-bold text-slate-700">
                        Học Sinh & Phiếu Đăng Ký:
                      </span>
                      <GraduationCap className="w-4 h-4 text-[#059669]" />
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="text-3xl font-extrabold text-[#047857] font-mono-tabular">
                          {registrations.length}{' '}
                          <span className="text-sm font-semibold text-slate-500">
                            phiếu ({siteContent.centerInfo.stats.students} HS)
                          </span>
                        </div>
                        <div className="text-xs font-medium text-[#059669] mt-2">
                          ↗ Hồ sơ học sinh (Nhấn để xem)
                        </div>
                      </div>
                      <MiniAscendingBars variant="emerald" />
                    </div>
                  </div>
                </div>

                {/* 3 Primary Action Buttons matching screenshot */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  <button
                    type="button"
                    onClick={openCreateClassModal}
                    className="flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl bg-[#0066A2] hover:bg-[#005282] text-white text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>[+] Thêm Lớp Mới</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowAddStudentModal(true)}
                    className="flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl border-2 border-[#0066A2] bg-white hover:bg-[#F0F7FF] text-[#0066A2] text-xs sm:text-sm font-bold transition-colors cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    <span>[+] Nhập DS Học Sinh</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportExcelCsv}
                    className="flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl border-2 border-[#10B981] bg-white hover:bg-[#ECFDF5] text-[#047857] text-xs sm:text-sm font-bold transition-colors cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>[+] Xuất File Excel Tổng Hợp</span>
                  </button>
                </div>
              </section>

              {/* Active Classes Section matching bottom card of screenshot */}
              <section className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-7 space-y-5">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-6 rounded-full bg-[#0066A2]" aria-hidden="true" />
                    <h2 className="text-lg sm:text-xl font-extrabold text-[#004E7C]">
                      Danh Sách Lớp Học Đang Hoạt Động
                    </h2>
                    <span className="text-xs font-bold text-[#0066A2] bg-[#F0F7FF] border border-[#0066A2]/20 px-3 py-1 rounded-lg font-mono-tabular">
                      {siteContent.classes.length} lớp học
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('classes')}
                    className="text-xs sm:text-sm font-bold text-[#0066A2] hover:underline cursor-pointer"
                  >
                    Quản lý chi tiết lớp học →
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {siteContent.classes.map((course) => (
                    <div
                      key={course.id}
                      className="rounded-2xl border border-slate-200/90 p-5 flex flex-col justify-between gap-4 hover:border-[#0066A2]/60 transition-colors"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#0066A2] bg-[#E0F2FE] px-2.5 py-0.5 rounded-md">
                            {course.subject}
                          </span>
                          <span className="text-xs font-bold text-[#059669] bg-[#ECFDF5] border border-[#A7F3D0] px-3 py-0.5 rounded-lg font-mono-tabular">
                            {course.studentsCount} Học sinh
                          </span>
                        </div>
                        <h3 className="text-lg font-extrabold text-slate-900">
                          {course.name}
                        </h3>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                        <span>
                          GV: <strong className="text-slate-900">{course.teacher}</strong>
                        </span>
                        <span className="font-mono-tabular">{course.schedule}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Recent Registrations Quick Panel */}
              <section className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-7 space-y-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-6 rounded-full bg-[#E11D48]" aria-hidden="true" />
                    <h2 className="text-lg sm:text-xl font-extrabold text-[#004E7C]">
                      Phiếu Đăng Ký Học Từ Trang Chủ ({registrations.length})
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('registrations')}
                    className="text-xs sm:text-sm font-bold text-[#0066A2] hover:underline cursor-pointer"
                  >
                    Xem & Xử lý tất cả phiếu đăng ký →
                  </button>
                </div>

                {registrations.length === 0 ? (
                  <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-6 text-center text-xs sm:text-sm text-slate-500">
                    Chưa có phiếu đăng ký mới. Khi phụ huynh/học sinh điền Form Đăng Ký trên Trang chủ, thông tin sẽ tự động lưu lên Firebase và hiển thị ngay tại đây.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs sm:text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500">
                          <th className="py-2.5 pr-3 font-bold">Học sinh / Phụ huynh</th>
                          <th className="py-2.5 px-3 font-bold">SĐT Zalo</th>
                          <th className="py-2.5 px-3 font-bold">Lớp đăng ký</th>
                          <th className="py-2.5 px-3 font-bold">Thời gian</th>
                          <th className="py-2.5 pl-3 font-bold text-right">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {registrations.slice(0, 5).map((reg) => (
                          <tr key={reg.id} className="hover:bg-slate-50/80">
                            <td className="py-3 pr-3">
                              <div className="font-bold text-slate-900">{reg.studentName}</div>
                              <div className="text-xs text-slate-500">
                                {reg.parentName} · {reg.grade}
                              </div>
                            </td>
                            <td className="py-3 px-3 font-mono-tabular font-semibold text-[#0066A2]">
                              {reg.phone}
                            </td>
                            <td className="py-3 px-3 font-semibold text-slate-800">
                              {reg.selectedClassName}
                            </td>
                            <td className="py-3 px-3 font-mono-tabular text-xs text-slate-500">
                              {reg.createdAt}
                            </td>
                            <td className="py-3 pl-3 text-right font-bold">
                              <span
                                className={
                                  reg.status === 'Đã xếp lớp'
                                    ? 'text-[#059669]'
                                    : reg.status === 'Đã liên hệ'
                                    ? 'text-[#0284C7]'
                                    : reg.status === 'Đã hủy'
                                    ? 'text-slate-400'
                                    : 'text-[#D97706]'
                                }
                              >
                                {reg.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}

          {/* TAB 2: TIẾP NHẬN ĐĂNG KÝ HỌC TỪ FORM TRANG CHỦ */}
          {activeTab === 'registrations' && (
            <section className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-7 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-6 rounded-full bg-[#E11D48]" aria-hidden="true" />
                  <div>
                    <h1 className="text-lg sm:text-xl font-extrabold text-[#004E7C]">
                      Tiếp Nhận & Quản Lý Đăng Ký Học ({registrations.length})
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Dữ liệu đồng bộ thời gian thực từ Form Thông Tin Khách Hàng trên Trang chủ (Firestore: registrations)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setShowAddStudentModal(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0066A2] hover:bg-[#005282] text-white text-xs font-bold cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Thêm Học Sinh</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExportExcelCsv}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#10B981] text-[#047857] hover:bg-emerald-50 text-xs font-bold cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Xuất Excel (.CSV)</span>
                  </button>
                </div>
              </div>

              {/* Filter & Search Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={regSearch}
                    onChange={(e) => setRegSearch(e.target.value)}
                    placeholder="Tìm theo tên học sinh, phụ huynh, SĐT, lớp học..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-[#0066A2] focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto">
                  {['Tất cả', 'Mới đăng ký', 'Đã liên hệ', 'Đã xếp lớp', 'Đã hủy'].map(
                    (st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setRegStatusFilter(st)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          regStatusFilter === st
                            ? 'bg-[#0066A2] text-white'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {st}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Registrations Table */}
              {filteredRegistrations.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-10 text-center space-y-3">
                  <GraduationCap className="w-10 h-10 text-slate-400 mx-auto" />
                  <div className="text-sm font-bold text-slate-700">
                    Không tìm thấy phiếu đăng ký nào phù hợp
                  </div>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Các thông tin do phụ huynh và học sinh gửi từ Form Đăng Ký ở trang chủ sẽ xuất hiện trực tiếp tại đây.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredRegistrations.map((reg) => (
                    <div
                      key={reg.id}
                      className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:border-[#0066A2]/50 transition-colors"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2.5 flex-wrap text-xs">
                          <span className="font-mono-tabular font-bold text-slate-500">
                            #{reg.registrationCode || reg.id.slice(0, 8)}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono-tabular text-slate-500">
                            Đăng ký lúc: {reg.createdAt}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span
                            className={`font-bold ${
                              reg.status === 'Đã xếp lớp'
                                ? 'text-[#059669]'
                                : reg.status === 'Đã liên hệ'
                                ? 'text-[#0284C7]'
                                : reg.status === 'Đã hủy'
                                ? 'text-slate-400'
                                : 'text-[#D97706]'
                            }`}
                          >
                            Trạng thái: {reg.status}
                          </span>
                        </div>

                        <div className="text-base font-extrabold text-slate-900">
                          Học sinh: {reg.studentName}{' '}
                          <span className="text-xs font-semibold text-slate-500">
                            ({reg.grade})
                          </span>
                        </div>

                        <div className="text-xs sm:text-sm text-slate-700 flex flex-wrap items-center gap-x-4 gap-y-1">
                          <span>
                            Phụ huynh: <strong>{reg.parentName}</strong>
                          </span>
                          <span>
                            SĐT Zalo:{' '}
                            <a
                              href={`tel:${reg.phone}`}
                              className="font-mono-tabular font-bold text-[#0066A2] hover:underline"
                            >
                              {reg.phone}
                            </a>
                          </span>
                          <span>
                            Lớp đăng ký:{' '}
                            <strong className="text-[#004E7C]">
                              {reg.selectedClassName}
                            </strong>
                          </span>
                          <span className="font-mono-tabular text-xs text-slate-500">
                            Lịch: {reg.preferredSchedule}
                          </span>
                        </div>

                        {reg.note && (
                          <div className="text-xs text-slate-600 bg-slate-50 rounded-xl px-3 py-2 border border-slate-200/60 mt-1">
                            <strong>Ghi chú từ PH/HS:</strong> {reg.note}
                          </div>
                        )}
                      </div>

                      {/* Admin Status Controls */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                        <select
                          aria-label="Cập nhật trạng thái đăng ký"
                          value={reg.status}
                          onChange={(e) =>
                            updateRegistrationInFirebase(reg.id, {
                              status: e.target.value as StudentRegistration['status'],
                            })
                          }
                          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:border-[#0066A2] focus:outline-none"
                        >
                          <option value="Mới đăng ký">Mới đăng ký</option>
                          <option value="Đã liên hệ">Đã liên hệ tư vấn</option>
                          <option value="Đã xếp lớp">Đã xếp lớp</option>
                          <option value="Đã hủy">Đã hủy</option>
                        </select>

                        {reg.status !== 'Đã xếp lớp' && (
                          <button
                            type="button"
                            onClick={() => handleEnrollStudentToClass(reg)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold cursor-pointer"
                            title="Duyệt vào lớp và tự động +1 sĩ số lớp học"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Duyệt & +1 Sĩ số</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => deleteRegistrationFromFirebase(reg.id)}
                          className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 cursor-pointer"
                          title="Xóa phiếu đăng ký"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* TAB 3: QUẢN LÝ LỚP HỌC (Thay đổi danh sách lớp hiển thị ở trang chủ) */}
          {activeTab === 'classes' && (
            <section className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-7 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-6 rounded-full bg-[#0066A2]" aria-hidden="true" />
                  <div>
                    <h1 className="text-lg sm:text-xl font-extrabold text-[#004E7C]">
                      Quản Lý Các Lớp Học Hiển Thị Trên Trang Chủ ({siteContent.classes.length})
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Thêm lớp mới, chỉnh sửa giáo viên, lịch học, sĩ số hoặc xóa lớp học (Đồng bộ trực tiếp với Trang chủ)
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={openCreateClassModal}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0066A2] hover:bg-[#005282] text-white text-xs sm:text-sm font-bold cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm Lớp Học Mới</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {siteContent.classes.map((course) => (
                  <div
                    key={course.id}
                    className="rounded-2xl border border-slate-200 p-5 flex flex-col justify-between gap-4 bg-slate-50/40"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-[#0066A2] uppercase">
                          Môn {course.subject} · {course.grade} · Mã: {course.code}
                        </span>
                        <span className="text-[#059669] font-mono-tabular">
                          {course.studentsCount}/{course.maxStudents} Học sinh
                        </span>
                      </div>
                      <h3 className="text-lg font-extrabold text-slate-900">
                        {course.name}
                      </h3>
                      <p className="text-xs text-slate-600 line-clamp-2">
                        {course.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-200/80 space-y-3">
                      <div className="flex items-center justify-between text-xs text-slate-700">
                        <span>
                          GV: <strong>{course.teacher}</strong>
                        </span>
                        <span className="font-mono-tabular">{course.schedule}</span>
                      </div>

                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsNewClass(false);
                            setEditingClass({ ...course });
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-[#0066A2]" />
                          <span>Chỉnh sửa</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteClass(course.id, course.name)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-xs font-bold text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Xóa</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* TAB 4: QUẢN LÝ THỜI KHÓA BIỂU TRANG CHỦ */}
          {activeTab === 'timetable' && (
            <section className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-7 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-6 rounded-full bg-[#0066A2]" aria-hidden="true" />
                  <div>
                    <h1 className="text-lg sm:text-xl font-extrabold text-[#004E7C]">
                      Quản Lý Thời Khóa Biểu Các Lớp (Thứ 2 — Chủ Nhật)
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Thêm hoặc xóa từng ca học trong tuần, hoặc tự động đồng bộ từ Danh sách Lớp học
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSyncTimetableFromClasses}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#0066A2] bg-[#F0F7FF] hover:bg-[#0066A2] hover:text-white text-[#005A8D] text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Đồng bộ tự động từ Danh sách Lớp</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
                {siteContent.timetable.map((day) => (
                  <div
                    key={day.dayShort}
                    className="rounded-2xl border border-slate-200 bg-slate-50/60 flex flex-col overflow-hidden"
                  >
                    <div className="bg-[#0066A2] text-white px-3 py-2 flex items-center justify-between">
                      <span className="text-xs font-extrabold">{day.dayLabel}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedDayForSession(day.dayShort)}
                        className="text-[11px] bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded-md font-bold cursor-pointer"
                        title={`Thêm ca học vào ${day.dayLabel}`}
                      >
                        + Thêm ca
                      </button>
                    </div>

                    <div className="p-2.5 flex-1 flex flex-col gap-2">
                      {day.sessions.length === 0 ? (
                        <div className="text-xs text-slate-400 py-5 text-center">
                          Trống
                        </div>
                      ) : (
                        day.sessions.map((s, idx) => (
                          <div
                            key={`${day.dayShort}-${idx}`}
                            className="rounded-xl bg-white border border-slate-200 p-2.5 space-y-1 relative group"
                          >
                            <div className="flex items-center justify-between text-[11px] font-bold text-[#0066A2]">
                              <span>{s.subject}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleRemoveSessionFromDay(day.dayShort, idx)
                                }
                                className="text-slate-400 hover:text-rose-600 cursor-pointer"
                                title="Xóa ca học này"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="text-xs font-extrabold text-slate-900">
                              {s.className}
                            </div>
                            <div className="text-[11px] text-slate-600">{s.teacher}</div>
                            <div className="text-[11px] font-mono-tabular text-[#059669] font-semibold">
                              {s.time} · {s.room}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* TAB 5: QUẢN LÝ HÌNH ẢNH & HOẠT ĐỘNG */}
          {activeTab === 'activities' && (
            <section className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-7 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-6 rounded-full bg-[#0066A2]" aria-hidden="true" />
                  <div>
                    <h1 className="text-lg sm:text-xl font-extrabold text-[#004E7C]">
                      Quản Lý Hình Ảnh Banner & Hoạt Động Trung Tâm ({activitiesDraft.length})
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Cung cấp link hình ảnh (URL ảnh hoặc link chia sẻ Google Drive) cho từng thẻ — khi thay đổi link và lưu, ảnh trên Trang chủ sẽ cập nhật ngay và đồng bộ lên Firebase
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleSaveCenterSettings}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs sm:text-sm font-bold cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Lưu Tất Cả Link Ảnh Lên Firebase</span>
                  </button>
                  <button
                    type="button"
                    onClick={openCreateActivityModal}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0066A2] hover:bg-[#005282] text-white text-xs sm:text-sm font-bold cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Thêm Thẻ Hoạt Động Mới</span>
                  </button>
                </div>
              </div>

              {/* Quick Banner Image Link Config Card */}
              <div className="rounded-2xl border-2 border-[#E6DFB8] bg-[#FFFBEB]/50 p-4 sm:p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-extrabold uppercase tracking-wider text-[#B45309]">
                      THẺ BANNER CHÍNH TRÊN CÙNG TRANG CHỦ
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5">
                      Dán link ảnh Google Drive hoặc URL ảnh trực tiếp để thay đổi ngay ảnh Banner đầu trang
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveBannerLinkQuick}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0066A2] hover:bg-[#005282] text-white text-xs font-bold cursor-pointer self-start sm:self-auto shrink-0"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Lưu Link Banner</span>
                  </button>
                </div>

                <input
                  type="text"
                  value={centerInfoDraft.topBannerImageUrl ?? DEFAULT_TOP_BANNER_URL}
                  onChange={(e) =>
                    setCenterInfoDraft({
                      ...centerInfoDraft,
                      topBannerImageUrl: e.target.value,
                    })
                  }
                  placeholder="https://drive.google.com/file/d/... hoặc https://..."
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-mono-tabular text-slate-900 focus:border-[#0066A2] focus:outline-none"
                />

                <div className="max-h-56 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <TopHeroBanner
                    bannerUrl={centerInfoDraft.topBannerImageUrl || DEFAULT_TOP_BANNER_URL}
                    altText={centerInfoDraft.fullTitle}
                  />
                </div>
              </div>

              {/* Activity Cards Grid with Live Image Preview & Direct Link Input */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {activitiesDraft.map((act, index) => (
                  <div
                    key={act.id}
                    className="rounded-2xl border border-slate-200 overflow-hidden flex flex-col justify-between bg-slate-50/40 shadow-2xs"
                  >
                    {/* Live Preview of the Activity Card Image */}
                    <div className="h-52 w-full overflow-hidden border-b border-slate-200 bg-slate-100 group">
                      <ActivityIllustration
                        type={act.illustrationType}
                        title={act.title}
                        customImageUrl={act.customImageUrl}
                      />
                    </div>

                    <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-4 bg-white">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-[#0066A2]">
                            Thẻ #{index + 1} · {act.category}
                          </span>
                          <span className="text-slate-500 font-mono-tabular">
                            {act.date}
                          </span>
                        </div>

                        <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                          {act.title}
                        </h3>

                        {/* Direct Image Link Configuration Input for this Card */}
                        <div className="rounded-xl bg-slate-50 border border-slate-200/90 p-3 space-y-2">
                          <label className="block text-[11px] font-extrabold text-[#004E7C] uppercase tracking-wider">
                            Link hình ảnh hiển thị cho thẻ này (URL ảnh / Google Drive):
                          </label>
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <input
                              type="text"
                              value={act.customImageUrl || ''}
                              onChange={(e) => {
                                const newUrl = e.target.value;
                                setActivitiesDraft((prev) =>
                                  prev.map((item) =>
                                    item.id === act.id
                                      ? { ...item, customImageUrl: newUrl }
                                      : item
                                  )
                                );
                              }}
                              placeholder="Dán link ảnh Google Drive hoặc URL ảnh..."
                              className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-mono-tabular text-slate-900 focus:border-[#0066A2] focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                handleSaveSingleActivityImageLink(
                                  act.id,
                                  act.customImageUrl || ''
                                )
                              }
                              className="inline-flex items-center justify-center gap-1 px-3.5 py-2 rounded-xl bg-[#0066A2] hover:bg-[#005282] text-white text-xs font-bold shrink-0 cursor-pointer"
                            >
                              <Save className="w-3.5 h-3.5" />
                              <span>Lưu link ảnh</span>
                            </button>
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 line-clamp-2">
                          {act.summary}
                        </p>
                        <div className="text-xs font-semibold text-[#059669]">
                          {act.metrics}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between">
                        <span className="text-xs text-slate-500">{act.teacher}</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setIsNewActivity(false);
                              setEditingActivity({ ...act });
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-[#0066A2]" />
                            <span>Sửa nội dung & ảnh</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteActivity(act.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-xs font-bold text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Xóa</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* TAB 6: THÔNG TIN TRƯỜNG & BANNER TRANG CHỦ */}
          {activeTab === 'settings' && (
            <section className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-7 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-6 rounded-full bg-[#0066A2]" aria-hidden="true" />
                  <div>
                    <h1 className="text-lg sm:text-xl font-extrabold text-[#004E7C]">
                      Cấu Hình Thông Tin Trung Tâm, Ảnh Banner & Hình Ảnh Hoạt Động
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Cung cấp link ảnh cho Banner và các thẻ Hình ảnh Hoạt động — khi thay đổi link, ảnh sẽ thay đổi theo và đồng bộ trực tiếp lên Firebase
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleResetDefaultContent}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer self-start sm:self-auto"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Khôi phục mặc định</span>
                </button>
              </div>

              <form onSubmit={handleSaveCenterSettings} className="space-y-6">
                {/* BLOCK 1: CẤU HÌNH HÌNH ẢNH BANNER TRANG CHỦ */}
                <div className="rounded-2xl border-2 border-[#0066A2]/25 bg-[#F8FAFC] p-4 sm:p-5 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-sm sm:text-base font-extrabold text-[#004E7C] flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-[#0066A2]" />
                      <span>1. Cấu Hình Link Hình Ảnh Banner Trang Chủ</span>
                    </h2>
                    <span className="text-[11px] font-bold text-[#059669]">
                      Xem trước tự động khi đổi link
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Link ảnh Banner chính trên cùng (Hỗ trợ link chia sẻ Google Drive hoặc URL ảnh trực tiếp)
                    </label>
                    <input
                      type="text"
                      value={
                        centerInfoDraft.topBannerImageUrl ??
                        DEFAULT_TOP_BANNER_URL
                      }
                      onChange={(e) =>
                        setCenterInfoDraft({
                          ...centerInfoDraft,
                          topBannerImageUrl: e.target.value,
                        })
                      }
                      placeholder="https://drive.google.com/file/d/... hoặc https://..."
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-mono-tabular"
                    />
                  </div>

                  {/* Live Preview of Banner */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Xem trước ảnh Banner hiện tại:
                    </div>
                    <TopHeroBanner
                      bannerUrl={
                        centerInfoDraft.topBannerImageUrl ||
                        DEFAULT_TOP_BANNER_URL
                      }
                      altText={centerInfoDraft.fullTitle}
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-200/80">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Link ảnh minh họa thẻ Hệ thống Quản lý Trung tâm (Mục 5 Trang chủ)
                    </label>
                    <input
                      type="text"
                      value={
                        centerInfoDraft.portalPreviewImageUrl ??
                        DEFAULT_PORTAL_PREVIEW_URL
                      }
                      onChange={(e) =>
                        setCenterInfoDraft({
                          ...centerInfoDraft,
                          portalPreviewImageUrl: e.target.value,
                        })
                      }
                      placeholder="https://drive.google.com/file/d/... hoặc /assets/..."
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs sm:text-sm font-mono-tabular"
                    />
                  </div>
                </div>

                {/* BLOCK 2: CẤU HÌNH LINK HÌNH ẢNH CHO CÁC THẺ HOẠT ĐỘNG HỌC TẬP & RÈN LUYỆN */}
                <div className="rounded-2xl border-2 border-[#059669]/25 bg-[#ECFDF5]/35 p-4 sm:p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h2 className="text-sm sm:text-base font-extrabold text-[#064E29] flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-[#059669]" />
                        <span>
                          2. Cấu Hình Link Hình Ảnh Các Thẻ Hoạt Động Học Tập & Rèn Luyện ({activitiesDraft.length} thẻ)
                        </span>
                      </h2>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Mỗi thẻ hiển thị hình ảnh lấy trực tiếp từ link bên dưới. Khi thay đổi link, ảnh xem trước và ảnh ngoài Trang chủ sẽ thay đổi theo.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activitiesDraft.map((act, idx) => (
                      <div
                        key={act.id}
                        className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs flex flex-col"
                      >
                        <div className="h-44 w-full overflow-hidden border-b border-slate-200 bg-slate-100">
                          <ActivityIllustration
                            type={act.illustrationType}
                            title={act.title}
                            customImageUrl={act.customImageUrl}
                          />
                        </div>
                        <div className="p-3.5 space-y-2">
                          <div className="text-xs font-extrabold text-slate-900 line-clamp-1">
                            Thẻ #{idx + 1}: {act.title}
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-[#0066A2] mb-1">
                              Link hình ảnh của thẻ #{idx + 1} (URL / Google Drive):
                            </label>
                            <input
                              type="text"
                              value={act.customImageUrl || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setActivitiesDraft((prev) =>
                                  prev.map((item) =>
                                    item.id === act.id
                                      ? { ...item, customImageUrl: val }
                                      : item
                                  )
                                );
                              }}
                              placeholder="https://drive.google.com/file/d/... hoặc https://..."
                              className="w-full rounded-xl border border-slate-300 bg-slate-50 focus:bg-white px-3 py-2 text-xs font-mono-tabular text-slate-900 focus:border-[#0066A2] focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* BLOCK 3: THÔNG TIN CHUNG CỦA TRUNG TÂM */}
                <div className="space-y-4 pt-2">
                  <h2 className="text-sm sm:text-base font-extrabold text-[#004E7C]">
                    3. Thông Tin Chung & Nội Dung Giới Thiệu Trung Tâm
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Tên cơ sở hoạt động
                      </label>
                      <input
                        type="text"
                        value={centerInfoDraft.campus}
                        onChange={(e) =>
                          setCenterInfoDraft({
                            ...centerInfoDraft,
                            campus: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Số điện thoại Hotline hỗ trợ
                      </label>
                      <input
                        type="text"
                        value={centerInfoDraft.hotline}
                        onChange={(e) =>
                          setCenterInfoDraft({
                            ...centerInfoDraft,
                            hotline: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-mono-tabular font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tiêu đề Trung tâm (Hiển thị đầu Banner)
                    </label>
                    <input
                      type="text"
                      value={centerInfoDraft.fullTitle}
                      onChange={(e) =>
                        setCenterInfoDraft({
                          ...centerInfoDraft,
                          fullTitle: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Dòng mô tả phụ dưới tiêu đề Banner
                    </label>
                    <input
                      type="text"
                      value={centerInfoDraft.heroSubtitle}
                      onChange={(e) =>
                        setCenterInfoDraft({
                          ...centerInfoDraft,
                          heroSubtitle: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Thông điệp chính trên Banner (Headline lớn)
                    </label>
                    <input
                      type="text"
                      value={centerInfoDraft.heroHeadline}
                      onChange={(e) =>
                        setCenterInfoDraft({
                          ...centerInfoDraft,
                          heroHeadline: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Đoạn văn giới thiệu chi tiết trên Banner
                    </label>
                    <textarea
                      rows={3}
                      value={centerInfoDraft.heroDescription}
                      onChange={(e) =>
                        setCenterInfoDraft({
                          ...centerInfoDraft,
                          heroDescription: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Địa chỉ Trung tâm
                      </label>
                      <input
                        type="text"
                        value={centerInfoDraft.address}
                        onChange={(e) =>
                          setCenterInfoDraft({
                            ...centerInfoDraft,
                            address: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Giờ làm việc
                      </label>
                      <input
                        type="text"
                        value={centerInfoDraft.workingHours}
                        onChange={(e) =>
                          setCenterInfoDraft({
                            ...centerInfoDraft,
                            workingHours: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Link Hệ thống quản lý trung tâm
                      </label>
                      <input
                        type="text"
                        value={centerInfoDraft.managementUrl}
                        onChange={(e) =>
                          setCenterInfoDraft({
                            ...centerInfoDraft,
                            managementUrl: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-mono-tabular"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Số lượng Giáo viên (Thẻ thống kê)
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={centerInfoDraft.stats.teachers}
                        onChange={(e) =>
                          setCenterInfoDraft({
                            ...centerInfoDraft,
                            stats: {
                              ...centerInfoDraft.stats,
                              teachers: Number(e.target.value) || 0,
                            },
                          })
                        }
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-mono-tabular font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Số lượng Học sinh đang học (Thẻ thống kê)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={centerInfoDraft.stats.students}
                        onChange={(e) =>
                          setCenterInfoDraft({
                            ...centerInfoDraft,
                            stats: {
                              ...centerInfoDraft.stats,
                              students: Number(e.target.value) || 0,
                            },
                          })
                        }
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-mono-tabular font-bold"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0066A2] hover:bg-[#005282] text-white text-sm font-extrabold shadow-xs cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Lưu Thay Đổi Lên Firebase</span>
                  </button>
                </div>
              </form>
            </section>
          )}
        </main>
      </div>

      {/* MODAL: ADD / EDIT CLASS */}
      {editingClass && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-xl border border-slate-200 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-extrabold text-[#004E7C]">
                {isNewClass ? 'Thêm Lớp Học Mới' : `Chỉnh Sửa Lớp: ${editingClass.name}`}
              </h3>
              <button
                type="button"
                onClick={() => setEditingClass(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClassModal} className="space-y-3.5 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tên lớp học *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingClass.name}
                    onChange={(e) =>
                      setEditingClass({ ...editingClass, name: e.target.value })
                    }
                    placeholder="VD: Toán 8"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Môn học
                  </label>
                  <select
                    value={editingClass.subject}
                    onChange={(e) =>
                      setEditingClass({
                        ...editingClass,
                        subject: e.target.value as CourseClass['subject'],
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-semibold"
                  >
                    <option value="Toán">Toán</option>
                    <option value="Lý">Lý</option>
                    <option value="KHTN">KHTN</option>
                    <option value="Tiếng Anh">Tiếng Anh</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Khối lớp
                  </label>
                  <input
                    type="text"
                    value={editingClass.grade}
                    onChange={(e) =>
                      setEditingClass({ ...editingClass, grade: e.target.value })
                    }
                    placeholder="VD: Khối 8"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Giáo viên phụ trách *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingClass.teacher}
                    onChange={(e) =>
                      setEditingClass({ ...editingClass, teacher: e.target.value })
                    }
                    placeholder="VD: thầy Chiến / cô Yên"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phòng học
                  </label>
                  <input
                    type="text"
                    value={editingClass.room}
                    onChange={(e) =>
                      setEditingClass({ ...editingClass, room: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Lịch học hiển thị *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingClass.schedule}
                    onChange={(e) =>
                      setEditingClass({ ...editingClass, schedule: e.target.value })
                    }
                    placeholder="Thứ 2 - Thứ 4 - Thứ 6 (18:00 - 20:00)"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono-tabular"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Sĩ số hiện tại / Tối đa
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={0}
                      value={editingClass.studentsCount}
                      onChange={(e) =>
                        setEditingClass({
                          ...editingClass,
                          studentsCount: Number(e.target.value) || 0,
                        })
                      }
                      className="w-1/2 rounded-xl border border-slate-300 px-2.5 py-2 font-mono-tabular font-bold"
                    />
                    <span>/</span>
                    <input
                      type="number"
                      min={1}
                      value={editingClass.maxStudents}
                      onChange={(e) =>
                        setEditingClass({
                          ...editingClass,
                          maxStudents: Number(e.target.value) || 20,
                        })
                      }
                      className="w-1/2 rounded-xl border border-slate-300 px-2.5 py-2 font-mono-tabular"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mô tả nội dung lớp học
                </label>
                <textarea
                  rows={3}
                  value={editingClass.description}
                  onChange={(e) =>
                    setEditingClass({ ...editingClass, description: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingClass(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#0066A2] hover:bg-[#005282] text-white text-xs font-bold cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Lưu Lớp Học</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT ACTIVITY */}
      {editingActivity && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-xl border border-slate-200 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-extrabold text-[#004E7C]">
                {isNewActivity ? 'Thêm Hoạt Động Mới' : 'Chỉnh Sửa Hoạt Động'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingActivity(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveActivityModal} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tiêu đề hoạt động *
                </label>
                <input
                  type="text"
                  required
                  value={editingActivity.title}
                  onChange={(e) =>
                    setEditingActivity({ ...editingActivity, title: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Danh mục
                  </label>
                  <select
                    value={editingActivity.category}
                    onChange={(e) =>
                      setEditingActivity({
                        ...editingActivity,
                        category: e.target.value as ActivityItem['category'],
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-semibold"
                  >
                    <option value="Giờ học trên lớp">Giờ học trên lớp</option>
                    <option value="Thực hành & Thí nghiệm">Thực hành & Thí nghiệm</option>
                    <option value="Kiểm tra & Đánh giá">Kiểm tra & Đánh giá</option>
                    <option value="Sổ liên lạc & Phụ huynh">Sổ liên lạc & Phụ huynh</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Giáo viên / Phụ trách
                  </label>
                  <input
                    type="text"
                    value={editingActivity.teacher}
                    onChange={(e) =>
                      setEditingActivity({ ...editingActivity, teacher: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Thời gian
                  </label>
                  <input
                    type="text"
                    value={editingActivity.date}
                    onChange={(e) =>
                      setEditingActivity({ ...editingActivity, date: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 space-y-3">
                <div>
                  <label className="block text-xs font-extrabold text-[#004E7C] mb-1">
                    Link hình ảnh hiển thị trên thẻ (Hỗ trợ link chia sẻ Google Drive hoặc URL ảnh) *
                  </label>
                  <input
                    type="text"
                    value={editingActivity.customImageUrl || ''}
                    onChange={(e) =>
                      setEditingActivity({
                        ...editingActivity,
                        customImageUrl: e.target.value,
                      })
                    }
                    placeholder="https://drive.google.com/file/d/... hoặc https://..."
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-mono-tabular"
                  />
                </div>

                <div className="h-44 w-full rounded-xl overflow-hidden border border-slate-200 bg-white">
                  <ActivityIllustration
                    type={editingActivity.illustrationType}
                    title={editingActivity.title}
                    customImageUrl={editingActivity.customImageUrl}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tóm tắt ngắn (Hiển thị trên thẻ)
                </label>
                <textarea
                  rows={2}
                  value={editingActivity.summary}
                  onChange={(e) =>
                    setEditingActivity({ ...editingActivity, summary: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nội dung chi tiết (Khi nhấn Xem chi tiết)
                </label>
                <textarea
                  rows={3}
                  value={editingActivity.details}
                  onChange={(e) =>
                    setEditingActivity({ ...editingActivity, details: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kết quả / Điểm nhấn đạt được
                </label>
                <input
                  type="text"
                  value={editingActivity.metrics}
                  onChange={(e) =>
                    setEditingActivity({ ...editingActivity, metrics: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingActivity(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#0066A2] hover:bg-[#005282] text-white text-xs font-bold cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Lưu Hoạt Động</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD SESSION TO TIMETABLE DAY */}
      {selectedDayForSession && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-[#004E7C]">
                Thêm Ca Học Vào {selectedDayForSession}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedDayForSession(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSessionToDay} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Chọn nhanh từ Lớp đang hoạt động
                </label>
                <select
                  value={newSessionForm.classId}
                  onChange={(e) => {
                    const found = siteContent.classes.find(
                      (c) => c.id === e.target.value
                    );
                    if (found) {
                      setNewSessionForm({
                        classId: found.id,
                        className: found.name,
                        subject: found.subject,
                        teacher: `GV: ${found.teacher}`,
                        time: found.timeSlot || '18:00 - 20:00',
                        room:
                          found.room.split('-')[0].replace('Phòng', '').trim() ||
                          'P.101',
                      });
                    }
                  }}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 font-semibold"
                >
                  {siteContent.classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (GV: {c.teacher})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tên lớp hiển thị
                  </label>
                  <input
                    type="text"
                    required
                    value={newSessionForm.className}
                    onChange={(e) =>
                      setNewSessionForm({ ...newSessionForm, className: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Giáo viên
                  </label>
                  <input
                    type="text"
                    required
                    value={newSessionForm.teacher}
                    onChange={(e) =>
                      setNewSessionForm({ ...newSessionForm, teacher: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Khung giờ
                  </label>
                  <input
                    type="text"
                    required
                    value={newSessionForm.time}
                    onChange={(e) =>
                      setNewSessionForm({ ...newSessionForm, time: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono-tabular"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phòng học
                  </label>
                  <input
                    type="text"
                    required
                    value={newSessionForm.room}
                    onChange={(e) =>
                      setNewSessionForm({ ...newSessionForm, room: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono-tabular"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDayForSession(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0066A2] text-white text-xs font-bold cursor-pointer"
                >
                  Thêm Ca Học
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADMIN MANUAL STUDENT ADD */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-[#004E7C]">
                [+] Nhập Hồ Sơ Học Sinh Mới
              </h3>
              <button
                type="button"
                onClick={() => setShowAddStudentModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdminAddStudent} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Họ và tên Học sinh *
                </label>
                <input
                  type="text"
                  required
                  value={newStudentForm.studentName}
                  onChange={(e) =>
                    setNewStudentForm({ ...newStudentForm, studentName: e.target.value })
                  }
                  placeholder="Ví dụ: Trần Bảo Ngọc"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Họ tên Phụ huynh
                  </label>
                  <input
                    type="text"
                    value={newStudentForm.parentName}
                    onChange={(e) =>
                      setNewStudentForm({ ...newStudentForm, parentName: e.target.value })
                    }
                    placeholder="Ví dụ: Anh Minh"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số điện thoại *
                  </label>
                  <input
                    type="tel"
                    required
                    value={newStudentForm.phone}
                    onChange={(e) =>
                      setNewStudentForm({ ...newStudentForm, phone: e.target.value })
                    }
                    placeholder="0912..."
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono-tabular"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Khối lớp
                  </label>
                  <select
                    value={newStudentForm.grade}
                    onChange={(e) =>
                      setNewStudentForm({ ...newStudentForm, grade: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  >
                    <option value="Khối 6">Lớp 6</option>
                    <option value="Khối 7">Lớp 7</option>
                    <option value="Khối 8">Lớp 8</option>
                    <option value="Khối 9">Lớp 9</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Xếp vào lớp
                  </label>
                  <select
                    value={newStudentForm.selectedClassId}
                    onChange={(e) =>
                      setNewStudentForm({
                        ...newStudentForm,
                        selectedClassId: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-semibold"
                  >
                    {siteContent.classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.teacher})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ghi chú học sinh
                </label>
                <input
                  type="text"
                  value={newStudentForm.note}
                  onChange={(e) =>
                    setNewStudentForm({ ...newStudentForm, note: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0066A2] text-white text-xs font-bold cursor-pointer"
                >
                  Lưu Hồ Sơ Lên Firebase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
