# Notion Design System — Chat Canvas & Messages Specification

> **Áp dụng cho:** `src/Chatbot.Fe/src/components/ChatArea.tsx` và `src/Chatbot.Fe/src/components/MessageItem.tsx`

---

## 1. Chat Canvas & Header (ChatArea.tsx)

### 1.1. Header (64px Notion Top Bar)
- **Chiều cao:** `h-16` (64px), cố định phía trên.
- **Nền:** `#FFFFFF`, `backdrop-blur-md`.
- **Under-rule Divider:** `box-shadow: 0 1px 0 0 rgba(0, 0, 0, 0.1)`. Không dùng viền xám thô.
- **Brand Emblem:** Icon tai nghe bác sĩ `Stethoscope` hoặc khiên `ShieldCheck` màu đen/Notion Blue trên nền Warm Stone `#F6F5F4` bo góc 8px.
- **Brand Title:** `LactaMed AI` font Inter bold 14px, tracking `-0.02em`.
- **RAG Mode Selector:** Chuyển đổi giữa 3 chế độ (Tiêu chuẩn / Tổng hợp / Mở rộng) hiển thị dưới dạng Pill Button mỏng nhẹ:
  - Nền `#F6F5F4`, bo góc 8px (`rounded-lg`), viền `1px solid rgba(0, 0, 0, 0.08)`.
  - Icon và tên chế độ hiển thị font Inter 12px font-medium.
  - Dropdown menu: Nền trắng `#FFFFFF`, bo góc 8px, bóng đổ `shadow-float`, viền hairline.

### 1.2. Disclaimer Y Khoa (Medical Warning Bar)
- **Vị trí:** Ngay dưới header.
- **Nền:** Màu hổ phách siêu nhạt `#FFFDF5`, viền đáy `1px solid rgba(255, 177, 16, 0.2)`.
- **Chữ:** `rgba(120, 53, 15, 0.9)`, 11px font-medium.
- **Nút "Chi tiết / Thu gọn":** Chữ gạch chân không viền, cursor pointer.

### 1.3. Hero Empty State & Prompt Cards
- **Căn giữa:** Khoảng cách thoáng, lề trên `py-10`.
- **Icon Trọng Tâm:** Icon tối giản đen/xanh nhạt trên nền Warm Stone `#F6F5F4` bo góc 12px.
- **Tiêu đề Display:** `Bạn cần tra cứu độ an toàn loại thuốc nào?`, 22px - 26px font-semibold, letter-spacing `-0.03em`.
- **Mô tả:** Chữ `rgba(0, 0, 0, 0.54)`, 13px, khoảng cách dòng thoáng.
- **4 Thẻ Gợi Ý Nhanh (`card-2`):**
  - Bố cục lưới 2 cột (`grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto`).
  - Bo góc 12px (`rounded-xl`), nền `#FFFFFF`, viền `1px solid rgba(0, 0, 0, 0.08)`.
  - Icon: Màu Link Blue `#097FE8` trên nền Blue Mist `#E6F3FE` bo góc 6px.
  - Tiêu đề thẻ: 12px font-semibold `text-black`.
  - Câu hỏi mẫu: 12px `text-black/60` line-clamp-2.
  - Hover: Viền chuyển sang `rgba(0, 0, 0, 0.16)`, nâng bóng nhẹ `0 2px 8px rgba(0,0,0,0.04)`.

### 1.4. Floating Input Bar
- **Vị trí:** Cố định đáy khung chat với khoảng đệm thoải mái.
- **Khung chứa:** Nền `#FFFFFF`, bo góc 12px (`rounded-xl`), viền `1px solid rgba(0, 0, 0, 0.12)`, bóng đổ `0 2px 10px rgba(0, 0, 0, 0.04)`.
- **Focus Ring:** Khi focus vào textarea/input: `outline: 2px solid #0075DE; outline-offset: 2px;`.
- **Nút Gửi (Send Button):** 
  - Kích thước 32x32px, bo góc 8px.
  - Khi có text: Nền Notion Blue `#0075DE`, hover `#0062BD`, icon Send trắng.
  - Khi rỗng: Nền `#F6F5F4`, icon xám mờ `text-black/30`.

---

## 2. Bong Bóng Tin Nhắn & Nội Dung Y Văn (MessageItem.tsx)

### 2.1. Phân Biệt Vai Trò Tin Nhắn
- **User Message:**
  - Căn phải, khối màu Notion Blue `#0075DE` hoặc mực đậm Ink `#1A1A1A`.
  - Chữ trắng `#FFFFFF`, font Inter 13.5px, bo góc 8px (`rounded-lg`).
- **Assistant Message:**
  - Căn trái, trải rộng tự nhiên trên canvas Paper White `#FFFFFF` hoặc trong card trắng viền hairline mờ.
  - Typography: Áp dụng lớp `.medical-prose` chuẩn Notion.

### 2.2. Nhãn An Toàn Thuốc Lâm Sàng (Clinical Safety Badges)
1. **Tương Thích (Compatible):**
   - Nền: Mint Wash `rgba(26, 174, 57, 0.1)`.
   - Viền: `1px solid rgba(26, 174, 57, 0.25)`.
   - Chữ & Icon: Ship Green `#1AAE39`, font-semibold 11px, bo góc 4px (`rounded`).
2. **Thận Trọng (Caution):**
   - Nền: Amber Wash `rgba(255, 177, 16, 0.12)`.
   - Viền: `1px solid rgba(255, 177, 16, 0.3)`.
   - Chữ & Icon: Marigold `#D97706` / `#FFB110`.
3. **Chống Chỉ Định (Contraindicated):**
   - Nền: Coral Wash `rgba(246, 73, 50, 0.1)`.
   - Viền: `1px solid rgba(246, 73, 50, 0.3)`.
   - Chữ & Icon: Coral Red `#F64932`.

### 2.3. Chip Trích Dẫn Y Văn (Citation Chips)
- Hình dáng: Viên thuốc bo tròn hoàn toàn (`rounded-full`).
- Nền: Blue Mist `#E6F3FE`, viền mỏng `rgba(0, 117, 222, 0.15)`.
- Chữ: Link Blue `#097FE8`, 11.5px font-medium.
- Icon: `BookOpen` hoặc `Globe` kích thước 12x12px.
- Hover: Nền `#D8ECFE`, viền rõ nét `#0075DE`.

### 2.4. Nút Tác Vụ (Action Buttons)
- Nút "Sao chép" (Copy) và "Báo sự cố" (Report):
  - Dạng nút ghost: `padding: 4px 8px`, bo góc 4px (`rounded`).
  - Text/Icon: `rgba(0, 0, 0, 0.54)`, hover `text-black bg-black/5`.
- Form báo sự cố: Nằm trong card bo góc 8px, nền `#F6F5F4`, các radio option tối giản, nút gửi báo cáo Notion Blue.
