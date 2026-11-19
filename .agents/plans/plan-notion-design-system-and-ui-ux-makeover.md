# Kế Hoạch Tái Cấu Trúc Toàn Bộ Giao Diện Người Dùng & Admin (Notion Design System - Thuần Frontend)

- **Mục tiêu:** Tái thiết kế toàn diện giao diện người dùng phía Client (`src/Chatbot.Fe`) của hệ thống LactaMed AI sang chuẩn phong cách **Notion Design System** (Calm, Editorial, Near-Monochrome, Paper White `#FFFFFF`, Warm Stone `#F6F5F4`, viền hairline mỏng nhẹ và màu nhấn tương tác độc tôn Notion Blue `#0075DE`).
- **Phạm vi áp dụng:** 100% mã nguồn Frontend nằm trong thư mục `src/Chatbot.Fe/` và bộ tài liệu thiết kế tại `design-system/notion/`. Tuyệt đối không can thiệp vào Backend (.NET) hoặc thư mục `wwwroot`.
- **Nguồn sự thật chuẩn hóa (Single Source of Truth):**
  - Tài liệu tổng: [`design-system/notion/MASTER.md`](../../design-system/notion/MASTER.md)
  - Biến CSS & Tokens: [`design-system/notion/tokens.css`](../../design-system/notion/tokens.css)
  - Đặc tả Chat Area: [`design-system/notion/pages/chat.md`](../../design-system/notion/pages/chat.md)
  - Đặc tả Sidebar: [`design-system/notion/pages/sidebar.md`](../../design-system/notion/pages/sidebar.md)
  - Đặc tả Admin Portal: [`design-system/notion/pages/admin.md`](../../design-system/notion/pages/admin.md)
  - Đặc tả Modals: [`design-system/notion/pages/modals.md`](../../design-system/notion/pages/modals.md)

---

## Danh Sách Tệp Sẽ Tạo & Chỉnh Sửa

1. [`design-system/notion/MASTER.md`](../../design-system/notion/MASTER.md) - Tài liệu thiết kế chuẩn Notion Design System
2. [`design-system/notion/tokens.css`](../../design-system/notion/tokens.css) - Khai báo biến CSS `:root` và Utility Classes
3. [`design-system/notion/pages/chat.md`](../../design-system/notion/pages/chat.md) - Đặc tả Chat Canvas & Message Item
4. [`design-system/notion/pages/sidebar.md`](../../design-system/notion/pages/sidebar.md) - Đặc tả Workspace Sidebar Navigation
5. [`design-system/notion/pages/admin.md`](../../design-system/notion/pages/admin.md) - Đặc tả Admin Portal & Database Tables
6. [`design-system/notion/pages/modals.md`](../../design-system/notion/pages/modals.md) - Đặc tả Hộp thoại Citation & Auth Modal
7. [`src/Chatbot.Fe/index.html`](../../src/Chatbot.Fe/index.html) - Nhúng Google Fonts Inter & Newsreader (serif trích dẫn), theme-color `#0075DE`
8. [`src/Chatbot.Fe/tailwind.config.js`](../../src/Chatbot.Fe/tailwind.config.js) - Mở rộng cấu hình màu `notion`, font serif/sans, radius và shadow
9. [`src/Chatbot.Fe/src/index.css`](../../src/Chatbot.Fe/src/index.css) - Baseline typography, scrollbar siêu mảnh, focus ring 2px Notion Blue, `.medical-prose`
10. [`src/Chatbot.Fe/src/components/Sidebar.tsx`](../../src/Chatbot.Fe/src/components/Sidebar.tsx) - Giao diện thanh điều hướng Workspace (Warm Stone, ghost buttons, 3-tap admin)
11. [`src/Chatbot.Fe/src/components/ChatArea.tsx`](../../src/Chatbot.Fe/src/components/ChatArea.tsx) - Khung chat chính, header 64px under-rule, prompt cards 12px, input nổi focus ring 2px
12. [`src/Chatbot.Fe/src/components/MessageItem.tsx`](../../src/Chatbot.Fe/src/components/MessageItem.tsx) - Tin nhắn editorial, nhãn an toàn chuẩn Notion (Green/Amber/Coral), pills citation
13. [`src/Chatbot.Fe/src/components/CitationModal.tsx`](../../src/Chatbot.Fe/src/components/CitationModal.tsx) - Hộp thoại trích dẫn y văn font serif Newsreader, highlight vàng nhạt
14. [`src/Chatbot.Fe/src/components/AuthModal.tsx`](../../src/Chatbot.Fe/src/components/AuthModal.tsx) - Hộp thoại xác thực tài khoản tối giản chuẩn Notion
15. [`src/Chatbot.Fe/src/components/AdminPortal.tsx`](../../src/Chatbot.Fe/src/components/AdminPortal.tsx) - Cổng quản trị Notion Database view đa tab
16. [`src/Chatbot.Fe/src/components/AdminModal.tsx`](../../src/Chatbot.Fe/src/components/AdminModal.tsx) - Modal quản trị nhanh đồng bộ Notion
17. [`src/Chatbot.Fe/src/services/firebase.ts`](../../src/Chatbot.Fe/src/services/firebase.ts) - Chuẩn hóa kiểu dữ liệu IncidentRecord

