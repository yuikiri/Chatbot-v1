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
  Sparkles
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
      setMessage({ text: "Vui lòng nhập mật khẩu Admin.", type: "error" });
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
    setMessage({ text: "Đã khóa bảng quản trị.", type: "success" });
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-slate-900 text-white">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-xl ${isUnlocked ? "bg-teal-600" : "bg-amber-600"}`}>
              {isUnlocked ? <ShieldCheck className="w-5 h-5 text-white" /> : <Lock className="w-5 h-5 text-white" />}
            </div>
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                Cổng Quản Trị Y Văn (Admin Ingestion)
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isUnlocked ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                }`}>
                  {isUnlocked ? "ĐÃ MỞ KHÓA" : "ĐANG KHÓA"}
                </span>
              </h3>
              <p className="text-xs text-slate-400">Công cụ độc quyền dành cho Quản trị viên nạp và quản lý y văn</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Thông báo Message */}
          {message && (
            <div className={`p-4 rounded-xl flex items-center gap-3 text-xs sm:text-sm border animate-in fade-in ${
              message.type === "success" 
                ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                : "bg-red-50 text-red-800 border-red-200"
            }`}>
              {message.type === "success" ? <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" /> : <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />}
              <span className="font-medium leading-relaxed">{message.text}</span>
            </div>
          )}

          {/* NẾU CHƯA MỞ KHÓA: HIỂN THỊ MÀN HÌNH KHÓA */}
          {!isUnlocked ? (
            <div className="py-12 px-6 max-w-md mx-auto text-center space-y-4">
              <div className="w-16 h-16 bg-slate-100 text-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-2 border border-slate-200 shadow-xs">
                <KeyRound className="w-8 h-8 text-slate-700" />
              </div>
              <h4 className="text-lg font-bold text-gray-900">Yêu cầu xác thực Quản trị viên</h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                Để bảo vệ tính toàn vẹn của tri thức y tế, bạn cần nhập đúng mật khẩu Quản trị viên (<code>ADMIN_SECRET_KEY</code>) trước khi truy cập tính năng nạp và xóa tài liệu.
              </p>

              <form onSubmit={handleUnlockSubmit} className="space-y-3 pt-2 text-left">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Mật khẩu Admin:
                  </label>
                  <input
                    type="password"
                    placeholder="Nhập ADMIN_SECRET_KEY..."
                    value={adminKey}
                    onChange={(e) => setAdminKey(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-2xs"
                    autoFocus
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={verifying || !adminKey.trim()}
                  className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-xs"
                >
                  {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlock className="w-4 h-4" />}
                  {verifying ? "Đang xác thực..." : "Xác thực & Mở khóa"}
                </button>
              </form>
            </div>
          ) : (
            /* NẾU ĐÃ MỞ KHÓA: HIỂN THỊ ĐẦY ĐỦ BẢNG ĐIỀU KHIỂN ADMIN */
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Thanh trạng thái Admin */}
              <div className="flex items-center justify-between bg-teal-50/70 p-4 rounded-xl border border-teal-200">
                <div className="flex items-center gap-2 text-xs font-semibold text-teal-900">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  <span>Phiên làm việc Admin đang hoạt động.</span>
                </div>
                <button
                  type="button"
                  onClick={handleLockAgain}
                  className="px-3 py-1.5 bg-white hover:bg-gray-100 text-slate-700 border border-gray-300 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 shadow-2xs"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Khóa lại</span>
                </button>
              </div>

              {/* TABS CHUYỂN ĐỔI: CÀO WEB vs UPLOAD TỆP */}
              <div className="flex border-b border-gray-200 gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("crawl")}
                  className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition ${
                    activeTab === "crawl"
                      ? "border-teal-600 text-teal-700"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  <span>Cào Dữ Liệu Từ Link Web (URL)</span>
                  <span className="text-[10px] bg-teal-100 text-teal-800 px-1.5 py-0.2 rounded-full font-bold">Mới</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("upload")}
                  className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition ${
                    activeTab === "upload"
                      ? "border-teal-600 text-teal-700"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  <span>Tải Lên Tệp Có Sẵn (.txt, .md, .pdf)</span>
                </button>
              </div>

              {/* TAB 1: TOOL CÀO DỮ LIỆU TỪ URL */}
              {activeTab === "crawl" && (
                <form onSubmit={handleCrawlSubmit} className="bg-white p-5 rounded-2xl border border-teal-200 bg-teal-50/15 shadow-2xs space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-teal-600" />
                      Công cụ cào dữ liệu y văn tự động (Web Ingestion)
                    </h4>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      Dán đường link bài viết y tế (từ LactMed, Dược thư, hoặc các trang nghiên cứu dược lâm sàng uy tín). Hệ thống sẽ tự động bóc tách bài viết, loại bỏ quảng cáo, lưu file văn bản kèm đường dẫn nguồn và tạo vector embeddings.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="relative">
                      <Globe className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                      <input
                        type="url"
                        placeholder="Dán link web y tế tại đây (ví dụ: https://www.ncbi.nlm.nih.gov/books/NBK501922/)..."
                        value={crawlUrl}
                        onChange={(e) => setCrawlUrl(e.target.value)}
                        disabled={crawling}
                        className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={crawling || !crawlUrl.trim()}
                      className="w-full sm:w-auto px-6 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-xs"
                    >
                      {crawling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                      {crawling ? "Đang tải trang, lọc bài viết & tạo Vector..." : "Cào dữ liệu & Nạp Vector"}
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 2: TẢI LÊN TỆP TỪ MÁY */}
              {activeTab === "upload" && (
                <form onSubmit={handleUpload} className="bg-white p-5 rounded-2xl border border-dashed border-teal-300 bg-teal-50/20 shadow-2xs">
                  <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <Upload className="w-4 h-4 text-teal-600" />
                    Nạp tệp tài liệu thuốc mới (.txt, .md, .pdf)
                  </h4>
                  <p className="text-xs text-gray-500 mb-4">
                    Chọn tệp y khoa có sẵn trên máy tính. Hệ thống sẽ bóc tách văn bản, chia đoạn và đánh chỉ mục vector.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <input
                      id="admin-file-input"
                      type="file"
                      accept=".txt,.md,.pdf"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                    />
                    <button
                      type="submit"
                      disabled={uploading || !selectedFile}
                      className="w-full sm:w-auto px-6 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shrink-0 shadow-xs"
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
                  <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-600" />
                    Kho tài liệu y khoa hiện có ({documents.length} tài liệu)
                  </h4>
                  <button onClick={loadDocs} className="text-xs text-teal-600 hover:underline font-semibold">
                    Làm mới danh sách
                  </button>
                </div>

                {loading ? (
                  <div className="py-8 text-center text-gray-400 text-xs">Đang tải danh sách...</div>
                ) : documents.length === 0 ? (
                  <div className="py-8 text-center text-gray-400 text-xs bg-gray-50 rounded-xl border border-gray-200">
                    Chưa có tài liệu nào trong kho y văn. Hãy dán link cào web hoặc nạp tài liệu đầu tiên ở trên!
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-100 text-gray-600 uppercase font-semibold">
                        <tr>
                          <th className="px-4 py-3">Tên tài liệu</th>
                          <th className="px-4 py-3">Kích thước</th>
                          <th className="px-4 py-3">Số đoạn Vector</th>
                          <th className="px-4 py-3">Ngày nạp</th>
                          <th className="px-4 py-3 text-right">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {documents.map((d) => {
                          const isWebDoc = d.fileName.startsWith("web_");

                          return (
                            <tr key={d.id} className="hover:bg-gray-50 transition">
                              <td className="px-4 py-3 font-medium text-gray-900 flex items-center gap-2">
                                {isWebDoc ? (
                                  <span title="Tài liệu cào từ Web">
                                    <Globe className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                  </span>
                                ) : (
                                  <FileText className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                                )}
                                <span className="truncate max-w-xs">{d.fileName}</span>
                              </td>
                              <td className="px-4 py-3 text-gray-500">
                                {(d.fileSizeBytes / 1024).toFixed(1)} KB
                              </td>
                              <td className="px-4 py-3 text-gray-700 font-semibold">
                                {d.chunkCount} chunks
                              </td>
                              <td className="px-4 py-3 text-gray-500">
                                {new Date(d.uploadedAtUtc).toLocaleDateString("vi-VN")}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <button
                                  onClick={() => handleDelete(d.id, d.fileName)}
                                  className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                                  title="Xóa tài liệu khỏi hệ thống"
                                >
                                  <Trash2 className="w-4 h-4" />
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
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-semibold rounded-xl transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
