# ADR-0005: Chốt Kiến Trúc .NET 8 Web API, React Frontend, Quản Trị Y Văn Admin và Highlight Trích Dẫn

## Trạng thái
Đã chấp thuận (Accepted - Thay thế ADR-0004)

## Bối cảnh và Động lực
Sau khi làm việc cụ thể về kỹ năng và định hướng phát triển thực tế của người phụ trách dự án:
1. **Rào cản cú pháp:** Người phát triển không thông thạo cú pháp Python; trong khi hệ thống máy tính đã cài sẵn **.NET SDK 8.0.427** và quen thuộc với C#/.NET. Do đó, Backend bắt buộc phải viết bằng **.NET / C#** để dễ bảo trì và mở rộng.
2. **Giao diện hiện đại:** Người dùng yêu cầu Frontend có cấu trúc đẹp, linh hoạt bằng **React (TypeScript + Vite + Tailwind CSS)** thay vì HTML/JS thuần thô sơ.
3. **Quản trị tài liệu y văn độc quyền (Admin Ingestion):** Tài liệu y tế chưa được nạp sẵn mà phải do tài khoản Quản trị viên (Admin) nạp vào qua giao diện/API. Khi nạp, tài liệu được lưu thành file vật lý trong hệ thống, tự động đánh chỉ mục vector, và Admin có quyền xóa tài liệu đó bất cứ lúc nào.
4. **Tính năng Bôi đậm Trích dẫn (Citation Highlight):** Khi chatbot trích dẫn một câu hay đoạn văn từ tài liệu y khoa, người dùng bấm vào trích dẫn thì hệ thống sẽ mở cửa sổ tài liệu gốc và **tự động cuộn tới đúng vị trí, bôi đậm (highlight)** đoạn trích đó.
5. **Khả năng Đổi Model Linh hoạt:** Mặc định chạy bằng **Google Gemini 1.5 Flash (miễn phí 100%)**, nhưng cấu hình phải tách rời qua biến môi trường để khi cần có thể trỏ sang các provider trung gian (như **9router**, OpenRouter, hoặc OpenAI-compatible API) mà không phải sửa code.

## Quyết định Kiến trúc

### 1. Phân chia Cấu trúc Dự án theo 4 Thư mục Sẵn có
Hệ thống được tổ chức dạng đa dự án (Multi-project Solution) trong `Labs/Components/Chatbot_v1/src/`:
* `Chatbot.Be`: Ứng dụng ASP.NET Core Web API (.NET 8). Đảm nhận định tuyến API, kiểm tra quyền Admin, phát Server-Sent Events (SSE) streaming câu trả lời, và phục vụ file tĩnh của React.
* `Chatbot.Rag`: Thư viện lõi AI xử lý RAG. Chứa:
  * Trừu tượng hóa nhà cung cấp: `ILlmClient` và `IEmbeddingClient`.
  * Bộ giải mã tài liệu: Hỗ trợ file văn bản (.txt, .md) và file PDF.
  * Bộ bóc tách có lưu tọa độ ký tự: `OffsetChunker` (lưu vị trí `StartOffset`, `EndOffset`).
  * Tìm kiếm vector siêu nhẹ: Dùng SIMD `System.Numerics.Tensors.TensorPrimitives.CosineSimilarity`.
  * Rào chắn y tế: Prompt đóng (*Strict Closed-domain prompt*) kiểm soát ảo giác 100%.
* `Chatbot.Data`: Tầng lưu trữ dữ liệu.
  * Thư mục `src/Chatbot.Data/documents/`: Lưu trữ các file tài liệu y văn gốc do Admin tải lên.
  * Tệp SQLite `src/Chatbot.Data/index/knowledge.db`: Lưu trữ metadata của tài liệu và danh sách các vector chunks kèm tọa độ offset.
* `Chatbot.Fe`: Ứng dụng Single Page Application (React + Vite + Tailwind CSS).
  * Giao diện ChatGPT-style: Sidebar lưu lịch sử hội thoại Firebase Firestore, nút New Chat, quản lý đăng nhập Google/Email.
  * Bảng điều khiển Admin: Giao diện tải lên và xóa file y văn.
  * Bộ hiển thị trích dẫn: Drawer/Modal đọc tài liệu gốc kèm thẻ `<mark>` highlight đoạn text được trích dẫn.

### 2. Mô hình Đóng gói & Triển khai Thống nhất (Single Container Deployment)
Thay vì triển khai 2 dịch vụ riêng lẻ gây lỗi mạng CORS, dự án sử dụng **Dockerfile 3 giai đoạn (Multi-stage)**:
1. *Giai đoạn 1 (Node 22):* Build mã nguồn React trong `src/Chatbot.Fe` ra thư mục `dist`.
2. *Giai đoạn 2 (.NET 8 SDK):* Restore và publish các dự án C# trong `src/Chatbot.Be`.
3. *Giai đoạn 3 (.NET 8 Runtime):* Copy mã nguồn .NET và copy toàn bộ thư mục `dist` của React vào thư mục `wwwroot` của .NET.
👉 Kết quả: Khi chạy trên Render hoặc Docker, máy chủ chỉ cần mở duy nhất cổng 8000. Web API và giao diện React cùng chung 1 domain, triệt tiêu 100% lỗi CORS, bảo mật tuyệt đối API Key.

### 3. Trừu tượng hóa Nhà cung cấp AI (LLM Provider Abstraction)
Hệ thống kết nối LLM qua cơ chế Factory đọc từ biến môi trường:
* Nếu `LLM_PROVIDER=gemini`: Tự động gọi endpoint chuẩn của Google Gemini (`generativelanguage.googleapis.com`).
* Nếu `LLM_PROVIDER=custom_openai`: Tự động chuyển sang gọi endpoint OpenAI chuẩn (`/v1/chat/completions`) tới bất kỳ nhà cung cấp nào (như 9router) thông qua `LLM_BASE_URL` và `LLM_API_KEY`.

---

## Hệ quả & Đánh đổi

### Tích cực (Pros)
* **Phù hợp năng lực lập trình:** Người phát triển hoàn toàn làm chủ mã nguồn C# (.NET 8) và React quen thuộc.
* **Độc lập và bảo mật:** Toàn bộ file tài liệu y tế do Admin kiểm soát; người dùng thường không thể chỉnh sửa.
* **Trải nghiệm minh bạch y khoa:** Tính năng click trích dẫn nhảy tới đoạn văn bản bôi đậm giúp người mẹ hoặc bác sĩ kiểm chứng ngay lập tức tính xác thực của câu trả lời.
* **Chi phí 0 VNĐ:** Mặc định chạy Gemini 1.5 Flash và Firebase Firestore gói miễn phí; deploy gọn trong 1 container duy nhất.

### Hạn chế & Giải pháp (Cons & Mitigations)
* *Hạn chế:* Dockerfile build cả .NET và Node.js có thời gian build ban đầu khoảng 3–4 phút.
* *Giải pháp:* Tận dụng cơ chế layer cache của Docker; khi phát triển trên máy cục bộ chỉ cần chạy song song `dotnet run` và `npm run dev` với tốc độ phản hồi tính bằng mili-giây.
