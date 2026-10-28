import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  formatAdminUsernameToEmail,
  loginAdminWithFirebase,
} from '../firebase';
import { CenterLogoMark } from './ActivityVisuals';

interface AdminLoginPageProps {
  campusName?: string;
  onLoginSuccess: (info: { uid: string; email: string; role: string }) => void;
  onBackToHome: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  campusName = 'Sa Thầy',
  onLoginSuccess,
  onBackToHome,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const resolvedEmail = formatAdminUsernameToEmail(username);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedUser = username.trim();
    if (!trimmedUser || !password) {
      setErrorMessage('Vui lòng nhập đầy đủ Username và Password.');
      return;
    }

    setIsLoading(true);
    const result = await loginAdminWithFirebase(trimmedUser, password);
    setIsLoading(false);

    if (result.success && result.role === 'admin') {
      setSuccessMessage('Đăng nhập thành công');
      // Update URL to admin.html and transition to Admin Dashboard after brief confirmation
      try {
        window.history.pushState({}, '', '/admin.html#admin');
      } catch {
        window.location.hash = '#admin';
      }
      setTimeout(() => {
        onLoginSuccess({
          uid: result.uid || '',
          email: result.email || resolvedEmail,
          role: 'admin',
        });
      }, 650);
    } else {
      setErrorMessage(
        result.error ||
          'Đăng nhập thất bại: Sai tài khoản/mật khẩu hoặc tài khoản không có quyền Admin.'
      );
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 flex flex-col justify-center items-center px-4 py-8 relative">
      {/* Subtle top-left button to return to public homepage */}
      <div className="w-full max-w-md mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={onBackToHome}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại Trang chủ</span>
        </button>

        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#064E29] bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-full">
          <ShieldCheck className="w-3.5 h-3.5 text-[#0D9456]" />
          <span>Cổng Quản Trị Viên</span>
        </span>
      </div>

      {/* Minimalist, Modern Centered Login Card */}
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-8 space-y-6">
        {/* Card Header */}
        <div className="flex flex-col items-center text-center space-y-2.5">
          <CenterLogoMark size="md" />
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Đăng Nhập Quản Trị Admin
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Trung tâm Học Giỏi — Cơ sở {campusName}
            </p>
          </div>
        </div>

        {/* Login Form: 2 Inputs (Username & Password) + 1 Button ("Đăng nhập") */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Input 1: Username */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="admin-username"
                className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider"
              >
                Username
              </label>
              {username.trim() && !username.includes('@') && (
                <span className="text-[11px] font-mono-tabular text-slate-400">
                  → {resolvedEmail}
                </span>
              )}
            </div>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="admin-username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Nhập username (ví dụ: admin)"
                disabled={isLoading || Boolean(successMessage)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50/60 focus:bg-white pl-10 pr-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0066B3] focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Input 2: Password */}
          <div className="space-y-1.5">
            <label
              htmlFor="admin-password"
              className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="admin-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Nhập mật khẩu"
                disabled={isLoading || Boolean(successMessage)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50/60 focus:bg-white pl-10 pr-10 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0066B3] focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                tabIndex={-1}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Submit Button: "Đăng nhập" */}
          <div className="pt-1">
            <button
              type="submit"
              disabled={isLoading || Boolean(successMessage)}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#0066B3] hover:bg-[#005291] disabled:opacity-65 px-5 py-3.5 text-sm font-extrabold text-white shadow-sm transition-all active:scale-[0.99] cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang xác thực quyền Admin...</span>
                </>
              ) : (
                <span>Đăng nhập</span>
              )}
            </button>
          </div>

          {/* Success Message below the form */}
          {successMessage && (
            <div
              role="status"
              className="rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-3 text-xs sm:text-sm font-bold text-emerald-700 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {successMessage}! Đang chuyển hướng sang trang quản trị (admin.html)...
              </span>
            </div>
          )}

          {/* Red Error Text below the form (no window.alert) */}
          {errorMessage && (
            <div
              role="alert"
              className="rounded-xl bg-red-50 border border-red-200 px-3.5 py-3 text-xs sm:text-sm font-semibold text-red-600 flex items-start gap-2 leading-relaxed"
            >
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
