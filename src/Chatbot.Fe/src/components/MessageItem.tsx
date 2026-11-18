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
  Loader2
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
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>TƯƠNG THÍCH (AN TOÀN CHO CON BÚ)</span>
        </div>
      );
    }
    if (level === "Caution") {
      return (
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300 shadow-2xs">
          <Shield className="w-4 h-4 text-amber-600 shrink-0" />
          <span>THẬN TRỌNG (CẦN THEO DÕI BIỂU HIỆN CỦA TRẺ)</span>
        </div>
      );
    }
    if (level === "Contraindicated") {
      return (
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl text-xs font-bold bg-rose-50 text-rose-900 border border-rose-300 shadow-2xs">
          <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
          <span>CHỐNG CHỈ ĐỊNH (NGUY CƠ CAO HOẶC LÀM MẤT SỮA)</span>
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
        className={`max-w-[92%] sm:max-w-[80%] rounded-2xl px-4 sm:px-5 py-3.5 sm:py-4 ${
          isUser
            ? "bg-teal-600 text-white rounded-br-xs shadow-md"
            : "bg-white border border-gray-100 text-gray-800 rounded-bl-xs shadow-sm"
        }`}
      >
        {/* Header tin nhắn bot: Nhãn an toàn + Nhãn chế độ */}
        {!isUser && (
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {renderSafetyBadge(message.safetyLevel)}
            {renderModeBadge()}
          </div>
        )}

        {/* Nội dung Markdown chính có style riêng cho các phần và Hộp lưu ý Callout */}
        <div
          className={`prose prose-sm max-w-none leading-relaxed ${
            isUser ? "prose-invert text-white" : "text-gray-800"
          } [&_h3]:text-teal-950 [&_h3]:font-bold [&_h3]:text-sm [&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:pb-1.5 [&_h3]:border-b [&_h3]:border-teal-100/70 [&_blockquote]:bg-amber-50/85 [&_blockquote]:border-l-4 [&_blockquote]:border-amber-400 [&_blockquote]:px-4 [&_blockquote]:py-3 [&_blockquote]:rounded-r-xl [&_blockquote]:my-3.5 [&_blockquote]:not-italic [&_blockquote]:text-amber-950 [&_blockquote_p]:m-0 [&_blockquote_p]:leading-relaxed [&_ul]:my-2 [&_li]:my-0.5 [&_a]:text-teal-700 [&_a]:underline [&_a]:font-semibold hover:[&_a]:text-teal-900`}
          dangerouslySetInnerHTML={{ __html: parsedHtml }}
        />

        {/* Căn cứ trích dẫn: Phân định rõ Tài liệu nội bộ vs Nguồn đối soát quốc tế trực tiếp */}
        {(showInternal || showExternal) && (
          <div className="mt-4 pt-3 border-t border-gray-100 space-y-3">
            {/* Nhóm 1: Chuyên luận cơ sở (Bấm vào mở Pop-up bôi đậm) */}
            {showInternal && (
              <div>
                <div className="text-xs font-bold text-teal-900 mb-2 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-teal-600" />
                  <span>Chuyên luận thẩm định cơ sở:</span>
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
                        className="inline-flex items-center gap-2 text-xs px-3 py-1.5 min-h-[36px] font-medium rounded-xl border bg-teal-50/80 hover:bg-teal-100/90 text-teal-950 border-teal-200 transition shadow-2xs hover:scale-102 cursor-pointer active:scale-95"
                        title="Nhấp để xem toàn văn chuyên luận y khoa và đoạn căn cứ được bôi đậm"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span className="font-semibold">{cleanTitle}</span>
                        <span className="text-[10px] bg-teal-200/60 text-teal-800 px-1.5 py-0.2 rounded-md font-mono font-bold">
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
                        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 min-h-[36px] font-medium rounded-xl border bg-indigo-50/80 hover:bg-indigo-100/90 text-indigo-950 border-indigo-200 transition shadow-2xs hover:scale-102 cursor-pointer no-underline active:scale-95"
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
          <div className="mt-4 p-3 bg-amber-50/90 border border-amber-200/90 rounded-xl text-amber-900 text-xs flex items-start gap-2.5 shadow-2xs">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div 
              className="leading-relaxed font-medium prose prose-xs text-amber-900 [&_p]:m-0"
              dangerouslySetInnerHTML={{ __html: parsedDisclaimerHtml }}
            />
          </div>
        )}

        {/* Nút Báo lỗi phản hồi & Form gửi Incident */}
        {!isUser && message.content && (
          <div className="mt-3 pt-2 flex flex-col items-end border-t border-gray-100/60">
            {!showReportForm ? (
              <button
                onClick={() => setShowReportForm(true)}
                className="text-[11px] text-gray-400 hover:text-red-600 flex items-center gap-1 transition px-2 py-1 rounded-md hover:bg-red-50/60 cursor-pointer"
                title="Báo cáo câu trả lời sai lệch hoặc thiếu y văn tới Quản trị viên"
              >
                <Flag className="w-3 h-3" />
                <span>Báo lỗi câu trả lời</span>
              </button>
            ) : (
              <div className="w-full mt-2 p-3 bg-red-50/60 border border-red-200/80 rounded-xl text-left animate-in fade-in duration-150">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-red-900">
                    <Flag className="w-3.5 h-3.5 text-red-600" />
                    <span>Gửi báo cáo sự cố (Incident Hub)</span>
                  </div>
                  <button
                    onClick={() => setShowReportForm(false)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded transition"
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
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        Loại vấn đề gặp phải:
                      </label>
                      <select
                        value={reportErrorType}
                        onChange={(e) => setReportErrorType(e.target.value as any)}
                        className="w-full text-xs p-1.5 bg-white border border-red-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-400 text-gray-800"
                      >
                        <option value="user_reported">Thông tin chưa chuẩn xác / Cần bác sĩ thẩm định</option>
                        <option value="refusal">Mô hình từ chối trả lời vì thiếu y văn</option>
                        <option value="contraindicated_flag">Phân loại an toàn không đúng thực tế</option>
                        <option value="model_timeout">Lỗi mô hình / Format câu trả lời bị hỏng</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        Ghi chú chi tiết (tùy chọn):
                      </label>
                      <textarea
                        value={reportNote}
                        onChange={(e) => setReportNote(e.target.value)}
                        placeholder="Mô tả cụ thể thông tin sai hoặc tài liệu cần bổ sung..."
                        rows={2}
                        className="w-full text-xs p-2 bg-white border border-red-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-400 text-gray-800 placeholder-gray-400 resize-none"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowReportForm(false)}
                        className="px-2.5 py-1 text-xs text-gray-500 hover:bg-gray-200/60 rounded-lg transition"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={submittingReport}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition shadow-2xs disabled:opacity-50 cursor-pointer"
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
