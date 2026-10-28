import React, { useState, useEffect, useRef } from 'react';
import { ActivityItem } from '../data/centerData';

/**
 * Detects the actually visible horizontal bounds of the document inside the top-level
 * browser viewport (using W3C IntersectionObserver implicit root `root: null`).
 * When zooming in an embedded preview iframe where the parent container overflows
 * off-screen to the left or right, this returns the exact left/right inset needed
 * so `mx-auto` centers content in the middle of the visible screen.
 */
export function useVisibleViewportBounds() {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [insets, setInsets] = useState<{ left: number; right: number }>({
    left: 0,
    right: 0,
  });

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const thresholds = Array.from({ length: 101 }, (_, i) => i / 100);
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        const fullW = entry.boundingClientRect.width;
        const visW = entry.intersectionRect.width;
        if (fullW > 0 && visW > 280) {
          const leftClip = Math.max(
            0,
            Math.round(entry.intersectionRect.left - entry.boundingClientRect.left)
          );
          const rightClip = Math.max(
            0,
            Math.round(entry.boundingClientRect.right - entry.intersectionRect.right)
          );
          setInsets((prev) =>
            Math.abs(prev.left - leftClip) > 2 || Math.abs(prev.right - rightClip) > 2
              ? { left: leftClip, right: rightClip }
              : prev
          );
        }
      },
      { root: null, threshold: thresholds }
    );

    observer.observe(el);

    const refreshObservation = () => {
      if (!sentinelRef.current) return;
      observer.unobserve(sentinelRef.current);
      observer.observe(sentinelRef.current);
    };

    window.addEventListener('resize', refreshObservation);
    window.addEventListener('scroll', refreshObservation, { passive: true });
    window.visualViewport?.addEventListener('resize', refreshObservation);
    window.visualViewport?.addEventListener('scroll', refreshObservation);

    const intervalId = window.setInterval(refreshObservation, 800);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', refreshObservation);
      window.removeEventListener('scroll', refreshObservation);
      window.visualViewport?.removeEventListener('resize', refreshObservation);
      window.visualViewport?.removeEventListener('scroll', refreshObservation);
      window.clearInterval(intervalId);
    };
  }, []);

  return { sentinelRef, insets };
}

/**
 * Helper to extract Google Drive File ID from any share link format
 * e.g. https://drive.google.com/file/d/16ERvRURBvqvaRzKKqzuUYnoWUkbZHE1W/view?usp=drive_link
 */
export function extractGoogleDriveFileId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  const fileDMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch && fileDMatch[1]) return fileDMatch[1];

  const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParamMatch && idParamMatch[1]) return idParamMatch[1];

  const dMatch = trimmed.match(/googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);
  if (dMatch && dMatch[1]) return dMatch[1];

  return null;
}

/**
 * Returns an ordered array of direct image URLs to try for a given URL
 * (supporting both Google Drive share links and standard direct image URLs).
 */
export function resolveImageCandidates(url?: string): string[] {
  if (!url || !url.trim()) return [];
  const trimmed = url.trim();
  const driveId = extractGoogleDriveFileId(trimmed);
  if (driveId) {
    return [
      `https://lh3.googleusercontent.com/d/${driveId}=w2000`,
      `https://drive.google.com/thumbnail?id=${driveId}&sz=w2000`,
      `https://drive.google.com/uc?export=view&id=${driveId}`,
    ];
  }
  return [trimmed];
}

/**
 * Responsive Top Banner Card that automatically scales to fit the page width
 * and loads the user's Google Drive image (1IvO3VR6awaexVTNltG3ZTb1a0Q6quUtI).
 */
