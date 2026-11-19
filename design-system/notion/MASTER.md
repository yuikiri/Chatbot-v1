# Notion Design System — Master Specification (Single Source of Truth)

> **Hệ thống thiết kế Notion Design System cho LactaMed AI**  
> Triết lý: **Calm, Editorial & Near-Monochrome**. Giảm thiểu tối đa tiếng ồn thị giác (visual noise), đề cao nội dung tri thức y văn lâm sàng, biến giao diện thành một trang tài liệu sống động, tinh tế và chuẩn mực.

---

## 1. Nguyên Tắc Thiết Kế Cốt Lõi (Core Principles)

1. **Calm & Editorial (Tĩnh lặng & Đậm chất Xuất bản):** 
   - Sử dụng nền trắng tinh khiết Paper White (`#FFFFFF`) và bề mặt đá ấm Warm Stone (`#F6F5F4`).
   - Mực đen nhiều sắc độ (`#000000` với các mức alpha: 100%, 85%, 54%, 36%) thay cho các dải màu xanh y tế rực rỡ cũ.
2. **Notion Blue As The Only Accent for Action (Notion Blue - Màu Nhấn Hành Động Độc Tôn):**
   - Màu xanh Notion Blue (`#0075DE`) là điểm nhấn thị giác chính cho các hành động tương tác (Primary Button, Link, Focus Ring, Active State).
   - Tuyệt đối không dùng Notion Blue tràn lan cho các khối nền tĩnh.
3. **Subtle Hairline & Multi-layer Elevation (Đường Kẻ Tóc & Bóng Đa Tầng Mờ Nhạt):**
   - Phân tách cấu trúc bằng đường viền siêu mỏng `1px solid rgba(0, 0, 0, 0.08)` hoặc `rgba(0, 0, 0, 0.1)`.
   - Bóng đổ siêu nhẹ (whisper-light shadows) mô phỏng ánh sáng tán xạ tự nhiên.
4. **Editorial Typography (Phối Hợp Chữ Inter & Serif):**
   - `Inter`: Dùng cho toàn bộ giao diện điều hướng, nhãn, dữ liệu bảng, tiêu đề với letter-spacing âm (tight tracking).
   - `Newsreader / Lyon Text (Serif)`: Dùng riêng cho các đoạn trích dẫn y văn lâm sàng, blockquote và lời khuyên y tế để tạo cảm giác học thuật đáng tin cậy.
   - `JetBrains Mono`: Dùng cho mã định danh, số liệu định lượng, timestamp.

---

## 2. Bảng Màu Chi Tiết (Color Palette)

### 2.1. Nền & Bề Mặt Cơ Sở (Base & Surfaces)
| Tên Token | Mã Hex / RGBA | Mô Tả & Vị Trí Áp Dụng |
| :--- | :--- | :--- |
| `notion-bg` | `#FFFFFF` | Nền canvas chính (ChatArea, Modal dialogs, Card prompts) |
| `notion-surface` | `#F6F5F4` | Nền Warm Stone (Sidebar, Code background, Khung bảng phụ) |
| `notion-surface-hover` | `rgba(0, 0, 0, 0.04)` | Lớp phủ hover mỏng nhẹ cho các nút ghost và list item |
| `notion-surface-active` | `rgba(0, 0, 0, 0.08)` | Lớp phủ active/selected |
| `notion-border` | `rgba(0, 0, 0, 0.08)` | Đường kẻ hairline ngăn cách các phân vùng (Sidebar divider) |
| `notion-border-strong` | `rgba(0, 0, 0, 0.14)` | Đường kẻ viền thẻ, khung input, đường phân chia bảng |

### 2.2. Mực Đen & Phân Cấp Văn Bản (Ink Hierarchy)
| Tên Token | Giá Trị | Tương Phản | Vị Trí Sử Dụng |
| :--- | :--- | :--- | :--- |
| `notion-ink` | `#000000` | 21:1 | Tiêu đề chính, văn bản nhấn mạnh, nút bấm Primary Text |
| `notion-ink-body` | `rgba(0, 0, 0, 0.85)` | ~15:1 | Văn bản tin nhắn, nội dung giải thích y văn, nhãn form |
| `notion-ink-muted` | `rgba(0, 0, 0, 0.54)` | ~7.2:1 | Tiêu đề bảng Database (12px uppercase), mô tả phụ, icon |
| `notion-ink-subtle` | `rgba(0, 0, 0, 0.36)` | ~4.6:1 | Placeholder, timestamp, phím tắt keyboard, footnote |

