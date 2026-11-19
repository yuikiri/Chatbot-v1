# Kế hoạch Tích hợp Qdrant Cloud Vector Database cho Chatbot_v1

Kế hoạch này thay thế cơ chế vector in-memory/SQLite cục bộ bằng Qdrant Cloud, lưu trữ vĩnh viễn vector embedding và văn bản y văn trên đám mây miễn phí, khắc phục triệt để việc mất dữ liệu khi restart server trên Render.

---

## 1. Mục tiêu
- Tích hợp Qdrant Cloud Cluster (`ap-northeast-2 AWS`) vào hệ thống Chatbot_v1.
- Lưu trữ toàn bộ chunk văn bản y khoa và vector embedding 768 chiều (Gemini).
- Tìm kiếm ngữ nghĩa thời gian thực phục vụ RAG.
- Đảm bảo cơ chế fallback an toàn về SQLite nếu không cấu hình Qdrant.

---

## 2. Danh sách tệp tạo mới và chỉnh sửa
- [Labs/Components/Chatbot_v1/.env](Labs/Components/Chatbot_v1/.env)
- [Labs/Components/Chatbot_v1/.env.example](Labs/Components/Chatbot_v1/.env.example)
- [Labs/Components/Chatbot_v1/src/Chatbot.Be/appsettings.json](Labs/Components/Chatbot_v1/src/Chatbot.Be/appsettings.json)
- [Labs/Components/Chatbot_v1/src/Chatbot.Be/Chatbot.Be.csproj](Labs/Components/Chatbot_v1/src/Chatbot.Be/Chatbot.Be.csproj)
- [Labs/Components/Chatbot_v1/Dockerfile](Labs/Components/Chatbot_v1/Dockerfile)
- [Labs/Components/Chatbot_v1/docker-compose.yml](Labs/Components/Chatbot_v1/docker-compose.yml)
- [Labs/Components/Chatbot_v1/src/Chatbot.Be/Rag/Services/QdrantVectorService.cs](Labs/Components/Chatbot_v1/src/Chatbot.Be/Rag/Services/QdrantVectorService.cs)
- [Labs/Components/Chatbot_v1/src/Chatbot.Be/Rag/Services/VectorSearchService.cs](Labs/Components/Chatbot_v1/src/Chatbot.Be/Rag/Services/VectorSearchService.cs)
- [Labs/Components/Chatbot_v1/src/Chatbot.Be/Rag/Services/MedicalRagService.cs](Labs/Components/Chatbot_v1/src/Chatbot.Be/Rag/Services/MedicalRagService.cs)
- [Labs/Components/Chatbot_v1/src/Chatbot.Be/Program.cs](Labs/Components/Chatbot_v1/src/Chatbot.Be/Program.cs)

---

## 3. Danh sách công việc (Todo List)
- [ ] Cập nhật biến môi trường Qdrant vào .env, .env.example, appsettings.json và kiểm tra Dockerfile
- [ ] Cài đặt package Qdrant.Client vào Chatbot.Be.csproj
- [ ] Tạo QdrantVectorService.cs để quản lý kết nối, collection, upsert, delete và search vector trên Qdrant Cloud
- [ ] Cập nhật VectorSearchService.cs và MedicalRagService.cs để tích hợp QdrantVectorService
- [ ] Cập nhật Program.cs đăng ký DI, health check và xử lý xoá/nạp tài liệu y văn
- [ ] Build thử nghiệm, kiểm tra kết nối Qdrant Cloud và test nạp/truy vấn RAG
