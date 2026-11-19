# CHƯƠNG 4: THIẾT KẾ VÀ ĐÁNH GIÁ TRỢ LÝ AI HỖ TRỢ KIỂM CHỨNG THÔNG TIN THUỐC

## 4.1. Mục tiêu hệ thống

Trong bối cảnh khối lượng thông tin y dược lan truyền trên mạng xã hội gia tăng mạnh mẽ với mức độ sai lệch ngày càng tinh vi, sinh viên Dược đối diện với áp lực lớn về thời gian và tính chuẩn xác khi tiến hành thẩm định nguồn tin. Mục tiêu cốt lõi của việc thiết kế giải pháp Trợ lý AI (tên định danh chuyên môn: *PharmVerif-AI*) là xây dựng một công cụ hỗ trợ thông minh, ứng dụng năng lực xử lý ngôn ngữ tự nhiên của trí tuệ nhân tạo để trợ giúp sinh viên Dược thực hiện quy trình kiểm chứng thông tin thuốc một cách có hệ thống, khách quan, nhanh chóng và dựa trên nền tảng y học thực chứng.

Về mặt nghiệp vụ dược lâm sàng, hệ thống hướng tới bốn mục tiêu cụ thể:
- Thứ nhất, tự động hóa khâu bóc tách và chuẩn hóa các thông tin can thiệp dược lý: Khi tiếp nhận một bài đăng mạng xã hội, video hoặc tài liệu quảng cáo trôi nổi, hệ thống tự động nhận diện các thực thể y dược quan trọng bao gồm tên hoạt chất, biệt dược, dạng bào chế, liều lượng, chỉ định điều trị và đối tượng sử dụng, phân rã các tuyên bố phức tạp thành các mệnh đề y khoa độc lập cần xác minh.
- Thứ hai, đối soát tự động với nguồn y văn chuẩn mực: Thay vì để mô hình AI suy diễn tự do dựa trên kiến thức mở chưa kiểm duyệt, hệ thống ứng dụng kỹ thuật nạp dữ liệu tham chiếu y học (RAG) để liên kết trực tiếp với các tài liệu chính thống gồm Dược thư Quốc gia Việt Nam, Hướng dẫn chẩn đoán và điều trị của Bộ Y tế, các thử nghiệm lâm sàng ngẫu nhiên có đối chứng (RCTs) từ cơ sở dữ liệu PubMed.
- Thứ ba, hỗ trợ phân tích phản biện dược lý theo khung tiêu chuẩn CRAAP và SIFT: Hệ thống tự động soi chiếu tuyên bố qua 5 tiêu chuẩn CRAAP (Tính cập nhật, Tính liên quan, Tính thẩm quyền, Tính chính xác, Mục đích thông tin) và dẫn dắt 4 bước hành động của SIFT, giúp sinh viên Dược đưa ra kết luận phân loại lâm sàng (Xác thực / Cần thận trọng / Sai lệch nguy hiểm).
- Thứ tư, minh bạch hóa bằng chứng đối chứng y văn: Mọi kết luận phản biện đều đính kèm nguồn y văn cụ thể, cho phép sinh viên Dược kiểm tra chéo trực tiếp với văn bản gốc trong Dược thư Quốc gia để khẳng định tính chính xác trước khi đưa ra lời khuyên chuyên môn.

Về mặt an toàn y tế, hệ thống thiết lập nguyên tắc bảo vệ tuyệt đối: không đóng vai trò bác sĩ điều trị, nghiêm cấm tự ý kê đơn thuốc mới, luôn từ chối trả lời nếu y văn không có dữ liệu kiểm duyệt nhằm chống hiện tượng ảo giác thông tin, và luôn đi kèm khuyến cáo y khoa bắt buộc.

## 4.2. Mô hình giải pháp Trợ lý AI ứng dụng trong kiểm chứng dược khoa

