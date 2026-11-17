# Plan 03: Lõi RAG & AI Provider Abstraction (Chatbot.Rag)

## 1. Mục Tiêu
Xây dựng động cơ RAG trung tâm: tìm kiếm vector siêu nhẹ bằng SIMD `System.Numerics.Tensors`, tạo prompt khép kín chống ảo giác và tích hợp linh hoạt giữa Google Gemini và OpenAI-compatible providers (như 9router).

## 2. Giao Diện & Kiến Trúc Trừu Tượng
- `IEmbeddingClient`: Sinh vector embedding từ văn bản (`GenerateEmbeddingAsync`).
- `ILlmClient`: Gọi mô hình sinh chữ theo luồng streaming (`StreamChatAsync`).
- Factory: Khởi tạo implementation dựa trên cấu hình `LLM_PROVIDER`:
  - `gemini`: Kết nối Google Gemini API (`models/gemini-1.5-flash` và `models/text-embedding-004`).
  - `custom_openai`: Kết nối OpenAI-compatible endpoint (ví dụ 9router) qua HTTP Client.

## 3. Checklist Công Việc
- [ ] Cài đặt `GeminiClient` (Google Gemini REST API).
- [ ] Cài đặt `OpenAiCompatibleClient` (9router / OpenAI REST API).
- [ ] Cài đặt `VectorSearchService`: Sử dụng `TensorPrimitives.CosineSimilarity` quét toàn bộ chunks trong bộ nhớ RAM trong thời gian dưới 1ms.
- [ ] Cài đặt `StrictMedicalPromptBuilder`: Ráp dữ liệu trích dẫn y văn vào prompt đóng, định dạng mức an toàn (Compatible / Caution / Contraindicated).
- [ ] Trả về danh sách `CitationItem` kèm `startOffset` và `endOffset` để phục vụ Highlight ở Frontend.
