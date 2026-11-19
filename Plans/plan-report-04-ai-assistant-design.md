# Plan 04: Thiết Kế & Đánh Giá Trợ Lý AI

## 1. Mục Tiêu
Triển khai Prompt 08 từ `Docs/prompt_mau_bc_dt67.docx`:
- `Docs/Report/prompt-08-chuong-4-thiet-ke-danh-gia-tro-ly-ai.md`: Chương 4 Thiết kế và đánh giá trợ lý AI kiểm chứng thông tin thuốc, dung lượng 4.000 đến 5.000 từ.

## 2. Chi Tiết Thực Hiện

### Cấu Trúc Bắt Buộc Chương 4
- **4.1 Mục tiêu hệ thống:**
  - Hỗ trợ sinh viên Dược tra cứu, trích xuất claim và đối chiếu tự động với y văn chuẩn.
  - Ngăn ngừa tình trạng lan truyền tin giả y khoa.
- **4.2 Kiến trúc chatbot:**
  - Kiến trúc RAG khép kín (Retrieval-Augmented Generation) kết hợp SIMD Vector Retrieval.
  - Tầng dữ liệu y văn chính thống (PubMed, Dược thư, FDA Drug Labels).
  - Tầng Prompt Safety Guard và Trích dẫn bằng chứng (Evidence Citation Highlight).
- **4.3 Thiết kế prompt hệ thống:**
  - System Prompt chuyên biệt cho Dược sĩ kiểm chứng: phân tích theo tiêu chí CRAAP & SIFT.
  - Few-shot examples hướng dẫn phân tách claim y tế.
  - Quy tắc an toàn: Không kê đơn, luôn kèm cảnh báo tham vấn bác sĩ, chỉ trích dẫn văn bản có thật.
- **4.4 Quy trình hoạt động:**
  - Tiếp nhận input -> Tiền xử lý & Trích xuất thực thể thuốc -> Tìm kiếm ngữ nghĩa y văn -> Đối chiếu phản biện -> Tạo báo cáo kiểm chứng kèm điểm tin cậy.
- **4.5 Bộ dữ liệu kiểm thử:**
  - Sử dụng 15 tình huống thực tế đã thu thập tại Prompt 04.
- **4.6 Kết quả kiểm thử:**
  - Tỷ lệ phát hiện tin sai lệch, độ chính xác phân loại nguồn tin, khả năng truy hồi tài liệu y văn liên quan.
- **4.7 Đánh giá kết quả:**
  - So sánh hiệu năng AI với quy trình kiểm chứng thủ công của sinh viên Dược (thời gian xử lý, độ nhạy, độ đặc hiệu).
- **4.8 Hạn chế của hệ thống:**
  - Vấn đề Hallucination, độ trễ cập nhật y văn, rào cản ngôn ngữ đối với thuật ngữ y dược tiếng Việt.

## 3. Tiêu Chí Xác Minh
- File `prompt-08-chuong-4-thiet-ke-danh-gia-tro-ly-ai.md` đạt dung lượng 4.000 - 5.000 từ.
- Có sơ đồ kiến trúc Mermaid và System Prompt chi tiết chuẩn mực.
