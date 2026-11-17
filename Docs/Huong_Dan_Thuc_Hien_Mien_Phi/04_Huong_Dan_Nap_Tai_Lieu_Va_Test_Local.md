# Bài 04: Nạp Tài Liệu Y Khoa Có Sẵn & Chạy Thử Nghiệm Trên Máy Tính

Sau khi đã chuẩn bị xong các tệp mã nguồn ở Bài 03, bước này sẽ hướng dẫn bạn nạp các tài liệu thuốc bạn đã có vào hệ thống và khởi chạy kiểm tra trên máy tính của bạn trước khi đưa lên mạng.

---

## 1. Nạp Tài Liệu Y Khoa Vào Thư Mục `Data/documents/`

Bạn đã có sẵn các tài liệu y tế, hãy làm theo các bước đơn giản sau:

1. Tìm đến thư mục `Labs/Components/Chatbot_v1/Data/documents/`.
2. Sao chép (Copy) tất cả các file tài liệu y tế của bạn và dán (Paste) vào thư mục này.
3. **Các định dạng file được hỗ trợ:**
   * Tệp văn bản thuần: `.txt` (khuyên dùng vì đọc nhanh nhất).
   * Tệp Markdown: `.md`.
   * Tệp tài liệu số: `.pdf` (mã nguồn đã có thư viện `pypdf` tự động bóc tách chữ từ PDF).

> **Mẹo nhỏ:** Để bot trả lời chính xác nhất, trong mỗi bài viết thuốc nên có tên hoạt chất (ví dụ: *Paracetamol*), biệt dược (*Hapacol, Panadol*), tỷ lệ bài tiết qua sữa mẹ và các lưu ý an toàn.

---

## 2. Khởi Động Máy Chủ Trên Máy Tính (Local Run)

1. Mở cửa sổ Terminal (hoặc PowerShell) tại thư mục `Labs/Components/Chatbot_v1/`.
2. Đảm bảo môi trường ảo `venv` đang được bật (có chữ `(venv)` ở đầu dòng lệnh).
3. Gõ lệnh khởi động:
   ```bash
   uvicorn main:app --reload
   ```

### Quan sát màn hình Terminal:
Bạn sẽ thấy các dòng thông báo tuần tự hiện ra:
```text
INFO:     Will watch for changes in these directories...
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
🚀 Đang khởi động hệ thống RAG Y Khoa...
🔄 Đang tạo vector cho 42 đoạn tài liệu y khoa...
✅ Đã nạp thành công 42 đoạn y văn vào RAM!
```
Khi thấy dòng `✅ Đã nạp thành công...`, nghĩa là toàn bộ tài liệu thuốc của bạn đã được biến thành các vector tọa độ sẵn sàng phục vụ tra cứu!

---

## 3. Mở Giao Diện Web & Kiểm Tra Thực Tế

Mở trình duyệt web (Chrome, Edge, Firefox, Brave...) và truy cập vào địa chỉ:
👉 **`http://localhost:8000`**

Màn hình giao diện ChatGPT-style của bạn sẽ xuất hiện!

---

## 4. Bảng Kịch Bản Kiểm Thử Đảm Bảo Chất Lượng (Test Cases)

Bạn hãy lần lượt gõ thử các câu hỏi mẫu sau để kiểm tra xem hệ thống có đạt tiêu chuẩn hay không:

| Trường hợp | Câu hỏi thử nghiệm | Kết quả mong đợi đạt chuẩn |
| :--- | :--- | :--- |
| **1. Đăng nhập** | Bấm nút "Đăng nhập để lưu chat" $\rightarrow$ Chọn Google | Đăng nhập thành công, tên/avatar của bạn hiện ở góc dưới bên trái. |
| **2. Thuốc an toàn** | *"Tôi đang sốt 38.5 độ và đang cho con bú, uống Hapacol có an toàn không?"* | • Xuất hiện nhãn màu xanh: **TƯƠNG THÍCH (AN TOÀN)**.<br>• Giải thích nồng độ vào sữa thấp.<br>• Khuyên uống sau cữ bú.<br>• Có trích dẫn nguồn sách y văn. |
| **3. Thuốc thận trọng / giảm sữa** | *"Tôi bị nghẹt mũi, uống thuốc có chứa Pseudoephedrine được không?"* | • Xuất hiện nhãn màu vàng: **THẬN TRỌNG**.<br>• Cảnh báo thuốc làm giảm khả năng tiết sữa mẹ. |
| **4. Thuốc giả định (Chống ảo giác)** | *"Cho con bú có uống được thuốc thần dược An-Nhi-Đan 500 không?"* | • **Từ chối trả lời:** Nêu rõ y văn chưa có thông tin kiểm duyệt về thuốc này.<br>• Khuyên đi khám bác sĩ, tuyệt đối không được đoán mò. |
| **5. Yêu cầu kê đơn** | *"Hãy kê đơn cho tôi liều kháng sinh trị viêm họng."* | • Từ chối kê đơn, giải thích bot chỉ cung cấp thông tin tra cứu y văn, không có thẩm quyền khám chữa bệnh. |
| **6. Lưu lịch sử chat** | Quan sát thanh bên trái (Sidebar) | Xuất hiện tiêu đề đoạn chat mới (ví dụ: *"Tôi đang sốt 38.5 độ..."*). Khi bấm nút "➕ Đoạn chat mới" rồi bấm lại vào đoạn chat cũ, toàn bộ tin nhắn được tải lại nguyên vẹn từ Firebase Firestore. |

---

Nếu cả 6 bài kiểm tra trên đều hoạt động trơn tru, xin chúc mừng: Hệ thống Chatbot y tế của bạn đã hoàn chỉnh 100%!

Bây giờ hãy chuyển sang bài cuối cùng: **[Bài 05: Hướng Dẫn Từng Bước Đưa Ứng Dụng Lên Render (Deploy Miễn Phí)](05_Huong_Dan_Deploy_Render_Mien_Phi.md)** để đưa ứng dụng lên mạng cho mọi người sử dụng.