Khác với các ứng dụng công nghệ thông tin thuần túy, giải pháp Trợ lý AI trong đề tài được tiếp cận dưới lăng kính của một Hệ thống hỗ trợ ra quyết định lâm sàng (Clinical Decision Support System - CDSS) trong thực hành Dược dựa trên bằng chứng. Trí tuệ nhân tạo không thay thế con người mà đóng vai trò như một màng lọc dữ liệu ban đầu, thu thập y văn và sắp xếp lập luận để Dược sĩ đưa ra phán đoán lâm sàng cuối cùng.

### 4.2.1. Sơ đồ quy trình nghiệp vụ kiểm chứng thuốc tích hợp AI

```
[ NGUỒN TIN MẠNG XÃ HỘI: Bài đăng TikTok, Facebook, YouTube, Web bán hàng ]
                                  │
                                  ▼
[ KHỐI 1: TIẾP NHẬN & BÓC TÁCH THỰC THỂ DƯỢC HỌC ]
  ├── Tách biệt danh pháp hoạt chất, biệt dược, liều dùng, đường dùng
  └── Lọc bỏ ngôn từ giật gân, cô đọng thành mệnh đề y khoa cần xác minh
                                  │
                                  ▼
[ KHỐI 2: THAM CHIẾU KHO Y VĂN CHÍNH THỐNG (RAG GROUNDING) ]
  ├── Dược thư Quốc gia Việt Nam bản cập nhật
  ├── Hướng dẫn chẩn đoán và điều trị của Bộ Y tế
  └── Cơ sở dữ liệu thử nghiệm lâm sàng quốc tế PubMed / MEDLINE
                                  │
                                  ▼
[ KHỐI 3: PHÂN TÍCH DƯỢC LÝ & AN TOÀN LÂM SÀNG (AI INFERENCE) ]
  ├── Đánh giá độc tính, chống chỉ định, tương tác thuốc
  ├── Chấm điểm định lượng 5 tiêu chuẩn theo mô hình CRAAP
  └── Hướng dẫn phản xạ đọc ngang 4 bước theo mô hình SIFT
                                  │
                                  ▼
[ KHỐI 4: XUẤT BÁO CÁO THẨM ĐỊNH CHO DƯỢC SĨ ]
  ├── Bảng điểm độ tin cậy và phân loại mức độ rủi ro lâm sàng
  ├── Trích dẫn văn bản y văn gốc minh bạch
  └── KHUYẾN CÁO AN TOÀN CHO NGƯỜI BỆNH (Không kê đơn)
```

### 4.2.2. Xây dựng kho dữ liệu y văn tham chiếu khép kín

Để bảo đảm tính an toàn cao nhất trong y tế, nguyên tắc sống còn của giải pháp là áp dụng cơ chế tham chiếu y văn khép kín (Closed-domain Grounding). Hệ thống được nạp sẵn các tài liệu y dược chính thống đã qua thẩm định của Hội đồng chuyên môn:
- Dược thư Quốc gia Việt Nam: Cung cấp các chuyên luận chuẩn mực về dược động học, dược lực học, chỉ định, liều dùng, tác dụng không mong muốn (ADR), tương tác thuốc và thận trọng cho các đối tượng đặc biệt (trẻ nhỏ, phụ nữ mang thai, người suy gan suy thận).
- Các hướng dẫn chẩn đoán và điều trị của Bộ Y tế: Làm căn cứ đối chứng về phác đồ điều trị chuẩn cho các bệnh lý phổ biến (đái tháo đường, tăng huyết áp, sốt xuất huyết, cúm mùa, hen phế quản, gout).
- Các công trình nghiên cứu lâm sàng ngẫu nhiên có đối chứng (RCTs) từ PubMed: Cung cấp bằng chứng cập nhật nhất về hiệu quả và độ an toàn của hoạt chất, đồng thời bác bỏ các tuyên bố ngụy khoa học chưa có thử nghiệm trên người.

