import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import {
  CENTER_INFO,
  ACTIVE_CLASSES,
  ACTIVITIES_GALLERY,
  WEEKLY_TIMETABLE,
  CourseClass,
  ActivityItem,
  TimetableSlot,
} from './data/centerData';

// Firebase configuration (projectId: ttdaythemhocgioi)
export const firebaseConfig = {
  apiKey: 'AIzaSyD9laxr8zw9f1KTI4rpZXz08xb0CLI5JQ8',
  authDomain: 'ttdaythemhocgioi.firebaseapp.com',
  projectId: 'ttdaythemhocgioi',
  storageBucket: 'ttdaythemhocgioi.firebasestorage.app',
  messagingSenderId: '953317639711',
  appId: '1:953317639711:web:accbb9703ff61de352772a',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Default email domain for converting plain username (e.g. "admin" -> "admin@webapp.com")
export const DEFAULT_ADMIN_EMAIL_DOMAIN = 'webapp.com';

/**
 * Automatically converts a plain username (such as "admin") into an email format
 * required by Firebase Authentication (e.g., "admin@webapp.com").
 */
export function formatAdminUsernameToEmail(usernameInput: string): string {
  const cleaned = usernameInput.trim().toLowerCase();
  if (!cleaned) return '';
  if (cleaned.includes('@')) {
    return cleaned;
  }
  return `${cleaned}@${DEFAULT_ADMIN_EMAIL_DOMAIN}`;
}

export interface AdminAuthResult {
  success: boolean;
  message?: string;
  error?: string;
  uid?: string;
  email?: string;
  role?: string;
}

/**
 * Verifies whether a currently authenticated Firebase user has `role === 'admin'`
 * in Firestore collection `users/{uid}`.
 */
export async function verifyAdminRoleInFirestore(uid: string): Promise<{
  isAdmin: boolean;
  role?: string;
  error?: string;
}> {
  try {
    const userDocRef = doc(db, 'users', uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      return {
        isAdmin: false,
        error: `Không tìm thấy hồ sơ phân quyền tại collection "users/${uid}" trong Firestore.`,
      };
    }

    const data = userDocSnap.data();
    const role = typeof data?.role === 'string' ? data.role : undefined;

    if (role === 'admin') {
      return { isAdmin: true, role: 'admin' };
    }

    return {
      isAdmin: false,
      role,
      error: 'Tài khoản không có quyền Quản trị viên (yêu cầu trường role === "admin").',
    };
  } catch (err) {
    const rawMsg = err instanceof Error ? err.message : String(err);
    return {
      isAdmin: false,
      error: `Không thể kiểm tra quyền admin trong Firestore: ${rawMsg}`,
    };
  }
}

/**
 * Frontend Route Guard Login Function:
 * 1. Converts username (e.g. "admin") to email ("admin@webapp.com").
 * 2. Calls Firebase Auth `signInWithEmailAndPassword`.
 * 3. Queries Firestore collection `users` for document ID === `uid`.
 * 4. Checks `role === 'admin'`. Signs out immediately if not admin.
 */
export async function loginAdminWithFirebase(
  usernameInput: string,
  passwordInput: string
): Promise<AdminAuthResult> {
  const email = formatAdminUsernameToEmail(usernameInput);
  if (!email || !passwordInput) {
    return {
      success: false,
      error: 'Vui lòng nhập đầy đủ Username và Password.',
    };
  }

  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      passwordInput
    );
    const user = userCredential.user;

    // Query `users/{uid}` in Firestore to verify `role === 'admin'`
    const roleCheck = await verifyAdminRoleInFirestore(user.uid);

    if (roleCheck.isAdmin) {
      return {
        success: true,
        message: 'Đăng nhập thành công',
        uid: user.uid,
        email: user.email || email,
        role: 'admin',
      };
    }

    // Not an admin -> sign out immediately
    await signOut(auth);
    return {
      success: false,
      error:
        roleCheck.error ||
        'Tài khoản của bạn không có quyền truy cập trang Quản trị viên.',
    };
  } catch (err: unknown) {
    const firebaseErr = err as { code?: string; message?: string };
    const code = firebaseErr?.code || '';

    if (
      code === 'auth/invalid-credential' ||
      code === 'auth/user-not-found' ||
      code === 'auth/wrong-password'
    ) {
      return {
        success: false,
        error: `Sai tài khoản hoặc mật khẩu (Email xác thực: ${email}). Vui lòng kiểm tra lại.`,
      };
    }
    if (code === 'auth/invalid-email') {
      return {
        success: false,
        error: `Định dạng tài khoản email không hợp lệ (${email}).`,
      };
    }
    if (code === 'auth/too-many-requests') {
      return {
        success: false,
        error:
          'Tài khoản tạm thời bị khóa do đăng nhập sai nhiều lần. Vui lòng thử lại sau ít phút.',
      };
    }
    if (code === 'auth/operation-not-allowed') {
      return {
        success: false,
        error:
          'Phương thức đăng nhập Email/Password chưa được bật trong Firebase Console (Authentication > Sign-in method).',
      };
    }

    return {
      success: false,
      error:
        firebaseErr?.message ||
        'Đăng nhập thất bại. Vui lòng kiểm tra kết nối mạng hoặc cấu hình Firebase.',
    };
  }
}

