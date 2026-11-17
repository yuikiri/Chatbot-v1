# Plan 05: Frontend React ChatGPT-Style & Citation Highlight (Chatbot.Fe)

## 1. Mục Tiêu
Xây dựng giao diện web Single Page Application (SPA) bằng React + TypeScript + Vite + Tailwind CSS với trải nghiệm mượt mà kiểu ChatGPT:
- **Sidebar bên trái:** Lưu và hiển thị danh sách hội thoại từ Cloud Firestore, nút "+ Đoạn chat mới", đăng nhập/đăng xuất Google & Email.
- **Khung Chat ở giữa:** Hiển thị tin nhắn dạng hội thoại, hiệu ứng gõ chữ streaming, nhãn an toàn y tế (Xanh: Tương thích / Vàng: Thận trọng / Đỏ: Chống chỉ định).
- **Quản lý Tài liệu Admin:** Modal/Panel cho phép Admin nhập Secret Key, tải lên file tài liệu y văn mới và xóa tài liệu cũ.
- **Tính năng Bôi đậm Trích dẫn (Citation Highlight Viewer):** Mỗi khi câu trả lời có trích dẫn `[LactMed: TênThuốc]`, người dùng click vào sẽ mở Drawer/Modal hiển thị văn bản gốc và tự động cuộn đến đoạn văn bản được bôi đậm `<mark>`.

## 2. Cấu Trúc Component
- `src/components/Sidebar.tsx`: Quản lý danh sách phiên trò chuyện và User Profile.
- `src/components/ChatArea.tsx`: Khung hiển thị tin nhắn, hiệu ứng chữ chạy và ô nhập liệu.
- `src/components/MessageItem.tsx`: Tin nhắn đơn lẻ có nhãn an toàn, Markdown rendering, và các nút trích dẫn interactive.
- `src/components/CitationModal.tsx`: Cửa sổ hiển thị toàn văn tài liệu gốc, bôi đậm chính xác ký tự từ `startOffset` đến `endOffset`.
- `src/components/AdminModal.tsx`: Giao diện Admin upload và quản lý tài liệu y tế.
- `src/services/firebase.ts`: Cấu hình Firebase Auth và Firestore với placeholder rõ ràng.
- `src/services/api.ts`: Giao tiếp với Backend .NET 8 (`/api/chat`, `/api/documents`, `/api/admin/documents`).

## 3. Checklist Công Việc
- [ ] Thiết lập Tailwind CSS và Lucide Icons cho dự án Vite.
- [ ] Xây dựng Client API kết nối Backend với cơ chế đọc Server-Sent Events (SSE).
- [ ] Xây dựng dịch vụ Firebase Client (đăng nhập Google/Email, lưu lịch sử hội thoại).
- [ ] Lập trình Component `CitationModal` hỗ trợ highlight text theo offset và tự động scroll.
- [ ] Lập trình Component `AdminModal` cho phép upload và xóa tài liệu y khoa.
- [ ] Đảm bảo Responsive hiển thị mượt mà trên cả Mobile và Desktop.
