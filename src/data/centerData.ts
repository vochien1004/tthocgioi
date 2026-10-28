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
  managementUrl: 'https://quanlytrungtam.pages.dev',
  stats: {
    activeClasses: 6,
    featuredClassesInAdmin: 2,
    teachers: 5,
    students: 68,
  },
};

export const ACTIVE_CLASSES: CourseClass[] = [
  {
    id: 'ly-6-co-yen',
    code: 'LY06-ST',
    subject: 'Lý',
    name: 'Lý 6',
    grade: 'Khối 6',
    teacher: 'cô Yên',
    teacherRole: 'Giáo viên Vật Lý & Khoa học Tự nhiên',
    schedule: 'Thứ 2 - Thứ 4 - Thứ 6 (18:00 - 20:00)',
    days: ['T2', 'T4', 'T6'],
    timeSlot: '18:00 - 20:00',
    room: 'Phòng P.101 - Cơ sở Sa Thầy',
    studentsCount: 12,
    maxStudents: 20,
    status: 'Đang nhận học sinh',
    tuitionNote: 'Học thử 2 buổi đầu miễn phí',
    description:
      'Xây dựng nền tảng Vật Lý & Khoa học tự nhiên lớp 6 vững chắc qua hệ thống thí nghiệm trực quan, rèn kỹ năng giải bài tập định lượng và giải thích hiện tượng thực tế.',
    highlights: [
      'Bám sát chương trình SGK mới & mở rộng tư duy thực nghiệm',
      'Điểm danh và gửi nhận xét sau mỗi buổi học qua Sổ liên lạc',
      'Kiểm tra định kỳ hàng tháng đánh giá sự tiến bộ',
    ],
    accentColor: 'blue',
  },
  {
    id: 'toan-8-thay-chien',
    code: 'TOAN08-ST',
    subject: 'Toán',
    name: 'Toán 8',
    grade: 'Khối 8',
    teacher: 'thầy Chiến',
    teacherRole: 'Giáo viên Toán THCS & Luyện thi',
    schedule: 'Thứ 2 - Thứ 4 - Thứ 6 (18:00 - 20:00)',
    days: ['T2', 'T4', 'T6'],
    timeSlot: '18:00 - 20:00',
    room: 'Phòng P.102 - Cơ sở Sa Thầy',
    studentsCount: 15,
    maxStudents: 20,
    status: 'Đang nhận học sinh',
    tuitionNote: 'Học thử 2 buổi đầu miễn phí',
    description:
      'Làm chủ Đại số (Hằng đẳng thức, Phân thức, Phương trình) và Hình học phẳng lớp 8 (Định lý Thalès, Tam giác đồng dạng). Rèn phương pháp trình bày chặt chẽ, tối ưu điểm số.',
    highlights: [
      'Phân dạng bài tập từ cơ bản đến vận dụng cao',
      'Kèm sát từng học sinh hổng kiến thức hình học & đại số',
      'Cập nhật kết quả học tập trực tiếp trên hệ thống quản lý',
    ],
    accentColor: 'blue',
  },
  {
    id: 'toan-9-thay-chien',
    code: 'TOAN09-ST',
    subject: 'Toán',
    name: 'Toán 9 - Luyện Thi Vào 10',
    grade: 'Khối 9',
    teacher: 'thầy Chiến',
    teacherRole: 'Giáo viên Toán THCS & Luyện thi',
    schedule: 'Thứ 3 - Thứ 5 - Thứ 7 (18:00 - 20:00)',
    days: ['T3', 'T5', 'T7'],
    timeSlot: '18:00 - 20:00',
    room: 'Phòng P.102 - Cơ sở Sa Thầy',
    studentsCount: 18,
    maxStudents: 22,
    status: 'Sắp đủ sĩ số',
    tuitionNote: 'Tặng bộ chuyên đề luyện thi vào 10',
    description:
      'Tổng ôn toàn diện kiến thức Toán 9 (Căn thức, Hệ phương trình, Hàm số bậc hai, Đường tròn) và luyện giải đề thi tuyển sinh vào lớp 10 các năm.',
    highlights: [
      'Luyện đề thi thử chuẩn cấu trúc Sở GD&ĐT hàng tuần',
      'Chữa bài chi tiết, khắc phục lỗi sai mất điểm đáng tiếc',
      'Báo cáo tiến độ điểm số cho phụ huynh định kỳ',
    ],
    accentColor: 'amber',
  },
  {
    id: 'ly-7-co-yen',
    code: 'LY07-ST',
    subject: 'Lý',
    name: 'Lý 7 & KHTN',
    grade: 'Khối 7',
    teacher: 'cô Yên',
    teacherRole: 'Giáo viên Vật Lý & Khoa học Tự nhiên',
    schedule: 'Thứ 3 - Thứ 5 - Thứ 7 (18:00 - 20:00)',
    days: ['T3', 'T5', 'T7'],
    timeSlot: '18:00 - 20:00',
    room: 'Phòng P.101 - Cơ sở Sa Thầy',
    studentsCount: 11,
    maxStudents: 18,
    status: 'Đang nhận học sinh',
    tuitionNote: 'Học thử 2 buổi đầu miễn phí',
    description:
      'Chuyên đề Tốc độ, Âm thanh, Ánh sáng và Từ trường lớp 7. Giúp học sinh nắm chắc bản chất vật lý, tự tin đạt điểm giỏi trong các kỳ thi giữa kỳ và cuối kỳ.',
    highlights: [
      'Sơ đồ tư duy hệ thống hóa công thức dễ nhớ',
      'Thực hành mô phỏng trực quan ngay tại lớp học',
      'Hỗ trợ giải đáp bài tập khó ngoài giờ học',
    ],
    accentColor: 'emerald',
  },
  {
    id: 'toan-6-nen-tang',
    code: 'TOAN06-ST',
    subject: 'Toán',
    name: 'Toán 6 - Tư Duy & Nền Tảng',
    grade: 'Khối 6',
    teacher: 'thầy Chiến',
    teacherRole: 'Giáo viên Toán THCS & Luyện thi',
    schedule: 'Thứ 7 - Chủ Nhật (15:00 - 17:00)',
    days: ['T7', 'CN'],
    timeSlot: '15:00 - 17:00',
    room: 'Phòng P.102 - Cơ sở Sa Thầy',
    studentsCount: 12,
    maxStudents: 18,
    status: 'Đang nhận học sinh',
    tuitionNote: 'Phù hợp học sinh chuyển cấp lên lớp 6',
    description:
      'Giúp học sinh lớp 6 bắt nhịp nhanh phương pháp học Toán THCS: Số tự nhiên, Số nguyên, Phân số, Số thập phân và Hình học trực quan.',
    highlights: [
      'Rèn kỹ năng tính nhanh, trình bày bài tự luận chuẩn xác',
      'Bồi dưỡng niềm yêu thích môn Toán ngay từ đầu cấp 2',
      'Sĩ số giới hạn để giáo viên theo sát từng em',
    ],
    accentColor: 'emerald',
  },
  {
    id: 'tieng-anh-thcs',
    code: 'ANH07-ST',
    subject: 'Tiếng Anh',
    name: 'Tiếng Anh THCS (Khối 6 - 8)',
    grade: 'Khối 6 - 8',
    teacher: 'cô Thảo',
    teacherRole: 'Giáo viên Tiếng Anh THCS',
    schedule: 'Thứ 7 - Chủ Nhật (08:30 - 10:30)',
    days: ['T7', 'CN'],
    timeSlot: '08:30 - 10:30',
    room: 'Phòng P.103 - Cơ sở Sa Thầy',
    studentsCount: 10,
    maxStudents: 16,
    status: 'Đang nhận học sinh',
    tuitionNote: 'Kiểm tra trình độ đầu vào miễn phí',
    description:
      'Củng cố toàn diện Ngữ pháp, Từ vựng bám sát SGK Global Success và phát triển kỹ năng Nghe - Nói phản xạ tự nhiên cho học sinh THCS tại Sa Thầy.',
    highlights: [
      'Hệ thống hóa ngữ pháp trọng tâm và luyện đề kiểm tra',
      'Luyện phát âm chuẩn và giao tiếp theo chủ đề',
      'Theo dõi chuyên cần và bài tập về nhà qua hệ thống',
    ],
    accentColor: 'amber',
  },
];

