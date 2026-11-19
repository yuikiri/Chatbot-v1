# Notion Design System — Modals Specification

> **Áp dụng cho:** `src/Chatbot.Fe/src/components/CitationModal.tsx` và `src/Chatbot.Fe/src/components/AuthModal.tsx`

---

## 1. Quy Chuẩn Chung Cho Modals

- **Backdrop:** Nền đen mực mờ `bg-black/40 backdrop-blur-xs`, chuyển cảnh fade-in êm dịu.
- **Card Khung Modal:**
  - Nền: Paper White `#FFFFFF`.
  - Bo góc: 12px (`rounded-xl`).
  - Viền: `1px solid rgba(0, 0, 0, 0.1)`.
  - Bóng đổ: `shadow-float` (`0 16px 40px rgba(0, 0, 0, 0.14)`).
  - Tối đa chiều cao: `max-h-[85vh]`, phân chia rõ Header cố định, Body có thể cuộn, Footer thao tác.
- **Nút Đóng (Close Button):** Nút ghost 4px radius, icon `X` 16px, `text-black/50 hover:text-black hover:bg-black/5`.

---

## 2. Hộp Thoại Trích Dẫn Y Văn (CitationModal.tsx)

### 2.1. Header Modal
- Tiêu đề tài liệu: Font Inter semi-bold 15px `text-black`, tracking `-0.02em`.
- Huy hiệu nguồn y văn:
  - Nếu nguồn nội bộ cơ sở: Chip xanh lá nhạt `Ship Green` trên `Mint wash`.
  - Nếu nguồn quốc tế (LactMed® NIH / Web): Chip xanh dương `Blue Mist` trên `Link Blue`.
- Điểm tương đồng y văn (Relevance Score): Hiển thị dạng phần trăm hoặc thanh bar mỏng.

### 2.2. Khung Nội Dung Y Văn & Typography Serif
- **Typography:** Toàn bộ nội dung trích yếu hoặc trích đoạn y văn hiển thị bằng phông chữ **Serif (Newsreader / Lyon Text)**:
  - Cỡ chữ: 14.5px, line-height 1.7.
  - Màu chữ: `rgba(0, 0, 0, 0.85)` (Mực in đậm chất sách chuyên khảo y học).
- **Vùng Bôi Đậm Đoạn Trích Gốc (Highlight Target):**
  - Highlight màu vàng hổ phách nhạt `bg-[#FEF3C7]` với viền trái `3px solid #FFB110`.
  - Tự động cuộn đến điểm highlight (`scrollIntoView`).

---

## 3. Hộp Thoại Đăng Nhập / Đăng Ký (AuthModal.tsx)

### 3.1. Thiết Kế Tối Giản (Minimalist Auth)
- Tiêu đề: `Đăng nhập LactaMed AI`, font Inter bold 18px `text-black`, tracking `-0.025em`.
- Mô tả phụ: Chữ mờ `rgba(0, 0, 0, 0.54)` giải thích lợi ích đồng bộ dữ liệu.
- Tab chuyển đổi Đăng nhập / Đăng ký: Dạng pill mỏng nhẹ trên nền `#F6F5F4`.

### 3.2. Form Nhập Liệu & Nút Bấm
- **Ô nhập liệu (Input field):**
  - Nền `#FFFFFF`, bo góc 8px (`rounded-lg`), viền `1px solid rgba(0, 0, 0, 0.14)`.
  - Focus Ring: `outline: 2px solid #0075DE; outline-offset: 2px;`.
  - Icon tiền tố: Màu xám mờ `text-black/40`.
- **Nút Đăng nhập Email (`button-primary`):** Nền Notion Blue `#0075DE`, bo góc 8px.
- **Nút Đăng nhập Google (`button-secondary`):** Nền trắng `#FFFFFF`, viền `1px solid rgba(0, 0, 0, 0.14)`, logo Google chuẩn màu.
