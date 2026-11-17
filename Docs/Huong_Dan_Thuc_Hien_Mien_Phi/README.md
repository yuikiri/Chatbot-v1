# Sổ Tay Triển Khai Toàn Diện: Chatbot Y Tế Cho Con Bú (100% Miễn Phí)

Bộ tài liệu này được thiết kế dành riêng cho bạn: **hướng dẫn từng bước từ số 0, cam kết không tốn 1 đồng chi phí (0 VNĐ)**, không cần thẻ tín dụng quốc tế (Visa/Mastercard), sử dụng hoàn toàn các gói dịch vụ miễn phí vĩnh viễn (Free Tier) tốt nhất hiện nay từ Google và Render.

---

## 1. Bảng Cam Kết Công Nghệ 0 Đồng (Zero-Cost Stack)

| Thành phần | Nền tảng / Công cụ | Chính sách miễn phí | Có cần thẻ ngân hàng không? |
| :--- | :--- | :--- | :---: |
| **Trí tuệ nhân tạo (LLM)** | **Google Gemini 1.5 Flash** | Miễn phí 15 lượt gọi/phút, 1.500 lượt/ngày qua Google AI Studio | **KHÔNG** (Chỉ cần tài khoản Gmail) |
| **Vector Tọa độ (Embedding)** | **Gemini text-embedding-004** | Miễn phí 1.500 lượt tạo vector/ngày | **KHÔNG** |
| **Đăng ký / Đăng nhập** | **Firebase Authentication** | Miễn phí không giới hạn người dùng cơ bản | **KHÔNG** |
| **Lưu lịch sử trò chuyện** | **Cloud Firestore** | Miễn phí 50.000 lượt đọc + 20.000 lượt ghi mỗi ngày (Gói Spark) | **KHÔNG** |
| **Lưu tài liệu y khoa** | **Bộ nhớ máy tính / GitHub** | Miễn phí 100% | **KHÔNG** |
| **Máy chủ Web công khai** | **Render.com Free Web Service** | Miễn phí 750 giờ hoạt động/tháng (đủ chạy 24/7 cả tháng) | **KHÔNG** |
| **Mã nguồn & Quản lý code** | **GitHub + VS Code** | Miễn phí vĩnh viễn | **KHÔNG** |

👉 **Tổng chi phí: 0 VNĐ trọn đời cho mục đích học tập, nghiên cứu và làm đồ án!**

---

## 2. Lộ Trình 5 Bước Thực Hiện (Mục Lục Các Bài)

Bạn chỉ cần đi lần lượt theo 5 bài hướng dẫn bên dưới:

1. **[Bài 01: Chuẩn Bị Tài Khoản & Khóa API Miễn Phí](01_Chuan_Bi_Tai_Khoan_Va_API_Mien_Phi.md)**
   * Lấy Gemini API Key miễn phí không cần thẻ tín dụng.
   * Tạo dự án Google Firebase (Bật Email, Google Auth, Firestore Database).
   * Tạo tài khoản GitHub & Render.
2. **[Bài 02: Cài Đặt Môi Trường Máy Tính & Thư Mục Dự Án](02_Cai_Dat_Moi_Truong_May_Tinh.md)**
   * Cài đặt Python 3, tạo môi trường ảo `venv`.
   * Cấu hình các thư viện trong `requirements.txt`.
   * Tổ chức cây thư mục dự án chuẩn.
3. **[Bài 03: Chi Tiết Các Thành Phần Mã Nguồn (Code Toàn Bộ)](03_Cac_Thanh_Phan_Code_Va_Cach_Ghep.md)**
   * Mã nguồn Backend `main.py` & bộ máy RAG `rag_engine.py` (dùng Gemini Flash).
   * Mã nguồn Giao diện ChatGPT-style (`index.html`, `style.css`, `app.js`, `auth.js`).
   * Gắn cấu hình Firebase vào ứng dụng.
4. **[Bài 04: Nạp Tài Liệu Y Khoa Có Sẵn & Chạy Thử Nghiệm Trên Máy](04_Huong_Dan_Nap_Tai_Lieu_Va_Test_Local.md)**
   * Cách chép các tài liệu y tế sẵn có vào thư mục `Data/documents/`.
   * Lệnh khởi động chạy máy chủ trên máy (`http://localhost:8000`).
   * Danh mục 10 câu hỏi kiểm tra độ chính xác và kiểm tra tính năng lưu lịch sử chat.
5. **[Bài 05: Đưa Lên Render Công Khai Để Báo Cáo & Demo](05_Huong_Dan_Deploy_Render_Mien_Phi.md)**
   * Đẩy mã nguồn lên GitHub.
   * Kết nối Render với GitHub và thiết lập biến môi trường `GEMINI_API_KEY`.
   * Lấy đường link web trực tuyến (`https://...onrender.com`) để gửi cho thầy cô hoặc người dùng thử nghiệm.