export const ACTIVITIES_GALLERY: ActivityItem[] = [
  {
    id: 'act-1',
    title: 'Giờ học chuyên đề Hình học phẳng Lớp Toán 8 cùng thầy Chiến',
    category: 'Giờ học trên lớp',
    date: 'Thứ 4 · 18:00 - 20:00',
    teacher: 'GV: thầy Chiến',
    location: 'Phòng học P.102 · Cơ sở Sa Thầy',
    summary:
      'Học sinh hào hứng thảo luận phương pháp chứng minh tam giác đồng dạng và ứng dụng định lý Thalès vào bài toán thực tế.',
    details:
      'Trong mỗi buổi học Toán 8, thầy Chiến hướng dẫn học sinh phân tích giả thiết - kết luận theo sơ đồ ngược, giúp các em tự tìm lời giải thay vì học vẹt. Cuối buổi, điểm chuyên cần và nhận xét được đồng bộ lên Hệ thống Quản lý Trung tâm.',
    metrics: '100% học sinh nắm vững dạng bài cơ bản ngay tại lớp',
    illustrationType: 'math-board',
    customImageUrl:
      'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'act-2',
    title: 'Thực hành đo lường & khám phá Khoa học tự nhiên Lớp Lý 6 cùng cô Yên',
    category: 'Thực hành & Thí nghiệm',
    date: 'Thứ 6 · 18:00 - 20:00',
    teacher: 'GV: cô Yên',
    location: 'Phòng học P.101 · Cơ sở Sa Thầy',
    summary:
      'Trải nghiệm dụng cụ đo khối lượng, lực kế và quan sát trực quan các hiện tượng vật lý xung quanh đời sống.',
    details:
      'Lớp Lý 6 của cô Yên kết hợp chặt chẽ giữa lý thuyết SGK và quan sát thực nghiệm. Học sinh được trực tiếp thao tác với lực kế lò xo, thước đo và thảo luận nhóm, giúp việc ghi nhớ công thức vật lý trở nên tự nhiên và sâu sắc.',
    metrics: 'Hoạt động nhóm 3-4 học sinh/bộ dụng cụ thực hành',
    illustrationType: 'physics-lab',
    customImageUrl:
      'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'act-3',
    title: 'Vận hành Hệ thống Quản lý Lớp học, Điểm danh & Sổ liên lạc điện tử',
    category: 'Sổ liên lạc & Phụ huynh',
    date: 'Cập nhật hàng ngày',
    teacher: 'Quản trị viên · Cơ sở Sa Thầy',
    location: 'Cổng trực tuyến quanlytrungtam.pages.dev',
    summary:
      'Đồng bộ dữ liệu lớp học trên Firestore, quản lý hồ sơ học sinh và xuất báo cáo tổng hợp nhanh chóng, minh bạch.',
    details:
      'Trung tâm Học Giỏi ứng dụng nền tảng quản trị hiện đại tại quanlytrungtam.pages.dev: quản lý danh sách lớp học, tài khoản giáo viên & phụ huynh, điểm danh theo ca học và xuất file Excel tổng hợp chỉ với 1 thao tác.',
    metrics: 'Đồng bộ thời gian thực giữa Trung tâm - Giáo viên - Phụ huynh',
    illustrationType: 'digital-portal',
    customImageUrl: '/assets/aistudio/image_8e9bd0f0.png',
  },
  {
    id: 'act-4',
    title: 'Kiểm tra đánh giá năng lực định kỳ & Bồi dưỡng học sinh tiến bộ',
    category: 'Kiểm tra & Đánh giá',
    date: 'Định kỳ cuối tháng',
    teacher: 'Hội đồng chuyên môn Sa Thầy',
    location: 'Cơ sở Sa Thầy',
    summary:
      'Tổ chức kiểm tra định kỳ nghiêm túc nhằm đánh giá sát năng lực thực tế và điều chỉnh lộ trình kèm cặp từng em.',
    details:
      'Sau mỗi bài kiểm tra 45 phút hoặc 90 phút, giáo viên chấm chữa chi tiết từng bước biến đổi, thống kê các lỗi sai phổ biến và gửi kết quả kèm định hướng ôn tập về cho phụ huynh thông qua Sổ liên lạc của trung tâm.',
    metrics: 'Trên 85% học sinh cải thiện từ 1.5 - 2.5 điểm sau 1 học kỳ',
    illustrationType: 'award-session',
    customImageUrl:
      'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&w=1200&q=80',
  },
];

