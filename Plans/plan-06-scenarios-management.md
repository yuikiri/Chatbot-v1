# Plan 06: Tích Hợp Tình Huống Kiểm Chứng Prompt 4 & Quản Trị Admin

## 1. Mục Tiêu
Triển khai tính năng chọn tình huống mẫu từ Prompt 04 (15 tình huống thuốc giả mạng xã hội) cho người dùng cuối và xây dựng hệ thống quản trị CRUD tình huống toàn diện cho Admin.

## 2. Các Thành Phần Kỹ Thuật Đã Triển Khai
- **Backend Model & SQLite:**
  - `ScenarioEntity` và các DTOs tại `[src/Chatbot.Be/Data/Models/Entities.cs](src/Chatbot.Be/Data/Models/Entities.cs)`.
  - Bảng `Scenarios` và các phương thức CRUD, tự động nạp sẵn (seed) 15 tình huống tại `[src/Chatbot.Be/Data/Storage/SqliteKnowledgeStore.cs](src/Chatbot.Be/Data/Storage/SqliteKnowledgeStore.cs)`.
  - Bộ API RESTful tại `[src/Chatbot.Be/Endpoints/ScenarioEndpoints.cs](src/Chatbot.Be/Endpoints/ScenarioEndpoints.cs)`:
    - `GET /api/scenarios`: Lấy danh sách tình huống đang kích hoạt cho người dùng.
    - `GET /api/admin/scenarios`: Lấy toàn bộ danh sách tình huống kèm trạng thái quản trị.
    - `POST /api/admin/scenarios`: Thêm tình huống mới.
    - `PUT /api/admin/scenarios/{id}`: Chỉnh sửa tình huống.
    - `DELETE /api/admin/scenarios/{id}`: Xóa tình huống.
    - `POST /api/admin/scenarios/reset-default`: Khôi phục 15 tình huống chuẩn từ Prompt 04.
- **Frontend User Interface:**
  - Hàm API client tại `[src/Chatbot.Fe/src/services/api.ts](src/Chatbot.Fe/src/services/api.ts)`.
  - Component `[src/Chatbot.Fe/src/components/ScenarioModal.tsx](src/Chatbot.Fe/src/components/ScenarioModal.tsx)`: Hiển thị danh sách thẻ tình huống, tìm kiếm, lọc theo nền tảng (TikTok, Facebook, YouTube, Website bán hàng), hỗ trợ "Chèn vào ô nhập" hoặc "Kiểm chứng ngay".
  - Nút bấm trực quan "Tình huống mẫu" tại thanh nhập liệu và khu vực gợi ý ban đầu tại `[src/Chatbot.Fe/src/components/ChatArea.tsx](src/Chatbot.Fe/src/components/ChatArea.tsx)`.
- **Frontend Admin Portal:**
  - Tab "Tình huống (Prompt 4)" tại `[src/Chatbot.Fe/src/components/AdminPortal.tsx](src/Chatbot.Fe/src/components/AdminPortal.tsx)` với đầy đủ giao diện danh sách, tìm kiếm, lọc nền tảng, form thêm/sửa tình huống, bật/tắt hiển thị, xóa và khôi phục dữ liệu gốc.
