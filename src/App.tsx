/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  Phone,
  GraduationCap,
  Users,
  BookOpen,
  Calendar,
  Clock,
  ExternalLink,
  CheckCircle2,
  ArrowDown,
  ArrowRight,
  UserCheck,
  X,
  Send,
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import { CourseClass, ActivityItem } from './data/centerData';
import {
  CenterLogoMark,
  MiniAscendingBars,
  ActivityIllustration,
  TopHeroBanner,
  HocGioiWordmark,
  HocGioiAccentBar,
  resolveImageCandidates,
} from './components/ActivityVisuals';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminLoginPage } from './components/AdminLoginPage';
import {
  SiteContentData,
  StudentRegistration,
  getCachedSiteContent,
  getCachedRegistrations,
  subscribeToSiteContent,
  subscribeToRegistrations,
  createRegistrationInFirebase,
  subscribeToAdminAuth,
  logoutAdminFromFirebase,
  DEFAULT_TOP_BANNER_URL,
  DEFAULT_PORTAL_PREVIEW_URL,
} from './firebase';

function isInitialAdminRoute(): boolean {
  return (
    window.location.pathname.endsWith('/admin.html') ||
    window.location.hash === '#admin'
  );
}

export default function App() {
  // View mode: 'home' (Public Single-Page Homepage) or 'admin' (Admin Login / Management Portal)
  const [viewMode, setViewMode] = useState<'home' | 'admin'>(() =>
    isInitialAdminRoute() ? 'admin' : 'home'
  );

  // Firebase Admin Authentication & Firestore `users/{uid}` role === 'admin' Route Guard State
  const [isAdminAuthenticated, setIsAdminAuthenticated] =
    useState<boolean>(false);
  const [adminEmail, setAdminEmail] = useState<string>('');
  const [isCheckingAdminAuth, setIsCheckingAdminAuth] = useState<boolean>(true);

  // Real-time Firebase State (site_config/homepage & registrations collection)
  const [siteContent, setSiteContent] = useState<SiteContentData>(() =>
    getCachedSiteContent()
  );
  const [registrations, setRegistrations] = useState<StudentRegistration[]>(() =>
    getCachedRegistrations()
  );
  const [syncedWithFirebase, setSyncedWithFirebase] = useState<boolean>(false);
  const [firebaseError, setFirebaseError] = useState<string | null>(null);

  // Filter states for interactive sections on Homepage
  const [subjectFilter, setSubjectFilter] = useState<
    'Tất cả' | 'Toán' | 'Lý' | 'KHTN' | 'Tiếng Anh'
  >('Tất cả');
  const [activityCategory, setActivityCategory] = useState<string>('Tất cả');
  const [timetableTeacherFilter, setTimetableTeacherFilter] =
    useState<string>('Tất cả');

  // Modals for viewing class details or activity details
  const [selectedClassModal, setSelectedClassModal] =
    useState<CourseClass | null>(null);
  const [selectedActivityModal, setSelectedActivityModal] = useState<
    (ActivityItem & { customImageUrl?: string }) | null
  >(null);
  const [adminScreenshotError, setAdminScreenshotError] = useState(false);

  // Customer Registration Form state
  const [studentName, setStudentName] = useState('');
  const [parentName, setParentName] = useState('');
  const [phone, setPhone] = useState('');
  const [grade, setGrade] = useState('Khối 8');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [preferredSchedule, setPreferredSchedule] = useState(
    'Thứ 2 - Thứ 4 - Thứ 6 (18:00 - 20:00)'
  );
  const [note, setNote] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [submittedEntry, setSubmittedEntry] =
    useState<StudentRegistration | null>(null);
  const [highlightForm, setHighlightForm] = useState(false);

  const formSectionRef = useRef<HTMLElement | null>(null);
  const studentInputRef = useRef<HTMLInputElement | null>(null);

  // Subscribe to Firebase Auth & verify `users/{uid}.role === 'admin'`
  useEffect(() => {
    const unsubAuth = subscribeToAdminAuth(({ user, isAdmin, checking }) => {
      setIsCheckingAdminAuth(checking);
      setIsAdminAuthenticated(isAdmin);
      setAdminEmail(user?.email || '');
    });
    return () => unsubAuth();
  }, []);

  // Subscribe to Firestore real-time data on mount (and re-subscribe when admin auth changes)
  useEffect(() => {
    const unsubSite = subscribeToSiteContent(
      (data, synced) => {
        setSiteContent(data);
        setSyncedWithFirebase(synced);
        if (synced) setFirebaseError(null);
      },
      (errMsg) => {
        setFirebaseError(errMsg);
      }
    );

    const unsubRegs = subscribeToRegistrations(
      (list, synced) => {
        setRegistrations(list);
        if (synced) setSyncedWithFirebase(true);
      },
      (errMsg) => {
        if (isAdminAuthenticated) {
          setFirebaseError((prev) => prev || errMsg);
        }
      }
    );

    const handleRouteChange = () => {
      setViewMode(isInitialAdminRoute() ? 'admin' : 'home');
    };
    window.addEventListener('hashchange', handleRouteChange);
    window.addEventListener('popstate', handleRouteChange);

    return () => {
      unsubSite();
      unsubRegs();
      window.removeEventListener('hashchange', handleRouteChange);
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [isAdminAuthenticated]);

  // Ensure selectedClassId defaults to a valid class when classes load
  useEffect(() => {
    if (
      siteContent.classes.length > 0 &&
      !siteContent.classes.some((c) => c.id === selectedClassId)
    ) {
      const defaultClass =
        siteContent.classes[1] || siteContent.classes[0];
      setSelectedClassId(defaultClass.id);
      setPreferredSchedule(defaultClass.schedule);
    }
  }, [siteContent.classes, selectedClassId]);

  const switchView = (mode: 'home' | 'admin') => {
    setViewMode(mode);
    if (mode === 'admin') {
      window.location.hash = '#admin';
    } else {
      try {
        window.history.pushState({}, '', '/');
      } catch {
        window.location.hash = '';
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogoutAdmin = async () => {
    await logoutAdminFromFirebase();
    setIsAdminAuthenticated(false);
    setAdminEmail('');
    switchView('home');
  };

  const scrollToRegistrationForm = (preselectClass?: CourseClass) => {
    if (preselectClass) {
      setSelectedClassId(preselectClass.id);
      setGrade(preselectClass.grade);
      setPreferredSchedule(preselectClass.schedule);
    }
    setSubmittedEntry(null);
    setFormError('');

    // Ensure we are in home view if triggered from any state
    if (viewMode !== 'home') {
      setViewMode('home');
      window.location.hash = '';
    }

    setTimeout(() => {
      const formEl =
        document.getElementById('form-dang-ky') || formSectionRef.current;
      if (formEl) {
        const headerOffset = 75;
        const elementPosition = formEl.getBoundingClientRect().top;
        const offsetPosition =
          elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        });

        // Trigger pulse highlight glow on the form
        setHighlightForm(true);
        setTimeout(() => setHighlightForm(false), 2400);

        setTimeout(() => {
          studentInputRef.current?.focus();
        }, 550);
      }
    }, 50);
  };

  const handleClassSelectionChange = (classId: string) => {
    setSelectedClassId(classId);
    const found = siteContent.classes.find((c) => c.id === classId);
    if (found) {
      setGrade(found.grade);
      setPreferredSchedule(found.schedule);
    }
  };

  const handleRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const cleanStudent = studentName.trim();
    const cleanParent = parentName.trim();
    const cleanPhone = phone.trim();

    if (!cleanStudent) {
      setFormError('Vui lòng nhập họ và tên học sinh.');
      return;
    }
    if (!cleanPhone || !/^[0-9+.\-\s]{9,15}$/.test(cleanPhone)) {
      setFormError(
        'Vui lòng nhập số điện thoại liên hệ hợp lệ (từ 9 đến 11 chữ số).'
      );
      return;
    }

    const chosenClass =
      siteContent.classes.find((c) => c.id === selectedClassId) ||
      siteContent.classes[0];
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString(
      'vi-VN'
    )} ${now.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;

    setIsSubmittingForm(true);
    const regPayload: Omit<StudentRegistration, 'id'> = {
      registrationCode: `DK-${Math.floor(100000 + Math.random() * 900000)}`,
      studentName: cleanStudent,
      parentName: cleanParent || 'Phụ huynh học sinh',
      phone: cleanPhone,
      grade,
      selectedClassId: chosenClass ? chosenClass.id : 'lop-tu-chon',
      selectedClassName: chosenClass
        ? `${chosenClass.name} (GV: ${chosenClass.teacher})`
        : 'Lớp đăng ký',
      preferredSchedule,
      note: note.trim(),
      status: 'Mới đăng ký',
      createdAt: formattedDate,
      createdAtMs: Date.now(),
    };

    const result = await createRegistrationInFirebase(regPayload);
    setIsSubmittingForm(false);
    setSubmittedEntry(result.item);
    if (!result.savedToCloud) {
      setRegistrations((prev) => [result.item, ...prev]);
    }

    setStudentName('');
    setParentName('');
    setPhone('');
    setNote('');
  };

  // Frontend Route Guard for Admin Portal:
  // When user clicks "Quản trị Admin" (viewMode === 'admin'), require Firebase Auth + Firestore `users/{uid}.role === 'admin'`
  if (viewMode === 'admin') {
    if (isCheckingAdminAuth) {
      return (
        <div className="min-h-screen w-full bg-slate-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 px-6 py-5 shadow-md text-xs sm:text-sm font-bold text-slate-700">
            Đang kiểm tra phiên đăng nhập Quản trị viên...
          </div>
        </div>
      );
    }

    if (!isAdminAuthenticated) {
      return (
        <AdminLoginPage
          campusName={siteContent.centerInfo.campus}
          onLoginSuccess={(info) => {
            setAdminEmail(info.email);
            setIsAdminAuthenticated(true);
          }}
          onBackToHome={() => switchView('home')}
        />
      );
    }

    return (
      <div className="w-full min-h-screen bg-[#AAB2BD]">
        <AdminDashboard
          siteContent={siteContent}
          registrations={registrations}
          syncedWithFirebase={syncedWithFirebase}
          firebaseError={firebaseError}
          adminEmail={adminEmail}
          onUpdateSiteContent={(updated) => setSiteContent(updated)}
          onExitAdmin={() => switchView('home')}
          onLogoutAdmin={handleLogoutAdmin}
        />
      </div>
    );
  }

  const { centerInfo, classes, activities, timetable } = siteContent;

  const filteredClasses =
    subjectFilter === 'Tất cả'
      ? classes
      : classes.filter((c) => c.subject === subjectFilter);

  const filteredActivities =
    activityCategory === 'Tất cả'
      ? activities
      : activities.filter((a) => a.category === activityCategory);

  // Extract unique teachers from timetable for the filter bar
  const uniqueTimetableTeachers = Array.from(
    new Set(
      timetable.flatMap((day) => day.sessions.map((s) => s.teacher)).filter(Boolean)
    )
  );

  const newRegistrationsCount = registrations.filter(
    (r) => r.status === 'Mới đăng ký'
  ).length;

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#EAF4F0] text-slate-900 flex flex-col items-center">
      {/* TOP IDENTITY STRIP (Single-page vertical layout, 1 single row on desktop, perfectly responsive on mobile) */}
      <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b-2 border-[#EA580C]/25 shadow-xs overflow-hidden sm:overflow-visible">
        <div className="w-full max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 py-2 sm:py-2.5 flex flex-col md:flex-row md:flex-nowrap items-stretch md:items-center justify-between gap-2 lg:gap-4">
          {/* Top Row on mobile: Brand Lockup + Compact Admin/Hotline */}
          <div className="flex items-center justify-between gap-1.5 sm:gap-2 min-w-0 w-full md:w-auto">
            <div className="flex items-center gap-1.5 sm:gap-2.5 lg:gap-3 min-w-0 flex-1 md:flex-none">
              <CenterLogoMark size="sm" />
              <div className="min-w-0 flex-1">
                <div className="text-[9px] sm:text-[10px] lg:text-[11px] font-extrabold tracking-normal xl:tracking-wider text-[#064E29] uppercase leading-tight truncate">
                  TRUNG TÂM BỒI DƯỠNG KIẾN THỨC & NĂNG KHIẾU
                </div>
                <div className="flex items-center gap-1 sm:gap-1.5 lg:gap-2 flex-wrap sm:flex-nowrap mt-0.5 leading-none">
                  <span className="text-xs sm:text-base xl:text-lg font-black tracking-tight text-[#064E29] shrink-0">
                    TRUNG TÂM
                  </span>
                  <HocGioiWordmark className="text-xs sm:text-base xl:text-xl font-black tracking-tight shrink-0" />
                  <span className="text-slate-300 hidden sm:inline" aria-hidden="true">
                    ·
                  </span>
                  <span className="text-[10px] sm:text-xs xl:text-sm font-bold text-[#0066B3] inline-flex items-center gap-0.5 sm:gap-1 shrink-0">
                    <Building2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#EA580C] shrink-0" />
                    <span>
                      Cơ sở: <strong className="text-[#D9232A]">{centerInfo.campus}</strong>
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Mobile-only compact Admin & Hotline on top row */}
            <div className="md:hidden shrink-0 flex items-center gap-1 sm:gap-1.5">
              <a
                href={`tel:${centerInfo.hotline.replace(/\./g, '')}`}
                className="p-1.5 rounded-lg border border-[#EA580C]/30 bg-[#FFF7ED] text-[#EA580C] hover:bg-[#EA580C] hover:text-white transition-colors shrink-0"
                title={`Hotline: ${centerInfo.hotline}`}
              >
                <Phone className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={() => switchView('admin')}
                className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border-2 border-[#0D9456]/40 bg-[#ECFDF5] text-[#064E29] text-[11px] font-extrabold cursor-pointer shrink-0"
                title="Quản trị Admin"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#0D9456] shrink-0" />
                <span>Admin</span>
                {newRegistrationsCount > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-[#D9232A] text-white text-[9px] font-mono-tabular font-extrabold">
                    {newRegistrationsCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Action Buttons: 50-50 grid on mobile (never overflows), 1 single row on desktop (md:) */}
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2 w-full md:flex md:w-auto md:items-center md:gap-1.5 lg:gap-2 xl:gap-2.5 md:flex-nowrap md:justify-end shrink-0">
            {/* Desktop Hotline */}
            <a
              href={`tel:${centerInfo.hotline.replace(/\./g, '')}`}
              className="hidden md:inline-flex items-center gap-1.5 px-2.5 lg:px-3 py-2 rounded-xl border border-[#EA580C]/30 bg-[#FFF7ED] text-[11px] lg:text-xs font-bold text-[#EA580C] hover:bg-[#EA580C] hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              <Phone className="w-3.5 h-3.5 shrink-0" />
              <span>Hotline:</span>
              <strong className="font-mono-tabular">
                {centerInfo.hotline}
              </strong>
            </a>

            {/* Desktop Admin button */}
            <button
              type="button"
              onClick={() => switchView('admin')}
              className="hidden md:inline-flex items-center gap-1.5 px-2.5 lg:px-3.5 py-2 rounded-xl border-2 border-[#0D9456]/40 bg-[#ECFDF5] text-[#064E29] hover:bg-[#0D9456] hover:text-white text-[11px] lg:text-xs xl:text-sm font-extrabold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title="Mở trang Quản trị Admin để chỉnh sửa trang chủ & tiếp nhận đăng ký học"
            >
              <ShieldCheck className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-[#0D9456] shrink-0" />
              <span>Quản trị Admin</span>
              {newRegistrationsCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-[#D9232A] text-white text-[10px] font-mono-tabular font-extrabold">
                  {newRegistrationsCount}
                </span>
              )}
            </button>

            {/* Management portal login button */}
            <a
              href="https://quanlytrungtam.pages.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3.5 py-2 rounded-xl bg-[#0066B3] hover:bg-[#005291] text-white text-[11px] sm:text-xs xl:text-sm font-extrabold shadow-xs transition-colors whitespace-nowrap text-center min-w-0"
              title="Đăng nhập Hệ thống quản lý trung tâm"
            >
              <span className="truncate">Đăng nhập hệ thống</span>
              <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
            </a>

            {/* Register CTA button */}
            <button
              type="button"
              onClick={() => scrollToRegistrationForm()}
              className="inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-[#D9232A] to-[#EA580C] hover:from-[#B91C1C] hover:to-[#C2410C] text-white text-[11px] sm:text-xs xl:text-sm font-extrabold shadow-sm transition-transform active:scale-[0.98] whitespace-nowrap text-center min-w-0 cursor-pointer"
            >
              <span className="truncate">Đăng ký học ngay</span>
              <ArrowDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
            </button>
          </div>
        </div>
      </header>

      {/* MAIN VERTICAL SINGLE-PAGE STREAM */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        {/* TOP RESPONSIVE IMAGE BANNER CARD */}
        <section aria-label="Banner hình ảnh Trung tâm">
          <TopHeroBanner
            bannerUrl={centerInfo.topBannerImageUrl || DEFAULT_TOP_BANNER_URL}
            altText={centerInfo.fullTitle}
          />
        </section>

        {/* SECTION 1: BANNER GIỚI THIỆU VỀ TRUNG TÂM & TỔNG QUAN */}
        <section
          aria-labelledby="hero-heading"
          className="bg-white rounded-3xl border-2 border-[#F59E0B]/45 shadow-xs p-5 sm:p-8"
        >
          {/* Top Header Row inside Banner Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <HocGioiAccentBar variant="multi" />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1
                    id="hero-heading"
                    className="text-xl sm:text-2xl lg:text-3xl font-black text-[#064E29] tracking-tight"
                  >
                    TRUNG TÂM
                  </h1>
                  <HocGioiWordmark className="text-2xl sm:text-3xl font-black tracking-tight" />
                  <span className="text-lg sm:text-2xl font-extrabold text-[#0066B3]">
                    — Cơ Sở {centerInfo.campus}
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-[#0D9456] mt-1">
                  {centerInfo.heroSubtitle}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#EA580C] self-start sm:self-center">
              <span className="font-mono-tabular text-[#D9232A]">
                Hotline: {centerInfo.hotline}
              </span>
            </div>
          </div>

          {/* Main Banner Split: Value Proposition + Prominent CTAs */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 py-6 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#EA580C]">
                Bồi Dưỡng Kiến Thức · Luyện Thi · Phát Triển Toàn Diện
              </div>
              <h2
                className="text-2xl sm:text-4xl font-black leading-[1.2] tracking-tight text-[#064E29]"
                style={{ textWrap: 'balance' }}
              >
                <span className="text-[#0066B3]">Vững kiến thức nền tảng</span>,{' '}
                <span className="text-[#D9232A]">bứt phá điểm số</span> cùng{' '}
                <span className="text-[#EA580C]">lộ trình cá nhân hóa</span>.
              </h2>
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed max-w-2xl font-medium">
                {centerInfo.heroDescription}
              </p>

              {/* Prominent CTA Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  type="button"
                  onClick={() => scrollToRegistrationForm()}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#D9232A] to-[#EA580C] hover:from-[#B91C1C] hover:to-[#C2410C] text-white text-sm sm:text-base font-extrabold shadow-sm transition-transform active:scale-[0.99] whitespace-nowrap text-center cursor-pointer"
                >
                  <span>Đăng ký học ngay</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>

                <a
                  href="https://quanlytrungtam.pages.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border-2 border-[#0066B3] bg-[#F0F7FF] hover:bg-[#0066B3] text-[#0066B3] hover:text-white text-sm sm:text-base font-extrabold transition-colors whitespace-nowrap text-center"
                >
                  <span>Đăng nhập hệ thống</span>
                  <ExternalLink className="w-4 h-4 shrink-0" />
                </a>
              </div>
            </div>

            {/* Right highlight showcase box matching banner bullet points */}
            <div className="lg:col-span-5 bg-gradient-to-br from-[#EAF6F3] via-white to-[#FFFBEB] rounded-2xl border-2 border-[#0D9456]/25 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#0D9456]/15 pb-3">
                <div>
                  <div className="text-xs font-extrabold text-[#0D9456] uppercase tracking-wider">
                    CHƯƠNG TRÌNH ĐÀO TẠO TRỌNG TÂM
                  </div>
                  <div className="text-lg font-black text-[#064E29] flex items-center gap-1.5 mt-0.5">
                    <span>Trung Tâm</span>
                    <HocGioiWordmark className="text-lg font-black" />
                  </div>
                </div>
                <CenterLogoMark size="sm" />
              </div>

              <div className="space-y-2.5 text-xs sm:text-sm text-slate-800 font-medium">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#0066B3] shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-[#0066B3]">Bồi dưỡng kiến thức:</strong> Toán, Lý, KHTN, Tiếng Anh ({classes.length} lớp đang mở).
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#D9232A] shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-[#D9232A]">Luyện thi chuyên sâu:</strong> Ôn thi vào lớp 10, thi Chuyên, bồi dưỡng học sinh giỏi & thi online.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#EA580C] shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-[#EA580C]">Năng khiếu & Kỹ năng:</strong> Luyện chữ đẹp, vẽ tranh, lập trình, CLB Tiếng Anh giao tiếp & kèm 1-1.
                  </span>
                </div>
              </div>

              {/* Signature Orange Contact Bar matching the bottom of the banner */}
              <div className="rounded-xl bg-gradient-to-r from-[#E8770E] to-[#EA580C] px-3.5 py-2.5 text-white flex flex-wrap items-center justify-between gap-2 text-xs font-bold shadow-2xs">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span>01 Ngõ 350 - Trần Hưng Đạo - {centerInfo.campus}</span>
                </span>
                <a
                  href={`tel:${centerInfo.hotline.replace(/\./g, '')}`}
                  className="font-mono-tabular bg-white text-[#EA580C] px-2 py-0.5 rounded-md font-extrabold hover:bg-amber-50"
                >
                  {centerInfo.hotline}
                </a>
              </div>
            </div>
          </div>

          {/* 3 Signature Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Card 1: Danh Sách Lớp Học */}
            <div className="rounded-2xl border-2 border-[#0066B3]/20 bg-gradient-to-br from-[#F0F7FF] to-white p-5 flex flex-col justify-between gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-extrabold text-[#0066B3]">
                  Danh Sách Lớp Học:
                </span>
                <Building2 className="w-5 h-5 text-[#0066B3]" />
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-3xl font-black text-[#0066B3] font-mono-tabular">
                    {classes.length}
                  </div>
                  <div className="text-xs font-bold text-[#0284C7] mt-2">
                    ↗ Đồng bộ Firestore · Đang mở lớp
                  </div>
                </div>
                <MiniAscendingBars variant="blue" />
              </div>
            </div>

            {/* Card 2: Giáo Viên */}
            <div className="rounded-2xl border-2 border-[#EA580C]/25 bg-gradient-to-br from-[#FFF7ED] to-white p-5 flex flex-col justify-between gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-extrabold text-[#EA580C]">
                  Giáo Viên Chuyên Môn:
                </span>
                <Users className="w-5 h-5 text-[#EA580C]" />
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-3xl font-black text-[#EA580C] font-mono-tabular">
                    {centerInfo.stats.teachers}
                  </div>
                  <div className="text-xs font-bold text-[#D97706] mt-2">
                    ↗ Tài khoản active · Tận tâm giảng dạy
                  </div>
                </div>
                <MiniAscendingBars variant="amber" />
              </div>
            </div>

            {/* Card 3: Học Sinh */}
            <div className="rounded-2xl border-2 border-[#0D9456]/25 bg-gradient-to-br from-[#ECFDF5] to-white p-5 flex flex-col justify-between gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-extrabold text-[#064E29]">
                  Học Sinh Theo Học:
                </span>
                <GraduationCap className="w-5 h-5 text-[#0D9456]" />
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-3xl font-black text-[#0D9456] font-mono-tabular">
                    {centerInfo.stats.students}
                  </div>
                  <button
                    type="button"
                    onClick={() => scrollToRegistrationForm()}
                    className="text-xs font-bold text-[#D9232A] hover:underline mt-2 text-left cursor-pointer"
                  >
                    ↗ Hồ sơ học sinh (Nhấn để đăng ký mới)
                  </button>
                </div>
                <MiniAscendingBars variant="emerald" />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: HÌNH ẢNH HOẠT ĐỘNG TẠI TRUNG TÂM */}
        <section
          aria-labelledby="activities-heading"
          className="bg-white rounded-3xl border-2 border-[#0D9456]/20 shadow-xs p-5 sm:p-8 space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <HocGioiAccentBar variant="green" />
              <div>
                <h2
                  id="activities-heading"
                  className="text-xl sm:text-2xl font-black tracking-tight"
                >
                  <span className="text-[#064E29]">Hình Ảnh Hoạt Động </span>
                  <span className="text-[#0D9456]">Học Tập </span>
                  <span className="text-[#EA580C]">& Rèn Luyện</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5 font-medium">
                  Không gian học tập năng động, thân thiện và đồng bộ công nghệ tại Cơ sở {centerInfo.campus}
                </p>
              </div>
            </div>

            {/* Category filter buttons */}
            <div className="flex items-center gap-1.5 p-1 bg-[#EAF4F0] rounded-xl overflow-x-auto max-w-full">
              {[
                'Tất cả',
                'Giờ học trên lớp',
                'Thực hành & Thí nghiệm',
                'Sổ liên lạc & Phụ huynh',
                'Kiểm tra & Đánh giá',
              ].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActivityCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activityCategory === cat
                      ? 'bg-[#0D9456] text-white shadow-2xs'
                      : 'text-[#064E29] hover:text-[#EA580C]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredActivities.map((act) => (
              <article
                key={act.id}
                className="group rounded-2xl border-2 border-slate-200/90 overflow-hidden bg-slate-50/50 hover:border-[#0D9456] transition-colors flex flex-col"
              >
                {/* Visual Frame */}
                <div className="h-56 sm:h-64 w-full overflow-hidden border-b border-slate-200/80">
                  <ActivityIllustration
                    type={act.illustrationType}
                    title={act.title}
                    customImageUrl={act.customImageUrl}
                  />
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between gap-4 bg-white">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold flex-wrap">
                      <span className="text-[#EA580C]">
                        {act.category}
                      </span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span className="text-[#0066B3]">{act.teacher}</span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span className="font-mono-tabular text-slate-500">{act.date}</span>
                    </div>

                    <h3 className="text-base sm:text-lg font-extrabold text-[#064E29] leading-snug">
                      {act.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {act.summary}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                    <span className="text-xs font-bold text-[#0D9456]">
                      {act.metrics}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedActivityModal(act)}
                      className="text-xs font-extrabold text-[#D9232A] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Xem chi tiết →
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* SECTION 3: GIỚI THIỆU MỘT SỐ LỚP HỌC ĐANG HOẠT ĐỘNG */}
        <section
          aria-labelledby="active-classes-heading"
          className="bg-white rounded-3xl border-2 border-[#0066B3]/20 shadow-xs p-5 sm:p-8 space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <HocGioiAccentBar variant="blue" />
              <h2
                id="active-classes-heading"
                className="text-xl sm:text-2xl font-black tracking-tight"
              >
                <span className="text-[#064E29]">Danh Sách </span>
                <span className="text-[#0066B3]">Lớp Học </span>
                <span className="text-[#EA580C]">Đang Hoạt Động</span>
              </h2>
              <span className="text-xs sm:text-sm font-extrabold text-[#D9232A] font-mono-tabular">
                · {filteredClasses.length} lớp học
              </span>
            </div>

            {/* Interactive Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-[#EAF4F0] rounded-xl self-start sm:self-auto overflow-x-auto max-w-full">
              {(['Tất cả', 'Toán', 'Lý', 'KHTN', 'Tiếng Anh'] as const).map(
                (tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setSubjectFilter(tab)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      subjectFilter === tab
                        ? 'bg-[#0066B3] text-white shadow-2xs'
                        : 'text-[#064E29] hover:text-[#EA580C]'
                    }`}
                  >
                    {tab === 'Tất cả' ? 'Tất cả các lớp' : `Môn ${tab}`}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Class Cards Grid matching screenshot layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredClasses.map((course, idx) => {
              const titleColors = [
                'text-[#0066B3]',
                'text-[#D9232A]',
                'text-[#EA580C]',
                'text-[#0D9456]',
              ];
              const titleColor = titleColors[idx % titleColors.length];
              return (
                <div
                  key={course.id}
                  className="rounded-2xl border-2 border-slate-200/90 bg-white hover:border-[#EA580C] transition-colors p-4 sm:p-6 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    {/* Top metadata line: Subject & Student Count */}
                    <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs font-extrabold">
                      <span className="text-[#064E29] uppercase tracking-wider shrink-0 bg-[#EAF4F0] px-2 py-0.5 rounded-md text-[11px] sm:text-xs">
                        Môn {course.subject} · {course.grade}
                      </span>
                      <span className="text-[#0D9456] font-mono-tabular text-[11px] sm:text-xs shrink-0">
                        {course.studentsCount}/{course.maxStudents} Học sinh ·{' '}
                        {course.status}
                      </span>
                    </div>

                    {/* Course Title & Room */}
                    <div className="flex items-baseline justify-between gap-2 flex-wrap sm:flex-nowrap">
                      <h3
                        className={`text-xl sm:text-2xl font-black tracking-tight shrink-0 whitespace-nowrap ${titleColor}`}
                      >
                        {course.name}
                      </h3>
                      <span className="text-xs font-bold text-[#EA580C] font-mono-tabular text-right">
                        {course.room}
                      </span>
                    </div>

                    {/* Brief Course Description */}
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {course.description}
                    </p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    {/* Teacher & Schedule Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs sm:text-sm">
                      <div className="text-slate-700">
                        GV:{' '}
                        <strong className="text-[#064E29] font-extrabold">
                          {course.teacher}
                        </strong>
                      </div>
                      <div className="text-[#0066B3] font-mono-tabular font-bold">
                        {course.schedule}
                      </div>
                    </div>

                    {/* Card Actions: Full-width stacked buttons on mobile, side-by-side on tablet/desktop */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setSelectedClassModal(course)}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl border-2 border-slate-200 hover:border-[#0066B3] text-xs font-bold text-[#0066B3] hover:bg-[#F0F7FF] transition-colors text-center cursor-pointer"
                      >
                        Xem nội dung lớp học
                      </button>

                      <button
                        type="button"
                        onClick={() => scrollToRegistrationForm(course)}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#EA580C] to-[#D9232A] hover:from-[#C2410C] hover:to-[#B91C1C] text-white text-xs font-extrabold shadow-sm transition-transform active:scale-[0.98] text-center cursor-pointer"
                      >
                        <span>Đăng ký học lớp này</span>
                        <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION 4: THỜI KHÓA BIỂU CÁC LỚP */}
        <section
          aria-labelledby="timetable-heading"
          className="bg-white rounded-3xl border-2 border-[#EA580C]/25 shadow-xs p-5 sm:p-8 space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <HocGioiAccentBar variant="orange" />
              <div>
                <h2
                  id="timetable-heading"
                  className="text-xl sm:text-2xl font-black tracking-tight"
                >
                  <span className="text-[#064E29]">Thời Khóa Biểu </span>
                  <span className="text-[#EA580C]">Các Lớp </span>
                  <span className="text-[#0066B3]">Trong Tuần</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5 font-medium">
                  Lịch học cố định tại Cơ sở {centerInfo.campus} · Nhấn vào ca học bất kỳ để đăng ký nhanh
                </p>
              </div>
            </div>

            {/* Filter Timetable by Teacher */}
            <div className="flex items-center gap-1.5 p-1 bg-[#FFF7ED] rounded-xl self-start sm:self-auto overflow-x-auto max-w-full">
              {['Tất cả', ...uniqueTimetableTeachers].map((teacherTab) => (
                <button
                  key={teacherTab}
                  type="button"
                  onClick={() => setTimetableTeacherFilter(teacherTab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    timetableTeacherFilter === teacherTab
                      ? 'bg-[#EA580C] text-white shadow-2xs'
                      : 'text-[#064E29] hover:text-[#D9232A]'
                  }`}
                >
                  {teacherTab === 'Tất cả' ? 'Tất cả giáo viên' : teacherTab}
                </button>
              ))}
            </div>
          </div>

          {/* Weekly Timetable Grid with HỌC GIỎI header colors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
            {timetable.map((day, dayIndex) => {
              const filteredSessions =
                timetableTeacherFilter === 'Tất cả'
                  ? day.sessions
                  : day.sessions.filter(
                      (s) => s.teacher === timetableTeacherFilter
                    );

              // Cycle through the signature colors of H - Ọ - C - G - I - Ỏ - I
              const dayHeaderColors = [
                'bg-[#0066B3]', // H - Blue
                'bg-[#D9232A]', // Ọ - Red
                'bg-[#D97706]', // C - Gold Amber
                'bg-[#EA580C]', // G - Orange
                'bg-[#0D9456]', // I - Emerald Green
                'bg-[#064E29]', // Ỏ - Forest Green
                'bg-[#0066B3]', // I - Blue
              ];
              const headerBg = dayHeaderColors[dayIndex % dayHeaderColors.length];

              return (
                <div
                  key={day.dayShort}
                  className="rounded-2xl border border-slate-200/90 bg-slate-50/60 flex flex-col overflow-hidden"
                >
                  {/* Day Header */}
                  <div className={`${headerBg} text-white px-3.5 py-2.5 flex items-center justify-between`}>
                    <span className="text-sm font-extrabold">{day.dayLabel}</span>
                    <span className="text-[11px] text-white/90 font-mono-tabular font-bold">
                      {day.dayShort}
                    </span>
                  </div>

                  {/* Sessions List */}
                  <div className="p-2.5 flex-1 flex flex-col gap-2.5">
                    {filteredSessions.length === 0 ? (
                      <div className="text-xs text-slate-400 py-6 text-center">
                        Không có ca học
                      </div>
                    ) : (
                      filteredSessions.map((session, idx) => {
                        const matchedCourse =
                          classes.find((c) => c.id === session.classId) ||
                          classes.find((c) => c.name === session.className);
                        return (
                          <button
                            key={`${day.dayShort}-${idx}`}
                            type="button"
                            onClick={() =>
                              scrollToRegistrationForm(matchedCourse)
                            }
                            className="w-full text-left rounded-xl bg-white border border-slate-200/90 hover:border-[#EA580C] p-3 transition-colors space-y-1.5 cursor-pointer group"
                          >
                            <div className="flex items-center justify-between text-[11px] font-extrabold text-[#EA580C]">
                              <span>Môn {session.subject}</span>
                              <span className="font-mono-tabular text-slate-500">
                                {session.room}
                              </span>
                            </div>
                            <div className="text-sm font-black text-[#0066B3] group-hover:text-[#D9232A] transition-colors">
                              {session.className}
                            </div>
                            <div className="text-xs font-semibold text-[#064E29]">
                              {session.teacher}
                            </div>
                            <div className="pt-1 flex items-center gap-1 text-[11px] font-mono-tabular font-bold text-[#0D9456]">
                              <Clock className="w-3 h-3 shrink-0" />
                              <span>{session.time}</span>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION 5: HỆ THỐNG QUẢN LÝ TRUNG TÂM */}
        <section
          aria-labelledby="management-system-heading"
          className="bg-white rounded-3xl border-2 border-[#F59E0B]/45 shadow-xs p-5 sm:p-8 space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <HocGioiAccentBar variant="multi" />
              <div>
                <h2
                  id="management-system-heading"
                  className="text-xl sm:text-2xl font-black tracking-tight"
                >
                  <span className="text-[#064E29]">Hệ Thống </span>
                  <span className="text-[#0066B3]">Quản Lý Trung Tâm </span>
                  <span className="text-[#D9232A]">Trực Tuyến</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5 font-medium">
                  Cổng quản trị Lớp học, Giáo viên, Học sinh, Điểm danh & Sổ liên lạc điện tử — Cơ sở {centerInfo.campus}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <a
                href="https://quanlytrungtam.pages.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0066A2] hover:bg-[#005282] text-white text-xs sm:text-sm font-bold transition-colors whitespace-nowrap shrink-0"
              >
                <span>Vào hệ thống quản lý ngay</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Interactive Preview & Direct Portal Access */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center pt-2">
            {/* Left: Screenshot Preview of the Management Portal */}
            <div className="lg:col-span-7 rounded-2xl border border-slate-200 overflow-hidden bg-slate-100 shadow-xs">
              {!adminScreenshotError ? (
                <a
                  href={centerInfo.managementUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block relative group"
                  title="Nhấn để truy cập Hệ thống quản lý trung tâm (quanlytrungtam.pages.dev)"
                >
                  {(() => {
                    const portalCandidates = resolveImageCandidates(
                      centerInfo.portalPreviewImageUrl ||
                        DEFAULT_PORTAL_PREVIEW_URL
                    );
                    const portalSrc =
                      portalCandidates[0] || DEFAULT_PORTAL_PREVIEW_URL;
                    return (
                      <img
                        key={portalSrc}
                        src={portalSrc}
                        alt="Giao diện Hệ thống Quản lý Trung tâm Cơ sở Sa Thầy"
                        referrerPolicy="no-referrer"
                        onError={() => setAdminScreenshotError(true)}
                        className="w-full h-auto object-cover transition-transform duration-200 group-hover:scale-[1.01]"
                      />
                    );
                  })()}
                </a>
              ) : (
                <div className="p-8 text-center space-y-3">
                  <Building2 className="w-10 h-10 text-[#0066A2] mx-auto" />
                  <div className="text-base font-bold text-slate-900">
                    Hệ Thống Quản Trị Admin — Cơ Sở {centerInfo.campus}
                  </div>
                  <p className="text-xs text-slate-600">
                    Đồng bộ Firestore · Quản lý Lớp học, Giáo viên, Học sinh & Sổ liên lạc
                  </p>
                </div>
              )}
            </div>

            {/* Right: Feature Breakdown & Direct Link */}
            <div className="lg:col-span-5 space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-[#0066A2]">
                Cổng Quản Trị Tập Trung
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-snug">
                Kết nối đồng bộ giữa Ban Quản Trị, Giáo Viên và Phụ Huynh Học Sinh
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Hệ thống quản lý trực tuyến giúp tự động hóa công tác điểm danh, quản lý học phí, phân công giáo viên và cập nhật sổ liên lạc điện tử theo thời gian thực.
              </p>

              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700">
                <li className="flex items-start gap-2.5">
                  <UserCheck className="w-4 h-4 text-[#0066A2] shrink-0 mt-0.5" />
                  <span>
                    <strong>Quản lý Lớp học & Giáo viên:</strong> Theo dõi sĩ số, lịch dạy và nhận xét học sinh.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <BookOpen className="w-4 h-4 text-[#059669] shrink-0 mt-0.5" />
                  <span>
                    <strong>Sổ liên lạc & Điểm danh:</strong> Xem chuyên cần, điểm kiểm tra và nhận xét từng buổi học.
                  </span>
                </li>
               
              </ul>
            </div>
          </div>
        </section>

        {/* SECTION 6: FORM THÔNG TIN KHÁCH HÀNG & ĐĂNG KÝ HỌC NGAY */}
        <section
          id="form-dang-ky"
          ref={formSectionRef}
          aria-labelledby="registration-heading"
          className={`bg-white rounded-3xl border-2 shadow-xs p-5 sm:p-8 scroll-mt-24 transition-all duration-500 ${
            highlightForm
              ? 'border-[#EA580C] ring-4 ring-[#EA580C]/40 shadow-2xl scale-[1.008]'
              : 'border-[#D9232A]/30'
          }`}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Form Instructions & Center Contact Info */}
            <div className="lg:col-span-5 space-y-5">
              <div className="flex items-center gap-3">
                <HocGioiAccentBar variant="red" />
                <div>
                  <h2
                    id="registration-heading"
                    className="text-xl sm:text-2xl font-black tracking-tight"
                  >
                    <span className="text-[#D9232A]">Đăng Ký Học </span>
                    <span className="text-[#064E29]">& Tư Vấn </span>
                    <span className="text-[#0066B3]">Xếp Lớp</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 mt-0.5 font-medium">
                    Điền thông tin để Trung tâm Học Giỏi ({centerInfo.campus}) liên hệ tư vấn lộ trình và xếp lịch học phù hợp
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-[#EAF6F3] to-[#FFFBEB] border-2 border-[#0D9456]/25 p-5 space-y-3.5">
                <div className="text-sm font-black text-[#064E29] flex items-center gap-1.5 flex-wrap">
                  <span>Quyền lợi khi đăng ký tại Trung Tâm</span>
                  <HocGioiWordmark className="text-base font-black" />
                </div>
                <ul className="space-y-2 text-xs sm:text-sm text-slate-800 font-medium">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#0066B3] shrink-0 mt-0.5" />
                    <span>
                      Kiểm tra đánh giá năng lực đầu vào và tư vấn chọn lớp hoàn toàn miễn phí.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#EA580C] shrink-0 mt-0.5" />
                    <span>
                      Cấp tài khoản tra cứu Sổ liên lạc điện tử cho Phụ huynh ngay khi nhập học.
                    </span>
                  </li>
                  
                </ul>
              </div>

              <div className="rounded-2xl bg-gradient-to-r from-[#E8770E] to-[#EA580C] p-4 space-y-2.5 text-xs sm:text-sm text-white shadow-xs">
                <div className="flex items-center gap-2 font-extrabold">
                  <MapPin className="w-4 h-4 text-amber-200 shrink-0" />
                  <span>Địa chỉ: 01 Ngõ 350 - Trần Hưng Đạo - {centerInfo.campus} - Quảng Ngãi</span>
                </div>
                <div className="flex items-center gap-2 font-bold">
                  <Phone className="w-4 h-4 text-amber-200 shrink-0" />
                  <span>
                    Hotline tư vấn:{' '}
                    <a
                      href={`tel:${centerInfo.hotline.replace(/\./g, '')}`}
                      className="font-mono-tabular font-black underline text-white"
                    >
                      {centerInfo.hotline}
                    </a>
                  </span>
                </div>
                <div className="flex items-center gap-2 font-medium text-amber-50">
                  <Calendar className="w-4 h-4 text-amber-200 shrink-0" />
                  <span>Giờ làm việc: {centerInfo.workingHours}</span>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Customer Information Form */}
            <div className="lg:col-span-7">
              <form
                onSubmit={handleRegistrationSubmit}
                className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 sm:p-6 space-y-4"
                noValidate
              >
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                    Form Thông Tin Khách Hàng (Học Sinh / Phụ Huynh)
                  </h3>
                  <span className="text-xs text-slate-500">
                    * Thông tin bắt buộc
                  </span>
                </div>

                {formError && (
                  <div
                    role="alert"
                    className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs sm:text-sm font-medium text-rose-700"
                  >
                    {formError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="student-name"
                      className="block text-xs font-bold text-slate-700 mb-1.5"
                    >
                      Họ và tên Học sinh *
                    </label>
                    <input
                      id="student-name"
                      ref={studentInputRef}
                      type="text"
                      required
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="Ví dụ: Nguyễn Minh Khôi"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0066A2] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="parent-name"
                      className="block text-xs font-bold text-slate-700 mb-1.5"
                    >
                      Họ và tên Phụ huynh
                    </label>
                    <input
                      id="parent-name"
                      type="text"
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      placeholder="Ví dụ: Chị Lan (Mẹ bé Khôi)"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0066A2] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="phone-number"
                      className="block text-xs font-bold text-slate-700 mb-1.5"
                    >
                      Số điện thoại liên hệ (Zalo) *
                    </label>
                    <input
                      id="phone-number"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Ví dụ: 0396257977"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-mono-tabular text-slate-900 placeholder:text-slate-400 focus:border-[#0066A2] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="student-grade"
                      className="block text-xs font-bold text-slate-700 mb-1.5"
                    >
                      Khối lớp hiện tại
                    </label>
                    <select
                      id="student-grade"
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#0066A2] focus:outline-none"
                    >
                      <option value="Khối 6">Lớp 6</option>
                      <option value="Khối 7">Lớp 7</option>
                      <option value="Khối 8">Lớp 8</option>
                      <option value="Khối 9">Lớp 9 (Luyện thi vào 10)</option>
                      <option value="Khối khác">Khối lớp khác</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="selected-class"
                      className="block text-xs font-bold text-slate-700 mb-1.5"
                    >
                      Lớp học đăng ký *
                    </label>
                    <select
                      id="selected-class"
                      value={selectedClassId}
                      onChange={(e) =>
                        handleClassSelectionChange(e.target.value)
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-[#0066A2] focus:outline-none"
                    >
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} — GV: {c.teacher}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="preferred-schedule"
                      className="block text-xs font-bold text-slate-700 mb-1.5"
                    >
                      Lịch học dự kiến
                    </label>
                    <input
                      id="preferred-schedule"
                      type="text"
                      value={preferredSchedule}
                      onChange={(e) => setPreferredSchedule(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-mono-tabular text-slate-900 focus:border-[#0066A2] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="student-note"
                    className="block text-xs font-bold text-slate-700 mb-1.5"
                  >
                    Ghi chú học lực hoặc mục tiêu học tập (Tùy chọn)
                  </label>
                  <textarea
                    id="student-note"
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Ví dụ: Em cần củng cố phần Hình học 8, mong muốn học thử vào tối Thứ 2..."
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0066A2] focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <span className="text-xs text-slate-500">
                    Dữ liệu sẽ được gửi đến Ban quản lý trung tâm.
                  </span>
                  <button
                    type="submit"
                    disabled={isSubmittingForm}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] disabled:opacity-60 text-white text-sm font-extrabold shadow-sm transition-transform active:scale-[0.99] whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>
                      {isSubmittingForm
                        ? 'Đang gửi lên Firebase...'
                        : 'Gửi Đăng Ký Học Ngay'}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>
      </main>

      {/* QUIET FOOTER */}
      <footer className="w-full bg-white border-t border-slate-200/90 mt-10">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-3">
            <CenterLogoMark size="sm" />
            <div>
              <div className="font-extrabold text-slate-900">
                {centerInfo.name} — CƠ SỞ {centerInfo.campus.toUpperCase()}
              </div>
              <div className="text-slate-500">
                {centerInfo.tagline} · Hỗ trợ: {centerInfo.hotline}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-wrap justify-center">
            <button
              type="button"
              onClick={() => switchView('admin')}
              className="font-bold text-[#005A8D] hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Trang Quản Trị Admin</span>
            </button>
            <span aria-hidden="true">·</span>
            <a
              href={centerInfo.managementUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#0066A2] hover:underline inline-flex items-center gap-1"
            >
              <span>Hệ thống quản lý</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => scrollToRegistrationForm()}
              className="font-bold text-[#E11D48] hover:underline cursor-pointer"
            >
              Đăng ký học ngay
            </button>
          </div>
        </div>
      </footer>

      {/* FLOATING ACTION POPUP BUTTON: ALWAYS VISIBLE AT BOTTOM RIGHT OF VIEWPORT */}
      <aside
        aria-label="Phím tắt Đăng ký học ngay"
        className="fixed bottom-4 right-3 sm:bottom-6 sm:right-6 z-40 select-none"
      >

        {/* Primary Floating Action CTA Button */}
        <button
          type="button"
          onClick={() => scrollToRegistrationForm()}
          className="relative inline-flex items-center gap-2 sm:gap-2.5 px-4 sm:px-5 py-3 sm:py-3.5 rounded-full bg-gradient-to-r from-[#D9232A] via-[#E11D48] to-[#EA580C] hover:from-[#B91C1C] hover:via-[#BE123C] hover:to-[#C2410C] text-white font-black text-xs sm:text-sm shadow-xl shadow-red-600/35 hover:shadow-2xl hover:shadow-red-600/50 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer border-2 border-white/90 group"
          title="Nhấn để chuyển ngay đến Form Đăng ký học"
        >
          {/* Pulsing ambient glow effect */}
          <span
            className="absolute -inset-1 rounded-full bg-gradient-to-r from-[#D9232A] to-[#EA580C] opacity-40 blur-sm group-hover:opacity-75 transition-opacity -z-10 animate-pulse"
            aria-hidden="true"
          />

          {/* Attention-grabbing corner ping indicator */}
          <span
            className="animate-ping absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-[#EA580C] opacity-75"
            aria-hidden="true"
          />
          <span
            className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#D9232A] text-[9px] font-mono-tabular font-extrabold text-white border-2 border-white"
            aria-hidden="true"
          >
            !
          </span>

          <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
          <span className="tracking-tight whitespace-nowrap">Đăng ký học ngay</span>
          <ArrowDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 animate-bounce" />
        </button>
      </aside>

      {/* MODAL: COURSE DETAILS */}
      {selectedClassModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-course-title"
        >
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-5">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-[#0066A2]">
                  Môn {selectedClassModal.subject} · {selectedClassModal.grade}{' '}
                  · Mã lớp:{' '}
                  <span className="font-mono-tabular">
                    {selectedClassModal.code}
                  </span>
                </div>
                <h3
                  id="modal-course-title"
                  className="text-2xl font-extrabold text-slate-900 mt-1"
                >
                  Lớp {selectedClassModal.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedClassModal(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm text-slate-700">
              <p className="leading-relaxed">
                {selectedClassModal.description}
              </p>

              <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4 space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Giáo viên phụ trách:</span>
                  <strong className="text-slate-900">
                    {selectedClassModal.teacher} (
                    {selectedClassModal.teacherRole})
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Lịch học cố định:</span>
                  <strong className="font-mono-tabular text-[#0066A2]">
                    {selectedClassModal.schedule}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Phòng học:</span>
                  <strong className="text-slate-900">
                    {selectedClassModal.room}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Sĩ số hiện tại:</span>
                  <strong className="font-mono-tabular text-[#059669]">
                    {selectedClassModal.studentsCount}/
                    {selectedClassModal.maxStudents} Học sinh
                  </strong>
                </div>
              </div>

              {Array.isArray(selectedClassModal.highlights) &&
                selectedClassModal.highlights.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                      Điểm nổi bật của lớp học:
                    </div>
                    <ul className="space-y-1.5 text-xs sm:text-sm">
                      {selectedClassModal.highlights.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedClassModal(null)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 text-center cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  const course = selectedClassModal;
                  setSelectedClassModal(null);
                  scrollToRegistrationForm(course);
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#EA580C] to-[#D9232A] hover:from-[#C2410C] hover:to-[#B91C1C] text-white text-xs sm:text-sm font-bold text-center cursor-pointer"
              >
                <span>Đăng ký học lớp {selectedClassModal.name}</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ACTIVITY DETAILS */}
      {selectedActivityModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-activity-title"
        >
          <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-xl border border-slate-200">
            <div className="h-56 w-full">
              <ActivityIllustration
                type={selectedActivityModal.illustrationType}
                title={selectedActivityModal.title}
                customImageUrl={selectedActivityModal.customImageUrl}
              />
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-bold text-[#0066A2]">
                    {selectedActivityModal.category} ·{' '}
                    {selectedActivityModal.teacher} ·{' '}
                    {selectedActivityModal.date}
                  </div>
                  <h3
                    id="modal-activity-title"
                    className="text-xl font-extrabold text-slate-900 mt-1"
                  >
                    {selectedActivityModal.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedActivityModal(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                  aria-label="Đóng"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-sm text-slate-700 leading-relaxed">
                {selectedActivityModal.details}
              </p>

              <div className="text-xs font-semibold text-[#059669] bg-emerald-50 border border-emerald-200/70 rounded-xl px-3.5 py-2.5">
                Kết quả ghi nhận: {selectedActivityModal.metrics}
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedActivityModal(null)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 text-center cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedActivityModal(null);
                    scrollToRegistrationForm();
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#EA580C] to-[#D9232A] hover:from-[#C2410C] hover:to-[#B91C1C] text-white text-xs font-bold text-center cursor-pointer"
                >
                  <span>Đăng ký học ngay</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRATION SUCCESS POPUP */}
      {submittedEntry && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-registration-success-title"
          onClick={() => setSubmittedEntry(null)}
        >
          <div
            className="relative rounded-2xl bg-emerald-50 border-2 border-emerald-200 max-w-lg w-full p-5 sm:p-6 pr-11 sm:pr-12 space-y-2.5 text-xs sm:text-sm text-emerald-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSubmittedEntry(null)}
              className="absolute top-3 right-3 p-1.5 rounded-xl text-emerald-700/70 hover:text-emerald-950 hover:bg-emerald-200/60 transition-colors cursor-pointer"
              aria-label="Đóng thông báo"
              title="Đóng"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <div className="flex flex-wrap items-center justify-between gap-2 font-bold text-emerald-800">
              <span
                id="modal-registration-success-title"
                className="flex items-center gap-1.5 text-sm sm:text-base"
              >
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0" />
                <span>Đã gửi đăng ký thành công lên hệ thống!</span>
              </span>
              <span className="font-mono-tabular text-xs sm:text-sm bg-white/80 border border-emerald-200 px-2.5 py-0.5 rounded-lg">
                Mã phiếu: {submittedEntry.registrationCode}
              </span>
            </div>

            <p className="leading-relaxed">
              Trung tâm Học Giỏi {centerInfo.campus} đã tiếp nhận đăng ký của học sinh{' '}
              <strong>{submittedEntry.studentName}</strong> cho lớp{' '}
              <strong>{submittedEntry.selectedClassName}</strong>. Trung tâm sẽ liên hệ qua số{' '}
              <strong className="font-mono-tabular">
                {submittedEntry.phone}
              </strong>{' '}
              trong thời gian sớm nhất.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
