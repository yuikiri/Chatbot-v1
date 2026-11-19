# Kế Hoạch Đánh Giá & Tối Ưu Hóa Mã Nguồn Backend Chatbot

## 1. Tổng Quan Mục Tiêu
Loại bỏ hoàn toàn code xấu, code trùng lặp (code slop) và giải quyết các điểm nghẽn hiệu năng trong Backend `Chatbot.Be`:
1. Chuẩn hóa phản hồi API qua `ApiResponse<T>` và tập trung toàn bộ magic values vào `RagConstants`.
2. Tối ưu hóa SQLite database: Tái sử dụng Prepared Command trong transaction thay vì tạo mới command lặp lại hàng trăm lần.
3. Nâng cấp bộ chia đoạn `OffsetChunker`: Chuyển sang `StringBuilder` và bổ sung thuật toán sub-chunking khi gặp khối văn bản dài hơn giới hạn tối đa.
4. Tăng tốc tạo vector Embedding: Áp dụng `Parallel.ForEachAsync` với `MaxDegreeOfParallelism = 4` để giảm 75% thời gian nạp tài liệu.
5. Loại bỏ hơn 40 dòng mã trùng lặp trích dẫn citation trong `MedicalRagService`.
6. Tối ưu Crawler bằng `[GeneratedRegex]` của .NET 8 và kiểm soát bộ nhớ cache trong `VerifiedArticleResolver`.

## 2. Danh Sách Tệp Can Thiệp
- `[Labs/Components/Chatbot_v1/src/Chatbot.Be/Common/ApiResponse.cs](Labs/Components/Chatbot_v1/src/Chatbot.Be/Common/ApiResponse.cs)` (Tạo mới)
- `[Labs/Components/Chatbot_v1/src/Chatbot.Be/Common/RagConstants.cs](Labs/Components/Chatbot_v1/src/Chatbot.Be/Common/RagConstants.cs)` (Tạo mới)
- `[Labs/Components/Chatbot_v1/src/Chatbot.Be/Data/Storage/SqliteKnowledgeStore.cs](Labs/Components/Chatbot_v1/src/Chatbot.Be/Data/Storage/SqliteKnowledgeStore.cs)`
- `[Labs/Components/Chatbot_v1/src/Chatbot.Be/Data/Text/OffsetChunker.cs](Labs/Components/Chatbot_v1/src/Chatbot.Be/Data/Text/OffsetChunker.cs)`
- `[Labs/Components/Chatbot_v1/src/Chatbot.Be/Rag/Parsers/DocumentTextParser.cs](Labs/Components/Chatbot_v1/src/Chatbot.Be/Rag/Parsers/DocumentTextParser.cs)`
- `[Labs/Components/Chatbot_v1/src/Chatbot.Be/Rag/Parsers/WebArticleCrawler.cs](Labs/Components/Chatbot_v1/src/Chatbot.Be/Rag/Parsers/WebArticleCrawler.cs)`
- `[Labs/Components/Chatbot_v1/src/Chatbot.Be/Rag/Services/MedicalRagService.cs](Labs/Components/Chatbot_v1/src/Chatbot.Be/Rag/Services/MedicalRagService.cs)`
- `[Labs/Components/Chatbot_v1/src/Chatbot.Be/Rag/Services/VerifiedArticleResolver.cs](Labs/Components/Chatbot_v1/src/Chatbot.Be/Rag/Services/VerifiedArticleResolver.cs)`
- `[Labs/Components/Chatbot_v1/src/Chatbot.Be/Rag/Services/VectorSearchService.cs](Labs/Components/Chatbot_v1/src/Chatbot.Be/Rag/Services/VectorSearchService.cs)`

## 3. Checklist Thực Hiện
- [x] Task 1: Tạo Common/ApiResponse.cs và Common/RagConstants.cs để tập trung hóa DTO và hằng số hệ thống.
- [x] Task 2: Tối ưu SqliteKnowledgeStore với prepared command và nâng cấp OffsetChunker dùng StringBuilder kèm sub-chunking.
- [x] Task 3: Refactor MedicalRagService: loại bỏ duplicate citation code và áp dụng Parallel.ForEachAsync cho IngestDocumentAsync.
- [x] Task 4: Bảo vệ DocumentTextParser tránh đọc file binary và thêm bounded cache cho VerifiedArticleResolver.
- [x] Task 5: Chuyển đổi Regex sang GeneratedRegex trong WebArticleCrawler để tối ưu CPU.
- [x] Task 6: Biên dịch Backend, kiểm thử toàn bộ endpoint và đo lường hiệu năng thực tế trên port 10000.
