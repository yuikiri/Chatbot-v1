# Plan 00: Điều Phối Tổng Thể Báo Cáo Đề Tài 67

## 1. Mục Tiêu Đề Tài
Báo cáo học thuật Đề tài 67: "Thiết kế và đánh giá trợ lý AI hỗ trợ kiểm chứng thông tin thuốc trên Internet dành cho sinh viên Dược".
Dung lượng toàn văn khoảng 30 trang A4, gồm 6 chương hoàn chỉnh, xây dựng dựa trên 12 prompt yêu cầu tại `Docs/prompt_mau_bc_dt67.docx`.
Kết quả của từng prompt được lưu trữ độc lập tại thư mục `Docs/Report/` dưới định dạng Markdown chuẩn.

## 2. Khung Năng Lực Số Và Phương Pháp Luận
- **Khung năng lực số:** Chuẩn hóa theo Khung năng lực số 6 bậc Việt Nam (Thông tư 03/2014/TT-BTTTT và Quyết định chuẩn năng lực số của Bộ GD&ĐT).
- **Mô hình kiểm chứng nguồn tin:**
  - Mô hình CRAAP (Currency, Relevance, Authority, Accuracy, Purpose).
  - Mô hình đọc ngang SIFT (Stop, Investigate the source, Find better coverage, Trace claims).
- **Hạ tầng tra cứu y văn:** Google Scholar, PubMed / NCBI, Dược thư Quốc gia Việt Nam, FDA, WHO.
- **Kỹ nghệ AI:** RAG (Retrieval-Augmented Generation), Prompt Guardrails, Few-shot Verification Prompting.

## 3. Bản Đồ Liên Kết Giữa Các Sub-Plans
1. [Plan 01: Khung Đề Cương & Chương 1 Mở Đầu](plan-report-01-outline-and-intro.md)
   - Prompt 01: Đề cương chi tiết 6 chương (~30 trang A4).
   - Prompt 02: Chương 1 Mở đầu (1.800 - 2.200 từ).
2. [Plan 02: Cơ Sở Lý Thuyết & Bộ Dữ Liệu Tình Huống](plan-report-02-theory-and-dataset.md)
   - Prompt 03: Chương 2 Cơ sở lý thuyết (3.000 - 3.500 từ).
   - Prompt 04: Bộ dữ liệu 15 tình huống thông tin thuốc trên TikTok, Facebook, YouTube, Web bán hàng.
3. [Plan 03: Quy Trình Kiểm Chứng & Đánh Giá Thực Nghiệm](plan-report-03-verification-and-evaluation.md)
   - Prompt 06: Bảng đánh giá 15 tình huống theo tiêu chí CRAAP (thang điểm 1-5).
   - Prompt 07: Bảng đánh giá 15 tình huống theo 4 bước SIFT.
   - Prompt 05: Chương 3 Thu thập, đánh giá và kiểm chứng thông tin thuốc (3.500 - 4.500 từ).
4. [Plan 04: Thiết Kế & Đánh Giá Trợ Lý AI](plan-report-04-ai-assistant-design.md)
   - Prompt 08: Chương 4 Thiết kế hệ thống, System Prompt, kiểm thử trên 15 tình huống (4.000 - 5.000 từ).
5. [Plan 05: Đạo Đức Số, Kết Luận & Chuẩn Hóa APA 7th](plan-report-05-ethics-conclusion-references.md)
   - Prompt 09: Chương 5 Đạo đức và an toàn số (2.000 - 2.500 từ).
   - Prompt 10: Chương 6 Kết luận và kiến nghị (~1.000 từ).
   - Prompt 11: Nhận xét cá nhân của sinh viên Dược (~500 từ).
   - Prompt 12: Danh mục tài liệu tham khảo chuẩn APA 7th Edition.

## 4. Quy Chuẩn Học Thuật
- Không sử dụng đại từ nhân xưng ngôi thứ nhất (thay bằng "nghiên cứu này", "nhóm nghiên cứu", "tác giả").
- Trình bày dạng văn xuôi học thuật, hạn chế lạm dụng gạch đầu dòng rời rạc.
- Có phân tích và nhận xét sâu sắc sau mỗi bảng dữ liệu hoặc kết thúc mỗi tiểu mục.
- Trích dẫn nguồn tài liệu chuẩn mực y dược và khoa học máy tính.