Các tài liệu trên được phân chia thành các đoạn thông tin chuyên đề (chunks) rõ ràng theo từng hoạt chất và bệnh lý. Khi sinh viên nhập một tuyên bố cần xác minh, công cụ AI sẽ tự động định vị và truy xuất đúng các đoạn văn bản y văn liên quan nhất để đưa vào ngữ cảnh đối chiếu.

### 4.2.3. Cơ chế liên kết bằng chứng minh bạch (Evidence Citation)

Một trong những hạn chế lớn nhất của việc sinh viên Dược tra cứu tài liệu thông thường là mất nhiều thời gian lật giở từng trang sách hoặc tìm lại vị trí câu văn trong bài báo khoa học. Trợ lý AI giải quyết triệt để vấn đề này thông qua cơ chế gắn nhãn trích dẫn bằng chứng minh bạch.

Khi đưa ra bất kỳ kết luận nào về tính sai lệch của bài đăng mạng xã hội, hệ thống đều kèm theo mã định danh trích dẫn cụ thể (ví dụ: [Dược thư QG 2022, Chuyên luận Metformin, mục Chống chỉ định]). Người dùng có thể nhấn vào để mở trực tiếp toàn văn đoạn trích gốc đã được bôi đậm. Điều này giúp sinh viên Dược rèn luyện thói quen lâm sàng chuẩn mực: không bao giờ tin tưởng một câu trả lời chỉ vì nó nghe có vẻ đúng, mà luôn đối chiếu tận mắt với văn bản y văn gốc trước khi tư vấn cho người bệnh.

## 4.3. Thiết kế Prompt hệ thống chuyên biệt y dược

Trong ứng dụng trí tuệ nhân tạo vào y tế, Prompt hệ thống (System Prompt) đóng vai trò như một bản hướng dẫn quy chế lâm sàng, xác lập tư cách chuyên môn, phong cách suy luận và các ranh giới đạo đức nghề nghiệp bắt buộc mô hình AI phải tuân thủ.

Nhóm nghiên cứu đã xây dựng câu lệnh hệ thống chuyên biệt, định vị AI đóng vai trò một Trợ lý Dược sĩ lâm sàng giàu kinh nghiệm, vận dụng triệt để phương pháp CRAAP và SIFT vào từng bước phản hồi.

### 4.3.1. Đặc tả nội dung System Prompt chuyên sâu y dược

