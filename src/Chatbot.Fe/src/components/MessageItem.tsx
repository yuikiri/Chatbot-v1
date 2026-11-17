import React from "react";
import type { ChatMessage, CitationItem } from "../services/api";
import { marked } from "marked";
import { 
  ShieldAlert, 
  ShieldCheck, 
  Shield, 
  BookOpen, 
  Scale, 
  Sparkles, 
  AlertTriangle 
} from "lucide-react";

interface Props {
  message: ChatMessage;
  onOpenCitation: (citation: CitationItem) => void;
}

export const MessageItem: React.FC<Props> = ({ message, onOpenCitation }) => {
  const isUser = message.role === "user";

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

  const renderModeBadge = () => {
    if (isUser || !message.mode) return null;

    if (message.mode === "strict") {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
          <ShieldCheck className="w-3 h-3 text-teal-600" />
          <span>Nghiêm ngặt (Tài liệu nội bộ)</span>
        </span>
      );
    }
    if (message.mode === "balanced") {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
          <Scale className="w-3 h-3 text-blue-600" />
          <span>Cân bằng (Tài liệu + Bổ trợ)</span>
        </span>
      );
    }
    if (message.mode === "flexible") {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200">
          <Sparkles className="w-3 h-3 text-indigo-600" />
          <span>Mở rộng (Nghiên cứu y văn)</span>
        </span>
      );
    }
    return null;
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
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>TƯƠNG THÍCH (AN TOÀN KHI CHO CON BÚ)</span>
        </div>
      );
    }
    if (level === "Caution") {
      return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
          <Shield className="w-3.5 h-3.5" />
          <span>THẬN TRỌNG (CẦN THEO DÕI BIỂU HIỆN CỦA TRẺ)</span>
        </div>
      );
    }
    if (level === "Contraindicated") {
      return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300 shadow-2xs">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>CHỐNG CHỈ ĐỊNH (NGUY CƠ CAO HOẶC LÀM MẤT SỮA)</span>
        </div>
      );
    }

    return null;
  };

  // Tách nội dung chính và nội dung Cảnh báo y tế (Disclaimer)
  const extractDisclaimer = (rawContent: string) => {
    if (!rawContent) return { mainText: "", disclaimerText: null };

    if (rawContent.includes(":::MEDICAL_DISCLAIMER:::")) {
      const parts = rawContent.split(":::MEDICAL_DISCLAIMER::: ");
      if (parts.length === 1) {
        const parts2 = rawContent.split(":::MEDICAL_DISCLAIMER:::");
        return { mainText: parts2[0].trim(), disclaimerText: parts2[1]?.trim() || null };
      }
      return { mainText: parts[0].trim(), disclaimerText: parts[1]?.trim() || null };
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

  // Chỉ hiển thị thanh trích dẫn khi THỰC SỰ có tài liệu nội bộ trong kho khớp với câu trả lời
  const internalCitations = (message.citations || []).filter((c) => {
    const docId = c.documentId || (c as any).DocumentId;
    return docId && !String(docId).startsWith("ext_");
  });

  const showCitations = !isUser && !isRefusal && internalCitations.length > 0;

  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-4 ${
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

        {/* Nội dung Markdown chính có style riêng cho 4 phần và Hộp lưu ý Callout */}
        <div
          className={`prose prose-sm max-w-none leading-relaxed ${
            isUser ? "prose-invert text-white" : "text-gray-800"
          } [&_h3]:text-teal-950 [&_h3]:font-bold [&_h3]:text-sm [&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:pb-1.5 [&_h3]:border-b [&_h3]:border-teal-100/70 [&_blockquote]:bg-amber-50/85 [&_blockquote]:border-l-4 [&_blockquote]:border-amber-400 [&_blockquote]:px-4 [&_blockquote]:py-3 [&_blockquote]:rounded-r-xl [&_blockquote]:my-3.5 [&_blockquote]:not-italic [&_blockquote]:text-amber-950 [&_blockquote_p]:m-0 [&_blockquote_p]:leading-relaxed [&_ul]:my-2 [&_li]:my-0.5 [&_a]:text-teal-700 [&_a]:underline [&_a]:font-semibold hover:[&_a]:text-teal-900`}
          dangerouslySetInnerHTML={{ __html: parsedHtml }}
        />

        {/* Căn cứ trích dẫn: Chỉ hiển thị khi THỰC SỰ có tài liệu nội bộ trong kho */}
        {showCitations && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-teal-600" />
              <span>Căn cứ tài liệu nội bộ đã kiểm duyệt:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {internalCitations.map((c) => {
                const docName = c.documentName || (c as any).DocumentName || "Tài liệu";
                const score = c.relevanceScore ?? (c as any).RelevanceScore ?? 0;
                const srcType = c.sourceType || (c as any).SourceType || "internal";
                const url = c.url || (c as any).Url;
                const docId = c.documentId || (c as any).DocumentId;
                const citeKey = c.citationId || (c as any).CitationId || docName;

                return (
                  <button
                    key={citeKey}
                    onClick={() => onOpenCitation({
                      ...c,
                      documentId: docId,
                      documentName: docName,
                      relevanceScore: score,
                      sourceType: srcType,
                      url: url,
                      startOffset: c.startOffset ?? (c as any).StartOffset ?? 0,
                      endOffset: c.endOffset ?? (c as any).EndOffset ?? 0,
                      snippet: c.snippet || (c as any).Snippet || ""
                    })}
                    className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 font-medium rounded-lg border bg-teal-50 hover:bg-teal-100 text-teal-900 border-teal-200 transition shadow-2xs hover:scale-102 cursor-pointer"
                    title="Nhấp để mở tài liệu nội bộ và bôi đậm vị trí căn cứ này"
                  >
                    <BookOpen className="w-3 h-3 text-teal-600 shrink-0" />
                    <span className="font-bold">[{docName}]</span>
                    <span className="text-[10px] text-teal-600 opacity-80">
                      ({(score * 100).toFixed(0)}%)
                    </span>
                  </button>
                );
              })}
            </div>
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
      </div>
    </div>
  );
};
