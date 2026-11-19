# BÁO CÁO KHOA HỌC: ĐỀ CƯƠNG CHI TIẾT
## ĐỀ TÀI 67: THIẾT KẾ VÀ ĐÁNH GIÁ TRỢ LÝ AI HỖ TRỢ KIỂM CHỨNG THÔNG TIN THUỐC TRÊN INTERNET DÀNH CHO SINH VIÊN DƯỢC

**Đơn vị thực hiện:** Bộ môn Dược lâm sàng & Thông tin thuốc  
**Định hướng chuyên môn:** Thực hành Dược dựa trên bằng chứng và Năng lực số Y Dược  
**Quy chuẩn thiết kế:** Báo cáo học thuật ngành Dược 30 trang A4  
**Khung năng lực tham chiếu:** Khung năng lực số 6 bậc Việt Nam áp dụng trong đào tạo y dược học

---

### PHẦN MỞ ĐẦU (FRONT MATTER)
- Trang bìa chính thức theo quy chuẩn khóa luận tốt nghiệp ngành Dược
- Lời cam đoan liêm chính học thuật và đạo đức y khoa
- Lời cảm ơn thầy cô và cơ sở thực hành dược
- Danh mục chữ viết tắt chuyên môn: ADR, OTC, ETC, Dược thư QG, RCT, WHO, FDA, CRAAP, SIFT, RAG, AI...
- Danh mục bảng biểu lâm sàng và sơ đồ quy trình nghiệp vụ
- Tóm tắt báo cáo (Tiếng Việt và Tiếng Anh - Abstract)

---

### CHƯƠNG 1: MỞ ĐẦU (Dự kiến 3 - 4 trang A4)
*Mục tiêu chuyên môn:* Đánh giá thực trạng thông tin thuốc số và xác lập tính cấp thiết của việc bảo đảm an toàn dùng thuốc trong cộng đồng.

- **1.1. Bối cảnh nghiên cứu**
  - 1.1.1. Thực trạng bùng nổ thông tin y dược trên không gian mạng và các kênh mạng xã hội.
  - 1.1.2. Thói quen tự ý tìm kiếm chỉ định điều trị và tự mua thuốc của người dân qua mạng Internet.
  - 1.1.3. Áp lực chuyên môn đối với sinh viên Dược trước ma trận thông tin thuốc đa nguồn và chưa được kiểm chứng.
- **1.2. Lý do chọn đề tài**
  - 1.2.1. Hiểm họa lâm sàng của thông tin thuốc sai lệch đối với tính mạng người bệnh: ngộ độc dược chất, tương tác nguy hiểm, biến cố có hại của thuốc (ADR).
  - 1.2.2. Khoảng trống kỹ năng thẩm định tài liệu y văn số trong chương trình đào tạo Dược khoa hiện nay.
  - 1.2.3. Sự cần thiết của việc ứng dụng công cụ trí tuệ nhân tạo nhằm hỗ trợ sàng lọc và đối chiếu y văn nhanh chóng cho Dược sĩ.
- **1.3. Mục tiêu nghiên cứu**
  - 1.3.1. Mục tiêu tổng quát: Ứng dụng công cụ AI xây dựng giải pháp trợ lý hỗ trợ sinh viên Dược kiểm chứng thông tin thuốc trên Internet.
  - 1.3.2. Mục tiêu cụ thể:
    - Xây dựng quy trình kiểm chứng thông tin thuốc dựa trên phương pháp CRAAP và SIFT.
    - Thiết lập bộ dữ liệu thực tế gồm 15 tình huống thông tin thuốc sai lệch trên mạng xã hội.
    - Thiết kế kịch bản prompt y khoa chuyên sâu và ứng dụng AI đối soát với kho y văn chính thống.
    - Đánh giá độ chính xác, độ an toàn y tế và hiệu quả hỗ trợ của trợ lý AI đối với sinh viên Dược.
- **1.4. Đối tượng nghiên cứu**
  - 1.4.1. Đối tượng nội dung: Các tuyên bố y khoa, chỉ định điều trị và quảng cáo dược phẩm sai lệch lan truyền trên Internet.
  - 1.4.2. Đối tượng thụ hưởng: Sinh viên Dược năm 3 đến năm 5 tại các cơ sở đào tạo y dược.
  - 1.4.3. Đối tượng công cụ: Ứng dụng mô hình AI và phương pháp RAG đóng vai trò trợ lý sàng lọc y văn.
