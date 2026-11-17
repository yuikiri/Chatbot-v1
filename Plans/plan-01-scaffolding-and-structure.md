# Plan 01: Scaffolding Solution & Cấu Trúc Dự Án

## 1. Mục Tiêu
Khởi tạo cấu trúc Solution .NET 8 và React Vite SPA tại các thư mục tương ứng trong `src/`:
- `Chatbot.sln`: Quản lý toàn bộ dự án C#.
- `Chatbot.Be`: ASP.NET Core 8.0 Web API.
- `Chatbot.Rag`: .NET 8.0 Class Library.
- `Chatbot.Data`: .NET 8.0 Class Library.
- `Chatbot.Fe`: React + TypeScript + Vite + Tailwind CSS.

## 2. Liên Kết Phụ Thuộc (Project References)
- `Chatbot.Be` phụ thuộc vào `Chatbot.Rag` và `Chatbot.Data`.
- `Chatbot.Rag` phụ thuộc vào `Chatbot.Data`.
- `Chatbot.Data` là tầng dữ liệu độc lập.

## 3. Checklist Công Việc
- [ ] Khởi tạo `Chatbot.sln` tại `Labs/Components/Chatbot_v1/src/`.
- [ ] Khởi tạo project `Chatbot.Be` (Web API).
- [ ] Khởi tạo project `Chatbot.Rag` (Class Library).
- [ ] Khởi tạo project `Chatbot.Data` (Class Library).
- [ ] Cài đặt gói NuGet cần thiết:
  - `Microsoft.Data.Sqlite` cho `Chatbot.Data`.
  - `System.Numerics.Tensors`, `PdfPig` cho `Chatbot.Rag`.
- [ ] Khởi tạo ứng dụng React Vite TypeScript trong `Chatbot.Fe` kèm Tailwind CSS và Lucide Icons.