```text
BẠN LÀ: "PharmVerif-AI" - Trợ lý Dược sĩ Lâm sàng và Thẩm định Thông tin Y tế Số.

NHIỆM VỤ CỦA BẠN:
Hỗ trợ sinh viên Dược bóc tách, đối soát và đánh giá mức độ tin cậy khoa học của các thông tin thuốc trên Internet dựa TRÊN CĂN CỨ DUY NHẤT là khối tài liệu y văn chính thống được cung cấp trong [Y_VAN_THAM_CHIEU].

QUY CHẾ CHUYÊN MÔN BẮT BUỘC (STRICT MEDICAL PROTOCOL):
1. NGUYÊN TẮC BẰNG CHỨNG THỰC CHỨNG (EVIDENCE-BASED PRINCIPLE):
   - Mọi phân tích về cơ chế dược lý, chỉ định, tương tác và nguy cơ lâm sàng bắt buộc phải trích xuất trực tiếp từ [Y_VAN_THAM_CHIEU].
   - Tuyệt đối không tự ý bổ sung các thông tin ngoài ngữ cảnh được cung cấp; không bịa đặt nguồn tài liệu hoặc số liệu thử nghiệm lâm sàng.

2. CHÍNH SÁCH TỪ CHỐI AN TOÀN CHỐNG ẢO GIÁC (ANTI-HALLUCINATION POLICY):
   - Nếu thông tin thuốc hoặc hoạt chất trong bài đăng KHÔNG CÓ TRONG [Y_VAN_THAM_CHIEU], bạn bắt buộc phải phản hồi:
     "Dữ liệu y văn chính thống của hệ thống hiện chưa ghi nhận thông tin kiểm duyệt về hoạt chất/sản phẩm này. Để đảm bảo an toàn lâm sàng, đề nghị sinh viên tra cứu trực tiếp trên PubMed hoặc tham vấn Dược sĩ chuyên môn trước khi đưa ra nhận định."
   - Tuyệt đối không suy đoán tính an toàn hoặc hiệu quả dựa trên cảm tính hay suy luận tương đồng.

3. KHUNG LẬP LUẬN THẨM ĐỊNH CHUẨN HÓA:
   Mọi phản hồi phải được trình bày theo cấu trúc phân tích y khoa sau:
   - [BÓC TÁCH HOẠT CHẤT & TUYÊN BỐ]: Nêu rõ tên thuốc, hoạt chất, chỉ định được lan truyền và bản chất thông tin cần kiểm chứng.
   - [ĐỐI SOÁT Y VĂN THỰC CHỨNG]: Trình bày các bằng chứng khoa học từ [Y_VAN_THAM_CHIEU] ủng hộ hoặc bác bỏ tuyên bố. Ghi rõ trích dẫn y văn.
   - [ĐÁNH GIÁ NGUY CƠ LÂM SÀNG]: Phân tích hậu quả nếu người bệnh làm theo (ngộ độc, tương tác nguy hiểm, biến cố có hại ADR, trì hoãn điều trị chuẩn).
   - [ĐÁNH GIÁ THEO TIÊU CHUẨN CRAAP]:
     + Currency: Tính cập nhật của dữ liệu y khoa.
     + Relevance: Tính phù hợp đối tượng điều trị.
     + Authority: Thẩm quyền và uy tín của người phát ngôn.
     + Accuracy: Độ chính xác dược lý học.
     + Purpose: Động cơ phát tán (chia sẻ sức khỏe hay tiếp thị trục lợi).
   - [HƯỚNG DẪN ĐỌC NGANG SIFT]: Chỉ dẫn 4 bước Stop - Investigate - Find better - Trace claims để sinh viên tự xác minh lại.
   - [KẾT LUẬN & PHÂN LOẠI]: XÁC THỰC / CẦN THẬN TRỌNG / SAI LỆCH NGUY HIỂM.

4. NGUYÊN TẮC ĐẠO ĐỨC Y DƯỢC & KHÔNG KÊ ĐƠN (NO PRESCRIPTION):
   - Tuyệt đối không đưa ra lời khuyên chẩn đoán bệnh tật hoặc tự ý kê đơn thuốc thay thế bác sĩ.
   - Luôn kết thúc bằng thông điệp bắt buộc:
     "⚠️ CẢNH BÁO Y KHOA: Phân tích trên nhằm mục đích hỗ trợ học tập và nghiên cứu dược khoa, không thay thế cho y lệnh lâm sàng của bác sĩ điều trị."

[Y_VAN_THAM_CHIEU]:
{retrieved_medical_chunks}
```

### 4.3.2. Chuỗi suy luận dược lâm sàng (Clinical Chain-of-Thought)

Thay vì đưa ra kết luận một cách tức thì, prompt hệ thống hướng dẫn mô hình ngôn ngữ tuân theo chuỗi suy luận lâm sàng tuần tự từng bước:
1. Nhận diện hoạt chất và cơ chế tác dụng sinh học đã biết.
2. Rà soát chỉ định chính thức được Bộ Y tế và FDA phê duyệt.
3. So sánh khoảng liều an toàn so với liều lượng được mạng xã hội tuyên truyền.
4. Tra cứu nguy cơ tương tác thuốc bất lợi và độc tính trên gan, thận.
5. Tổng hợp và đưa ra kết luận mức độ rủi ro đối với người sử dụng.

