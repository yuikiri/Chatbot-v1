import React, { useState } from "react";
import type { ChatMessage, CitationItem } from "../services/api";
import { reportIncident } from "../services/firebase";
import { marked } from "marked";
import { 
  ShieldAlert, 
  ShieldCheck, 
  Shield, 
  BookOpen, 
  Globe, 
  ExternalLink, 
  Scale, 
  Sparkles, 
  AlertTriangle, 
  Flag, 
  Check, 
  Send, 
  X, 
  Loader2,
  Copy,
  Stethoscope
} from "lucide-react";

interface Props {
  message: ChatMessage;
  onOpenCitation: (citation: CitationItem) => void;
  currentUser?: any;
  conversationId?: string;
  userPromptText?: string;
}

export const MessageItem: React.FC<Props> = ({ 
  message, 
  onOpenCitation, 
  currentUser, 
  conversationId, 
  userPromptText 
}) => {
  const isUser = message.role === "user";

  // Incident reporting state
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportErrorType, setReportErrorType] = useState<
    'user_reported' | 'refusal' | 'contraindicated_flag' | 'model_timeout'
  >('user_reported');
  const [reportNote, setReportNote] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!message.content) return;
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isRefusalContent = (content?: string, isRefusalProp?: boolean): boolean => {
    if (isRefusalProp) return true;
    if (!content) return false;
    const lower = content.toLowerCase();
    return (
      lower.includes("chưa ghi nhận thông tin") ||
      lower.includes("chưa ghi nhận tài liệu") ||
      lower.includes("chưa có dữ liệu") ||
      lower.includes("không có dữ liệu y văn") ||
      lower.includes("chưa có thông tin kiểm duyệt") ||
      lower.includes("chưa có hồ sơ cơ sở") ||
      lower.includes("chưa được nạp tài liệu") ||
      lower.includes("xin chào bạn! tôi là lactamed ai") ||
      lower.includes("không có dữ liệu y văn chẩn đoán")
    );
  };

  const isRefusal = isRefusalContent(message.content, message.isRefusal);

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingReport(true);
    try {
      await reportIncident({
        userId: currentUser?.uid || "anonymous",
        userEmail: currentUser?.email || undefined,
        conversationId: conversationId || "untracked",
        userQuery: userPromptText || "Câu hỏi đang xem",
        botResponse: message.content,
        errorType: reportErrorType,
        errorMessage: reportNote.trim() || undefined,
        adminNotes: undefined
      });
      setReportSuccess(true);
      setTimeout(() => {
        setShowReportForm(false);
        setReportSuccess(false);
        setReportNote("");
      }, 2500);
    } catch (err) {
      console.error("Lỗi khi báo sự cố:", err);
    } finally {
      setSubmittingReport(false);
    }
  };

  const renderModeBadge = () => {
    if (isUser || !message.mode) return null;

    if (message.mode === "strict") {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
          <ShieldCheck className="w-3 h-3 text-teal-600" />
          <span>Tiêu chuẩn Cơ sở</span>
        </span>
      );
    }
    if (message.mode === "balanced") {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
          <Scale className="w-3 h-3 text-blue-600" />
          <span>Tổng hợp Lâm sàng</span>
        </span>
      );
    }
    if (message.mode === "flexible") {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200">
          <Sparkles className="w-3 h-3 text-indigo-600" />
          <span>Tra cứu Quốc tế</span>
        </span>
      );
    }
    return null;
  };

  const formatDocumentTitle = (rawName: string) => {
    if (!rawName) return "Chuyên luận Y khoa";
    let clean = rawName.replace(/\.(txt|md|pdf|json|html|htm)$/i, "");
    if (clean.startsWith("web_")) {
      clean = clean.replace(/^web_/, "").replace(/_\d{8}_\d{4}$/, "");
    }
    clean = clean.replace(/[_-]+/g, " ").trim();
    clean = clean.split(" ").map(w => w ? w.charAt(0).toUpperCase() + w.slice(1) : "").join(" ");
    return clean.toLowerCase().startsWith("chuyên luận") ? clean : `Chuyên luận ${clean}`;
  };

  const formatExternalTitle = (rawName: string) => {
    if (!rawName) return "Nguồn y văn quốc tế";
    return rawName.replace(/^\[|\]$/g, "").trim();
  };

  const renderSafetyBadge = (level?: string) => {
    // Ẩn nhãn an toàn nếu không có level, hoặc là None/Unknown, hoặc là câu từ chối, hoặc không có trích dẫn y văn
    if (
      !level || 
      level === "None" || 
      level === "Unknown" ||
      isRefusal ||
      !message.citations || 
      message.citations.length === 0
    ) {
      return null;
    }

    if (level === "Compatible") {
      return (
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl text-xs font-semibold bg-emerald-50/90 text-emerald-950 border border-emerald-300/80 shadow-2xs">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Tương thích · An toàn khi cho con bú</span>
        </div>
      );
    }
    if (level === "Caution") {
      return (
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl text-xs font-semibold bg-amber-50/90 text-amber-950 border border-amber-300/80 shadow-2xs">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <Shield className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Thận trọng · Cần theo dõi biểu hiện trẻ</span>
        </div>
      );
    }
    if (level === "Contraindicated") {
      return (
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl text-xs font-semibold bg-rose-50/90 text-rose-950 border border-rose-300/80 shadow-2xs">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
          </span>
          <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
          <span>Chống chỉ định · Nguy cơ cao hoặc ức chế tiết sữa</span>
        </div>
      );
    }

    return null;
  };

  // Tách nội dung chính và nội dung Cảnh báo y tế (Disclaimer)
  const extractDisclaimer = (rawContent: string) => {
    if (!rawContent) return { mainText: "", disclaimerText: null };

    const marker = ":::MEDICAL_DISCLAIMER:::";
    if (rawContent.includes(marker)) {
      const idx = rawContent.indexOf(marker);
      const mainText = rawContent.slice(0, idx).trim();
      let disclaimerText = rawContent.slice(idx + marker.length).trim();
      disclaimerText = disclaimerText.replace(/:::MEDICAL_DISCLAIMER:::/g, "").trim();
      return { mainText, disclaimerText: disclaimerText || null };
    }

    const legacyMarker = "⚠️ **Lưu ý quan trọng:**";
    if (rawContent.includes(legacyMarker)) {
      const idx = rawContent.indexOf(legacyMarker);
      const mainText = rawContent.slice(0, idx).replace(/---\s*$/, "").trim();
      const disclaimer = rawContent.slice(idx).trim();
      return { mainText, disclaimerText: disclaimer };
    }

    return { mainText: rawContent, disclaimerText: null };
  };

  const { mainText, disclaimerText } = extractDisclaimer(message.content || "");
  const parsedHtml = marked.parse(mainText, { breaks: true }) as string;
  const parsedDisclaimerHtml = disclaimerText ? (marked.parse(disclaimerText, { breaks: true }) as string) : null;

  // Phân định rõ tài liệu nội bộ và nguồn kiểm chứng bên ngoài
  const internalCitations = (message.citations || []).filter((c) => {
    const docId = c.documentId || (c as any).DocumentId;
    const srcType = c.sourceType || (c as any).SourceType;
    return srcType !== "external" && docId && !String(docId).startsWith("ext_");
  });

  const externalCitations = (message.citations || []).filter((c) => {
    const docId = c.documentId || (c as any).DocumentId;
    const srcType = c.sourceType || (c as any).SourceType;
    const url = c.url || (c as any).Url;
    return srcType === "external" || (url && (!docId || String(docId).startsWith("ext_")));
  });

  const showInternal = !isUser && !isRefusal && internalCitations.length > 0;
  const showExternal = !isUser && !isRefusal && externalCitations.length > 0;

  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-[92%] sm:max-w-[82%] rounded-2xl px-4 sm:px-6 py-3.5 sm:py-4.5 transition-all ${
          isUser
            ? "bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-br-sm shadow-sm shadow-teal-900/10"
            : "bg-white border border-slate-200/80 text-slate-800 rounded-bl-sm shadow-subtle"
        }`}
      >
        {/* Header tin nhắn bot: Nhãn thương hiệu + Nhãn an toàn + Nhãn chế độ */}
        {!isUser && (
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-teal-50 text-teal-700 border border-teal-200/60 flex items-center justify-center">
                <Stethoscope className="w-3 h-3 text-teal-600" />
              </div>
              <span className="text-xs font-bold text-slate-900 tracking-tight">LactaMed AI</span>
              {renderModeBadge()}
            </div>
            {renderSafetyBadge(message.safetyLevel)}
          </div>
        )}

        {/* Nội dung Markdown chính có style riêng cho các phần và Hộp lưu ý Callout */}
        <div
          className={isUser ? "user-prose" : "medical-prose"}
          dangerouslySetInnerHTML={{ __html: parsedHtml }}
        />

        {/* Căn cứ trích dẫn: Phân định rõ Tài liệu nội bộ vs Nguồn đối soát quốc tế trực tiếp */}
        {(showInternal || showExternal) && (
          <div className="mt-4 pt-3 border-t border-slate-100 space-y-3">
            {/* Nhóm 1: Chuyên luận cơ sở (Bấm vào mở Pop-up bôi đậm) */}
            {showInternal && (
              <div>
                <div className="text-xs font-bold text-teal-950 mb-2 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-teal-600" />
                  <span>Chuyên luận thẩm định cơ sở (Bấm để xem căn cứ bôi đậm):</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {internalCitations.map((c) => {
                    const docName = c.documentName || (c as any).DocumentName || "Tài liệu";
                    const score = c.relevanceScore ?? (c as any).RelevanceScore ?? 0;
                    const srcType = c.sourceType || (c as any).SourceType || "internal";
                    const url = c.url || (c as any).Url;
                    const docId = c.documentId || (c as any).DocumentId;
                    const citeKey = c.citationId || (c as any).CitationId || docName;
                    const cleanTitle = formatDocumentTitle(docName);

                    return (
                      <button
                        key={citeKey}
                        onClick={() => onOpenCitation({
                          ...c,
                          documentId: docId,
                          documentName: cleanTitle,
                          relevanceScore: score,
                          sourceType: srcType,
                          url: url,
                          startOffset: c.startOffset ?? (c as any).StartOffset ?? 0,
                          endOffset: c.endOffset ?? (c as any).EndOffset ?? 0,
                          snippet: c.snippet || (c as any).Snippet || ""
                        })}
                        className="inline-flex items-center gap-2 text-xs px-3 py-1.5 min-h-[34px] font-medium rounded-xl border bg-teal-50/70 hover:bg-teal-100/80 text-teal-950 border-teal-200/80 transition-all shadow-2xs hover:scale-[1.02] active:scale-95 cursor-pointer"
                        title="Nhấp để xem toàn văn chuyên luận y khoa và đoạn căn cứ được bôi đậm"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span className="font-semibold">{cleanTitle}</span>
                        <span className="text-[10px] bg-teal-200/60 text-teal-900 px-1.5 py-0.2 rounded-md font-mono font-bold">
                          {Math.round(score * 100)}%
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Nhóm 2: Nguồn đối soát y văn quốc tế (Link bài viết chuyên luận thật) */}
            {showExternal && (
              <div>
                <div className="text-xs font-bold text-indigo-950 mb-2 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Chuyên luận y khoa quốc tế xác thực (Mở bài viết gốc ↗):</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {externalCitations.map((c) => {
                    const docName = c.documentName || (c as any).DocumentName || "Nguồn ngoài";
                    const url = c.url || (c as any).Url;
                    const citeKey = c.citationId || (c as any).CitationId || docName;
                    const cleanTitle = formatExternalTitle(docName);

                    return (
                      <a
                        key={citeKey}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 min-h-[34px] font-medium rounded-xl border bg-indigo-50/70 hover:bg-indigo-100/80 text-indigo-950 border-indigo-200/80 transition-all shadow-2xs hover:scale-[1.02] active:scale-95 cursor-pointer no-underline"
                        title={`Mở trực tiếp bài viết chuyên luận lâm sàng ${cleanTitle} trên tab mới`}
                      >
                        <Globe className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span className="font-semibold">{cleanTitle}</span>
                        <ExternalLink className="w-3 h-3 text-indigo-500 opacity-80" />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Hộp Cảnh Báo Y Khoa (Disclaimer Alert Banner) chuyên biệt ở chân tin nhắn */}
        {!isUser && parsedDisclaimerHtml && (
          <div className="mt-4 p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-amber-950 text-xs flex items-start gap-2.5 shadow-2xs">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div 
              className="leading-relaxed font-medium medical-prose text-amber-950 [&_p]:m-0"
              dangerouslySetInnerHTML={{ __html: parsedDisclaimerHtml }}
            />
          </div>
        )}

        {/* Action bar: Nút Sao chép & Nút Báo lỗi phản hồi */}
        {!isUser && message.content && (
          <div className="mt-3.5 pt-2.5 flex flex-col items-end border-t border-slate-100">
            <div className="flex items-center justify-between w-full">
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-700 transition px-2 py-1 rounded-md hover:bg-slate-100 cursor-pointer"
                title="Sao chép nội dung câu trả lời"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-teal-600" />
                    <span className="text-teal-700 font-semibold">Đã sao chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Sao chép</span>
                  </>
                )}
              </button>

              {!showReportForm ? (
                <button
                  onClick={() => setShowReportForm(true)}
                  className="text-[11px] text-slate-400 hover:text-rose-600 flex items-center gap-1 transition px-2 py-1 rounded-md hover:bg-rose-50/60 cursor-pointer"
                  title="Báo cáo câu trả lời sai lệch hoặc thiếu y văn tới Quản trị viên"
                >
                  <Flag className="w-3 h-3" />
                  <span>Báo lỗi câu trả lời</span>
                </button>
              ) : null}
            </div>

            {/* Form gửi Incident */}
            {showReportForm && (
              <div className="w-full mt-2.5 p-3.5 bg-rose-50/50 border border-rose-200/80 rounded-xl text-left animate-in fade-in duration-150 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-950">
                    <Flag className="w-3.5 h-3.5 text-rose-600" />
                    <span>Gửi báo cáo sự cố (Incident Hub)</span>
                  </div>
                  <button
                    onClick={() => setShowReportForm(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {reportSuccess ? (
                  <div className="py-2 text-xs text-emerald-800 font-semibold flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Đã ghi nhận sự cố vào Incident Hub! Bác sĩ quản trị sẽ thẩm định lại.</span>
                  </div>
                ) : (
                  <form onSubmit={handleReportSubmit} className="space-y-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Loại vấn đề gặp phải:
                      </label>
                      <select
                        value={reportErrorType}
                        onChange={(e) => setReportErrorType(e.target.value as any)}
                        className="w-full text-xs p-2 bg-white border border-rose-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-400 text-slate-800"
                      >
                        <option value="user_reported">Thông tin chưa chuẩn xác / Cần bác sĩ thẩm định</option>
                        <option value="refusal">Mô hình từ chối trả lời vì thiếu y văn</option>
                        <option value="contraindicated_flag">Phân loại an toàn không đúng thực tế</option>
                        <option value="model_timeout">Lỗi mô hình / Format câu trả lời bị hỏng</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Ghi chú chi tiết (tùy chọn):
                      </label>
                      <textarea
                        value={reportNote}
                        onChange={(e) => setReportNote(e.target.value)}
                        placeholder="Mô tả cụ thể thông tin sai hoặc tài liệu cần bổ sung..."
                        rows={2}
                        className="w-full text-xs p-2.5 bg-white border border-rose-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-400 text-slate-800 placeholder-slate-400 resize-none"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowReportForm(false)}
                        className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-200/60 rounded-lg transition"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={submittingReport}
                        className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition shadow-2xs disabled:opacity-50 cursor-pointer"
                      >
                        {submittingReport ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3 h-3" />
                        )}
                        <span>Gửi sự cố</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
