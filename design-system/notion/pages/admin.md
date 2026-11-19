# Notion Design System — Admin Portal & Database Tables Specification

> **Áp dụng cho:** `src/Chatbot.Fe/src/components/AdminPortal.tsx` và `src/Chatbot.Fe/src/components/AdminModal.tsx`

---

## 1. Màn Hình Khóa PIN (Authentication Gate)

- **Bố cục:** Căn giữa màn hình trên nền Warm Stone `#F6F5F4`.
- **Card Đăng Nhập:** 
  - Nền Paper White `#FFFFFF`, bo góc 12px (`rounded-xl`), viền `1px solid rgba(0, 0, 0, 0.08)`.
  - Bóng đổ: `shadow-card-soft` (`0 4px 20px rgba(0,0,0,0.06)`).
- **Ô nhập mã PIN/Key:** 
  - Nền `#FFFFFF`, bo góc 8px, viền `1px solid rgba(0, 0, 0, 0.16)`.
  - Focus Ring: `outline: 2px solid #0075DE; outline-offset: 2px;`.
- **Nút Mở Khóa (Unlock):** Chuẩn `button-primary` màu Notion Blue `#0075DE`.

---

## 2. Header Admin Portal & Thanh Điều Hướng Tabs (Notion Database Views)

### 2.1. Top Header
- Chiều cao 60px, nền trắng `#FFFFFF`, under-rule hairline `0 1px 0 0 rgba(0, 0, 0, 0.08)`.
- Nút "Quay lại" (Back to Chat): Nút ghost bo góc 4px, icon mũi tên trái mảnh.
- Tiêu đề: `Cổng Quản Trị Lâm Sàng & Hệ Thống` (font Inter bold 15px `text-black`).
- Thao tác nhanh: Nút "Khóa Portal" (Lock) và nút "Làm mới dữ liệu" (Refresh).

### 2.2. Thanh Tabs Phân Vùng (Database View Selector)
- 4 Tabs chính:
  1. `users`: Người dùng & Đánh giá chất lượng
  2. `incidents`: Incident Hub & Xử lý sự cố
  3. `models`: Mô hình AI & Quota
  4. `knowledge`: Y văn & Web Crawler
- **Kiểu dáng Tab:**
  - Nút ghost 6px radius, chữ 12.5px font-medium.
  - Tab đang chọn: Chữ đen `text-black`, gạch chân đậm Notion Blue `#0075DE` hoặc nền Warm Stone `#F6F5F4` viền hairline mờ.
  - Huy hiệu đếm số (Badge count): Nền mỏng `rgba(0,0,0,0.06)`, chữ 10.5px.

---

## 3. Quy Cách Bảng Dữ Liệu Notion Database (Database Table Layout)

### 3.1. Cấu Trúc Khung Bảng
- Khung ngoài: Nền trắng `#FFFFFF`, bo góc 12px (`rounded-xl`), viền `1px solid rgba(0, 0, 0, 0.08)`, `overflow: hidden`.
- Header bảng: 
  - Nền Warm Stone `#F6F5F4`, chiều cao 36px.
  - Chữ tiêu đề cột: 11px uppercase `rgba(0, 0, 0, 0.54)`, font-semibold, tracking `+0.04em`.
  - Đường kẻ đáy header: `1px solid rgba(0, 0, 0, 0.08)`.
- Hàng dữ liệu (Table Rows):
  - Padding `py-2.5 px-3`.
  - Đường phân tách: `1px solid rgba(0, 0, 0, 0.05)`.
  - Hover: Lớp nền mỏng `hover:bg-[#F6F5F4]/60`.

### 3.2. Hệ Thống Chip Trạng Thái & Thẻ Phân Loại (Tags & Status Pills)
Áp dụng dải màu nhấn Notion:
- **Trạng thái Mới / Chưa xử lý (Pending):** Nền Amber Wash `#FEF3C7`, viền `#FFB110/30`, chữ Amber `#D97706`.
- **Trạng thái Đã giải quyết / Đã xác thực (Resolved / Verified):** Nền Mint Wash `#D0F4D8`, viền `#1AAE39/30`, chữ Ship Green `#1AAE39`.
- **Lỗi / Sự cố nghiêm trọng (Critical / Error):** Nền Coral Wash `#FFE4E6`, viền `#F64932/30`, chữ Coral Red `#F64932`.
- **Mô hình AI / Provider Tag:** Nền Indigo Wash `#E0E7FF`, chữ Ultramarine `#1313BA`.
- **Tài liệu Y văn / Tag phụ:** Nền Lavender Wash `#EADBFA`, chữ tím `#6B21A8`.

---

## 4. Khu Vực Đánh Giá & Thao Tác (Evaluation & Actions)

- **Thanh đánh giá sao (Star rating):** Sao màu hổ phách `#FFB110`, hover tương tác mượt mà.
- **Thẻ tag đánh giá (Evaluation tags):** Bo góc 4px, nền `#F6F5F4`, nút xóa tag mỏng nhẹ.
- **Vùng xem tin nhắn chi tiết (Message Inspector):**
  - Khung tin nhắn độc lập với cuộn mượt.
  - Phân định rõ tin nhắn người dùng và câu trả lời của bot.
  - Hiển thị đầy đủ nhãn an toàn, trích dẫn tài liệu và trạng thái rà soát của bác sĩ.