---

## Chi Tiết Các Giai Đoạn Thực Hiện

### Giai đoạn 1: Xây dựng Thư mục Design System độc lập (`design-system/notion/`)
- [x] Tạo `MASTER.md`, `tokens.css` và 4 tài liệu con trong `pages/`.
- [x] Kiểm tra độ đồng nhất giữa các token và quy chuẩn màu.

### Giai đoạn 2: Cấu hình Theme Base & Typography Frontend (`src/Chatbot.Fe/`)
- [x] Cập nhật `index.html`: Nhúng Google Font `Inter` và `Newsreader` (serif trích dẫn), đổi theme-color sang `#0075DE`.
- [x] Cập nhật `src/index.css`: Baseline font Inter, scrollbar mảnh nhẹ, focus ring 2px Notion Blue, tinh chỉnh lớp `.medical-prose` kết hợp serif cho blockquote và y văn.
- [x] [CHECK] Kiểm tra biên dịch CSS và font hiển thị.

### Giai đoạn 3: Tái cấu trúc Giao diện Điều hướng (Sidebar Navigation)
- [x] Chuyển nền sang Warm Stone `bg-[#F6F5F4]`, viền phải `border-r border-black/10`.
- [x] Nút "Đoạn chat mới" dạng `button-primary` Notion Blue (`#0075DE` hover `#0062BD`), bo góc 8px.
- [x] Danh sách hội thoại phong cách Notion page item: icon `MessageSquare`, hover wash `hover:bg-black/5`, active item viền mờ `border-black/10`, nút rename/hide tinh gọn.
- [x] Footer tài khoản tối giản, giữ nguyên logic 3-tap chạm logo mở Cổng Quản Trị và phím tắt `Ctrl+Shift+A`.
- [x] [CHECK] Kiểm tra Sidebar trên cả desktop và mobile drawer.

### Giai đoạn 4: Tái cấu trúc Khung Chat Chính (ChatArea Canvas & Input)
- [x] Header 64px nền trắng `bg-white`, under-rule shadow `0 1px 0 0 rgba(0,0,0,0.1)`, RAG mode selector dạng Notion pill dropdown.
- [x] Banner disclaimer y khoa thanh mảnh nền `#FFFDF5` hoặc `#F6F5F4` viền hairline.
- [x] Hero Empty State: Tiêu đề tracking âm `-0.035em`, 4 thẻ gợi ý nhanh Notion `card-2` (bo góc 12px, viền hairline, icon Link Blue `#097FE8`).
- [x] Khung nhập liệu nổi (Floating Input Bar): Bo góc 12px, viền hairline `border-black/14`, focus ring 2px `#0075DE`, nút gửi tròn Notion Blue.
- [x] [CHECK] Kiểm tra tương tác gửi tin, chuyển chế độ RAG, giao diện trên mobile.

