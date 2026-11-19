import React, { useState, useEffect, useMemo } from "react";
import { type ScenarioItem, getScenarios } from "../services/api";
import { 
  X, 
  Search, 
  AlertTriangle, 
  ShieldAlert, 
  Check, 
  ArrowRight, 
  Copy, 
  Loader2, 
  Filter,
  RefreshCw,
  BookOpen
} from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectScenario: (claimText: string) => void;
  onInsertClaim: (claimText: string) => void;
}

export const ScenarioModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSelectScenario,
  onInsertClaim
}) => {
  const [scenarios, setScenarios] = useState<ScenarioItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadScenarios();
    }
  }, [isOpen]);

  const loadScenarios = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getScenarios();
      setScenarios(data);
    } catch (err: any) {
      setError(err?.message || "Không thể tải danh sách tình huống.");
    } finally {
      setLoading(false);
    }
  };

  const platforms = useMemo(() => {
    const list = Array.from(new Set(scenarios.map(s => s.platform).filter(Boolean)));
    return ["all", ...list];
  }, [scenarios]);

  const filteredScenarios = useMemo(() => {
    return scenarios.filter(s => {
      const matchPlatform = selectedPlatform === "all" || s.platform.toLowerCase() === selectedPlatform.toLowerCase();
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q || 
        s.code.toLowerCase().includes(q) ||
        s.title.toLowerCase().includes(q) ||
        s.claimText.toLowerCase().includes(q) ||
        s.platform.toLowerCase().includes(q);
      return matchPlatform && matchQuery;
    });
  }, [scenarios, selectedPlatform, searchQuery]);

  const handleCopy = (text: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  if (!isOpen) return null;

  const getPlatformBadgeColor = (platform: string) => {
    const p = platform.toLowerCase();
    if (p.includes("tiktok")) return "bg-pink-50 text-pink-700 border-pink-200";
    if (p.includes("facebook")) return "bg-blue-50 text-blue-700 border-blue-200";
    if (p.includes("youtube")) return "bg-red-50 text-red-700 border-red-200";
    if (p.includes("web")) return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-gray-100 text-gray-700 border-gray-200";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-4xl bg-white rounded-2xl shadow-notion-float border border-black/10 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-black/8 flex items-center justify-between shrink-0 bg-[#FBFBFA]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#E6F3FE] text-[#0075DE] border border-[#0075DE]/20 flex items-center justify-center shadow-2xs">
              <BookOpen className="w-5 h-5 text-[#0075DE]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-black tracking-tight">
                  Bộ Tình Huống Kiểm Chứng Thực Tế
                </h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#E6F3FE] text-[#0075DE] border border-[#0075DE]/20">
                  Prompt 04 Data
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-black/55">
                Chọn tình huống thông tin thuốc mạng xã hội để đối soát y văn theo mô hình CRAAP & SIFT
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-black/40 hover:text-black hover:bg-black/5 transition cursor-pointer"
            title="Đóng hộp thoại"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Platform Filter Toolbar */}
        <div className="p-3 sm:p-4 border-b border-black/8 bg-white flex flex-col sm:flex-row gap-2.5 shrink-0">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-black/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm theo mã (TH01...), hoạt chất, hoặc nội dung bài đăng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#F6F5F4]/70 border border-black/10 rounded-xl text-xs sm:text-sm text-black placeholder-black/40 focus:outline-none focus:border-[#0075DE] focus:bg-white transition"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-black/40 hover:text-black text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 shrink-0">
            {platforms.map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPlatform(p)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer border ${
                  selectedPlatform === p
                    ? "bg-[#0075DE] text-white border-[#0075DE] shadow-2xs"
                    : "bg-[#F6F5F4] text-black/60 hover:text-black hover:bg-black/5 border-black/10"
                }`}
              >
                {p === "all" ? "Tất cả nền tảng" : p}
              </button>
            ))}
          </div>
        </div>

        {/* Scenarios List Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3 bg-[#FBFBFA]/60">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center text-black/50 space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#0075DE]" />
              <p className="text-xs">Đang tải danh sách tình huống thực tế...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center justify-between">
              <span>{error}</span>
              <button 
                onClick={loadScenarios}
                className="px-2.5 py-1 bg-white border border-red-300 rounded-md font-semibold hover:bg-red-100 flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Thử lại
              </button>
            </div>
          ) : filteredScenarios.length === 0 ? (
            <div className="py-12 text-center text-black/45 space-y-2">
              <Filter className="w-8 h-8 mx-auto text-black/25" />
              <p className="text-xs sm:text-sm font-medium">Không tìm thấy tình huống nào phù hợp</p>
              <p className="text-xs text-black/35">Thử đổi từ khóa hoặc bộ lọc nền tảng</p>
            </div>
          ) : (
            filteredScenarios.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-white border border-black/10 rounded-xl shadow-2xs hover:border-[#0075DE]/40 hover:shadow-notion-soft transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-black/5 text-black border border-black/10">
                        {item.code || "TH"}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getPlatformBadgeColor(item.platform)}`}>
                        {item.platform}
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-black group-hover:text-[#0075DE] transition-colors">
                        {item.title}
                      </h4>
                    </div>

                    <button
                      onClick={(e) => handleCopy(item.claimText, item.id, e)}
                      className="p-1.5 rounded-md hover:bg-black/5 text-black/40 hover:text-black transition cursor-pointer shrink-0"
                      title="Sao chép nội dung tuyên bố"
                    >
                      {copiedId === item.id ? (
                        <Check className="w-3.5 h-3.5 text-[#1AAE39]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Claim Box */}
                  <div className="p-3 bg-[#F6F5F4]/60 border border-black/8 rounded-lg text-xs text-black/85 leading-relaxed mb-3 font-normal italic">
                    "{item.claimText}"
                  </div>

                  {/* Metadata Indicators: Doubt Signals & Clinical Risk */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] mb-3">
                    {item.doubtSignals && (
                      <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/70 text-amber-900 leading-snug">
                        <div className="font-bold flex items-center gap-1.5 mb-1 text-amber-800">
                          <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                          <span>Dấu hiệu nghi ngờ:</span>
                        </div>
                        <p className="text-amber-900/80">{item.doubtSignals}</p>
                      </div>
                    )}
                    {item.potentialRisk && (
                      <div className="p-2.5 rounded-lg bg-red-50/70 border border-red-200/70 text-red-900 leading-snug">
                        <div className="font-bold flex items-center gap-1.5 mb-1 text-red-800">
                          <ShieldAlert className="w-3 h-3 text-red-600 shrink-0" />
                          <span>Nguy cơ lâm sàng:</span>
                        </div>
                        <p className="text-red-900/80">{item.potentialRisk}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-2 border-t border-black/6 flex items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      onInsertClaim(item.claimText);
                      onClose();
                    }}
                    className="px-3 py-1.5 bg-[#F6F5F4] hover:bg-black/8 text-black/75 hover:text-black border border-black/10 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1"
                  >
                    <span>Chèn vào ô nhập</span>
                  </button>

                  <button
                    onClick={() => {
                      onSelectScenario(item.claimText);
                      onClose();
                    }}
                    className="px-3.5 py-1.5 bg-[#0075DE] hover:bg-[#005BAB] text-white rounded-lg text-xs font-semibold shadow-2xs hover:shadow-xs transition cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Kiểm chứng ngay</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-black/8 bg-[#FBFBFA] flex items-center justify-between text-xs text-black/50 shrink-0">
          <span>
            Hiển thị <strong>{filteredScenarios.length}</strong> / {scenarios.length} tình huống thực nghiệm
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-black/10 bg-white hover:bg-black/5 text-black font-medium transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
