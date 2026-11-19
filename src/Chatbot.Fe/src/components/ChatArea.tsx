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
  Info,
  Thermometer,
  Pill,
  Activity,
  Check,
  Stethoscope,
  ChevronRight
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
  const [isDisclaimerExpanded, setIsDisclaimerExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const modeMenuRef = useRef<HTMLDivElement>(null);

  // Cơ chế mở Admin ẩn: Chạm 3 lần liên tiếp vào header brand trong 1.5 giây
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
    { 
      title: "Sốt & Giảm đau", 
      text: "Tôi đang sốt và cho con bú, uống Hapacol/Paracetamol được không?", 
      icon: Thermometer,
      accent: "text-rose-600 bg-rose-50 border-rose-200" 
    },
    { 
      title: "Kháng sinh an toàn", 
      text: "Kháng sinh Amoxicillin có an toàn khi cho con bú không?", 
      icon: Pill,
      accent: "text-blue-600 bg-blue-50 border-blue-200" 
    },
    { 
      title: "Cảm cúm & Nghẹt mũi", 
      text: "Thuốc nhỏ mũi chứa Pseudoephedrine có làm giảm tiết sữa không?", 
      icon: Activity,
      accent: "text-amber-600 bg-amber-50 border-amber-200" 
    },
    { 
      title: "Dị ứng & Mề đay", 
      text: "Bị dị ứng nổi mề đay thì uống Loratadine được không?", 
      icon: Sparkles,
      accent: "text-teal-600 bg-teal-50 border-teal-200" 
    }
  ];

  const modeDescriptions: Record<RagMode, { label: string; desc: string; icon: any; color: string; bgColor: string; tag: string }> = {
    strict: {
      label: "Tiêu chuẩn Cơ sở",
      desc: "Chỉ tra cứu phác đồ y khoa đã được thẩm định an toàn tại cơ sở",
      icon: ShieldCheck,
      color: "text-teal-700",
      bgColor: "bg-teal-50 border-teal-200/90 text-teal-800",
      tag: "Chuẩn cao"
    },
    balanced: {
      label: "Tổng hợp Lâm sàng",
      desc: "Lấy danh mục thẩm định cơ sở làm gốc; tự động bổ sung dữ liệu y văn quốc tế uy tín nếu còn thiếu",
      icon: Scale,
      color: "text-blue-700",
      bgColor: "bg-blue-50 border-blue-200/90 text-blue-800",
      tag: "Khuyên dùng"
    },
    flexible: {
      label: "Tra cứu Quốc tế",
      desc: "Tra cứu toàn diện từ Thư viện Dược lý Lâm sàng Hoa Kỳ (LactMed® NIH) và Hiệp hội APILAM",
      icon: Sparkles,
      color: "text-indigo-700",
      bgColor: "bg-indigo-50 border-indigo-200/90 text-indigo-800",
      tag: "Toàn diện"
    }
  };

  const currentModeInfo = modeDescriptions[currentMode];
  const CurrentIcon = currentModeInfo.icon;

  return (
    <main className="flex-1 flex flex-col h-full bg-slate-50/60 relative overflow-hidden">
      {/* Top Header Glassmorphic */}
      <header className="px-4 sm:px-6 py-2.5 sm:py-3 bg-white/90 backdrop-blur-md border-b border-slate-200/70 flex items-center justify-between shadow-subtle z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileMenu}
            className="sm:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl touch-target flex items-center justify-center transition"
            title="Mở danh sách cuộc trò chuyện"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div
            onClick={handleHeaderTap}
            className="cursor-pointer select-none group active:scale-[0.99] transition-transform flex items-center gap-2.5"
            title="LactaMed AI - Trợ Lý Dược Học Lâm Sàng"
          >
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 border border-teal-200/60 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
              <Stethoscope className="w-4 h-4 text-teal-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
                  LactaMed AI
                </h2>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-teal-700 bg-teal-50 border border-teal-200/70 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
                  LactMed® NIH & Dược Thư
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block tracking-tight">
                Tra cứu tính an toàn thuốc, nồng độ bài tiết qua sữa và theo dõi trẻ bú mẹ
              </p>
            </div>
          </div>
        </div>

        {/* Badge chế độ hiện tại trên Header */}
        <div className="hidden md:flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium">Chế độ:</span>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold text-xs border shadow-2xs ${currentModeInfo.bgColor}`}>
            <CurrentIcon className="w-3.5 h-3.5" />
            <span>{currentModeInfo.label}</span>
          </span>
        </div>
      </header>

      {/* Tuyên bố miễn trừ trách nhiệm y tế (Tinh tế, có thể xem chi tiết) */}
      <div className="bg-amber-50/70 border-b border-amber-200/60 px-4 sm:px-6 py-1.5 text-[11px] text-amber-950 flex items-center justify-between gap-2 shadow-2xs z-10">
        <div className="flex items-center gap-2 truncate">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span className="truncate font-medium">
            <strong>Cảnh báo y khoa:</strong> Thông tin mang tính chất tham khảo y văn, không thay thế cho chỉ định điều trị của bác sĩ chuyên khoa.
          </span>
        </div>
        <button
          onClick={() => setIsDisclaimerExpanded(!isDisclaimerExpanded)}
          className="text-[10px] font-semibold text-amber-800 hover:text-amber-950 underline shrink-0 cursor-pointer"
        >
          {isDisclaimerExpanded ? "Thu gọn" : "Chi tiết"}
        </button>
      </div>

      {isDisclaimerExpanded && (
        <div className="bg-amber-50/95 border-b border-amber-200 px-4 sm:px-6 py-2.5 text-xs text-amber-900 leading-relaxed shadow-sm animate-in fade-in duration-150 z-10">
          <p>
            Mọi khuyến cáo trên hệ thống được tổng hợp tự động từ cơ sở dữ liệu Dược thư Quốc gia Việt Nam, Thư viện Y khoa Hoa Kỳ (LactMed® NIH) và Hiệp hội APILAM. Không tự ý ngưng thuốc kê đơn hoặc thay đổi liều lượng khi chưa tham vấn ý kiến trực tiếp từ bác sĩ hoặc dược sĩ chuyên khoa.
          </p>
        </div>
      )}

      {/* Khu vực hiển thị tin nhắn */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-8 py-4 sm:py-6 space-y-4">
        {messages.length === 0 ? (
          <div className="max-w-2xl mx-auto py-6 sm:py-10 text-center animate-in fade-in duration-300">
            {/* Ambient medical glow circle */}
            <div className="relative mb-5 flex items-center justify-center">
              <div className="absolute w-28 h-28 bg-teal-400/10 rounded-full blur-2xl pointer-events-none"></div>
              <div className="w-14 h-14 bg-white border border-teal-100 rounded-2xl flex items-center justify-center shadow-clinical text-teal-600 relative">
                <ShieldCheck className="w-7 h-7 text-teal-600" />
              </div>
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight mb-2">
              Bạn cần tra cứu độ an toàn loại thuốc nào?
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mb-6 sm:mb-8 max-w-lg mx-auto leading-relaxed px-2 font-normal">
              Nhập tên hoạt chất hoặc biệt dược. Trợ lý sẽ tự động đối chiếu nồng độ bài tiết qua sữa mẹ và phác đồ an toàn dựa trên chuẩn y văn lâm sàng.
            </p>

            {/* Thẻ câu hỏi gợi ý nhanh chuẩn y khoa */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left max-w-xl mx-auto px-2">
              {quickPrompts.map((q, idx) => {
                const IconComponent = q.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => onSendMessage(q.text)}
                    className="p-3.5 bg-white hover:bg-slate-50/80 hover:border-teal-300/80 border border-slate-200/80 rounded-2xl text-slate-700 transition-all duration-200 shadow-subtle text-left group cursor-pointer active:scale-[0.98] flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`p-1.5 rounded-lg border text-xs ${q.accent}`}>
                            <IconComponent className="w-3.5 h-3.5" />
                          </span>
                          <span className="text-xs font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                            {q.title}
                          </span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all" />
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                        {q.text}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Capability Trust Badges */}
            <div className="mt-8 pt-6 border-t border-slate-200/60 max-w-lg mx-auto flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-[11px] text-slate-400 font-medium">
              <span className="inline-flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-teal-600" />
                NIH LactMed® chuẩn Mỹ
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-teal-600" />
                Dược thư Quốc gia Việt Nam
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-teal-600" />
                Phát hiện Chống chỉ định
              </span>
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
          <div className="p-3 bg-blue-50/90 border border-blue-200 text-blue-900 text-xs rounded-xl flex items-center gap-2 max-w-md animate-pulse shadow-subtle">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
            <span className="font-medium">Máy chủ đang khởi động lại từ trạng thái nghỉ, vui lòng đợi trong giây lát...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Elevated Input Dock */}
      <div className="p-3 sm:p-5 bg-gradient-to-t from-slate-50 via-slate-50/95 to-transparent pb-safe">
        <div className="max-w-3xl mx-auto space-y-2">
          {/* Gợi ý chế độ hiện tại */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 px-2 font-medium">
            <div className="flex items-center gap-1.5 truncate">
              <Info className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span className="truncate">
                Phạm vi: <strong className={currentModeInfo.color}>{currentModeInfo.label}</strong> — {currentModeInfo.desc}
              </span>
            </div>
          </div>

          <form 
            onSubmit={handleSubmit} 
            className="flex items-center gap-2 p-1.5 sm:p-2 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-clinical relative focus-within:border-teal-500/80 focus-within:ring-2 focus-within:ring-teal-500/20 transition-all"
          >
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
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 sm:py-2.5 border rounded-xl text-xs font-bold transition-all shadow-2xs hover:scale-[1.02] cursor-pointer ${currentModeInfo.bgColor}`}
                title="Bấm để chọn phạm vi tra cứu y khoa"
              >
                <CurrentIcon className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">{currentModeInfo.label}</span>
                <ChevronDown className="w-3 h-3 shrink-0 opacity-70" />
              </button>

              {/* Popup Dropdown 3 Chế Độ */}
              {showModeMenu && (
                <div className="absolute right-0 bottom-full mb-3 w-84 max-w-[calc(100vw-2rem)] bg-white/98 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/90 p-2 z-50 animate-in fade-in duration-150">
                  <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1 flex items-center justify-between">
                    <span>Phạm vi tra cứu & y văn</span>
                    <span className="text-[10px] text-teal-600 font-semibold font-mono">3 Chế độ RAG</span>
                  </div>

                  {/* Chế độ 1: Tiêu chuẩn Cơ sở */}
                  <button
                    type="button"
                    onClick={() => {
                      onModeChange("strict");
                      setShowModeMenu(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl transition flex items-start gap-2.5 cursor-pointer ${
                      currentMode === "strict" 
                        ? "bg-teal-50 text-teal-900 border border-teal-200/80 shadow-2xs" 
                        : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          Tiêu chuẩn Cơ sở
                          <span className="text-[10px] bg-teal-100 text-teal-800 px-1.5 py-0.2 rounded font-semibold">Chuẩn cao</span>
                        </span>
                        {currentMode === "strict" && <Check className="w-3.5 h-3.5 text-teal-600" />}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
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
                      currentMode === "balanced" 
                        ? "bg-blue-50 text-blue-900 border border-blue-200/80 shadow-2xs" 
                        : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <Scale className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          Tổng hợp Lâm sàng
                          <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-semibold">Khuyên dùng</span>
                        </span>
                        {currentMode === "balanced" && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
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
                      currentMode === "flexible" 
                        ? "bg-indigo-50 text-indigo-900 border border-indigo-200/80 shadow-2xs" 
                        : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          Tra cứu Quốc tế
                          <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded font-semibold">Toàn diện</span>
                        </span>
                        {currentMode === "flexible" && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
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
              className="p-2.5 sm:p-3 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 disabled:opacity-40 text-white rounded-xl transition shadow-sm shadow-teal-900/10 flex items-center justify-center shrink-0 hover:scale-105 active:scale-95 cursor-pointer touch-target"
              title="Gửi câu hỏi"
            >
              {isStreaming ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <Send className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
};