### Giai đoạn 5: Tái cấu trúc Bong bóng Tin nhắn & Nhãn An toàn (MessageItem)
- [x] Khắc phục lỗi TypeScript type trong `reportIncident` (`category` field).
- [x] Phân định rõ ràng: Tin nhắn User (Notion Blue `#0075DE` bo góc 8px hoặc mực đen/nền Warm Stone) và Trợ lý AI (nền trắng sạch, định dạng `.medical-prose`).
- [x] Nhãn an toàn 3 mức chuẩn Notion: Tương thích (Ship Green `#1AAE39`), Thận trọng (Marigold `#FFB110`), Chống chỉ định (Coral Red `#F64932`).
- [x] Pill trích dẫn y văn bo tròn màu `#E6F3FE` chữ `#097FE8`.
- [x] Nút tác vụ Copy, Report dạng ghost button 4px radius.
- [x] [CHECK] Kiểm tra render Markdown y văn, bảng biểu, trích dẫn.

### Giai đoạn 6: Tái thiết kế Hộp thoại (CitationModal & AuthModal)
- [x] `CitationModal.tsx`: Card bo góc 12px, header hairline, đoạn trích y văn font Newsreader serif sang trọng, highlight vàng nhạt `#FEF3C7` viền hổ phách `#FFB110`.
- [x] `AuthModal.tsx`: Card 12px, input 8px, nút Google/Email Notion Blue.
- [x] [CHECK] Kiểm tra đóng mở modal, responsive mobile, scroll to highlight.

### Giai đoạn 7: Cổng Quản Trị & Modal Quản Lý (Admin Portal & Admin Modal)
- [x] Rà soát hoàn thiện `AdminPortal.tsx` theo chuẩn Notion Database view.
- [x] Tái cấu trúc `AdminModal.tsx` đồng bộ giao diện Notion (12px radius, hairline border, tabs Notion).
- [x] [CHECK] Kiểm tra đăng nhập PIN/Key, các tab quản trị người dùng, sự cố, y văn.

### Giai đoạn 8: Kiểm thử Build & Nghiệm Thu
- [x] Chạy `npm run build` đảm bảo 100% không có lỗi TypeScript hay Vite build.
- [x] Đảm bảo đáp ứng tương phản WCAG AA, vùng chạm touch target >= 44px trên thiết bị di động.
- [x] Nghiệm thu toàn bộ checklist.

---

## Bảng Checklist Nghiệm Thu

- [x] **1. Design System Tokens:** Thư mục `design-system/notion/` đầy đủ `MASTER.md`, `tokens.css` và 4 tài liệu `pages/`.
- [x] **2. Typography & Baseline:** `index.html` tải Inter và Newsreader; `index.css` thiết lập baseline, scrollbar và `.medical-prose`.
- [x] **3. Sidebar Navigation:** Nền Warm Stone `#F6F5F4`, nút Chat Mới Notion Blue, active state, giữ nguyên 3-tap admin.
- [x] **4. ChatArea Canvas:** Header 64px under-rule, thẻ gợi ý card-2 bo góc 12px, thanh input nổi focus ring 2px.
- [x] **5. MessageItem:** Tin nhắn phân cấp rõ nét, nhãn an toàn Ship Green / Marigold / Coral Red, pill citation xanh nhạt.
- [x] **6. CitationModal & AuthModal:** Card 12px, trích dẫn font serif Newsreader, highlight chính xác vị trí.
- [x] **7. Admin Portal & Modal:** Bảng Notion Database view, header viết hoa 12px, tag chip màu nhấn.
- [x] **8. Build Kiểm Thử:** `npm run build` hoàn thành 0 lỗi.
