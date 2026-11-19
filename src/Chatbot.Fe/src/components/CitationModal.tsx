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

  // Chuẩn hóa văn bản thành CHUNG FORM và chèn thẻ BÔI ĐẬM
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

    // Chuẩn hóa định dạng chung
    markedText = markedText.replace(/^(TÊN HOẠT CHẤT|TÊN BIỆT DƯỢC PHỔ BIẾN|NHÓM THUỐC|MỨC ĐỘ AN TOÀN CHO CON BÚ|TIÊU ĐỀ|NGUỒN TRÍCH DẪN|TÁC GIẢ|NGÀY TẢI LÊN):\s*(.+)$/gim,
      "**$1:** $2\n");

    markedText = markedText.replace(/^(TỔNG QUAN Y VĂN|DƯỢC ĐỘNG HỌC & BÀI TIẾT VÀO SỮA|DƯỢC ĐỘNG HỌC & BÀI TIẾT|TÁC DỤNG PHỤ Ở TRẺ BÚ MẸ|LƯU Ý QUAN TRỌNG KHI SỬ DỤNG|LƯU Ý QUAN TRỌNG|NGUỒN TRÍCH DẪN|NỘI DUNG|TỔNG QUAN|CHỈ ĐỊNH|CHỐNG CHỈ ĐỊNH|LIỀU DÙNG):\s*$/gim,
      "\n### $1\n");

    let html = marked.parse(markedText, { breaks: true }) as string;

    const highlightTag = `<mark id="citation-highlight-target">`;
    html = html.replace(MARK_START, highlightTag).replace(MARK_END, "</mark>");

    return html;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-2.5 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-notion-float w-full max-w-4xl max-h-[90dvh] sm:max-h-[88vh] flex flex-col overflow-hidden border border-black/10">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-black/8 bg-white">
          <div className="flex items-center space-x-3 truncate">
            <div className={`p-2 rounded-lg shrink-0 ${isExternal ? "bg-[#E6F3FE] text-[#0075DE]" : "bg-[#D0F4D8] text-[#1AAE39]"}`}>
              {isExternal ? <Globe className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div className="truncate">
              <h3 className="text-sm sm:text-base font-semibold text-black flex flex-wrap items-center gap-2">
                <span className="truncate max-w-xs sm:max-w-md">{displayDocName}</span>
                <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold shrink-0 border ${
                  isExternal 
                    ? "bg-[#E6F3FE] text-[#005BAB] border-[#0075DE]/20" 
                    : "bg-[#D0F4D8]/60 text-[#1AAE39] border-[#1AAE39]/20"
                }`}>
                  {isExternal ? "Nguồn y tế quốc tế đã kiểm chứng" : "Chuyên luận thẩm định cơ sở"}
                </span>
              </h3>
              <p className="text-xs text-black/50 mt-0.5 font-medium">
                {isExternal 
                  ? `Cơ quan kiểm chứng: ${verifiedOrg || "Tổ chức y tế chính thống"} | Mức độ tin cậy: ${(relevanceScore * 100).toFixed(0)}%`
                  : `Độ tương thích y văn: ${(relevanceScore * 100).toFixed(0)}% | Phác đồ an toàn cho phụ nữ cho con bú`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-black/40 hover:text-black hover:bg-black/5 rounded-md transition shrink-0 ml-2 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thanh công cụ thao tác nhanh cho tài liệu nội bộ */}
        {!isExternal && doc && (
          <div className="px-6 py-2 bg-[#FFFDF5] border-b border-[#FFB110]/20 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-[#78350F] font-medium">
              <span className="inline-block w-2 h-2 rounded-full bg-[#FFB110] animate-pulse shrink-0"></span>
              <span>Đoạn bôi đậm màu hổ phách là thông tin căn cứ giải đáp câu hỏi của bạn</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={scrollToHighlight}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FEF3C7] hover:bg-[#FDE68A] text-[#78350F] font-semibold rounded-md border border-[#FFB110]/30 shadow-2xs transition cursor-pointer"
              >
                <Target className="w-3.5 h-3.5 text-[#B45309]" />
                <span>Cuộn đến đoạn trích dẫn</span>
              </button>

              {sourceUrl && (
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#0075DE] hover:bg-[#0062BD] text-white font-semibold rounded-md shadow-2xs transition no-underline"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Trang web gốc</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Thân hiển thị tài liệu dạng Serif chuẩn Notion Editorial */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-[#F6F5F4]/40">
          {/* NGUỒN EXTERNAL INTERNET */}
          {isExternal ? (
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-xl border border-black/8 shadow-2xs space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-[#D0F4D8] text-[#1AAE39] rounded-lg">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-black">
                      Nguồn đối soát y khoa chính thống
                    </h4>
                    <p className="text-xs text-black/50 mt-0.5">
                      Được thẩm định theo tiêu chuẩn dữ liệu dược học lâm sàng cho phụ nữ cho con bú.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-[#F6F5F4] rounded-lg border border-black/8 text-xs text-black/80 font-serif leading-relaxed">
                  <div className="font-sans font-semibold text-black mb-1">Tóm tắt cơ sở dữ liệu:</div>
                  <p>{citation.snippet}</p>
                </div>

                {sourceUrl && (
                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-black/8">
                    <div className="text-xs text-black/50 truncate max-w-sm">
                      <span className="font-semibold text-black">Địa chỉ tra cứu:</span> {sourceUrl}
                    </div>
                    <a
                      href={sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#0075DE] hover:bg-[#0062BD] text-white text-xs font-semibold rounded-lg transition shadow-2xs no-underline"
                    >
                      <Globe className="w-4 h-4" />
                      <span>Truy cập trang web gốc kiểm chứng</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>

              <div className="p-3.5 bg-[#FFFDF5] rounded-lg border border-[#FFB110]/30 text-xs text-[#78350F] leading-relaxed flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#FFB110] shrink-0 mt-0.5" />
                <span>
                  <strong>Quy chuẩn kiểm chứng:</strong> Các nguồn nghiên cứu mở rộng chỉ công nhận các cơ sở dữ liệu y tế quốc tế có bình duyệt (Peer-reviewed) như LactMed (Viện Y tế Quốc gia Hoa Kỳ NIH/NLM), e-lactancia (APILAM), và Dược thư Quốc gia.
                </span>
              </div>
            </div>
          ) : (
            /* TÀI LIỆU NỘI BỘ (CHUNG FORM CHO CẢ TXT VÀ MD) */
            <>
              {loading && (
                <div className="flex flex-col items-center justify-center py-20 text-black/40 gap-3">
                  <Loader2 className="w-7 h-7 animate-spin text-[#0075DE]" />
                  <p className="text-xs font-medium">Đang tải và định dạng toàn văn tài liệu y khoa...</p>
                </div>
              )}

              {error && (
                <div className="p-4 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-200">
                  {error}
                </div>
              )}

              {!loading && !error && doc && (
                <div className="bg-white p-6 sm:p-8 rounded-xl border border-black/8 shadow-2xs space-y-4">
                  <div className="pb-3 border-b border-black/8 flex items-center justify-between text-xs text-[#0075DE]">
                    <span className="font-semibold">Hồ sơ chuyên luận lâm sàng chuẩn y tế</span>
                    <span className="text-black/40 font-mono text-[11px]">Đối soát chuẩn Dược thư & LactMed®</span>
                  </div>

                  {/* VĂN BẢN ĐÃ ĐƯỢC CHUYỂN THÀNH CHUNG FORM ĐẸP MẮT VÀ BÔI ĐẬM CĂN CỨ */}
                  <div
                    className="medical-prose font-serif text-[14.5px] leading-[1.7] text-black/85 max-w-none"
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
        <div className="px-6 py-3 border-t border-black/8 bg-white flex items-center justify-between">
          <div className="text-xs text-black/50 truncate max-w-md font-medium">
            {sourceUrl ? (
              <span className="truncate">Nguồn trích dẫn: {sourceUrl}</span>
            ) : (
              <span>Chuyên luận y khoa lâm sàng đã được thẩm định an toàn</span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-[#F6F5F4] hover:bg-black/5 border border-black/10 text-black text-xs font-semibold rounded-lg transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
