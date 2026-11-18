export type RagMode = "strict" | "balanced" | "flexible";

export interface CitationItem {
  citationId: string;
  documentId: string;
  documentName: string;
  startOffset: number;
  endOffset: number;
  snippet: string;
  relevanceScore: number;
  sourceType?: "internal" | "external";
  url?: string;
  verifiedOrg?: string;
}

export interface ChatMetadata {
  citations: CitationItem[];
  safetyLevel: string;
  isRefusal: boolean;
  mode?: RagMode;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  safetyLevel?: string;
  citations?: CitationItem[];
  isRefusal?: boolean;
  mode?: RagMode;
  timestamp?: any;
}

export interface DocumentInfo {
  id: string;
  title: string;
  fileName: string;
  rawFilePath?: string;
  normalizedFilePath?: string;
  sourceUrl?: string;
  sourceType?: string;
  fileSizeBytes: number;
  uploadedAtUtc: string;
  chunkCount: number;
}

export interface DocumentDetail extends DocumentInfo {
  content: string;
}

export interface CrawlInspectionResult {
  url: string;
  title: string;
  textLength: number;
  paragraphCount: number;
  imageCount: number;
  previewSnippet: string;
  quality: string;
  warningMessage?: string;
  shouldWarn: boolean;
}

export interface ModelCatalogItem {
  id: string;
  name: string;
  tag: string;
  desc: string;
  category?: string;
  rpm?: string;
  tpm?: string;
  rpd?: string;
  recommended?: boolean;
  defaultPriority?: number;
  dimensions?: number;
  active?: boolean;
}

export interface ModelsCatalog {
  googleStudio: {
    chatModels: ModelCatalogItem[];
    embeddingModels: ModelCatalogItem[];
  };
  thirdPartyPresets: {
    name: string;
    baseUrl: string;
    recommendedModels: string[];
  }[];
}

const API_BASE = ""; // Relative path to support same-origin deployment

export async function streamChat(
  message: string,
  mode: RagMode,
  onMetadata: (meta: ChatMetadata) => void,
  onToken: (token: string) => void,
  onDone: () => void,
  onError: (err: any) => void
) {
  try {
    const response = await fetch(`${API_BASE}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, mode })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || `Lỗi máy chủ (${response.status})`);
    }

    if (!response.body) {
      throw new Error("Không nhận được dữ liệu stream từ máy chủ.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";

      for (const block of lines) {
        if (!block.trim()) continue;

        let eventType = "message";
        let dataStr = "";

        const subLines = block.split("\n");
        for (const line of subLines) {
          if (line.startsWith("event: ")) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith("data: ")) {
            dataStr = line.slice(6).trim();
          }
        }

        if (eventType === "metadata") {
          try {
            const meta: ChatMetadata = JSON.parse(dataStr);
            onMetadata(meta);
          } catch (e) {
            console.error("Lỗi parse metadata", e);
          }
        } else if (eventType === "token") {
          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.token) {
              onToken(parsed.token);
            }
          } catch {
            onToken(dataStr);
          }
        } else if (eventType === "done" || dataStr === "[DONE]") {
          onDone();
          return;
        }
      }
    }

    onDone();
  } catch (err) {
    onError(err);
  }
}

export async function getDocuments(): Promise<DocumentInfo[]> {
  const res = await fetch(`${API_BASE}/api/documents`);
  if (!res.ok) throw new Error("Không thể tải danh sách tài liệu");
  return await res.json();
}

export async function getDocumentDetail(id: string): Promise<DocumentDetail> {
  const res = await fetch(`${API_BASE}/api/documents/${id}`);
  if (!res.ok) throw new Error("Không thể tải nội dung tài liệu");
  return await res.json();
}

export async function verifyAdminKey(adminKey: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/api/admin/verify`, {
    method: "POST",
    headers: {
      "X-Admin-Key": adminKey
    }
  });
  return res.ok;
}

export async function adminUploadDocument(file: File, adminKey: string): Promise<DocumentInfo> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/api/admin/documents`, {
    method: "POST",
    headers: {
      "X-Admin-Key": adminKey
    },
    body: formData
  });

  if (!res.ok) {
    if (res.status === 401) throw new Error("Mật khẩu Admin không chính xác.");
    const err = await res.json().catch(() => ({ error: "Tải lên thất bại." }));
    throw new Error(err.error || "Tải lên thất bại.");
  }

  return await res.json();
}

export async function adminCrawlDocument(url: string, adminKey: string): Promise<{ document: DocumentInfo; message: string }> {
  const res = await fetch(`${API_BASE}/api/admin/documents/crawl`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Key": adminKey
    },
    body: JSON.stringify({ url })
  });

  if (!res.ok) {
    if (res.status === 401) throw new Error("Mật khẩu Admin không chính xác.");
    const err = await res.json().catch(() => ({ error: "Cào dữ liệu thất bại." }));
    throw new Error(err.error || "Cào dữ liệu thất bại.");
  }

  return await res.json();
}

export async function adminDeleteDocument(id: string, adminKey: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/admin/documents/${id}`, {
    method: "DELETE",
    headers: {
      "X-Admin-Key": adminKey
    }
  });

  if (!res.ok) {
    if (res.status === 401) throw new Error("Mật khẩu Admin không chính xác.");
    throw new Error("Không thể xóa tài liệu.");
  }
}

