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
  updateIncidentAndNotifyMessage,
  addMessageDoctorReview,
  formatConversationTime
} from "../services/firebase";
import { marked } from "marked";
import { 
  Users, 
  User,
  Stethoscope,
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

  // Doctor Inline Review Form State
  const [reviewingMsgId, setReviewingMsgId] = useState<string | null>(null);
  const [doctorCorrectedResponse, setDoctorCorrectedResponse] = useState<string>("");
  const [doctorNotes, setDoctorNotes] = useState<string>("");
  const [savingDoctorReview, setSavingDoctorReview] = useState(false);

  // -------------------------------------------------------------
  // TAB 2: INCIDENTS HUB STATE
  // -------------------------------------------------------------
  const [incidentsList, setIncidentsList] = useState<IncidentRecord[]>([]);
  const [incidentCategoryTab, setIncidentCategoryTab] = useState<"all" | "system_detected" | "user_reported">("all");
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

  const handleStartReview = (msg: any) => {
    setReviewingMsgId(msg.id || null);
    setDoctorCorrectedResponse(msg.adminReview?.correctedResponse || "");
    setDoctorNotes(msg.adminReview?.doctorNotes || "");
  };

  const handleCancelReview = () => {
    setReviewingMsgId(null);
    setDoctorCorrectedResponse("");
    setDoctorNotes("");
  };

  const handleSaveDoctorReview = async (msgId: string) => {
    if (!selectedUser || !selectedConv) return;
    setSavingDoctorReview(true);
    try {
      await addMessageDoctorReview(selectedUser.uid, selectedConv.id, msgId, {
        status: "resolved",
        doctorEmail: "Bác sĩ Quản trị",
        correctedResponse: doctorCorrectedResponse.trim(),
        doctorNotes: doctorNotes.trim()
      });
      setConvMessages(prev => prev.map(m => {
        if (m.id === msgId) {
          return {
            ...m,
            adminReview: {
              status: "resolved",
              doctorEmail: "Bác sĩ Quản trị",
              correctedResponse: doctorCorrectedResponse.trim(),
              doctorNotes: doctorNotes.trim(),
              reviewedAt: Date.now()
            }
          };
        }
        return m;
      }));
      setFeedbackMsg({ text: "Đã lưu đính chính của bác sĩ cho tin nhắn này!", type: "success" });
      handleCancelReview();
    } catch (err: any) {
      setFeedbackMsg({ text: err.message || "Lỗi lưu thẩm định bác sĩ", type: "error" });
    } finally {
      setSavingDoctorReview(false);
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
      await updateIncidentAndNotifyMessage(selectedIncident, {
        status: newStatus,
        adminNotes: incidentAdminNotes.trim(),
        correctedResponse: incidentCorrectedResponse.trim(),
        adminEmail: "Bác sĩ Quản trị"
      });
      setSelectedIncident(prev => prev ? {
        ...prev,
        status: newStatus,
        adminNotes: incidentAdminNotes.trim(),
        correctedResponse: incidentCorrectedResponse.trim(),
        adminEvaluatedBy: "Bác sĩ Quản trị"
      } : null);
      setFeedbackMsg({ 
        text: `Đã lưu thẩm định & Đồng bộ phản hồi tới cuộc trò chuyện của người bệnh!`, 
        type: "success" 
      });
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
      setFeedbackMsg({ text: `Cào dữ liệu thành công! Đã tạo ${res.document?.chunkCount ?? (res as any).chunkCount ?? 0} đoạn vector và đồng bộ lên Qdrant Cloud.`, type: "success" });
      setCrawlUrl("");
      setInspectionResult(null);
      await loadDocs();
    } catch (err: any) {
      setFeedbackMsg({ text: err.message || "Cào tài liệu thất bại.", type: "error" });
    } finally {
      setCrawling(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    setUploadingFile(true);
    setFeedbackMsg(null);
    try {
      await adminUploadDocument(selectedFile, adminKey);
      setFeedbackMsg({ text: `Đã nạp và tạo vector thành công cho tệp "${selectedFile.name}"!`, type: "success" });
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
    if (incidentCategoryTab === "system_detected") {
      const isSystem = i.category === "system_detected" || (i.errorType && i.errorType !== "user_reported");
      if (!isSystem) return false;
    } else if (incidentCategoryTab === "user_reported") {
      const isUser = i.category === "user_reported" || i.errorType === "user_reported";
      if (!isUser) return false;
    }

    if (incidentStatusFilter !== "all" && i.status !== incidentStatusFilter) return false;
    if (incidentTypeFilter !== "all" && i.errorType !== incidentTypeFilter) return false;

    return true;
  });

  // =============================================================
  // RENDER: LOCKED VIEW (CHẾ ĐỘ KHÓA PIN NOTION)
  // =============================================================
  if (isOpen !== undefined && !isOpen) return null;

  if (!isUnlocked) {
    return (
      <div className="fixed inset-0 z-50 bg-[#F6F5F4] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border border-black/8 rounded-xl p-8 shadow-card-soft text-black">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={onBack}
              className="text-xs text-black/60 hover:text-black flex items-center gap-1.5 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại giao diện Chat</span>
            </button>
            <div className="p-2 bg-[#FEF3C7] text-[#D97706] rounded-lg border border-[#FFB110]/30">
              <Lock className="w-5 h-5" />
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-black">
              <span>Cổng Quản Trị Hệ Thống</span>
            </h2>
            <p className="text-xs text-black/60 mt-1 leading-relaxed">
              Vui lòng nhập mật khẩu Quản trị viên (ADMIN_SECRET_KEY) để truy cập toàn quyền giám sát người dùng, xử lý sự cố, quản lý AI model và tri thức y khoa.
            </p>
          </div>

          {feedbackMsg && (
            <div className={`p-3 rounded-lg mb-4 text-xs flex items-center gap-2 ${
              feedbackMsg.type === "success" 
                ? "bg-[#D0F4D8] border border-[#1AAE39]/30 text-[#1AAE39]"
                : "bg-[#FFE4E6] border border-[#F64932]/30 text-[#F64932]"
            }`}>
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{feedbackMsg.text}</span>
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); verifyAndUnlock(adminKey); }} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-black/70 mb-1.5">
                Mã Khóa Quản Trị (Secret Key):
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-black/40 absolute left-3 top-2.5" />
                <input
                  type="password"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  placeholder="Nhập ADMIN_SECRET_KEY từ file .env..."
                  className="w-full bg-white border border-black/16 rounded-lg pl-9 pr-3 py-2 text-xs text-black placeholder-black/35 focus:outline-none focus:ring-2 focus:ring-[#0075DE] transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={verifying}
              className="w-full bg-[#0075DE] hover:bg-[#0062BD] text-white font-medium py-2 rounded-lg text-xs flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer shadow-2xs"
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
  // RENDER: FULL-PAGE ADMIN PORTAL (NOTION WORKSPACE)
  // =============================================================
  return (
    <div className="fixed inset-0 z-50 bg-[#F6F5F4] text-black flex flex-col lg:flex-row overflow-hidden font-sans">
      {/* MOBILE TOP NAVIGATION BAR */}
      <div className="lg:hidden flex items-center justify-between px-4 py-2.5 bg-white border-b border-black/8 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#E6F3FE] text-[#0075DE] flex items-center justify-center border border-[#0075DE]/20">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xs font-semibold text-black tracking-wide">QUẢN TRỊ LACTAMED</h1>
            <p className="text-[10px] text-black/50 font-medium">Trung tâm Vận hành</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIsUnlocked(false);
              sessionStorage.removeItem("chatbot_admin_key");
            }}
            className="p-1.5 text-black/50 hover:text-[#F64932] transition cursor-pointer"
            title="Khóa lại"
          >
            <Lock className="w-4 h-4" />
          </button>
          <button
            onClick={onBack}
            className="px-2.5 py-1 bg-[#F6F5F4] hover:bg-black/5 text-black text-xs font-medium rounded-lg border border-black/10 flex items-center gap-1 transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Về Chat</span>
          </button>
        </div>
      </div>

      {/* MOBILE SCROLLABLE TAB BAR */}
      <div className="lg:hidden flex items-center gap-1.5 px-3 py-2 bg-[#F6F5F4] border-b border-black/8 overflow-x-auto text-xs shrink-0">
        <button
          onClick={() => { setActiveTab("users"); setMobileUserView("users"); }}
          className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === "users" ? "bg-white text-black shadow-2xs border border-black/8" : "text-black/60 hover:text-black hover:bg-black/5"
          }`}
        >
          <Users className="w-3.5 h-3.5 text-[#0075DE]" />
          <span>Người dùng ({usersList.length})</span>
        </button>
        <button
          onClick={() => { setActiveTab("incidents"); setMobileIncidentView("list"); }}
          className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === "incidents" ? "bg-white text-black shadow-2xs border border-black/8" : "text-black/60 hover:text-black hover:bg-black/5"
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-[#FFB110]" />
          <span>Sự cố</span>
          {pendingIncidentsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-[#FFE4E6] text-[#F64932] border border-[#F64932]/30 font-bold text-[10px]">
              {pendingIncidentsCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("models")}
          className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === "models" ? "bg-white text-black shadow-2xs border border-black/8" : "text-black/60 hover:text-black hover:bg-black/5"
          }`}
        >
          <Cpu className="w-3.5 h-3.5 text-[#1313BA]" />
          <span>Model & Quota</span>
        </button>
        <button
          onClick={() => setActiveTab("knowledge")}
          className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === "knowledge" ? "bg-white text-black shadow-2xs border border-black/8" : "text-black/60 hover:text-black hover:bg-black/5"
          }`}
        >
          <Database className="w-3.5 h-3.5 text-[#1AAE39]" />
          <span>Tri thức ({documents.length})</span>
        </button>
      </div>

      {/* DESKTOP SIDEBAR QUẢN TRỊ NOTION WARM STONE */}
      <aside className="hidden lg:flex w-64 sm:w-72 bg-[#F6F5F4] border-r border-black/8 flex-col justify-between shrink-0">
        <div>
          {/* Header Sidebar */}
          <div className="p-4 border-b border-black/8 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#E6F3FE] text-[#0075DE] flex items-center justify-center border border-[#0075DE]/20 shadow-2xs">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-xs font-bold text-black tracking-wide">ADMIN PORTAL</h1>
                <p className="text-[10px] text-black/50 font-medium">Trung Tâm Vận Hành Y Khoa</p>
              </div>
            </div>

            <button
              onClick={onBack}
              className="p-1.5 text-black/40 hover:text-black rounded-lg hover:bg-black/5 transition cursor-pointer"
              title="Quay lại giao diện Chat người dùng"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>

          {/* User / Status Badge */}
          <div className="p-3 mx-3 my-3 bg-white rounded-lg border border-black/8 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#1AAE39] animate-pulse"></span>
              <span className="text-[11px] font-medium text-black/70">Đã mở khóa phiên</span>
            </div>
            <button
              onClick={() => {
                setIsUnlocked(false);
                sessionStorage.removeItem("chatbot_admin_key");
              }}
              className="text-[10px] text-black/40 hover:text-[#F64932] flex items-center gap-1 transition cursor-pointer"
            >
              <Lock className="w-3 h-3" />
              <span>Khóa lại</span>
            </button>
          </div>

          {/* Navigation Tabs */}
          <nav className="px-3 space-y-1">
            <button
              onClick={() => setActiveTab("users")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition cursor-pointer ${
                activeTab === "users"
                  ? "bg-white text-black font-semibold shadow-2xs border border-black/8"
                  : "text-black/60 hover:bg-black/5 hover:text-black"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-[#0075DE]" />
                <span>Người dùng & Hội thoại</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/6 text-black/70 font-mono">
                {usersList.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("incidents")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition cursor-pointer ${
                activeTab === "incidents"
                  ? "bg-white text-black font-semibold shadow-2xs border border-black/8"
                  : "text-black/60 hover:bg-black/5 hover:text-black"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-[#FFB110]" />
                <span>Nhật ký Sự cố & Sửa lỗi</span>
              </div>
              {pendingIncidentsCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#FFE4E6] text-[#F64932] border border-[#F64932]/30 font-bold animate-pulse">
                  {pendingIncidentsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("models")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition cursor-pointer ${
                activeTab === "models"
                  ? "bg-white text-black font-semibold shadow-2xs border border-black/8"
                  : "text-black/60 hover:bg-black/5 hover:text-black"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Cpu className="w-4 h-4 text-[#1313BA]" />
                <span>Quản lý Model & Quota</span>
              </div>
              <span className="text-[10px] text-[#0075DE] font-mono">
                {modelConfig?.provider === "gemini" ? "Gemini" : "Custom"}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("knowledge")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition cursor-pointer ${
                activeTab === "knowledge"
                  ? "bg-white text-black font-semibold shadow-2xs border border-black/8"
                  : "text-black/60 hover:bg-black/5 hover:text-black"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Database className="w-4 h-4 text-[#1AAE39]" />
                <span>Tri thức & Cào dữ liệu</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/6 text-black/70 font-mono">
                {documents.length} docs
              </span>
            </button>
          </nav>
        </div>

        {/* Footer Overview Stats */}
        <div className="p-4 border-t border-black/8 text-[11px] text-black/60 space-y-2 bg-[#F6F5F4]">
          <div className="flex items-center justify-between">
            <span className="text-black/50">Vector Store:</span>
            <span className="font-semibold text-black/80 flex items-center gap-1 font-mono">
              <Zap className="w-3 h-3 text-[#FFB110]" />
              {modelConfig?.vectorStore === "qdrant" ? "Qdrant Cloud" : "SQLite RAM"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-black/50">Tổng chunks y văn:</span>
            <span className="font-semibold text-[#0075DE] font-mono">{modelConfig?.totalChunks ?? 0}</span>
          </div>
          <button
            onClick={onBack}
            className="w-full mt-2 py-2 bg-white hover:bg-black/5 text-black text-xs font-medium rounded-lg border border-black/10 flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại Chatbot</span>
          </button>
        </div>
      </aside>

      {/* NỘI DUNG CHÍNH (MAIN WORKSPACE) */}
      <main className="flex-1 flex flex-col overflow-hidden bg-white">
        {/* Banner thông báo trạng thái */}
        {feedbackMsg && (
          <div className={`px-6 py-2.5 text-xs flex items-center justify-between border-b ${
            feedbackMsg.type === "success"
              ? "bg-[#D0F4D8] text-[#1AAE39] border-[#1AAE39]/30"
              : "bg-[#FFE4E6] text-[#F64932] border-[#F64932]/30"
          }`}>
            <div className="flex items-center gap-2 font-medium">
              {feedbackMsg.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-[#1AAE39]" />
              ) : (
                <AlertCircle className="w-4 h-4 text-[#F64932]" />
              )}
              <span>{feedbackMsg.text}</span>
            </div>
            <button onClick={() => setFeedbackMsg(null)} className="text-black/40 hover:text-black cursor-pointer">
              ✕
            </button>
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 1: USERS & CONVERSATIONS INSPECTOR                        */}
        {/* ============================================================= */}
        {activeTab === "users" && (
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            {/* 4 Thẻ KPI Thống Kê Người Dùng & Chi Phí */}
            <div className="p-3 sm:p-4 bg-[#F6F5F4] border-b border-black/8 shrink-0">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
                <div className="p-3 bg-white border border-black/8 rounded-xl flex items-center justify-between shadow-2xs">
                  <div>
                    <span className="text-[10px] font-semibold text-black/50 uppercase tracking-wider block">Tổng Người Dùng</span>
                    <span className="text-base sm:text-lg font-bold text-black font-mono mt-0.5 block">{usersList.length} <span className="text-xs font-normal text-black/50">tài khoản</span></span>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-[#E6F3FE] text-[#0075DE] flex items-center justify-center border border-[#0075DE]/20 shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                </div>

                <div className="p-3 bg-white border border-black/8 rounded-xl flex items-center justify-between shadow-2xs">
                  <div>
                    <span className="text-[10px] font-semibold text-black/50 uppercase tracking-wider block">Phương Thức Xác Thực</span>
                    <div className="flex items-center gap-2 mt-1 text-xs font-medium">
                      <span className="text-[#F64932] font-mono flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#F64932]"></span>
                        {usersList.filter(u => u.providerId === "google.com").length} Google
                      </span>
                      <span className="text-black/30">•</span>
                      <span className="text-[#0075DE] font-mono flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0075DE]"></span>
                        {usersList.filter(u => u.providerId !== "google.com").length} Email
                      </span>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-[#E0E7FF] text-[#1313BA] flex items-center justify-center border border-[#1313BA]/20 shrink-0">
                    <KeyRound className="w-4 h-4" />
                  </div>
                </div>

                <div className="p-3 bg-white border border-black/8 rounded-xl flex items-center justify-between shadow-2xs">
                  <div>
                    <span className="text-[10px] font-semibold text-black/50 uppercase tracking-wider block">Cuộc Trò Chuyện Y Khoa</span>
                    <span className="text-base sm:text-lg font-bold text-black font-mono mt-0.5 block">
                      {usersList.reduce((acc, u) => acc + (u.conversationCount || 0), 0)} <span className="text-xs font-normal text-black/50">phiên</span>
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-[#EADBFA] text-[#6B21A8] flex items-center justify-center border border-[#6B21A8]/20 shrink-0">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                </div>

                <div className="p-3 bg-white border border-black/8 rounded-xl flex items-center justify-between shadow-2xs">
                  <div className="min-w-0 pr-2">
                    <span className="text-[10px] font-semibold text-black/50 uppercase tracking-wider block">Chi Phí Ước Tính</span>
                    <span className="text-xs sm:text-sm font-bold text-[#D97706] font-mono mt-0.5 block truncate" title={`Tổng tokens: ${usersList.reduce((acc, u) => acc + (u.totalTokensEstimated || 0), 0).toLocaleString()}`}>
                      ${usersList.reduce((acc, u) => acc + (u.totalCostUsd || 0), 0).toFixed(4)} <span className="text-[10px] font-normal text-black/50">(~{usersList.reduce((acc, u) => acc + (u.totalCostVnd || 0), 0).toLocaleString()}đ)</span>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowRulesModal(true)}
                    className="p-2 bg-[#F6F5F4] hover:bg-black/5 text-[#0075DE] rounded-lg text-xs border border-black/10 transition cursor-pointer shrink-0"
                    title="Cấu hình quyền đọc Firestore nếu danh sách User rỗng"
                  >
                    <ShieldCheck className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Cột trái: Danh sách Người dùng */}
              <div className={`w-full lg:w-80 border-r border-black/8 flex-col bg-white shrink-0 ${
                mobileUserView === "users" ? "flex" : "hidden lg:flex"
              }`}>
                <div className="p-3 border-b border-black/8 bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xs font-semibold text-black uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#0075DE]" />
                      <span>Người dùng ({filteredUsers.length})</span>
                    </h2>
                    <button
                      onClick={loadUsers}
                      className="p-1 text-black/50 hover:text-black rounded hover:bg-black/5 transition cursor-pointer"
                      title="Làm mới danh sách"
                    >
                      <RefreshCw className={`w-3 h-3 ${usersLoading ? "animate-spin" : ""}`} />
                    </button>
                  </div>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-black/40 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      placeholder="Tìm theo email, tên, ID..."
                      className="w-full bg-[#F6F5F4] border border-black/10 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-black placeholder-black/40 focus:outline-none focus:ring-2 focus:ring-[#0075DE]"
                    />
                  </div>
                </div>

                {/* Thông báo nếu có lỗi Firestore Security Rules */}
                {userLoadError && (
                  <div className="m-3 p-3 rounded-lg bg-[#FEF3C7] border border-[#FFB110]/30 text-[11px] text-[#D97706] leading-relaxed space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-[#D97706]">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Lưu ý quyền đọc Firestore</span>
                    </div>
                    <p>{userLoadError}</p>
                  </div>
                )}

                <div className="flex-1 overflow-y-auto divide-y divide-black/5">
                  {usersLoading && usersList.length === 0 ? (
                    <div className="p-8 text-center text-xs text-black/40 flex flex-col items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-[#0075DE]" />
                      <span>Đang tải danh sách người dùng...</span>
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="p-6 text-center text-xs text-black/40">
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
                              ? "bg-[#E6F3FE] border-l-2 border-[#0075DE]"
                              : "hover:bg-[#F6F5F4]/60 text-black/80"
                          }`}
                        >
                          <div className="w-8 h-8 rounded-full bg-[#F6F5F4] border border-black/10 flex items-center justify-center font-bold text-xs text-[#0075DE] shrink-0">
                            {u.displayName ? u.displayName.charAt(0).toUpperCase() : (u.email ? u.email.charAt(0).toUpperCase() : "U")}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-black truncate max-w-[130px]">
                                {u.displayName || "Người dùng"}
                              </span>
                              <span className={`text-[9px] px-1.5 py-0.2 rounded font-medium ${
                                isGoogle ? "bg-[#FFE4E6] text-[#F64932] border border-[#F64932]/20" : "bg-[#E6F3FE] text-[#0075DE] border border-[#0075DE]/20"
                              }`}>
                                {isGoogle ? "Google" : "Email"}
                              </span>
                            </div>
                            <div className="text-[11px] text-black/50 truncate mt-0.5">
                              {u.email || u.uid}
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-black/50 mt-1 font-mono">
                              <span>{u.conversationCount || 0} phiên chat</span>
                              <span>${(u.totalCostUsd || 0).toFixed(4)}</span>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Cột giữa: Danh sách Cuộc hội thoại & Tìm kiếm tin nhắn */}
              <div className={`w-full lg:w-80 border-r border-black/8 flex-col bg-[#F6F5F4]/30 shrink-0 ${
                mobileUserView === "convs" ? "flex" : "hidden lg:flex"
              }`}>
                {/* Nút quay lại trên Mobile */}
                <div className="lg:hidden p-2.5 bg-[#F6F5F4] border-b border-black/8 flex items-center justify-between shrink-0">
                  <button
                    type="button"
                    onClick={() => setMobileUserView("users")}
                    className="text-xs text-[#0075DE] hover:text-[#0062BD] font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Danh Sách Người Dùng</span>
                  </button>
                  <span className="text-[11px] text-black/60 font-medium truncate max-w-[150px]">
                    {selectedUser?.displayName || selectedUser?.email}
                  </span>
                </div>

                <div className="p-3 border-b border-black/8 space-y-2 bg-white">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-semibold text-black uppercase tracking-wider flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-[#0075DE]" />
                      <span>Hội thoại ({userConvs.length})</span>
                    </h2>
                    {selectedUser && (
                      <button
                        onClick={() => handleSelectUser(selectedUser)}
                        className="p-1 text-black/40 hover:text-black rounded hover:bg-black/5 transition cursor-pointer"
                        title="Nạp lại"
                      >
                        <RefreshCw className={`w-3 h-3 ${convsLoading ? "animate-spin" : ""}`} />
                      </button>
                    )}
                  </div>

                  {/* Sub-tabs: Xem danh sách Chat vs Tìm kiếm tin nhắn */}
                  <div className="flex bg-[#F6F5F4] p-1 rounded-lg border border-black/8 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setViewModeConv("conversations")}
                      className={`flex-1 py-1 rounded font-medium transition cursor-pointer ${
                        viewModeConv === "conversations" ? "bg-white text-black shadow-2xs" : "text-black/60 hover:text-black"
                      }`}
                    >
                      Danh sách chat
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewModeConv("search_results")}
                      className={`flex-1 py-1 rounded font-medium transition cursor-pointer ${
                        viewModeConv === "search_results" ? "bg-[#0075DE] text-white" : "text-black/60 hover:text-black"
                      }`}
                    >
                      Tìm trong tin nhắn
                    </button>
                  </div>

                  {viewModeConv === "conversations" ? (
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-black/40 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        value={convSearchQuery}
                        onChange={(e) => setConvSearchQuery(e.target.value)}
                        placeholder="Lọc tiêu đề cuộc trò chuyện..."
                        className="w-full bg-[#F6F5F4] border border-black/10 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-black placeholder-black/40 focus:outline-none focus:ring-2 focus:ring-[#0075DE]"
                      />
                    </div>
                  ) : (
                    <form onSubmit={handleSearchMessages} className="flex gap-1.5">
                      <input
                        type="text"
                        value={msgSearchQuery}
                        onChange={(e) => setMsgSearchQuery(e.target.value)}
                        placeholder="Tìm từ khóa trong tin nhắn..."
                        className="flex-1 bg-[#F6F5F4] border border-black/10 rounded-lg px-2.5 py-1.5 text-xs text-black placeholder-black/40 focus:outline-none focus:ring-2 focus:ring-[#0075DE]"
                      />
                      <button
                        type="submit"
                        disabled={isSearchingMessages || !msgSearchQuery.trim()}
                        className="px-2.5 py-1.5 bg-[#0075DE] hover:bg-[#0062BD] text-white rounded-lg text-xs font-medium disabled:opacity-50 transition cursor-pointer"
                      >
                        {isSearchingMessages ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Tìm"}
                      </button>
                    </form>
                  )}
                </div>

                {/* Danh sách Hội thoại hoặc Kết quả tìm kiếm tin nhắn */}
                <div className="flex-1 overflow-y-auto divide-y divide-black/5">
                  {viewModeConv === "search_results" ? (
                    isSearchingMessages ? (
                      <div className="p-8 text-center text-xs text-black/40 flex flex-col items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-[#0075DE]" />
                        <span>Đang tìm kiếm sâu trong tin nhắn...</span>
                      </div>
                    ) : foundMessages.length === 0 ? (
                      <div className="p-6 text-center text-xs text-black/40">
                        {msgSearchQuery.trim() ? "Không tìm thấy tin nhắn nào chứa từ khóa này." : "Nhập từ khóa và bấm Tìm để quét tin nhắn."}
                      </div>
                    ) : (
                      <div className="p-2 space-y-1.5">
                        <div className="text-[10px] text-[#0075DE] font-semibold px-2">
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
                            className="p-2.5 rounded-lg bg-white border border-black/8 hover:border-[#0075DE]/60 cursor-pointer transition text-left space-y-1 shadow-2xs"
                          >
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="font-semibold text-black truncate max-w-[160px]">{item.conversationTitle}</span>
                              <span className="text-black/50 font-mono text-[9px]">{item.message.role === "user" ? "User" : "Bot"}</span>
                            </div>
                            <p className="text-xs text-black/70 line-clamp-2">
                              {item.message.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    )
                  ) : convsLoading ? (
                    <div className="p-8 text-center text-xs text-black/40 flex flex-col items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-[#0075DE]" />
                      <span>Đang tải các cuộc trò chuyện...</span>
                    </div>
                  ) : userConvs.length === 0 ? (
                    <div className="p-6 text-center text-xs text-black/40">
                      Người dùng này chưa có cuộc trò chuyện nào.
                    </div>
                  ) : (
                    userConvs
                      .filter(c => !convSearchQuery.trim() || c.title.toLowerCase().includes(convSearchQuery.toLowerCase()))
                      .map((conv) => {
                        const isSelected = selectedConv?.id === conv.id;
                        return (
                          <button
                            key={conv.id}
                            onClick={() => selectedUser && handleSelectConv(selectedUser.uid, conv)}
                            className={`w-full p-3 text-left transition cursor-pointer ${
                              isSelected
                                ? "bg-white border-l-2 border-[#0075DE] shadow-2xs text-black"
                                : "hover:bg-black/5 text-black/80"
                            }`}
                          >
                            <div className="text-xs font-semibold text-black truncate">
                              {conv.title}
                            </div>
                            <div className="flex items-center justify-between mt-1.5 text-[10px] text-black/50">
                              <span>{formatConversationTime(conv.createdAt)}</span>
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-2.5 h-2.5 ${
                                      star <= (conv.rating || 0)
                                        ? "text-[#FFB110] fill-[#FFB110]"
                                        : "text-black/15"
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            {conv.tags && conv.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {conv.tags.slice(0, 3).map((t, i) => (
                                  <span key={i} className="text-[9px] px-1.5 py-0.2 rounded bg-[#F6F5F4] text-black/70 border border-black/10">
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

              {/* Cột phải: Chi tiết Cuộc hội thoại & Đánh giá chất lượng */}
              <div className={`flex-1 flex-col overflow-hidden bg-white ${
                mobileUserView === "messages" ? "flex" : "hidden lg:flex"
              }`}>
                {/* Mobile Back Button */}
                <div className="lg:hidden p-2.5 bg-[#F6F5F4] border-b border-black/8 flex items-center justify-between shrink-0">
                  <button
                    type="button"
                    onClick={() => setMobileUserView("convs")}
                    className="text-xs text-[#0075DE] hover:text-[#0062BD] font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Danh Sách Hội Thoại</span>
                  </button>
                  <span className="text-[11px] text-black/70 font-medium truncate max-w-[170px]">
                    {selectedConv?.title}
                  </span>
                </div>

                {selectedConv ? (
                  <>
                    {/* Header thông tin người dùng & phiên chat */}
                    <div className="px-6 py-3.5 border-b border-black/8 bg-[#F6F5F4]/60 flex flex-wrap items-center justify-between gap-4">
                      {selectedUser && (
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-black">{selectedUser.displayName || "Người dùng"}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                              selectedUser.providerId === "google.com" 
                                ? "bg-[#FFE4E6] text-[#F64932] border border-[#F64932]/20" 
                                : "bg-[#E6F3FE] text-[#0075DE] border border-[#0075DE]/20"
                            }`}>
                              {selectedUser.providerId === "google.com" ? "Google" : "Email"}
                            </span>
                          </div>
                          <div className="text-[11px] text-black/50 mt-0.5 flex flex-wrap items-center gap-2">
                            <span>Email: <strong className="text-black/80">{selectedUser.email || "Không có email"}</strong></span>
                            <span>•</span>
                            <span>UID: <code className="text-black/60 font-mono text-[10px]">{selectedUser.uid}</code></span>
                          </div>
                          <div className="text-[10px] text-black/50 mt-1 flex flex-wrap items-center gap-3">
                            <span>Đăng ký: {new Date(selectedUser.createdAt).toLocaleDateString()}</span>
                            <span>Đăng nhập gần nhất: {new Date(selectedUser.lastLoginAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      )}

                      {/* Thống kê phiên chat */}
                      {selectedUser && (
                        <div className="flex items-center gap-4 text-right">
                          <div>
                            <span className="text-[10px] text-black/50 block uppercase">Hội thoại / Tin nhắn</span>
                            <span className="text-xs font-semibold text-black font-mono">{selectedUser.conversationCount || 0} / {selectedUser.messageCount || 0}</span>
                          </div>
                          <div className="h-6 w-px bg-black/10" />
                          <div>
                            <span className="text-[10px] text-black/50 block uppercase">Token tiêu thụ</span>
                            <span className="text-xs font-semibold text-[#0075DE] font-mono">{(selectedUser.totalTokensEstimated || 0).toLocaleString()}</span>
                          </div>
                          <div className="h-6 w-px bg-black/10" />
                          <div>
                            <span className="text-[10px] text-black/50 block uppercase">Chi phí ước tính</span>
                            <span className="text-xs font-semibold text-[#D97706] font-mono">${(selectedUser.totalCostUsd || 0).toFixed(4)}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Sub-header cuộc trò chuyện hiện tại */}
                    <div className="px-6 py-3 border-b border-black/8 flex items-center justify-between bg-white">
                      <div>
                        <h3 className="text-xs font-semibold text-black flex items-center gap-2">
                          <span>{selectedConv.title}</span>
                          <span className="text-[10px] text-black/40 font-normal">
                            (ID: {selectedConv.id})
                          </span>
                        </h3>
                        <p className="text-[10px] text-black/50 mt-0.5">
                          Người dùng: <strong className="text-[#0075DE]">{selectedUser?.displayName || selectedUser?.email}</strong>
                        </p>
                      </div>

                      {/* Quick Rating Badge */}
                      <div className="flex items-center gap-1.5 bg-[#F6F5F4] px-3 py-1 rounded-full border border-black/8">
                        <span className="text-[11px] text-black/60">Đánh giá:</span>
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3.5 h-3.5 ${
                                star <= (selectedConv.rating || 0)
                                  ? "text-[#FFB110] fill-[#FFB110]"
                                  : "text-black/15"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Body: Messages List */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                      {messagesLoading ? (
                        <div className="p-12 text-center text-xs text-black/40 flex flex-col items-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin text-[#0075DE]" />
                          <span>Đang tải nội dung tin nhắn...</span>
                        </div>
                      ) : convMessages.length === 0 ? (
                        <div className="p-12 text-center text-xs text-black/40">
                          Cuộc trò chuyện này chưa có tin nhắn nào.
                        </div>
                      ) : (
                        convMessages.map((m, idx) => {
                          const isUserMsg = m.role === "user";
                          const isBeingReviewed = reviewingMsgId === (m.id || idx);
                          return (
                            <div
                              key={m.id || idx}
                              className={`flex flex-col ${isUserMsg ? "items-end" : "items-start"}`}
                            >
                              <div className="flex items-center gap-2 mb-1 px-1 text-[10px] text-black/40">
                                <span className="font-semibold text-black/60">
                                  {isUserMsg ? "Người dùng" : "LactaMed AI"}
                                </span>
                                <span>•</span>
                                <span>{formatConversationTime(m.timestamp)}</span>
                                {m.mode && (
                                  <span className="px-1.5 py-0.2 rounded bg-[#F6F5F4] text-[#0075DE] border border-black/10">
                                    {m.mode}
                                  </span>
                                )}
                                {m.safetyLevel && m.safetyLevel !== "None" && (
                                  <span className={`px-1.5 py-0.2 rounded font-bold ${
                                    m.safetyLevel === "Compatible" ? "bg-[#D0F4D8] text-[#1AAE39] border border-[#1AAE39]/30" :
                                    m.safetyLevel === "Caution" ? "bg-[#FEF3C7] text-[#D97706] border border-[#FFB110]/30" :
                                    "bg-[#FFE4E6] text-[#F64932] border border-[#F64932]/30"
                                  }`}>
                                    {m.safetyLevel}
                                  </span>
                                )}
                              </div>

                              <div
                                className={`max-w-[85%] rounded-xl px-4 py-3 text-xs leading-relaxed ${
                                  isUserMsg
                                    ? "bg-[#0075DE] text-white rounded-br-xs shadow-2xs"
                                    : "bg-[#F6F5F4]/80 border border-black/8 text-black/90 rounded-bl-xs shadow-2xs"
                                }`}
                              >
                                <div
                                  className={`prose prose-xs max-w-none [&_p]:m-0 [&_ul]:my-1.5 ${isUserMsg ? "prose-invert text-white" : "text-black/85"}`}
                                  dangerouslySetInnerHTML={{
                                    __html: marked.parse(m.content || "", { breaks: true }) as string
                                  }}
                                />

                                {/* Trích dẫn y văn nếu có */}
                                {m.citations && m.citations.length > 0 && (
                                  <div className="mt-3 pt-2.5 border-t border-black/8 space-y-1">
                                    <div className="text-[10px] font-medium text-black/60 flex items-center gap-1">
                                      <FileText className="w-3 h-3 text-[#0075DE]" />
                                      <span>Căn cứ trích dẫn y văn ({m.citations.length}):</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                      {m.citations.map((c: any, cIdx: number) => (
                                        <span
                                          key={cIdx}
                                          className="text-[10px] px-2 py-0.5 rounded bg-white border border-black/10 text-black/70"
                                        >
                                          [{c.documentName || c.DocumentName || "Y văn"}]
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Ý kiến thẩm định / đính chính của Bác sĩ nếu có */}
                                {m.adminReview && (
                                  <div className="mt-3 p-3 bg-[#D0F4D8]/40 border border-[#1AAE39]/30 rounded-xl space-y-1.5 text-black">
                                    <div className="flex items-center justify-between font-semibold text-[#1AAE39]">
                                      <span className="flex items-center gap-1">
                                        <Stethoscope className="w-3.5 h-3.5 text-[#1AAE39]" />
                                        <span>Ý kiến Bác sĩ Thẩm định:</span>
                                      </span>
                                      <span className="text-[9px] px-1.5 py-0.2 bg-[#D0F4D8] text-[#1AAE39] rounded font-semibold border border-[#1AAE39]/30">
                                        {m.adminReview.status === "resolved" ? "Đã giải quyết" : "Đang xem xét"}
                                      </span>
                                    </div>
                                    {m.adminReview.correctedResponse && (
                                      <div className="p-2.5 bg-white rounded-lg border border-[#1AAE39]/20 text-[11px] text-black/85">
                                        <span className="text-[#1AAE39] font-semibold block text-[10px] uppercase">Nội dung đính chính:</span>
                                        <span>{m.adminReview.correctedResponse}</span>
                                      </div>
                                    )}
                                    {m.adminReview.doctorNotes && (
                                      <div className="text-[10px] text-black/60 italic">
                                        Ghi chú: {m.adminReview.doctorNotes}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Nút mở form đính chính bác sĩ */}
                                {!isUserMsg && !isBeingReviewed && (
                                  <div className="mt-2.5 pt-2 border-t border-black/8 flex justify-end">
                                    <button
                                      type="button"
                                      onClick={() => handleStartReview(m)}
                                      className="text-[10px] px-2.5 py-1 rounded-lg bg-white hover:bg-black/5 text-[#0075DE] border border-black/10 font-medium flex items-center gap-1 transition cursor-pointer"
                                    >
                                      <Stethoscope className="w-3 h-3 text-[#0075DE]" />
                                      <span>{m.adminReview ? "Chỉnh sửa thẩm định" : "Thẩm định / Đính chính"}</span>
                                    </button>
                                  </div>
                                )}

                                {/* Form Thẩm Định / Đính Chính Bác Sĩ Inline */}
                                {isBeingReviewed && (
                                  <div className="mt-3 p-3 bg-white border border-[#0075DE]/30 rounded-xl space-y-2 animate-in fade-in text-black shadow-2xs">
                                    <div className="flex items-center justify-between font-semibold text-xs text-[#0075DE]">
                                      <span className="flex items-center gap-1.5">
                                        <Stethoscope className="w-3.5 h-3.5 text-[#0075DE]" />
                                        <span>Thẩm định lâm sàng cho câu trả lời này:</span>
                                      </span>
                                      <button
                                        type="button"
                                        onClick={handleCancelReview}
                                        className="text-black/40 hover:text-black cursor-pointer"
                                      >
                                        ✕
                                      </button>
                                    </div>

                                    <div>
                                      <label className="block text-[10px] text-black/70 font-medium mb-1">Câu trả lời đính chính chuẩn y khoa:</label>
                                      <textarea
                                        value={doctorCorrectedResponse}
                                        onChange={(e) => setDoctorCorrectedResponse(e.target.value)}
                                        rows={3}
                                        placeholder="Nhập nội dung hiệu đính chính xác về thuốc, liều lượng, cảnh báo..."
                                        className="w-full bg-[#F6F5F4] border border-black/10 rounded-lg p-2 text-xs text-black placeholder-black/40 focus:outline-none focus:ring-2 focus:ring-[#0075DE] resize-none font-sans"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-[10px] text-black/70 font-medium mb-1">Lời dặn / Nhận xét chuyên môn:</label>
                                      <textarea
                                        value={doctorNotes}
                                        onChange={(e) => setDoctorNotes(e.target.value)}
                                        rows={2}
                                        placeholder="Nhận xét lý do cần đính chính, tài liệu cần nạp thêm..."
                                        className="w-full bg-[#F6F5F4] border border-black/10 rounded-lg p-2 text-xs text-black placeholder-black/40 focus:outline-none focus:ring-2 focus:ring-[#0075DE] resize-none font-sans"
                                      />
                                    </div>

                                    <div className="flex items-center justify-end gap-2 pt-1">
                                      <button
                                        type="button"
                                        onClick={handleCancelReview}
                                        className="px-3 py-1.5 rounded-lg bg-[#F6F5F4] hover:bg-black/5 text-black/70 text-xs font-medium cursor-pointer"
                                      >
                                        Hủy
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleSaveDoctorReview(m.id || idx)}
                                        disabled={savingDoctorReview || !doctorCorrectedResponse.trim()}
                                        className="px-3.5 py-1.5 rounded-lg bg-[#0075DE] hover:bg-[#0062BD] text-white text-xs font-medium flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-2xs"
                                      >
                                        {savingDoctorReview ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                        <span>Lưu Thẩm Định</span>
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Bottom Inspector: Đánh giá chất lượng & Thêm nhãn */}
                    <div className="p-4 border-t border-black/8 bg-[#F6F5F4]/50">
                      {evalSavedSuccess && (
                        <div className="mb-2 p-2 rounded-lg bg-[#D0F4D8] text-[#1AAE39] border border-[#1AAE39]/30 text-xs flex items-center gap-1.5 font-medium animate-in fade-in">
                          <Check className="w-4 h-4 text-[#1AAE39]" />
                          <span>Đã lưu đánh giá & ghi chú của chuyên gia thành công!</span>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* Rating selector */}
                        <div>
                          <label className="block text-[11px] text-black/60 mb-1 font-medium">Đánh giá chất lượng:</label>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() => setEvalRating(star)}
                                className="p-1 hover:scale-110 transition cursor-pointer"
                              >
                                <Star
                                  className={`w-5 h-5 ${
                                    star <= evalRating ? "text-[#FFB110] fill-[#FFB110]" : "text-black/15"
                                  }`}
                                />
                              </button>
                            ))}
                            <span className="text-xs font-bold text-[#D97706] ml-1.5 font-mono">{evalRating} / 5</span>
                          </div>
                        </div>

                        {/* Tags */}
                        <div className="md:col-span-2">
                          <label className="block text-[11px] text-black/60 mb-1 font-medium">Gắn nhãn nhận xét:</label>
                          <div className="flex flex-wrap gap-1.5 mb-1.5">
                            {evalTags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-white text-black/80 border border-black/10 shadow-2xs"
                              >
                                <span>{tag}</span>
                                <button onClick={() => handleRemoveTag(tag)} className="hover:text-[#F64932] cursor-pointer">✕</button>
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
                              className="flex-1 bg-white border border-black/10 rounded-lg px-2.5 py-1 text-xs text-black placeholder-black/40 focus:outline-none focus:ring-2 focus:ring-[#0075DE]"
                            />
                            <button
                              type="button"
                              onClick={() => handleAddTag(evalTagInput)}
                              className="px-2.5 py-1 bg-white hover:bg-black/5 text-black/80 text-xs font-medium rounded-lg border border-black/10 cursor-pointer shadow-2xs"
                            >
                              + Thêm
                            </button>
                          </div>
                        </div>

                        {/* Doctor Notes */}
                        <div className="md:col-span-3">
                          <label className="block text-[11px] text-black/60 mb-1 font-medium">Ghi chú chuyên môn:</label>
                          <div className="flex items-start gap-2">
                            <textarea
                              value={evalNotes}
                              onChange={(e) => setEvalNotes(e.target.value)}
                              rows={2}
                              placeholder="Nhập nhận xét chuyên môn, hướng dẫn điều chỉnh cho thuật toán hoặc đề xuất tài liệu..."
                              className="flex-1 bg-white border border-black/10 rounded-xl p-2 text-xs text-black placeholder-black/40 focus:outline-none focus:ring-2 focus:ring-[#0075DE] resize-none"
                            />
                            <button
                              onClick={handleSaveEvaluation}
                              disabled={savingEval}
                              className="px-4 py-2 bg-[#0075DE] hover:bg-[#0062BD] text-white font-medium text-xs rounded-lg flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer shrink-0 shadow-2xs"
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
                  <div className="flex-1 flex flex-col items-center justify-center text-black/40 text-xs gap-2">
                    <MessageSquare className="w-8 h-8 text-black/20" />
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
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            {/* SUB-HEADER: Phân loại Nguồn Sự cố */}
            <div className="bg-[#F6F5F4] border-b border-black/8 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIncidentCategoryTab("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                    incidentCategoryTab === "all"
                      ? "bg-white text-black shadow-2xs border border-black/8 font-semibold"
                      : "text-black/60 hover:text-black hover:bg-black/5"
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5 text-[#0075DE]" />
                  <span>Tất Cả ({incidentsList.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIncidentCategoryTab("system_detected")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition cursor-pointer ${
                    incidentCategoryTab === "system_detected"
                      ? "bg-[#FFE4E6] text-[#F64932] border border-[#F64932]/30 shadow-2xs font-semibold"
                      : "text-black/60 hover:text-black hover:bg-black/5"
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5 text-[#F64932]" />
                  <span>Lỗi Hệ Thống Tự Phát Hiện</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-white text-[10px] text-[#F64932] border border-[#F64932]/20 font-bold">
                    {incidentsList.filter(i => i.category === "system_detected" || (i.errorType && i.errorType !== "user_reported")).length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setIncidentCategoryTab("user_reported")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition cursor-pointer ${
                    incidentCategoryTab === "user_reported"
                      ? "bg-[#E6F3FE] text-[#0075DE] border border-[#0075DE]/30 shadow-2xs font-semibold"
                      : "text-black/60 hover:text-black hover:bg-black/5"
                  }`}
                >
                  <User className="w-3.5 h-3.5 text-[#0075DE]" />
                  <span>Lỗi Người Dùng Báo Cáo</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-white text-[10px] text-[#0075DE] border border-[#0075DE]/20 font-bold">
                    {incidentsList.filter(i => i.category === "user_reported" || i.errorType === "user_reported").length}
                  </span>
                </button>
              </div>

              <div className="text-xs text-black/50 hidden md:block">
                {incidentCategoryTab === "system_detected"
                  ? "Sự cố timeout, quota API, lỗi mạng được hệ thống tự động ghi nhận"
                  : incidentCategoryTab === "user_reported"
                  ? "Khiếu nại, phản ánh thông tin và yêu cầu thẩm định từ người bệnh"
                  : "Toàn bộ danh mục sự cố vận hành và phản hồi người bệnh"}
              </div>
            </div>

            {/* Nội dung 2 cột bên dưới */}
            <div className="flex-1 flex overflow-hidden">
              {/* Cột trái: Bộ lọc & Danh sách sự cố */}
              <div className={`w-full lg:w-96 border-r border-black/8 flex-col bg-white shrink-0 ${
                mobileIncidentView === "list" ? "flex" : "hidden lg:flex"
              }`}>
                <div className="p-3 border-b border-black/8 space-y-2 bg-white">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-semibold text-black uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-[#F64932]" />
                      <span>Nhật ký Sự cố ({filteredIncidents.length})</span>
                    </h2>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-black/50 mb-0.5 font-medium">Tình trạng:</label>
                      <select
                        value={incidentStatusFilter}
                        onChange={(e) => setIncidentStatusFilter(e.target.value)}
                        className="w-full text-xs bg-[#F6F5F4] border border-black/10 rounded-lg p-1.5 text-black focus:outline-none focus:ring-2 focus:ring-[#0075DE]"
                      >
                        <option value="all">Tất cả ({incidentsList.length})</option>
                        <option value="pending">Chờ xử lý ({incidentsList.filter(i => i.status === "pending").length})</option>
                        <option value="in_review">Đang xem xét ({incidentsList.filter(i => i.status === "in_review").length})</option>
                        <option value="resolved">Đã giải quyết ({incidentsList.filter(i => i.status === "resolved").length})</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-black/50 mb-0.5 font-medium">Loại lỗi:</label>
                      <select
                        value={incidentTypeFilter}
                        onChange={(e) => setIncidentTypeFilter(e.target.value)}
                        className="w-full text-xs bg-[#F6F5F4] border border-black/10 rounded-lg p-1.5 text-black focus:outline-none focus:ring-2 focus:ring-[#0075DE]"
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
                <div className="flex-1 overflow-y-auto divide-y divide-black/5">
                  {filteredIncidents.length === 0 ? (
                    <div className="p-8 text-center text-xs text-black/40">
                      Không có sự cố nào trong mục lọc này.
                    </div>
                  ) : (
                    filteredIncidents.map((inc) => {
                      const isSelected = selectedIncident?.id === inc.id;
                      const isUserReport = inc.category === "user_reported" || inc.errorType === "user_reported";
                      return (
                        <button
                          key={inc.id}
                          onClick={() => handleSelectIncident(inc)}
                          className={`w-full p-3 text-left transition cursor-pointer ${
                            isSelected
                              ? "bg-[#E6F3FE] border-l-2 border-[#0075DE]"
                              : "hover:bg-[#F6F5F4]/60 text-black/80"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase ${
                              inc.status === "pending" ? "bg-[#FFE4E6] text-[#F64932] border border-[#F64932]/30" :
                              inc.status === "in_review" ? "bg-[#FEF3C7] text-[#D97706] border border-[#FFB110]/30" :
                              "bg-[#D0F4D8] text-[#1AAE39] border border-[#1AAE39]/30"
                            }`}>
                              {inc.status === "pending" ? "Chờ duyệt" : inc.status === "in_review" ? "Đang xử lý" : "Đã sửa"}
                            </span>
                            <span className="text-[10px] text-black/50">
                              {formatConversationTime(inc.createdAt)}
                            </span>
                          </div>

                          <div className="text-xs font-semibold text-black line-clamp-1">
                            "{inc.userQuery}"
                          </div>
                          {inc.errorMessage && (
                            <div className="text-[11px] text-[#F64932] line-clamp-1 mt-0.5">
                              Lỗi: {inc.errorMessage}
                            </div>
                          )}
                          <div className="text-[10px] text-black/50 mt-1 flex items-center justify-between">
                            {isUserReport ? (
                              <span className="inline-flex items-center gap-1 text-[#0075DE] font-medium truncate">
                                <User className="w-3 h-3 shrink-0" />
                                <span className="truncate">{inc.userEmail || inc.userId || "Khách"}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[#F64932] font-medium">
                                <Cpu className="w-3 h-3 shrink-0" />
                                <span>Hệ thống tự động phát hiện</span>
                              </span>
                            )}
                            {inc.correctedResponse && (
                              <span className="text-[9px] px-1.5 py-0.2 bg-[#D0F4D8] text-[#1AAE39] rounded border border-[#1AAE39]/30 font-bold">
                                Đã đính chính
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Cột phải: Chi tiết Sự cố & Công cụ Sửa lỗi Model */}
              <div className={`flex-1 flex-col overflow-hidden bg-[#F6F5F4]/30 ${
                mobileIncidentView === "detail" ? "flex" : "hidden lg:flex"
              }`}>
                {/* Mobile Back Button */}
                <div className="lg:hidden p-2.5 bg-white border-b border-black/8 flex items-center justify-between shrink-0">
                  <button
                    type="button"
                    onClick={() => setMobileIncidentView("list")}
                    className="text-xs text-[#0075DE] hover:text-[#0062BD] font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Danh Sách Sự Cố</span>
                  </button>
                  <span className="text-[11px] text-black/50 font-mono">
                    ID: {selectedIncident?.id}
                  </span>
                </div>

                {selectedIncident ? (
                  <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {/* Header thông tin sự cố */}
                    <div className="flex items-center justify-between pb-4 border-b border-black/8 bg-white p-4 rounded-xl shadow-2xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-sm font-semibold text-black">
                            Chi Tiết Báo Cáo Sự Cố #{selectedIncident.id}
                          </h2>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                            selectedIncident.status === "pending" ? "bg-[#FFE4E6] text-[#F64932] border border-[#F64932]/30" :
                            selectedIncident.status === "in_review" ? "bg-[#FEF3C7] text-[#D97706] border border-[#FFB110]/30" :
                            "bg-[#D0F4D8] text-[#1AAE39] border border-[#1AAE39]/30"
                          }`}>
                            {selectedIncident.status === "pending" ? "Chờ thẩm định" : selectedIncident.status === "in_review" ? "Đang xử lý" : "Đã giải quyết"}
                          </span>
                        </div>
                        <p className="text-xs text-black/50 mt-1">
                          Thời gian: {formatConversationTime(selectedIncident.createdAt)} • Người báo cáo: <strong className="text-black/80">{selectedIncident.userEmail || "Hệ thống"}</strong>
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-black/40 block font-mono">Loại sự cố:</span>
                        <span className="text-xs font-semibold text-[#0075DE] font-mono">
                          {selectedIncident.errorType || "user_reported"}
                        </span>
                      </div>
                    </div>

                    {/* Câu hỏi của người dùng */}
                    <div className="p-4 bg-white rounded-xl border border-black/8 shadow-2xs">
                      <div className="text-[11px] font-semibold text-black/50 mb-1 flex items-center gap-1.5 uppercase">
                        <User className="w-3.5 h-3.5 text-[#0075DE]" />
                        <span>Câu hỏi của Người bệnh / Bác sĩ:</span>
                      </div>
                      <div className="text-xs font-semibold text-black">
                        "{selectedIncident.userQuery}"
                      </div>
                    </div>

                    {/* Câu trả lời bị báo lỗi */}
                    {selectedIncident.botResponse && (
                      <div className="p-4 bg-white rounded-xl border border-black/8 shadow-2xs">
                        <div className="text-[11px] font-semibold text-black/50 mb-1 flex items-center gap-1.5 uppercase">
                          <Cpu className="w-3.5 h-3.5 text-[#F64932]" />
                          <span>Câu trả lời của AI tại thời điểm xảy ra sự cố:</span>
                        </div>
                        <div
                          className="text-xs text-black/80 prose prose-xs max-w-none leading-relaxed [&_p]:m-0"
                          dangerouslySetInnerHTML={{
                            __html: marked.parse(selectedIncident.botResponse || "", { breaks: true }) as string
                          }}
                        />
                      </div>
                    )}

                    {/* Form Điều chỉnh & Thẩm định Bác sĩ */}
                    <div className="p-5 bg-white rounded-xl border border-black/8 shadow-2xs space-y-4">
                      <div className="flex items-center gap-2 text-xs font-semibold text-[#0075DE] uppercase tracking-wider">
                        <Stethoscope className="w-4 h-4" />
                        <span>Khu Vực Thẩm Định Chuyên Môn & Hiệu Đính Cho Người Bệnh</span>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-black/70 mb-1">
                          Câu trả lời chuẩn y khoa sau khi thẩm định:
                        </label>
                        <textarea
                          value={incidentCorrectedResponse}
                          onChange={(e) => setIncidentCorrectedResponse(e.target.value)}
                          rows={4}
                          placeholder="Soạn câu trả lời chính xác, bổ sung liều lượng và cảnh báo cho người mẹ..."
                          className="w-full bg-[#F6F5F4] border border-black/10 rounded-lg p-3 text-xs text-black placeholder-black/40 focus:outline-none focus:ring-2 focus:ring-[#0075DE] resize-none font-sans leading-relaxed"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-black/70 mb-1">
                          Ghi chú nội bộ dành cho bác sĩ & quản trị viên:
                        </label>
                        <textarea
                          value={incidentAdminNotes}
                          onChange={(e) => setIncidentAdminNotes(e.target.value)}
                          rows={2}
                          placeholder="Lý do sai lệch, hướng bổ sung dữ liệu trong đợt cập nhật tiếp theo..."
                          className="w-full bg-[#F6F5F4] border border-black/10 rounded-lg p-3 text-xs text-black placeholder-black/40 focus:outline-none focus:ring-2 focus:ring-[#0075DE] resize-none"
                        />
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-black/50 font-medium">Đổi trạng thái:</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateIncidentStatus("pending")}
                            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition cursor-pointer ${
                              selectedIncident.status === "pending"
                                ? "bg-[#FFE4E6] text-[#F64932] border border-[#F64932]/30 font-semibold"
                                : "bg-[#F6F5F4] text-black/70 hover:bg-black/5"
                            }`}
                          >
                            Chờ duyệt
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateIncidentStatus("in_review")}
                            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition cursor-pointer ${
                              selectedIncident.status === "in_review"
                                ? "bg-[#FEF3C7] text-[#D97706] border border-[#FFB110]/30 font-semibold"
                                : "bg-[#F6F5F4] text-black/70 hover:bg-black/5"
                            }`}
                          >
                            Đang xem xét
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateIncidentStatus("resolved")}
                            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition cursor-pointer ${
                              selectedIncident.status === "resolved"
                                ? "bg-[#D0F4D8] text-[#1AAE39] border border-[#1AAE39]/30 font-semibold"
                                : "bg-[#F6F5F4] text-black/70 hover:bg-black/5"
                            }`}
                          >
                            Đã giải quyết
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleUpdateIncidentStatus(selectedIncident.status)}
                          disabled={updatingIncident}
                          className="px-4 py-2 bg-[#0075DE] hover:bg-[#0062BD] text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer shadow-2xs"
                        >
                          {updatingIncident ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          <span>Lưu Thẩm Định & Đồng Bộ Cho Người Bệnh</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-black/40 text-xs gap-2">
                    <AlertTriangle className="w-8 h-8 text-black/20" />
                    <span>Chọn một sự cố từ danh sách bên trái để kiểm tra và xử lý</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 3: MODEL SETTINGS & QUOTA TRACKER                         */}
        {/* ============================================================= */}
        {activeTab === "models" && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-5xl mx-auto w-full bg-[#F6F5F4]/30">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-white border border-black/8 rounded-xl shadow-2xs">
                <div className="flex items-center justify-between text-black/50 text-xs mb-2">
                  <span>Mô Hình Đang Chạy</span>
                  <Cpu className="w-4 h-4 text-[#0075DE]" />
                </div>
                <div className="text-sm font-semibold text-black truncate" title={modelConfig?.chatModel || modelConfig?.model}>
                  {modelConfig?.chatModel || modelConfig?.model || "Đang tải..."}
                </div>
                <div className="text-[10px] text-[#0075DE] mt-1 font-mono">
                  Provider: {modelConfig?.provider.toUpperCase() || "GEMINI"}
                </div>
              </div>

              <div className="p-4 bg-white border border-black/8 rounded-xl shadow-2xs">
                <div className="flex items-center justify-between text-black/50 text-xs mb-2">
                  <span>Tổng Yêu Cầu (Requests)</span>
                  <Activity className="w-4 h-4 text-[#1AAE39]" />
                </div>
                <div className="text-xl font-bold text-black font-mono">
                  {metrics?.totalChatRequests ?? 0}
                </div>
                <div className="text-[10px] text-[#1AAE39] mt-1">
                  {metrics?.successfulRequests ?? 0} thành công • {metrics?.failedRequests ?? 0} thất bại
                </div>
              </div>

              <div className="p-4 bg-white border border-black/8 rounded-xl shadow-2xs">
                <div className="flex items-center justify-between text-black/50 text-xs mb-2">
                  <span>Ước Tính Token Tiêu Thụ</span>
                  <Zap className="w-4 h-4 text-[#FFB110]" />
                </div>
                <div className="text-xl font-bold text-black font-mono">
                  {((metrics?.totalTokensEstimated ?? 0) / 1000).toFixed(1)}k <span className="text-xs font-normal text-black/50">tokens</span>
                </div>
                <div className="text-[10px] text-black/50 mt-1">
                  In: {((metrics?.estimatedInputTokens ?? 0) / 1000).toFixed(1)}k • Out: {((metrics?.estimatedOutputTokens ?? 0) / 1000).toFixed(1)}k
                </div>
              </div>

              <div className="p-4 bg-white border border-black/8 rounded-xl shadow-2xs">
                <div className="flex items-center justify-between text-black/50 text-xs mb-2">
                  <span>Thời Gian Hoạt Động (Uptime)</span>
                  <Clock className="w-4 h-4 text-[#6B21A8]" />
                </div>
                <div className="text-xl font-bold text-black font-mono">
                  {Math.floor((metrics?.uptimeSeconds ?? 0) / 60)} <span className="text-xs font-normal text-black/50">phút</span>
                </div>
                <div className="text-[10px] text-[#6B21A8] mt-1">
                  Đổi model gần nhất: {modelConfig?.lastSwitchedAtUtc ? new Date(modelConfig.lastSwitchedAtUtc).toLocaleTimeString() : "Ban đầu"}
                </div>
              </div>
            </div>

            {/* Fallback Cascades Info Box */}
            {modelConfig?.chatModels && modelConfig.chatModels.length > 1 && (
              <div className="p-4 bg-white border border-black/8 rounded-xl shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#0075DE] uppercase tracking-wider mb-2">
                  <Layers className="w-4 h-4" />
                  <span>Danh Sách Fallback Tự Động (Model Cascade Khi Quota/Error)</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {(modelConfig.chatModels || []).map((m, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <span className={`text-xs px-2.5 py-1 rounded-lg border font-mono ${
                        idx === 0 
                          ? "bg-[#E6F3FE] text-[#0075DE] border-[#0075DE]/30 font-bold"
                          : "bg-[#F6F5F4] text-black/70 border-black/10"
                      }`}>
                        {idx === 0 ? "★ " : `${idx + 1}. `}{m}
                      </span>
                      {idx < (modelConfig.chatModels?.length ?? 0) - 1 && (
                        <span className="text-black/30 text-xs">→</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Form Cấu hình Hot-Swap Model */}
            <div className="p-6 bg-white border border-black/8 rounded-xl shadow-2xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-black/8">
                <div className="flex items-center gap-2.5">
                  <Sliders className="w-5 h-5 text-[#0075DE]" />
                  <div>
                    <h3 className="text-sm font-semibold text-black">Chuyển Đổi Mô Hình AI Runtime (Hot-Swap)</h3>
                    <p className="text-xs text-black/50">Thay đổi nhà cung cấp, model và API key trực tiếp không cần khởi động lại máy chủ.</p>
                  </div>
                </div>

                <button
                  onClick={() => loadModelConfigAndMetrics(adminKey)}
                  className="px-3 py-1.5 bg-[#F6F5F4] hover:bg-black/5 text-black text-xs font-medium rounded-lg border border-black/10 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${modelLoading ? "animate-spin" : ""}`} />
                  <span>Tải lại</span>
                </button>
              </div>

              <form onSubmit={handleSaveModelConfig} className="space-y-6">
                {/* ========================================================= */}
                {/* HEADER 1: NHÓM MÔ HÌNH CHAT LLM (CASCADE)                 */}
                {/* ========================================================= */}
                <div className="p-4 bg-[#F6F5F4]/60 border border-black/8 rounded-xl space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#0075DE] uppercase tracking-wider">
                      <Cpu className="w-4 h-4" />
                      <span>1. Nhóm Mô Hình Sinh Lời Khuyên Y Khoa (Chat LLM Cascade)</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleResetCascade}
                      className="text-[11px] text-black/50 hover:text-[#0075DE] underline cursor-pointer"
                    >
                      Khôi phục mặc định
                    </button>
                  </div>

                  <p className="text-xs text-black/60 leading-relaxed">
                    Chọn các mô hình để tự động xếp tầng (Cascade). Khi model chính gặp lỗi quota (429) hoặc timeout, hệ thống sẽ tự động chuyển sang model tiếp theo.
                  </p>

                  {/* Danh sách các mô hình trong Cascade hiện tại */}
                  <div className="p-3 bg-white border border-black/8 rounded-lg space-y-1.5">
                    <div className="text-[10px] text-black/50 font-semibold uppercase tracking-wider">
                      Thứ tự Cascade đang kích hoạt ({cascadeList.length} models):
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {cascadeList.length === 0 ? (
                        <span className="text-black/40 text-xs italic">
                          Chưa có model nào. Vui lòng bấm chọn bên dưới.
                        </span>
                      ) : (
                        cascadeList.map((modelId, idx) => (
                          <span
                            key={modelId}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-medium border ${
                              idx === 0 
                                ? "bg-[#E6F3FE] text-[#0075DE] border-[#0075DE]/30" 
                                : "bg-[#F6F5F4] text-black/80 border-black/10"
                            }`}
                          >
                            <span className="text-[10px] text-black/40 font-sans">#{idx + 1}</span>
                            <span>{modelId}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveCascadeModel(modelId)}
                              className="text-black/40 hover:text-[#F64932] ml-1 cursor-pointer"
                              title="Xóa khỏi danh sách"
                            >
                              ✕
                            </button>
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Lưới các mô hình Gemini đề xuất */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-black">
                        Các Mô Hình Google Gemini Được Khuyên Dùng:
                      </label>
                      <span className="text-[10px] text-black/40">
                        Nhấn vào thẻ để Thêm / Bỏ khỏi Cascade
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {((modelsCatalog?.googleStudio?.chatModels?.slice(0, 6) || [
                        { id: "gemini-3.5-flash-lite", name: "Gemini 3.5 Flash Lite", rpm: "15 / 15", tpm: "249.95K / 250K", rpd: "976 / 1K", desc: "Mô hình siêu nhanh thế hệ mới", tag: "Ưu tiên số 1" },
                        { id: "gemini-3.1-flash-lite", name: "Gemini 3.1 Flash Lite", rpm: "15 / 15", tpm: "250K / 250K", rpd: "1K / 1K", desc: "Model flash lite thế hệ 3.1 ổn định", tag: "Dự phòng 1" },
                        { id: "gemini-2.5-flash-lite", name: "Gemini 2.5 Flash Lite", rpm: "15 / 15", tpm: "250K / 250K", rpd: "1K / 1K", desc: "Model dự phòng chi phí thấp", tag: "Dự phòng 2" },
                        { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", rpm: "15 / 15", tpm: "1M / 1M", rpd: "1.5K / 1.5K", desc: "Năng lực suy luận y khoa sâu", tag: "Hiệu năng cao" },
                        { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", rpm: "15 / 15", tpm: "1M / 1M", rpd: "1.5K / 1.5K", desc: "Model 1.5 kinh điển tin cậy", tag: "Tiêu chuẩn" }
                      ]) as ModelCatalogItem[]).map((m) => {
                        const inCascadeIndex = cascadeList.indexOf(m.id);
                        const isInCascade = inCascadeIndex !== -1;
                        return (
                          <div
                            key={m.id}
                            onClick={() => handleToggleCascadeModel(m.id)}
                            className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                              isInCascade
                                ? "bg-[#E6F3FE] border-[#0075DE] text-black shadow-2xs"
                                : "bg-white border-black/8 text-black/80 hover:border-black/20"
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <span className="text-xs font-mono font-semibold truncate">{m.name}</span>
                                <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase ${
                                  isInCascade ? "bg-[#0075DE] text-white" : "bg-black/6 text-black/60"
                                }`}>
                                  {isInCascade ? `Thứ tự #${inCascadeIndex + 1}` : "+ Thêm"}
                                </span>
                              </div>
                              <span className="text-[10px] text-[#0075DE] font-medium block">{m.tag}</span>
                              <p className="text-[10px] text-black/50 mt-1 line-clamp-2">{m.desc}</p>
                            </div>
                            {m.rpm && (
                              <div className="mt-2 pt-1.5 border-t border-black/8 flex items-center justify-between text-[9px] font-mono text-black/50">
                                <span>RPM: <strong className="text-black/80">{m.rpm}</strong></span>
                                <span>TPM: <strong className="text-black/80">{m.tpm}</strong></span>
                                <span>RPD: <strong className="text-black/80">{m.rpd}</strong></span>
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
                        className="text-xs text-[#0075DE] hover:text-[#0062BD] font-semibold flex items-center gap-1.5 py-1.5 cursor-pointer"
                      >
                        <span>{showAllModels ? "▲ Thu gọn các mô hình khác" : `▼ Xem thêm các mô hình Gemini khác (${modelsCatalog?.googleStudio?.chatModels ? Math.max(0, modelsCatalog.googleStudio.chatModels.length - 5) : 11} models)`}</span>
                      </button>

                      {showAllModels && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 mt-2.5 pt-2.5 border-t border-black/8 animate-in fade-in">
                          {((modelsCatalog?.googleStudio?.chatModels?.filter(m => !["gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-2.5-flash", "gemini-1.5-flash", "gemini-1.5-pro"].includes(m.id)) || []) as ModelCatalogItem[]).map((m) => {
                            const inCascadeIndex = cascadeList.indexOf(m.id);
                            const isInCascade = inCascadeIndex !== -1;
                            return (
                              <div
                                key={m.id}
                                onClick={() => handleToggleCascadeModel(m.id)}
                                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                                  isInCascade
                                    ? "bg-[#E6F3FE] border-[#0075DE] text-black shadow-2xs"
                                    : "bg-white border-black/8 text-black/80 hover:border-black/20"
                                }`}
                              >
                                <div>
                                  <div className="flex items-center justify-between gap-1 mb-1">
                                    <span className="text-xs font-mono font-semibold truncate">{m.name}</span>
                                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase ${
                                      isInCascade ? "bg-[#0075DE] text-white" : "bg-black/6 text-black/60"
                                    }`}>
                                      {isInCascade ? `Thứ tự #${inCascadeIndex + 1}` : "+ Thêm"}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-black/50 font-medium block">{m.tag || m.category}</span>
                                  <p className="text-[10px] text-black/50 mt-1 line-clamp-1">{m.desc}</p>
                                </div>
                                {m.rpm && (
                                  <div className="mt-2 pt-1 border-t border-black/8 flex items-center justify-between text-[9px] font-mono text-black/50">
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
                    <span className="text-xs text-black/60 whitespace-nowrap">Chuỗi model tùy chỉnh:</span>
                    <input
                      type="text"
                      value={editChatModel}
                      onChange={(e) => { setEditChatModel(e.target.value); setTestResult(null); }}
                      placeholder="gemini-3.5-flash-lite,gemini-3.1-flash-lite,gemini-2.5-flash-lite..."
                      className="flex-1 bg-white border border-black/10 rounded-lg px-3.5 py-1.5 text-xs text-black placeholder-black/40 focus:outline-none focus:ring-2 focus:ring-[#0075DE] font-mono"
                    />
                  </div>
                </div>

                {/* ========================================================= */}
                {/* HEADER 2: MÔ HÌNH VECTOR EMBEDDING (GOOGLE AI STUDIO)      */}
                {/* ========================================================= */}
                <div className="p-4 bg-[#F6F5F4]/60 border border-black/8 rounded-xl space-y-3.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#0075DE] uppercase tracking-wider">
                    <Database className="w-4 h-4" />
                    <span>2. Mô Hình Tính Toán Vector Embedding (Cố Định Google AI Studio)</span>
                  </div>

                  <p className="text-xs text-black/60">
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
                              ? "bg-[#E6F3FE] border-[#0075DE] text-black shadow-2xs"
                              : "bg-white border-black/8 text-black/80 hover:border-black/20"
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-mono font-semibold text-black">{em.name}</span>
                              <span className={`text-[9px] px-2 py-0.2 rounded-full font-bold uppercase ${
                                isSelected ? "bg-[#0075DE] text-white" : "bg-black/6 text-black/60"
                              }`}>
                                {isSelected ? "ĐANG CHỌN" : "CHỌN"}
                              </span>
                            </div>
                            <span className="text-[10px] text-[#0075DE] font-medium block">{em.tag}</span>
                            <p className="text-[10px] text-black/50 mt-1">{em.desc}</p>
                          </div>
                          <div className="mt-2 pt-2 border-t border-black/8 flex items-center justify-between text-[10px] font-mono text-black/60">
                            <span>Kích thước: <strong>{em.dimensions}D</strong></span>
                            <span>RPM: {em.rpm}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ========================================================= */}
                {/* HEADER 3: NHÀ CUNG CẤP & KHÓA KẾT NỐI RUNTIME              */}
                {/* ========================================================= */}
                <div className="p-4 bg-[#F6F5F4]/60 border border-black/8 rounded-xl space-y-3.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#0075DE] uppercase tracking-wider">
                    <KeyRound className="w-4 h-4" />
                    <span>3. Nhà Cung Cấp & Khóa Kết Nối Runtime</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div
                      onClick={() => { setEditProvider("gemini"); setEditBaseUrl("https://generativelanguage.googleapis.com"); setTestResult(null); }}
                      className={`p-3.5 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                        editProvider === "gemini" 
                          ? "bg-[#E6F3FE] border-[#0075DE] text-black shadow-2xs" 
                          : "bg-white border-black/8 text-black/80 hover:border-black/20"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#E6F3FE] text-[#0075DE] flex items-center justify-center border border-[#0075DE]/20 shrink-0">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-black">Google AI Studio</span>
                          <span className="text-[9px] bg-[#D0F4D8] text-[#1AAE39] px-1.5 py-0.2 rounded font-bold border border-[#1AAE39]/30">Chính Thức</span>
                        </div>
                        <p className="text-[10px] text-black/50 mt-0.5">Trực tiếp từ Google AI Studio API, hỗ trợ Gemini 2.5/3.5 và Embedding 3072D.</p>
                      </div>
                    </div>

                    <div
                      onClick={() => { setEditProvider("custom_openai"); setEditBaseUrl("https://api.9router.com/v1"); setTestResult(null); }}
                      className={`p-3.5 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                        editProvider === "custom_openai" 
                          ? "bg-[#E6F3FE] border-[#0075DE] text-black shadow-2xs" 
                          : "bg-white border-black/8 text-black/80 hover:border-black/20"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#E0E7FF] text-[#1313BA] flex items-center justify-center border border-[#1313BA]/20 shrink-0">
                        <Globe className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-black">Bên Thứ Ba (9router / OpenRouter)</span>
                          <span className="text-[9px] bg-[#E0E7FF] text-[#1313BA] px-1.5 py-0.2 rounded font-bold border border-[#1313BA]/20">OpenAI Gateway</span>
                        </div>
                        <p className="text-[10px] text-black/50 mt-0.5">Cổng API router ngoài cho phép sử dụng OpenAI, DeepSeek, Claude.</p>
                      </div>
                    </div>
                  </div>

                  {editProvider === "custom_openai" && (
                    <div className="p-3.5 bg-white border border-black/8 rounded-lg space-y-3 animate-in fade-in shadow-2xs">
                      <div>
                        <label className="block text-[11px] font-semibold text-black mb-1.5">
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
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
                              editBaseUrl.includes("9router")
                                ? "bg-[#E0E7FF] text-[#1313BA] border-[#1313BA]/40"
                                : "bg-[#F6F5F4] text-black/70 border-black/10 hover:text-black"
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
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
                              editBaseUrl.includes("openrouter")
                                ? "bg-[#E0E7FF] text-[#1313BA] border-[#1313BA]/40"
                                : "bg-[#F6F5F4] text-black/70 border-black/10 hover:text-black"
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
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
                              editBaseUrl.includes("openai.com")
                                ? "bg-[#E0E7FF] text-[#1313BA] border-[#1313BA]/40"
                                : "bg-[#F6F5F4] text-black/70 border-black/10 hover:text-black"
                            }`}
                          >
                            OpenAI Official
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-black mb-1">
                          Base URL của Router:
                        </label>
                        <input
                          type="text"
                          value={editBaseUrl}
                          onChange={(e) => { setEditBaseUrl(e.target.value); setTestResult(null); }}
                          placeholder="https://api.9router.com/v1"
                          className="w-full bg-[#F6F5F4] border border-black/10 rounded-lg p-2 text-xs text-black font-mono focus:outline-none focus:ring-2 focus:ring-[#0075DE]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-black mb-1">
                          API Key Bên Thứ Ba:
                        </label>
                        <div className="relative">
                          <input
                            type={showApiKey ? "text" : "password"}
                            value={editApiKey}
                            onChange={(e) => { setEditApiKey(e.target.value); setTestResult(null); }}
                            placeholder="Dán API Key của 9router hoặc bên thứ ba..."
                            className="w-full bg-[#F6F5F4] border border-black/10 rounded-lg p-2 pr-16 text-xs text-black font-mono focus:outline-none focus:ring-2 focus:ring-[#0075DE]"
                          />
                          <button
                            type="button"
                            onClick={() => setShowApiKey(!showApiKey)}
                            className="absolute right-2 top-2 text-[10px] text-black/50 hover:text-black"
                          >
                            {showApiKey ? "Ẩn" : "Hiện"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {editProvider === "gemini" && (
                    <div className="p-3.5 bg-white border border-black/8 rounded-lg space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-semibold text-black">
                          Google AI Studio API Key (Để trống nếu dùng key hiện tại trong cấu hình):
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="text-[10px] text-black/50 hover:text-black cursor-pointer"
                        >
                          {showApiKey ? "Ẩn bớt" : "Hiện mã key"}
                        </button>
                      </div>
                      <input
                        type={showApiKey ? "text" : "password"}
                        value={editApiKey}
                        onChange={(e) => { setEditApiKey(e.target.value); setTestResult(null); }}
                        placeholder="Dán Gemini API Key mới nếu muốn thay đổi..."
                        className="w-full bg-[#F6F5F4] border border-black/10 rounded-lg p-2 text-xs text-black font-mono focus:outline-none focus:ring-2 focus:ring-[#0075DE]"
                      />
                    </div>
                  )}
                </div>

                {/* Test Result Banner */}
                {testResult && (
                  <div className={`p-3.5 rounded-lg border text-xs flex items-start gap-2.5 animate-in fade-in ${
                    testResult.success
                      ? "bg-[#D0F4D8] text-[#1AAE39] border-[#1AAE39]/30"
                      : "bg-[#FFE4E6] text-[#F64932] border-[#F64932]/30"
                  }`}>
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-[#1AAE39] shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-[#F64932] shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-0.5">
                      <p className="font-semibold">
                        {testResult.success 
                          ? `Kết nối thành công tới ${editChatModel} (Độ trễ: ${testResult.latencyMs}ms)`
                          : `Kết nối thất bại (${testResult.latencyMs}ms)`}
                      </p>
                      <p className="text-[11px] text-black/70">
                        {testResult.success ? `Phản hồi mẫu: "${testResult.reply}"` : testResult.error}
                      </p>
                    </div>
                  </div>
                )}

                {/* Action Buttons: Ping Test & Apply */}
                <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-black/8">
                  <button
                    type="button"
                    onClick={handleTestModelConnection}
                    disabled={testingModel}
                    className="px-4 py-2 bg-white hover:bg-black/5 text-[#0075DE] font-medium text-xs rounded-lg flex items-center gap-2 border border-black/10 transition disabled:opacity-50 cursor-pointer shadow-2xs"
                  >
                    {testingModel ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang kiểm tra kết nối...</span>
                      </>
                    ) : (
                      <>
                        <Activity className="w-4 h-4 text-[#0075DE]" />
                        <span>Kiểm Tra Kết Nối (Ping Test)</span>
                      </>
                    )}
                  </button>

                  <button
                    type="submit"
                    disabled={savingModel}
                    className="px-5 py-2 bg-[#0075DE] hover:bg-[#0062BD] text-white font-medium text-xs rounded-lg flex items-center gap-2 transition disabled:opacity-50 cursor-pointer shadow-2xs"
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
          <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-5xl mx-auto w-full bg-[#F6F5F4]/30">
            {/* Sub-tab Switcher: Crawl URL vs Upload File */}
            <div className="flex items-center justify-between pb-4 border-b border-black/8">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setKnowledgeSubTab("crawl")}
                  className={`px-4 py-2 rounded-lg text-xs font-medium transition flex items-center gap-2 cursor-pointer ${
                    knowledgeSubTab === "crawl"
                      ? "bg-white text-black font-semibold shadow-2xs border border-black/8"
                      : "bg-[#F6F5F4] text-black/60 hover:bg-black/5 hover:text-black border border-black/10"
                  }`}
                >
                  <Globe className="w-4 h-4 text-[#0075DE]" />
                  <span>Trích Xuất Y Văn Từ URL</span>
                </button>

                <button
                  onClick={() => setKnowledgeSubTab("upload")}
                  className={`px-4 py-2 rounded-lg text-xs font-medium transition flex items-center gap-2 cursor-pointer ${
                    knowledgeSubTab === "upload"
                      ? "bg-white text-black font-semibold shadow-2xs border border-black/8"
                      : "bg-[#F6F5F4] text-black/60 hover:bg-black/5 hover:text-black border border-black/10"
                  }`}
                >
                  <Upload className="w-4 h-4 text-[#1AAE39]" />
                  <span>Nạp Tài Liệu Chuyên Môn</span>
                </button>
              </div>

              <button
                onClick={loadDocs}
                className="px-3 py-1.5 bg-white border border-black/10 hover:bg-black/5 text-black text-xs font-medium rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${docsLoading ? "animate-spin" : ""}`} />
                <span>Làm mới danh mục</span>
              </button>
            </div>

            {/* Input Action Card */}
            {knowledgeSubTab === "crawl" ? (
              <div className="p-5 bg-white border border-black/8 rounded-xl space-y-3 shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#0075DE] uppercase tracking-wider">
                  <Globe className="w-4 h-4" />
                  <span>Thu Thập Chuyên Luận Y Khoa Trực Tuyến</span>
                </div>
                <p className="text-xs text-black/60">
                  Hệ thống tự động trích xuất nội dung bài viết, bóc tách thẻ HTML thừa, chia nhỏ văn bản và đồng bộ vector trực tiếp lên Qdrant Cloud.
                </p>

                <form onSubmit={handleCrawl} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="url"
                    value={crawlUrl}
                    onChange={(e) => setCrawlUrl(e.target.value)}
                    placeholder="Dán đường dẫn bài viết y khoa (ví dụ: https://vinmec.com/... hay NIH...)"
                    className="flex-1 bg-[#F6F5F4] border border-black/10 rounded-lg px-3.5 py-2 text-xs text-black placeholder-black/40 focus:outline-none focus:ring-2 focus:ring-[#0075DE] font-sans"
                  />
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleInspectUrl}
                      disabled={inspectingUrl || !crawlUrl.trim()}
                      className="px-3.5 py-2 bg-white hover:bg-black/5 text-black font-medium text-xs rounded-lg flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer border border-black/10 shrink-0 shadow-2xs"
                      title="Kiểm tra sơ bộ nội dung bài viết trước khi cào"
                    >
                      {inspectingUrl ? (
                        <Loader2 className="w-4 h-4 animate-spin text-[#0075DE]" />
                      ) : (
                        <Eye className="w-4 h-4 text-[#0075DE]" />
                      )}
                      <span>Kiểm tra link</span>
                    </button>
                    <button
                      type="submit"
                      disabled={crawling || !crawlUrl.trim()}
                      className="px-5 py-2 bg-[#0075DE] hover:bg-[#0062BD] text-white font-medium text-xs rounded-lg flex items-center gap-2 transition disabled:opacity-50 cursor-pointer shrink-0 shadow-2xs"
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
                  <div className="p-3.5 bg-[#F6F5F4] rounded-lg border border-black/8 text-xs space-y-2 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-black font-semibold">
                        <CheckCircle className="w-4 h-4 text-[#1AAE39]" />
                        <span>Kết Quả Kiểm Tra Sơ Bộ: {inspectionResult.title || "Trang web y tế"}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        inspectionResult.quality === "good" ? "bg-[#D0F4D8] text-[#1AAE39] border border-[#1AAE39]/30" : "bg-[#FEF3C7] text-[#D97706] border border-[#FFB110]/30"
                      }`}>
                        Chất lượng: {inspectionResult.quality}
                      </span>
                    </div>
                    <div className="text-black/60 text-[11px] flex gap-4">
                      <span>Độ dài văn bản: <strong>{inspectionResult.textLength}</strong> ký tự</span>
                      <span>Số đoạn văn: <strong>{inspectionResult.paragraphCount}</strong></span>
                      <span>Hình ảnh: <strong>{inspectionResult.imageCount}</strong></span>
                    </div>
                    {inspectionResult.previewSnippet && (
                      <p className="text-black/70 text-[11px] line-clamp-2 italic bg-white p-2 rounded-md border border-black/8">
                        "{inspectionResult.previewSnippet}"
                      </p>
                    )}
                    {inspectionResult.shouldWarn && showWarningModal && inspectionResult.warningMessage && (
                      <div className="p-3 bg-[#FEF3C7] border border-[#FFB110]/30 rounded-lg text-[#D97706] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0" />
                          <span>{inspectionResult.warningMessage}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => setShowWarningModal(false)}
                            className="text-[11px] text-black/60 hover:text-black px-2 py-1 rounded cursor-pointer"
                          >
                            Đóng cảnh báo
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCrawl()}
                            disabled={crawling}
                            className="px-3 py-1 bg-[#D97706] hover:bg-[#B45309] text-white font-medium text-xs rounded-lg transition cursor-pointer"
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
              <div className="p-5 bg-white border border-black/8 rounded-xl space-y-3 shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#1AAE39] uppercase tracking-wider">
                  <Upload className="w-4 h-4" />
                  <span>Nạp Chuyên Luận Y Khoa Cục Bộ</span>
                </div>
                <p className="text-xs text-black/60">
                  Tải lên tệp tài liệu y khoa (.txt, .md, .pdf). Hệ thống tự động phân tích và tạo embedding vector đưa vào cơ sở dữ liệu tri thức lâm sàng.
                </p>

                <form onSubmit={handleFileUpload} className="space-y-3">
                  <div className="border-2 border-dashed border-black/10 rounded-xl p-6 text-center hover:border-[#0075DE]/40 transition bg-[#F6F5F4]/40">
                    <input
                      id="portal-upload-input"
                      type="file"
                      accept=".txt,.md,.pdf"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <label htmlFor="portal-upload-input" className="cursor-pointer block">
                      <FileText className="w-8 h-8 text-black/40 mx-auto mb-2" />
                      <span className="text-xs font-medium text-black block">
                        {selectedFile ? selectedFile.name : "Nhấn để chọn tệp tài liệu (.txt, .md, .pdf)"}
                      </span>
                      <span className="text-[11px] text-black/40 mt-1 block">
                        Dung lượng tối đa khuyến nghị: 15MB
                      </span>
                    </label>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={uploadingFile || !selectedFile}
                      className="px-5 py-2 bg-[#0075DE] hover:bg-[#0062BD] text-white font-medium text-xs rounded-lg flex items-center gap-2 transition disabled:opacity-50 cursor-pointer shadow-2xs"
                    >
                      {uploadingFile ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Đang nạp và phân đoạn tài liệu...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span>Nạp Tài Liệu Ngay</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Document List Table (Notion Database Layout) */}
            <div className="bg-white border border-black/8 rounded-xl overflow-hidden shadow-2xs">
              <div className="p-4 border-b border-black/8 flex items-center justify-between bg-white">
                <div>
                  <h3 className="text-xs font-semibold text-black uppercase tracking-wider">
                    Danh Mục Tài Liệu Đã Nạp ({documents.length})
                  </h3>
                  <p className="text-[11px] text-black/50 mt-0.5">
                    Đồng bộ 2 chiều giữa Cơ sở dữ liệu SQLite và Qdrant Vector Cloud.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F6F5F4] text-black/55 uppercase font-semibold text-[11px] tracking-[0.04em] border-b border-black/8">
                    <tr>
                      <th className="px-4 py-2.5">Tên Tài Liệu</th>
                      <th className="px-4 py-2.5">Nguồn</th>
                      <th className="px-4 py-2.5">Số Lượng Chunks</th>
                      <th className="px-4 py-2.5">Dung Lượng</th>
                      <th className="px-4 py-2.5">Ngày Cập Nhật</th>
                      <th className="px-4 py-2.5 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/6 bg-white">
                    {docsLoading ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-black/40">
                          <Loader2 className="w-5 h-5 animate-spin mx-auto text-[#0075DE] mb-2" />
                          <span>Đang nạp danh mục tài liệu...</span>
                        </td>
                      </tr>
                    ) : documents.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-black/40">
                          Chưa có tài liệu nào trong hệ thống. Hãy nạp file hoặc cào từ URL phía trên.
                        </td>
                      </tr>
                    ) : (
                      documents.map((doc) => {
                        const cleanTitle = cleanDocDisplayTitle(doc.title, doc.fileName);
                        return (
                          <tr key={doc.id} className="hover:bg-[#F6F5F4]/60 transition">
                            <td className="px-4 py-3">
                              <div 
                                onClick={() => handleOpenDocViewer(doc.id)}
                                className="font-semibold text-black flex items-center gap-2 cursor-pointer hover:text-[#0075DE] transition"
                                title="Nhấn để mở xem toàn văn định dạng đẹp"
                              >
                                <FileText className="w-4 h-4 text-[#0075DE] shrink-0" />
                                <span className="truncate max-w-sm" title={cleanTitle}>
                                  {cleanTitle}
                                </span>
                              </div>
                              <div className="text-[10px] text-black/50 mt-0.5 truncate max-w-sm font-mono">
                                Tệp: {doc.fileName}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {doc.sourceType === "crawled" || doc.sourceUrl ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#E6F3FE] text-[#0075DE] border border-[#0075DE]/20">
                                  <Globe className="w-3 h-3" />
                                  <span>Nguồn Web</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#EADBFA] text-[#6B21A8] border border-[#6B21A8]/20">
                                  <Upload className="w-3 h-3" />
                                  <span>Tệp Cục Bộ</span>
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#D0F4D8] text-[#1AAE39] border border-[#1AAE39]/30 font-mono">
                                {doc.chunkCount} đoạn y văn
                              </span>
                            </td>
                            <td className="px-4 py-3 text-black/60 font-mono text-[11px]">
                              {(doc.fileSizeBytes / 1024).toFixed(1)} KB
                            </td>
                            <td className="px-4 py-3 text-black/60 text-[11px]">
                              {new Date(doc.uploadedAtUtc).toLocaleDateString("vi-VN")}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => handleOpenDocViewer(doc.id)}
                                  className="p-1.5 text-black/40 hover:text-[#0075DE] rounded-md hover:bg-black/5 transition cursor-pointer"
                                  title="Xem toàn văn tài liệu định dạng đẹp"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteDoc(doc.id, cleanTitle)}
                                  className="p-1.5 text-black/40 hover:text-[#F64932] rounded-md hover:bg-rose-50 transition cursor-pointer"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="bg-white border border-black/10 rounded-xl shadow-notion-float w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-black">
              {/* Header */}
              <div className="px-6 py-4 border-b border-black/8 flex flex-wrap items-center justify-between gap-3 bg-white">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-[#E6F3FE] text-[#0075DE] flex items-center justify-center border border-[#0075DE]/20 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-black flex items-center gap-2 truncate">
                      <span>{viewingDoc ? cleanDocDisplayTitle(viewingDoc.title, viewingDoc.fileName) : "Đang tải tài liệu..."}</span>
                    </h3>
                    {viewingDoc && (
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-black/50 mt-0.5">
                        <span className="truncate max-w-xs text-black/70 font-mono">Tệp: {viewingDoc.fileName}</span>
                        <span>•</span>
                        <span className="text-[#0075DE] font-semibold">{viewingDoc.chunkCount} đoạn y văn</span>
                        <span>•</span>
                        <span>{(viewingDoc.fileSizeBytes / 1024).toFixed(1)} KB</span>
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
                                  className="text-[#0075DE] hover:text-[#0062BD] hover:underline flex items-center gap-1 font-medium"
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
                      <div className="flex bg-[#F6F5F4] border border-black/8 rounded-lg p-1">
                        <button
                          type="button"
                          onClick={() => setDocViewMode("formatted")}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                            docViewMode === "formatted"
                              ? "bg-white text-black shadow-2xs"
                              : "text-black/60 hover:text-black"
                          }`}
                          title="Định dạng bài viết đẹp với Markdown & typography"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-[#0075DE]" />
                          <span className="hidden sm:inline">Định dạng đẹp</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDocViewMode("raw")}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                            docViewMode === "raw"
                              ? "bg-white text-black shadow-2xs"
                              : "text-black/60 hover:text-black"
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
                        className="px-3 py-1.5 bg-[#F6F5F4] hover:bg-black/5 text-black rounded-lg text-xs font-medium flex items-center gap-1.5 border border-black/10 transition cursor-pointer shadow-2xs"
                        title="Sao chép toàn bộ văn bản thô"
                      >
                        {copiedDocContent ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-[#1AAE39]" />
                            <span className="text-[#1AAE39]">Đã chép</span>
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
                        className="p-2 bg-[#F6F5F4] hover:bg-black/5 text-black rounded-lg border border-black/10 transition cursor-pointer shadow-2xs"
                        title="Tải tệp .txt về máy"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setViewingDoc(null)}
                    className="p-1.5 text-black/40 hover:text-black rounded-lg hover:bg-black/5 transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Sub-header: Tìm kiếm từ khóa trong tài liệu */}
              {viewingDoc && (
                <div className="px-6 py-2.5 bg-[#F6F5F4] border-b border-black/8 flex items-center justify-between gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-black/40" />
                    <input
                      type="text"
                      value={docSearchQuery}
                      onChange={(e) => setDocSearchQuery(e.target.value)}
                      placeholder="Tìm từ khóa trong văn bản..."
                      className="w-full bg-white border border-black/10 rounded-lg pl-8 pr-3 py-1 text-xs text-black placeholder-black/40 focus:outline-none focus:ring-2 focus:ring-[#0075DE]"
                    />
                  </div>
                  {docSearchQuery.trim() && (
                    <span className="text-[11px] text-[#0075DE] font-mono">
                      {(() => {
                        const count = (viewingDoc.content.match(new RegExp(docSearchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length;
                        return `Tìm thấy ${count} lần xuất hiện`;
                      })()}
                    </span>
                  )}
                </div>
              )}

              {/* Content Body */}
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-white">
                {docDetailLoading ? (
                  <div className="py-20 flex flex-col items-center justify-center text-black/40 text-xs gap-3">
                    <Loader2 className="w-7 h-7 animate-spin text-[#0075DE]" />
                    <span>Đang trích xuất toàn văn chuyên luận y khoa...</span>
                  </div>
                ) : viewingDoc ? (
                  docViewMode === "formatted" ? (
                    <div
                      className="prose prose-sm sm:prose-base max-w-none leading-relaxed text-black/85 
                        [&_h1]:text-black [&_h1]:text-lg [&_h1]:font-bold [&_h1]:border-b [&_h1]:border-black/8 [&_h1]:pb-2
                        [&_h2]:text-black [&_h2]:text-base [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-3
                        [&_h3]:text-black/80 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2
                        [&_blockquote]:bg-[#F6F5F4] [&_blockquote]:border-l-4 [&_blockquote]:border-[#0075DE] [&_blockquote]:px-4 [&_blockquote]:py-3 [&_blockquote]:rounded-r-lg [&_blockquote]:text-black/80
                        [&_ul]:my-2 [&_li]:my-1
                        [&_table]:w-full [&_table]:border-collapse [&_th]:bg-[#F6F5F4] [&_th]:p-2 [&_th]:border [&_th]:border-black/10 [&_td]:p-2 [&_td]:border [&_td]:border-black/10"
                      dangerouslySetInnerHTML={{
                        __html: marked.parse(
                          docSearchQuery.trim()
                            ? viewingDoc.content.replace(
                                new RegExp(`(${docSearchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'),
                                '<mark class="bg-[#FEF3C7] text-black font-semibold px-1 rounded border border-[#FFB110]/40">$1</mark>'
                              )
                            : viewingDoc.content || "*Tài liệu không có nội dung văn bản.*",
                          { breaks: true }
                        ) as string
                      }}
                    />
                  ) : (
                    <pre className="whitespace-pre-wrap font-mono text-xs text-black/80 bg-[#F6F5F4] p-4 rounded-xl border border-black/8 overflow-x-auto leading-relaxed">
                      {viewingDoc.content}
                    </pre>
                  )
                ) : null}
              </div>

              {/* Footer */}
              {viewingDoc && (
                <div className="px-6 py-3 border-t border-black/8 bg-white flex items-center justify-between text-[11px] text-black/60">
                  <div className="flex items-center gap-2">
                    <span>Mã ID: <code className="text-[#0075DE] font-mono">{viewingDoc.id}</code></span>
                    <span>•</span>
                    <span>{viewingDoc.content?.length.toLocaleString() || 0} ký tự</span>
                  </div>
                  <button
                    onClick={() => setViewingDoc(null)}
                    className="px-4 py-1.5 bg-[#F6F5F4] hover:bg-black/5 text-black rounded-lg text-xs font-semibold border border-black/10 transition cursor-pointer"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="bg-white border border-black/10 rounded-xl w-full max-w-xl overflow-hidden shadow-notion-float space-y-4 p-5 text-black">
              <div className="flex items-center justify-between pb-3 border-b border-black/8">
                <div className="flex items-center gap-2 text-[#0075DE] font-semibold text-sm">
                  <ShieldCheck className="w-5 h-5" />
                  <span>Cấu hình Firestore Security Rules để hiển thị User</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRulesModal(false)}
                  className="text-black/40 hover:text-black cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs text-black/70 space-y-2 leading-relaxed">
                <p>
                  Nếu danh sách người dùng hiển thị 0 user hoặc báo lỗi <code>permission-denied</code>, nghĩa là Firestore Security Rules của dự án Firebase đang chặn quyền đọc bộ sưu tập <code>/users</code>.
                </p>
                <p className="font-semibold text-black">
                  Các bước mở quyền trên Firebase Console:
                </p>
                <ol className="list-decimal pl-5 space-y-1 text-black/60 text-[11px]">
                  <li>Truy cập <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="text-[#0075DE] underline">Firebase Console</a> &gt; <strong>Firestore Database</strong> &gt; Tab <strong>Rules</strong>.</li>
                  <li>Dán đoạn mã quy tắc dưới đây và nhấn <strong>Publish</strong>:</li>
                </ol>
              </div>

              <div className="relative bg-[#F6F5F4] p-3 rounded-lg border border-black/8 font-mono text-[11px] text-black/80 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => {
                    const rulesText = `rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /users/{userId} {\n      allow read, write: if true;\n    }\n    match /users/{userId}/conversations/{convId} {\n      allow read, write: if true;\n      match /messages/{msgId} {\n        allow read, write: if true;\n      }\n    }\n    match /incidents/{incidentId} {\n      allow read, write: if true;\n    }\n  }\n}`;
                    navigator.clipboard.writeText(rulesText);
                    setCopiedRules(true);
                    setTimeout(() => setCopiedRules(false), 2000);
                  }}
                  className="absolute right-2.5 top-2.5 px-2.5 py-1 bg-white hover:bg-black/5 text-[#0075DE] rounded text-[10px] font-sans font-medium flex items-center gap-1 border border-black/10 cursor-pointer shadow-2xs"
                >
                  {copiedRules ? (
                    <>
                      <Check className="w-3 h-3 text-[#1AAE39]" />
                      <span className="text-[#1AAE39]">Đã sao chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Sao chép quy tắc</span>
                    </>
                  )}
                </button>
                <pre className="text-black/80 text-[10.5px] leading-relaxed">
{`rules_version = '2';
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
}`}
                </pre>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowRulesModal(false)}
                  className="px-4 py-1.5 bg-[#0075DE] hover:bg-[#0062BD] text-white rounded-lg text-xs font-medium cursor-pointer shadow-2xs"
                >
                  Đã hiểu
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
