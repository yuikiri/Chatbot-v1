import React, { useState } from "react";
import { 
  loginWithGoogle, 
  loginWithEmail, 
  registerWithEmail, 
  isFirebaseReady,
  mapFirebaseAuthError 
} from "../services/firebase";
import { X, LogIn, Mail, Lock, AlertCircle, Info } from "lucide-react";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-100 p-6 relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-5">
          <div className="w-12 h-12 bg-teal-100 text-teal-700 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <LogIn className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">
            {isRegister ? "Tạo tài khoản mới" : "Đăng nhập LactaMed"}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Đăng nhập để đồng bộ và lưu trữ lịch sử tư vấn y tế trên mọi thiết bị.
          </p>
        </div>

        {is127 && (
          <div className="mb-4 p-3 bg-blue-50 text-blue-800 text-xs rounded-xl border border-blue-200 flex items-start gap-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
            <span>
              <strong>Mẹo:</strong> Bạn đang truy cập bằng <code>127.0.0.1</code>. Để đăng nhập Google không bị chặn, hãy mở bằng <a href="http://localhost:10000" className="underline font-bold text-blue-700">http://localhost:10000</a>.
            </span>
          </div>
        )}

        {!firebaseReady && (
          <div className="mb-4 p-3 bg-amber-50 text-amber-800 text-xs rounded-xl border border-amber-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <span>
              <strong>Lưu ý:</strong> Chưa cấu hình Firebase API key trong <code>.env</code>. Bạn vẫn có thể trò chuyện ở chế độ khách vãng lai!
            </span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 leading-relaxed font-medium">
            {error}
          </div>
        )}

        {/* Nút Google 1-click */}
        <button
          onClick={handleGoogle}
          disabled={loading || !firebaseReady}
          className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white border border-gray-300 hover:bg-gray-50 rounded-xl text-sm font-semibold text-gray-700 shadow-xs transition disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          Đăng nhập với Google
        </button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-xs text-gray-400">
            <span className="bg-white px-2">Hoặc bằng email</span>
          </div>
        </div>

        {/* Form Email */}
        <form onSubmit={handleEmailAuth} className="space-y-3">
          <div className="relative">
            <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="email"
              placeholder="Email của bạn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="password"
              placeholder="Mật khẩu (ít nhất 6 ký tự)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !firebaseReady}
            className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 shadow-xs"
          >
            {loading ? "Đang xử lý..." : isRegister ? "Tạo tài khoản mới" : "Đăng nhập"}
          </button>
        </form>

        <div className="text-center mt-4 text-xs text-gray-500">
          {isRegister ? "Đã có tài khoản?" : "Chưa có tài khoản?"}{" "}
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="text-teal-600 font-semibold hover:underline"
          >
            {isRegister ? "Đăng nhập ngay" : "Tạo tài khoản mới"}
          </button>
        </div>
      </div>
    </div>
  );
};
