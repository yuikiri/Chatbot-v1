# Kế Hoạch Xác Thực Bài Viết Y Khoa Thật & Tối Ưu Hóa Giao Tiếp Cho Bệnh Nhân

## 1. Tổng Quan Mục Tiêu
Kế hoạch giải quyết triệt để 2 vấn đề:
1. **Xác thực bài viết y khoa thật từ các nguồn uy tín:** Thay vì chỉ dẫn link tìm kiếm chung chung hoặc link trang chủ, hệ thống sẽ tự động đối soát và dẫn thẳng tới bài viết chuyên luận thực tế (Monograph / Clinical Guideline) của hoạt chất đó từ các nguồn chính thống toàn cầu:
   - **LactMed (NLM/NIH)**: Chuyên luận chính xác mã `NBK...` hoặc bài báo PubMed Review được bình duyệt.
   - **e-lactancia (APILAM)**: Chuyên luận an toàn thuốc khi cho con bú.
   - **Tổ chức Y tế Thế giới (WHO)** / Dược thư: Phác đồ lâm sàng khuyến cáo.
2. **Tối ưu hóa toàn diện cho người bệnh & Phụ nữ nuôi con bằng sữa mẹ:** Loại bỏ 100% thuật ngữ kỹ thuật phần mềm (`tài liệu nội bộ`, `kho dữ liệu`, `quản trị viên admin`, `vector`, `offset ký tự`, `mã doc_id`...) ở cả Backend Prompt, câu trả lời, thanh trích dẫn và Modal xem chi tiết.

## 2. Danh Sách Tệp Can Thiệp
- `Labs/Components/Chatbot_v1/src/Chatbot.Be/Rag/Services/VerifiedArticleResolver.cs` (Tạo mới dịch vụ phân giải và xác thực link bài viết y khoa thật)
- `Labs/Components/Chatbot_v1/src/Chatbot.Be/Rag/Prompts/StrictMedicalPromptBuilder.cs` (Viết lại toàn bộ văn phong y tế ân cần, bỏ các lý do kỹ thuật)
- `Labs/Components/Chatbot_v1/src/Chatbot.Be/Rag/Services/MedicalRagService.cs` (Tích hợp bộ giải link bài viết thật)
- `Labs/Components/Chatbot_v1/src/Chatbot.Be/Program.cs` (Đăng ký DI cho VerifiedArticleResolver)
- `Labs/Components/Chatbot_v1/src/Chatbot.Fe/src/components/ChatArea.tsx` (Đổi tên 3 chế độ thân thiện cho bệnh nhân)
- `Labs/Components/Chatbot_v1/src/Chatbot.Fe/src/components/MessageItem.tsx` (Đổi nhãn chế độ và phân nhóm trích dẫn)
- `Labs/Components/Chatbot_v1/src/Chatbot.Fe/src/components/CitationModal.tsx` (Làm sạch toàn bộ thông số lập trình)

## 3. Checklist Thực Hiện
- [x] Task 1: Xây dựng bộ xác thực bài viết thực tế `VerifiedArticleResolver.cs` trong Backend.
- [x] Task 2: Loại bỏ toàn bộ thuật ngữ nội bộ và technical excuses trong `StrictMedicalPromptBuilder.cs` & `MedicalRagService.cs`.
- [x] Task 3: Cập nhật nhãn chế độ và phân nhóm trích dẫn sang ngôn ngữ y tế lâm sàng trong `MessageItem.tsx` & `ChatArea.tsx`.
- [x] Task 4: Làm sạch `CitationModal.tsx`: loại bỏ mã `doc_id`, vị trí ký tự offset và dung lượng KB.
- [x] Task 5: Build lại Frontend vào `wwwroot`, biên dịch Backend, khởi động lại server trên port 10000 và kiểm thử thực tế.