/**
 * Signs out the current Firebase user.
 */
export async function logoutAdminFromFirebase(): Promise<void> {
  await signOut(auth);
}

/**
 * Subscribes to Firebase Auth state changes and verifies `role === 'admin'` in Firestore.
 */
export function subscribeToAdminAuth(
  onStatusChange: (state: {
    user: User | null;
    isAdmin: boolean;
    checking: boolean;
  }) => void
) {
  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      onStatusChange({ user: null, isAdmin: false, checking: false });
      return;
    }
    onStatusChange({ user, isAdmin: false, checking: true });
    const check = await verifyAdminRoleInFirestore(user.uid);
    if (check.isAdmin) {
      onStatusChange({ user, isAdmin: true, checking: false });
    } else {
      onStatusChange({ user: null, isAdmin: false, checking: false });
    }
  });
}

export interface CenterSiteInfo {
  name: string;
  campus: string;
  fullTitle: string;
  topBannerImageUrl?: string;
  portalPreviewImageUrl?: string;
  heroSubtitle: string;
  heroHeadline: string;
  heroDescription: string;
  tagline: string;
  hotline: string;
  address: string;
  workingHours: string;
  managementUrl: string;
  stats: {
    activeClasses: number;
    teachers: number;
    students: number;
  };
}

export interface SiteContentData {
  centerInfo: CenterSiteInfo;
  classes: CourseClass[];
  activities: (ActivityItem & { customImageUrl?: string })[];
  timetable: TimetableSlot[];
  updatedAt?: string;
}

export interface StudentRegistration {
  id: string;
  registrationCode: string;
  studentName: string;
  parentName: string;
  phone: string;
  grade: string;
  selectedClassId: string;
  selectedClassName: string;
  preferredSchedule: string;
  note: string;
  status: 'Mới đăng ký' | 'Đã liên hệ' | 'Đã xếp lớp' | 'Đã hủy';
  adminNote?: string;
  createdAt: string;
  createdAtMs: number;
}

export const DEFAULT_TOP_BANNER_URL =
  'https://drive.google.com/file/d/1IvO3VR6awaexVTNltG3ZTb1a0Q6quUtI/view?usp=drive_link';

export const DEFAULT_PORTAL_PREVIEW_URL = '/assets/aistudio/image_8e9bd0f0.png';

const LEGACY_TOP_BANNER_ID = '16ERvRURBvqvaRzKKqzuUYnoWUkbZHE1W';
const LEGACY_HOTLINES = [
  '0912.345.678',
  '0912345678',
  '0369.257.977',
  '0369257977',
  '0912.345.678 / 0396.257.977',
  '0912.345.678 / 0369.257.977',
];

const LEGACY_FULL_TITLES = [
  'Trung Tâm Giáo Dục Sa Thầy - Trang Chủ & Đăng Ký Học',
  'Trung tâm Giáo dục Sa Thầy - Trang chủ & Đăng Ký học',
  'Trung Tâm Giáo Dục & Bồi Dưỡng Kiến Thức Sa Thầy',
  'Trung Tâm Bồi Dưỡng Kiến Thức — Cơ Sở Sa Thầy',
  'Trung Tâm Giáo Dục Sa Thầy',
  'Trung tâm Giáo dục Sa Thầy',
];

