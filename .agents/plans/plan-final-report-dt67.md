# Kế Hoạch Báo Cáo: Chatbot AI Tư Vấn Sử Dụng Thuốc Cho Phụ Nữ Cho Con Bú (Chuẩn Mẫu Huỳnh Tấn Lộc)

## 1. Mục Tiêu
Chuẩn hóa toàn bộ báo cáo học thuật theo đề tài chính xác của người dùng:
**"Chatbot AI tư vấn sử dụng thuốc cho phụ nữ cho con bú - Nghiên cứu trường hợp LactaMed AI và kiểm chứng thông tin thuốc theo CRAAP và SIFT"**.
Tài liệu được biên soạn đồng bộ 100% theo form dáng mẫu thực tế `Docs/Report/example/Huỳnh Tấn Lộc.docx`:
- Bìa viền khung đơn (single border `basicThinLines`).
- Mục lục và Danh mục bảng sử dụng tab stop dấu chấm (`\t` với `w:leader="dot"`).
- Đánh số trang đúng chuẩn: Phần đầu dùng số La Mã thường (i, ii, iii...) ở góc phải footer; Phần nội dung chính (Chương 1 đến hết) đánh số Ả Rập bắt đầu từ 1 ở góc phải footer.
- Định dạng trắng đen đơn giản, không màu mè cầu kỳ, bảng biểu viền đen mỏng 0.5pt, nền trắng sạch sẽ.
- Xuất tệp hoàn chỉnh vào `Docs/Report/final/Bao_Cao_De_Tai_67_Full_Final.docx` và `Docs/Report/final/Bao_Cao_De_Tai_67_Full_Final.md`.

## 2. Các Tệp Thực Hiện
- `[Docs/Report/final/Bao_Cao_De_Tai_67_Full_Final.docx](Docs/Report/final/Bao_Cao_De_Tai_67_Full_Final.docx)`
- `[Docs/Report/final/Bao_Cao_De_Tai_67_Full_Final.md](Docs/Report/final/Bao_Cao_De_Tai_67_Full_Final.md)`
- Các tệp chương sạch tại `[Docs/Report/final/chapters/](Docs/Report/final/chapters/)`:
  - `00_Trang_Bia_Tom_Tat_Muc_Luc.md`
  - `01_Chuong_1_Tong_Quan.md`
  - `02_Chuong_2_Co_So_Ly_Thuyet.md`
  - `03_Chuong_3_Thu_Thap_Danh_Gia_Kiem_Chung.md`
  - `04_Chuong_4_Thiet_Ke_Danh_Gia_Chatbot_AI.md`
  - `05_Chuong_5_Dao_Duc_So_Va_An_Toan_So.md`
  - `06_Chuong_6_Ket_Luan_Va_Kien_Nghi.md`
  - `07_Tai_Lieu_Tham_Khao_APA7.md`
  - `08_Nhan_Xet_Ca_Nhan_Va_Phu_Luc.md`

## 3. Các Nguyên Tắc Thiết Kế Áp Dụng (Poteto Mode & Principles)
- **Minimize Reader Load (`principle-minimize-reader-load`):** Bỏ toàn bộ màu mè (nền xanh navy, chữ xanh, viền màu). Toàn bộ văn bản dùng chữ đen trên nền trắng, bảng biểu viền đơn 0.5pt chuẩn in ấn.
- **Foundational Thinking (`principle-foundational-thinking`):** Xây dựng bộ 15 tình huống chuyên sâu về phụ nữ cho con bú (Paracetamol, Ibuprofen, Amoxicillin, Pseudoephedrine làm mất sữa, cao chè vằng, Metronidazole, thuốc tránh thai Estrogen, nứt cổ gà...). Dữ liệu này nhất quán xuyên suốt từ Chương 1 đến Phụ lục.
- **Prove It Works (`principle-prove-it-works`):** Kiểm tra tệp `.docx` bằng script python: kiểm tra 3 section XML, trường số trang `PAGE` La Mã và Ả Rập, viền bìa `pgBorders` và không có mã màu trang trí.

## 4. Danh Sách Nhiệm Vụ (Todo List)
- [ ] Task 1: Soạn thảo lại các chương trong `Docs/Report/final/chapters/` bám sát đề tài "Chatbot AI tư vấn sử dụng thuốc cho phụ nữ cho con bú" và trường hợp nghiên cứu LactaMed AI.
- [ ] Task 2: Hợp nhất thành tệp toàn văn `Docs/Report/final/Bao_Cao_De_Tai_67_Full_Final.md`.
- [ ] Task 3: Chạy script Python tạo tệp `Docs/Report/final/Bao_Cao_De_Tai_67_Full_Final.docx` với 3 section, bìa viền khung, số trang i/1, bảng trắng đen và mục lục dot leader.
- [ ] Task 4: Chạy script kiểm tra độc lập cấu trúc XML, bảng biểu, số trang và hoàn tất nghiệm thu.
