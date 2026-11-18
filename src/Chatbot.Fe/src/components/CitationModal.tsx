import React, { useEffect, useState } from "react";
import type { CitationItem, DocumentDetail } from "../services/api";
import { getDocumentDetail } from "../services/api";
import { marked } from "marked";
import { 
  X, 
  Loader2, 
  ExternalLink, 
  Globe, 
  ShieldCheck, 
  CheckCircle2, 
  Target,
  FileText
} from "lucide-react";

interface Props {
  citation: CitationItem | null;
  onClose: () => void;
}

export const CitationModal: React.FC<Props> = ({ citation, onClose }) => {
  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const docId = citation?.documentId || (citation as any)?.DocumentId || "";
  const docName = citation?.documentName || (citation as any)?.DocumentName || "Tài liệu";
  const relevanceScore = citation?.relevanceScore ?? (citation as any)?.RelevanceScore ?? 0;
  const startOffset = citation?.startOffset ?? (citation as any)?.StartOffset ?? 0;
  const endOffset = citation?.endOffset ?? (citation as any)?.EndOffset ?? 0;
  const verifiedOrg = citation?.verifiedOrg || (citation as any)?.VerifiedOrg;
  const url = citation?.url || (citation as any)?.Url;
  const sourceType = citation?.sourceType || (citation as any)?.SourceType || "internal";

  const isExternal = sourceType === "external" || Boolean(url && (!docId || String(docId).startsWith("ext_")));

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

  const displayDocName = isExternal ? (citation?.documentName || "Nguồn y văn quốc tế") : formatDocumentTitle(docName);

  useEffect(() => {
    if (!citation) {
      setDoc(null);
      return;
    }

    if (isExternal) {
      setDoc(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    getDocumentDetail(docId)
      .then((data) => {
        setDoc(data);
      })
      .catch((err) => {
        setError(err.message || "Không thể tải tài liệu gốc");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [citation, isExternal, docId]);

  const scrollToHighlight = () => {
    const el = document.getElementById("citation-highlight-target");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  useEffect(() => {
    if (doc) {
      const timer = setTimeout(() => {
        scrollToHighlight();
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [doc]);

  if (!citation) return null;

  const extractSourceUrl = (text?: string): string | null => {
    if (!text) return null;
    const match = text.match(/NGUỒN TRÍCH DẪN(?: GỐC)?:\s*(https?:\/\/[^\s\r\n]+)/i);
    return match ? match[1] : null;
  };

  const sourceUrl = citation.url || (doc ? extractSourceUrl(doc.content) : null);

  // Chuẩn hóa văn bản thành CHUNG FORM (dễ nhìn, bất kể là TXT hay MD) và chèn thẻ BÔI ĐẬM
  const renderFormattedDocumentWithHighlight = (content: string) => {
    if (!content) return "";

    const raw = content.replace(/\r\n/g, "\n");
    let startIdx = startOffset;
    let endIdx = endOffset;

    // Tìm chính xác vị trí của đoạn trích dẫn (snippet) trong văn bản
    if (citation.snippet && citation.snippet.trim().length > 15) {
      const cleanSnippet = citation.snippet.trim().replace(/\r\n/g, "\n");
      const foundIdx = raw.indexOf(cleanSnippet);
      if (foundIdx !== -1) {
        startIdx = foundIdx;
        endIdx = foundIdx + cleanSnippet.length;
      } else {
        // Fallback: Tìm theo 45 ký tự đầu của snippet
        const head = cleanSnippet.slice(0, Math.min(45, cleanSnippet.length));
        const headIdx = raw.indexOf(head);
        if (headIdx !== -1) {
          startIdx = headIdx;
          endIdx = Math.min(raw.length, headIdx + cleanSnippet.length);
        }
      }
    }

    // Chèn marker vào vị trí trích dẫn
    const MARK_START = "[[[HIGHLIGHT_START]]]";
    const MARK_END = "[[[HIGHLIGHT_END]]]";

    let markedText = raw;
    if (startIdx >= 0 && endIdx > startIdx && endIdx <= raw.length) {
      markedText = raw.slice(0, startIdx) + MARK_START + raw.slice(startIdx, endIdx) + MARK_END + raw.slice(endIdx);
    }

    // Chuẩn hóa định dạng chung ("chung form" cho cả txt và md)
    // 1. Biến các dòng thông tin trường thuộc tính viết hoa thành Markdown in đậm
    markedText = markedText.replace(/^(TÊN HOẠT CHẤT|TÊN BIỆT DƯỢC PHỔ BIẾN|NHÓM THUỐC|MỨC ĐỘ AN TOÀN CHO CON BÚ|TIÊU ĐỀ|NGUỒN TRÍCH DẪN|TÁC GIẢ|NGÀY TẢI LÊN):\s*(.+)$/gim,
      "**$1:** $2\n");

    // 2. Biến các tiêu đề mục lớn viết hoa thành Heading cấp 3 Markdown
    markedText = markedText.replace(/^(TỔNG QUAN Y VĂN|DƯỢC ĐỘNG HỌC & BÀI TIẾT VÀO SỮA|DƯỢC ĐỘNG HỌC & BÀI TIẾT|TÁC DỤNG PHỤ Ở TRẺ BÚ MẸ|LƯU Ý QUAN TRỌNG KHI SỬ DỤNG|LƯU Ý QUAN TRỌNG|NGUỒN TRÍCH DẪN|NỘI DUNG|TỔNG QUAN|CHỈ ĐỊNH|CHỐNG CHỈ ĐỊNH|LIỀU DÙNG):\s*$/gim,
      "\n### $1\n");

    // 3. Render qua thư viện Markdown (marked)
    let html = marked.parse(markedText, { breaks: true }) as string;

    // 4. Thay thế marker thành thẻ <mark> bôi đậm màu vàng nổi bật kèm ID để scroll
    const highlightTag = `<mark id="citation-highlight-target" class="bg-amber-200/95 text-gray-950 font-semibold px-2 py-1 rounded-lg border-2 border-amber-400 shadow-md ring-4 ring-amber-300/40 inline-block my-1 leading-relaxed animate-pulse-subtle">`;
    html = html.replace(MARK_START, highlightTag).replace(MARK_END, "</mark>");

    return html;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2.5 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92dvh] sm:max-h-[90vh] flex flex-col overflow-hidden border border-gray-200">
        {/* Header Modal */}
        <div className={`flex items-center justify-between px-6 py-4 border-b border-gray-200 ${isExternal ? "bg-indigo-50/80" : "bg-teal-50/80"}`}>
          <div className="flex items-center space-x-3 truncate">
            <div className={`p-2.5 text-white rounded-xl shadow-xs shrink-0 ${isExternal ? "bg-indigo-600" : "bg-teal-600"}`}>
              {isExternal ? <Globe className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div className="truncate">
              <h3 className="text-base font-bold text-gray-900 flex flex-wrap items-center gap-2">
                <span className="truncate max-w-xs sm:max-w-md">{displayDocName}</span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold shrink-0 ${
                  isExternal 
                    ? "bg-indigo-100 text-indigo-800 border border-indigo-200" 
                    : "bg-teal-100 text-teal-800 border border-teal-200"
                }`}>
                  {isExternal ? "Nguồn y tế quốc tế đã kiểm chứng" : "Chuyên luận thẩm định cơ sở"}
                </span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {isExternal 
                  ? `Cơ quan kiểm chứng: ${verifiedOrg || "Tổ chức y tế chính thống"} | Mức độ tin cậy: ${(relevanceScore * 100).toFixed(0)}%`
                  : `Độ tương thích y văn: ${(relevanceScore * 100).toFixed(0)}% | Phác đồ an toàn cho phụ nữ cho con bú`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200/80 rounded-xl transition shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thanh công cụ thao tác nhanh cho tài liệu nội bộ */}
        {!isExternal && doc && (
          <div className="px-6 py-2.5 bg-amber-50/60 border-b border-amber-200/70 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-amber-900 font-medium">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0"></span>
              <span>Đoạn bôi đậm màu vàng là thông tin trực tiếp giải đáp câu hỏi của bạn</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={scrollToHighlight}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-200/80 hover:bg-amber-300 text-amber-900 font-bold rounded-lg border border-amber-300 shadow-2xs transition"
              >
                <Target className="w-3.5 h-3.5 text-amber-700" />
                <span>Cuộn đến đoạn trích dẫn</span>
              </button>

              {sourceUrl && (
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg shadow-2xs transition"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Trang web gốc</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Thân hiển thị tài liệu dạng "Chung form" chuẩn mực */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {/* NGUỒN EXTERNAL INTERNET */}
          {isExternal ? (
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
                    <CheckCircle2 className="w-6 h-6 shrink-0" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">
                      Nguồn đối soát y khoa chính thống
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Được thẩm định theo tiêu chuẩn dữ liệu dược học lâm sàng cho phụ nữ cho con bú.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
                  <div className="font-semibold text-slate-900 mb-1">Tóm tắt cơ sở dữ liệu:</div>
                  <p>{citation.snippet}</p>
                </div>

                {sourceUrl && (
                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-gray-100">
                    <div className="text-xs text-gray-500 truncate max-w-sm">
                      <span className="font-semibold">Địa chỉ tra cứu:</span> {sourceUrl}
                    </div>
                    <a
                      href={sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-sm hover:scale-102"
                    >
                      <Globe className="w-4 h-4" />
                      <span>Truy cập trang web gốc kiểm chứng</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>

              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 leading-relaxed flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Quy chuẩn kiểm chứng:</strong> Các nguồn nghiên cứu mở rộng chỉ công nhận các cơ sở dữ liệu y tế quốc tế có bình duyệt (Peer-reviewed) như LactMed (Viện Y tế Quốc gia Hoa Kỳ NIH/NLM), e-lactancia (APILAM), và Dược thư Quốc gia.
                </span>
              </div>
            </div>
          ) : (
            /* TÀI LIỆU NỘI BỘ (CHUNG FORM CHO CẢ TXT VÀ MD) */
            <>
              {loading && (
                <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                  <p className="text-sm font-medium">Đang tải và định dạng toàn văn tài liệu y khoa...</p>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200">
                  {error}
                </div>
              )}

              {!loading && !error && doc && (
                <div className="bg-white p-7 rounded-2xl border border-gray-200 shadow-xs space-y-4">
                  <div className="pb-3 border-b border-gray-100 flex items-center justify-between text-xs text-teal-800">
                    <span className="font-semibold">Hồ sơ chuyên luận lâm sàng chuẩn y tế</span>
                    <span className="text-gray-400 font-medium">Đối soát chuẩn Dược thư & LactMed®</span>
                  </div>

                  {/* VĂN BẢN ĐÃ ĐƯỢC CHUYỂN THÀNH CHUNG FORM ĐẸP MẮT VÀ BÔI ĐẬM CĂN CỨ */}
                  <div
                    className="prose prose-sm max-w-none text-gray-800 leading-relaxed [&_h3]:text-teal-900 [&_h3]:font-bold [&_h3]:text-base [&_h3]:border-b [&_h3]:border-teal-100/80 [&_h3]:pb-1.5 [&_h3]:mt-6 [&_h3]:mb-3 [&_p]:my-2 [&_p]:leading-relaxed [&_ul]:my-2 [&_li]:my-1 [&_strong]:text-gray-900"
                    dangerouslySetInnerHTML={{
                      __html: renderFormattedDocumentWithHighlight(doc.content)
                    }}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="text-xs text-gray-500 truncate max-w-md">
            {sourceUrl ? (
              <span className="truncate">Nguồn trích dẫn: {sourceUrl}</span>
            ) : (
              <span>Chuyên luận y khoa lâm sàng đã được thẩm định an toàn</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold rounded-xl transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
