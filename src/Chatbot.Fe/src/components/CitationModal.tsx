import React, { useEffect, useState, useRef } from "react";
import type { CitationItem, DocumentDetail } from "../services/api";
import { getDocumentDetail } from "../services/api";
import { X, BookOpen, Loader2, ExternalLink, Globe, ShieldCheck, CheckCircle2 } from "lucide-react";

interface Props {
  citation: CitationItem | null;
  onClose: () => void;
}

export const CitationModal: React.FC<Props> = ({ citation, onClose }) => {
  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const highlightRef = useRef<HTMLElement>(null);

  const docId = citation?.documentId || (citation as any)?.DocumentId || "";
  const docName = citation?.documentName || (citation as any)?.DocumentName || "Tài liệu";
  const relevanceScore = citation?.relevanceScore ?? (citation as any)?.RelevanceScore ?? 0;
  const startOffset = citation?.startOffset ?? (citation as any)?.StartOffset ?? 0;
  const endOffset = citation?.endOffset ?? (citation as any)?.EndOffset ?? 0;
  const verifiedOrg = citation?.verifiedOrg || (citation as any)?.VerifiedOrg;
  const url = citation?.url || (citation as any)?.Url;
  const sourceType = citation?.sourceType || (citation as any)?.SourceType || "internal";

  const isExternal = sourceType === "external" || Boolean(url && (!docId || String(docId).startsWith("ext_")));

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

  useEffect(() => {
    if (doc && highlightRef.current) {
      setTimeout(() => {
        highlightRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 150);
    }
  }, [doc]);

  if (!citation) return null;

  const extractSourceUrl = (text?: string): string | null => {
    if (!text) return null;
    const match = text.match(/NGUỒN TRÍCH DẪN(?: GỐC)?:\s*(https?:\/\/[^\s\r\n]+)/i);
    return match ? match[1] : null;
  };

  const sourceUrl = citation.url || (doc ? extractSourceUrl(doc.content) : null);

  const renderContentWithHighlight = (content: string, start: number, end: number) => {
    if (!content || start < 0 || end > content.length || start >= end) {
      return <span>{content}</span>;
    }

    const before = content.slice(0, start);
    const highlighted = content.slice(start, end);
    const after = content.slice(end);

    return (
      <div className="whitespace-pre-wrap font-sans text-gray-800 text-sm leading-relaxed">
        <span>{before}</span>
        <mark
          ref={highlightRef}
          className="bg-yellow-200 text-gray-900 font-bold px-1 py-0.5 rounded border border-yellow-400 shadow-sm transition-all"
        >
          {highlighted}
        </mark>
        <span>{after}</span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden border border-gray-100">
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b border-gray-200 ${isExternal ? "bg-indigo-50" : "bg-teal-50"}`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2 text-white rounded-xl shadow-xs ${isExternal ? "bg-indigo-600" : "bg-teal-600"}`}>
              {isExternal ? <Globe className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span>{docName}</span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                  isExternal 
                    ? "bg-indigo-100 text-indigo-800 border border-indigo-200" 
                    : "bg-teal-100 text-teal-800 border border-teal-200"
                }`}>
                  {isExternal ? "Nguồn y tế quốc tế đã kiểm chứng" : "Trích dẫn tài liệu nội bộ"}
                </span>
              </h3>
              <p className="text-xs text-gray-500">
                {isExternal 
                  ? `Cơ quan kiểm chứng: ${verifiedOrg || "Tổ chức y tế chính thống"} | Độ tin cậy: ${(relevanceScore * 100).toFixed(0)}%`
                  : `Vị trí ký tự: ${startOffset} - ${endOffset} | Độ khớp: ${(relevanceScore * 100).toFixed(1)}%`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nội dung xem chi tiết */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
          {/* TRƯỜNG HỢP NGUỒN NGOÀI INTERNET (EXTERNAL VERIFIED SOURCE) */}
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
            /* TRƯỜNG HỢP NGUỒN TÀI LIỆU NỘI BỘ (INTERNAL DOCUMENT HIGHLIGHT) */
            <>
              {loading && (
                <div className="flex flex-col items-center justify-center py-16 text-gray-500 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                  <p className="text-sm">Đang tải và định vị đoạn trích dẫn y khoa...</p>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200">
                  {error}
                </div>
              )}

              {!loading && !error && doc && (
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs space-y-4">
                  <div className="pb-3 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs text-gray-400 font-mono">
                      Mã tài liệu: {doc.id}
                    </span>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 font-medium">
                        Đoạn bôi đậm màu vàng bên dưới là căn cứ trả lời của Bot
                      </span>

                      {sourceUrl && (
                        <a
                          href={sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-md transition shadow-2xs shrink-0"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          <span>Trang web gốc</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  {renderContentWithHighlight(doc.content, startOffset, endOffset)}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {sourceUrl ? (
              <span className="truncate max-w-md inline-block">Nguồn: {sourceUrl}</span>
            ) : (
              <span>Tài liệu nội bộ đã kiểm duyệt</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-semibold rounded-xl transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
