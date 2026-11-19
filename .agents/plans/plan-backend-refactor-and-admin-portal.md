# Kế Hoạch Cải Tiến Kiến Trúc Backend Và Hoàn Thiện Admin Portal

## 1. Tổng Quan Mục Tiêu
Kế hoạch giải quyết toàn diện các vấn đề về chất lượng mã nguồn backend, trải nghiệm quản trị, cơ chế Cascade Failover của Model, quản lý người dùng Firestore và luồng xử lý tài liệu 2 tầng:
1. Tái cấu trúc Backend: Module hóa `Program.cs` thành các nhóm Endpoint riêng biệt, áp dụng Global Exception Middleware trả JSON chuẩn, và Endpoint Filter cho xác thực Admin.
2. Quản lý người dùng: Hiển thị đầy đủ danh sách người dùng từ Firestore, phân biệt Google / Email-Password, thống kê token, chi phí ước tính, xem chi tiết lịch sử chat, tìm kiếm tiêu đề và nội dung tin nhắn.
3. Quản lý Model linh hoạt (Cascade Flow): Chia 3 Header (Text Generation, Embedding, External Provider), hỗ trợ chuỗi ưu tiên chuyển đổi tự động với ký hiệu mũi tên (`Model 1 -> Model 2 -> Model 3`), cập nhật danh mục model đầy đủ từ Google AI Studio kèm chỉ số RPM/TPM/RPD.
4. Nạp & Cào dữ liệu 2 tầng: Bổ sung bước kiểm tra Inspect link trước khi cào kèm cảnh báo chất lượng, lưu trữ độc lập bản Raw và Normalized Markdown, xóa thác an toàn.

## 2. Danh Sách Tệp Can Thiệp
- `[Labs/Components/Chatbot_v1/src/Chatbot.Be/Program.cs](Labs/Components/Chatbot_v1/src/Chatbot.Be/Program.cs)`
- `[Labs/Components/Chatbot_v1/src/Chatbot.Be/Endpoints/AdminEndpoints.cs](Labs/Components/Chatbot_v1/src/Chatbot.Be/Endpoints/AdminEndpoints.cs)` (Tạo mới)
- `[Labs/Components/Chatbot_v1/src/Chatbot.Be/Endpoints/DocumentEndpoints.cs](Labs/Components/Chatbot_v1/src/Chatbot.Be/Endpoints/DocumentEndpoints.cs)` (Tạo mới)
- `[Labs/Components/Chatbot_v1/src/Chatbot.Be/Endpoints/ChatEndpoints.cs](Labs/Components/Chatbot_v1/src/Chatbot.Be/Endpoints/ChatEndpoints.cs)` (Tạo mới)
- `[Labs/Components/Chatbot_v1/src/Chatbot.Be/Middleware/GlobalExceptionMiddleware.cs](Labs/Components/Chatbot_v1/src/Chatbot.Be/Middleware/GlobalExceptionMiddleware.cs)` (Tạo mới)
- `[Labs/Components/Chatbot_v1/src/Chatbot.Be/Filters/AdminKeyAuthFilter.cs](Labs/Components/Chatbot_v1/src/Chatbot.Be/Filters/AdminKeyAuthFilter.cs)` (Tạo mới)
- `[Labs/Components/Chatbot_v1/src/Chatbot.Be/models.catalog.json](Labs/Components/Chatbot_v1/src/Chatbot.Be/models.catalog.json)`
- `[Labs/Components/Chatbot_v1/src/Chatbot.Be/Rag/Services/DynamicLlmService.cs](Labs/Components/Chatbot_v1/src/Chatbot.Be/Rag/Services/DynamicLlmService.cs)`
- `[Labs/Components/Chatbot_v1/src/Chatbot.Fe/src/components/AdminPortal.tsx](Labs/Components/Chatbot_v1/src/Chatbot.Fe/src/components/AdminPortal.tsx)`
- `[Labs/Components/Chatbot_v1/src/Chatbot.Fe/src/services/firebase.ts](Labs/Components/Chatbot_v1/src/Chatbot.Fe/src/services/firebase.ts)`
- `[Labs/Components/Chatbot_v1/src/Chatbot.Fe/src/services/api.ts](Labs/Components/Chatbot_v1/src/Chatbot.Fe/src/services/api.ts)`

## 3. Checklist Thực Hiện
- [x] Task 1: Cập nhật models.catalog.json với danh mục model đầy đủ và quota RPM/TPM/RPD.
- [x] Task 2: Tái cấu trúc Backend: Tạo GlobalExceptionMiddleware, AdminKeyAuthFilter, tách Program.cs thành các Endpoints module.
- [x] Task 3: Nâng cấp DynamicLlmService hỗ trợ chuỗi Cascade model linh hoạt và chỉ báo model active.
- [x] Task 4: Nâng cấp quản lý người dùng: đồng bộ tài khoản, hiển thị email/provider/token/chi phí, search title và search tin nhắn.
- [x] Task 5: Cải tiến giao diện Tab Model trong AdminPortal.tsx: chia 3 header, chuỗi mũi tên Cascade ưu tiên, badge quota.
- [x] Task 6: Hoàn thiện bộ Inspect URL trước khi cào kèm cảnh báo và xác nhận lưu trữ 2 tầng Raw/Normalized.
- [x] Task 7: Biên dịch Frontend, Backend và kiểm thử toàn diện hệ thống trên port 10000.
