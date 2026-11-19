import React, { useState, useEffect } from "react";
import { 
  type DocumentInfo, 
  getDocuments, 
  adminUploadDocument, 
  adminDeleteDocument,
  adminCrawlDocument,
  verifyAdminKey
} from "../services/api";
import { 
  X, 
  ShieldCheck, 
  Upload, 
  Trash2, 
  FileText, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Lock, 
  Unlock, 
  KeyRound, 
  Globe, 
  Sparkles,
  RefreshCw
} from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [adminKey, setAdminKey] = useState(sessionStorage.getItem("chatbot_admin_key") || "");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"crawl" | "upload">("crawl");

  // File Upload State
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Web Crawler State
  const [crawlUrl, setCrawlUrl] = useState("");
  const [crawling, setCrawling] = useState(false);

  // Status Message
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const savedKey = sessionStorage.getItem("chatbot_admin_key");
      if (savedKey) {
        verifyAndUnlock(savedKey);
      } else {
        setIsUnlocked(false);
      }
    } else {
      setMessage(null);
    }
  }, [isOpen]);

  const verifyAndUnlock = async (keyToVerify: string) => {
    if (!keyToVerify.trim()) {
      setMessage({ text: "Vui lòng nhập mật khẩu Quản trị viên (ADMIN_SECRET_KEY).", type: "error" });
      return;
    }

    setVerifying(true);
    setMessage(null);

    try {
      const ok = await verifyAdminKey(keyToVerify.trim());
      if (ok) {
        setIsUnlocked(true);
        sessionStorage.setItem("chatbot_admin_key", keyToVerify.trim());
        setAdminKey(keyToVerify.trim());
        await loadDocs();
      } else {
        setIsUnlocked(false);
        sessionStorage.removeItem("chatbot_admin_key");
        setMessage({ text: "Mật khẩu Admin không chính xác. Vui lòng kiểm tra lại ADMIN_SECRET_KEY trong file .env!", type: "error" });
      }
    } catch {
      setIsUnlocked(false);
      setMessage({ text: "Lỗi kết nối tới máy chủ khi xác thực Admin.", type: "error" });
    } finally {
      setVerifying(false);
    }
  };

  const loadDocs = async () => {
    setLoading(true);
    try {
      const list = await getDocuments();
      setDocuments(list);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyAndUnlock(adminKey);
  };

  const handleLockAgain = () => {
    setIsUnlocked(false);
    sessionStorage.removeItem("chatbot_admin_key");
    setAdminKey("");
    setMessage({ text: "Đã khóa bảng quản trị an toàn.", type: "success" });
  };

  // Cào dữ liệu từ URL Web
  const handleCrawlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = crawlUrl.trim();
    if (!url) {
      setMessage({ text: "Vui lòng nhập đường dẫn URL y tế.", type: "error" });
      return;
    }

    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      setMessage({ text: "Đường dẫn URL phải bắt đầu bằng http:// hoặc https://", type: "error" });
      return;
    }

    setCrawling(true);
    setMessage(null);

    try {
      const res = await adminCrawlDocument(url, adminKey.trim());
      setMessage({ text: res.message || "Cào dữ liệu và tạo vector thành công!", type: "success" });
      setCrawlUrl("");
      await loadDocs();
    } catch (err: any) {
      setMessage({ text: err.message || "Cào dữ liệu từ URL thất bại.", type: "error" });
      if (err.message?.includes("không chính xác")) {
        setIsUnlocked(false);
      }
    } finally {
      setCrawling(false);
    }
  };

  // Tải lên file có sẵn
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setMessage({ text: "Vui lòng chọn 1 tệp tài liệu y khoa (.txt, .md, .pdf).", type: "error" });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      await adminUploadDocument(selectedFile, adminKey.trim());
      setMessage({ text: `Đã nạp và tạo vector thành công cho tệp "${selectedFile.name}"!`, type: "success" });
      setSelectedFile(null);
      const input = document.getElementById("admin-file-input") as HTMLInputElement;
      if (input) input.value = "";
      await loadDocs();
    } catch (err: any) {
      setMessage({ text: err.message || "Tải lên thất bại.", type: "error" });
      if (err.message?.includes("không chính xác")) {
        setIsUnlocked(false);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId: string, docName: string) => {
    if (!confirm(`Bạn có chắc muốn xóa tài liệu y văn "${docName}" khỏi hệ thống?`)) {
      return;
    }

    try {
      await adminDeleteDocument(docId, adminKey.trim());
      setMessage({ text: `Đã xóa tài liệu "${docName}".`, type: "success" });
      await loadDocs();
    } catch (err: any) {
      setMessage({ text: err.message || "Xóa thất bại.", type: "error" });
      if (err.message?.includes("không chính xác")) {
        setIsUnlocked(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-notion-float w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-black/10">
        {/* Header Modal chuẩn Notion */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/8 bg-white">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${isUnlocked ? "bg-[#D0F4D8] text-[#1AAE39]" : "bg-[#FEF3C7] text-[#D97706]"}`}>
              {isUnlocked ? <ShieldCheck className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-black flex items-center gap-2">
                <span>Cổng Quản Trị Y Văn (Admin Ingestion)</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                  isUnlocked 
                    ? "bg-[#D0F4D8]/80 text-[#1AAE39] border-[#1AAE39]/30" 
                    : "bg-[#FEF3C7]/80 text-[#D97706] border-[#FFB110]/30"
                }`}>
                  {isUnlocked ? "ĐÃ MỞ KHÓA" : "ĐANG KHÓA"}
                </span>
              </h3>
              <p className="text-xs text-black/50 mt-0.5 font-medium">Công cụ nạp và quản lý y văn lâm sàng chuẩn hóa</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 text-black/40 hover:text-black hover:bg-black/5 rounded-md transition cursor-pointer"
            title="Đóng hộp thoại"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
          {/* Thông báo Message */}
          {message && (
            <div className={`p-3.5 rounded-lg flex items-center gap-3 text-xs sm:text-sm border animate-in fade-in ${
              message.type === "success" 
                ? "bg-[#D0F4D8]/60 text-[#15803D] border-[#1AAE39]/30" 
                : "bg-[#FFE4E6]/80 text-[#F64932] border-[#F64932]/30"
            }`}>
              {message.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0 text-[#1AAE39]" /> : <AlertCircle className="w-4 h-4 shrink-0 text-[#F64932]" />}
              <span className="font-semibold leading-relaxed">{message.text}</span>
            </div>
          )}

          {/* NẾU CHƯA MỞ KHÓA: HIỂN THỊ MÀN HÌNH KHÓA */}
          {!isUnlocked ? (
            <div className="py-12 px-6 max-w-md mx-auto text-center space-y-4">
              <div className="w-14 h-14 bg-[#F6F5F4] text-[#0075DE] rounded-xl flex items-center justify-center mx-auto mb-2 border border-black/8 shadow-2xs">
                <KeyRound className="w-7 h-7 text-[#0075DE]" />
              </div>
              <h4 className="text-base font-semibold text-black">Yêu cầu xác thực Quản trị viên</h4>
              <p className="text-xs text-black/55 leading-relaxed">
                Để bảo vệ tính toàn vẹn của tri thức y tế, bạn cần nhập đúng mật khẩu Quản trị viên (<code>ADMIN_SECRET_KEY</code>) trước khi truy cập tính năng nạp và xóa tài liệu.
              </p>

              <form onSubmit={handleUnlockSubmit} className="space-y-3 pt-2 text-left">
                <div>
                  <label className="block text-xs font-semibold text-black/75 mb-1.5">
                    Mật khẩu Admin:
                  </label>
                  <input
                    type="password"
                    placeholder="Nhập ADMIN_SECRET_KEY..."
                    value={adminKey}
                    onChange={(e) => setAdminKey(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-black/16 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0075DE]/20 focus:border-[#0075DE] shadow-2xs text-black placeholder-black/35"
                    autoFocus
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={verifying || !adminKey.trim()}
                  className="w-full py-2.5 px-4 bg-[#0075DE] hover:bg-[#0062BD] active:bg-[#005BAB] disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
                >
                  {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlock className="w-4 h-4" />}
                  {verifying ? "Đang xác thực..." : "Xác thực & Mở khóa"}
                </button>
              </form>
            </div>
          ) : (
            /* NẾU ĐÃ MỞ KHÓA: HIỂN THỊ ĐẦY ĐỦ BẢNG ĐIỀU KHIỂN ADMIN */
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Thanh trạng thái Admin */}
              <div className="flex items-center justify-between bg-[#E6F3FE] p-3.5 rounded-lg border border-[#0075DE]/20">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#005BAB]">
                  <ShieldCheck className="w-4 h-4 text-[#0075DE]" />
                  <span>Phiên làm việc Admin đang hoạt động.</span>
                </div>
                <button
                  type="button"
                  onClick={handleLockAgain}
                  className="px-3 py-1 bg-white hover:bg-[#F6F5F4] text-black/80 border border-black/10 text-xs font-semibold rounded-md transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Lock className="w-3 h-3 text-black/60" />
                  <span>Khóa lại</span>
                </button>
              </div>

              {/* TABS CHUYỂN ĐỔI: CÀO WEB vs UPLOAD TỆP */}
              <div className="flex border-b border-black/8 gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("crawl")}
                  className={`pb-2.5 px-3.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition cursor-pointer ${
                    activeTab === "crawl"
                      ? "border-[#0075DE] text-[#0075DE]"
                      : "border-transparent text-black/55 hover:text-black"
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  <span>Cào Dữ Liệu Từ Link Web (URL)</span>
                  <span className="text-[10px] bg-[#E6F3FE] text-[#005BAB] px-1.5 py-0.2 rounded-full font-semibold border border-[#0075DE]/20">Mới</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("upload")}
                  className={`pb-2.5 px-3.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition cursor-pointer ${
                    activeTab === "upload"
                      ? "border-[#0075DE] text-[#0075DE]"
                      : "border-transparent text-black/55 hover:text-black"
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  <span>Tải Lên Tệp Có Sẵn (.txt, .md, .pdf)</span>
                </button>
              </div>

              {/* TAB 1: TOOL CÀO DỮ LIỆU TỪ URL */}
              {activeTab === "crawl" && (
                <form onSubmit={handleCrawlSubmit} className="bg-white p-5 rounded-xl border border-black/10 shadow-2xs space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-black flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#0075DE]" />
                      Công cụ cào dữ liệu y văn tự động (Web Ingestion)
                    </h4>
                    <p className="text-xs text-black/55 mt-1 leading-relaxed">
                      Dán đường link bài viết y tế (từ LactMed, Dược thư, hoặc các trang nghiên cứu dược lâm sàng uy tín). Hệ thống sẽ tự động bóc tách bài viết, loại bỏ quảng cáo, lưu file văn bản kèm đường dẫn nguồn và tạo vector embeddings.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="relative">
                      <Globe className="w-4 h-4 text-black/35 absolute left-3.5 top-3" />
                      <input
                        type="url"
                        placeholder="Dán link web y tế tại đây (ví dụ: https://www.ncbi.nlm.nih.gov/books/NBK501922/)..."
                        value={crawlUrl}
                        onChange={(e) => setCrawlUrl(e.target.value)}
                        disabled={crawling}
                        className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-white border border-black/14 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0075DE]/20 focus:border-[#0075DE] text-black placeholder-black/35"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={crawling || !crawlUrl.trim()}
                      className="w-full sm:w-auto px-5 py-2 bg-[#0075DE] hover:bg-[#0062BD] active:bg-[#005BAB] disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
                    >
                      {crawling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                      {crawling ? "Đang tải trang, lọc bài viết & tạo Vector..." : "Cào dữ liệu & Nạp Vector"}
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 2: TẢI LÊN TỆP TỪ MÁY */}
              {activeTab === "upload" && (
                <form onSubmit={handleUpload} className="bg-white p-5 rounded-xl border border-dashed border-black/16 shadow-2xs">
                  <h4 className="text-sm font-semibold text-black mb-1.5 flex items-center gap-2">
                    <Upload className="w-4 h-4 text-[#0075DE]" />
                    Nạp tệp tài liệu thuốc mới (.txt, .md, .pdf)
                  </h4>
                  <p className="text-xs text-black/55 mb-4 leading-relaxed">
                    Chọn tệp y khoa có sẵn trên máy tính. Hệ thống sẽ bóc tách văn bản, chia đoạn và đánh chỉ mục vector.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <input
                      id="admin-file-input"
                      type="file"
                      accept=".txt,.md,.pdf"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="w-full text-xs text-black/60 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#F6F5F4] file:text-black hover:file:bg-black/8 cursor-pointer"
                    />
                    <button
                      type="submit"
                      disabled={uploading || !selectedFile}
                      className="w-full sm:w-auto px-5 py-2 bg-[#0075DE] hover:bg-[#0062BD] active:bg-[#005BAB] disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition flex items-center justify-center gap-2 shrink-0 shadow-2xs cursor-pointer"
                    >
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      {uploading ? "Đang xử lý & tạo Vector..." : "Nạp tài liệu"}
                    </button>
                  </div>
                </form>
              )}

              {/* Danh sách tài liệu hiện có trong kho */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs sm:text-sm font-semibold text-black flex items-center gap-2">
                    <FileText className="w-4 h-4 text-black/60" />
                    <span>Kho tài liệu y khoa hiện có ({documents.length} tài liệu)</span>
                  </h4>
                  <button 
                    onClick={loadDocs} 
                    className="text-xs text-[#0075DE] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Làm mới danh sách</span>
                  </button>
                </div>

                {loading ? (
                  <div className="py-10 text-center text-black/40 text-xs flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#0075DE]" />
                    <span>Đang tải danh sách tài liệu...</span>
                  </div>
                ) : documents.length === 0 ? (
                  <div className="py-8 text-center text-black/50 text-xs bg-[#F6F5F4] rounded-lg border border-black/8">
                    Chưa có tài liệu nào trong kho y văn. Hãy dán link cào web hoặc nạp tài liệu đầu tiên ở trên!
                  </div>
                ) : (
                  <div className="border border-black/8 rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F6F5F4] text-black/55 uppercase font-semibold text-[11px] tracking-[0.04em] border-b border-black/8">
                        <tr>
                          <th className="px-4 py-2.5">Tên tài liệu</th>
                          <th className="px-4 py-2.5">Kích thước</th>
                          <th className="px-4 py-2.5">Số đoạn Vector</th>
                          <th className="px-4 py-2.5">Ngày nạp</th>
                          <th className="px-4 py-2.5 text-right">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/6 bg-white">
                        {documents.map((d) => {
                          const isWebDoc = d.fileName.startsWith("web_");

                          return (
                            <tr key={d.id} className="hover:bg-[#F6F5F4]/60 transition">
                              <td className="px-4 py-2.5 font-medium text-black flex items-center gap-2">
                                {isWebDoc ? (
                                  <span title="Tài liệu cào từ Web">
                                    <Globe className="w-3.5 h-3.5 text-[#0075DE] shrink-0" />
                                  </span>
                                ) : (
                                  <FileText className="w-3.5 h-3.5 text-[#1AAE39] shrink-0" />
                                )}
                                <span className="truncate max-w-xs">{d.fileName}</span>
                              </td>
                              <td className="px-4 py-2.5 text-black/60 font-mono">
                                {(d.fileSizeBytes / 1024).toFixed(1)} KB
                              </td>
                              <td className="px-4 py-2.5 text-black font-semibold font-mono">
                                {d.chunkCount} chunks
                              </td>
                              <td className="px-4 py-2.5 text-black/60">
                                {new Date(d.uploadedAtUtc).toLocaleDateString("vi-VN")}
                              </td>
                              <td className="px-4 py-2.5 text-right">
                                <button
                                  onClick={() => handleDelete(d.id, d.fileName)}
                                  className="p-1.5 text-black/40 hover:text-[#F64932] hover:bg-rose-50 rounded-md transition cursor-pointer"
                                  title="Xóa tài liệu khỏi hệ thống"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-black/8 bg-white flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#F6F5F4] hover:bg-black/5 text-black border border-black/10 text-xs font-semibold rounded-lg transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