### 2.3. Màu Nhấn Hành Động (Notion Blue System)
| Tên Token | Mã Hex | Mô Tả & Ứng Dụng |
| :--- | :--- | :--- |
| `notion-blue` | `#0075DE` | Màu hành động chính (Button Primary, Focus Ring 2px, Active Tab) |
| `notion-blue-hover` | `#0062BD` | Trạng thái hover cho nút bấm Primary |
| `notion-blue-pressed`| `#005BAB` | Trạng thái active/press cho nút bấm |
| `notion-blue-tint` | `#E6F3FE` | Nền mỏng (Blue Mist) cho chip trích dẫn, badge thông tin |
| `notion-blue-link` | `#097FE8` | Màu chữ liên kết URL và chữ trên chip trích dẫn |

### 2.4. Màu Đánh Giá Lâm Sàng & Phân Loại Dữ Liệu (Semantic Accents)
| Danh Mục | Màu Chính | Nền Phụ (Wash) | Ứng Dụng Trong Hệ Thống |
| :--- | :--- | :--- | :--- |
| **Tương Thích (Safe)** | `#1AAE39` (Ship Green) | `#D0F4D8` / `rgba(26,174,57,0.1)` | Thuốc tương thích, an toàn khi cho con bú, trạng thái Success |
| **Thận Trọng (Caution)**| `#FFB110` (Marigold/Amber) | `#FEF3C7` / `rgba(255,177,16,0.12)`| Thuốc cần thận trọng/theo dõi trẻ, cảnh báo disclaimer y khoa |
| **Chống Chỉ Định** | `#F64932` (Coral Red) | `#FFE4E6` / `rgba(246,73,50,0.1)` | Thuốc chống chỉ định, sự cố nghiêm trọng, nút xóa dữ liệu |
| **Hệ Thống (System)** | `#1313BA` (Ultramarine) | `#E0E7FF` / `rgba(19,19,186,0.08)` | Chế độ tra cứu toàn diện, nhãn kỹ thuật, chỉ số Quota AI |
| **Nhãn Đặc Biệt (Tag)** | `#6B21A8` (Lavender) | `#EADBFA` / `rgba(234,219,250,0.5)`| Phân loại cơ sở dữ liệu, nhãn chuyên khoa phụ |

---

## 3. Thang Typography (Typography Scale)

### 3.1. Phông Chữ & Vai Trò
- **Sans-serif:** `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- **Serif (Editorial):** `Newsreader, "Source Serif 4", Georgia, serif`
- **Monospace:** `"JetBrains Mono", monospace`

### 3.2. Cỡ Chữ & Khoảng Cách Ký Tự (Tracking)
| Cấp Bậc | Kích Thước / Line-Height | Letter-Spacing | Phông Chữ & Font Weight |
| :--- | :--- | :--- | :--- |
| **Display** | 24px - 28px / 1.2 | `-0.035em` | Inter Bold (700) / SemiBold (600) |
| **Heading 1**| 20px / 1.3 | `-0.025em` | Inter SemiBold (600) |
| **Heading 2**| 16px / 1.4 | `-0.020em` | Inter SemiBold (600) |
| **Heading 3**| 14px / 1.45 | `-0.015em` | Inter Medium (500) |
| **Body UI** | 13px - 14px / 1.55 | `-0.011em` | Inter Regular (400) |
| **Editorial Prose** | 14px / 1.68 | `-0.011em` | Inter Regular (400) |
| **Clinical Excerpt** | 14px / 1.7 | `0em` | Newsreader / Serif Regular Italic (400) |
| **Table Header** | 11px - 12px / 1.4 | `+0.04em` (Uppercase)| Inter SemiBold (600) / Medium (500) |
| **Caption/Code** | 11px - 12px / 1.4 | `0em` | JetBrains Mono (400) |

---

## 4. Hệ Thống Bo Góc & Bóng Đổ (Radii & Elevation)

### 4.1. Thang Bo Góc (Semantic Radii)
- `radius-xs` (`4px`): Nút bấm dạng ghost, thẻ tag nhỏ trong bảng, dropdown menu item, status chip.
- `radius-sm` (`8px`): Nút bấm Primary/Secondary, ô nhập dữ liệu input, bong bóng tin nhắn người dùng.
- `radius-md` (`12px`): Thẻ gợi ý câu hỏi nhanh (`card-2`), hộp thoại Modal, khung chat input, bảng dữ liệu Notion Database.
- `radius-full` (`9999px`): Huy hiệu trích dẫn dạng viên thuốc (pill), thanh cuộn, chấm trạng thái hoạt động.

### 4.2. Thang Bóng Đổ (Elevation Tiers)
- **Hairline:** `0 0 0 1px rgba(0, 0, 0, 0.08)`
- **Under-rule Header:** `0 1px 0 0 rgba(0, 0, 0, 0.1)`
- **Card-2 (Soft):** `0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.05)`
- **Float / Modal:** `0 12px 36px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.04)`
- **Focus Ring Notion:** `outline: 2px solid #0075DE; outline-offset: 2px;`

