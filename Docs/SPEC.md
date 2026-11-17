# Technical Specification: Chatbot Tư Vấn An Toàn Thuốc Cho Phụ Nữ Cho Con Bú (Chatbot_v1)

## Problem Statement

Phụ nữ trong giai đoạn nuôi con bằng sữa mẹ thường xuyên gặp các vấn đề sức khỏe thông thường (cảm sốt, đau đầu, viêm họng, dị ứng, tắc tia sữa) nhưng mang tâm lý hoang mang, lo lắng không biết loại thuốc nào an toàn cho con nhỏ. Trẻ sơ sinh có chức năng gan thận chưa hoàn thiện, nhiều loại thuốc bài tiết qua sữa mẹ có thể gây độc tính cấp tính, ức chế hô hấp hoặc làm mất nguồn sữa mẹ hoàn toàn.

Khi tìm kiếm trên mạng xã hội hoặc sử dụng các công cụ AI hội thoại phổ thông, người dùng thường nhận được thông tin không kiểm chứng hoặc bịa đặt (hallucination) với giọng văn rất tự tin. Người dùng và nhân viên y tế cần một công cụ tra cứu y văn chuyên biệt, minh bạch, tuyệt đối không bịa đặt, có khả năng chỉ rõ bằng chứng y khoa trực tiếp từ tài liệu kiểm duyệt, đồng thời cho phép quản trị viên y tế kiểm soát chặt chẽ kho tài liệu mà không bị can thiệp bởi người dùng thông thường.

## Solution

Xây dựng hệ thống trợ lý ảo y tế chuyên sâu vận hành theo cơ chế RAG khép kín (Closed-Domain Retrieval-Augmented Generation) kết hợp kiến trúc phân tách rõ ràng:
* **Tầng Máy chủ & Lõi Trí tuệ (Backend):** Sử dụng .NET 8 Web API làm nền tảng xử lý logic, tính toán vector tương đồng siêu nhẹ và thực thi rào chắn an toàn (Strict System Prompt). Toàn bộ kết nối mô hình ngôn ngữ được trừu tượng hóa để mặc định sử dụng Google Gemini 1.5 Flash miễn phí 100%, đồng thời cho phép chuyển đổi sang các dịch vụ trung gian (như 9router hoặc OpenAI-compatible API) chỉ qua biến môi trường.
* **Tầng Quản trị Tài liệu Y văn (Admin Knowledge Management):** Chỉ tài khoản Quản trị viên (Admin) mới có quyền tải lên (.txt, .md, .pdf) hoặc xóa tài liệu y văn. Toàn bộ file được lưu trữ cục bộ và đánh chỉ mục vector kèm tọa độ vị trí ký tự (StartOffset, EndOffset).
* **Tầng Giao diện Người dùng (Frontend):** Ứng dụng Single Page Application bằng React, TypeScript, Vite và Tailwind CSS mô phỏng trải nghiệm ChatGPT với sidebar lưu lịch sử chat qua Firebase.
* **Cơ chế Bôi đậm Trích dẫn Minh bạch (Citation Highlight Viewer):** Mỗi khi câu trả lời đưa ra khuyến cáo an toàn, hệ thống đính kèm các thẻ trích dẫn. Khi người dùng nhấp vào trích dẫn, một cửa sổ tài liệu sẽ mở ra, tự động cuộn đến và bôi đậm (highlight) chính xác đoạn văn bản gốc trong tài liệu y tế.

---

## User Stories