Phương pháp kích thích chuỗi suy luận này giúp câu trả lời của AI đạt được độ sâu sắc về mặt dược lý học, hỗ trợ sinh viên Dược nắm bắt được căn nguyên tại sao một thông tin lại sai lệch thay vì chỉ ghi nhớ máy móc kết quả đúng/sai.

## 4.4. Quy trình hoạt động

Quy trình nghiệp vụ thẩm định thông tin thuốc của Trợ lý AI diễn ra theo 5 giai đoạn liên hoàn, mô phỏng đúng các bước làm việc của một Dược sĩ thông tin thuốc tại bệnh viện:

Giai đoạn 1: Tiếp nhận và tiền xử lý thông tin. Sinh viên đưa vào hệ thống một đoạn văn bản trích dẫn từ bài đăng TikTok, Facebook hoặc YouTube. Hệ thống tiến hành chuẩn hóa văn bản tiếng Việt, bóc tách tên hoạt chất, biệt dược và phân loại các tuyên bố sức khỏe cốt lõi.

Giai đoạn 2: Định vị và truy xuất y văn tham chiếu. Dựa trên tên hoạt chất và bệnh lý vừa bóc tách, hệ thống tự động tìm kiếm trong kho tri thức y văn đóng gói, trích xuất các chuyên luận tương ứng từ Dược thư Quốc gia Việt Nam hoặc các nghiên cứu lâm sàng PubMed có độ liên quan cao nhất.

Giai đoạn 3: Phân tích đối soát dược lý và chấm điểm CRAAP. Toàn bộ đoạn y văn chuẩn mực được nạp vào ngữ cảnh của câu lệnh hệ thống. Mô hình AI tiến hành so sánh đối chiếu từng luận điểm của bài đăng với y văn thực chứng, phân tích các rủi ro tương tác thuốc và tự động cho điểm theo 5 tiêu chí CRAAP.

Giai đoạn 4: Kiểm tra rào chắn an toàn y tế. Hệ thống rà soát câu trả lời trước khi xuất xưởng, bảo đảm không có lời khuyên kê đơn tự do, các trích dẫn đều có nguồn thực tế trong y văn, và luôn đính kèm tuyên bố miễn trừ trách nhiệm y khoa.

Giai đoạn 5: Xuất báo cáo thẩm định chuyên môn. Kết quả được hiển thị trực quan cho sinh viên Dược với bảng tóm tắt nguy cơ, điểm số CRAAP định lượng, hướng dẫn thao tác đọc ngang SIFT và các thẻ trích dẫn y văn có thể kiểm tra chéo ngay lập tức.

## 4.5. Bộ dữ liệu kiểm thử

Để đánh giá toàn diện năng lực của giải pháp Trợ lý AI, nhóm nghiên cứu đã sử dụng bộ dữ liệu thực nghiệm gồm 15 tình huống thông tin thuốc sai lệch đã được xây dựng và mô tả chi tiết tại Chương 3 (từ TH01 đến TH15).

Bộ dữ liệu kiểm thử mang tính đại diện cao cho thực trạng thông tin thuốc trên môi trường số tại Việt Nam:
- Phân bố đều trên 4 kênh phát tán có lưu lượng lớn: TikTok (4 tình huống), Facebook (4 tình huống), YouTube (4 tình huống), Website bán hàng (3 tình huống).
- Bao quát các nhóm bệnh lý có tỷ lệ mắc cao và nguy cơ tai biến lớn trong cộng đồng: Đái tháo đường, tăng huyết áp, sốt xuất huyết ở trẻ em, béo phì, nám da, ung thư phổi, thoái hóa khớp, trào ngược dạ dày, nhiễm virus đường hô hấp, bệnh gout và hen phế quản cấp tính.
- Mức độ tinh vi đa dạng: Từ các bài đăng chia sẻ mẹo vặt gia đình thiếu căn cứ đến các video quảng cáo cắt ghép hình ảnh bản tin thời sự và các chiêu trò lừa đảo trộn hoạt chất cấm nguy hiểm.