---

## 5. Quy Chuẩn Thành Phần (Component Recipes)

### 5.1. Nút Bấm (Button Recipes)
1. **Button Primary (`button-primary`):**
   - Nền: `#0075DE` (hover `#0062BD`, active `#005BAB`).
   - Chữ: Trắng `#FFFFFF`, 13px, font-medium, tracking `-0.01em`.
   - Bo góc: 8px (`rounded-lg`).
   - Padding: `px-3.5 py-2`.
   - Focus: `outline: 2px solid #0075DE; outline-offset: 2px;`.
2. **Button Secondary (`button-secondary`):**
   - Nền: `#FFFFFF`, viền `1px solid rgba(0, 0, 0, 0.14)`.
   - Chữ: `#000000`, hover `bg-black/5`.
   - Bo góc: 8px.
3. **Button Ghost (`button-ghost`):**
   - Nền: `transparent`, hover `bg-black/5`, active `bg-black/10`.
   - Chữ: `rgba(0, 0, 0, 0.75)`, hover `text-black`.
   - Bo góc: 4px.

### 5.2. Thẻ Gợi Ý Câu Hỏi Nhanh (`card-2`)
- Nền: `#FFFFFF`.
- Viền: `1px solid rgba(0, 0, 0, 0.08)`.
- Bo góc: 12px (`rounded-xl`).
- Bóng đổ: `0 1px 2px rgba(0,0,0,0.03)`.
- Hover: `border-[rgba(0,0,0,0.16)]`, nâng nhẹ `shadow-sm`, `translate-y-[-1px]`.
- Icon: Màu Link Blue `#097FE8` đặt trong khung nền mỏng `#E6F3FE` bo góc 6px.

### 5.3. Bảng Dữ Liệu Notion Database (Admin Table)
- Khung: Nền `#FFFFFF`, bo góc 12px, viền `1px solid rgba(0, 0, 0, 0.08)`, `overflow: hidden`.
- Header: Cao 36px, nền `#F6F5F4`, chữ 11px uppercase `rgba(0, 0, 0, 0.54)`, font-semibold, letter-spacing `+0.04em`.
- Rows: Viền phân tách dưới `1px solid rgba(0, 0, 0, 0.06)`, padding `py-2.5 px-3`, hover `bg-[#F6F5F4]/60`.
- Tags/Pills: Bo góc 4px, font-medium 11px, chữ đậm trên nền wash tương ứng (Amber, Mint, Coral, Indigo).

---

## 6. Những Điều Nên Làm & Tuyệt Đối Tránh (Do's & Don'ts)

| Nên Làm (Do) | Tuyệt Đối Tránh (Don't) |
| :--- | :--- |
| Dùng nền Paper White (`#FFFFFF`) và Warm Stone (`#F6F5F4`) làm chủ đạo. | Không dùng nền đen xì hoặc nền tối màu xanh tím cyberpunk/slate lộn xộn. |
| Dùng Notion Blue (`#0075DE`) cho nút hành động chính, focus ring và link. | Không tô Notion Blue lên toàn bộ diện tích thẻ hay nền header. |
| Giữ viền mỏng hairline `1px solid rgba(0, 0, 0, 0.08)` hoặc `0.1`. | Không dùng viền dày 2px thô kệch hoặc viền màu sặc sỡ. |
| Dùng font Serif cho các trích đoạn y văn lâm sàng và trích yếu. | Không lạm dụng font Serif cho nhãn nút bấm hay tiêu đề bảng điều khiển. |
| Đảm bảo các nút bấm và icon có vùng chạm tối thiểu 44x44px trên thiết bị cảm ứng. | Không để các nút quá nhỏ dính liền nhau gây khó khăn khi thao tác trên di động. |
