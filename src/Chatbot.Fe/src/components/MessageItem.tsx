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
        category: "user_reported",
        userId: currentUser?.uid || "anonymous",
        userEmail: currentUser?.email || undefined,
        conversationId: conversationId || "untracked",
        messageId: message.id,
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
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F6F5F4] text-black/70 border border-black/8">
          <ShieldCheck className="w-3 h-3 text-[#0075DE]" />
          <span>Tiêu chuẩn Cơ sở</span>
        </span>
      );
    }
    if (message.mode === "balanced") {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#E6F3FE] text-[#005BAB] border border-[#0075DE]/20">
          <Scale className="w-3 h-3 text-[#0075DE]" />
          <span>Tổng hợp Lâm sàng</span>
        </span>
      );
    }
    if (message.mode === "flexible") {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F6F5F4] text-black/70 border border-black/8">
          <Sparkles className="w-3 h-3 text-[#0075DE]" />
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
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#D0F4D8]/70 text-[#1AAE39] border border-[#1AAE39]/30 shadow-2xs">
          <ShieldCheck className="w-4 h-4 text-[#1AAE39] shrink-0" />
          <span>Tương thích · An toàn khi cho con bú</span>
        </div>
      );
    }
    if (level === "Caution") {
      return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#FEF3C7]/80 text-[#B45309] border border-[#FFB110]/40 shadow-2xs">
          <Shield className="w-4 h-4 text-[#FFB110] shrink-0" />
          <span>Thận trọng · Cần theo dõi biểu hiện trẻ</span>
        </div>
      );
    }
    if (level === "Contraindicated") {
      return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#FFE4E6]/80 text-[#F64932] border border-[#F64932]/40 shadow-2xs">
          <ShieldAlert className="w-4 h-4 text-[#F64932] shrink-0" />
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
        className={`max-w-[92%] sm:max-w-[85%] transition-all ${
          isUser
            ? "bg-[#0075DE] text-white rounded-lg px-4 py-2.5 shadow-2xs"
            : "bg-white border border-black/10 text-black/85 rounded-xl px-5 sm:px-6 py-4 shadow-2xs w-full"
        }`}
      >
        {/* Header tin nhắn bot: Nhãn thương hiệu + Nhãn an toàn + Nhãn chế độ */}
        {!isUser && (
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2.5 border-b border-black/8">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-[#F6F5F4] text-[#0075DE] border border-black/8 flex items-center justify-center">
                <Stethoscope className="w-3 h-3 text-[#0075DE]" />
              </div>
              <span className="text-xs font-semibold text-black tracking-tight">Health Care</span>
              {renderModeBadge()}
            </div>
            {renderSafetyBadge(message.safetyLevel)}
          </div>
        )}

        {/* Nội dung Markdown chính có style riêng cho các phần và Hộp lưu ý Callout */}
        <div
          className={isUser ? "user-prose font-sans text-xs sm:text-sm" : "medical-prose"}
          dangerouslySetInnerHTML={{ __html: parsedHtml }}
        />

        {/* Căn cứ trích dẫn: Phân định rõ Tài liệu nội bộ vs Nguồn đối soát quốc tế trực tiếp */}
        {(showInternal || showExternal) && (
          <div className="mt-4 pt-3 border-t border-black/8 space-y-3">
            {/* Nhóm 1: Chuyên luận cơ sở (Bấm vào mở Pop-up bôi đậm) */}
            {showInternal && (
              <div>
                <div className="text-xs font-semibold text-black/70 mb-2 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-[#0075DE]" />
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
                        type="button"
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
                        className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border bg-[#E6F3FE] hover:bg-[#D4EAFE] text-[#097FE8] border-[#0075DE]/20 transition shadow-2xs cursor-pointer"
                        title="Nhấp để xem toàn văn chuyên luận y khoa và đoạn căn cứ được bôi đậm"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-[#097FE8] shrink-0" />
                        <span className="font-semibold">{cleanTitle}</span>
                        <span className="text-[10px] bg-white text-[#005BAB] px-1.5 py-0.2 rounded-full font-mono font-bold border border-[#0075DE]/20">
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
                <div className="text-xs font-semibold text-black/70 mb-2 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-black/60" />
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
                        className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border bg-[#F6F5F4] hover:bg-black/5 text-black/80 border-black/10 transition shadow-2xs cursor-pointer no-underline"
                        title={`Mở trực tiếp bài viết chuyên luận lâm sàng ${cleanTitle} trên tab mới`}
                      >
                        <Globe className="w-3.5 h-3.5 text-black/50 shrink-0" />
                        <span className="font-medium">{cleanTitle}</span>
                        <ExternalLink className="w-3 h-3 text-black/40" />
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
          <div className="mt-4 p-3 bg-[#FFFDF5] border-l-3 border-[#FFB110] rounded-r-lg text-[#78350F] text-xs flex items-start gap-2.5 shadow-2xs">
            <AlertTriangle className="w-4 h-4 text-[#FFB110] shrink-0 mt-0.5" />
            <div 
              className="leading-relaxed font-medium medical-prose text-[#78350F] [&_p]:m-0"
              dangerouslySetInnerHTML={{ __html: parsedDisclaimerHtml }}
            />
          </div>
        )}

        {/* Hộp Ý Kiến Thẩm Định Y Khoa & Đính Chính từ Bác Sĩ Quản Trị */}
        {!isUser && message.adminReview && (
          <div className="mt-4 p-4 bg-emerald-50/90 border border-emerald-300 rounded-xl text-xs space-y-2.5 shadow-2xs animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-200">
              <div className="flex items-center gap-1.5 font-bold text-emerald-950">
                <Stethoscope className="w-4 h-4 text-emerald-600" />
                <span>Ý Kiến Thẩm Định & Đính Chính từ Bác Sĩ Quản Trị</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                message.adminReview.status === 'resolved'
                  ? 'bg-emerald-200 text-emerald-900 border border-emerald-300'
                  : 'bg-amber-100 text-amber-900 border border-amber-300'
              }`}>
                {message.adminReview.status === 'resolved' ? 'Đã hiệu chỉnh chuẩn y khoa' : 'Đang xem xét'}
              </span>
            </div>

            {message.adminReview.correctedResponse && (
              <div className="p-3 bg-white rounded-lg border border-[#1AAE39]/30 text-black/85 leading-relaxed shadow-2xs">
                <div className="text-[11px] font-bold text-[#15803D] mb-1 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-[#1AAE39]" />
                  <span>Câu trả lời chuẩn y khoa sau hiệu chỉnh:</span>
                </div>
                <div 
                  className="prose prose-xs max-w-none text-black/85 [&_p]:m-0"
                  dangerouslySetInnerHTML={{ __html: marked.parse(message.adminReview.correctedResponse, { breaks: true }) as string }}
                />
              </div>
            )}

            {message.adminReview.adminNotes && (
              <div className="text-[11px] text-emerald-950 bg-emerald-100/70 p-2.5 rounded-lg border border-emerald-200/80">
                <strong className="text-emerald-900">Lời dặn của Bác sĩ:</strong> {message.adminReview.adminNotes}
              </div>
            )}
          </div>
        )}

        {/* Action bar: Nút Sao chép & Nút Báo lỗi phản hồi */}
        {!isUser && message.content && (
          <div className="mt-3.5 pt-2 flex flex-col items-end border-t border-black/6">
            <div className="flex items-center justify-between w-full">
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 text-[11px] text-black/45 hover:text-black hover:bg-black/5 transition px-2 py-1 rounded-md cursor-pointer"
                title="Sao chép nội dung câu trả lời"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-[#1AAE39]" />
                    <span className="text-[#1AAE39] font-semibold">Đã sao chép</span>
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
                  type="button"
                  onClick={() => setShowReportForm(true)}
                  className="text-[11px] text-black/45 hover:text-[#F64932] hover:bg-rose-50 flex items-center gap-1 transition px-2 py-1 rounded-md cursor-pointer"
                  title="Báo cáo câu trả lời sai lệch hoặc thiếu y văn tới Quản trị viên"
                >
                  <Flag className="w-3 h-3" />
                  <span>Báo lỗi câu trả lời</span>
                </button>
              ) : null}
            </div>

            {/* Form gửi Incident */}
            {showReportForm && (
              <div className="w-full mt-2.5 p-3.5 bg-[#F6F5F4] border border-black/10 rounded-lg text-left animate-in fade-in duration-150 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-black">
                    <Flag className="w-3.5 h-3.5 text-[#F64932]" />
                    <span>Gửi báo cáo sự cố (Incident Hub)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowReportForm(false)}
                    className="p-1 text-black/40 hover:text-black rounded-md transition cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {reportSuccess ? (
                  <div className="py-2 text-xs text-[#1AAE39] font-semibold flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#1AAE39]" />
                    <span>Đã ghi nhận sự cố vào Incident Hub! Bác sĩ quản trị sẽ thẩm định lại.</span>
                  </div>
                ) : (
                  <form onSubmit={handleReportSubmit} className="space-y-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-black/75 mb-1">
                        Loại vấn đề gặp phải:
                      </label>
                      <select
                        value={reportErrorType}
                        onChange={(e) => setReportErrorType(e.target.value as any)}
                        className="w-full text-xs p-2 bg-white border border-black/10 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0075DE] text-black"
                      >
                        <option value="user_reported">Thông tin chưa chuẩn xác / Cần bác sĩ thẩm định</option>
                        <option value="refusal">Mô hình từ chối trả lời vì thiếu y văn</option>
                        <option value="contraindicated_flag">Phân loại an toàn không đúng thực tế</option>
                        <option value="model_timeout">Lỗi mô hình / Format câu trả lời bị hỏng</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-black/75 mb-1">
                        Ghi chú chi tiết (tùy chọn):
                      </label>
                      <textarea
                        value={reportNote}
                        onChange={(e) => setReportNote(e.target.value)}
                        placeholder="Mô tả cụ thể thông tin sai hoặc tài liệu cần bổ sung..."
                        rows={2}
                        className="w-full text-xs p-2.5 bg-white border border-black/10 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0075DE] text-black placeholder-black/35 resize-none"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowReportForm(false)}
                        className="px-3 py-1.5 text-xs text-black/60 hover:bg-black/5 rounded-md transition cursor-pointer"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={submittingReport}
                        className="px-3.5 py-1.5 bg-[#0075DE] hover:bg-[#0062BD] text-white text-xs font-semibold rounded-md flex items-center gap-1.5 transition shadow-2xs disabled:opacity-50 cursor-pointer"
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