### Nhóm Trải nghiệm Người dùng & Người Mẹ Cho Con Bú
1. As a nursing mother, I want to ask questions about common medications in natural conversational Vietnamese, so that I can quickly know if a drug is safe while breastfeeding.
2. As a nursing mother, I want to clearly see a visual safety level badge (Compatible / Caution / Contraindicated / Unknown) on every answer, so that I can immediately grasp the risk level without reading confusing medical jargon.
3. As a nursing mother, I want to see the response stream smoothly word-by-word like ChatGPT, so that I don't feel like the application is frozen while waiting for the AI to think.
4. As a nursing mother, I want the chatbot to strictly cite trusted medical literature for its claims, so that I can be confident the advice is evidence-based and not hallucinated.
5. As a nursing mother, I want to click directly on a citation tag (e.g. `[LactMed: Paracetamol]`), so that a document viewer opens, automatically scrolls to, and highlights the exact passage supporting the claim.
6. As a nursing mother, I want the chatbot to clearly tell me optimal timing for medication (e.g. taking the dose immediately after nursing), so that I can minimize drug concentration in the milk during subsequent feeds.
7. As a nursing mother, I want the chatbot to warn me of specific infant symptoms to monitor (e.g. drowsiness, diarrhea, rash), so that I know when to contact a pediatrician.
8. As a nursing mother, I want the chatbot to explicitly refuse to invent information when an unresearched or fictitious drug is asked about, so that my baby is never endangered by speculative advice.
9. As a nursing mother, I want the chatbot to refuse to act as an automated prescribing doctor, so that I am always reminded to consult a physician for official medical diagnoses.
10. As a nursing mother, I want to see a prominent and persistent medical disclaimer on the screen, so that I understand this tool is an informational aid rather than emergency care.
11. As a registered user, I want to log in effortlessly using Google One-Click or Email/Password, so that my conversation threads are saved across devices.
12. As a registered user, I want to see all my previous chat sessions in a left-hand sidebar, so that I can revisit previous medication advice whenever symptoms recur.
13. As a registered user, I want to start a clean new chat session with a single click, so that I can inquire about a completely different drug without polluting previous context.
14. As an anonymous guest user, I want to be able to immediately ask questions without being forced to create an account first, so that I can get urgent medication advice in emergency situations.

### Nhóm Quản Trị Viên Y Tế (Medical Administrator)
15. As a medical administrator, I want to access a protected Admin panel using a secure secret key, so that ordinary users cannot access literature management tools.
16. As a medical administrator, I want to upload verified clinical monographs in `.txt`, `.md`, or `.pdf` formats, so that the chatbot's knowledge base expands over time.
17. As a medical administrator, I want the system to automatically parse uploaded files, compute chunk offsets, and generate vector embeddings, so that newly added documents become immediately queryable.
18. As a medical administrator, I want to view a complete inventory of all active documents in the knowledge base, so that I know what literature is currently governing chatbot responses.
19. As a medical administrator, I want to delete an outdated or retracted medication monograph with one click, so that obsolete medical guidance is instantly purged from both disk and vector index.
20. As a medical administrator, I want ordinary users to have strictly read-only access to documents, so that the clinical knowledge repository cannot be vandalized, overwritten, or modified by external users.

### Nhóm Kỹ Sư & Vận Hành Hệ Thống (DevOps & System Operators)
21. As a system operator, I want the backend to run on .NET 8 Web API, so that it runs with high performance, native SIMD vector calculations, and zero Python syntax hurdles.
22. As a system operator, I want to configure the LLM provider via environment variables with a default to free Google Gemini 1.5 Flash, so that the project can be deployed and run with 0 VNĐ operating cost.
23. As a system operator, I want to switch the LLM provider to a custom OpenAI-compatible endpoint (such as 9router or local LLM) by simply changing environment variables, so that I don't have to rewrite any C# code when switching proxies.
24. As a system operator, I want both the .NET Web API and the React SPA frontend to be packaged into a single unified Docker container, so that deployment to cloud platforms like Render has zero CORS issues and requires only a single port.
25. As a system operator, I want all sensitive credentials (API keys, Firebase configs) to be configured via environment variables and placeholder files, so that no secrets are ever committed to version control.

---

## Implementation Decisions

### 1. Seams and Boundaries
The system defines exactly two high-level HTTP contract seams:
1. **Public Clinical Seam:**
   * `POST /api/chat`: Accepts conversation input and returns an SSE event stream containing streamed response tokens, safety classification metadata, and an array of citation objects with exact text offsets.
   * `GET /api/documents/{id}`: Returns the raw text content of an active monograph to feed the Frontend citation highlighting viewer.
   * `GET /api/health`: Provides liveness/readiness telemetry for keep-alive checks on cloud hosts.
2. **Administrative Seam:**
   * `POST /api/admin/documents`: Multipart file upload endpoint secured by `X-Admin-Key` header; executes document parsing, offset tracking, embedding generation, and SQLite indexing.
   * `GET /api/admin/documents`: Returns list of all active documents, chunk counts, and file sizes.
   * `DELETE /api/admin/documents/{id}`: Cascade deletes file from disk and associated chunk embeddings from SQLite.

