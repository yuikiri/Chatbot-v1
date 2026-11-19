# Plan 02: Cơ Sở Lý Thuyết & Bộ Dữ Liệu Tình Huống

## 1. Mục Tiêu
Triển khai Prompt 03 và Prompt 04 từ `Docs/prompt_mau_bc_dt67.docx`:
- `Docs/Report/prompt-04-15-tinh-huong-nghien-cuu.md`: Bộ dữ liệu 15 tình huống thông tin thuốc mạng xã hội dạng bảng chuẩn.
- `Docs/Report/prompt-03-chuong-2-co-so-ly-thuyet.md`: Chương 2 Cơ sở lý thuyết từ mục 2.1 đến 2.8, dung lượng 3.000 đến 3.500 từ, có phân tích và nhận xét sâu sắc cuối mỗi mục.

## 2. Chi Tiết Thực Hiện

### Prompt 04: Xây Dựng 15 Tình Huống Nghiên Cứu
Xây dựng trước bộ dữ liệu để làm cơ sở thực tế cho các chương tiếp theo.
- **Nguồn xuất hiện:** TikTok (4 tình huống), Facebook (4 tình huống), YouTube (4 tình huống), Website bán hàng / Landing page (3 tình huống).
- **Cấu trúc bảng:**
  1. Mã tình huống (TH01 - TH15)
  2. Tên biệt dược / hoạt chất
  3. Nội dung thông tin (claim lan truyền)
  4. Nguồn xuất hiện & kênh phát tán
  5. Dấu hiệu đáng nghi (red flags: cam kết 100%, giật gân, thiếu kiểm chứng, giả mạo danh xưng bác sĩ)
  6. Nguy cơ đối với người dùng (ngộ độc, tương tác thuốc nguy hiểm, bỏ dở điều trị chuẩn)

### Prompt 03: Chương 2 Cơ Sở Lý Thuyết
- **Cấu trúc bắt buộc:**
  - 2.1 Tổng quan về thông tin thuốc (Khái niệm, các nguồn thông tin cấp 1, cấp 2, cấp 3).
  - 2.2 Thông tin sai lệch trong lĩnh vực dược (Định nghĩa Misinformation, Disinformation, Malinformation trong y tế).
  - 2.3 Mô hình CRAAP (Currency, Relevance, Authority, Accuracy, Purpose: nguyên lý và áp dụng trong y tế).
  - 2.4 Mô hình SIFT (Stop, Investigate the source, Find better coverage, Trace claims: đọc ngang lateral reading).
  - 2.5 AI tạo sinh (Generative AI, kiến trúc Transformer, cơ chế tự chú ý và năng lực xử lý ngôn ngữ y khoa).
  - 2.6 Chatbot AI (Kiến trúc RAG, Prompt Engineering, Semantic Search và Guardrails an toàn y tế).
  - 2.7 AI trong ngành Dược (Hỗ trợ tra cứu tương tác, cảnh báo liều dùng, hỗ trợ quyết định lâm sàng).
  - 2.8 Vai trò AI trong kiểm chứng thông tin thuốc (Tự động hóa đối chiếu y văn, trích xuất claim, giảm tải cho cán bộ y tế).
- **Yêu cầu kỹ thuật:** Dung lượng 3.000 - 3.500 từ, bắt buộc có phân tích và nhận xét chuyên sâu cuối mỗi tiểu mục.

## 3. Tiêu Chí Xác Minh
- File `prompt-04-15-tinh-huong-nghien-cuu.md` đủ 15 tình huống đa dạng, phân bố đủ 4 kênh truyền thông.
- File `prompt-03-chuong-2-co-so-ly-thuyet.md` đạt số từ 3.000 - 3.500 từ.