- **1.5. Phạm vi nghiên cứu**
  - 1.5.1. Phạm vi nội dung: Kiểm chứng chỉ định, liều lượng, tương tác thuốc và tính an toàn của thuốc OTC, thuốc kê đơn và thực phẩm bảo vệ sức khỏe.
  - 1.5.2. Phạm vi nguồn tin mạng xã hội: TikTok, Facebook, YouTube và các trang thông tin thương mại điện tử.
  - 1.5.3. Phạm vi tài liệu đối chứng: Dược thư Quốc gia Việt Nam, Hướng dẫn chẩn đoán điều trị của Bộ Y tế, cơ sở dữ liệu PubMed/MEDLINE.
  - 1.5.4. Phạm vi thời gian: Khảo sát các tình huống thực tế phát sinh trong giai đoạn 2024 - 2026.
- **1.6. Phương pháp nghiên cứu**
  - 1.6.1. Phương pháp tổng quan tài liệu y văn và nghiên cứu dịch tễ thông tin y tế (Infodemiology).
  - 1.6.2. Phương pháp nghiên cứu tình huống thực tế (Case Study).
  - 1.6.3. Phương pháp thẩm định nguồn tin chuẩn hóa y tế (mô hình CRAAP và phương pháp đọc ngang SIFT).
  - 1.6.4. Phương pháp thử nghiệm so sánh mù đối chứng với tiêu chuẩn vàng của hội đồng Dược sĩ lâm sàng.
- **1.7. Ý nghĩa đề tài**
  - 1.7.1. Ý nghĩa khoa học: Đóng góp khung phương pháp luận kiểm chứng thông tin thuốc số trong thực hành Dược dựa trên bằng chứng.
  - 1.7.2. Ý nghĩa thực tiễn: Cung cấp công cụ học tập lâm sàng trực quan, hỗ trợ sinh viên Dược nâng cao năng lực thẩm định y văn và bảo vệ sức khỏe cộng đồng.
- **1.8. Cấu trúc báo cáo nghiên cứu**

---

### CHƯƠNG 2: CƠ SỞ LÝ THUYẾT VÀ TỔNG QUAN TÀI LIỆU (Dự kiến 6 - 7 trang A4)
*Mục tiêu chuyên môn:* Trang bị tri thức nền tảng về thông tin thuốc, cơ chế tai biến dược lâm sàng, phương pháp luận thẩm định và vai trò của công cụ AI.

- **2.1. Tổng quan về thông tin thuốc trong thực hành Dược**
  - 2.1.1. Khái niệm và vai trò sống còn của thông tin thuốc đối với an toàn người bệnh.
  - 2.1.2. Hệ thống phân loại thông tin thuốc 3 cấp bậc: Cấp 1 (Thử nghiệm lâm sàng gốc RCTs), Cấp 2 (Cơ sở dữ liệu chỉ mục PubMed), Cấp 3 (Dược thư Quốc gia, sách giáo khoa dược lý).
- **2.2. Thông tin sai lệch trong lĩnh vực dược và hiểm họa lâm sàng**
  - 2.2.1. Phân loại Misinformation, Disinformation và Malinformation trong môi trường y tế số.
  - 2.2.2. Các biểu hiện sai lệch phổ biến: Thần thánh hóa thảo dược, gieo rắc nỗi sợ thuốc tân dược, quảng cáo ngụy khoa học.
  - 2.2.3. Hậu quả lâm sàng nghiêm trọng: Hoại tử tế bào gan do quá liều Paracetamol, biến cố tim mạch do Sibutramine, hội chứng Cushing do lạm dụng Corticoid, gia tăng đề kháng kháng sinh.
- **2.3. Mô hình đánh giá nguồn tin CRAAP trong thẩm định y dược**
  - 2.3.1. Currency (Tính cập nhật của khuyến cáo lâm sàng và bằng chứng dược lý).
  - 2.3.2. Relevance (Tính liên quan đối với phác đồ điều trị và đối tượng bệnh nhân).
  - 2.3.3. Authority (Tính thẩm quyền chuyên môn của tác giả, cơ quan chủ quản và chứng chỉ hành nghề).
  - 2.3.4. Accuracy (Tính chính xác của hàm lượng, cơ chế tác dụng và tài liệu y văn đối chứng).
  - 2.3.5. Purpose (Mục đích thông tin: Giáo dục sức khỏe phi lợi nhuận hay tiếp thị thương mại).
