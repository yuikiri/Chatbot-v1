# Bài 05: Hướng Dẫn Từng Bước Đưa Ứng Dụng Lên Render (Deploy Miễn Phí)

## 1. Render là gì?

**Render (render.com)** là một nền tảng điện toán đám mây cho phép bạn đưa mã nguồn từ máy tính lên mạng Internet hoàn toàn miễn phí.
* Bạn sẽ nhận được một đường link web công khai có đuôi `.onrender.com` (ví dụ: `https://chatbot-thuoc-mebe.onrender.com`).
* Bất kỳ ai có đường link này đều có thể mở trên điện thoại hoặc máy tính để đăng nhập và chat thử nghiệm.

---

## 2. Những Thứ Cần Chuẩn Bị Trước Khi Bắt Đầu

1. **Một tài khoản GitHub:** Nơi bạn lưu mã nguồn của dự án (tạo tại [github.com](https://github.com)).
2. **Khóa API của Mô hình Ngôn ngữ:**
   * Khóa **OpenAI API Key** (bắt đầu bằng chữ `sk-...`, lấy tại [platform.openai.com](https://platform.openai.com/api-keys)) HOẶC
   * Khóa **Gemini API Key** (hoàn toàn miễn phí, lấy tại [aistudio.google.com](https://aistudio.google.com/)).
3. **Cấu hình Firebase:** Đảm bảo bạn đã điền các thông số `firebaseConfig` vào tệp `static/firebase-config.js` như đã hướng dẫn ở [Bài 02](02_Huong_Dan_Firebase_Auth_Va_Firestore.md).

---

## 3. Hướng Dẫn Từng Bước Triển Khai trên Render (Mất 5 phút)

### Bước 1: Đăng nhập vào Render
1. Truy cập vào trang web: [https://render.com/](https://render.com/).
2. Nhấn nút **GET STARTED FOR FREE** hoặc **Sign In**.
3. Chọn đăng nhập bằng tài khoản **GitHub** của bạn (để Render tự động liên kết với kho code).

---

### Bước 2: Tạo Dịch vụ Web mới (New Web Service)
1. Ở góc trên bên phải màn hình Dashboard của Render, nhấn vào nút **New +** $\rightarrow$ chọn **Web Service**.
2. Chọn tùy chọn **Build and deploy from a Git repository** $\rightarrow$ Nhấn **Next**.
3. Tìm và chọn kho lưu trữ (repository) GitHub chứa mã nguồn chatbot của bạn $\rightarrow$ Nhấn **Connect**.

---

### Bước 3: Điền Thông Tin Cấu Hình Cơ Bản
Tại màn hình cấu hình, bạn điền chuẩn xác các ô sau:

* **Name (Tên ứng dụng):** Đặt tên bạn thích, viết liền không dấu (Ví dụ: `chatbot-thuoc-mebe`). Tên này sẽ xuất hiện trong đường link web của bạn.
* **Region (Khu vực máy chủ):** Chọn **Singapore** (đây là vị trí gần Việt Nam nhất, giúp tốc độ phản hồi nhanh nhất).
* **Branch:** Giữ nguyên là `main` (hoặc `master`).
* **Root Directory:** 
  * Nếu mã nguồn nằm trong thư mục con, điền đường dẫn tới thư mục đó (Ví dụ: `Labs/Components/Chatbot_v1`).
  * Nếu bạn đẩy mã nguồn trực tiếp ở thư mục gốc của repository, hãy để trống ô này.
* **Runtime:** Chọn **Python 3**.
* **Build Command:** 
  ```bash
  pip install -r requirements.txt
  ```
* **Start Command:** 
  ```bash
  uvicorn main:app --host 0.0.0.0 --port $PORT
  ```
* **Instance Type (Gói dịch vụ):** Chọn gói **Free** ($0 / tháng).

---

### Bước 4: Nhập Khóa API Bí Mật (Environment Variables)
Cuộn chuột xuống phần **Environment Variables** (Biến môi trường) $\rightarrow$ Nhấn nút **Add Environment Variable**:
* **Key:** `OPENAI_API_KEY` (hoặc `GEMINI_API_KEY`)
* **Value:** Dán toàn bộ chuỗi khóa bí mật của bạn vào (Ví dụ: `sk-proj-xxxxxxxx...`).

*(Việc điền khóa tại đây giúp bảo mật tuyệt đối, bạn không bao giờ phải viết khóa API trực tiếp vào code nên không sợ bị người khác đánh cắp).*

---

### Bước 5: Bấm Triển Khai (Deploy)
1. Cuộn xuống cuối trang và nhấn nút **Create Web Service**.
2. Màn hình sẽ hiện ra nhật ký cài đặt (Logs). Render sẽ tự động tải thư viện và khởi động máy chủ trong khoảng 2 đến 3 phút.
3. Khi màn hình hiện dòng chữ màu xanh lá cây: **"Your service is live 🎉"**, quá trình triển khai đã thành công!
4. Nhìn lên góc trên bên trái, bên dưới tên ứng dụng, bạn sẽ thấy đường link web (dạng `https://ten-du-an.onrender.com`). Nhấp vào đường link đó để mở trang web chatbot của bạn!

---

## 4. Lưu Ý Quan Trọng: Hiện Tượng "Ngủ Đông" (Cold Start)

Trên gói miễn phí của Render:
* Nếu trong vòng **15 phút** không có bất kỳ ai vào web chat, máy chủ Render sẽ tự động đi vào trạng thái "ngủ đông" (spin down) để tiết kiệm tài nguyên.
* Khi bạn hoặc người chấm bài mở lại link web sau thời gian đó, máy chủ sẽ mất khoảng **30 đến 50 giây** để khởi động lại. Trong khoảng thời gian này trang web có thể phản hồi hơi chậm một chút.
* Sau khi máy chủ đã thức dậy, mọi câu hỏi tiếp theo sẽ phản hồi siêu nhanh chỉ trong vòng 1–2 giây!
