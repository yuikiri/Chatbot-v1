import React, { useState } from "react";
import { 
  loginWithGoogle, 
  loginWithEmail, 
  registerWithEmail, 
  isFirebaseReady,
  mapFirebaseAuthError 
} from "../services/firebase";
import { X, Mail, Lock, AlertCircle, Info, ShieldCheck, Loader2 } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const is127 = typeof window !== "undefined" && window.location.hostname === "127.0.0.1";

  const handleGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
      onClose();
    } catch (err: any) {
      setError(mapFirebaseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Vui lòng điền đầy đủ email và mật khẩu.");
      return;
    }

    if (password.trim().length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự theo quy định bảo mật của Firebase.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isRegister) {
        await registerWithEmail(email.trim(), password.trim());
      } else {
        await loginWithEmail(email.trim(), password.trim());
      }
      onClose();
    } catch (err: any) {
      setError(mapFirebaseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const firebaseReady = isFirebaseReady();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-notion-float w-full max-w-sm overflow-hidden border border-black/10 p-6 relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-black/40 hover:text-black hover:bg-black/5 p-1.5 rounded-md transition cursor-pointer"
          title="Đóng"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-5">
          <div className="w-11 h-11 bg-[#F6F5F4] text-[#0075DE] border border-black/8 rounded-xl flex items-center justify-center mx-auto mb-2.5 shadow-2xs">
            <ShieldCheck className="w-5 h-5 text-[#0075DE]" />
          </div>
          <h3 className="text-base font-semibold text-black tracking-[-0.025em]">
            {isRegister ? "Tạo tài khoản LactaMed" : "Đăng nhập LactaMed AI"}
          </h3>
          <p className="text-xs text-black/55 mt-1 leading-relaxed">
            Đồng bộ và tự động lưu trữ lịch sử tư vấn y khoa trên mọi thiết bị của bạn.
          </p>
        </div>

        {/* Tab switch pills */}
        <div className="flex p-1 bg-[#F6F5F4] rounded-lg mb-4 border border-black/8">
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setError(null);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
              !isRegister ? "bg-white text-black shadow-2xs" : "text-black/50 hover:text-black font-medium"
            }`}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              setError(null);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
              isRegister ? "bg-white text-black shadow-2xs" : "text-black/50 hover:text-black font-medium"
            }`}
          >
            Đăng ký mới
          </button>
        </div>

        {is127 && (
          <div className="mb-4 p-2.5 bg-[#E6F3FE] text-[#097FE8] text-xs rounded-lg border border-[#0075DE]/20 flex items-start gap-2 shadow-2xs">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#0075DE]" />
            <span>
              <strong>Mẹo:</strong> Bạn đang truy cập bằng <code>127.0.0.1</code>. Để đăng nhập Google không bị chặn, hãy mở bằng <a href="http://localhost:10000" className="underline font-semibold text-[#0075DE]">http://localhost:10000</a>.
            </span>
          </div>
        )}

        {!firebaseReady && (
          <div className="mb-4 p-2.5 bg-[#FFFDF5] text-[#78350F] text-xs rounded-lg border border-[#FFB110]/25 flex items-start gap-2 shadow-2xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#D97706]" />
            <span>
              <strong>Lưu ý:</strong> Chưa cấu hình Firebase API key trong <code>.env</code>. Bạn vẫn có thể trò chuyện ở chế độ khách vãng lai!
            </span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-2.5 bg-[#F64932]/10 text-[#F64932] text-xs rounded-lg border border-[#F64932]/25 leading-relaxed font-medium">
            {error}
          </div>
        )}

        {/* Nút Google 1-click */}
        <button
          onClick={handleGoogle}
          disabled={loading || !firebaseReady}
          className="w-full flex items-center justify-center gap-2.5 py-2 px-4 bg-white border border-black/14 hover:bg-[#F6F5F4] rounded-lg text-xs font-semibold text-black shadow-2xs transition disabled:opacity-50 cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>Tiếp tục với Google</span>
        </button>

        <div className="relative my-3.5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-black/10"></div>
          </div>
          <div className="relative flex justify-center text-[11px] text-black/40">
            <span className="bg-white px-2">Hoặc tài khoản email</span>
          </div>
        </div>

        {/* Form Email */}
        <form onSubmit={handleEmailAuth} className="space-y-3">
          <div className="relative">
            <Mail className="w-4 h-4 text-black/35 absolute left-3 top-2.5" />
            <input
              type="email"
              placeholder="Email của bạn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-black/14 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0075DE]/20 focus:border-[#0075DE] text-black placeholder-black/35"
              required
            />
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-black/35 absolute left-3 top-2.5" />
            <input
              type="password"
              placeholder="Mật khẩu (tối thiểu 6 ký tự)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-black/14 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0075DE]/20 focus:border-[#0075DE] text-black placeholder-black/35"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !firebaseReady}
            className="w-full py-2 bg-[#0075DE] hover:bg-[#0062BD] active:bg-[#005BAB] text-white rounded-lg text-xs font-semibold transition disabled:opacity-50 shadow-2xs cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <span>{isRegister ? "Đăng ký tài khoản" : "Đăng nhập"}</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