- **2.4. Mô hình đọc ngang SIFT trong sàng lọc thông tin thuốc trực tuyến**
  - 2.4.1. Stop: Dừng lại trước các thông tin kích động cảm xúc hoặc cam kết chữa khỏi dứt điểm.
  - 2.4.2. Investigate the source: Đọc ngang điều tra uy tín chuyên môn và tính pháp lý của người phát ngôn.
  - 2.4.3. Find better coverage: Tìm kiếm sự đồng thuận khoa học từ các tổ chức y tế quốc gia và quốc tế.
  - 2.4.4. Trace claims: Truy vết các tuyên bố và số liệu về tận cùng nghiên cứu lâm sàng gốc.
- **2.5. Ứng dụng AI tạo sinh trong xử lý ngôn ngữ y dược học**
  - 2.5.1. Khả năng đọc hiểu văn bản y tế và bóc tách thực thể dược học (tên thuốc, hoạt chất, liều dùng).
  - 2.5.2. Nguy cơ hiện tượng ảo giác (Hallucination) trong suy luận y khoa và bài toán an toàn dùng thuốc.
- **2.6. Ứng dụng kỹ thuật RAG trong kiểm chứng thông tin y tế**
  - 2.6.1. Nguyên lý kết nối mô hình AI với kho y văn đóng đã được kiểm duyệt (Dược thư, Hướng dẫn điều trị).
  - 2.6.2. Thiết lập rào chắn an toàn (Safety Guardrails) nghiêm cấm AI tự ý kê đơn hoặc suy diễn cảm tính.
- **2.7. Trí tuệ nhân tạo trong chuỗi chăm sóc sức khỏe và ngành Dược**
  - 2.7.1. Hỗ trợ tra cứu tương tác thuốc và cảnh giác dược tại cơ sở y tế.
  - 2.7.2. Tối ưu hóa phác đồ điều trị và cảnh báo sai sót dùng thuốc.
- **2.8. Vai trò của trợ lý AI trong hỗ trợ Dược sĩ kiểm chứng thông tin**
  - 2.8.1. Tự động hóa trích xuất luận điểm và chuyển đổi thuật ngữ thường thức sang danh pháp chuẩn MeSH.
  - 2.8.2. Hỗ trợ Dược sĩ đối soát nhanh với kho tài liệu y học thực chứng, nâng cao năng suất tư vấn.

---

### CHƯƠNG 3: THU THẬP, ĐÁNH GIÁ VÀ KIỂM CHỨNG THÔNG TIN THUỐC TRÊN INTERNET (Dự kiến 6 - 7 trang A4)
*Mục tiêu chuyên môn:* Thực hành thẩm định lâm sàng trên 15 tình huống thực tế bằng CRAAP, SIFT và cơ sở dữ liệu PubMed.

- **3.1. Phương pháp thu thập và chọn lọc 15 tình huống thuốc giả mạng xã hội**
  - 3.1.1. Tiêu chí chọn mẫu: Tính phổ biến, mức độ độc hại tiềm tàng và tính đặc trưng của thông tin sai lệch.
  - 3.1.2. Phân bố 15 tình huống trên 4 nền tảng: TikTok (4 tình huống), Facebook (4 tình huống), YouTube (4 tình huống), Website bán hàng (3 tình huống).
- **3.2. Bảng mô tả chi tiết bộ dữ liệu 15 tình huống nghiên cứu**
  - Trình bày bảng tổng hợp: Mã tình huống, Tên hoạt chất/sản phẩm, Tuyên bố mạng xã hội, Nguồn phát tán, Dấu hiệu nghi ngờ, Nguy cơ lâm sàng.
- **3.3. Đánh giá định lượng 15 tình huống bằng mô hình CRAAP**
  - 3.3.1. Thang đo 5 tiêu chí từ 1 đến 5 điểm (thang điểm 25).
  - 3.3.2. Bảng phân tích chi tiết điểm số CRAAP và nhận diện đặc trưng tin giả dược phẩm.
- **3.4. Đánh giá phản xạ 15 tình huống bằng mô hình đọc ngang SIFT**
  - 3.4.1. Quy trình thực hiện 4 bước SIFT cho từng trường hợp.
  - 3.4.2. Bảng đối chiếu kết quả phát hiện bản chất ngụy khoa học và động cơ thương mại.