export const WEEKLY_TIMETABLE: TimetableSlot[] = [
  {
    dayLabel: 'Thứ 2',
    dayShort: 'T2',
    dateExample: 'Ca tối 18:00 - 20:00',
    sessions: [
      {
        classId: 'ly-6-co-yen',
        className: 'Lý 6',
        subject: 'Lý',
        teacher: 'GV: cô Yên',
        time: '18:00 - 20:00',
        room: 'P.101',
      },
      {
        classId: 'toan-8-thay-chien',
        className: 'Toán 8',
        subject: 'Toán',
        teacher: 'GV: thầy Chiến',
        time: '18:00 - 20:00',
        room: 'P.102',
      },
    ],
  },
  {
    dayLabel: 'Thứ 3',
    dayShort: 'T3',
    dateExample: 'Ca tối 18:00 - 20:00',
    sessions: [
      {
        classId: 'ly-7-co-yen',
        className: 'Lý 7 & KHTN',
        subject: 'Lý',
        teacher: 'GV: cô Yên',
        time: '18:00 - 20:00',
        room: 'P.101',
      },
      {
        classId: 'toan-9-thay-chien',
        className: 'Toán 9 - Luyện Thi 10',
        subject: 'Toán',
        teacher: 'GV: thầy Chiến',
        time: '18:00 - 20:00',
        room: 'P.102',
      },
    ],
  },
  {
    dayLabel: 'Thứ 4',
    dayShort: 'T4',
    dateExample: 'Ca tối 18:00 - 20:00',
    sessions: [
      {
        classId: 'ly-6-co-yen',
        className: 'Lý 6',
        subject: 'Lý',
        teacher: 'GV: cô Yên',
        time: '18:00 - 20:00',
        room: 'P.101',
      },
      {
        classId: 'toan-8-thay-chien',
        className: 'Toán 8',
        subject: 'Toán',
        teacher: 'GV: thầy Chiến',
        time: '18:00 - 20:00',
        room: 'P.102',
      },
    ],
  },
  {
    dayLabel: 'Thứ 5',
    dayShort: 'T5',
    dateExample: 'Ca tối 18:00 - 20:00',
    sessions: [
      {
        classId: 'ly-7-co-yen',
        className: 'Lý 7 & KHTN',
        subject: 'Lý',
        teacher: 'GV: cô Yên',
        time: '18:00 - 20:00',
        room: 'P.101',
      },
      {
        classId: 'toan-9-thay-chien',
        className: 'Toán 9 - Luyện Thi 10',
        subject: 'Toán',
        teacher: 'GV: thầy Chiến',
        time: '18:00 - 20:00',
        room: 'P.102',
      },
    ],
  },
  {
    dayLabel: 'Thứ 6',
    dayShort: 'T6',
    dateExample: 'Ca tối 18:00 - 20:00',
    sessions: [
      {
        classId: 'ly-6-co-yen',
        className: 'Lý 6',
        subject: 'Lý',
        teacher: 'GV: cô Yên',
        time: '18:00 - 20:00',
        room: 'P.101',
      },
      {
        classId: 'toan-8-thay-chien',
        className: 'Toán 8',
        subject: 'Toán',
        teacher: 'GV: thầy Chiến',
        time: '18:00 - 20:00',
        room: 'P.102',
      },
    ],
  },
  {
    dayLabel: 'Thứ 7',
    dayShort: 'T7',
    dateExample: 'Ca sáng · chiều · tối',
    sessions: [
      {
        classId: 'tieng-anh-thcs',
        className: 'Tiếng Anh THCS',
        subject: 'Tiếng Anh',
        teacher: 'GV: cô Thảo',
        time: '08:30 - 10:30',
        room: 'P.103',
      },
      {
        classId: 'toan-6-nen-tang',
        className: 'Toán 6 - Nền Tảng',
        subject: 'Toán',
        teacher: 'GV: thầy Chiến',
        time: '15:00 - 17:00',
        room: 'P.102',
      },
      {
        classId: 'ly-7-co-yen',
        className: 'Lý 7 & KHTN',
        subject: 'Lý',
        teacher: 'GV: cô Yên',
        time: '18:00 - 20:00',
        room: 'P.101',
      },
      {
        classId: 'toan-9-thay-chien',
        className: 'Toán 9 - Luyện Thi 10',
        subject: 'Toán',
        teacher: 'GV: thầy Chiến',
        time: '18:00 - 20:00',
        room: 'P.102',
      },
    ],
  },
  {
    dayLabel: 'Chủ Nhật',
    dayShort: 'CN',
    dateExample: 'Ca sáng · chiều',
    sessions: [
      {
        classId: 'tieng-anh-thcs',
        className: 'Tiếng Anh THCS',
        subject: 'Tiếng Anh',
        teacher: 'GV: cô Thảo',
        time: '08:30 - 10:30',
        room: 'P.103',
      },
      {
        classId: 'toan-6-nen-tang',
        className: 'Toán 6 - Nền Tảng',
        subject: 'Toán',
        teacher: 'GV: thầy Chiến',
        time: '15:00 - 17:00',
        room: 'P.102',
      },
    ],
  },
];
