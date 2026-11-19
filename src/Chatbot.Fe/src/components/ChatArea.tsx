import React, { useState, useRef, useEffect } from "react";
import type { ChatMessage, CitationItem, RagMode } from "../services/api";
import { useSecretAdmin } from "../hooks/useSecretAdmin";
import { MessageItem } from "./MessageItem";
import { ScenarioModal } from "./ScenarioModal";
import homeIcon from "../common/favicon/2.jpg";
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
  ChevronRight,
  BookOpen
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
  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState(false);
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
      icon: Thermometer
    },
    { 
      title: "Kháng sinh an toàn", 
      text: "Kháng sinh Amoxicillin có an toàn khi cho con bú không?", 
      icon: Pill
    },
    { 
      title: "Cảm cúm & Nghẹt mũi", 
      text: "Thuốc nhỏ mũi chứa Pseudoephedrine có làm giảm tiết sữa không?", 
      icon: Activity
    },
    { 
      title: "Dị ứng & Mề đay", 
      text: "Bị dị ứng nổi mề đay thì uống Loratadine được không?", 
      icon: Sparkles
    }
  ];

  const modeDescriptions: Record<RagMode, { label: string; desc: string; icon: any; tag: string }> = {
    strict: {
      label: "Tiêu chuẩn Cơ sở",
      desc: "Chỉ tra cứu phác đồ y khoa đã được thẩm định an toàn tại cơ sở",
      icon: ShieldCheck,
      tag: "Chuẩn cao"
    },
    balanced: {
      label: "Tổng hợp Lâm sàng",
      desc: "Lấy danh mục thẩm định cơ sở làm gốc; tự động bổ sung dữ liệu y văn quốc tế uy tín nếu còn thiếu",
      icon: Scale,
      tag: "Khuyên dùng"
    },
    flexible: {
      label: "Tra cứu Quốc tế",
      desc: "Tra cứu toàn diện từ Thư viện Dược lý Lâm sàng Hoa Kỳ (LactMed® NIH) và Hiệp hội APILAM",
      icon: Sparkles,
      tag: "Toàn diện"
    }
  };

  const currentModeInfo = modeDescriptions[currentMode];
  const CurrentIcon = currentModeInfo.icon;

  return (
    <main className="flex-1 flex flex-col h-full bg-white relative overflow-hidden">
      {/* Top Header Notion 64px */}
      <header className="h-16 px-4 sm:px-6 bg-white flex items-center justify-between shadow-notion-under-rule z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileMenu}
            className="sm:hidden p-2 text-black/60 hover:text-black hover:bg-black/5 rounded-lg touch-target flex items-center justify-center transition cursor-pointer"
            title="Mở danh sách cuộc trò chuyện"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div
            onClick={handleHeaderTap}
            className="cursor-pointer select-none group active:scale-[0.99] transition-transform flex items-center gap-2.5"
            title="Health Care - Trợ Lý Dược Học Lâm Sàng (Chạm 3 lần để mở Cổng Quản Trị)"
          >
            <div className="w-8 h-8 rounded-lg bg-[#F6F5F4] text-[#0075DE] border border-black/10 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
              <Stethoscope className="w-4 h-4 text-[#0075DE]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs sm:text-sm font-bold text-black tracking-tight">
                  Health Care
                </h2>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#0075DE] bg-[#E6F3FE] border border-[#0075DE]/20 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0075DE] animate-pulse"></span>
                  LactMed® NIH & Dược Thư
                </span>
              </div>
              <p className="text-[11px] text-black/50 hidden sm:block tracking-tight">
                Tra cứu tính an toàn thuốc, nồng độ bài tiết qua sữa và theo dõi trẻ bú mẹ
              </p>
            </div>
          </div>
        </div>

        {/* Badge chế độ hiện tại trên Header */}
        <div className="hidden md:flex items-center gap-2 text-xs">
          <span className="text-black/45 font-medium">Chế độ:</span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold text-xs border border-black/10 bg-[#F6F5F4] text-black/80 shadow-2xs">
            <CurrentIcon className="w-3.5 h-3.5 text-[#0075DE]" />
            <span>{currentModeInfo.label}</span>
          </span>
        </div>
      </header>

      {/* Cảnh báo y khoa disclaimer (Notion Amber Subtle Bar) */}
      <div className="bg-[#FFFDF5] border-b border-[#FFB110]/30 px-4 sm:px-6 py-1.5 text-[11px] text-[#78350F] flex items-center justify-between gap-2 z-10 shrink-0">
        <div className="flex items-center gap-2 truncate">
          <AlertTriangle className="w-3.5 h-3.5 text-[#FFB110] shrink-0" />
          <span className="truncate font-medium">
            <strong>Cảnh báo y khoa:</strong> Thông tin mang tính chất tham khảo y văn lâm sàng, không thay thế chỉ định trực tiếp của bác sĩ chuyên khoa.
          </span>
        </div>
        <button
          onClick={() => setIsDisclaimerExpanded(!isDisclaimerExpanded)}
          className="text-[10px] font-semibold text-[#78350F] hover:underline shrink-0 cursor-pointer"
        >
          {isDisclaimerExpanded ? "Thu gọn" : "Chi tiết"}
        </button>
      </div>

      {isDisclaimerExpanded && (
        <div className="bg-[#FFFDF5] border-b border-[#FFB110]/20 px-4 sm:px-6 py-2.5 text-xs text-[#78350F]/90 leading-relaxed shadow-2xs animate-in fade-in duration-150 z-10 shrink-0">
          <p>
            Mọi khuyến cáo trên hệ thống được đối chiếu tự động từ cơ sở dữ liệu Dược thư Quốc gia Việt Nam, Thư viện Y khoa Quốc gia Hoa Kỳ (LactMed® NIH) và Hiệp hội APILAM. Không tự ý ngưng thuốc kê đơn hoặc thay đổi liều lượng khi chưa tham vấn ý kiến trực tiếp từ bác sĩ hoặc dược sĩ chuyên khoa.
          </p>
        </div>
      )}

      {/* Khu vực hiển thị tin nhắn (Chat Canvas) */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-8 py-4 sm:py-6 space-y-4">
        {messages.length === 0 ? (
          <div className="max-w-2xl mx-auto py-6 sm:py-10 text-center animate-in fade-in duration-300">
            {/* Home Icon */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#F6F5F4] border border-black/10 rounded-2xl p-1 mb-3.5 mx-auto shadow-2xs overflow-hidden flex items-center justify-center">
              <img 
                src={homeIcon} 
                alt="Health Care" 
                className="w-full h-full object-cover rounded-xl select-none"
              />
            </div>

            <h3 className="text-xl sm:text-2xl font-semibold text-black tracking-tight mb-2">
              Bạn cần tra cứu độ an toàn loại thuốc nào?
            </h3>
            <p className="text-xs sm:text-sm text-black/55 mb-6 sm:mb-8 max-w-lg mx-auto leading-relaxed px-2 font-normal">
              Nhập tên hoạt chất hoặc biệt dược. Trợ lý sẽ tự động đối chiếu nồng độ bài tiết qua sữa mẹ và phác đồ an toàn dựa trên chuẩn y văn lâm sàng.
            </p>

            {/* Thẻ gợi ý nhanh chuẩn Notion card-2 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left max-w-xl mx-auto px-2">
              {quickPrompts.map((q, idx) => {
                const IconComponent = q.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => onSendMessage(q.text)}
                    className="p-3.5 bg-white hover:bg-[#F6F5F4]/60 hover:border-black/20 border border-black/10 rounded-xl transition text-left group cursor-pointer active:scale-[0.99] flex flex-col justify-between shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 rounded-md bg-[#E6F3FE] text-[#097FE8] border border-[#0075DE]/20 text-xs">
                            <IconComponent className="w-3.5 h-3.5" />
                          </span>
                          <span className="text-xs font-semibold text-black group-hover:text-[#0075DE] transition-colors">
                            {q.title}
                          </span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-black/30 group-hover:text-[#0075DE] group-hover:translate-x-0.5 transition-all" />
                      </div>
                      <p className="text-xs text-black/60 leading-relaxed line-clamp-2">
                        {q.text}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Nút mở 15 Tình huống Lâm Sàng */}
            <div className="mt-4 max-w-xl mx-auto px-2">
              <button
                type="button"
                onClick={() => setIsScenarioModalOpen(true)}
                className="w-full p-3 bg-gradient-to-r from-[#E6F3FE]/80 to-white hover:from-[#E6F3FE] hover:to-[#E6F3FE]/30 border border-[#0075DE]/30 rounded-xl text-left transition flex items-center justify-between group shadow-2xs cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#0075DE] text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-black group-hover:text-[#0075DE] transition-colors">
                        Tình huống lâm sàng tư vấn dùng thuốc
                      </span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-[#0075DE]/10 text-[#0075DE] border border-[#0075DE]/20">
                        15 Ca lâm sàng
                      </span>
                    </div>
                    <p className="text-[11px] text-black/55 line-clamp-1">
                      Các ca lâm sàng thực tế về sốt, giảm đau, kháng sinh, dị ứng và tiết sữa ở mẹ cho con bú
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-black/30 group-hover:text-[#0075DE] group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            </div>

            {/* Capability Trust Badges */}
            <div className="mt-8 pt-6 border-t border-black/8 max-w-lg mx-auto flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-[11px] text-black/45 font-medium">
              <span className="inline-flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#1AAE39]" />
                NIH LactMed® Hoa Kỳ
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#1AAE39]" />
                Dược thư Quốc gia Việt Nam
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#1AAE39]" />
                Phát hiện Chống chỉ định
              </span>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((m, idx) => {
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
            })}
          </div>
        )}

        {/* Thông báo khởi động chậm */}
        {showColdStartHint && (
          <div className="p-3 bg-[#E6F3FE] border border-[#0075DE]/20 text-[#005BAB] text-xs rounded-xl flex items-center gap-2 max-w-md mx-auto animate-pulse shadow-2xs">
            <Loader2 className="w-4 h-4 animate-spin text-[#0075DE] shrink-0" />
            <span className="font-medium">Máy chủ đang khởi động lại từ trạng thái nghỉ, vui lòng đợi trong giây lát...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Elevated Input Dock */}
      <div className="p-3 sm:p-5 bg-gradient-to-t from-white via-white/95 to-transparent pb-safe shrink-0">
        <div className="max-w-3xl mx-auto space-y-2">
          {/* Gợi ý chế độ hiện tại */}
          <div className="flex items-center justify-between text-[11px] text-black/50 px-2 font-medium">
            <div className="flex items-center gap-1.5 truncate">
              <Info className="w-3.5 h-3.5 text-[#0075DE] shrink-0" />
              <span className="truncate">
                Phạm vi tra cứu: <strong className="text-black">{currentModeInfo.label}</strong> — {currentModeInfo.desc}
              </span>
            </div>
          </div>

          <form 
            onSubmit={handleSubmit} 
            className="flex items-center gap-2 p-1.5 sm:p-2 bg-white border border-black/14 rounded-xl shadow-notion-soft relative focus-within:border-[#0075DE] focus-within:ring-2 focus-within:ring-[#0075DE]/20 transition-all"
          >
            <input
              type="text"
              placeholder="Nhập tên thuốc, hoạt chất cần tra cứu an toàn cho mẹ và bé..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isStreaming}
              className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-transparent text-xs sm:text-sm text-black placeholder-black/35 focus:outline-none disabled:opacity-60"
            />

            {/* Nút mở nhanh Modal Tình huống */}
            <button
              type="button"
              onClick={() => setIsScenarioModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-[#F6F5F4] hover:bg-[#E6F3FE] hover:text-[#0075DE] hover:border-[#0075DE]/30 border border-black/10 rounded-lg text-xs font-semibold text-black/75 transition shadow-2xs cursor-pointer shrink-0"
              title="Xem và chọn tình huống kiểm chứng thực tế (Prompt 04)"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#0075DE] shrink-0" />
              <span className="hidden md:inline">Tình huống</span>
            </button>

            {/* BỘ CHỌN CHẾ ĐỘ NẰM CẠNH NÚT GỬI */}
            <div className="relative shrink-0" ref={modeMenuRef}>
              <button
                type="button"
                onClick={() => setShowModeMenu(!showModeMenu)}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-[#F6F5F4] hover:bg-black/5 border border-black/10 rounded-lg text-xs font-semibold text-black/80 transition shadow-2xs cursor-pointer"
                title="Bấm để chọn phạm vi tra cứu y khoa"
              >
                <CurrentIcon className="w-3.5 h-3.5 text-[#0075DE] shrink-0" />
                <span className="hidden sm:inline">{currentModeInfo.label}</span>
                <ChevronDown className="w-3 h-3 shrink-0 text-black/40" />
              </button>

              {/* Popup Dropdown 3 Chế Độ */}
              {showModeMenu && (
                <div className="absolute right-0 bottom-full mb-3 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-notion-float border border-black/10 p-2 z-50 animate-in fade-in duration-150">
                  <div className="px-3 py-2 text-[10px] font-bold text-black/45 uppercase tracking-wider border-b border-black/8 mb-1 flex items-center justify-between">
                    <span>Phạm vi tra cứu & y văn</span>
                    <span className="text-[10px] text-[#0075DE] font-semibold font-mono">3 Chế độ RAG</span>
                  </div>

                  {/* Chế độ 1: Tiêu chuẩn Cơ sở */}
                  <button
                    type="button"
                    onClick={() => {
                      onModeChange("strict");
                      setShowModeMenu(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-lg transition flex items-start gap-2.5 cursor-pointer ${
                      currentMode === "strict" 
                        ? "bg-[#E6F3FE] text-[#005BAB] border border-[#0075DE]/30 shadow-2xs" 
                        : "hover:bg-[#F6F5F4] text-black/80 border border-transparent"
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-[#0075DE] shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-xs font-bold text-black flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          Tiêu chuẩn Cơ sở
                          <span className="text-[10px] bg-black/5 text-black/70 px-1.5 py-0.2 rounded font-semibold border border-black/10">Chuẩn cao</span>
                        </span>
                        {currentMode === "strict" && <Check className="w-3.5 h-3.5 text-[#0075DE]" />}
                      </div>
                      <p className="text-[11px] text-black/60 mt-0.5 leading-snug">
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
                    className={`w-full text-left p-2.5 rounded-lg transition flex items-start gap-2.5 mt-1 cursor-pointer ${
                      currentMode === "balanced" 
                        ? "bg-[#E6F3FE] text-[#005BAB] border border-[#0075DE]/30 shadow-2xs" 
                        : "hover:bg-[#F6F5F4] text-black/80 border border-transparent"
                    }`}
                  >
                    <Scale className="w-4 h-4 text-[#0075DE] shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-xs font-bold text-black flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          Tổng hợp Lâm sàng
                          <span className="text-[10px] bg-[#0075DE]/10 text-[#0075DE] px-1.5 py-0.2 rounded font-semibold border border-[#0075DE]/20">Khuyên dùng</span>
                        </span>
                        {currentMode === "balanced" && <Check className="w-3.5 h-3.5 text-[#0075DE]" />}
                      </div>
                      <p className="text-[11px] text-black/60 mt-0.5 leading-snug">
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
                    className={`w-full text-left p-2.5 rounded-lg transition flex items-start gap-2.5 mt-1 cursor-pointer ${
                      currentMode === "flexible" 
                        ? "bg-[#E6F3FE] text-[#005BAB] border border-[#0075DE]/30 shadow-2xs" 
                        : "hover:bg-[#F6F5F4] text-black/80 border border-transparent"
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-[#0075DE] shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-xs font-bold text-black flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          Tra cứu Quốc tế
                          <span className="text-[10px] bg-black/5 text-black/70 px-1.5 py-0.2 rounded font-semibold border border-black/10">Toàn diện</span>
                        </span>
                        {currentMode === "flexible" && <Check className="w-3.5 h-3.5 text-[#0075DE]" />}
                      </div>
                      <p className="text-[11px] text-black/60 mt-0.5 leading-snug">
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
              className="p-2 sm:p-2.5 bg-[#0075DE] hover:bg-[#0062BD] active:bg-[#005BAB] disabled:bg-[#F6F5F4] disabled:text-black/30 text-white rounded-lg transition shadow-2xs flex items-center justify-center shrink-0 cursor-pointer disabled:cursor-not-allowed"
              title="Gửi câu hỏi"
            >
              {isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        </div>
      </div>

      {/* Modal chọn Tình huống kiểm chứng (Prompt 04) */}
      <ScenarioModal
        isOpen={isScenarioModalOpen}
        onClose={() => setIsScenarioModalOpen(false)}
        onInsertClaim={(text) => setInput(text)}
        onSelectScenario={(text) => onSendMessage(text)}
      />
    </main>
  );
};