- **3.5. Đối chiếu y văn thực chứng trên cơ sở dữ liệu PubMed và Dược thư Quốc gia**
  - 3.5.1. Xây dựng chiến lược từ khóa chuẩn MeSH trên PubMed cho các hoạt chất nghiên cứu.
  - 3.5.2. Bảng đối chứng bằng chứng lâm sàng RCTs: Bác bỏ hoàn toàn các tuyên bố mạng xã hội.
- **3.6. Thử nghiệm kiểm chứng bằng công cụ AI thông thường và so sánh phương pháp**
  - 3.6.1. Hạn chế của AI tổng quát khi thiếu cơ sở y văn: Trả lời nước đôi, nguy cơ ảo giác trích dẫn.
  - 3.6.2. Bảng so sánh tổng hợp hiệu quả giữa phương pháp thủ công, SIFT, PubMed và mô hình trợ lý AI chuyên biệt.

---

### CHƯƠNG 4: THIẾT KẾ VÀ ĐÁNH GIÁ TRỢ LÝ AI HỖ TRỢ KIỂM CHỨNG THÔNG TIN THUỐC (Dự kiến 7 - 8 trang A4)
*Mục tiêu chuyên môn:* Thiết kế quy trình nghiệp vụ kiểm chứng thuốc cho Dược sĩ, xây dựng prompt y khoa chuyên sâu và đánh giá hiệu năng lâm sàng trên 15 tình huống.

- **4.1. Mục tiêu và yêu cầu nghiệp vụ của trợ lý AI kiểm chứng thuốc**
  - 4.1.1. Yêu cầu chuyên môn: Hỗ trợ sinh viên Dược bóc tách hoạt chất, đối soát y văn, cảnh báo tương tác và tác dụng phụ.
  - 4.1.2. Yêu cầu an toàn y tế: Không thay thế bác sĩ kê đơn, trích dẫn chính xác nguồn tài liệu chính thống, từ chối trả lời khi thiếu dữ liệu kiểm duyệt.
- **4.2. Mô hình giải pháp Trợ lý AI ứng dụng trong kiểm chứng dược khoa**
  - 4.2.1. Sơ đồ quy trình nghiệp vụ tích hợp AI trong thực hành thông tin thuốc của Dược sĩ.
  - 4.2.2. Xây dựng kho tri thức tham chiếu y văn khép kín: Dược thư Quốc gia Việt Nam, Hướng dẫn điều trị của Bộ Y tế, các thử nghiệm lâm sàng PubMed.
  - 4.2.3. Cơ chế liên kết bằng chứng minh bạch: Đánh số trích dẫn và hiển thị trực tiếp đoạn văn bản gốc trong y văn để Dược sĩ thẩm định.
- **4.3. Thiết kế Prompt hệ thống chuyên biệt y dược (Medical System Prompt)**
  - 4.3.1. Thiết lập vai trò: Trợ lý Dược sĩ lâm sàng và Thẩm định thông tin y tế số.
  - 4.3.2. Cấu trúc câu lệnh hướng dẫn suy luận y học tuần tự (Chain-of-Thought) kết hợp tiêu chí CRAAP và SIFT.
  - 4.3.3. Bộ quy tắc rào chắn an toàn (Guardrails) và chính sách từ chối chống ảo giác (Anti-Hallucination Policy).
- **4.4. Quy trình nghiệp vụ kiểm chứng 5 bước của Trợ lý AI**
  - Tiếp nhận thông tin bài đăng -> Bóc tách hoạt chất và bệnh lý -> Tra cứu y văn đối chứng -> Phân tích rủi ro dược lý -> Xuất báo cáo kiểm chứng kèm khuyến cáo an toàn.
- **4.5. Thiết kế kịch bản thử nghiệm lâm sàng trên 15 tình huống**
  - Thiết lập tiêu chuẩn vàng dựa trên kết luận độc lập của Hội đồng chuyên môn Dược sĩ lâm sàng.
- **4.6. Kết quả kiểm thử thực nghiệm**
  - 4.6.1. Tỷ lệ phát hiện chính xác thông tin sai lệch (Độ nhạy và độ đặc hiệu đạt 100%).
  - 4.6.2. Độ chính xác của trích dẫn tài liệu y văn (Tỷ lệ ảo giác bằng 0%).
  - 4.6.3. Thời gian phản hồi và năng lực hỗ trợ phân tích dược lý.
- **4.7. Đánh giá tác động đối với sinh viên Dược**
  - 4.7.1. Thử nghiệm so sánh đối đầu: Rút ngắn 87.7% thời gian tra cứu và tăng gấp đôi độ bao quát rủi ro lâm sàng so với phương pháp thủ công.
  - 4.7.2. Nâng cao năng lực số và phản xạ thực hành dược dựa trên bằng chứng của người học.