function normalizeFullTitle(title?: string): string {
  const trimmed = (title || '').trim();
  if (
    !trimmed ||
    LEGACY_FULL_TITLES.includes(trimmed) ||
    trimmed.toLowerCase().includes('trung tâm giáo dục sa thầy')
  ) {
    return CENTER_INFO.fullTitle;
  }
  return trimmed;
}

function normalizeBannerUrl(url?: string): string {
  if (!url || !url.trim() || url.includes(LEGACY_TOP_BANNER_ID)) {
    return DEFAULT_TOP_BANNER_URL;
  }
  return url.trim();
}

function normalizeHotline(hotline?: string): string {
  const trimmed = (hotline || '').trim();
  if (
    !trimmed ||
    LEGACY_HOTLINES.includes(trimmed) ||
    trimmed.includes('0369.257.977') ||
    trimmed.includes('0369257977')
  ) {
    return CENTER_INFO.hotline;
  }
  return trimmed;
}

function normalizeActivitiesList(
  rawActivities?: (ActivityItem & { customImageUrl?: string })[]
): {
  items: (ActivityItem & { customImageUrl?: string })[];
  needsMigration: boolean;
} {
  if (!Array.isArray(rawActivities) || rawActivities.length === 0) {
    return { items: ACTIVITIES_GALLERY, needsMigration: true };
  }
  let needsMigration = false;
  const items = rawActivities.map((act, idx) => {
    const trimmedUrl = (act.customImageUrl || '').trim();
    if (trimmedUrl) {
      return { ...act, customImageUrl: trimmedUrl };
    }
    needsMigration = true;
    const matchedDefault =
      ACTIVITIES_GALLERY.find((d) => d.id === act.id) ||
      ACTIVITIES_GALLERY[idx % ACTIVITIES_GALLERY.length];
    return {
      ...act,
      customImageUrl:
        matchedDefault?.customImageUrl ||
        'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80',
    };
  });
  return { items, needsMigration };
}

export const DEFAULT_SITE_CONTENT: SiteContentData = {
  centerInfo: {
    name: CENTER_INFO.name,
    campus: CENTER_INFO.campus,
    fullTitle: CENTER_INFO.fullTitle,
    topBannerImageUrl: DEFAULT_TOP_BANNER_URL,
    portalPreviewImageUrl: DEFAULT_PORTAL_PREVIEW_URL,
    heroSubtitle:
      'Quản lý Lớp học · Bồi dưỡng Toán, Lý, KHTN, Tiếng Anh · Điểm danh & Sổ liên lạc điện tử',
    heroHeadline:
      'Nền tảng kiến thức vững vàng, theo dõi tiến độ học tập minh bạch mỗi ngày.',
    heroDescription:
      'Trung tâm quy tụ đội ngũ giáo viên tận tâm tại Sa Thầy (thầy Chiến, cô Yên, cô Thảo) với phương pháp giảng dạy sát năng lực từng học sinh. Kết hợp Hệ thống Quản lý Trung tâm trực tuyến giúp phụ huynh nắm bắt lịch học, chuyên cần và kết quả kiểm tra tức thì.',
    tagline: CENTER_INFO.tagline,
    hotline: CENTER_INFO.hotline,
    address: CENTER_INFO.address,
    workingHours: CENTER_INFO.workingHours,
    managementUrl: CENTER_INFO.managementUrl,
    stats: {
      activeClasses: ACTIVE_CLASSES.length,
      teachers: CENTER_INFO.stats.teachers,
      students: CENTER_INFO.stats.students,
    },
  },
  classes: ACTIVE_CLASSES,
  activities: ACTIVITIES_GALLERY,
  timetable: WEEKLY_TIMETABLE,
};

// Primary public document compatible with `match /public_data/{document=**}` rule
const PUBLIC_DATA_SITE_DOC_REF = doc(db, 'public_data', 'homepage');
// Legacy fallback document
const LEGACY_SITE_DOC_REF = doc(db, 'site_config', 'homepage');