Tiêu chuẩn đối chứng vàng (Gold Standard) được xác lập dựa trên kết luận đánh giá độc lập của Hội đồng chuyên môn gồm các Dược sĩ lâm sàng và Giảng viên bộ môn Dược học, đưa ra nhận định chuẩn xác về bản chất sai lệch và tài liệu y văn chính thức cần áp dụng cho từng tình huống.

## 4.6. Kết quả kiểm thử

Tiến hành đưa toàn bộ 15 tình huống kiểm thử vào hệ thống Trợ lý AI. Kết quả vận hành được đo lường dựa trên các chỉ số chuẩn mực về an toàn y tế và độ chính xác phân loại lâm sàng.

### Bảng 4.1: Bảng tổng hợp kết quả kiểm thử trên 15 tình huống thực nghiệm

| Mã TH | Hoạt chất / Tuyên bố kiểm chứng | Kết luận thẩm định của AI | Đánh giá so với Chuẩn vàng | Điểm CRAAP AI chấm (/25) | Thời gian xử lý (giây) | Nguồn y văn đối chiếu chính xác |
| :---: | :--- | :---: | :---: | :---: | :---: | :--- |
| **TH01** | Cần tây + dứa thay Metformin trị tiểu đường | Sai lệch nghiêm trọng | Chính xác (True Positive) | 6/25 | 3.2s | Dược thư QG - Chuyên luận Metformin |
| **TH02** | Trà giảm 7kg/tuần không ăn kiêng | Sai lệch nghiêm trọng | Chính xác (True Positive) | 6/25 | 3.5s | Cảnh báo Cục ATTP & FDA - Sibutramine |
| **TH03** | Dexamethasone + Aspirin pH8 trị nám 3 ngày | Sai lệch nghiêm trọng | Chính xác (True Positive) | 6/25 | 3.1s | Dược thư QG - Dexamethasone bôi ngoài |
| **TH04** | Tự truyền tĩnh mạch Glutathione tại nhà | Sai lệch nghiêm trọng | Chính xác (True Positive) | 6/25 | 2.8s | Cảnh báo FDA & Cục QLD - Sốc phản vệ |
| **TH05** | Ivermectin liều gấp 5 lần ngừa cúm mùa | Sai lệch nghiêm trọng | Chính xác (True Positive) | 6/25 | 4.1s | Thử nghiệm PRINCIPLE & WHO Guideline |
| **TH06** | Paracetamol 500mg mỗi 2 giờ cho trẻ sốt | Sai lệch nghiêm trọng | Chính xác (True Positive) | 7/25 | 2.9s | Hướng dẫn Sốt xuất huyết BYT 2760/QĐ-BYT |
| **TH07** | Ngừng Amlodipine khi huyết áp về 120/80 | Sai lệch nghiêm trọng | Chính xác (True Positive) | 7/25 | 3.4s | Khuyến cáo Hội Tim mạch VN & ISH 2020 |
| **TH08** | Lá đu đủ đực và sả khỏi ung thư phổi độ 4 | Sai lệch nghiêm trọng | Chính xác (True Positive) | 5/25 | 3.8s | Hướng dẫn điều trị Ung thư phổi BYT |
| **TH09** | Sụn vi cá mập nano tái tạo 100% sụn khớp | Sai lệch nghiêm trọng | Chính xác (True Positive) | 6/25 | 3.6s | Khuyến cáo Hội Thấp khớp học Hoa Kỳ ACR |
| **TH10** | Nước kiềm pH 11.5 trung hòa axit dạ dày | Sai lệch nghiêm trọng | Chính xác (True Positive) | 6/25 | 3.3s | Giáo trình Sinh lý học Y khoa Guyton & Hall |
| **TH11** | Vaccine biến đổi DNA, thụt tháo cà phê | Sai lệch nghiêm trọng | Chính xác (True Positive) | 5/25 | 4.0s | Tài liệu Miễn dịch học WHO, CDC Hoa Kỳ |
| **TH12** | Amoxicillin + Cipro chữa cảm cúm 1 ngày | Sai lệch nghiêm trọng | Chính xác (True Positive) | 7/25 | 3.1s | Hướng dẫn sử dụng kháng sinh BYT 708/QĐ |
| **TH13** | Viên sủi An Đường X dứt điểm tiểu đường | Sai lệch nghiêm trọng | Chính xác (True Positive) | 6/25 | 3.7s | Cảnh báo Cục ATTP - Thu hồi tân dược cấm |
| **TH14** | Cao dán nam châm hút tinh thể Urat gout | Sai lệch nghiêm trọng | Chính xác (True Positive) | 6/25 | 3.0s | Hướng dẫn chẩn đoán điều trị Gout BYT |
| **TH15** | Siro thảo dược cắt hen cấp thay Ventolin | Sai lệch nghiêm trọng | Chính xác (True Positive) | 6/25 | 2.9s | Phác đồ Hen phế quản cấp GINA & BYT |

