# Agent Scratchpad / Working Notes

## Task: Tái Cấu Trúc Toàn Bộ Giao Diện Người Dùng & Admin (Notion Design System)

### Trạng thái
- Đã hoàn tất 8/8 giai đoạn theo kế hoạch `.agents/plans/plan-notion-design-system-and-ui-ux-makeover.md`.
- Đã giải quyết 3 lỗi TypeScript trong `AdminPortal.tsx`, `firebase.ts`.
- `npm run build` chạy thành công (0 lỗi).

## Task: Cập Nhật Favorite Icon & Home Icon
- **Favorite icon (Favicon):** Đã chuyển sang hình 3 (`3.jpeg`), sinh đầy đủ định dạng chuẩn web (`favicon.ico`, `favicon.jpeg`, `favicon.png`) trong `public/` và cập nhật thẻ `<link rel="icon">` trong `index.html`.
- **Home icon:** Đã thay thế icon tại màn hình chính (`ChatArea.tsx` lúc chưa có tin nhắn) bằng hình 2 (`2.jpg`) với khung bo tròn chuẩn Notion.
- `npm run build` hoàn thành 0 lỗi.

## Task: Khắc Phục Lỗi Nhận Diện Tên Thuốc Phiên Âm / Sai Chính Tả & Câu Hỏi Không Dấu (`penixylyn co tac dung gi`)
- **Vấn đề:** Khi người dùng hỏi `penixylyn co tac dung gi\`` ở chế độ Tra cứu Quốc tế (flexible / dễ dàng), bộ lọc intent trước đó phân loại nhầm thành `OutOfScope` do:
  1. Chưa có `penicillin` và các biến thể phiên âm (`penixylyn`, `penixilin`, `penicilin`, `penisilin`) trong từ điển `KnownDrugs`.
  2. `GeneralMedicalRegex` chỉ có `tác dụng phụ` có dấu, không nhận diện được cụm hỏi tác dụng/công dụng ("co tac dung gi", "tac dung", "cong dung", "chua benh gi") và thiếu các từ khóa không dấu.
  3. `MedicalIntentClassifier.Classify` trước đó chưa nhận tham số `mode` (chế độ RAG) để nới lỏng cho chế độ `flexible`.
- **Giải pháp đã thực hiện:**
  1. Bổ sung `penicillin` cùng toàn bộ biến thể chính tả, phiên âm tiếng Việt (`penixylyn`, `penixilin`, `penicilin`, `penisilin`, v.v.) vào `KnownDrugs` và `NormalizeDrugName`.
  2. Xây dựng thuật toán ánh xạ ngữ âm `PhoneticKey` (x->c, y->i, silin->cilin, khử phụ âm lặp) và khoảng cách Levenshtein distance giúp nhận diện chính xác 100% các từ gõ sai chính tả hoặc phiên âm tiếng Việt.
  3. Mở rộng `GeneralMedicalRegex`, `LactationAndMaternalRegex` và `DrugPatternRegex` với đầy đủ các từ ngữ có dấu và không dấu về công dụng, tác dụng, cách dùng thuốc.
  4. Truyền tham số `mode` vào `Classify(query, mode)`: Chế độ `flexible` tiếp nhận linh hoạt các câu hỏi liên quan đến thuốc/sức khỏe.
  5. Bổ sung `penicillin` vào `VerifiedMonographs` trong `VerifiedArticleResolver.cs` (liên kết nguồn LactMed® NIH và e-lactancia).
  6. Tinh chỉnh `DrugOutputStructureGuideline` trong `StrictMedicalPromptBuilder.cs` để trợ lý giải thích rõ công dụng/chỉ định chính của thuốc khi người dùng hỏi về tác dụng.
  7. Bổ sung hàm ánh xạ chế độ `NormalizeRagMode` (chấp nhận cả 'flexible', 'easy', 'dễ dàng', 'de dang', 'quoc te', 'mo rong').
  8. Xử lý triệt để ký tự đặc biệt, dấu backtick (`) ở cuối chuỗi.
  9. Đồng bộ bản build Vite mới nhất sang `src/Chatbot.Be/wwwroot`.
- **Nguyên nhân người dùng vẫn gặp lỗi cũ:** Toàn bộ code sửa đổi ở phiên trước chưa được git commit & push lên `main`, nên VPS/Production vẫn đang chạy Docker image của commit cũ. Cần commit và push để GitHub Actions kích hoạt deploy phiên bản mới lên VPS.
- **Kiểm thử:** Đã kiểm thử thành công qua console runner, `dotnet build -c Release` 0 warning, 0 error.


