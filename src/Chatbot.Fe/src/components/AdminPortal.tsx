import React, { useState, useEffect } from "react";
import { 
  type DocumentInfo, 
  type DocumentDetail,
  type ModelConfigInfo,
  type QuotaMetrics,
  type CrawlInspectionResult,
  type ModelsCatalog,
  type ModelCatalogItem,
  getDocuments, 
  getDocumentDetail,
  adminUploadDocument, 
  adminDeleteDocument,
  adminCrawlDocument,
  adminInspectUrl,
  adminGetModelsCatalog,
  adminGetModelConfig,
  adminUpdateModelConfig,
  adminTestModelConfig,
  adminGetMetrics,
  verifyAdminKey
} from "../services/api";
import {
  type UserProfile,
  type ConversationItem,
  type IncidentRecord,
  getAllUsersForAdmin,
  getUserConversationsForAdmin,
  getConversationMessages,
  searchUserMessages,
  saveConversationEvaluation,
  subscribeIncidents,
  updateIncident,
  formatConversationTime
} from "../services/firebase";
import { marked } from "marked";
import { 
  Users, 
  AlertTriangle, 
  Cpu, 
  Database, 
  ArrowLeft, 
  Lock, 
  Unlock, 
  KeyRound, 
  ShieldCheck, 
  Search, 
  Star, 
  MessageSquare, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  RefreshCw, 
  Globe, 
  Upload, 
  Trash2, 
  Sparkles, 
  FileText, 
  Check,
  Activity,
  Layers,
  Clock,
  Zap,
  Sliders,
  CheckCircle,
  Eye,
  Copy,
  Download,
  ExternalLink,
  X
} from "lucide-react";

interface Props {
  isOpen?: boolean;
  onBack: () => void;
}