export async function getHealth() {
  const res = await fetch(`${API_BASE}/api/health`);
  return await res.json();
}

export interface QuotaMetrics {
  totalChatRequests: number;
  totalEmbeddingRequests: number;
  totalTokensEstimated: number;
  activeProvider: string;
  activeChatModel: string;
  activeEmbeddingModel: string;
  failoverEventsCount: number;
  uptimeSeconds: number;
  successfulRequests?: number;
  failedRequests?: number;
  estimatedInputTokens?: number;
  estimatedOutputTokens?: number;
}

export interface ModelConfigInfo {
  provider: string;
  model: string;
  chatModel?: string;
  chatModels?: string[];
  activeChatModel?: string;
  embeddingModel: string;
  embeddingModels?: string[];
  activeEmbeddingModel?: string;
  baseUrl: string;
  hasApiKey: boolean;
  lastSwitchedAtUtc?: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  vectorStore?: string;
  totalChunks?: number;
}

export async function adminGetModelConfig(adminKey: string): Promise<ModelConfigInfo> {
  const res = await fetch(`${API_BASE}/api/admin/model-config`, {
    headers: { "X-Admin-Key": adminKey }
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error("Mật khẩu Admin không chính xác.");
    throw new Error("Không thể tải cấu hình model");
  }
  return await res.json();
}

export async function adminUpdateModelConfig(
  adminKey: string,
  payload: {
    provider?: string;
    model?: string;
    chatModel?: string;
    embeddingModel?: string;
    apiKey?: string;
    baseUrl?: string;
  }
): Promise<{ success: boolean; message: string; config: ModelConfigInfo }> {
  const res = await fetch(`${API_BASE}/api/admin/model-config`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Key": adminKey
    },
    body: JSON.stringify({
      provider: payload.provider,
      model: payload.model || payload.chatModel,
      baseUrl: payload.baseUrl,
      apiKey: payload.apiKey,
      embeddingModel: payload.embeddingModel
    })
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error("Mật khẩu Admin không chính xác.");
    const err = await res.json().catch(() => ({ error: "Cập nhật cấu hình model thất bại." }));
    throw new Error(err.error || "Cập nhật cấu hình model thất bại.");
  }
  return await res.json();
}

export async function adminGetMetrics(adminKey: string): Promise<QuotaMetrics> {
  const res = await fetch(`${API_BASE}/api/admin/metrics`, {
    headers: { "X-Admin-Key": adminKey }
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error("Mật khẩu Admin không chính xác.");
    throw new Error("Không thể tải chỉ số metrics");
  }
  return await res.json();
}

export async function adminInspectUrl(url: string, adminKey: string): Promise<CrawlInspectionResult> {
  const res = await fetch(`${API_BASE}/api/admin/documents/crawl/inspect`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Key": adminKey
    },
    body: JSON.stringify({ url })
  });

  if (!res.ok) {
    if (res.status === 401) throw new Error("Mật khẩu Admin không chính xác.");
    const err = await res.json().catch(() => ({ error: "Kiểm tra sơ bộ trang web thất bại." }));
    throw new Error(err.error || "Kiểm tra sơ bộ trang web thất bại.");
  }

  return await res.json();
}

export async function adminGetModelsCatalog(adminKey: string): Promise<ModelsCatalog> {
  const res = await fetch(`${API_BASE}/api/admin/models/catalog`, {
    headers: { "X-Admin-Key": adminKey }
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error("Mật khẩu Admin không chính xác.");
    throw new Error("Không thể tải danh mục models.catalog.json");
  }
  return await res.json();
}

export async function adminTestModelConfig(
  adminKey: string,
  payload: {
    provider: string;
    model: string;
    baseUrl?: string;
    apiKey?: string;
  }
): Promise<{ success: boolean; latencyMs: number; reply?: string; error?: string }> {
  const res = await fetch(`${API_BASE}/api/admin/model-test`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Key": adminKey
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error("Mật khẩu Admin không chính xác.");
    const err = await res.json().catch(() => ({ error: "Kiểm tra kết nối thất bại." }));
    throw new Error(err.error || "Kiểm tra kết nối thất bại.");
  }
  return await res.json();
}

