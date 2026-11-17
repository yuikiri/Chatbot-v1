import React, { useState, useRef, useEffect } from "react";
import type { ChatMessage, CitationItem, RagMode } from "../services/api";
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
}

export const ChatArea: React.FC<Props> = ({
  messages,
  onSendMessage,
  isStreaming,
  onOpenCitation,
  onToggleMobileMenu,
  currentMode,
  onModeChange
}) => {
  const [input, setInput] = useState("");
  const [showColdStartHint, setShowColdStartHint] = useState(false);
  const [showModeMenu, setShowModeMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const modeMenuRef = useRef<HTMLDivElement>(null);

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
    "Tôi đang sốt và cho con bú, uống Hapacol được không?",
    "Kháng sinh Amoxicillin có an toàn khi cho con bú không?",
    "Thuốc nhỏ mũi chứa Pseudoephedrine có làm giảm sữa không?",
    "Bị dị ứng nổi mề đay thì uống Loratadine được không?"
  ];

  const modeDescriptions: Record<RagMode, { label: string; desc: string; icon: any; color: string; bgColor: string }> = {
    strict: {
      label: "Nghiêm ngặt",
      desc: "100% tài liệu nội bộ, không có thì từ chối",
      icon: ShieldCheck,
      color: "text-teal-700",
      bgColor: "bg-teal-50 border-teal-300 text-teal-800"
    },
    balanced: {
      label: "Cân bằng",
      desc: "Tài liệu nội bộ làm gốc + Bổ trợ y văn kiểm chứng",
      icon: Scale,
      color: "text-blue-700",
      bgColor: "bg-blue-50 border-blue-300 text-blue-800"
    },
    flexible: {
      label: "Mở rộng",
      desc: "Tự do nghiên cứu y văn quốc tế chính thống (LactMed/WHO)",
      icon: Sparkles,
      color: "text-indigo-700",
      bgColor: "bg-indigo-50 border-indigo-300 text-indigo-800"
    }
  };

  const currentModeInfo = modeDescriptions[currentMode];
  const CurrentIcon = currentModeInfo.icon;

  return (
    <main className="flex-1 flex flex-col h-full bg-slate-50 relative overflow-hidden">
      {/* Top Header */}
      <header className="px-6 py-3.5 bg-white border-b border-gray-200 flex items-center justify-between shadow-2xs z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileMenu}
            className="sm:hidden p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <span>Trợ Lý Y Khoa Cho Con Bú</span>
              <span className="text-[10px] bg-teal-100 text-teal-800 font-semibold px-2 py-0.5 rounded-full">
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
          <span className="text-gray-400">Chế độ hoạt động:</span>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-[11px] border ${currentModeInfo.bgColor}`}>
            <CurrentIcon className="w-3.5 h-3.5" />
            <span>{currentModeInfo.label}</span>
          </span>
        </div>
      </header>

      {/* Tuyên bố miễn trừ trách nhiệm y tế */}
      <div className="bg-amber-50/90 border-b border-amber-200/60 px-6 py-2 text-xs text-amber-900 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
        <span>
          <strong>Cảnh báo y khoa:</strong> Thông tin tra cứu chỉ mang tính tham khảo y văn, không thay thế cho chỉ định khám chữa bệnh trực tiếp của bác sĩ hoặc dược sĩ chuyên khoa.
        </span>
      </div>

      {/* Khu vực hiển thị tin nhắn */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-4">
        {messages.length === 0 ? (
          <div className="max-w-2xl mx-auto py-12 text-center">
            <div className="w-14 h-14 bg-teal-100 text-teal-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Bạn cần kiểm tra loại thuốc nào hôm nay?
            </h3>
            <p className="text-xs text-gray-500 mb-8 max-w-md mx-auto leading-relaxed">
              Nhập tên hoạt chất, biệt dược hoặc triệu chứng. Bot sẽ đối chiếu mức độ an toàn cho bé dựa theo chế độ bạn đã chọn.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left max-w-lg mx-auto">
              {quickPrompts.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(q)}
                  className="p-3 text-xs bg-white hover:bg-teal-50/50 hover:border-teal-300 border border-gray-200 rounded-xl text-gray-700 transition shadow-2xs text-left"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => (
            <MessageItem key={m.id} message={m} onOpenCitation={onOpenCitation} />
          ))
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
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="max-w-3xl mx-auto space-y-2">
          {/* Gợi ý chế độ hiện tại */}
          <div className="flex items-center justify-between text-[11px] text-gray-500 px-1">
            <div className="flex items-center gap-1.5">
              <Info className="w-3 h-3 text-gray-400" />
              <span>Chế độ: <strong className={currentModeInfo.color}>{currentModeInfo.label}</strong> — {currentModeInfo.desc}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex items-center gap-2 relative">
            <input
              type="text"
              placeholder="Hỏi về hoạt chất, tên biệt dược (ví dụ: Paracetamol, Hapacol, ho, sốt...)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isStreaming}
              className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 focus:bg-white focus:border-teal-500 rounded-xl text-xs sm:text-sm focus:outline-none transition shadow-2xs disabled:opacity-60"
            />

            {/* BỘ CHỌN CHẾ ĐỘ NẰM CẠNH NÚT GỬI */}
            <div className="relative shrink-0" ref={modeMenuRef}>
              <button
                type="button"
                onClick={() => setShowModeMenu(!showModeMenu)}
                className={`flex items-center gap-1.5 px-3 py-3 border rounded-xl text-xs font-bold transition shadow-xs hover:scale-102 ${currentModeInfo.bgColor}`}
                title="Bấm để chuyển đổi giữa 3 chế độ co giãn"
              >
                <CurrentIcon className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">{currentModeInfo.label}</span>
                <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-70" />
              </button>

              {/* Popup Dropdown 3 Chế Độ */}
              {showModeMenu && (
                <div className="absolute right-0 bottom-full mb-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-200 p-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
                  <div className="px-3 py-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 mb-1">
                    Chọn mức độ co giãn
                  </div>

                  {/* Chế độ 1: Nghiêm ngặt */}
                  <button
                    type="button"
                    onClick={() => {
                      onModeChange("strict");
                      setShowModeMenu(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl transition flex items-start gap-2.5 ${
                      currentMode === "strict" ? "bg-teal-50 text-teal-900 border border-teal-200" : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                        <span>Nghiêm ngặt (Strict)</span>
                        <span className="text-[10px] bg-teal-100 text-teal-800 px-1.5 py-0.2 rounded font-semibold">Chuẩn cao</span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                        Chỉ trả lời khi 100% có trong tài liệu nội bộ; thiếu là từ chối ngay, không suy đoán.
                      </p>
                    </div>
                  </button>

                  {/* Chế độ 2: Cân bằng */}
                  <button
                    type="button"
                    onClick={() => {
                      onModeChange("balanced");
                      setShowModeMenu(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl transition flex items-start gap-2.5 mt-1 ${
                      currentMode === "balanced" ? "bg-blue-50 text-blue-900 border border-blue-200" : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <Scale className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                        <span>Cân bằng (Balanced)</span>
                        <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-semibold">Khuyên dùng</span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                        Lấy tài liệu nội bộ làm gốc; tự động bổ sung y văn quốc tế chính thống nếu còn thiếu.
                      </p>
                    </div>
                  </button>

                  {/* Chế độ 3: Mở rộng */}
                  <button
                    type="button"
                    onClick={() => {
                      onModeChange("flexible");
                      setShowModeMenu(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl transition flex items-start gap-2.5 mt-1 ${
                      currentMode === "flexible" ? "bg-indigo-50 text-indigo-900 border border-indigo-200" : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                        <span>Mở rộng (Flexible)</span>
                        <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded font-semibold">Tự do</span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                        Không phụ thuộc tài liệu nội bộ; tự do tra cứu y văn quốc tế chính thống (LactMed, WHO...).
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
              className="p-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white rounded-xl transition shadow-sm flex items-center justify-center shrink-0 hover:scale-102"
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
