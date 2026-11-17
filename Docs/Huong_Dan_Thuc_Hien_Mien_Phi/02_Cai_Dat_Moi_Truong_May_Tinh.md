# Bài 02: Cài Đặt Môi Trường Máy Tính & Cấu Trúc Thư Mục Dự Án

Bài này hướng dẫn bạn chuẩn bị môi trường chạy code trên máy tính của bạn (Windows, Mac hoặc Linux) chỉ bằng các công cụ miễn phí, không yêu cầu cấu hình máy tính mạnh.

---

## 1. Kiểm Tra & Cài Đặt Python

Hệ thống của chúng ta sử dụng ngôn ngữ **Python** vì nó nhẹ, dễ hiểu và được Render hỗ trợ bản địa 100%.

### Cách kiểm tra Python đã có trên máy hay chưa:
Mở cửa sổ dòng lệnh (**Terminal** trên Mac/Linux hoặc **PowerShell / CMD** trên Windows), gõ lệnh:
```bash
python3 --version
```
*(Nếu trên Windows lệnh `python3` không nhận, thử gõ `python --version`)*.

* **Nếu kết quả ra:** `Python 3.10.x` hoặc `Python 3.11.x`, `Python 3.12.x` $\rightarrow$ Máy bạn đã đạt tiêu chuẩn!
* **Nếu chưa có hoặc phiên bản cũ (< 3.10):**
  * Truy cập trang chủ chính thức: [https://www.python.org/downloads/](https://www.python.org/downloads/)
  * Tải và cài đặt bản Python mới nhất.
  * *(Lưu ý trên Windows khi cài: nhớ tích vào ô vuông **"Add Python to PATH"** trước khi bấm Install).*

---

## 2. Tổ Chức Cây Thư Mục Dự Án Chuẩn

Tại thư mục `Labs/Components/Chatbot_v1/` của bạn, cấu trúc thư mục hoàn chỉnh sẽ trông như sau:

```text
Labs/Components/Chatbot_v1/
├── Data/
│   └── documents/          # 👈 Nơi bạn chép toàn bộ tài liệu y khoa có sẵn vào đây
├── static/                 # 👈 Chứa giao diện web (HTML, CSS, JS)
│   ├── index.html          # Khung trang web (Sidebar + Chat Area)
│   ├── style.css           # Định dạng màu sắc, bố cục
│   ├── app.js              # Xử lý chat, gọi API máy chủ
│   ├── auth.js             # Xử lý đăng nhập / đăng ký Firebase
│   └── firebase-config.js  # Nơi dán mã cấu hình Firebase của bạn
├── .env                    # File lưu khóa bí mật GEMINI_API_KEY (không gửi lên GitHub)
├── .gitignore              # Chỉ định các file không đưa lên GitHub
├── main.py                 # Máy chủ web Backend (FastAPI)
├── rag_engine.py           # Bộ não xử lý đọc tài liệu y văn và gọi AI
└── requirements.txt        # Danh mục các gói thư viện cần cài đặt
```

---

## 3. Tạo Môi Trường Ảo Python (`venv`) & Cài Đặt Thư Viện

Môi trường ảo (*virtual environment*) giúp các thư viện của dự án này nằm độc lập, không làm xung đột với các phần mềm khác trên máy tính của bạn.

Mở Terminal tại thư mục `Labs/Components/Chatbot_v1/` và gõ lần lượt các lệnh:

### Bước 3.1: Tạo môi trường ảo
```bash
python3 -m venv venv
```
*(Lệnh này sẽ tạo ra một thư mục tên là `venv` trong dự án).*

### Bước 3.2: Kích hoạt môi trường ảo
* **Trên Linux / macOS:**
  ```bash
  source venv/bin/activate
  ```
* **Trên Windows (PowerShell):**
  ```powershell
  .\venv\Scripts\Activate.ps1
  ```
*(Khi kích hoạt thành công, bạn sẽ thấy đầu dòng lệnh có chữ `(venv)` xuất hiện).*

---

## 4. Tạo Tệp Thư Viện `requirements.txt`

Tạo một tệp tên là `requirements.txt` nằm ngay trong thư mục `Labs/Components/Chatbot_v1/` với nội dung sau:

```text
fastapi>=0.110.0
uvicorn>=0.28.0
google-generativeai>=0.8.0
numpy>=1.26.0
python-multipart>=0.0.9
pypdf>=4.0.0
python-dotenv>=1.0.0
```

### Ý nghĩa từng thư viện (Giải thích dễ hiểu):
1. **`fastapi` & `uvicorn`:** Công cụ dựng máy chủ web mini để nhận câu hỏi và trả về kết quả cho trình duyệt web.
2. **`google-generativeai`:** Thư viện chính thức của Google để kết nối và gọi mô hình Gemini 1.5 Flash miễn phí.
3. **`numpy`:** Thư viện toán học siêu tốc dùng để tính khoảng cách vector độ tương đồng ngữ nghĩa chỉ trong 0.001 giây (thay thế cho các Vector Database nặng nề).
4. **`pypdf`:** Dùng để đọc nội dung nếu bạn có tài liệu y tế lưu ở dạng file `.pdf`.
5. **`python-dotenv`:** Giúp máy chủ tự động đọc khóa API từ file `.env` khi chạy dưới máy tính.

Sau khi lưu file `requirements.txt`, bạn chạy lệnh cài đặt:
```bash
pip install -r requirements.txt
```

---

## 5. Tạo Tệp `.env` & `.gitignore`

### Tạo tệp `.env`:
Tạo tệp tên là `.env` (chỉ có dấu chấm ở đầu) trong thư mục `Labs/Components/Chatbot_v1/`:
```bash
# Thay chuỗi AIzaSy... bằng khóa bạn đã lấy ở Bài 01
GEMINI_API_KEY=AIzaSyD-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Tạo tệp `.gitignore`:
Tạo tệp tên là `.gitignore` để tránh đẩy file khóa bí mật và thư mục thư viện lên GitHub:
```text
venv/
__pycache__/
.env
*.pyc
```

---

Bây giờ môi trường máy tính của bạn đã sẵn sàng 100%! Hãy chuyển sang **[Bài 03: Chi Tiết Các Thành Phần Mã Nguồn (Code Toàn Bộ)](03_Cac_Thanh_Phan_Code_Va_Cach_Ghep.md)** để nắm rõ toàn bộ mã nguồn của hệ thống.
