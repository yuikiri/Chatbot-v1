# Bài 05: Hướng Dẫn Từng Bước Đưa Ứng Dụng Lên Render (100% Miễn Phí)

Đây là bước cuối cùng để đưa ứng dụng từ máy tính cá nhân lên mạng Internet. Sau khi làm xong bài này, bạn sẽ nhận được một đường link web công khai (ví dụ: `https://chatbot-y-te-me-be.onrender.com`) để bất kỳ ai cũng có thể mở lên dùng thử.

---

## 1. Đưa Mã Nguồn Lên GitHub

Render sẽ tự động lấy code từ GitHub về để build máy chủ.

### Bước 1.1: Tạo Kho Lưu Trữ (Repository) Mới trên GitHub
1. Mở trang web: [https://github.com/](https://github.com/) $\rightarrow$ Đăng nhập tài khoản.
2. Nhấn vào biểu tượng dấu cộng `+` ở góc trên bên phải $\rightarrow$ Chọn **New repository**.
3. Đặt tên kho lưu trữ: ví dụ `chatbot-y-te-me-be`.
4. Chọn chế độ: **Public** hoặc **Private** đều được (Render hỗ trợ cả hai).
5. Nhấn nút xanh **Create repository**.

### Bước 1.2: Đẩy Code từ Máy Lên GitHub
Mở Terminal tại thư mục dự án `Labs/Components/Chatbot_v1/` và chạy các lệnh:

```bash
# 1. Khởi tạo Git nếu chưa có
git init

# 2. Thêm toàn bộ các file vào danh sách chuẩn bị lưu
git add .

# 3. Tạo một bản ghi commit
git commit -m "Khoi tao chatbot y te me va be"

# 4. Đổi tên nhánh chính thành main
git branch -M main

# 5. Gắn đường link GitHub của bạn (thay đường link thật của bạn vào)
git remote add origin https://github.com/ten-tai-khoan-cua-ban/chatbot-y-te-me-be.git

# 6. Đẩy code lên
git push -u origin main
```

> **Lưu ý cực kỳ quan trọng:** Đảm bảo file `.gitignore` đã có dòng `.env` để file chứa khóa API bí mật của bạn không bị đẩy lên GitHub.

---

## 2. Thiết Lập Triển Khai Trên Render (Render Web Service)

1. Mở trang quản trị: [https://dashboard.render.com/](https://dashboard.render.com/).
2. Nhấn vào nút xanh **New +** ở góc trên bên phải $\rightarrow$ Chọn **Web Service**.
3. Chọn tùy chọn: **Build and deploy from a Git repository** $\rightarrow$ Nhấn **Next**.
4. Tìm tên kho lưu trữ `chatbot-y-te-me-be` mà bạn vừa đẩy lên GitHub $\rightarrow$ Nhấn nút **Connect**.

---

## 3. Điền Thông Số Cấu Hình Trên Render

Màn hình cấu hình sẽ hiện ra, bạn điền chuẩn xác từng mục như sau:

* **Name (Tên web):** Đặt tên bạn thích (ví dụ: `chatbot-y-te-me-be`). Tên này sẽ xuất hiện trong đường link web của bạn.
* **Region (Khu vực):** Chọn **Singapore** (vị trí gần Việt Nam nhất, tốc độ phản hồi nhanh nhất).
* **Branch:** Giữ nguyên là `main`.
* **Root Directory:**
  * Nếu bạn đẩy toàn bộ repository Yuiyui lên: điền `Labs/Components/Chatbot_v1`.
  * Nếu bạn tạo một repo riêng chỉ chứa mỗi thư mục chatbot: hãy để trống ô này.
* **Runtime:** Chọn **Python 3**.
* **Build Command:** 
  ```bash
  pip install -r requirements.txt
  ```
* **Start Command:** 
  ```bash
  uvicorn main:app --host 0.0.0.0 --port $PORT
  ```
* **Instance Type (Gói máy chủ):** Chọn **Free** ($0/tháng).

---

## 4. Điền Khóa API Bí Mật (Environment Variables)

Cuộn chuột xuống phần **Environment Variables** (Biến môi trường) $\rightarrow$ Nhấn nút **Add Environment Variable**:
* **Key (Tên biến):** `GEMINI_API_KEY`
* **Value (Giá trị):** Dán chuỗi khóa `AIzaSy...` mà bạn đã lấy từ Google AI Studio ở Bài 01.

---

## 5. Bấm Triển Khai & Nhận Link Web Hoàn Chỉnh

1. Cuộn chuột xuống cuối trang và nhấn nút **Create Web Service**.
2. Màn hình sẽ chuyển sang chế độ hiển thị Nhật ký cài đặt (**Logs**).
3. Render sẽ tự động tải các gói thư viện (`fastapi`, `google-generativeai`, `numpy`...) và nạp tài liệu y văn. Quá trình này mất khoảng **2 đến 3 phút**.
4. Khi thấy dòng chữ màu xanh lá cây: **"Your service is live 🎉"**, chúc mừng bạn!
5. Nhìn lên góc trên bên trái, ngay dưới tên ứng dụng của bạn, bạn sẽ thấy đường link web dạng:
   👉 **`https://chatbot-y-te-me-be.onrender.com`**
6. Nhấp vào đường link này để mở trang web trực tuyến và bắt đầu sử dụng!

---

## 6. Hướng Dẫn Nạp Thêm Tài Liệu Thuốc Mới Trong Tương Lai

Sau này, bất cứ khi nào bạn muốn bổ sung thêm các loại thuốc mới vào kho tri thức của bot:
1. Thả thêm các file `.txt`, `.md` hoặc `.pdf` mới vào thư mục `Data/documents/` trên máy tính.
2. Mở Terminal gõ 3 lệnh quen thuộc:
   ```bash
   git add .
   git commit -m "Bo sung them tai lieu thuoc moi"
   git push
   ```
3. **Render sẽ tự động phát hiện code mới, tự động build lại và cập nhật tri thức mới cho chatbot hoàn toàn tự động** mà bạn không cần phải đăng nhập vào Render bấm nút gì nữa!

---

## 7. Giải Thích Hiện Tượng "Ngủ Đông" (Cold Start) Của Render Miễn Phí

Trên gói dịch vụ $0 của Render:
* Nếu trong vòng **15 phút** không có bất kỳ ai truy cập, Render sẽ tự động tạm ngưng máy chủ để tiết kiệm điện và tài nguyên.
* Khi bạn hoặc thầy cô mở lại link web sau 15 phút đó, trang web sẽ mất khoảng **30 đến 50 giây** để "thức dậy" và tải dữ liệu vào RAM.
* **Khắc phục khi đi báo cáo/demo:** Trước giờ thuyết trình hoặc gửi link cho người khác khoảng 5 phút, bạn chỉ cần mở link web lên trước một lần để "đánh thức" máy chủ. Khi máy chủ đã thức dậy, mọi câu hỏi sẽ phản hồi siêu tốc chỉ trong 1–2 giây!
