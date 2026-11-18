import React, { useState, useRef, useEffect } from "react";
import type { ChatMessage, CitationItem, RagMode } from "../services/api";
import { useSecretAdmin } from "../hooks/useSecretAdmin";
import { MessageItem } from "./MessageItem";
import { 
  Send, 
  Menu, 
  Loader2, 
  Sparkles, 
  AlertTriangle, 
  ShieldCheck, 
  Scale, 
  ChevronDown,
  Info
} from "lucide-react";

interface Props {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isStreaming: boolean;
  onOpenCitation: (citation: CitationItem) => void;
  onToggleMobileMenu: () => void;
  currentMode: RagMode;
  onModeChange: (mode: RagMode) => void;
  currentUser?: any;
  conversationId?: string;
  onOpenAdmin?: () => void;
}

export const ChatArea: React.FC<Props> = ({
  messages,
  onSendMessage,
  isStreaming,
  onOpenCitation,
  onToggleMobileMenu,
  currentMode,
  onModeChange,
  currentUser,
  conversationId,
  onOpenAdmin
}) => {
  const [input, setInput] = useState("");
  const [showColdStartHint, setShowColdStartHint] = useState(false);
  const [showModeMenu, setShowModeMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const modeMenuRef = useRef<HTMLDivElement>(null);

  // Cơ chế mở Admin ẩn: Chạm 3 lần liên tiếp vào header brand
  const handleHeaderTap = useSecretAdmin(onOpenAdmin, 3, 1500);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  // Hiện thông báo nếu server khởi động chậm (> 4 giây)
  useEffect(() => {
    let timer: any;
    if (isStreaming) {
      timer = setTimeout(() => {
        setShowColdStartHint(true);
      }, 4000);
    } else {
      setShowColdStartHint(false);
    }
    return () => clearTimeout(timer);
  }, [isStreaming]);

  // Đóng menu khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modeMenuRef.current && !modeMenuRef.current.contains(e.target as Node)) {
        setShowModeMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    onSendMessage(input.trim());
    setInput("");
  };

  const quickPrompts = [
    { title: "Sốt & Giảm đau", text: "Tôi đang sốt và cho con bú, uống Hapacol/Paracetamol được không?", icon: "🌡️" },
    { title: "Kháng sinh", text: "Kháng sinh Amoxicillin có an toàn khi cho con bú không?", icon: "💊" },
    { title: "Cảm cúm & Nghẹt mũi", text: "Thuốc nhỏ mũi chứa Pseudoephedrine có làm giảm tiết sữa không?", icon: "🤧" },
    { title: "Dị ứng & Mề đay", text: "Bị dị ứng nổi mề đay thì uống Loratadine được không?", icon: "🌿" }
  ];

  const modeDescriptions: Record<RagMode, { label: string; desc: string; icon: any; color: string; bgColor: string }> = {
    strict: {
      label: "Tiêu chuẩn Cơ sở",
      desc: "Chỉ tra cứu phác đồ y khoa đã được thẩm định an toàn tại cơ sở",
      icon: ShieldCheck,
      color: "text-teal-700",
      bgColor: "bg-teal-50 border-teal-300 text-teal-800"
    },
    balanced: {
      label: "Tổng hợp Lâm sàng",
      desc: "Kết hợp phác đồ cơ sở và các nghiên cứu y khoa quốc tế uy tín",
      icon: Scale,
      color: "text-blue-700",
      bgColor: "bg-blue-50 border-blue-300 text-blue-800"
    },
    flexible: {
      label: "Tra cứu Quốc tế",
      desc: "Tra cứu trực tiếp từ Thư viện Dược lý Lâm sàng Hoa Kỳ (LactMed® NIH) và APILAM",
      icon: Sparkles,
      color: "text-indigo-700",
      bgColor: "bg-indigo-50 border-indigo-300 text-indigo-800"
    }
  };

  const currentModeInfo = modeDescriptions[currentMode];
  const CurrentIcon = currentModeInfo.icon;

  return (
    <main className="flex-1 flex flex-col h-full bg-gradient-to-b from-slate-50 via-teal-50/15 to-slate-50 relative overflow-hidden">
      {/* Top Header */}
      <header className="px-4 sm:px-6 py-2.5 sm:py-3.5 bg-white border-b border-gray-200 flex items-center justify-between shadow-2xs z-10">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            onClick={onToggleMobileMenu}
            className="sm:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl touch-target flex items-center justify-center"
            title="Mở danh sách cuộc trò chuyện"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div
            onClick={handleHeaderTap}
            className="cursor-pointer select-none group active:scale-98 transition-transform"
            title="LactaMed AI"
          >
            <h2 className="text-xs sm:text-sm font-bold text-gray-900 flex items-center gap-2">
              <span className="flex items-center gap-1.5">
                <span className="text-base group-hover:scale-110 transition-transform">👶</span>
                <span className="truncate">Trợ Lý Y Khoa Cho Con Bú</span>
              </span>
              <span className="text-[10px] bg-teal-100 text-teal-800 font-semibold px-2 py-0.5 rounded-full border border-teal-200 shrink-0">
                LactMed & Dược Thư
              </span>
            </h2>
            <p className="text-[11px] text-gray-500 hidden sm:block">
              Tra cứu tính an toàn thuốc, nồng độ bài tiết qua sữa và theo dõi trẻ sơ sinh
            </p>
          </div>
        </div>

        {/* Badge chế độ hiện tại trên Header */}
        <div className="hidden md:flex items-center gap-2 text-xs">
          <span className="text-gray-400">Phạm vi tra cứu:</span>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-[11px] border ${currentModeInfo.bgColor}`}>
            <CurrentIcon className="w-3.5 h-3.5" />
            <span>{currentModeInfo.label}</span>
          </span>
        </div>
      </header>

      {/* Tuyên bố miễn trừ trách nhiệm y tế */}
      <div className="bg-amber-50/80 border-b border-amber-200/50 px-4 sm:px-6 py-1.5 text-[11px] sm:text-xs text-amber-900 flex items-center gap-2">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        <span className="line-clamp-1 sm:line-clamp-none">
          <strong>Cảnh báo y khoa:</strong> Thông tin tra cứu mang tính chất tham khảo y văn, không thay thế cho chỉ định khám chữa bệnh trực tiếp của bác sĩ hoặc dược sĩ chuyên khoa.
        </span>
      </div>

      {/* Khu vực hiển thị tin nhắn */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-8 py-4 sm:py-6 space-y-4">
        {messages.length === 0 ? (
          <div className="max-w-2xl mx-auto py-8 sm:py-12 text-center">
            <div className="w-12 sm:w-14 h-12 sm:h-14 bg-teal-100 text-teal-700 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-sm">
              <Sparkles className="w-6 sm:w-7 h-6 sm:h-7" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1.5 sm:mb-2">
              Bạn cần kiểm tra loại thuốc nào hôm nay?
            </h3>
            <p className="text-xs text-gray-500 mb-6 sm:mb-8 max-w-md mx-auto leading-relaxed px-2">
              Nhập tên hoạt chất hoặc biệt dược. Trợ lý sẽ đối chiếu mức độ an toàn cho bé dựa theo phác đồ và cơ sở dữ liệu y văn chuẩn mực.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left max-w-lg mx-auto px-2">
              {quickPrompts.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(q.text)}
                  className="p-3 text-xs bg-white hover:bg-teal-50/60 hover:border-teal-300 border border-gray-200 rounded-xl text-gray-700 transition shadow-2xs text-left group cursor-pointer active:scale-98"
                >
                  <div className="flex items-center gap-1.5 text-teal-700 font-bold mb-1">
                    <span>{q.icon}</span>
                    <span>{q.title}</span>
                  </div>
                  <p className="text-gray-600 line-clamp-2">{q.text}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, idx) => {
            let precedingPrompt = "";
            if (m.role === "assistant") {
              for (let i = idx - 1; i >= 0; i--) {
                if (messages[i].role === "user") {
                  precedingPrompt = messages[i].content;
                  break;
                }
              }
            }
            return (
              <MessageItem
                key={m.id}
                message={m}
                onOpenCitation={onOpenCitation}
                currentUser={currentUser}
                conversationId={conversationId}
                userPromptText={precedingPrompt}
              />
            );
          })
        )}

        {/* Thông báo khởi động chậm */}
        {showColdStartHint && (
          <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 text-xs rounded-xl flex items-center gap-2 max-w-md animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
            <span>Máy chủ đang khởi động lại từ trạng thái nghỉ, vui lòng đợi trong giây lát...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Khung nhập câu hỏi + Bộ chọn chế độ cạnh nút Chat */}
      <div className="p-3 sm:p-5 bg-gradient-to-t from-white via-white/95 to-transparent pb-safe">
        <div className="max-w-3xl mx-auto space-y-2">
          {/* Gợi ý chế độ hiện tại */}
          <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-500 px-2">
            <div className="flex items-center gap-1.5 truncate">
              <Info className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span className="truncate">Phạm vi: <strong className={currentModeInfo.color}>{currentModeInfo.label}</strong> — {currentModeInfo.desc}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex items-center gap-2 p-1.5 bg-white border border-slate-200/90 rounded-2xl shadow-lg shadow-teal-950/5 relative focus-within:border-teal-500/80 focus-within:ring-2 focus-within:ring-teal-500/20 transition-all">
            <input
              type="text"
              placeholder="Nhập tên thuốc, hoạt chất cần tra cứu an toàn cho mẹ và bé..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isStreaming}
              className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-transparent text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none disabled:opacity-60"
            />

            {/* BỘ CHỌN CHẾ ĐỘ NẰM CẠNH NÚT GỬI */}
            <div className="relative shrink-0" ref={modeMenuRef}>
              <button
                type="button"
                onClick={() => setShowModeMenu(!showModeMenu)}
                className={`flex items-center gap-1.5 px-3 py-2 sm:py-2.5 border rounded-xl text-xs font-bold transition shadow-xs hover:scale-102 cursor-pointer ${currentModeInfo.bgColor}`}
                title="Bấm để chọn phạm vi tra cứu y khoa"
              >
                <CurrentIcon className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">{currentModeInfo.label}</span>
                <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-70" />
              </button>

              {/* Popup Dropdown 3 Chế Độ */}
              {showModeMenu && (
                <div className="absolute right-0 bottom-full mb-3 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 p-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
                  <div className="px-3 py-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 mb-1">
                    Phạm Vi Tra Cứu & Nguồn Y Văn
                  </div>

                  {/* Chế độ 1: Tiêu chuẩn Cơ sở */}
                  <button
                    type="button"
                    onClick={() => {
                      onModeChange("strict");
                      setShowModeMenu(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl transition flex items-start gap-2.5 cursor-pointer ${
                      currentMode === "strict" ? "bg-teal-50 text-teal-900 border border-teal-200" : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                        <span>Tiêu chuẩn Cơ sở</span>
                        <span className="text-[10px] bg-teal-100 text-teal-800 px-1.5 py-0.2 rounded font-semibold">Chuẩn cao</span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                        Chỉ tra cứu danh mục thuốc đã được thẩm định an toàn tại cơ sở y tế; không phán đoán ngoài danh mục.
                      </p>
                    </div>
                  </button>

                  {/* Chế độ 2: Tổng hợp Lâm sàng */}
                  <button
                    type="button"
                    onClick={() => {
                      onModeChange("balanced");
                      setShowModeMenu(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl transition flex items-start gap-2.5 mt-1 cursor-pointer ${
                      currentMode === "balanced" ? "bg-blue-50 text-blue-900 border border-blue-200" : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <Scale className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                        <span>Tổng hợp Lâm sàng</span>
                        <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-semibold">Khuyên dùng</span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                        Lấy danh mục thẩm định cơ sở làm gốc; tự động bổ sung dữ liệu y văn quốc tế uy tín nếu còn thiếu.
                      </p>
                    </div>
                  </button>

                  {/* Chế độ 3: Tra cứu Quốc tế */}
                  <button
                    type="button"
                    onClick={() => {
                      onModeChange("flexible");
                      setShowModeMenu(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl transition flex items-start gap-2.5 mt-1 cursor-pointer ${
                      currentMode === "flexible" ? "bg-indigo-50 text-indigo-900 border border-indigo-200" : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                        <span>Tra cứu Quốc tế</span>
                        <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded font-semibold">Toàn diện</span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                        Tra cứu toàn diện từ Thư viện Dược lý Lâm sàng Hoa Kỳ (LactMed® NIH) và Hiệp hội APILAM.
                      </p>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Nút gửi tin nhắn */}
            <button
              type="submit"
              disabled={!input.trim() || isStreaming}
              className="p-2.5 sm:p-3 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 disabled:opacity-40 text-white rounded-xl transition shadow-md shadow-teal-900/10 flex items-center justify-center shrink-0 hover:scale-102 cursor-pointer touch-target"
              title="Gửi câu hỏi"
            >
              {isStreaming ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
};
