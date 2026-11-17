# Bài 01: Chuẩn Bị Tài Khoản & Khóa API Miễn Phí (Không Cần Thẻ Ngân Hàng)

Trước khi bắt tay vào code, bạn chỉ cần dành khoảng 10 phút để đăng ký 4 dịch vụ trực tuyến hoàn toàn miễn phí dưới đây bằng chính tài khoản Gmail của bạn.

---

## 1. Lấy Khóa Google Gemini API Miễn Phí (Não Bộ AI)

Khác với OpenAI bắt buộc phải nạp tối thiểu 5$ và yêu cầu thẻ Visa/Mastercard, **Google cho phép sử dụng mô hình Gemini 1.5 Flash hoàn toàn miễn phí** thông qua cổng Google AI Studio:

1. Mở trình duyệt và truy cập: [https://aistudio.google.com/](https://aistudio.google.com/)
2. Đăng nhập bằng tài khoản Gmail của bạn.
3. Nhấn vào nút xanh **Get API key** ở thanh menu góc bên trái.
4. Nhấn nút **Create API key** (Tạo khóa API).
5. Chọn dự án mặc định hoặc tạo mới $\rightarrow$ Bấm **Create API key in existing project**.
6. Google sẽ tạo ra một chuỗi ký tự bí mật (bắt đầu bằng chữ `AIzaSy...`).
7. Nhấn biểu tượng **Copy** và dán lưu chuỗi này vào một file ghi chú trên máy (ví dụ: `api_key.txt`).

> **Lưu ý bảo mật:** Tuyệt đối không gửi chuỗi khóa này cho người khác hoặc đăng lên mạng xã hội, vì đây là "chìa khóa" kích hoạt mô hình AI của bạn.

---

## 2. Thiết Lập Google Firebase (Đăng Nhập & Lưu Lịch Sử Chat)

Firebase là dịch vụ của Google giúp bạn có ngay hệ thống đăng nhập tài khoản và lưu tin nhắn như ChatGPT mà không cần viết server cơ sở dữ liệu.

### Bước 2.1: Tạo Project Firebase
1. Truy cập: [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Nhấn nút **Add project** (Thêm dự án).
3. Đặt tên dự án: ví dụ `chatbot-y-te-me-be` $\rightarrow$ Nhấn **Continue**.
4. Ở bước hỏi *Enable Google Analytics for this project*: Hãy **Gạt tắt (Disable)** để tiết kiệm thời gian $\rightarrow$ Nhấn **Create project**.
5. Đợi 10 giây cho hệ thống hoàn tất $\rightarrow$ Nhấn **Continue** để vào màn hình Dashboard.

### Bước 2.2: Bật tính năng Đăng nhập (Authentication)
1. Ở menu bên trái, tìm mục **Build** $\rightarrow$ chọn **Authentication** $\rightarrow$ Nhấn **Get started**.
2. Ở tab **Sign-in method**, bạn bật 2 cách đăng nhập:
   * **Email/Password:** Nhấp vào $\rightarrow$ Gạt bật **Enable** $\rightarrow$ Nhấn **Save**.
   * **Google:** Nhấp vào $\rightarrow$ Gạt bật **Enable** $\rightarrow$ Chọn email hỗ trợ của bạn ở menu xổ xuống $\rightarrow$ Nhấn **Save**.

### Bước 2.3: Bật Cơ sở dữ liệu Cloud Firestore (Lưu tin nhắn)
1. Ở menu bên trái, chọn **Build** $\rightarrow$ chọn **Firestore Database** $\rightarrow$ Nhấn **Create database**.
2. **Database location:** Chọn `asia-southeast1` (Singapore) hoặc để mặc định $\rightarrow$ Nhấn **Next**.
3. **Security rules:** Chọn **Start in test mode** (Chế độ thử nghiệm) $\rightarrow$ Nhấn **Create**.
4. *(Tùy chọn tăng tính bảo mật)*: Sau khi tạo xong, bạn chuyển qua tab **Rules** ở trên cùng, dán đoạn mã sau vào và nhấn **Publish**:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId}/{document=**} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

### Bước 2.4: Lấy thông số cấu hình Web App (`firebaseConfig`)
1. Nhấp vào biểu tượng hình Bánh răng cài đặt ⚙️ ở góc trên bên trái menu $\rightarrow$ Chọn **Project settings**.
2. Cuộn chuột xuống dưới cùng mục **Your apps**, nhấp vào biểu tượng dấu Web `</>`.
3. Đặt tên ứng dụng (ví dụ: `ChatbotWeb`) $\rightarrow$ Nhấn **Register app**.
4. Màn hình sẽ hiện ra đoạn mã có dạng:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSyD-xxxxxxxxxxxxxxxxxxxxx",
     authDomain: "chatbot-y-te-me-be.firebaseapp.com",
     projectId: "chatbot-y-te-me-be",
     storageBucket: "chatbot-y-te-me-be.appspot.com",
     messagingSenderId: "1234567890",
     appId: "1:1234567890:web:abcdef123456"
   };
   ```
5. Copy đoạn này cất chung vào file ghi chú cùng với Gemini API Key ở Bước 1.

---

## 3. Tạo Tài Khoản GitHub & Render (Để Đưa Web Lên Mạng)

1. **Tài khoản GitHub:**
   * Nếu chưa có, truy cập [https://github.com/](https://github.com/) để đăng ký một tài khoản miễn phí.
2. **Tài khoản Render:**
   * Truy cập: [https://render.com/](https://render.com/).
   * Nhấn nút **Sign Up** hoặc **Get Started**.
   * **Rất quan trọng:** Chọn **Continue with GitHub** để Render tự động đồng bộ tài khoản với GitHub của bạn.

---

## Tổng Kết Chuẩn Bị
Đến bước này, bạn đã có trong tay:
1. Một khóa bí mật **Gemini API Key**.
2. Một khối cấu hình **firebaseConfig**.
3. Tài khoản **GitHub** và **Render** đã liên kết với nhau.

Bây giờ chúng ta sẽ chuyển sang [Bài 02: Cài Đặt Môi Trường Máy Tính & Thư Mục Dự Án](02_Cai_Dat_Moi_Truong_May_Tinh.md).