### 2. Module Decomposition
The solution is organized into 4 projects matching the existing repository folders:
* `src/Chatbot.Be`: The host application; configures ASP.NET Core Minimal API, dependency injection, CORS, static file serving (`wwwroot`), and Admin authorization middleware.
* `src/Chatbot.Rag`: The algorithmic engine; contains document parsers, the text chunker that records start and end character offsets, the SIMD cosine similarity calculator, the LLM provider abstraction, and the strict prompt builder.
* `src/Chatbot.Data`: The persistence layer; manages physical document storage in `src/Chatbot.Data/documents/` and index persistence via SQLite in `src/Chatbot.Data/index/knowledge.db`.
* `src/Chatbot.Fe`: The presentation layer; modern React application utilizing Tailwind CSS, Lucide icons, Firebase JS SDK, and an in-memory text offset highlighter.

### 3. Data Shapes and Contracts

#### Citation and Offset Shape
```json
{
  "citationId": "cite_01",
  "documentId": "doc_paracetamol_lactmed",
  "documentName": "Paracetamol_LactMed.txt",
  "startOffset": 142,
  "endOffset": 389,
  "snippet": "Paracetamol bài tiết vào sữa mẹ ở tỷ lệ rất thấp (0.1% - 2%)..."
}
```

#### LLM Provider Abstraction
The system utilizes two decoupled interfaces:
* `IEmbeddingClient`: Defines `Task<float[]> GenerateEmbeddingAsync(string text, CancellationToken ct)`.
* `ILlmClient`: Defines `IAsyncEnumerable<string> StreamChatAsync(string systemPrompt, string userPrompt, CancellationToken ct)`.
A factory resolves either `GeminiClient` (direct Google API) or `OpenAiCompatibleClient` (compatible with 9router, OpenAI, OpenRouter) based on the `LLM_PROVIDER` environment variable.

### 4. Citation Highlighting Mechanism
When a citation is activated in the React UI:
1. The client queries `GET /api/documents/{documentId}` to obtain the full text.
2. The UI splits the text into three segments: `text.substring(0, startOffset)`, `text.substring(startOffset, endOffset)`, and `text.substring(endOffset)`.
3. The middle segment is wrapped in a `<mark id="active-citation" className="bg-yellow-200 text-gray-900 font-semibold px-1 rounded">`.
4. The client issues a smooth scroll instruction to center `#active-citation` in the document view pane.

---

## Testing Decisions

### Guiding Principles
Tests will exercise external behavior through the highest available seams (HTTP endpoints and public engine interfaces), completely ignoring internal private mechanics. A good test asserts that:
* Given a query about an existing drug, the RAG pipeline retrieves relevant chunks and cites the correct source file.
* Given an unknown or fictitious drug, the system safely refuses to speculate and outputs zero citations.
* Given an uploaded document, the calculated character offsets accurately slice the exact verbatim text snippet from the raw file.
* Given an unauthorized request to `/api/admin/*`, the request is rejected with HTTP 401 Unauthorized.

### Prior Art and Test Strategy
* Prior art in the repository includes .NET testing conventions under `Labs/Language/Dotnet/`.
* The test suite will be located in `tests/Chatbot.Tests/` using xUnit and `Microsoft.AspNetCore.Mvc.Testing` to verify HTTP endpoints in-memory without spinning up external networks.

---

## Out of Scope

1. **Automated Drug Prescription:** The chatbot will never calculate personalized patient dosages or issue formal prescriptions.
2. **Direct Hospital EHR Integration:** Interfacing with HL7/FHIR hospital electronic health record systems is out of scope for this version.
3. **Telehealth Video/Audio Calling:** Real-time multimedia streaming between patients and human doctors is excluded.
4. **Native Mobile App Builds:** Compiling native iOS/Android binaries (React Native/Flutter) is excluded; the React web frontend is fully responsive for mobile browsers.

---

## Further Notes

* **Render Deployment:** The unified Dockerfile compiles React into `dist/` and mounts it into ASP.NET Core `wwwroot/`, ensuring a single lightweight process that satisfies Render's 512MB RAM free tier limit.
* **Credentials:** All secrets are externalized to `.env` with strict placeholder comments in `.env.example` and `firebase-config.ts`.
