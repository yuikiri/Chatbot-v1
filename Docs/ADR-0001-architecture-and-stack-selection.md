# ADR-0001: Lựa chọn Kiến trúc và Công nghệ cho Chatbot Tư vấn Thuốc Cho con bú

## Trạng thái
Đã chấp thuận (Accepted)

## Bối cảnh và Động lực
Dự án yêu cầu xây dựng trợ lý ảo tư vấn thông tin an toàn sử dụng thuốc cho phụ nữ đang nuôi con bằng sữa mẹ. Do đặc thù y tế liên quan trực tiếp đến sức khỏe của mẹ và trẻ sơ sinh, hệ thống đòi hỏi độ chính xác tuyệt đối, triệt tiêu hoàn toàn hiện tượng mô hình tự sinh thông tin sai lệch (hallucination), và chỉ được phép trích xuất từ nguồn tài liệu y văn đã kiểm duyệt (LactMed, Dược thư Quốc gia). 

Nhóm phát triển cần quyết định kiến trúc triển khai cân bằng giữa:
1. **Tính đơn giản & Khả năng vận hành:** Dễ khởi chạy, không phụ thuộc hạ tầng phân tán phức tạp khi chấm bài/báo cáo.
2. **Bảo mật:** Không lộ API key hay thông tin nhạy cảm ở máy khách (client).
3. **Trải nghiệm người dùng:** Hỗ trợ cơ chế truyền dữ liệu theo dòng chảy (streaming tokens) cho hội thoại tự nhiên.

## Quyết định Kiến trúc
Chúng tôi quyết định áp dụng **mô hình Web API phân tách nhẹ**:
* **Backend:** ASP.NET Core Minimal API (.NET 9) kết hợp thư viện điều phối AI **Microsoft.SemanticKernel**.
* **Tầng lưu trữ & Tìm kiếm:** Sử dụng tìm kiếm kết hợp (**Hybrid Search**) gồm so khớp từ khóa chính xác (Exact Keyword Search trên tên hoạt chất) và tìm kiếm ngữ nghĩa vector (Vector Cosine Similarity lưu trữ nhẹ qua SQLite hoặc In-Memory Vector Store).
* **Frontend:** Giao diện web đơn trang (SPA) tối giản sử dụng **HTML, CSS và JavaScript thuần (Vanilla JS)**, được đóng gói trực tiếp trong thư mục `wwwroot` của Backend.

## Các Phương án Đã Cân nhắc

### 1. Ứng dụng Client thuần (HTML/JS gọi trực tiếp LLM API)
* *Lý do từ chối:* Lộ khóa API bí mật trên mã nguồn trình duyệt; trình duyệt không thể lưu trữ và tìm kiếm vector trên kho tài liệu y tế hàng chục nghìn trang một cách tối ưu và an toàn.

### 2. .NET MVC truyền thống (Server-Side Rendering với Razor View .cshtml)
* *Lý do từ chối:* Khó xử lý giao diện trò chuyện dạng streaming phản hồi từng chữ; mỗi lần tải lại trang hoặc nạp Ajax làm trải nghiệm hội thoại bị gián đoạn và phức tạp hóa mã nguồn view.

### 3. Backend bằng Rust
* *Lý do từ chối:* Hệ sinh thái AI/RAG, thư viện vector store và SDK giao tiếp với LLM trong Rust còn non trẻ; chi phí thời gian viết mã và quản lý vòng đời bộ nhớ quá cao so với mục tiêu hoàn thiện bài toán nghiệp vụ.

### 4. Backend bằng Python (FastAPI + LangChain)
* *Lý do không ưu tiên:* Dù hệ sinh thái AI rất mạnh, việc tích hợp vào repository hiện tại (vốn đang đồng bộ các dự án .NET trong thư mục `Labs/`) sẽ tạo ra sự phân mảnh môi trường phát triển (yêu cầu cả .NET SDK và Python Virtualenv).

## Hệ quả & Đánh đổi

### Tích cực (Pros)
* **Một lệnh chạy duy nhất:** Ứng dụng chỉ cần lệnh `dotnet run` là chạy cả Backend API lẫn phục vụ giao diện tĩnh trong `wwwroot`.
* **Bảo mật tuyệt đối:** Toàn bộ API key, logic truy xuất RAG và cơ chế kiểm duyệt an toàn được đóng kín ở tầng Backend.
* **Giao diện hiện đại:** Frontend JS thuần gọi API qua `fetch` (Stream Reader) mang lại trải nghiệm gõ chữ mượt mà như ChatGPT mà không cần cài đặt Node.js hay bundler cồng kềnh (Webpack, Vite).
* **Đồng nhất công nghệ:** Sử dụng C#/.NET nhất quán với năng lực cốt lõi và các component hiện có trong hệ thống.

### Hạn chế & Biện pháp giảm thiểu (Cons & Mitigations)
* *Hạn chế:* Thư viện `Microsoft.SemanticKernel` của C# có ít bài mẫu cộng đồng hơn so với LangChain của Python.
* *Biện pháp:* Sử dụng mô hình Minimal API đơn giản, cấu hình Semantic Kernel theo tài liệu chuẩn của Microsoft, chỉ tập trung vào 2 chức năng cốt lõi: tạo embedding và gọi Chat Completion có nhúng Context.