export const AdminPortal: React.FC<Props> = ({ isOpen, onBack }) => {
  if (isOpen !== undefined && !isOpen) return null;

  // Authentication State
  const [adminKey, setAdminKey] = useState(sessionStorage.getItem("chatbot_admin_key") || "");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [activeTab, setActiveTab] = useState<"users" | "incidents" | "models" | "knowledge">("users");
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // -------------------------------------------------------------
  // TAB 1: USERS & CHATS STATE
  // -------------------------------------------------------------
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userLoadError, setUserLoadError] = useState<string | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userConvs, setUserConvs] = useState<ConversationItem[]>([]);
  const [convsLoading, setConvsLoading] = useState(false);
  const [convSearchQuery, setConvSearchQuery] = useState("");
  const [msgSearchQuery, setMsgSearchQuery] = useState("");
  const [isSearchingMessages, setIsSearchingMessages] = useState(false);
  const [foundMessages, setFoundMessages] = useState<{ conversationId: string; conversationTitle: string; message: any }[]>([]);
  const [viewModeConv, setViewModeConv] = useState<"conversations" | "search_results">("conversations");
  const [selectedConv, setSelectedConv] = useState<ConversationItem | null>(null);
  const [convMessages, setConvMessages] = useState<any[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // Evaluation Form State
  const [evalRating, setEvalRating] = useState<number>(5);
  const [evalTagInput, setEvalTagInput] = useState<string>("");
  const [evalTags, setEvalTags] = useState<string[]>([]);
  const [evalNotes, setEvalNotes] = useState<string>("");
  const [savingEval, setSavingEval] = useState(false);
  const [evalSavedSuccess, setEvalSavedSuccess] = useState(false);

  // -------------------------------------------------------------
  // TAB 2: INCIDENTS HUB STATE
  // -------------------------------------------------------------
  const [incidentsList, setIncidentsList] = useState<IncidentRecord[]>([]);
  const [incidentStatusFilter, setIncidentStatusFilter] = useState<string>("all");
  const [incidentTypeFilter, setIncidentTypeFilter] = useState<string>("all");
  const [selectedIncident, setSelectedIncident] = useState<IncidentRecord | null>(null);
  const [incidentAdminNotes, setIncidentAdminNotes] = useState("");
  const [incidentCorrectedResponse, setIncidentCorrectedResponse] = useState("");
  const [updatingIncident, setUpdatingIncident] = useState(false);

  // -------------------------------------------------------------
  // TAB 3: MODEL CONFIG & QUOTA STATE
  // -------------------------------------------------------------
  const [modelConfig, setModelConfig] = useState<ModelConfigInfo | null>(null);
  const [modelsCatalog, setModelsCatalog] = useState<ModelsCatalog | null>(null);
  const [metrics, setMetrics] = useState<QuotaMetrics | null>(null);
  const [modelLoading, setModelLoading] = useState(false);
  const [savingModel, setSavingModel] = useState(false);
  const [editProvider, setEditProvider] = useState("gemini");
  const [editChatModel, setEditChatModel] = useState("gemini-3.5-flash-lite,gemini-3.1-flash-lite,gemini-2.5-flash-lite");
  const [editEmbeddingModel, setEditEmbeddingModel] = useState("gemini-embedding-001,gemini-embedding-002");
  const [editBaseUrl, setEditBaseUrl] = useState("https://generativelanguage.googleapis.com");
  const [editApiKey, setEditApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);

  // -------------------------------------------------------------
  // TAB 4: KNOWLEDGE MANAGEMENT STATE
  // -------------------------------------------------------------
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [knowledgeSubTab, setKnowledgeSubTab] = useState<"crawl" | "upload">("crawl");
  const [crawlUrl, setCrawlUrl] = useState("");
  const [crawling, setCrawling] = useState(false);
  const [inspectingUrl, setInspectingUrl] = useState(false);
  const [inspectionResult, setInspectionResult] = useState<CrawlInspectionResult | null>(null);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Document Viewer State
  const [viewingDoc, setViewingDoc] = useState<DocumentDetail | null>(null);
  const [docDetailLoading, setDocDetailLoading] = useState(false);
  const [copiedDocContent, setCopiedDocContent] = useState(false);
  const [docViewMode, setDocViewMode] = useState<"formatted" | "raw">("formatted");
  const [docSearchQuery, setDocSearchQuery] = useState("");

  // Model Testing State
  const [testingModel, setTestingModel] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; latencyMs: number; reply?: string; error?: string } | null>(null);
  const [showAllModels, setShowAllModels] = useState(false);

  // Firestore Rules Modal State
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [copiedRules, setCopiedRules] = useState(false);

  // Mobile Master-Detail Responsive Navigation
  const [mobileUserView, setMobileUserView] = useState<"users" | "convs" | "messages">("users");
  const [mobileIncidentView, setMobileIncidentView] = useState<"list" | "detail">("list");

  // Cascade list helpers
  const cascadeList = editChatModel
    .split(/[,;|]/)
    .map((s) => s.trim())
    .filter(Boolean);

  const handleToggleCascadeModel = (modelId: string) => {
    if (cascadeList.includes(modelId)) {
      const updated = cascadeList.filter((m) => m !== modelId);
      setEditChatModel(updated.join(","));
    } else {
      const updated = [...cascadeList, modelId];
      setEditChatModel(updated.join(","));
    }
    setTestResult(null);
  };

  const handleRemoveCascadeModel = (modelId: string) => {
    const updated = cascadeList.filter((m) => m !== modelId);
    setEditChatModel(updated.join(","));
    setTestResult(null);
  };

  const handleResetCascade = () => {
    setEditChatModel("gemini-3.5-flash-lite,gemini-3.1-flash-lite,gemini-2.5-flash-lite");
    setTestResult(null);
  };

  // =============================================================
  // AUTHENTICATION & INITIALIZATION
  // =============================================================
  useEffect(() => {
    const savedKey = sessionStorage.getItem("chatbot_admin_key");
    if (savedKey) {
      verifyAndUnlock(savedKey);
    }
  }, []);

  const verifyAndUnlock = async (keyToVerify: string) => {
    if (!keyToVerify.trim()) {
      setFeedbackMsg({ text: "Vui lòng nhập mã khóa Quản trị viên (ADMIN_SECRET_KEY).", type: "error" });
      return;
    }
    setVerifying(true);
    setFeedbackMsg(null);
    try {
      const ok = await verifyAdminKey(keyToVerify.trim());
      if (ok) {
        setIsUnlocked(true);
        sessionStorage.setItem("chatbot_admin_key", keyToVerify.trim());
        setAdminKey(keyToVerify.trim());
        loadInitialData(keyToVerify.trim());
      } else {
        setIsUnlocked(false);
        sessionStorage.removeItem("chatbot_admin_key");
        setFeedbackMsg({ text: "Mật khẩu Admin không chính xác. Vui lòng kiểm tra lại ADMIN_SECRET_KEY trong .env!", type: "error" });
      }
    } catch {
      setIsUnlocked(false);
      setFeedbackMsg({ text: "Lỗi kết nối tới máy chủ khi xác thực Admin.", type: "error" });
    } finally {
      setVerifying(false);
    }
  };

  const loadInitialData = async (validKey: string) => {
    loadUsers();
    loadModelConfigAndMetrics(validKey);
    loadCatalog(validKey);
    loadDocs();
  };

  const loadCatalog = async (key: string) => {
    try {
      const cat = await adminGetModelsCatalog(key);
      setModelsCatalog(cat);
    } catch (e) {
      console.warn("Không thể nạp models.catalog.json:", e);
    }
  };

  // Realtime Incidents Subscription
  useEffect(() => {
    if (!isUnlocked) return;
    const unsub = subscribeIncidents((list) => {
      setIncidentsList(list);
    });
    return () => unsub();
  }, [isUnlocked]);

  // Tab 1: Load Users
  const loadUsers = async () => {
    setUsersLoading(true);
    setUserLoadError(null);
    try {
      const res = await getAllUsersForAdmin();
      setUsersList(res.users);
      if (res.error) {
        setUserLoadError(res.error);
      }
      if (res.users.length > 0 && !selectedUser) {
        handleSelectUser(res.users[0]);
      }
    } catch (err: any) {
      console.error(err);
      setUserLoadError(err.message || "Lỗi tải người dùng");
    } finally {
      setUsersLoading(false);
    }
  };

  const handleSelectUser = async (user: UserProfile) => {
    setSelectedUser(user);
    setSelectedConv(null);
    setConvMessages([]);
    setConvSearchQuery("");
    setMsgSearchQuery("");
    setFoundMessages([]);
    setViewModeConv("conversations");
    setMobileUserView("convs");
    setConvsLoading(true);
    try {
      const convs = await getUserConversationsForAdmin(user.uid);
      setUserConvs(convs);
      if (convs.length > 0) {
        handleSelectConv(user.uid, convs[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setConvsLoading(false);
    }
  };

  const handleSearchMessages = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !msgSearchQuery.trim()) return;
    setIsSearchingMessages(true);
    setViewModeConv("search_results");
    try {
      const results = await searchUserMessages(selectedUser.uid, msgSearchQuery.trim());
      setFoundMessages(results);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSearchingMessages(false);
    }
  };

  const handleSelectConv = async (userId: string, conv: ConversationItem) => {
    setSelectedConv(conv);
    setEvalRating(conv.rating || 5);
    setEvalTags(conv.tags || []);
    setEvalNotes(conv.adminNotes || "");
    setEvalSavedSuccess(false);
    setMobileUserView("messages");
    setMessagesLoading(true);
    try {
      const msgs = await getConversationMessages(userId, conv.id);
      setConvMessages(msgs);
    } catch (err) {
      console.error(err);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleAddTag = (tagToAdd: string) => {
    const trimmed = tagToAdd.trim();
    if (trimmed && !evalTags.includes(trimmed)) {
      setEvalTags([...evalTags, trimmed]);
      setEvalTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEvalTags(evalTags.filter(t => t !== tagToRemove));
  };

  const handleSaveEvaluation = async () => {
    if (!selectedUser || !selectedConv) return;
    setSavingEval(true);
    try {
      await saveConversationEvaluation(selectedUser.uid, selectedConv.id, {
        rating: evalRating,
        tags: evalTags,
        adminNotes: evalNotes.trim()
      });
      // Update local state
      setSelectedConv(prev => prev ? { ...prev, rating: evalRating, tags: evalTags, adminNotes: evalNotes.trim() } : null);
      setUserConvs(prev => prev.map(c => c.id === selectedConv.id ? { ...c, rating: evalRating, tags: evalTags, adminNotes: evalNotes.trim() } : c));
      setEvalSavedSuccess(true);
      setTimeout(() => setEvalSavedSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingEval(false);
    }
  };

  // Tab 2: Incidents Action
  const handleSelectIncident = (incident: IncidentRecord) => {
    setSelectedIncident(incident);
    setIncidentAdminNotes(incident.adminNotes || "");
    setIncidentCorrectedResponse(incident.correctedResponse || "");
    setMobileIncidentView("detail");
  };

  const handleUpdateIncidentStatus = async (newStatus: "pending" | "in_review" | "resolved") => {
    if (!selectedIncident) return;
    setUpdatingIncident(true);
    try {
      await updateIncident(selectedIncident.id, {
        status: newStatus,
        adminNotes: incidentAdminNotes.trim(),
        correctedResponse: incidentCorrectedResponse.trim()
      });
      setSelectedIncident(prev => prev ? {
        ...prev,
        status: newStatus,
        adminNotes: incidentAdminNotes.trim(),
        correctedResponse: incidentCorrectedResponse.trim()
      } : null);
      setFeedbackMsg({ text: `Đã cập nhật tình trạng sự cố sang "${newStatus}"!`, type: "success" });
    } catch (err: any) {
      setFeedbackMsg({ text: err.message || "Cập nhật sự cố thất bại", type: "error" });
    } finally {
      setUpdatingIncident(false);
    }
  };

  // Tab 3: Model Config & Metrics
  const loadModelConfigAndMetrics = async (key: string) => {
    setModelLoading(true);
    try {
      const [cfg, met] = await Promise.all([
        adminGetModelConfig(key),
        adminGetMetrics(key)
      ]);
      setModelConfig(cfg);
      setMetrics(met);
      setEditProvider(cfg.provider);
      setEditChatModel(cfg.chatModel || cfg.model || "gemini-1.5-flash");
      setEditEmbeddingModel(cfg.embeddingModel || "gemini-embedding-001");
      if (cfg.baseUrl) setEditBaseUrl(cfg.baseUrl);
    } catch (err) {
      console.error(err);
    } finally {
      setModelLoading(false);
    }
  };

  const handleSaveModelConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingModel(true);
    setFeedbackMsg(null);
    try {
      const res = await adminUpdateModelConfig(adminKey, {
        provider: editProvider,
        chatModel: editChatModel,
        embeddingModel: editEmbeddingModel,
        baseUrl: editBaseUrl,
        apiKey: editApiKey.trim() ? editApiKey.trim() : undefined
      });
      setFeedbackMsg({ text: res.message || "Cập nhật model thành công!", type: "success" });
      await loadModelConfigAndMetrics(adminKey);
    } catch (err: any) {
      setFeedbackMsg({ text: err.message || "Lỗi cập nhật cấu hình model", type: "error" });
    } finally {
      setSavingModel(false);
    }
  };

  // Tab 4: Knowledge
  const loadDocs = async () => {
    setDocsLoading(true);
    try {
      const docs = await getDocuments();
      setDocuments(docs);
    } catch (err) {
      console.error(err);
    } finally {
      setDocsLoading(false);
    }
  };

  const handleInspectUrl = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!crawlUrl.trim()) {
      setFeedbackMsg({ text: "Vui lòng nhập đường dẫn URL y tế.", type: "error" });
      return;
    }
    setInspectingUrl(true);
    setInspectionResult(null);
    setShowWarningModal(false);
    setFeedbackMsg(null);
    try {
      const res = await adminInspectUrl(crawlUrl.trim(), adminKey);
      setInspectionResult(res);
      if (res.shouldWarn) {
        setShowWarningModal(true);
      } else {
        setFeedbackMsg({ text: `Kiểm tra trang web tốt! Tìm thấy ${res.textLength} ký tự văn bản. Đã sẵn sàng cào.`, type: "success" });
      }
    } catch (err: any) {
      setFeedbackMsg({ text: err.message || "Kiểm tra link thất bại.", type: "error" });
    } finally {
      setInspectingUrl(false);
    }
  };

  const handleCrawl = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!crawlUrl.trim()) return;
    setCrawling(true);
    setShowWarningModal(false);
    setFeedbackMsg(null);
    try {
      const res = await adminCrawlDocument(crawlUrl.trim(), adminKey);
      setFeedbackMsg({ text: res.message || "Cào tài liệu thành công!", type: "success" });
      setCrawlUrl("");
      setInspectionResult(null);
      await loadDocs();
    } catch (err: any) {
      setFeedbackMsg({ text: err.message || "Cào tài liệu thất bại", type: "error" });
    } finally {
      setCrawling(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    setUploadingFile(true);
    setFeedbackMsg(null);
    try {
      await adminUploadDocument(selectedFile, adminKey);
      setFeedbackMsg({ text: `Đã nạp tệp "${selectedFile.name}" thành công!`, type: "success" });
      setSelectedFile(null);
      const input = document.getElementById("portal-upload-input") as HTMLInputElement;
      if (input) input.value = "";
      await loadDocs();
    } catch (err: any) {
      setFeedbackMsg({ text: err.message || "Tải lên tài liệu thất bại", type: "error" });
    } finally {
      setUploadingFile(false);
    }
  };

  const cleanDocDisplayTitle = (title?: string, fileName?: string) => {
    const raw = title || fileName || "Chuyên luận Y khoa";
    let clean = raw.replace(/\.(txt|md|pdf|json|html|htm)$/i, "");
    if (clean.startsWith("web_")) {
      clean = clean.replace(/^web_/, "").replace(/_\d{8}_\d{4}$/, "");
    }
    clean = clean.replace(/[_-]+/g, " ").trim();
    clean = clean.split(" ").map(w => w ? w.charAt(0).toUpperCase() + w.slice(1) : "").join(" ");
    return clean;
  };

  const handleDeleteDoc = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa tài liệu "${name}" khỏi cơ sở tri thức?`)) return;
    try {
      await adminDeleteDocument(id, adminKey);
      setFeedbackMsg({ text: `Đã xóa tài liệu "${name}".`, type: "success" });
      await loadDocs();
    } catch (err: any) {
      setFeedbackMsg({ text: err.message || "Xóa tài liệu thất bại", type: "error" });
    }
  };

  const handleOpenDocViewer = async (docId: string) => {
    setDocDetailLoading(true);
    setViewingDoc(null);
    setCopiedDocContent(false);
    setDocSearchQuery("");
    try {
      const detail = await getDocumentDetail(docId);
      setViewingDoc(detail);
    } catch (err: any) {
      setFeedbackMsg({ text: err.message || "Không thể tải nội dung tài liệu", type: "error" });
    } finally {
      setDocDetailLoading(false);
    }
  };

  const handleCopyDocContent = () => {
    if (!viewingDoc?.content) return;
    navigator.clipboard.writeText(viewingDoc.content);
    setCopiedDocContent(true);
    setTimeout(() => setCopiedDocContent(false), 2000);
  };

  const handleDownloadDoc = () => {
    if (!viewingDoc?.content) return;
    const blob = new Blob([viewingDoc.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = viewingDoc.fileName || `${viewingDoc.title || "document"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleTestModelConnection = async () => {
    setTestingModel(true);
    setTestResult(null);
    try {
      const res = await adminTestModelConfig(adminKey, {
        provider: editProvider,
        model: editChatModel,
        baseUrl: editBaseUrl,
        apiKey: editApiKey.trim() ? editApiKey.trim() : undefined
      });
      setTestResult(res);
      if (res.success) {
        setFeedbackMsg({ 
          text: `Kiểm tra thành công! Độ trễ: ${res.latencyMs}ms. Model phản hồi: "${res.reply}"`, 
          type: "success" 
        });
      } else {
        setFeedbackMsg({ 
          text: `Kiểm tra thất bại (${res.latencyMs}ms): ${res.error}`, 
          type: "error" 
        });
      }
    } catch (err: any) {
      setTestResult({ success: false, latencyMs: 0, error: err.message });
      setFeedbackMsg({ text: `Lỗi kết nối test: ${err.message}`, type: "error" });
    } finally {
      setTestingModel(false);
    }
  };

  // Pending incidents counter
  const pendingIncidentsCount = incidentsList.filter(i => i.status === "pending").length;

  // Filtered Users
  const filteredUsers = usersList.filter(u => {
    if (!userSearchQuery.trim()) return true;
    const q = userSearchQuery.toLowerCase();
    return (u.email && u.email.toLowerCase().includes(q)) || 
           (u.displayName && u.displayName.toLowerCase().includes(q)) ||
           u.uid.toLowerCase().includes(q);
  });

  // Filtered Incidents
  const filteredIncidents = incidentsList.filter(i => {
    if (incidentStatusFilter !== "all" && i.status !== incidentStatusFilter) return false;
    if (incidentTypeFilter !== "all" && i.errorType !== incidentTypeFilter) return false;
    return true;
  });

  // =============================================================
  // RENDER: LOCKED VIEW
  // =============================================================
  if (!isUnlocked) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-white">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={onBack}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại giao diện Chat</span>
            </button>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <Lock className="w-5 h-5" />
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2 text-white">
              <span>Cổng Quản Trị Hệ Thống</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Vui lòng nhập mật khẩu Quản trị viên (ADMIN_SECRET_KEY) để truy cập toàn quyền giám sát người dùng, xử lý sự cố, quản lý AI model và tri thức.
            </p>
          </div>

          {feedbackMsg && (
            <div className={`p-3 rounded-xl mb-4 text-xs flex items-center gap-2 ${
              feedbackMsg.type === "success" 
                ? "bg-emerald-950/60 border border-emerald-800 text-emerald-300"
                : "bg-red-950/60 border border-red-800 text-red-300"
            }`}>
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{feedbackMsg.text}</span>
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); verifyAndUnlock(adminKey); }} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Mã Khóa Quản Trị (Secret Key):
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  placeholder="Nhập ADMIN_SECRET_KEY từ file .env..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={verifying}
              className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer shadow-lg shadow-teal-900/30"
            >
              {verifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang xác thực...</span>
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4" />
                  <span>Mở Khóa Toàn Phần Admin Portal</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // =============================================================
  // RENDER: FULL-PAGE ADMIN PORTAL
  // =============================================================
  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-slate-100 flex flex-col lg:flex-row overflow-hidden font-sans">
      {/* MOBILE TOP NAVIGATION BAR */}
      <div className="lg:hidden flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xs font-bold text-white tracking-wide">QUẢN TRỊ LACTAMED</h1>
            <p className="text-[10px] text-teal-400 font-medium">Trung tâm Vận hành</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIsUnlocked(false);
              sessionStorage.removeItem("chatbot_admin_key");
            }}
            className="p-1.5 text-slate-400 hover:text-red-400 transition"
            title="Khóa lại"
          >
            <Lock className="w-4 h-4" />
          </button>
          <button
            onClick={onBack}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Về Chat</span>
          </button>
        </div>
      </div>

      {/* MOBILE SCROLLABLE TAB BAR */}
      <div className="lg:hidden flex items-center gap-1.5 px-3 py-2 bg-slate-950 border-b border-slate-800 overflow-x-auto text-xs shrink-0">
        <button
          onClick={() => { setActiveTab("users"); setMobileUserView("users"); }}
          className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === "users" ? "bg-teal-600 text-white shadow-sm" : "bg-slate-900 text-slate-400 hover:text-white"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Người dùng ({usersList.length})</span>
        </button>
        <button
          onClick={() => { setActiveTab("incidents"); setMobileIncidentView("list"); }}
          className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === "incidents" ? "bg-teal-600 text-white shadow-sm" : "bg-slate-900 text-slate-400 hover:text-white"
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Sự cố</span>
          {pendingIncidentsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-white font-bold text-[10px]">
              {pendingIncidentsCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("models")}
          className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === "models" ? "bg-teal-600 text-white shadow-sm" : "bg-slate-900 text-slate-400 hover:text-white"
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Model & Quota</span>
        </button>
        <button
          onClick={() => setActiveTab("knowledge")}
          className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === "knowledge" ? "bg-teal-600 text-white shadow-sm" : "bg-slate-900 text-slate-400 hover:text-white"
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Tri thức ({documents.length})</span>
        </button>
      </div>

      {/* DESKTOP SIDEBAR QUẢN TRỊ */}
      <aside className="hidden lg:flex w-64 sm:w-72 bg-slate-900 border-r border-slate-800 flex-col justify-between shrink-0">
        <div>
          {/* Header Sidebar */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-xs font-bold text-white tracking-wide">ADMIN PORTAL</h1>
                <p className="text-[10px] text-teal-400 font-medium">Trung Tâm Vận Hành Y Khoa</p>
              </div>
            </div>

            <button
              onClick={onBack}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Quay lại giao diện Chat người dùng"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>

          {/* User / Status Badge */}
          <div className="p-3 mx-3 my-3 bg-slate-800/60 rounded-xl border border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[11px] font-semibold text-slate-300">Đã mở khóa phiên</span>
            </div>
            <button
              onClick={() => {
                setIsUnlocked(false);
                sessionStorage.removeItem("chatbot_admin_key");
              }}
              className="text-[10px] text-slate-400 hover:text-red-400 flex items-center gap-1 transition"
            >
              <Lock className="w-3 h-3" />
              <span>Khóa lại</span>
            </button>
          </div>

          {/* Navigation Tabs */}
          <nav className="px-3 space-y-1.5">
            <button
              onClick={() => setActiveTab("users")}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === "users"
                  ? "bg-teal-600 text-white shadow-md shadow-teal-900/40"
                  : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-200"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4" />
                <span>Người dùng & Hội thoại</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-800 text-slate-300">
                {usersList.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("incidents")}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === "incidents"
                  ? "bg-teal-600 text-white shadow-md shadow-teal-900/40"
                  : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-200"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4" />
                <span>Nhật ký Sự cố & Sửa lỗi</span>
              </div>
              {pendingIncidentsCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-red-500 text-white font-bold animate-pulse">
                  {pendingIncidentsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("models")}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === "models"
                  ? "bg-teal-600 text-white shadow-md shadow-teal-900/40"
                  : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-200"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Cpu className="w-4 h-4" />
                <span>Quản lý Model & Quota</span>
              </div>
              <span className="text-[10px] text-teal-300 font-mono">
                {modelConfig?.provider === "gemini" ? "Gemini" : "Custom"}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("knowledge")}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === "knowledge"
                  ? "bg-teal-600 text-white shadow-md shadow-teal-900/40"
                  : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-200"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Database className="w-4 h-4" />
                <span>Tri thức & Cào dữ liệu</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-800 text-slate-300">
                {documents.length} docs
              </span>
            </button>
          </nav>
        </div>

        {/* Footer Overview Stats */}
        <div className="p-4 border-t border-slate-800 text-[11px] text-slate-400 space-y-2 bg-slate-900/60">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Vector Store:</span>
            <span className="font-semibold text-slate-300 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              {modelConfig?.vectorStore === "qdrant" ? "Qdrant Cloud" : "SQLite RAM"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Tổng chunks y văn:</span>
            <span className="font-semibold text-teal-400">{modelConfig?.totalChunks ?? 0}</span>
          </div>
          <button
            onClick={onBack}
            className="w-full mt-2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại Chatbot</span>
          </button>
        </div>
      </aside>

      {/* NỘI DUNG CHÍNH (MAIN WORKSPACE) */}
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-950">
        {/* Banner thông báo trạng thái */}
        {feedbackMsg && (
          <div className={`px-6 py-2.5 text-xs flex items-center justify-between border-b ${
            feedbackMsg.type === "success"
              ? "bg-emerald-950/80 text-emerald-300 border-emerald-800"
              : "bg-red-950/80 text-red-300 border-red-800"
          }`}>
            <div className="flex items-center gap-2">
              {feedbackMsg.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400" />
              )}
              <span>{feedbackMsg.text}</span>
            </div>
            <button onClick={() => setFeedbackMsg(null)} className="text-slate-400 hover:text-white">
              ✕
            </button>
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 1: USERS & CONVERSATIONS INSPECTOR                        */}
        {/* ============================================================= */}
        {activeTab === "users" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* 4 Thẻ KPI Thống Kê Người Dùng & Chi Phí */}
            <div className="p-3 sm:p-4 bg-slate-900/90 border-b border-slate-800 shrink-0">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl flex items-center justify-between shadow-2xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tổng Người Dùng</span>
                    <span className="text-base sm:text-lg font-bold text-white font-mono mt-0.5 block">{usersList.length} <span className="text-xs font-normal text-slate-400">tài khoản</span></span>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20 shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                </div>

                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl flex items-center justify-between shadow-2xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Phương Thức Xác Thực</span>
                    <div className="flex items-center gap-2 mt-1 text-xs font-semibold">
                      <span className="text-red-400 font-mono flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                        {usersList.filter(u => u.providerId === "google.com").length} Google
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="text-blue-400 font-mono flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                        {usersList.filter(u => u.providerId !== "google.com").length} Email
                      </span>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20 shrink-0">
                    <KeyRound className="w-4 h-4" />
                  </div>
                </div>

                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl flex items-center justify-between shadow-2xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cuộc Trò Chuyện Y Khoa</span>
                    <span className="text-base sm:text-lg font-bold text-teal-300 font-mono mt-0.5 block">
                      {usersList.reduce((acc, u) => acc + (u.conversationCount || 0), 0)} <span className="text-xs font-normal text-slate-400">phiên</span>
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 shrink-0">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                </div>

                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl flex items-center justify-between shadow-2xs">
                  <div className="min-w-0 pr-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Chi Phí Ước Tính</span>
                    <span className="text-xs sm:text-sm font-bold text-amber-400 font-mono mt-0.5 block truncate" title={`Tổng tokens: ${usersList.reduce((acc, u) => acc + (u.totalTokensEstimated || 0), 0).toLocaleString()}`}>
                      ${usersList.reduce((acc, u) => acc + (u.totalCostUsd || 0), 0).toFixed(4)} <span className="text-[10px] font-normal text-slate-400">(~{usersList.reduce((acc, u) => acc + (u.totalCostVnd || 0), 0).toLocaleString()}đ)</span>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowRulesModal(true)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-teal-400 rounded-xl text-xs border border-slate-700 transition cursor-pointer shrink-0"
                    title="Cấu hình quyền đọc Firestore nếu danh sách User rỗng"
                  >
                    <ShieldCheck className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
            {/* Cột trái: Danh sách Người dùng */}
            <div className={`w-full lg:w-80 border-r border-slate-800 flex-col bg-slate-900/50 shrink-0 ${
              mobileUserView === "users" ? "flex" : "hidden lg:flex"
            }`}>
              <div className="p-3 border-b border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-teal-400" />
                    <span>Người dùng ({filteredUsers.length} trong DB)</span>
                  </h2>
                  <button
                    onClick={loadUsers}
                    className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition cursor-pointer"
                    title="Làm mới danh sách"
                  >
                    <RefreshCw className={`w-3 h-3 ${usersLoading ? "animate-spin" : ""}`} />
                  </button>
                </div>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    placeholder="Tìm theo email, tên, ID..."
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Thông báo nếu có lỗi Firestore Security Rules */}
              {userLoadError && (
                <div className="m-3 p-3 rounded-xl bg-amber-950/60 border border-amber-800 text-[11px] text-amber-300 leading-relaxed space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-400">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Lưu ý quyền đọc Firestore</span>
                  </div>
                  <p>{userLoadError}</p>
                </div>
              )}

              <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
                {usersLoading && usersList.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-teal-500" />
                    <span>Đang tải danh sách người dùng...</span>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    Không tìm thấy người dùng nào phù hợp.
                  </div>
                ) : (
                  filteredUsers.map((u) => {
                    const isSelected = selectedUser?.uid === u.uid;
                    const isGoogle = u.providerId === "google.com";
                    return (
                      <button
                        key={u.uid}
                        onClick={() => handleSelectUser(u)}
                        className={`w-full p-3 text-left transition flex items-start gap-2.5 cursor-pointer ${
                          isSelected
                            ? "bg-teal-950/50 border-l-2 border-teal-500"
                            : "hover:bg-slate-800/50 text-slate-300"
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-teal-400 shrink-0">
                          {u.displayName ? u.displayName.charAt(0).toUpperCase() : "U"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-semibold text-white truncate">
                              {u.displayName || "Người dùng"}
                            </span>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase shrink-0 ${
                              isGoogle
                                ? "bg-red-950/70 text-red-300 border border-red-800/70"
                                : "bg-blue-950/70 text-blue-300 border border-blue-800/70"
                            }`}>
                              {isGoogle ? "Google" : "Email/Pass"}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 truncate mt-0.5">
                            {u.email || u.uid}
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1 font-mono">
                            <span>{u.conversationCount ?? 0} chats</span>
                            <span>{((u.totalTokensEstimated ?? 0) / 1000).toFixed(1)}k tokens</span>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Cột giữa: Danh sách Cuộc hội thoại & Tìm kiếm tin nhắn */}
            <div className={`w-full lg:w-80 border-r border-slate-800 flex-col bg-slate-900/30 shrink-0 ${
              mobileUserView === "convs" ? "flex" : "hidden lg:flex"
            }`}>
              {/* Nút quay lại trên Mobile */}
              <div className="lg:hidden p-2.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between shrink-0">
                <button
                  type="button"
                  onClick={() => setMobileUserView("users")}
                  className="text-xs text-teal-400 hover:text-teal-300 font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Danh Sách Người Dùng</span>
                </button>
                <span className="text-[11px] text-slate-400 font-medium truncate max-w-[150px]">
                  {selectedUser?.displayName || selectedUser?.email}
                </span>
              </div>

              <div className="p-3 border-b border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-teal-400" />
                    <span>Hội thoại ({userConvs.length})</span>
                  </h2>
                  {selectedUser && (
                    <button
                      onClick={() => handleSelectUser(selectedUser)}
                      className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition cursor-pointer"
                      title="Nạp lại"
                    >
                      <RefreshCw className={`w-3 h-3 ${convsLoading ? "animate-spin" : ""}`} />
                    </button>
                  )}
                </div>

                {/* Sub-tabs: Xem danh sách Chat vs Tìm kiếm tin nhắn */}
                <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setViewModeConv("conversations")}
                    className={`flex-1 py-1 rounded font-semibold transition cursor-pointer ${
                      viewModeConv === "conversations" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Danh sách chat
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewModeConv("search_results")}
                    className={`flex-1 py-1 rounded font-semibold transition cursor-pointer ${
                      viewModeConv === "search_results" ? "bg-teal-600 text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Tìm trong tin nhắn
                  </button>
                </div>

                {viewModeConv === "conversations" ? (
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      value={convSearchQuery}
                      onChange={(e) => setConvSearchQuery(e.target.value)}
                      placeholder="Lọc tiêu đề cuộc trò chuyện..."
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                ) : (
                  <form onSubmit={handleSearchMessages} className="flex gap-1.5">
                    <input
                      type="text"
                      value={msgSearchQuery}
                      onChange={(e) => setMsgSearchQuery(e.target.value)}
                      placeholder="Tìm từ khóa trong tin nhắn..."
                      className="flex-1 bg-slate-800/80 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                    <button
                      type="submit"
                      disabled={isSearchingMessages || !msgSearchQuery.trim()}
                      className="px-2.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold disabled:opacity-50 transition cursor-pointer"
                    >
                      {isSearchingMessages ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Tìm"}
                    </button>
                  </form>
                )}
              </div>

              {/* Danh sách Hội thoại hoặc Kết quả tìm kiếm tin nhắn */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
                {viewModeConv === "search_results" ? (
                  isSearchingMessages ? (
                    <div className="p-8 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-teal-500" />
                      <span>Đang tìm kiếm sâu trong tin nhắn...</span>
                    </div>
                  ) : foundMessages.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">
                      {msgSearchQuery.trim() ? "Không tìm thấy tin nhắn nào chứa từ khóa này." : "Nhập từ khóa và bấm Tìm để quét tin nhắn."}
                    </div>
                  ) : (
                    <div className="p-2 space-y-1.5">
                      <div className="text-[10px] text-teal-400 font-semibold px-2">
                        Tìm thấy {foundMessages.length} tin nhắn khớp:
                      </div>
                      {foundMessages.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={async () => {
                            if (!selectedUser) return;
                            const targetConv = userConvs.find(c => c.id === item.conversationId);
                            if (targetConv) {
                              await handleSelectConv(selectedUser.uid, targetConv);
                            }
                          }}
                          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-teal-500/60 cursor-pointer transition text-left space-y-1"
                        >
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-bold text-teal-300 truncate max-w-[160px]">{item.conversationTitle}</span>
                            <span className="text-slate-500 font-mono text-[9px]">{item.message.role === "user" ? "User" : "Bot"}</span>
                          </div>
                          <p className="text-xs text-slate-300 line-clamp-2">
                            {item.message.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )
                ) : convsLoading ? (
                  <div className="p-8 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-teal-500" />
                    <span>Đang nạp cuộc trò chuyện...</span>
                  </div>
                ) : userConvs.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    Người dùng này chưa có cuộc trò chuyện nào được lưu.
                  </div>
                ) : (
                  userConvs
                    .filter(c => !convSearchQuery.trim() || (c.title || "").toLowerCase().includes(convSearchQuery.trim().toLowerCase()))
                    .map((c) => {
                      const isSelected = selectedConv?.id === c.id;
                      return (
                        <button
                          key={c.id}
                          onClick={() => selectedUser && handleSelectConv(selectedUser.uid, c)}
                          className={`w-full p-3 text-left transition cursor-pointer ${
                            isSelected
                              ? "bg-teal-950/60 border-l-2 border-teal-500"
                              : "hover:bg-slate-800/40 text-slate-300"
                          }`}
                        >
                          <div className="text-xs font-semibold text-white truncate">
                            {c.title || "Cuộc trò chuyện"}
                          </div>
                          <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-500">
                            <span>{formatConversationTime(c.updatedAt || c.createdAt)}</span>
                            {c.rating && (
                              <span className="flex items-center gap-0.5 text-amber-400 font-bold">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                {c.rating}★
                              </span>
                            )}
                          </div>
                          {c.tags && c.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {c.tags.slice(0, 2).map((t, i) => (
                                <span key={i} className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}
                        </button>
                      );
                    })
                )}
              </div>
            </div>

            {/* Cột phải: Chi tiết Tin nhắn, Thông tin người dùng & Đánh giá Bác sĩ */}
            <div className={`flex-1 flex-col overflow-hidden bg-slate-950 ${
              mobileUserView === "messages" ? "flex" : "hidden lg:flex"
            }`}>
              {/* Nút quay lại danh sách hội thoại trên Mobile */}
              <div className="lg:hidden p-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
                <button
                  type="button"
                  onClick={() => setMobileUserView("convs")}
                  className="text-xs text-teal-400 hover:text-teal-300 font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Danh Sách Hội Thoại ({userConvs.length})</span>
                </button>
                <span className="text-[11px] text-slate-300 font-medium truncate max-w-[170px]">
                  {selectedConv?.title || "Nội dung chat"}
                </span>
              </div>
              {/* Thẻ Hồ sơ & Thống kê Người Dùng */}
              {selectedUser && (
                <div className="px-6 py-3.5 border-b border-slate-800 bg-slate-900/80 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-teal-800 border border-teal-600 flex items-center justify-center font-bold text-sm text-white shrink-0">
                      {selectedUser.displayName ? selectedUser.displayName.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-bold text-white">{selectedUser.displayName || "Người dùng"}</h3>
                        <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold uppercase ${
                          selectedUser.providerId === "google.com"
                            ? "bg-red-950 text-red-300 border border-red-800"
                            : "bg-blue-950 text-blue-300 border border-blue-800"
                        }`}>
                          {selectedUser.providerId === "google.com" ? "Tài khoản Google (google.com)" : "Tài khoản Email & Mật khẩu (password)"}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex flex-wrap items-center gap-2">
                        <span>Email: <strong className="text-slate-200">{selectedUser.email || "Không có email"}</strong></span>
                        <span>•</span>
                        <span>UID: <code className="text-teal-400 text-[10px]">{selectedUser.uid}</code></span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                        <span>Ngày tạo: {selectedUser.creationTime || (selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : "Gần đây")}</span>
                        <span>•</span>
                        <span>Lần đăng nhập cuối: {selectedUser.lastSignInTime || (selectedUser.lastLoginAt ? new Date(selectedUser.lastLoginAt).toLocaleString() : "Hôm nay")}</span>
                        <span>•</span>
                        <span className="text-emerald-400 font-medium">Mật khẩu: Đã băm Scrypt (Firebase Auth)</span>
                      </div>
                    </div>
                  </div>

                  {/* Chỉ số Thống kê định lượng Token & Chi phí */}
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block uppercase">Hội thoại / Tin nhắn</span>
                      <span className="text-white font-bold">{selectedUser.conversationCount ?? 0} chats / {selectedUser.totalMessagesCount ?? 0} msgs</span>
                    </div>
                    <div className="h-6 w-px bg-slate-800" />
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block uppercase">Token tiêu thụ</span>
                      <span className="text-teal-400 font-bold">{(selectedUser.totalTokensEstimated ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="h-6 w-px bg-slate-800" />
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block uppercase">Chi phí ước tính</span>
                      <span className="text-amber-400 font-bold">
                        ${(selectedUser.totalCostUsd ?? 0).toFixed(4)} (~{(selectedUser.totalCostVnd ?? 0).toLocaleString()}đ)
                      </span>
                    </div>
                  </div>
                </div>
              )}
              {selectedConv ? (
                <>
                  {/* Top Bar of Chat Inspector */}
                  <div className="px-6 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
                    <div>
                      <h3 className="text-xs font-bold text-white flex items-center gap-2">
                        <span>{selectedConv.title}</span>
                        <span className="text-[10px] text-slate-500 font-normal">
                          (ID: {selectedConv.id})
                        </span>
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Người dùng: <strong className="text-teal-400">{selectedUser?.displayName || selectedUser?.email}</strong>
                      </p>
                    </div>

                    {/* Quick Rating Badge */}
                    <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700">
                      <span className="text-[11px] text-slate-400">Đánh giá:</span>
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3.5 h-3.5 ${
                              star <= (selectedConv.rating || 0)
                                ? "text-amber-400 fill-amber-400"
                                : "text-slate-600"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Body: Messages List */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {messagesLoading ? (
                      <div className="p-12 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-teal-500" />
                        <span>Đang tải nội dung tin nhắn...</span>
                      </div>
                    ) : convMessages.length === 0 ? (
                      <div className="p-12 text-center text-xs text-slate-500">
                        Cuộc trò chuyện này chưa có tin nhắn nào.
                      </div>
                    ) : (
                      convMessages.map((m, idx) => {
                        const isUserMsg = m.role === "user";
                        return (
                          <div
                            key={m.id || idx}
                            className={`flex flex-col ${isUserMsg ? "items-end" : "items-start"}`}
                          >
                            <div className="flex items-center gap-2 mb-1 px-1 text-[10px] text-slate-500">
                              <span className="font-semibold text-slate-400">
                                {isUserMsg ? "Người dùng" : "LactaMed AI"}
                              </span>
                              <span>•</span>
                              <span>{formatConversationTime(m.timestamp)}</span>
                              {m.mode && (
                                <span className="px-1.5 py-0.2 rounded bg-slate-800 text-teal-400 border border-slate-700">
                                  {m.mode}
                                </span>
                              )}
                              {m.safetyLevel && m.safetyLevel !== "None" && (
                                <span className={`px-1.5 py-0.2 rounded font-bold ${
                                  m.safetyLevel === "Compatible" ? "bg-emerald-950 text-emerald-400 border border-emerald-800" :
                                  m.safetyLevel === "Caution" ? "bg-amber-950 text-amber-400 border border-amber-800" :
                                  "bg-red-950 text-red-400 border border-red-800"
                                }`}>
                                  {m.safetyLevel}
                                </span>
                              )}
                            </div>

                            <div
                              className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                                isUserMsg
                                  ? "bg-teal-600 text-white rounded-br-xs"
                                  : "bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-xs shadow-sm"
                              }`}
                            >
                              <div
                                className="prose prose-invert prose-xs max-w-none [&_p]:m-0 [&_ul]:my-1.5"
                                dangerouslySetInnerHTML={{
                                  __html: marked.parse(m.content || "", { breaks: true }) as string
                                }}
                              />

                              {/* Trích dẫn y văn nếu có */}
                              {m.citations && m.citations.length > 0 && (
                                <div className="mt-3 pt-2.5 border-t border-slate-800 space-y-1">
                                  <div className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                                    <FileText className="w-3 h-3 text-teal-400" />
                                    <span>Căn cứ trích dẫn y văn ({m.citations.length}):</span>
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {m.citations.map((c: any, cIdx: number) => (
                                      <span
                                        key={cIdx}
                                        className="text-[10px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300"
                                      >
                                        [{c.documentName || c.DocumentName || "Y văn"}]
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Bottom: Doctor Evaluation & Notes Drawer */}
                  <div className="p-4 border-t border-slate-800 bg-slate-900/60">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-bold text-white">Thẩm định & Chấm điểm Cuộc trò chuyện</span>
                      </div>
                      {evalSavedSuccess && (
                        <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Đã lưu thẩm định y khoa!</span>
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Rating selector */}
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Đánh giá chất lượng:</label>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => setEvalRating(star)}
                              className="p-1 hover:scale-110 transition cursor-pointer"
                            >
                              <Star
                                className={`w-5 h-5 ${
                                  star <= evalRating ? "text-amber-400 fill-amber-400" : "text-slate-700"
                                }`}
                              />
                            </button>
                          ))}
                          <span className="text-xs font-bold text-amber-400 ml-1.5">{evalRating} / 5</span>
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="md:col-span-2">
                        <label className="block text-[11px] text-slate-400 mb-1">Gắn nhãn nhận xét:</label>
                        <div className="flex flex-wrap gap-1.5 mb-1.5">
                          {evalTags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-teal-950 text-teal-300 border border-teal-800"
                            >
                              <span>{tag}</span>
                              <button onClick={() => handleRemoveTag(tag)} className="hover:text-white">✕</button>
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={evalTagInput}
                            onChange={(e) => setEvalTagInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddTag(evalTagInput); } }}
                            placeholder="Nhập nhãn (ví dụ: Chuẩn y khoa, Cần thêm y văn...)"
                            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddTag(evalTagInput)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700"
                          >
                            + Thêm
                          </button>
                        </div>
                      </div>

                      {/* Doctor Notes */}
                      <div className="md:col-span-3">
                        <label className="block text-[11px] text-slate-400 mb-1">Ghi chú chuyên môn:</label>
                        <div className="flex items-start gap-2">
                          <textarea
                            value={evalNotes}
                            onChange={(e) => setEvalNotes(e.target.value)}
                            rows={2}
                            placeholder="Nhập nhận xét chuyên môn, hướng dẫn điều chỉnh cho thuật toán hoặc đề xuất tài liệu..."
                            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 resize-none"
                          />
                          <button
                            onClick={handleSaveEvaluation}
                            disabled={savingEval}
                            className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer shrink-0"
                          >
                            {savingEval ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                            <span>Lưu Thẩm Định</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs gap-2">
                  <MessageSquare className="w-8 h-8 text-slate-700" />
                  <span>Vui lòng chọn một người dùng và cuộc hội thoại để bắt đầu giám sát</span>
                </div>
              )}
            </div>
          </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 2: INCIDENTS HUB                                         */}
        {/* ============================================================= */}
        {activeTab === "incidents" && (
          <div className="flex-1 flex overflow-hidden">
            {/* Cột trái: Bộ lọc & Danh sách sự cố */}
            <div className={`w-full lg:w-96 border-r border-slate-800 flex-col bg-slate-900/40 shrink-0 ${
              mobileIncidentView === "list" ? "flex" : "hidden lg:flex"
            }`}>
              <div className="p-3 border-b border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                    <span>Nhật ký Sự cố ({filteredIncidents.length})</span>
                  </h2>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Tình trạng:</label>
                    <select
                      value={incidentStatusFilter}
                      onChange={(e) => setIncidentStatusFilter(e.target.value)}
                      className="w-full text-xs bg-slate-800 border border-slate-700 rounded-lg p-1.5 text-white focus:outline-none"
                    >
                      <option value="all">Tất cả ({incidentsList.length})</option>
                      <option value="pending">Chờ xử lý ({incidentsList.filter(i => i.status === "pending").length})</option>
                      <option value="in_review">Đang xem xét ({incidentsList.filter(i => i.status === "in_review").length})</option>
                      <option value="resolved">Đã giải quyết ({incidentsList.filter(i => i.status === "resolved").length})</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Loại lỗi:</label>
                    <select
                      value={incidentTypeFilter}
                      onChange={(e) => setIncidentTypeFilter(e.target.value)}
                      className="w-full text-xs bg-slate-800 border border-slate-700 rounded-lg p-1.5 text-white focus:outline-none"
                    >
                      <option value="all">Tất cả loại lỗi</option>
                      <option value="user_reported">Người dùng báo lỗi</option>
                      <option value="refusal">Từ chối do thiếu y văn</option>
                      <option value="contraindicated_flag">Sai lệch an toàn</option>
                      <option value="model_timeout">Timeout / Lỗi mạng</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Danh sách các Incident Cards */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
                {filteredIncidents.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500">
                    Không có sự cố nào trong mục lọc này.
                  </div>
                ) : (
                  filteredIncidents.map((inc) => {
                    const isSelected = selectedIncident?.id === inc.id;
                    return (
                      <button
                        key={inc.id}
                        onClick={() => handleSelectIncident(inc)}
                        className={`w-full p-3 text-left transition cursor-pointer ${
                          isSelected
                            ? "bg-red-950/40 border-l-2 border-red-500"
                            : "hover:bg-slate-800/40 text-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                            inc.status === "pending" ? "bg-red-950 text-red-400 border border-red-800" :
                            inc.status === "in_review" ? "bg-amber-950 text-amber-400 border border-amber-800" :
                            "bg-emerald-950 text-emerald-400 border border-emerald-800"
                          }`}>
                            {inc.status === "pending" ? "Chờ duyệt" : inc.status === "in_review" ? "Đang xử lý" : "Đã sửa"}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {formatConversationTime(inc.createdAt)}
                          </span>
                        </div>

                        <div className="text-xs font-semibold text-white line-clamp-1">
                          "{inc.userQuery}"
                        </div>
                        {inc.errorMessage && (
                          <div className="text-[11px] text-red-300/80 line-clamp-1 mt-0.5">
                            Lỗi: {inc.errorMessage}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400 mt-1">
                          Người gửi: {inc.userEmail || inc.userId || "Khách"}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Cột phải: Chi tiết Sự cố & Công cụ Sửa lỗi Model */}
            <div className={`flex-1 flex-col overflow-hidden bg-slate-950 ${
              mobileIncidentView === "detail" ? "flex" : "hidden lg:flex"
            }`}>
              {/* Nút quay lại danh sách sự cố trên Mobile */}
              <div className="lg:hidden p-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
                <button
                  type="button"
                  onClick={() => setMobileIncidentView("list")}
                  className="text-xs text-teal-400 hover:text-teal-300 font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Danh Sách Sự Cố ({filteredIncidents.length})</span>
                </button>
                <span className="text-[11px] text-slate-400 font-mono">
                  {selectedIncident ? `#${selectedIncident.id.slice(0, 8)}` : ""}
                </span>
              </div>

              {selectedIncident ? (
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Header Incident */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-red-400 uppercase">SỰ CỐ #{selectedIncident.id}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          selectedIncident.status === "pending" ? "bg-red-500/20 text-red-300 border border-red-500/30" :
                          selectedIncident.status === "in_review" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" :
                          "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        }`}>
                          {selectedIncident.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Thời gian tạo: {formatConversationTime(selectedIncident.createdAt)} • Người báo: {selectedIncident.userEmail || selectedIncident.userId}
                      </p>
                    </div>

                    {/* Quick switch to Knowledge Base */}
                    <button
                      onClick={() => {
                        setActiveTab("knowledge");
                        setCrawlUrl("");
                      }}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Database className="w-3.5 h-3.5" />
                      <span>Nạp Bổ Sung Y Văn</span>
                    </button>
                  </div>

                  {/* Câu hỏi của người dùng */}
                  <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800">
                    <div className="text-[11px] font-bold text-slate-400 mb-1 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-teal-400" />
                      <span>Câu hỏi của Người dùng:</span>
                    </div>
                    <div className="text-sm font-semibold text-white">
                      {selectedIncident.userQuery}
                    </div>
                    {selectedIncident.errorMessage && (
                      <div className="mt-2 p-2.5 bg-red-950/40 border border-red-800/50 rounded-xl text-xs text-red-300">
                        <strong>Ghi chú phản ánh:</strong> {selectedIncident.errorMessage}
                      </div>
                    )}
                  </div>

                  {/* Phản hồi gốc của Model (nếu có) */}
                  {selectedIncident.botResponse && (
                    <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800">
                      <div className="text-[11px] font-bold text-slate-400 mb-1 flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-amber-400" />
                        <span>Phản hồi thực tế của AI bị báo lỗi:</span>
                      </div>
                      <div 
                        className="text-xs text-slate-300 prose prose-invert prose-xs max-w-none leading-relaxed [&_p]:m-0"
                        dangerouslySetInnerHTML={{
                          __html: marked.parse(selectedIncident.botResponse, { breaks: true }) as string
                        }}
                      />
                    </div>
                  )}

                  {/* Khu vực Bác sĩ thẩm định & Soạn câu trả lời chuẩn xác */}
                  <div className="p-5 bg-teal-950/30 rounded-2xl border border-teal-800/50 space-y-4">
                    <div className="flex items-center gap-2 text-teal-400 font-bold text-xs uppercase tracking-wider">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Hiệu chỉnh Chuyên môn & Khắc phục Sự cố</span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Câu trả lời chuẩn y khoa sau khi thẩm định:
                      </label>
                      <textarea
                        value={incidentCorrectedResponse}
                        onChange={(e) => setIncidentCorrectedResponse(e.target.value)}
                        rows={4}
                        placeholder="Soạn câu trả lời chính xác, bổ sung liều lượng và cảnh báo cho người mẹ..."
                        className="w-full bg-slate-900 border border-teal-900 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-400 resize-none font-sans leading-relaxed"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Ghi chú nội bộ dành cho bác sĩ & quản trị viên:
                      </label>
                      <textarea
                        value={incidentAdminNotes}
                        onChange={(e) => setIncidentAdminNotes(e.target.value)}
                        rows={2}
                        placeholder="Lý do sai lệch, hướng bổ sung dữ liệu trong đợt cập nhật tiếp theo..."
                        className="w-full bg-slate-900 border border-teal-900 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-400 resize-none"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">Đổi trạng thái:</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateIncidentStatus("pending")}
                          className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition cursor-pointer ${
                            selectedIncident.status === "pending"
                              ? "bg-red-600 text-white"
                              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                          }`}
                        >
                          Chờ duyệt
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateIncidentStatus("in_review")}
                          className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition cursor-pointer ${
                            selectedIncident.status === "in_review"
                              ? "bg-amber-600 text-white"
                              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                          }`}
                        >
                          Đang xem xét
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateIncidentStatus("resolved")}
                          className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition cursor-pointer ${
                            selectedIncident.status === "resolved"
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                          }`}
                        >
                          Đã giải quyết
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleUpdateIncidentStatus(selectedIncident.status)}
                        disabled={updatingIncident}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer shadow-md shadow-teal-950"
                      >
                        {updatingIncident ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        <span>Lưu Thay Đổi Sự Cố</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs gap-2">
                  <AlertTriangle className="w-8 h-8 text-slate-700" />
                  <span>Chọn một sự cố từ danh sách bên trái để kiểm tra và xử lý</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 3: MODEL SETTINGS & QUOTA TRACKER                         */}
        {/* ============================================================= */}
        {activeTab === "models" && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-5xl mx-auto w-full">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                  <span>Mô Hình Đang Chạy</span>
                  <Cpu className="w-4 h-4 text-teal-400" />
                </div>
                <div className="text-sm font-bold text-white truncate" title={modelConfig?.chatModel || modelConfig?.model}>
                  {modelConfig?.chatModel || modelConfig?.model || "Đang tải..."}
                </div>
                <div className="text-[10px] text-teal-400 mt-1 font-mono">
                  Provider: {modelConfig?.provider.toUpperCase() || "GEMINI"}
                </div>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                  <span>Tổng Yêu Cầu (Requests)</span>
                  <Activity className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-xl font-bold text-white">
                  {metrics?.totalChatRequests ?? 0}
                </div>
                <div className="text-[10px] text-emerald-400 mt-1">
                  {metrics?.successfulRequests ?? 0} thành công • {metrics?.failedRequests ?? 0} thất bại
                </div>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                  <span>Ước Tính Token Tiêu Thụ</span>
                  <Zap className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-xl font-bold text-white">
                  {((metrics?.totalTokensEstimated ?? 0) / 1000).toFixed(1)}k <span className="text-xs font-normal text-slate-400">tokens</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  In: {((metrics?.estimatedInputTokens ?? 0) / 1000).toFixed(1)}k • Out: {((metrics?.estimatedOutputTokens ?? 0) / 1000).toFixed(1)}k
                </div>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                  <span>Thời Gian Hoạt Động (Uptime)</span>
                  <Clock className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-xl font-bold text-white">
                  {Math.floor((metrics?.uptimeSeconds ?? 0) / 60)} <span className="text-xs font-normal text-slate-400">phút</span>
                </div>
                <div className="text-[10px] text-indigo-300 mt-1">
                  Đổi model gần nhất: {modelConfig?.lastSwitchedAtUtc ? new Date(modelConfig.lastSwitchedAtUtc).toLocaleTimeString() : "Ban đầu"}
                </div>
              </div>
            </div>

            {/* Fallback Cascades Info Box */}
            {modelConfig?.chatModels && modelConfig.chatModels.length > 1 && (
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                <div className="flex items-center gap-2 text-xs font-bold text-teal-400 uppercase tracking-wider mb-2">
                  <Layers className="w-4 h-4" />
                  <span>Danh Sách Fallback Tự Động (Model Cascade Khi Quota/Error)</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {(modelConfig.chatModels || []).map((m, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <span className={`text-xs px-2.5 py-1 rounded-lg border font-mono ${
                        idx === 0 
                          ? "bg-teal-950 text-teal-300 border-teal-700 font-bold"
                          : "bg-slate-800 text-slate-300 border-slate-700"
                      }`}>
                        {idx === 0 ? "★ " : `${idx + 1}. `}{m}
                      </span>
                      {idx < (modelConfig.chatModels?.length ?? 0) - 1 && (
                        <span className="text-slate-600 text-xs">→</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Form Cấu hình Hot-Swap Model */}
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <Sliders className="w-5 h-5 text-teal-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white">Chuyển Đổi Mô Hình AI Runtime (Hot-Swap)</h3>
                    <p className="text-xs text-slate-400">Thay đổi nhà cung cấp, model và API key trực tiếp không cần khởi động lại máy chủ.</p>
                  </div>
                </div>

                <button
                  onClick={() => loadModelConfigAndMetrics(adminKey)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${modelLoading ? "animate-spin" : ""}`} />
                  <span>Tải lại</span>
                </button>
              </div>

              <form onSubmit={handleSaveModelConfig} className="space-y-6">
                {/* ========================================================= */}
                {/* HEADER 1: MÔ HÌNH SINH VĂN BẢN (TEXT GENERATION - CASCADE) */}
                {/* ========================================================= */}
                <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-teal-400 uppercase tracking-wider">
                      <Cpu className="w-4 h-4" />
                      <span>1. Mô Hình Sinh Văn Bản (Text Generation Models - Cascade Flow)</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleResetCascade}
                      className="text-[11px] text-teal-400 hover:underline cursor-pointer"
                    >
                      Khôi phục chuỗi chuẩn (3.5 ➔ 3.1 ➔ 2.5)
                    </button>
                  </div>

                  <p className="text-xs text-slate-400">
                    Chọn nhiều mô hình theo thứ tự ưu tiên. Khi mô hình đầu tiên hết hạn mức (Quota 429) hoặc xảy ra sự cố, hệ thống sẽ tự động chuyển đổi sang mô hình dự phòng tiếp theo theo chiều mũi tên.
                  </p>

                  {/* Thanh trực quan chuỗi mũi tên Cascade */}
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1.5">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      Chuỗi Ưu Tiên Hiện Tại ({cascadeList.length} mô hình):
                    </div>
                    <div className="flex flex-wrap items-center gap-2 min-h-[40px]">
                      {cascadeList.length === 0 ? (
                        <span className="text-slate-500 text-xs italic">
                          Chưa có mô hình nào trong chuỗi. Hệ thống sẽ sử dụng biến môi trường mặc định.
                        </span>
                      ) : (
                        cascadeList.map((m, idx) => (
                          <React.Fragment key={m}>
                            {idx > 0 && <span className="text-teal-400 font-bold text-sm">➔</span>}
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-950 border border-teal-700 text-teal-200 text-xs font-mono font-bold shadow-sm">
                              <span className="w-4 h-4 rounded-full bg-teal-800 text-[10px] text-teal-300 flex items-center justify-center font-bold">
                                {idx + 1}
                              </span>
                              <span>{m}</span>
                              {idx === 0 && (
                                <span className="text-[9px] bg-emerald-900 text-emerald-300 px-1 py-0.2 rounded font-sans font-bold">
                                  Active
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemoveCascadeModel(m)}
                                className="text-slate-400 hover:text-red-400 ml-1 cursor-pointer"
                                title="Xóa khỏi chuỗi ưu tiên"
                              >
                                ✕
                              </button>
                            </div>
                          </React.Fragment>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Danh sách đề xuất mô hình từ catalog */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-slate-300">
                        Mô Hình Khuyên Dùng Cho Lâm Sàng (Bấm thẻ để thêm/bớt khỏi chuỗi):
                      </label>
                      <span className="text-[10px] text-teal-400 font-medium">Hạn mức cao, phản hồi nhanh</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {((modelsCatalog?.googleStudio?.chatModels?.filter(m => m.recommended || ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-2.5-flash", "gemini-1.5-flash", "gemini-1.5-pro"].includes(m.id)) || [
                        { id: "gemini-3.5-flash-lite", name: "Gemini 3.5 Flash Lite", tag: "Mới nhất - Cascade 1", rpm: "3 / 15", tpm: "4.42K / 250K", rpd: "29 / 500", desc: "Tối ưu tốc độ, chi phí thấp, hạn mức cao 500 RPD" },
                        { id: "gemini-3.1-flash-lite", name: "Gemini 3.1 Flash Lite", tag: "Dự phòng - Cascade 2", rpm: "0 / 15", tpm: "0 / 250K", rpd: "0 / 500", desc: "Thế hệ 3.1 Flash Lite, 500 RPD, độ trễ cực thấp" },
                        { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", tag: "Flagship 2.5", rpm: "0 / 5", tpm: "0 / 250K", rpd: "0 / 20", desc: "Chất lượng lâm sàng cao, phân tích y văn chính xác" },
                        { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", tag: "Ngữ cảnh 1M", rpm: "0 / 15", tpm: "0 / 1M", rpd: "0 / 1500", desc: "Ổn định cao, ngữ cảnh 1M tokens" },
                        { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", tag: "Suy luận sâu", rpm: "0 / 2", tpm: "0 / 32K", rpd: "0 / 50", desc: "Phân tích y khoa đa nguồn cho các ca bệnh khó" }
                      ]) as ModelCatalogItem[]).map((m) => {
                        const inCascadeIndex = cascadeList.indexOf(m.id);
                        const isInCascade = inCascadeIndex !== -1;
                        return (
                          <div
                            key={m.id}
                            onClick={() => handleToggleCascadeModel(m.id)}
                            className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                              isInCascade
                                ? "bg-teal-950/60 border-teal-500 text-teal-200 shadow-sm"
                                : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <span className="text-xs font-mono font-bold truncate">{m.name}</span>
                                <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                                  isInCascade ? "bg-teal-800 text-teal-200" : "bg-slate-800 text-slate-400"
                                }`}>
                                  {isInCascade ? `Thứ tự #${inCascadeIndex + 1}` : "+ Thêm"}
                                </span>
                              </div>
                              <span className="text-[10px] text-teal-400/90 font-medium block">{m.tag}</span>
                              <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{m.desc}</p>
                            </div>
                            {m.rpm && (
                              <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[9px] font-mono text-slate-400">
                                <span>RPM: <strong className="text-slate-200">{m.rpm}</strong></span>
                                <span>TPM: <strong className="text-slate-200">{m.tpm}</strong></span>
                                <span>RPD: <strong className="text-slate-200">{m.rpd}</strong></span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Accordion mở rộng các mô hình Gemini khác */}
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => setShowAllModels(!showAllModels)}
                        className="text-xs text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1.5 py-1.5 cursor-pointer"
                      >
                        <span>{showAllModels ? "▲ Thu gọn các mô hình khác" : `▼ Xem thêm các mô hình Gemini khác (${modelsCatalog?.googleStudio?.chatModels ? Math.max(0, modelsCatalog.googleStudio.chatModels.length - 5) : 11} models)`}</span>
                      </button>

                      {showAllModels && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 mt-2.5 pt-2.5 border-t border-slate-800 animate-in fade-in">
                          {((modelsCatalog?.googleStudio?.chatModels?.filter(m => !["gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-2.5-flash", "gemini-1.5-flash", "gemini-1.5-pro"].includes(m.id)) || []) as ModelCatalogItem[]).map((m) => {
                            const inCascadeIndex = cascadeList.indexOf(m.id);
                            const isInCascade = inCascadeIndex !== -1;
                            return (
                              <div
                                key={m.id}
                                onClick={() => handleToggleCascadeModel(m.id)}
                                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                                  isInCascade
                                    ? "bg-teal-950/60 border-teal-500 text-teal-200 shadow-sm"
                                    : "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700"
                                }`}
                              >
                                <div>
                                  <div className="flex items-center justify-between gap-1 mb-1">
                                    <span className="text-xs font-mono font-bold truncate">{m.name}</span>
                                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                                      isInCascade ? "bg-teal-800 text-teal-200" : "bg-slate-800 text-slate-400"
                                    }`}>
                                      {isInCascade ? `Thứ tự #${inCascadeIndex + 1}` : "+ Thêm"}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-medium block">{m.tag || m.category}</span>
                                  <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">{m.desc}</p>
                                </div>
                                {m.rpm && (
                                  <div className="mt-2 pt-1 border-t border-slate-800/60 flex items-center justify-between text-[9px] font-mono text-slate-500">
                                    <span>RPM: {m.rpm}</span>
                                    <span>TPM: {m.tpm}</span>
                                    <span>RPD: {m.rpd}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-slate-400 whitespace-nowrap">Chuỗi model tùy chỉnh:</span>
                    <input
                      type="text"
                      value={editChatModel}
                      onChange={(e) => { setEditChatModel(e.target.value); setTestResult(null); }}
                      placeholder="gemini-3.5-flash-lite,gemini-3.1-flash-lite,gemini-2.5-flash-lite..."
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
                    />
                  </div>
                </div>

                {/* ========================================================= */}
                {/* HEADER 2: MÔ HÌNH VECTOR EMBEDDING (GOOGLE AI STUDIO)      */}
                {/* ========================================================= */}
                <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-teal-400 uppercase tracking-wider">
                    <Database className="w-4 h-4" />
                    <span>2. Mô Hình Tính Toán Vector Embedding (Cố Định Google AI Studio)</span>
                  </div>

                  <p className="text-xs text-slate-400">
                    Cố định sử dụng Google AI Studio với định dạng vector 3072 chiều để đồng bộ và truy vấn chính xác 100% trên Qdrant Vector Cloud.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {((modelsCatalog?.googleStudio?.embeddingModels || [
                      { id: "gemini-embedding-001", name: "Gemini Embedding 1", dimensions: 3072, rpm: "66 / 100", tpm: "20.07K / 30K", rpd: "197 / 1K", desc: "Chuẩn vector 3072 chiều khớp hoàn hảo với Qdrant Cloud", tag: "Khuyên dùng - Chuẩn Qdrant Cloud" },
                      { id: "gemini-embedding-002", name: "Gemini Embedding 2", dimensions: 3072, rpm: "0 / 100", tpm: "0 / 30K", rpd: "0 / 1K", desc: "Model Embedding thế hệ 2 của Google AI Studio", tag: "Dự phòng" }
                    ]) as ModelCatalogItem[]).map((em) => {
                      const isSelected = editEmbeddingModel.includes(em.id);
                      return (
                        <div
                          key={em.id}
                          onClick={() => { setEditEmbeddingModel(em.id); setTestResult(null); }}
                          className={`p-3.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? "bg-teal-950/60 border-teal-500 text-teal-200 shadow-sm"
                              : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-mono font-bold text-white">{em.name}</span>
                              <span className={`text-[9px] px-2 py-0.2 rounded-full font-bold uppercase ${
                                isSelected ? "bg-teal-800 text-teal-200" : "bg-slate-800 text-slate-500"
                              }`}>
                                {isSelected ? "Đang Chọn" : "Dự Phòng"}
                              </span>
                            </div>
                            <span className="text-[10px] text-teal-400 font-semibold">{em.tag}</span>
                            <p className="text-[10px] text-slate-400 mt-1">{em.desc}</p>
                          </div>
                          {em.rpm && (
                            <div className="mt-2 pt-2 border-t border-slate-800 text-[9px] font-mono text-slate-400 flex justify-between">
                              <span>RPM: <strong>{em.rpm}</strong></span>
                              <span>TPM: <strong>{em.tpm}</strong></span>
                              <span>RPD: <strong>{em.rpd}</strong></span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ========================================================= */}
                {/* HEADER 3: TÙY CHỌN PROVIDER BÊN NGOÀI (9ROUTER / OPENAI)   */}
                {/* ========================================================= */}
                <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
                    <Globe className="w-4 h-4" />
                    <span>3. Tùy Chọn Nhà Cung Cấp Bên Ngoài (9router / OpenRouter)</span>
                  </div>

                  <p className="text-xs text-slate-400">
                    Chỉ áp dụng để sinh câu trả lời văn bản (Text Generation). Hệ thống tự động bảo lưu Google AI Studio Embedding để không làm gián đoạn cơ sở dữ liệu vector.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div
                      onClick={() => {
                        setEditProvider("gemini");
                        setEditBaseUrl("https://generativelanguage.googleapis.com");
                        setTestResult(null);
                      }}
                      className={`p-3.5 rounded-xl border-2 flex items-start gap-3 cursor-pointer transition ${
                        editProvider === "gemini"
                          ? "bg-teal-950/40 border-teal-500 text-white"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 ${
                        editProvider === "gemini" ? "border-teal-400" : "border-slate-600"
                      }`}>
                        {editProvider === "gemini" && <div className="w-2 h-2 rounded-full bg-teal-400" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white">Google AI Studio</span>
                          <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-bold">100% Free</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">Sử dụng API chính hãng của Google AI Studio.</p>
                      </div>
                    </div>

                    <div
                      onClick={() => {
                        setEditProvider("custom_openai");
                        setEditBaseUrl("https://api.9router.com/v1");
                        setEditChatModel("gpt-4o-mini");
                        setTestResult(null);
                      }}
                      className={`p-3.5 rounded-xl border-2 flex items-start gap-3 cursor-pointer transition ${
                        editProvider === "custom_openai"
                          ? "bg-indigo-950/40 border-indigo-500 text-white"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 ${
                        editProvider === "custom_openai" ? "border-indigo-400" : "border-slate-600"
                      }`}>
                        {editProvider === "custom_openai" && <div className="w-2 h-2 rounded-full bg-indigo-400" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white">Bên Thứ Ba (9router / OpenRouter)</span>
                          <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded font-bold">OpenAI Gateway</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">Cổng API router ngoài cho phép sử dụng OpenAI, DeepSeek, Claude.</p>
                      </div>
                    </div>
                  </div>

                  {editProvider === "custom_openai" && (
                    <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-3 animate-in fade-in">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1.5">
                          Chọn Nhanh Cổng Provider Router:
                        </label>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditBaseUrl("https://api.9router.com/v1");
                              setEditChatModel("gpt-4o-mini");
                              setTestResult(null);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                              editBaseUrl.includes("9router")
                                ? "bg-indigo-900/60 text-indigo-300 border-indigo-500"
                                : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
                            }`}
                          >
                            ★ 9router AI Gateway
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditBaseUrl("https://openrouter.ai/api/v1");
                              setEditChatModel("deepseek/deepseek-chat");
                              setTestResult(null);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                              editBaseUrl.includes("openrouter")
                                ? "bg-indigo-900/60 text-indigo-300 border-indigo-500"
                                : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
                            }`}
                          >
                            OpenRouter
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditBaseUrl("https://api.openai.com/v1");
                              setEditChatModel("gpt-4o-mini");
                              setTestResult(null);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                              editBaseUrl.includes("openai.com")
                                ? "bg-indigo-900/60 text-indigo-300 border-indigo-500"
                                : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
                            }`}
                          >
                            OpenAI Official
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          Base URL của Router:
                        </label>
                        <input
                          type="text"
                          value={editBaseUrl}
                          onChange={(e) => { setEditBaseUrl(e.target.value); setTestResult(null); }}
                          placeholder="https://api.9router.com/v1"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          API Key Bên Thứ Ba:
                        </label>
                        <div className="relative">
                          <input
                            type={showApiKey ? "text" : "password"}
                            value={editApiKey}
                            onChange={(e) => { setEditApiKey(e.target.value); setTestResult(null); }}
                            placeholder="Dán API Key của 9router hoặc bên thứ ba..."
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 pr-16 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowApiKey(!showApiKey)}
                            className="absolute right-2 top-2 text-[10px] text-slate-400 hover:text-white"
                          >
                            {showApiKey ? "Ẩn" : "Hiện"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {editProvider === "gemini" && (
                    <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-300">
                          Google AI Studio API Key (Để trống nếu dùng key hiện tại trong cấu hình):
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="text-[10px] text-slate-400 hover:text-white cursor-pointer"
                        >
                          {showApiKey ? "Ẩn bớt" : "Hiện mã key"}
                        </button>
                      </div>
                      <input
                        type={showApiKey ? "text" : "password"}
                        value={editApiKey}
                        onChange={(e) => { setEditApiKey(e.target.value); setTestResult(null); }}
                        placeholder="Dán Gemini API Key mới nếu muốn thay đổi..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  )}
                </div>

                {/* Test Result Banner */}
                {testResult && (
                  <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 animate-in fade-in ${
                    testResult.success
                      ? "bg-emerald-950/60 text-emerald-300 border-emerald-800"
                      : "bg-red-950/60 text-red-300 border-red-800"
                  }`}>
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-0.5">
                      <p className="font-bold">
                        {testResult.success 
                          ? `Kết nối thành công tới ${editChatModel} (Độ trễ: ${testResult.latencyMs}ms)`
                          : `Kết nối thất bại (${testResult.latencyMs}ms)`}
                      </p>
                      <p className="text-[11px] text-slate-300">
                        {testResult.success ? `Phản hồi mẫu: "${testResult.reply}"` : testResult.error}
                      </p>
                    </div>
                  </div>
                )}

                {/* Action Buttons: Ping Test & Apply */}
                <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={handleTestModelConnection}
                    disabled={testingModel}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-teal-300 font-semibold text-xs rounded-xl flex items-center gap-2 border border-slate-700 transition disabled:opacity-50 cursor-pointer"
                  >
                    {testingModel ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang kiểm tra kết nối...</span>
                      </>
                    ) : (
                      <>
                        <Activity className="w-4 h-4 text-teal-400" />
                        <span>Kiểm Tra Kết Nối (Ping Test)</span>
                      </>
                    )}
                  </button>

                  <button
                    type="submit"
                    disabled={savingModel}
                    className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition disabled:opacity-50 cursor-pointer shadow-lg shadow-teal-950"
                  >
                    {savingModel ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang hoán đổi Model...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        <span>Áp Dụng Cấu Hình Mới Ngay Lập Tức</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 4: KNOWLEDGE BASE & CRAWLER                              */}
        {/* ============================================================= */}
        {activeTab === "knowledge" && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-5xl mx-auto w-full">
            {/* Sub-tab Switcher: Crawl URL vs Upload File */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setKnowledgeSubTab("crawl")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                    knowledgeSubTab === "crawl"
                      ? "bg-teal-600 text-white shadow-md shadow-teal-950"
                      : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800"
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  <span>Trích Xuất Y Văn Từ URL</span>
                </button>

                <button
                  onClick={() => setKnowledgeSubTab("upload")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                    knowledgeSubTab === "upload"
                      ? "bg-teal-600 text-white shadow-md shadow-teal-950"
                      : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800"
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  <span>Nạp Tài Liệu Chuyên Môn</span>
                </button>
              </div>

              <button
                onClick={loadDocs}
                className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${docsLoading ? "animate-spin" : ""}`} />
                <span>Làm mới danh mục</span>
              </button>
            </div>

            {/* Input Action Card */}
            {knowledgeSubTab === "crawl" ? (
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-teal-400 uppercase tracking-wider">
                  <Globe className="w-4 h-4" />
                  <span>Thu Thập Chuyên Luận Y Khoa Trực Tuyến</span>
                </div>
                <p className="text-xs text-slate-400">
                  Hệ thống tự động trích xuất nội dung bài viết, bóc tách thẻ HTML thừa, chia nhỏ văn bản và đồng bộ vector trực tiếp lên Qdrant Cloud.
                </p>

                <form onSubmit={handleCrawl} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="url"
                    value={crawlUrl}
                    onChange={(e) => setCrawlUrl(e.target.value)}
                    placeholder="Dán đường dẫn bài viết y khoa (ví dụ: https://vinmec.com/... hay NIH...)"
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 font-sans"
                  />
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleInspectUrl}
                      disabled={inspectingUrl || !crawlUrl.trim()}
                      className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer border border-slate-700 shrink-0"
                      title="Kiểm tra sơ bộ nội dung bài viết trước khi cào"
                    >
                      {inspectingUrl ? (
                        <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-teal-400" />
                      )}
                      <span>Kiểm tra link</span>
                    </button>
                    <button
                      type="submit"
                      disabled={crawling || !crawlUrl.trim()}
                      className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition disabled:opacity-50 cursor-pointer shrink-0 shadow-lg shadow-teal-950"
                    >
                      {crawling ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Đang trích xuất nội dung...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Thu Thập & Đồng Bộ Vector</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {inspectionResult && (
                  <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 text-xs space-y-2 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-teal-300 font-bold">
                        <CheckCircle className="w-4 h-4 text-teal-400" />
                        <span>Kết Quả Kiểm Tra Sơ Bộ: {inspectionResult.title || "Trang web y tế"}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        inspectionResult.quality === "good" ? "bg-emerald-950 text-emerald-300 border border-emerald-800" : "bg-amber-950 text-amber-300 border border-amber-800"
                      }`}>
                        Chất lượng: {inspectionResult.quality}
                      </span>
                    </div>
                    <div className="text-slate-400 text-[11px] flex gap-4">
                      <span>Độ dài văn bản: <strong>{inspectionResult.textLength}</strong> ký tự</span>
                      <span>Số đoạn văn: <strong>{inspectionResult.paragraphCount}</strong></span>
                      <span>Hình ảnh: <strong>{inspectionResult.imageCount}</strong></span>
                    </div>
                    {inspectionResult.previewSnippet && (
                      <p className="text-slate-400 text-[11px] line-clamp-2 italic bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                        "{inspectionResult.previewSnippet}"
                      </p>
                    )}
                    {inspectionResult.shouldWarn && showWarningModal && inspectionResult.warningMessage && (
                      <div className="p-3 bg-amber-950/70 border border-amber-800 rounded-xl text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>{inspectionResult.warningMessage}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => setShowWarningModal(false)}
                            className="text-[11px] text-slate-400 hover:text-white px-2 py-1 rounded cursor-pointer"
                          >
                            Đóng cảnh báo
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCrawl()}
                            disabled={crawling}
                            className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg transition cursor-pointer"
                          >
                            Vẫn Thu Thập Nguồn Này
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-teal-400 uppercase tracking-wider">
                  <Upload className="w-4 h-4" />
                  <span>Nạp Chuyên Luận Y Khoa Cục Bộ</span>
                </div>
                <p className="text-xs text-slate-400">
                  Hỗ trợ định dạng văn bản thô (.txt, .md) hoặc tài liệu PDF chuyên khảo.
                </p>

                <form onSubmit={handleUpload} className="flex items-center gap-3">
                  <input
                    id="portal-upload-input"
                    type="file"
                    accept=".txt,.md,.pdf"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="text-xs text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-teal-400 hover:file:bg-slate-700 cursor-pointer"
                  />
                  <button
                    type="submit"
                    disabled={uploadingFile || !selectedFile}
                    className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition disabled:opacity-50 cursor-pointer shadow-lg shadow-teal-950"
                  >
                    {uploadingFile ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang xử lý tệp...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>Nạp & Đồng Bộ Vector</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* Hộp Thông Tin Lưu Trữ 2 Tầng */}
            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-start gap-3 text-xs text-slate-400">
              <Database className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold text-slate-200">Cơ chế Lưu trữ & Tham chiếu 2 Tầng (Raw & Normalized Markdown):</span>
                <p className="text-[11px] leading-relaxed">
                  Tầng 1 (Raw) lưu trữ tệp hoặc HTML nguyên gốc tại <code className="text-teal-400 font-mono">storage/documents/raw/</code>. Tầng 2 (Normalized) lưu trữ tệp Markdown đồng nhất phục vụ phân đoạn vector RAG. Hai tệp liên kết chặt chẽ qua ID: khi xóa tài liệu gốc, hệ thống tự động xóa cả bản chuẩn hóa và giải phóng vector trên Qdrant Cloud.
                </p>
              </div>
            </div>

            {/* Document List Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Danh Mục Tài Liệu Đã Nạp ({documents.length})
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Đồng bộ 2 chiều giữa Cơ sở dữ liệu SQLite và Qdrant Vector Cloud.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Tên Tài Liệu</th>
                      <th className="px-4 py-3">Nguồn</th>
                      <th className="px-4 py-3">Số Lượng Chunks</th>
                      <th className="px-4 py-3">Dung Lượng</th>
                      <th className="px-4 py-3">Ngày Cập Nhật</th>
                      <th className="px-4 py-3 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {docsLoading ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                          <Loader2 className="w-5 h-5 animate-spin mx-auto text-teal-500 mb-2" />
                          <span>Đang nạp danh mục tài liệu...</span>
                        </td>
                      </tr>
                    ) : documents.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                          Chưa có tài liệu nào trong hệ thống. Hãy nạp file hoặc cào từ URL phía trên.
                        </td>
                      </tr>
                    ) : (
                      documents.map((doc) => {
                        const cleanTitle = cleanDocDisplayTitle(doc.title, doc.fileName);
                        return (
                          <tr key={doc.id} className="hover:bg-slate-800/40 transition">
                            <td className="px-4 py-3">
                              <div 
                                onClick={() => handleOpenDocViewer(doc.id)}
                                className="font-semibold text-white flex items-center gap-2 cursor-pointer hover:text-teal-300 transition"
                                title="Nhấn để mở xem toàn văn định dạng đẹp"
                              >
                                <FileText className="w-4 h-4 text-teal-400 shrink-0" />
                                <span className="truncate max-w-sm" title={cleanTitle}>
                                  {cleanTitle}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-500 mt-0.5 truncate max-w-sm font-mono">
                                Tệp: {doc.fileName}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {doc.sourceType === "crawled" || doc.sourceUrl ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800">
                                  <Globe className="w-3 h-3" />
                                  <span>Nguồn Web</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-800">
                                  <Upload className="w-3 h-3" />
                                  <span>Tệp Cục Bộ</span>
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-950 text-teal-300 border border-teal-800">
                                {doc.chunkCount} đoạn y văn
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                              {(doc.fileSizeBytes / 1024).toFixed(1)} KB
                            </td>
                            <td className="px-4 py-3 text-slate-400 text-[11px]">
                              {new Date(doc.uploadedAtUtc).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => handleOpenDocViewer(doc.id)}
                                  className="p-1.5 text-slate-400 hover:text-teal-300 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                                  title="Xem toàn văn tài liệu định dạng đẹp"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteDoc(doc.id, cleanTitle)}
                                  className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                                  title="Xóa tài liệu và giải phóng vector trên Qdrant"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* DOCUMENT VIEWER MODAL / DRAWER (XEM VĂN BẢN ĐẸP)            */}
        {/* ============================================================= */}
        {(viewingDoc || docDetailLoading) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-slate-100">
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950/80">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 truncate">
                      <span>{viewingDoc ? cleanDocDisplayTitle(viewingDoc.title, viewingDoc.fileName) : "Đang tải tài liệu..."}</span>
                    </h3>
                    {viewingDoc && (
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span className="truncate max-w-xs text-slate-300 font-mono">Tệp: {viewingDoc.fileName}</span>
                        <span>•</span>
                        <span className="text-teal-400 font-semibold">{viewingDoc.chunkCount} đoạn y văn</span>
                        <span>•</span>
                        <span>{(viewingDoc.fileSizeBytes / 1024).toFixed(1)} KB</span>
                        {/* Kiểm tra link nguồn cào web nếu có */}
                        {(() => {
                          const urlMatch = viewingDoc.content.match(/NGUỒN TRÍCH DẪN GỐC:\s*(https?:\/\/[^\s\n\r]+)/i);
                          if (urlMatch && urlMatch[1]) {
                            return (
                              <>
                                <span>•</span>
                                <a
                                  href={urlMatch[1]}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-teal-400 hover:text-teal-300 hover:underline flex items-center gap-1 font-medium"
                                  title={urlMatch[1]}
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  <span>Nguồn gốc bài cào ↗</span>
                                </a>
                              </>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {viewingDoc && (
                    <>
                      {/* Chuyển đổi chế độ xem đẹp / thô */}
                      <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1">
                        <button
                          type="button"
                          onClick={() => setDocViewMode("formatted")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                            docViewMode === "formatted"
                              ? "bg-teal-600 text-white shadow-sm"
                              : "text-slate-400 hover:text-white"
                          }`}
                          title="Định dạng bài viết đẹp với Markdown & typography"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Định dạng đẹp</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDocViewMode("raw")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                            docViewMode === "raw"
                              ? "bg-teal-600 text-white shadow-sm"
                              : "text-slate-400 hover:text-white"
                          }`}
                          title="Xem văn bản thô nguyên bản"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Văn bản thô</span>
                        </button>
                      </div>

                      {/* Nút Copy */}
                      <button
                        type="button"
                        onClick={handleCopyDocContent}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
                        title="Sao chép toàn bộ văn bản thô"
                      >
                        {copiedDocContent ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Đã chép</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Sao chép</span>
                          </>
                        )}
                      </button>

                      {/* Nút Tải .txt */}
                      <button
                        type="button"
                        onClick={handleDownloadDoc}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition cursor-pointer"
                        title="Tải tệp .txt về máy"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setViewingDoc(null)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Sub-header: Tìm kiếm từ khóa trong tài liệu */}
              {viewingDoc && (
                <div className="px-6 py-2.5 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                    <input
                      type="text"
                      value={docSearchQuery}
                      onChange={(e) => setDocSearchQuery(e.target.value)}
                      placeholder="Tìm từ khóa trong văn bản..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  {docSearchQuery.trim() && (
                    <span className="text-[11px] text-teal-400 font-mono">
                      {(() => {
                        const count = (viewingDoc.content.match(new RegExp(docSearchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length;
                        return `Tìm thấy ${count} lần xuất hiện`;
                      })()}
                    </span>
                  )}
                </div>
              )}

              {/* Content Body */}
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-900/60">
                {docDetailLoading ? (
                  <div className="py-20 flex flex-col items-center justify-center text-slate-500 text-xs gap-3">
                    <Loader2 className="w-7 h-7 animate-spin text-teal-400" />
                    <span>Đang trích xuất toàn văn chuyên luận y khoa...</span>
                  </div>
                ) : viewingDoc ? (
                  docViewMode === "formatted" ? (
                    <div
                      className="prose prose-invert prose-sm sm:prose-base max-w-none leading-relaxed text-slate-200 
                        [&_h1]:text-teal-300 [&_h1]:text-lg [&_h1]:font-bold [&_h1]:border-b [&_h1]:border-slate-800 [&_h1]:pb-2
                        [&_h2]:text-teal-400 [&_h2]:text-base [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-3
                        [&_h3]:text-teal-200 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2
                        [&_blockquote]:bg-slate-950/80 [&_blockquote]:border-l-4 [&_blockquote]:border-teal-500 [&_blockquote]:px-4 [&_blockquote]:py-3 [&_blockquote]:rounded-r-xl [&_blockquote]:text-slate-300
                        [&_ul]:my-2 [&_li]:my-1
                        [&_table]:w-full [&_table]:border-collapse [&_th]:bg-slate-950 [&_th]:p-2 [&_th]:border [&_th]:border-slate-800 [&_td]:p-2 [&_td]:border [&_td]:border-slate-800"
                      dangerouslySetInnerHTML={{
                        __html: marked.parse(
                          docSearchQuery.trim()
                            ? viewingDoc.content.replace(
                                new RegExp(`(${docSearchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'),
                                '<mark class="bg-amber-300 text-slate-950 font-bold px-1 rounded">$1</mark>'
                              )
                            : viewingDoc.content || "*Tài liệu không có nội dung văn bản.*",
                          { breaks: true }
                        ) as string
                      }}
                    />
                  ) : (
                    <pre className="whitespace-pre-wrap font-mono text-xs text-slate-300 bg-slate-950 p-4 rounded-2xl border border-slate-800 overflow-x-auto leading-relaxed">
                      {viewingDoc.content}
                    </pre>
                  )
                ) : null}
              </div>

              {/* Footer */}
              {viewingDoc && (
                <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-2">
                    <span>Mã ID: <code className="text-teal-400 font-mono">{viewingDoc.id}</code></span>
                    <span>•</span>
                    <span>{viewingDoc.content?.length.toLocaleString() || 0} ký tự</span>
                  </div>
                  <button
                    onClick={() => setViewingDoc(null)}
                    className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    Đóng văn bản
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal Hướng dẫn Firestore Security Rules */}
        {showRulesModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl space-y-4 p-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 text-teal-400 font-bold text-sm">
                  <ShieldCheck className="w-5 h-5" />
                  <span>Cấu hình Firestore Security Rules để hiển thị User</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRulesModal(false)}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs text-slate-300 space-y-2">
                <p>
                  Nếu danh sách người dùng hiển thị 0 user hoặc báo lỗi <code>permission-denied</code>, nghĩa là Firestore Security Rules của dự án Firebase đang chặn quyền đọc bộ sưu tập <code>/users</code>.
                </p>
                <p className="font-semibold text-teal-300">
                  Các bước mở quyền trên Firebase Console:
                </p>
                <ol className="list-decimal pl-5 space-y-1 text-slate-400 text-[11px]">
                  <li>Truy cập <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="text-teal-400 underline">Firebase Console</a> &gt; <strong>Firestore Database</strong> &gt; Tab <strong>Rules</strong>.</li>
                  <li>Dán đoạn mã quy tắc dưới đây và nhấn <strong>Publish</strong>:</li>
                </ol>
              </div>

              <div className="relative bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-teal-300 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => {
                    const rulesText = `rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /users/{userId} {\n      allow read, write: if true;\n    }\n    match /users/{userId}/conversations/{convId} {\n      allow read, write: if true;\n      match /messages/{msgId} {\n        allow read, write: if true;\n      }\n    }\n    match /incidents/{incidentId} {\n      allow read, write: if true;\n    }\n  }\n}`;
                    navigator.clipboard.writeText(rulesText);
                    setCopiedRules(true);
                    setTimeout(() => setCopiedRules(false), 2000);
                  }}
                  className="absolute right-2.5 top-2.5 px-2.5 py-1 bg-teal-900/60 hover:bg-teal-800 text-teal-300 rounded text-[10px] font-sans font-bold flex items-center gap-1 border border-teal-700 cursor-pointer"
                >
                  {copiedRules ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedRules ? "Đã chép!" : "Sao chép"}</span>
                </button>
                <pre>{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if true;
    }
    match /users/{userId}/conversations/{convId} {
      allow read, write: if true;
      match /messages/{msgId} {
        allow read, write: if true;
      }
    }
    match /incidents/{incidentId} {
      allow read, write: if true;
    }
  }
}`}</pre>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowRulesModal(false);
                    loadUsers();
                  }}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  Đã cấu hình & Thử tải lại
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
