# Plan 02: Quản Lý Dữ Liệu & Kho Y Văn Admin (Chatbot.Data)

## 1. Mục Tiêu
Cung cấp giải pháp lưu trữ tệp tài liệu gốc và cơ sở dữ liệu chỉ mục SQLite (`knowledge.db`) phục vụ tìm kiếm RAG và tính năng Highlight đoạn trích dẫn.

## 2. Các Thực Thể & Mô Hình Dữ Liệu
- **DocumentEntity:** `Id`, `Title`, `FileName`, `FilePath`, `FileSize`, `UploadedAt`.
- **ChunkEntity:** `Id`, `DocumentId`, `DocumentName`, `Content`, `StartOffset`, `EndOffset`, `Embedding` (mảng float 768 hoặc 1536 chiều được tuần tự hóa).

## 3. Checklist Công Việc
- [ ] Xây dựng các Models: `DocumentEntity`, `ChunkEntity`, `CitationItem`.
- [ ] Cài đặt `SqliteKnowledgeContext`: Tự động khởi tạo bảng `Documents` và `Chunks` nếu chưa có.
- [ ] Viết `DocumentRepository`:
  - `SaveDocumentAsync(fileName, stream)`: Lưu file vật lý vào `src/Chatbot.Data/documents/`.
  - `DeleteDocumentAsync(documentId)`: Xóa file vật lý và xóa toàn bộ chunks trong SQLite.
  - `GetAllDocumentsAsync()`: Lấy danh sách tài liệu phục vụ Admin UI.
  - `GetDocumentContentAsync(documentId)`: Đọc toàn bộ nội dung file phục vụ Citation Highlight Viewer.
- [ ] Viết `OffsetChunker`: Tách đoạn văn bản đồng thời ghi nhận chính xác chỉ số ký tự `StartOffset` và `EndOffset`.