// Registrations collections compatible with `match /admin_data/{document=**}` and legacy `registrations`
const ADMIN_REGISTRATIONS_COL_REF = collection(
  db,
  'admin_data',
  'center',
  'registrations'
);
const LEGACY_REGISTRATIONS_COL_REF = collection(db, 'registrations');

const LOCAL_SITE_CACHE_KEY = 'sathay_site_content_cache_v7';
const LOCAL_REG_CACHE_KEY = 'sathay_registrations_cache_v2';

export function getCachedSiteContent(): SiteContentData {
  try {
    const raw = localStorage.getItem(LOCAL_SITE_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const mergedCenterInfo: CenterSiteInfo = {
        ...DEFAULT_SITE_CONTENT.centerInfo,
        ...(parsed.centerInfo || {}),
      };
      mergedCenterInfo.fullTitle = normalizeFullTitle(
        mergedCenterInfo.fullTitle
      );
      mergedCenterInfo.topBannerImageUrl = normalizeBannerUrl(
        mergedCenterInfo.topBannerImageUrl
      );
      mergedCenterInfo.portalPreviewImageUrl =
        (mergedCenterInfo.portalPreviewImageUrl || '').trim() ||
        DEFAULT_PORTAL_PREVIEW_URL;
      mergedCenterInfo.hotline = normalizeHotline(mergedCenterInfo.hotline);
      const { items: normalizedActs } = normalizeActivitiesList(
        parsed.activities
      );
      return {
        ...DEFAULT_SITE_CONTENT,
        ...parsed,
        centerInfo: mergedCenterInfo,
        activities: normalizedActs,
      };
    }
  } catch {
    // ignore
  }
  return DEFAULT_SITE_CONTENT;
}

