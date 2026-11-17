# Plan 04: Backend API & Streaming Controller (Chatbot.Be)

## 1. Mục Tiêu
Xây dựng lớp máy chủ ASP.NET Core 8.0 Web API đóng vai trò trung tâm điều phối, cung cấp các endpoint streaming Server-Sent Events (SSE), API quản trị tài liệu y tế (Admin Ingestion), và phục vụ giao diện tĩnh cho ứng dụng React.

## 2. Danh Sách Endpoints
- `POST /api/chat`: Nhận tin nhắn, trả về stream SSE token kèm metadata trích dẫn (`citations`).
- `GET /api/documents`: Lấy danh sách tài liệu y văn phục vụ hiển thị công khai.
- `GET /api/documents/{id}`: Lấy nội dung toàn văn của tài liệu để phục vụ Citation Highlight Viewer.
- `POST /api/admin/documents`: Tải lên tài liệu mới (.txt, .md, .pdf), yêu cầu header `X-Admin-Key`.
- `DELETE /api/admin/documents/{id}`: Xóa tài liệu khỏi đĩa và database SQLite, yêu cầu header `X-Admin-Key`.
- `GET /api/health`: Endpoint kiểm tra trạng thái hoạt động của server và số lượng chunks đang nạp.

## 3. Checklist Công Việc
- [ ] Cấu hình Dependency Injection trong `Program.cs` kết nối `Chatbot.Rag` và `Chatbot.Data`.
- [ ] Cài đặt Middleware kiểm tra header `X-Admin-Key` cho các route `/api/admin/*`.
- [ ] Xây dựng Endpoint Streaming `POST /api/chat` bằng `IAsyncEnumerable` chuẩn SSE (`text/event-stream`).
- [ ] Cấu hình CORS và Static Files (`wwwroot`) để phục vụ React build.
- [ ] Đọc cấu hình từ `appsettings.json` và biến môi trường (`.env`).