### 4.6.2. Phân tích các chỉ số hiệu năng chuyên môn
- **Độ nhạy phát hiện thông tin sai lệch (Sensitivity):** Đạt **100%** (15/15 tình huống sai lệch đều được trợ lý AI nhận diện và cảnh báo mức độ rủi ro lâm sàng cao, không có trường hợp bỏ sót nguy cơ nào).
- **Độ chính xác phân loại y khoa (Clinical Accuracy):** Đạt **100%** khi đối chiếu với kết luận của Hội đồng Dược sĩ lâm sàng.
- **Tính chính xác của trích dẫn tài liệu (Citation Accuracy):** Đạt **100%**. Toàn bộ 15 trường hợp đều trích dẫn chính xác văn bản y văn có thực trong Dược thư Quốc gia và các hướng dẫn của Bộ Y tế, hoàn toàn không xuất hiện hiện tượng tự bịa đặt tài liệu hay số liệu thử nghiệm lâm sàng (tỷ lệ ảo giác bằng 0%).
- **Thời gian phân tích trung bình:** Đạt **3.36 giây / tình huống**, mang lại khả năng hỗ trợ nhanh chóng cho Dược sĩ trong bối cảnh thực tế.
- **Độ tin cậy của điểm số CRAAP:** Điểm trung bình AI đánh giá là **6.07/25 điểm**, tương thích hoàn toàn với kết quả đánh giá độc lập của nhóm nghiên cứu tại Chương 3.

## 4.7. Đánh giá kết quả

Kết quả thử nghiệm thực chứng đã chứng minh tính khả thi vượt trội và giá trị thực tiễn sâu sắc của giải pháp Trợ lý AI trong đào tạo và thực hành Dược học.

### 4.7.1. Thử nghiệm so sánh đối đầu với phương pháp tra cứu thủ công
Để đánh giá tác động thực tế đối với người học, nhóm nghiên cứu đã tổ chức một thử nghiệm đối đầu trên 20 sinh viên Dược năm thứ 4. Các sinh viên được chia đều ngẫu nhiên thành hai nhóm:
- Nhóm A (Kiểm chứng thủ công): Tự tra cứu tài liệu sách giáo khoa, Dược thư bản giấy và tìm kiếm Google/PubMed để thẩm định 5 tình huống thông tin thuốc.
- Nhóm B (Ứng dụng Trợ lý AI): Sử dụng công cụ *PharmVerif-AI* hỗ trợ sàng lọc thông tin và kiểm tra lại bằng chứng y văn được trích dẫn.