export const TopHeroBanner: React.FC<{
  bannerUrl?: string;
  altText?: string;
}> = ({
  bannerUrl = 'https://drive.google.com/file/d/1IvO3VR6awaexVTNltG3ZTb1a0Q6quUtI/view?usp=drive_link',
  altText = 'Banner Trung Tâm Giáo Dục & Bồi Dưỡng Kiến Thức Sa Thầy',
}) => {
  const normalizedUrl = (bannerUrl || '').trim();
  const candidates = resolveImageCandidates(normalizedUrl);
  const [attemptState, setAttemptState] = useState<{
    url: string;
    idx: number;
    failed: boolean;
  }>({ url: normalizedUrl, idx: 0, failed: false });

  const candidateIndex =
    attemptState.url === normalizedUrl ? attemptState.idx : 0;
  const allFailed =
    attemptState.url === normalizedUrl ? attemptState.failed : false;

  if (!candidates.length) return null;

  const currentSrc = candidates[candidateIndex] || candidates[0];

  const handleImageError = () => {
    if (candidateIndex + 1 < candidates.length) {
      setAttemptState({
        url: normalizedUrl,
        idx: candidateIndex + 1,
        failed: false,
      });
    } else {
      setAttemptState({
        url: normalizedUrl,
        idx: candidateIndex,
        failed: true,
      });
    }
  };

  return (
    <div className="w-full rounded-3xl overflow-hidden border-2 border-[#E6DFB8] bg-white shadow-xs flex items-center justify-center">
      {!allFailed ? (
        <img
          key={currentSrc}
          src={currentSrc}
          alt={altText}
          referrerPolicy="no-referrer"
          onError={handleImageError}
          className="w-full h-auto block object-contain max-h-[520px] mx-auto"
        />
      ) : (
        <div className="w-full bg-gradient-to-r from-[#004E7C] via-[#0066A2] to-[#0284C7] px-6 py-10 sm:py-14 text-white text-center space-y-2">
          <div className="text-xs font-bold uppercase tracking-widest text-amber-200">
            HỆ THỐNG QUẢN LÝ & BỒI DƯỠNG KIẾN THỨC
          </div>
          <div className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            {altText}
          </div>
          <div className="text-xs sm:text-sm text-sky-100">
            Cơ sở Sa Thầy · Quản lý Lớp học, Điểm danh & Sổ liên lạc điện tử
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Renders the multi-colored "HỌC GIỎI" wordmark matching the exact letter-by-letter
 * colors from the banner:
 * H (#0066B3 Blue) - Ọ (#D9232A Red) - C (#F59E0B Gold)
 * G (#EA580C Orange) - I (#0D9456 Green) - Ỏ (#F59E0B Gold) - I (#0066B3 Blue)
 */
export const HocGioiWordmark: React.FC<{ className?: string }> = ({
  className = 'text-xl sm:text-2xl font-black tracking-tight',
}) => {
  const strokeStyle: React.CSSProperties = {
    textShadow:
      '0 1px 0 #ffffff, 0 -1px 0 #ffffff, 1px 0 0 #ffffff, -1px 0 0 #ffffff, 0 2px 4px rgba(0,0,0,0.12)',
  };
  return (
    <span className={`inline-flex items-baseline select-none ${className}`} style={strokeStyle}>
      <span className="text-[#0066B3]">H</span>
      <span className="text-[#D9232A]">Ọ</span>
      <span className="text-[#F59E0B]">C</span>
      <span className="mx-1">&nbsp;</span>
      <span className="text-[#EA580C]">G</span>
      <span className="text-[#0D9456]">I</span>
      <span className="text-[#F59E0B]">Ỏ</span>
      <span className="text-[#0066B3]">I</span>
    </span>
  );
};

/**
 * Multi-color vertical indicator bar inspired by the Green - Orange - Red - Blue - Gold
 * ribbons of the TRUNG TÂM HỌC GIỎI banner
 */
export const HocGioiAccentBar: React.FC<{ variant?: 'blue' | 'orange' | 'green' | 'red' | 'multi' }> = ({
  variant = 'multi',
}) => {
  if (variant === 'multi') {
    return (
      <span
        className="w-2.5 h-8 rounded-full bg-gradient-to-b from-[#0D9456] via-[#EA580C] to-[#D9232A] shrink-0 shadow-2xs"
        aria-hidden="true"
      />
    );
  }
  const colorMap = {
    blue: 'bg-gradient-to-b from-[#0066B3] to-[#0D9456]',
    orange: 'bg-gradient-to-b from-[#EA580C] to-[#F59E0B]',
    green: 'bg-gradient-to-b from-[#064E29] to-[#0D9456]',
    red: 'bg-gradient-to-b from-[#D9232A] to-[#EA580C]',
  };
  return (
    <span
      className={`w-2.5 h-8 rounded-full ${colorMap[variant]} shrink-0 shadow-2xs`}
      aria-hidden="true"
    />
  );
};

/**
 * Exact recreation of the Center Logo from the screenshot:
 * Graduation cap + red/orange reader + green open book inside a soft rounded white badge.
 */
export const CenterLogoMark: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const dims = size === 'sm' ? 'w-10 h-10' : size === 'lg' ? 'w-14 h-14' : 'w-12 h-12';
  return (
    <div
      className={`${dims} rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center shrink-0 select-none`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 64 64" className="w-4/5 h-4/5" fill="none">
        {/* Graduation Cap */}
        <path d="M32 10L16 17L32 24L48 17L32 10Z" fill="#1E293B" />
        <path d="M23 20.5V25.5C23 27.5 27 29.5 32 29.5C37 29.5 41 27.5 41 25.5V20.5" fill="#334155" />
        <path d="M46 18V27" stroke="#F59E0B" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="46" cy="28" r="1.8" fill="#F59E0B" />
        {/* Reader / Student Body in warm red/orange */}
        <circle cx="32" cy="27" r="4.5" fill="#EA580C" />
        <path d="M21 37C21 32.5 25.8 30.5 32 30.5C38.2 30.5 43 32.5 43 37V43H21V37Z" fill="#EF4444" />
        {/* Open Green Book */}
        <path
          d="M14 39C20 39 26 41 32 44C38 41 44 39 50 39V51C44 51 38 52.5 32 55C26 52.5 20 51 14 51V39Z"
          fill="#16A34A"
        />
        <path
          d="M16 37C21.5 37 27 39 32 42C37 39 42.5 37 48 37"
          stroke="#FDE047"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <line x1="32" y1="42" x2="32" y2="54.5" stroke="#DCFCE7" strokeWidth="2" />
      </svg>
    </div>
  );
};

/**
 * 5-Bar Ascending Mini Chart matching the exact KPI cards in the screenshot
 */
export const MiniAscendingBars: React.FC<{ variant: 'blue' | 'amber' | 'emerald' }> = ({ variant }) => {
  const palette = {
    blue: ['bg-[#93C5FD]', 'bg-[#60A5FA]', 'bg-[#3B82F6]', 'bg-[#0284C7]', 'bg-[#005A8D]'],
    amber: ['bg-[#FDE68A]', 'bg-[#FCD34D]', 'bg-[#F59E0B]', 'bg-[#D97706]', 'bg-[#B45309]'],
    emerald: ['bg-[#A7F3D0]', 'bg-[#6EE7B7]', 'bg-[#34D399]', 'bg-[#10B981]', 'bg-[#047857]'],
  }[variant];

  const heights = ['h-3', 'h-4.5', 'h-6', 'h-7.5', 'h-9'];

  return (
    <div className="flex items-end gap-1.5 h-9 shrink-0" aria-hidden="true">
      {heights.map((h, idx) => (
        <span key={idx} className={`w-1.5 rounded-t-xs ${h} ${palette[idx]}`} />
      ))}
    </div>
  );
};

const DEFAULT_ACTIVITY_IMAGE_BY_TYPE: Record<string, string> = {
  'math-board':
    'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80',
  'physics-lab':
    'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=80',
  'digital-portal': '/assets/aistudio/image_8e9bd0f0.png',
  'award-session':
    'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&w=1200&q=80',
  'group-study':
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
  'parent-connect':
    'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=1200&q=80',
};

/**
 * Renders the Activity Card image directly from the link (`customImageUrl`) configured by Admin.
 * Supports Google Drive share links as well as direct image URLs.
 */
export const ActivityIllustration: React.FC<{
  type: ActivityItem['illustrationType'];
  title: string;
  customImageUrl?: string;
}> = ({ type, title, customImageUrl }) => {
  const effectiveUrl =
    (customImageUrl || '').trim() ||
    DEFAULT_ACTIVITY_IMAGE_BY_TYPE[type] ||
    DEFAULT_ACTIVITY_IMAGE_BY_TYPE['math-board'];
  const candidates = resolveImageCandidates(effectiveUrl);

  const [attemptState, setAttemptState] = useState<{
    url: string;
    idx: number;
    failed: boolean;
  }>({ url: effectiveUrl, idx: 0, failed: false });

  const candidateIdx =
    attemptState.url === effectiveUrl ? attemptState.idx : 0;
  const imgError =
    attemptState.url === effectiveUrl ? attemptState.failed : false;

  if (candidates.length > 0 && !imgError) {
    const activeSrc = candidates[candidateIdx] || candidates[0];
    return (
      <div className="relative w-full h-full bg-[#E2E8F0] overflow-hidden flex items-center justify-center">
        <img
          key={activeSrc}
          src={activeSrc}
          alt={title}
          referrerPolicy="no-referrer"
          onError={() => {
            if (candidateIdx + 1 < candidates.length) {
              setAttemptState({
                url: effectiveUrl,
                idx: candidateIdx + 1,
                failed: false,
              });
            } else {
              setAttemptState({
                url: effectiveUrl,
                idx: candidateIdx,
                failed: true,
              });
            }
          }}
          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/65 via-slate-900/15 to-transparent" />
        <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between text-white text-xs font-medium">
          <span className="truncate">{title}</span>
          <span className="font-mono-tabular opacity-90 shrink-0 ml-2">Cơ sở: Sa Thầy</span>
        </div>
      </div>
    );
  }

  if (type === 'math-board') {
    return (
      <div className="relative w-full h-full bg-gradient-to-br from-[#005A8D] via-[#026AA7] to-[#0F172A] overflow-hidden p-5 flex flex-col justify-between text-white">
        {/* Chalkboard / Whiteboard Geometry Diagram */}
        <svg viewBox="0 0 400 190" className="w-full h-full opacity-95" fill="none">
          <rect x="12" y="10" width="376" height="145" rx="10" fill="#0B3B5B" stroke="#38BDF8" strokeOpacity="0.35" strokeWidth="1.5" />
          {/* Grid lines */}
          <line x1="12" y1="45" x2="388" y2="45" stroke="#38BDF8" strokeOpacity="0.12" />
          <line x1="12" y1="85" x2="388" y2="85" stroke="#38BDF8" strokeOpacity="0.12" />
          <line x1="12" y1="125" x2="388" y2="125" stroke="#38BDF8" strokeOpacity="0.12" />
          {/* Thales Triangle Diagram */}
          <polygon points="95,30 45,132 165,132" stroke="#FDE047" strokeWidth="2.5" fill="#FDE047" fillOpacity="0.08" />
          <line x1="65" y1="91" x2="141" y2="91" stroke="#38BDF8" strokeWidth="2.2" strokeDasharray="5 3" />
          <circle cx="95" cy="30" r="3.5" fill="#FDE047" />
          <circle cx="45" cy="132" r="3.5" fill="#FDE047" />
          <circle cx="165" cy="132" r="3.5" fill="#FDE047" />
          <circle cx="65" cy="91" r="3.5" fill="#38BDF8" />
          <circle cx="141" cy="91" r="3.5" fill="#38BDF8" />
          <text x="90" y="24" fill="#FEF08A" fontSize="11" fontWeight="700">A</text>
          <text x="32" y="136" fill="#FEF08A" fontSize="11" fontWeight="700">B</text>
          <text x="172" y="136" fill="#FEF08A" fontSize="11" fontWeight="700">C</text>
          <text x="50" y="88" fill="#7DD3FC" fontSize="10" fontWeight="600">M</text>
          <text x="147" y="88" fill="#7DD3FC" fontSize="10" fontWeight="600">N</text>
          {/* Formulas on right side of board */}
          <text x="200" y="42" fill="#E0F2FE" fontSize="12" fontWeight="700">CHUYÊN ĐỀ TOÁN 8 · THẦY CHIẾN</text>
          <text x="200" y="68" fill="#7DD3FC" fontSize="11" fontFamily="monospace">MN // BC  ⇒  AM/AB = AN/AC</text>
          <text x="200" y="92" fill="#FDE68A" fontSize="11" fontFamily="monospace">ΔAMN ∽ ΔABC (g.g)</text>
          <rect x="200" y="108" width="162" height="28" rx="6" fill="#0284C7" fillOpacity="0.35" stroke="#38BDF8" strokeOpacity="0.4" />
          <text x="212" y="126" fill="#FFFFFF" fontSize="10.5" fontWeight="600">Thứ 2 - Thứ 4 - Thứ 6 (18:00 - 20:00)</text>
        </svg>
        <div className="flex items-center justify-between text-xs text-sky-100 pt-1">
          <span>Lớp Toán 8 · GV: thầy Chiến</span>
          <span className="font-mono-tabular">Phòng P.102 · Cơ sở Sa Thầy</span>
        </div>
      </div>
    );
  }

  if (type === 'physics-lab') {
    return (
      <div className="relative w-full h-full bg-gradient-to-br from-[#065F46] via-[#047857] to-[#0F172A] overflow-hidden p-5 flex flex-col justify-between text-white">
        <svg viewBox="0 0 400 190" className="w-full h-full opacity-95" fill="none">
          <rect x="12" y="10" width="376" height="145" rx="10" fill="#064E3B" stroke="#34D399" strokeOpacity="0.35" strokeWidth="1.5" />
          {/* Spring Force Meter & Pendulum Illustration */}
          <line x1="60" y1="24" x2="140" y2="24" stroke="#A7F3D0" strokeWidth="3" strokeLinecap="round" />
          {/* Spring */}
          <path d="M100 24 L100 36 L90 42 L110 50 L90 58 L110 66 L90 74 L100 80 L100 94" stroke="#FCD34D" strokeWidth="2.5" strokeLinejoin="round" />
          {/* Weight block */}
          <rect x="82" y="94" width="36" height="34" rx="5" fill="#10B981" stroke="#D1FAE5" strokeWidth="2" />
          <text x="91" y="115" fill="#FFFFFF" fontSize="11" fontWeight="700">m=200g</text>
          {/* Force arrow */}
          <line x1="132" y1="95" x2="132" y2="132" stroke="#F87171" strokeWidth="2.2" />
          <polygon points="132,136 128,128 136,128" fill="#F87171" />
          <text x="140" y="120" fill="#FCA5A5" fontSize="11" fontWeight="700">P = 10.m</text>

          {/* Right side lab notes */}
          <text x="195" y="42" fill="#ECFDF5" fontSize="12" fontWeight="700">THỰC HÀNH VẬT LÝ 6 · CÔ YẾN</text>
          <text x="195" y="68" fill="#6EE7B7" fontSize="11" fontFamily="monospace">Lực đàn hồi & Đo lực bằng Lực kế</text>
          <text x="195" y="90" fill="#FDE68A" fontSize="11" fontFamily="monospace">Độ biến dạng: Δl = l - l₀</text>
          <rect x="195" y="108" width="168" height="28" rx="6" fill="#059669" fillOpacity="0.45" stroke="#6EE7B7" strokeOpacity="0.4" />
          <text x="207" y="126" fill="#FFFFFF" fontSize="10.5" fontWeight="600">Thứ 2 - Thứ 4 - Thứ 6 (18:00 - 20:00)</text>
        </svg>
        <div className="flex items-center justify-between text-xs text-emerald-100 pt-1">
          <span>Lớp Lý 6 · GV: cô Yên</span>
          <span className="font-mono-tabular">Phòng P.101 · Cơ sở Sa Thầy</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-[#B45309] via-[#D97706] to-[#1E293B] overflow-hidden p-5 flex flex-col justify-between text-white">
      <svg viewBox="0 0 400 190" className="w-full h-full opacity-95" fill="none">
        <rect x="12" y="10" width="376" height="145" rx="10" fill="#1E293B" fillOpacity="0.7" stroke="#FCD34D" strokeOpacity="0.35" strokeWidth="1.5" />
        {/* Progress chart bars */}
        <rect x="42" y="98" width="22" height="38" rx="3" fill="#60A5FA" />
        <rect x="74" y="82" width="22" height="54" rx="3" fill="#38BDF8" />
        <rect x="106" y="64" width="22" height="72" rx="3" fill="#34D399" />
        <rect x="138" y="42" width="22" height="94" rx="3" fill="#FBBF24" />
        <polyline points="53,92 85,76 117,58 149,36" stroke="#FEF08A" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="149" cy="36" r="4" fill="#FEF08A" />
        {/* Assessment info */}
        <text x="190" y="44" fill="#FEF3C7" fontSize="12" fontWeight="700">ĐÁNH GIÁ NĂNG LỰC ĐỊNH KỲ</text>
        <text x="190" y="68" fill="#E2E8F0" fontSize="11">Theo dõi sát điểm số & chuyên cần</text>
        <text x="190" y="90" fill="#6EE7B7" fontSize="11" fontFamily="monospace">Sổ liên lạc điện tử cập nhật 24/7</text>
        <rect x="190" y="108" width="174" height="28" rx="6" fill="#D97706" fillOpacity="0.4" stroke="#FCD34D" strokeOpacity="0.4" />
        <text x="202" y="126" fill="#FFFFFF" fontSize="10.5" fontWeight="600">Cơ sở Sa Thầy · Hỗ trợ: 0396.257.977</text>
      </svg>
      <div className="flex items-center justify-between text-xs text-amber-100 pt-1">
        <span>Kiểm tra & Sổ liên lạc điện tử</span>
        <span className="font-mono-tabular">Cơ sở: Sa Thầy</span>
      </div>
    </div>
  );
};
