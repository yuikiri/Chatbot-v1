# Plan 03: Quy Trình Kiểm Chứng & Đánh Giá Thực Nghiệm

## 1. Mục Tiêu
Triển khai Prompt 06, Prompt 07 và Prompt 05 từ `Docs/prompt_mau_bc_dt67.docx`:
- `Docs/Report/prompt-06-bang-danh-gia-craap.md`: Bảng đánh giá 15 tình huống bằng mô hình CRAAP (cho điểm 1-5 mỗi tiêu chí).
- `Docs/Report/prompt-07-bang-danh-gia-sift.md`: Bảng đánh giá 15 tình huống bằng mô hình SIFT (4 bước cụ thể).
- `Docs/Report/prompt-05-chuong-3-thu-thap-kiem-chung.md`: Chương 3 Thu thập, đánh giá và kiểm chứng thông tin thuốc trên Internet, dung lượng 3.500 đến 4.500 từ, có bảng minh họa và nhận xét sau từng phần.

## 2. Chi Tiết Thực Hiện

### Prompt 06: Bảng Đánh Giá CRAAP Cho 15 Tình Huống
- Đánh giá toàn bộ 15 tình huống (TH01 - TH15) từ Prompt 04:
  - Currency (Tính cập nhật): 1 - 5 điểm
  - Relevance (Tính liên quan): 1 - 5 điểm
  - Authority (Tính thẩm quyền/chuyên gia): 1 - 5 điểm
  - Accuracy (Tính chính xác): 1 - 5 điểm
  - Purpose (Mục đích thông tin): 1 - 5 điểm
  - Tổng điểm (/25) và Phân loại mức độ tin cậy.
- Có diễn giải lý do cho điểm cụ thể cho từng trường hợp.

### Prompt 07: Bảng Đánh Giá SIFT Cho 15 Tình Huống
- Áp dụng phương pháp đọc ngang (Lateral Reading) cho 15 tình huống:
  - Step 1: Stop (Dừng lại khi gặp thông tin giật gân, nghi ngờ).
  - Step 2: Investigate the source (Điều tra danh tính tác giả, tổ chức, động cơ tài chính).
  - Step 3: Find better coverage (Tìm kiếm nguồn tin đáng tin cậy hơn trên PubMed, Bộ Y tế, WHO).
  - Step 4: Trace claims (Truy vết nguồn gốc tuyên bố, bài báo gốc hoặc kết luận thử nghiệm lâm sàng).
- Trình bày dạng bảng so sánh đối sánh chi tiết.

### Prompt 05: Chương 3 Thu Thập, Đánh Giá Và Kiểm Chứng Thông Tin Thuốc
- **Nội dung chương:**
  - 3.1 Quy trình thu thập thông tin thuốc trên môi trường số (Kỹ thuật cào dữ liệu, lọc thông tin mạng xã hội).
  - 3.2 Ứng dụng mô hình CRAAP trong sàng lọc thông tin thuốc (Phân tích tổng hợp từ 15 tình huống).
  - 3.3 Ứng dụng mô hình đọc ngang SIFT trong xác minh tính xác thực.
  - 3.4 Khai thác cơ sở dữ liệu y văn chính thống (Google Scholar, PubMed, Dược thư Quốc gia) trong kiểm chứng đối chứng.
  - 3.5 Thử nghiệm kiểm chứng sơ bộ với công cụ AI tạo sinh thông thường.
  - 3.6 Đánh giá so sánh hiệu quả giữa các phương pháp kiểm chứng.
- **Yêu cầu kỹ thuật:** Dung lượng 3.500 - 4.500 từ, có bảng minh họa, có nhận xét và đánh giá sâu sắc sau từng phần.

## 3. Tiêu Chí Xác Minh
- Bảng CRAAP và SIFT bao quát đầy đủ 15 tình huống đồng bộ mã số và nội dung.
- File `prompt-05-chuong-3-thu-thap-kiem-chung.md` đạt từ 3.500 đến 4.500 từ.
