export interface CourseClass {
  id: string;
  code: string;
  subject: 'Toán' | 'Lý' | 'KHTN' | 'Tiếng Anh';
  name: string;
  grade: string;
  teacher: string;
  teacherRole: string;
  schedule: string;
  days: ('T2' | 'T3' | 'T4' | 'T5' | 'T6' | 'T7' | 'CN')[];
  timeSlot: string;
  room: string;
  studentsCount: number;
  maxStudents: number;
  status: string;
  tuitionNote: string;
  description: string;
  highlights: string[];
  accentColor: 'blue' | 'amber' | 'emerald';
}

export interface ActivityItem {
  id: string;
  title: string;
  category: 'Giờ học trên lớp' | 'Thực hành & Thí nghiệm' | 'Kiểm tra & Đánh giá' | 'Sổ liên lạc & Phụ huynh';
  date: string;
  teacher: string;
  location: string;
  summary: string;
  details: string;
  metrics: string;
  illustrationType: 'physics-lab' | 'math-board' | 'digital-portal' | 'group-study' | 'award-session' | 'parent-connect';
  customImageUrl?: string;
}

export interface TimetableSlot {
  dayLabel: string;
  dayShort: 'T2' | 'T3' | 'T4' | 'T5' | 'T6' | 'T7' | 'CN';
  dateExample: string;
  sessions: {
    classId: string;
    className: string;
    subject: 'Toán' | 'Lý' | 'KHTN' | 'Tiếng Anh';
    teacher: string;
    time: string;
    room: string;
  }[];
}

export const CENTER_INFO = {
  name: 'HỆ THỐNG QUẢN LÝ TRUNG TÂM',
  campus: 'Sa Thầy',
  fullTitle: 'Trung Tâm Học Giỏi',
  tagline: 'Quản lý Lớp học, Điểm danh & Sổ liên lạc điện tử đồng bộ',
  hotline: '0396.257.977',
  address: '01 Ngõ 350 - Trần Hưng Đạo - Sa Thầy - Quảng Ngãi',
  workingHours: '07:30 - 20:30 (Thứ 2 - Chủ Nhật)',
  managementUrl: 'https://quanly.tthocgioi.com',
  stats: {
    activeClasses: 0,
    featuredClassesInAdmin: 0,
    teachers: 0,
    students: 0,
  },
};

export const ACTIVE_CLASSES: CourseClass[] = [];

export const ACTIVITIES_GALLERY: ActivityItem[] = [];

export const WEEKLY_TIMETABLE: TimetableSlot[] = [
  {
    dayLabel: 'Thứ 2',
    dayShort: 'T2',
    dateExample: 'Ca học trong tuần',
    sessions: [],
  },
  {
    dayLabel: 'Thứ 3',
    dayShort: 'T3',
    dateExample: 'Ca học trong tuần',
    sessions: [],
  },
  {
    dayLabel: 'Thứ 4',
    dayShort: 'T4',
    dateExample: 'Ca học trong tuần',
    sessions: [],
  },
  {
    dayLabel: 'Thứ 5',
    dayShort: 'T5',
    dateExample: 'Ca học trong tuần',
    sessions: [],
  },
  {
    dayLabel: 'Thứ 6',
    dayShort: 'T6',
    dateExample: 'Ca học trong tuần',
    sessions: [],
  },
  {
    dayLabel: 'Thứ 7',
    dayShort: 'T7',
    dateExample: 'Ca học cuối tuần',
    sessions: [],
  },
  {
    dayLabel: 'Chủ Nhật',
    dayShort: 'CN',
    dateExample: 'Ca học cuối tuần',
    sessions: [],
  },
];

