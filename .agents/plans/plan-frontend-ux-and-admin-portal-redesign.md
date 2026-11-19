# Kế Hoạch Nâng Cấp Giao Diện Người Dùng & Tái Thiết Kế Cổng Quản Trị Admin Portal

## 1. Tổng Quan Mục Tiêu Và Định Hướng UX/UI
Kế hoạch giải quyết triệt để 4 yêu cầu của người dùng về giao diện Frontend:
1. Cơ chế kích hoạt Admin ẩn (Secret 3-Tap Gesture): Loại bỏ hoàn toàn nút Admin Portal công khai khỏi thanh Sidebar. Thay vào đó, người quản trị chỉ cần chạm hoặc click 3 lần liên tiếp vào icon logo thương hiệu trên cả Sidebar và thanh Header trên mobile.
2. Giao diện người dùng thân thiện, ấm áp (Patient-Centric Chat UX): Tối ưu hóa bong bóng tin nhắn, huy hiệu đánh giá an toàn lâm sàng (Tương thích / Thận trọng / Chống chỉ định), thẻ trích dẫn y văn và thẻ callout lưu ý với phong thái chuyên gia y tế tận tình đồng hành cùng người mẹ.
3. Chuẩn hóa Responsive đa thiết bị (Desktop, Tablet, Mobile): Xử lý triệt để vấn đề chiều cao viewport trên điện thoại di động bằng `100dvh`, bổ sung cơ chế điều hướng Master-Detail trên màn hình nhỏ cho Admin Portal, đảm bảo kích thước vùng chạm (touch target >= 44px) theo chuẩn WCAG.
4. Tái thiết kế Cổng Quản trị Admin Portal (Medical Operations Theme): Xóa bỏ sự rối mắt, các màu sắc chắp vá và cỡ chữ quá nhỏ; áp dụng hệ màu Dark Clinical nhẹ nhàng sang trọng, phân tầng thông tin rõ ràng, và chuẩn hóa toàn bộ thuật ngữ y tế / vận hành hệ thống.

## 2. Danh Sách Tệp Can Thiệp
- `[Labs/Components/Chatbot_v1/src/Chatbot.Fe/index.html](Labs/Components/Chatbot_v1/src/Chatbot.Fe/index.html)`
- `[Labs/Components/Chatbot_v1/src/Chatbot.Fe/src/index.css](Labs/Components/Chatbot_v1/src/Chatbot.Fe/src/index.css)`
- `[Labs/Components/Chatbot_v1/src/Chatbot.Fe/src/components/Sidebar.tsx](Labs/Components/Chatbot_v1/src/Chatbot.Fe/src/components/Sidebar.tsx)`
- `[Labs/Components/Chatbot_v1/src/Chatbot.Fe/src/components/ChatArea.tsx](Labs/Components/Chatbot_v1/src/Chatbot.Fe/src/components/ChatArea.tsx)`
- `[Labs/Components/Chatbot_v1/src/Chatbot.Fe/src/components/MessageItem.tsx](Labs/Components/Chatbot_v1/src/Chatbot.Fe/src/components/MessageItem.tsx)`
- `[Labs/Components/Chatbot_v1/src/Chatbot.Fe/src/components/AdminPortal.tsx](Labs/Components/Chatbot_v1/src/Chatbot.Fe/src/components/AdminPortal.tsx)`
- `[Labs/Components/Chatbot_v1/src/Chatbot.Fe/src/components/CitationModal.tsx](Labs/Components/Chatbot_v1/src/Chatbot.Fe/src/components/CitationModal.tsx)`
- `[Labs/Components/Chatbot_v1/src/Chatbot.Fe/src/App.tsx](Labs/Components/Chatbot_v1/src/Chatbot.Fe/src/App.tsx)`

## 3. Checklist Thực Hiện
- [x] Task 1: Cài đặt cơ chế Secret 3-Tap Gesture trên logo ở cả Sidebar và Header ChatArea, xóa bỏ nút Admin ngoài biên.
- [x] Task 2: Nâng cấp Patient-Centric Chat UX: tối ưu typography, empty state, prompt suggestions, callout và footer disclaimer.
- [x] Task 3: Chuẩn hóa Responsive Mobile & Desktop: hỗ trợ 100dvh, safe area insets, touch targets và dropdown bounds.
- [x] Task 4: Tái thiết kế toàn diện AdminPortal: bố cục Master-Detail trên mobile, theme Dark Clinical sang trọng và hệ màu Semantic.
- [x] Task 5: Chuẩn hóa hệ thống thuật ngữ, copywriting và tone of voice chuyên nghiệp xuyên suốt toàn bộ hệ thống.
- [x] Task 6: Build lại Frontend vào wwwroot, kiểm thử đa màn hình và nghiệm thu trên port 10000.