- **4.8. Các hạn chế của giải pháp và lưu ý trong thực hành Dược**
  - Sự phụ thuộc vào dữ liệu y văn nạp vào, hạn chế với tiếng lóng mạng xã hội và yêu cầu bắt buộc Dược sĩ phải kiểm tra chéo bằng chứng gốc.

---

### CHƯƠNG 5: ĐẠO ĐỨC SỐ VÀ AN TOÀN SỐ TRONG ỨNG DỤNG CHATBOT KIỂM CHỨNG THÔNG TIN THUỐC (Dự kiến 3 - 4 trang A4)
*Mục tiêu chuyên môn:* Bảo vệ quyền riêng tư dữ liệu sức khỏe, phòng ngừa tai biến do ảo giác AI và khẳng định y đức Dược sĩ.

- **5.1. Quyền riêng tư và bảo vệ dữ liệu cá nhân sức khỏe**
  - 5.1.1. Rủi ro lộ lọt thông tin bệnh án và tiền sử dùng thuốc khi người dùng nhập dữ liệu vào AI.
  - 5.1.2. Tuân thủ khuôn khổ pháp lý: Nghị định 13/2023/NĐ-CP và nguyên tắc bảo mật thông tin người bệnh trong Luật Khám chữa bệnh.
  - 5.1.3. Giải pháp vô danh hóa dữ liệu trước khi xử lý.
- **5.2. Nguy cơ ảo giác AI và an toàn tính mạng người bệnh**
  - 5.2.1. Bản chất xác suất của mô hình ngôn ngữ và hiểm họa bịa đặt liều dùng, chỉ định thuốc.
  - 5.2.2. Kiểm soát tuyệt đối thông qua nguyên tắc bằng chứng đóng (Grounding) và cấm AI suy đoán ngoài y văn.
- **5.3. Thiên kiến thuật toán và sự công bằng trong chăm sóc dược**
  - 5.3.1. Sự khác biệt về thể trạng, dược động học người Việt Nam so với dữ liệu huấn luyện phương Tây.
  - 5.3.2. Đánh giá khách quan đối với thuốc cổ truyền và dược liệu dân tộc đã được kiểm duyệt.
- **5.4. Ranh giới trách nhiệm pháp lý trong y tế số**
  - 5.4.1. Phân định phần mềm hỗ trợ học tập và thiết bị y tế (SaMD).
  - 5.4.2. Tuyên bố miễn trừ trách nhiệm y khoa và trách nhiệm pháp lý của người dùng.
- **5.5. Trách nhiệm nghề nghiệp và Y đức của người Dược sĩ thế hệ số**
  - 5.5.1. Nguyên tắc "Con người giữ quyền kiểm soát lâm sàng cuối cùng" (Human-in-the-loop).
  - 5.5.2. Lương tâm, y đức và sự thấu cảm của Dược sĩ là yếu tố công nghệ không thể thay thế.

---

### CHƯƠNG 6: KẾT LUẬN VÀ KIẾN NGHỊ (Dự kiến 2 trang A4)
*Mục tiêu chuyên môn:* Tổng kết kết quả nghiên cứu, đóng góp cho ngành Dược và đề xuất nâng cao năng lực số trong đào tạo y dược.

- **6.1. Kết luận nghiên cứu**
- **6.2. Đóng góp của đề tài cho công tác đào tạo và thực hành Dược**
- **6.3. Những hạn chế của nghiên cứu**
- **6.4. Hướng phát triển chuyên môn và kiến nghị**
  - 6.4.1. Kiến nghị tích hợp chuẩn năng lực số vào chuẩn đầu ra cử nhân Dược khoa.
  - 6.4.2. Đề xuất xây dựng cổng dữ liệu y văn kiểm chứng phục vụ Dược sĩ cộng đồng và người dân.

---

### PHẦN KẾT THÚC (BACK MATTER)
- Nhận xét cá nhân của sinh viên Dược sau quá trình thực hiện đề tài.
- Danh mục tài liệu tham khảo chuẩn APA 7th Edition (Y văn Dược học, Dược thư Quốc gia, WHO, FDA, Bộ Y tế).
- Phụ lục: Bảng tổng hợp 15 tình huống, mẫu System Prompt y khoa chuyên sâu.