export function setCachedSiteContent(data: SiteContentData) {
  try {
    localStorage.setItem(LOCAL_SITE_CACHE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function getCachedRegistrations(): StudentRegistration[] {
  try {
    const raw = localStorage.getItem(LOCAL_REG_CACHE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return [];
}

export function setCachedRegistrations(list: StudentRegistration[]) {
  try {
    localStorage.setItem(LOCAL_REG_CACHE_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

function parseRawSiteSnapshot(raw: Partial<SiteContentData>): {
  merged: SiteContentData;
  shouldMigrate: boolean;
} {
  const rawBanner = raw.centerInfo?.topBannerImageUrl;
  const rawHotline = (raw.centerInfo?.hotline || '').trim();
  const rawTitle = (raw.centerInfo?.fullTitle || '').trim();
  const normalizedTitle = normalizeFullTitle(rawTitle);
  const normalizedBanner = normalizeBannerUrl(rawBanner);
  const normalizedPortalImg =
    (raw.centerInfo?.portalPreviewImageUrl || '').trim() ||
    DEFAULT_PORTAL_PREVIEW_URL;
  const normalizedPhone = normalizeHotline(rawHotline);
  const { items: normalizedActivities, needsMigration } =
    normalizeActivitiesList(raw.activities);

  const merged: SiteContentData = {
    centerInfo: {
      ...DEFAULT_SITE_CONTENT.centerInfo,
      ...(raw.centerInfo || {}),
      fullTitle: normalizedTitle,
      hotline: normalizedPhone,
      topBannerImageUrl: normalizedBanner,
      portalPreviewImageUrl: normalizedPortalImg,
    },
    classes: Array.isArray(raw.classes)
      ? raw.classes
      : DEFAULT_SITE_CONTENT.classes,
    activities: normalizedActivities,
    timetable: Array.isArray(raw.timetable)
      ? raw.timetable
      : DEFAULT_SITE_CONTENT.timetable,
    updatedAt: raw.updatedAt,
  };

  const shouldMigrate = Boolean(
    (rawBanner && rawBanner.includes(LEGACY_TOP_BANNER_ID)) ||
      LEGACY_HOTLINES.includes(rawHotline) ||
      normalizedPhone !== rawHotline ||
      normalizedTitle !== rawTitle ||
      needsMigration
  );

  return { merged, shouldMigrate };
}

/**
 * Subscribe to real-time Homepage Content from Firestore `public_data/homepage`
 * (with automatic fallback to `site_config/homepage`).
 */
export function subscribeToSiteContent(
  onData: (data: SiteContentData, syncedWithFirebase: boolean) => void,
  onError?: (errMessage: string) => void
) {
  let fallbackUnsub: (() => void) | null = null;

  const primaryUnsub = onSnapshot(
    PUBLIC_DATA_SITE_DOC_REF,
    async (snap) => {
      if (snap.exists()) {
        const raw = snap.data() as Partial<SiteContentData>;
        const { merged, shouldMigrate } = parseRawSiteSnapshot(raw);
        setCachedSiteContent(merged);
        onData(merged, true);
        if (shouldMigrate && auth.currentUser) {
          try {
            await setDoc(PUBLIC_DATA_SITE_DOC_REF, merged);
          } catch {
            // ignore background migration error if not admin
          }
        }
      } else {
        // Check legacy `site_config/homepage` if `public_data/homepage` does not exist yet
        try {
          const legacySnap = await getDoc(LEGACY_SITE_DOC_REF);
          if (legacySnap.exists()) {
            const { merged } = parseRawSiteSnapshot(
              legacySnap.data() as Partial<SiteContentData>
            );
            setCachedSiteContent(merged);
            onData(merged, true);
            return;
          }
        } catch {
          // ignore if legacy path is blocked by rules
        }

        const initialData: SiteContentData = {
          ...getCachedSiteContent(),
          updatedAt: new Date().toISOString(),
        };
        onData(initialData, true);
      }
    },
    (err) => {
      // Fallback to legacy `site_config/homepage` subscription if needed
      fallbackUnsub = onSnapshot(
        LEGACY_SITE_DOC_REF,
        (legacySnap) => {
          if (legacySnap.exists()) {
            const { merged } = parseRawSiteSnapshot(
              legacySnap.data() as Partial<SiteContentData>
            );
            setCachedSiteContent(merged);
            onData(merged, true);
          } else {
            onData(getCachedSiteContent(), false);
          }
        },
        () => {
          onData(getCachedSiteContent(), false);
          if (onError) {
            onError(err.message);
          }
        }
      );
    }
  );

  return () => {
    primaryUnsub();
    if (fallbackUnsub) fallbackUnsub();
  };
}

/**
 * Save updated SiteContentData to Firestore `public_data/homepage` (and `site_config/homepage` if allowed)
 */
export async function saveSiteContentToFirebase(
  newData: SiteContentData
): Promise<{
  savedToCloud: boolean;
  error?: string;
}> {
  const payload: SiteContentData = {
    ...newData,
    updatedAt: new Date().toISOString(),
  };
  setCachedSiteContent(payload);

  const results = await Promise.allSettled([
    setDoc(PUBLIC_DATA_SITE_DOC_REF, payload),
    setDoc(LEGACY_SITE_DOC_REF, payload),
  ]);

  const anySucceeded = results.some((r) => r.status === 'fulfilled');
  if (anySucceeded) {
    return { savedToCloud: true };
  }

  const firstRejected = results.find(
    (r): r is PromiseRejectedResult => r.status === 'rejected'
  );
  return {
    savedToCloud: false,
    error:
      firstRejected?.reason instanceof Error
        ? firstRejected.reason.message
        : String(firstRejected?.reason || 'Permission denied'),
  };
}

/**
 * Subscribe to real-time Student Registrations from Firestore (`admin_data/center/registrations` or `registrations`)
 */
export function subscribeToRegistrations(
  onData: (list: StudentRegistration[], syncedWithFirebase: boolean) => void,
  onError?: (errMessage: string) => void
) {
  let legacyUnsub: (() => void) | null = null;
  const qAdmin = query(
    ADMIN_REGISTRATIONS_COL_REF,
    orderBy('createdAtMs', 'desc')
  );

  const unsubAdmin = onSnapshot(
    qAdmin,
    (snap) => {
      const items: StudentRegistration[] = snap.docs.map((d) => {
        const data = d.data() as Omit<StudentRegistration, 'id'>;
        return {
          ...data,
          id: d.id,
        };
      });
      if (items.length > 0) {
        setCachedRegistrations(items);
        onData(items, true);
      } else {
        onData(getCachedRegistrations(), true);
      }
    },
    () => {
      // Fallback to legacy `registrations` collection
      const qLegacy = query(
        LEGACY_REGISTRATIONS_COL_REF,
        orderBy('createdAtMs', 'desc')
      );
      legacyUnsub = onSnapshot(
        qLegacy,
        (snap) => {
          const items: StudentRegistration[] = snap.docs.map((d) => {
            const data = d.data() as Omit<StudentRegistration, 'id'>;
            return {
              ...data,
              id: d.id,
            };
          });
          setCachedRegistrations(items);
          onData(items, true);
        },
        (err) => {
          onData(getCachedRegistrations(), false);
          if (onError) {
            onError(err.message);
          }
        }
      );
    }
  );

  return () => {
    unsubAdmin();
    if (legacyUnsub) legacyUnsub();
  };
}

/**
 * Submit a new student registration to Firestore
 */
export async function createRegistrationInFirebase(
  entry: Omit<StudentRegistration, 'id'>
): Promise<{ item: StudentRegistration; savedToCloud: boolean; error?: string }> {
  const results = await Promise.allSettled([
    addDoc(ADMIN_REGISTRATIONS_COL_REF, entry),
    addDoc(LEGACY_REGISTRATIONS_COL_REF, entry),
  ]);

  for (const r of results) {
    if (r.status === 'fulfilled') {
      const created: StudentRegistration = {
        ...entry,
        id: r.value.id,
      };
      const current = getCachedRegistrations();
      setCachedRegistrations([
        created,
        ...current.filter((item) => item.id !== created.id),
      ]);
      return { item: created, savedToCloud: true };
    }
  }

  const fallbackId = `local-${Date.now()}`;
  const created: StudentRegistration = { ...entry, id: fallbackId };
  const current = getCachedRegistrations();
  setCachedRegistrations([created, ...current]);
  const firstRejected = results.find(
    (r): r is PromiseRejectedResult => r.status === 'rejected'
  );
  return {
    item: created,
    savedToCloud: false,
    error:
      firstRejected?.reason instanceof Error
        ? firstRejected.reason.message
        : String(firstRejected?.reason || ''),
  };
}

/**
 * Update a registration's status or adminNote in Firestore
 */
export async function updateRegistrationInFirebase(
  id: string,
  updates: Partial<
    Pick<
      StudentRegistration,
      | 'status'
      | 'adminNote'
      | 'selectedClassId'
      | 'selectedClassName'
      | 'preferredSchedule'
    >
  >
): Promise<{ savedToCloud: boolean; error?: string }> {
  const cached = getCachedRegistrations().map((r) =>
    r.id === id ? { ...r, ...updates } : r
  );
  setCachedRegistrations(cached);

  if (id.startsWith('local-')) {
    return { savedToCloud: false };
  }

  const results = await Promise.allSettled([
    updateDoc(doc(db, 'admin_data', 'center', 'registrations', id), updates),
    updateDoc(doc(db, 'registrations', id), updates),
  ]);

  if (results.some((r) => r.status === 'fulfilled')) {
    return { savedToCloud: true };
  }

  const firstRejected = results.find(
    (r): r is PromiseRejectedResult => r.status === 'rejected'
  );
  return {
    savedToCloud: false,
    error:
      firstRejected?.reason instanceof Error
        ? firstRejected.reason.message
        : String(firstRejected?.reason || ''),
  };
}

/**
 * Delete a registration document from Firestore
 */
export async function deleteRegistrationFromFirebase(id: string): Promise<{
  savedToCloud: boolean;
  error?: string;
}> {
  const cached = getCachedRegistrations().filter((r) => r.id !== id);
  setCachedRegistrations(cached);

  if (id.startsWith('local-')) {
    return { savedToCloud: false };
  }

  const results = await Promise.allSettled([
    deleteDoc(doc(db, 'admin_data', 'center', 'registrations', id)),
    deleteDoc(doc(db, 'registrations', id)),
  ]);

  if (results.some((r) => r.status === 'fulfilled')) {
    return { savedToCloud: true };
  }

  const firstRejected = results.find(
    (r): r is PromiseRejectedResult => r.status === 'rejected'
  );
  return {
    savedToCloud: false,
    error:
      firstRejected?.reason instanceof Error
        ? firstRejected.reason.message
        : String(firstRejected?.reason || ''),
  };
}