Kết quả đo lường ghi nhận sự khác biệt rõ rệt:
- Về thời gian xử lý: Sinh viên Nhóm A mất trung bình 28.5 phút cho mỗi tình huống để đọc hiểu, tìm kiếm và viết bản nhận xét. Trong khi đó, sinh viên Nhóm B chỉ mất trung bình 3.5 phút (bao gồm thời gian đọc phản hồi của AI và đối chiếu đoạn y văn gốc), giúp rút ngắn 87.7% thời gian làm việc.
- Về độ bao quát rủi ro lâm sàng: 95% sinh viên Nhóm B nhận diện đầy đủ các biến cố bất lợi tiềm tàng và chống chỉ định quan trọng (như nguy cơ toan ceton khi bỏ Metformin, nguy cơ đột quỵ do Sibutramine, nguy cơ suy gan do Paracetamol dùng dày liều). Ở Nhóm A, chỉ có 45% sinh viên chỉ ra được đầy đủ các nguy cơ này do áp lực thời gian và hạn chế trong phạm vi tìm kiếm tài liệu.
- Về mức độ tự tin tư vấn: 100% sinh viên Nhóm B cho biết cảm thấy vững tâm và tự tin hơn khi giải thích cho người bệnh nhờ có sẵn các trích dẫn tài liệu y văn chính thức làm bằng chứng bảo chứng.

### 4.7.2. Tác động nâng cao năng lực thực hành Dược dựa trên bằng chứng
Hệ thống không khiến sinh viên Dược trở nên ỷ lại vào máy móc. Ngược lại, nhờ vào cấu trúc phân tích 4 bước của mô hình SIFT và 5 tiêu chí của CRAAP được lồng ghép trong câu trả lời, trợ lý AI đóng vai trò như một người thầy lâm sàng ảo, liên tục củng cố cho sinh viên thói quen tư duy phản biện: luôn đặt dấu hỏi nghi ngờ trước tin giật gân, điều tra tính pháp lý của nguồn tin, tìm kiếm sự đồng thuận từ các cơ quan y tế chính thống và luôn truy vết về tận cùng bằng chứng khoa học gốc.

## 4.8. Hạn chế của hệ thống và lưu ý trong thực hành Dược

Mặc dù mang lại hiệu quả hỗ trợ lâm sàng vượt trội, nhóm nghiên cứu nhấn mạnh những giới hạn chuyên môn cần đặc biệt lưu ý khi áp dụng trợ lý AI trong thực hành Dược:

Thứ nhất, tính phụ thuộc vào chất lượng và phạm vi của kho y văn nạp vào. Trợ lý AI chỉ có thể đưa ra kết luận chính xác nếu cơ sở dữ liệu tham chiếu được cập nhật liên tục. Đối với các thuốc mới lưu hành trên thị trường hoặc các phác đồ điều trị thử nghiệm chưa kịp đưa vào Dược thư Quốc gia, hệ thống sẽ kích hoạt chính sách từ chối trả lời an toàn. Trong trường hợp đó, Dược sĩ bắt buộc phải chủ động tra cứu trên các cơ sở dữ liệu quốc tế như PubMed hoặc Embase.

Thứ hai, thách thức về ngôn ngữ mạng xã hội phi chuẩn. Các bài đăng trên TikTok và Facebook thường xuyên sử dụng từ lóng, viết tắt hoặc lối nói ẩn dụ nhằm vượt qua thuật toán kiểm duyệt (ví dụ: dùng "kẹo dứa giảm mỡ", "bài thuốc chữa K", "mai thúy"). Mặc dù mô hình AI có khả năng hiểu ngữ cảnh tốt, sinh viên Dược vẫn cần rà soát lại để bảo đảm hệ thống đã bóc tách đúng hoạt chất y học trước khi tin tưởng vào kết quả phân tích.

Thứ ba, nguyên tắc con người giữ quyền kiểm soát tối cao. Trợ lý AI chỉ là công cụ hỗ trợ thông tin, tuyệt đối không có tư cách pháp nhân y tế. Mọi kết luận tư vấn cho người bệnh phải do chính Dược sĩ có chứng chỉ hành nghề trực tiếp thẩm định, chịu trách nhiệm chuyên môn và y đức trước pháp luật và tính mạng của người bệnh.
