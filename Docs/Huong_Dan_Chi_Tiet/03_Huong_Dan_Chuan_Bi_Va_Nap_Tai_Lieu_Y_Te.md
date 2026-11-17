# Bài 03: Hướng Dẫn Soạn Thảo và Nạp Tài Liệu Y Văn (Admin Ingestion)

## 1. Nguồn Dữ Liệu Thuốc Uy Tín Lấy từ Đâu?

Đối với đề tài y tế cho phụ nữ nuôi con bằng sữa mẹ, việc sử dụng các bài viết trôi nổi trên mạng xã hội là tối kỵ. Bạn nên lấy thông tin từ 2 nguồn chuẩn mực quốc tế và quốc gia sau:

1. **Cơ sở dữ liệu LactMed (Drugs and Lactation Database - NIH/NLM):**
   * *Địa chỉ tra cứu miễn phí:* [https://www.ncbi.nlm.nih.gov/books/NBK501922/](https://www.ncbi.nlm.nih.gov/books/NBK501922/)
   * Đây là thư viện y văn của Viện Y tế Quốc gia Hoa Kỳ (NIH), là tiêu chuẩn vàng của các bác sĩ sản - nhi trên toàn cầu để kiểm tra thuốc trong thời kỳ cho con bú.
2. **Dược thư Quốc gia Việt Nam:**
   * Cung cấp chỉ định, chống chỉ định và hướng dẫn sử dụng thuốc chuẩn do Bộ Y tế Việt Nam ban hành.
3. **Cẩm nang của Tổ chức Y tế Thế giới (WHO):**
   * *Breastfeeding and Maternal Medication*.

---

## 2. Cách Soạn Thảo 1 Tệp Tài Liệu Thuốc Chuẩn

Tất cả tài liệu y tế sẽ được lưu dưới dạng các tệp văn bản đơn giản (`.txt` hoặc `.md`) đặt bên trong thư mục:
`Labs/Components/Chatbot_v1/Data/documents/`

Mỗi tệp tài liệu đại diện cho một loại hoạt chất. Dưới đây là mẫu chuẩn bạn có thể copy và điền thông tin cho từng loại thuốc:

### File mẫu: `paracetamol.txt`
```text
TÊN HOẠT CHẤT: Paracetamol (Acetaminophen)
TÊN BIỆT DƯỢC PHỔ BIẾN TẠI VIỆT NAM: Hapacol, Panadol, Efferalgan, Tylenol, Paracold.
NHÓM THUỐC: Giảm đau, hạ sốt (Analgesics / Antipyretics).

MỨC ĐỘ AN TOÀN CHO CON BÚ: TƯƠNG THÍCH (AN TOÀN - COMPATIBLE).

TỔNG QUAN Y VĂN:
Paracetamol là lựa chọn giảm đau và hạ sốt hàng đầu được khuyến cáo cho phụ nữ đang nuôi con bằng sữa mẹ. 

DƯỢC ĐỘNG HỌC & BÀI TIẾT VÀO SỮA:
- Tỷ lệ thuốc đi vào sữa mẹ rất thấp: Liều ước tính mà trẻ sơ sinh nhận được qua sữa mẹ dao động từ 0.1% đến 2% so với liều của người mẹ (dưới ngưỡng 10% được coi là rất an toàn).
- Nồng độ đỉnh của thuốc trong sữa mẹ đạt sau khi uống từ 1 đến 2 giờ.
- Thời gian bán thải của thuốc ở mẹ là khoảng 2.5 giờ.

TÁC DỤNG PHỤ Ở TRẺ BÚ MẸ:
Các nghiên cứu lâm sàng trên hàng ngàn trường hợp cho thấy không có tác dụng không mong muốn nghiêm trọng nào được ghi nhận ở trẻ sơ sinh bú mẹ khi người mẹ sử dụng liều điều trị thông thường. Trong một số trường hợp rất hiếm, trẻ có thể có biểu hiện phát ban nhẹ thoáng qua.

LƯU Ý QUAN TRỌNG KHI SỬ DỤNG:
- Người mẹ nên uống thuốc ngay sau khi cho con bú xong để trước khi đến cữ bú tiếp theo, nồng độ thuốc trong máu và sữa đã kịp giảm xuống thấp.
- Tránh sử dụng các loại thuốc cảm cúm hỗn hợp có chứa thêm chất chống nghẹt mũi (như Pseudoephedrine hoặc Phenylephrine) vì các hoạt chất này có thể làm giảm lượng sữa tiết ra.
- Tuân thủ liều thông thường: không quá 1000mg mỗi lần và không quá 4000mg trong 24 giờ.

NGUỒN TRÍCH DẪN:
- Cơ sở dữ liệu LactMed (NCBI/NLM), cập nhật tháng 5/2024.
- Dược thư Quốc gia Việt Nam (Chuyên luận Paracetamol).
```

---

## 3. Quy Trình Nạp Thêm Tài Liệu Thuốc Mới

Hệ thống được thiết kế theo cơ chế **Admin-Only Ingestion**:
1. Khi bạn muốn bổ sung thêm thuốc mới (ví dụ: *Ibuprofen, Amoxicillin, Kháng sinh Augmentin...*):
   * Bạn chỉ cần tạo một file text mới (ví dụ: `ibuprofen.txt`) theo cấu trúc mẫu trên.
   * Thả file vào thư mục `Labs/Components/Chatbot_v1/Data/documents/`.
2. Khi máy chủ Backend khởi động, đoạn code Python trong `rag.py` sẽ **tự động quét toàn bộ các file trong thư mục này**, biến các bài viết thành các vector tọa độ ý nghĩa và sẵn sàng trả lời người dùng.
3. Nếu đã đưa lên Render, bạn chỉ cần bấm commit & push file mới lên GitHub, Render sẽ tự động cập nhật tri thức mới trong vòng 1 phút mà không cần can thiệp kỹ thuật gì thêm.

---

## 4. Tại Sao Người Dùng Thông Thường KHÔNG Thể Sửa Đổi Tài Liệu?

Đúng theo yêu cầu của bạn: *"tài liệu không được sửa đổi bởi các người dùng thông thường"*.

* **Bảo vệ tuyệt đối ở tầng kiến trúc:**
  * Toàn bộ thư mục `Data/documents/` nằm ở bên trong máy chủ (Backend), không có bất kỳ đường link công khai nào ra Internet.
  * Trong mã nguồn của Backend, chúng ta **chỉ mở duy nhất 1 cổng tiếp nhận:** `POST /api/chat` (nhận câu hỏi và trả về câu trả lời).
  * Hệ thống hoàn toàn **không tạo các cổng (API) cho phép Thêm, Sửa, Xóa file** từ phía trình duyệt.
* Người dùng thông thường khi vào trang web chỉ có thể:
  1. Đăng ký / Đăng nhập tài khoản của họ.
  2. Gõ câu hỏi và đọc câu trả lời.
  3. Xem lại các câu hỏi cũ của chính họ.
* Do đó, dữ liệu y tế của bạn được bảo vệ toàn vẹn 100%, không ai có thể làm sai lệch thông tin hay phá hỏng hệ thống y văn của bạn.
