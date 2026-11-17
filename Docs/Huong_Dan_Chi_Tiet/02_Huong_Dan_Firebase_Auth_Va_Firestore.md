# Bài 02: Hướng Dẫn Thiết Lập Firebase từ Số 0 (Auth & Lịch Sử Chat)

## 1. Firebase là gì và tại sao lại dùng cho dự án này?

**Google Firebase** là nền tảng điện toán đám mây của Google cung cấp sẵn các dịch vụ bạn cần mà **không cần viết code máy chủ phức tạp**:
* **Firebase Authentication:** Xử lý toàn bộ logic đăng ký, đăng nhập tài khoản bằng Email/Mật khẩu hoặc nút "Đăng nhập với Google" 1-click. Bạn không cần tự viết mã hóa mật khẩu, không lo bị lộ tài khoản.
* **Cloud Firestore:** Một cơ sở dữ liệu NoSQL đám mây cực kỳ nhanh, tự động đồng bộ tin nhắn thời gian thực lên màn hình web.
* **Chi phí:** Gói miễn phí (*Spark Plan*) của Google cho phép tới 50.000 lượt đọc và 20.000 lượt ghi mỗi ngày — hoàn toàn dư dả cho đề tài và demo thực tế.

---

## 2. Hướng dẫn Từng Bước Thiết Lập trên Firebase Console (Mất 5 phút)

Bạn chỉ cần mở trình duyệt và làm theo đúng các bước sau:

### Bước 1: Tạo Dự án Firebase mới
1. Truy cập vào trang quản trị: [https://console.firebase.google.com/](https://console.firebase.google.com/) (đăng nhập bằng tài khoản Gmail của bạn).
2. Nhấn vào nút **Add project** (Thêm dự án).
3. Đặt tên cho dự án (Ví dụ: `chatbot-thuoc-mebe`). Bấm **Continue**.
4. Ở màn hình hỏi *Google Analytics*, gạt công tắc sang **Disable** (Tắt) cho đơn giản $\rightarrow$ Nhấn **Create project**.
5. Đợi khoảng 15 giây để Google khởi tạo xong $\rightarrow$ Nhấn **Continue** để vào màn hình chính của dự án.

---

### Bước 2: Bật Tính năng Đăng nhập (Authentication)
1. Ở menu bên tay trái, chọn mục **Build** $\rightarrow$ chọn **Authentication**.
2. Nhấn nút **Get started** (Bắt đầu).
3. Ở tab **Sign-in method**, bạn kích hoạt 2 hình thức:
   * **Email/Password:** Nhấp vào $\rightarrow$ Gạt công tắc **Enable** $\rightarrow$ Nhấn **Save**.
   * **Google:** Nhấp vào $\rightarrow$ Gạt công tắc **Enable** $\rightarrow$ Chọn email hỗ trợ của bạn $\rightarrow$ Nhấn **Save**.

Như vậy hệ thống của bạn đã có đầy đủ tính năng đăng nhập bằng Email và đăng nhập nhanh bằng Google!

---

### Bước 3: Tạo Cơ sở dữ liệu Cloud Firestore (Lưu tin nhắn)
1. Ở menu bên trái, chọn mục **Build** $\rightarrow$ chọn **Firestore Database**.
2. Nhấn nút **Create database** (Tạo cơ sở dữ liệu).
3. Chọn vị trí lưu trữ (Location): Giữ nguyên mặc định (thường là `nam5` hoặc `asia-southeast1`) $\rightarrow$ Nhấn **Next**.
4. Ở bước chọn quy tắc bảo mật: Chọn **Start in test mode** (Bắt đầu ở chế độ kiểm thử) để thuận tiện thử nghiệm $\rightarrow$ Nhấn **Create**.

#### Cấu hình Bảo mật Chuẩn (Security Rules):
Sau khi tạo xong, chuyển sang tab **Rules** trên màn hình Firestore, xóa hết nội dung cũ và dán đoạn mã bảo mật sau vào để **đảm bảo người dùng chỉ được đọc và ghi tin nhắn của chính mình**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Chỉ người đã đăng nhập mới được truy cập dữ liệu của chính họ
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```
Nhấn **Publish** để lưu lại.

---

### Bước 4: Lấy mã Cấu hình Firebase (`firebaseConfig`) đưa vào mã nguồn
1. Quay trở lại màn hình chính của dự án (nhấp vào biểu tượng hình bánh răng ⚙️ ở góc trên bên trái menu $\rightarrow$ chọn **Project settings**).
2. Cuộn chuột xuống mục **Your apps**, nhấp vào biểu tượng Web `</>` để đăng ký ứng dụng web.
3. Đặt tên ứng dụng (Ví dụ: `Chatbot Web`) $\rightarrow$ Nhấn **Register app**.
4. Màn hình sẽ hiện ra một đoạn mã JavaScript có dạng như sau:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyD-xxx-xxx-xxx",
  authDomain: "chatbot-thuoc-mebe.firebaseapp.com",
  projectId: "chatbot-thuoc-mebe",
  storageBucket: "chatbot-thuoc-mebe.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};
```

5. **Cách gắn vào code của bạn:** 
   * Mở tệp `Labs/Components/Chatbot_v1/static/firebase-config.js` trong thư mục dự án.
   * Dán toàn bộ đoạn mã `firebaseConfig` vừa copy ở trên vào tệp đó và lưu lại.

---

## 3. Cấu trúc Tin nhắn được Lưu Trữ như thế nào?

Khi người dùng đăng nhập và trò chuyện, mã nguồn JavaScript sẽ tự động ghi dữ liệu lên Firestore theo mô hình:

* **Tài khoản người dùng:** `users/{uid}`
  * **Danh sách cuộc trò chuyện:** `conversations/{conversationId}`
    * `title`: Tiêu đề cuộc trò chuyện (ví dụ: *"Hỏi về Paracetamol"*).
    * `createdAt`: Thời gian tạo.
    * **Các tin nhắn bên trong:** `messages/{messageId}`
      * `role`: `"user"` (người hỏi) hoặc `"assistant"` (bot trả lời).
      * `content`: Nội dung câu hỏi / câu trả lời.
      * `sources`: Danh sách tài liệu y văn được trích dẫn (ví dụ: *"LactMed NBK501922"*).
      * `timestamp`: Thời gian gửi.

Khi người dùng mở lại trang web ở bất kỳ đâu, hệ thống tự động tải lại danh sách các cuộc trò chuyện này lên thanh bên trái (Sidebar) hệt như giao diện ChatGPT.
