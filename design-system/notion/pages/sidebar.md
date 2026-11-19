# Notion Design System — Sidebar & Workspace Navigation Specification

> **Áp dụng cho:** `src/Chatbot.Fe/src/components/Sidebar.tsx`

---

## 1. Bố Cục Tổng Thể (Sidebar Layout)

- **Chiều rộng:** `w-64` đến `w-72` (256px - 288px).
- **Màu nền:** Warm Stone `#F6F5F4` thuần chất Notion (thay thế hoàn toàn màu slate-950 tối cũ).
- **Đường phân cách phải (Divider):** `1px solid rgba(0, 0, 0, 0.08)` tinh tế.
- **Màu chữ mặc định:** `rgba(0, 0, 0, 0.75)` (Ink body).

---

## 2. Header & Thao Tác Đoạn Chat Mới

### 2.1. Brand Title & Secret Admin Trigger
- **Logo Icon:** Khiên bảo mật `ShieldCheck` hoặc Chữ L cách điệu màu trắng trên nền đen mực `#1A1A1A` bo góc 6px.
- **Tiêu đề:** `LactaMed AI`, font Inter 13px font-semibold `text-black`.
- **Huy hiệu:** Chữ `Pro` hoặc `Clinical` 9px uppercase trên nền mỏng `rgba(0, 0, 0, 0.06)` viền `rgba(0, 0, 0, 0.1)`.
- **Tính năng mở Admin ẩn:**
  - Giữ nguyên sự kiện chạm 3 lần liên tiếp trong 1.5 giây vào khối logo (`handleLogoTap`).
  - Giữ nguyên tổ hợp phím tắt `Ctrl + Shift + A` (hoặc `Cmd + Shift + A`).

### 2.2. Nút "Đoạn chat mới" (New Chat Button)
- **Kiểu dáng:** Chuẩn Notion `button-primary` hoặc `button-secondary` sang trọng:
  - Nền: Notion Blue `#0075DE` (hover `#0062BD`), chữ trắng `#FFFFFF`.
  - Hoặc nền trắng `#FFFFFF`, viền hairline `1px solid rgba(0, 0, 0, 0.12)`, chữ `text-black`, bóng đổ mỏng.
  - Bo góc: 8px (`rounded-lg`).
  - Icon `Plus` mảnh 14px.

---

## 3. Danh Sách Lịch Sử Hội Thoại (Conversation History)

### 3.1. Tiêu Đề Nhóm (Section Header)
- Chữ hoa nhỏ: `LỊCH SỬ HỘI THOẠI`, font Inter 11px font-semibold, màu `rgba(0, 0, 0, 0.4)`, tracking `+0.04em`.
- Huy hiệu đếm số lượng chat: Nền mỏng `rgba(0, 0, 0, 0.05)`, chữ số font-mono 10px.

### 3.2. Mục Hội Thoại (Conversation Item)
- **Bo góc:** 8px (`rounded-lg`).
- **Khoảng cách:** `px-2.5 py-2`, khoảng cách giữa các mục `gap-1`.
- **Trạng thái Mặc định:** Nền trong suốt, chữ `rgba(0, 0, 0, 0.75)`, icon tin nhắn xám nhạt `rgba(0, 0, 0, 0.4)`.
- **Trạng thái Hover:** Lớp phủ hover wash `bg-black/5` (`rgba(0, 0, 0, 0.04)`), chữ `text-black`.
- **Trạng thái Active (Đang chọn):** 
  - Nền: Trắng `#FFFFFF`.
  - Viền: `1px solid rgba(0, 0, 0, 0.1)`.
  - Bóng đổ: `0 1px 2px rgba(0, 0, 0, 0.04)`.
  - Chữ: Đậm nét `font-medium text-black`.
  - Icon: Màu Notion Blue `#0075DE`.
- **Thời gian (Timestamp):** Hiển thị nhỏ ở dòng dưới `10px`, màu `rgba(0, 0, 0, 0.36)` font-mono.

### 3.3. Thao Tác Trên Mục (Inline Rename & Hide)
- Icon nút Sửa (Pencil) và Xóa (Trash2): Mặc định ẩn, hiển thị khi hover chuột vào mục (`opacity-0 group-hover:opacity-100`).
- Kích thước icon: 14x14px, nút ghost bo góc 4px, hover `bg-black/8`.
- Form đổi tên inline: Input nền trắng, viền Notion Blue `1px solid #0075DE`, nút Check/Cancel tinh gọn.

---

## 4. User Profile Footer & Trạng Thái Đăng Nhập

- **Khung chứa:** Nằm sát đáy Sidebar, viền đỉnh `1px solid rgba(0, 0, 0, 0.08)`.
- **Khi đã đăng nhập:**
  - Avatar: Khối vuông bo góc 6px mang ký tự đầu của người dùng, nền Notion Blue hoặc Ink.
  - Tên & Email: Chữ đen 12px font-medium, email phụ 10px `rgba(0, 0, 0, 0.5)`.
  - Nút Đăng xuất (`LogOut`): Nút ghost 4px, hover chuyển màu Coral Red `text-[#F64932] hover:bg-rose-50`.
- **Khi chưa đăng nhập:**
  - Nút "Đăng nhập để lưu chat": Nền trắng `#FFFFFF`, viền `1px solid rgba(0, 0, 0, 0.12)`, chữ `text-black` 12px font-medium, icon `User` màu Notion Blue.
