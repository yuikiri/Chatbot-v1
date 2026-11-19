# CHƯƠNG 6: KẾT LUẬN VÀ KIẾN NGHỊ

## 6.1. Kết luận nghiên cứu

Đề tài nghiên cứu "Thiết kế và đánh giá trợ lý AI hỗ trợ kiểm chứng thông tin thuốc trên Internet dành cho sinh viên Dược" đã hoàn thành toàn diện các mục tiêu đặt ra, giải quyết vấn đề thực tiễn cấp bách trong bối cảnh bùng nổ thông tin số và tin giả y tế hiện nay.

Về mặt lý luận, nghiên cứu đã hệ thống hóa cơ sở khoa học về các dạng thức tin sai lệch trong y dược (Misinformation, Disinformation, Malinformation), phân tích cơ chế lan truyền tin giả trên mạng xã hội, và xây dựng thành công khung phương pháp luận kết hợp giữa mô hình CRAAP và kỹ thuật đọc ngang SIFT, bám sát các tiêu chuẩn của Khung năng lực số 6 bậc Việt Nam.

Về mặt thực nghiệm, đề tài đã thu thập và chuẩn hóa bộ dữ liệu gồm 15 tình huống thông tin thuốc sai lệch điển hình trên TikTok, Facebook, YouTube và các trang web thương mại điện tử. Quá trình đối soát thực chứng với cơ sở dữ liệu PubMed và Dược thư Quốc gia Việt Nam đã chứng minh tính phản khoa học và nguy cơ lâm sàng nghiêm trọng trong 100% các tình huống khảo sát.

Về mặt ứng dụng giải pháp, nghiên cứu đã xây dựng và thử nghiệm thành công giải pháp Trợ lý AI chuyên biệt *PharmVerif-AI* vận hành trên cơ chế tham chiếu y văn khép kín kết hợp kịch bản prompt y khoa có rào chắn an toàn y tế nghiêm ngặt. Kết quả kiểm thử thực nghiệm trên 15 tình huống cho thấy hệ thống đạt độ nhạy và độ chính xác phân loại tuyệt đối (100%), trích dẫn y văn chính xác 100% với thời gian phản hồi trung bình chỉ 3.36 giây, không xuất hiện hiện tượng ảo giác trích dẫn. Thử nghiệm trên sinh viên Dược khẳng định hệ thống giúp rút ngắn 87.7% thời gian tra cứu và nâng cao rõ rệt tư duy phản biện dược khoa.

## 6.2. Đóng góp của đề tài

Công trình nghiên cứu mang lại những đóng góp quan trọng trên cả phương diện học thuật lý thuyết lẫn giá trị ứng dụng thực tiễn:

Thứ nhất, đóng góp về phương pháp luận: Đề tài tiên phong tại Việt Nam tích hợp thành công hai mô hình kiểm chứng nguồn tin kinh điển (CRAAP và SIFT) vào kỹ nghệ trí tuệ nhân tạo phục vụ đào tạo Dược học, chuẩn hóa quy trình rèn luyện tư duy phản biện thông tin cho sinh viên y dược.

Thứ hai, đóng góp về công cụ thực hành: Đề tài cung cấp giải pháp trợ lý ảo trực quan, ứng dụng trực tiếp làm công cụ hỗ trợ học tập cho học phần Năng lực số, Dược lâm sàng và Thông tin thuốc tại các trường đại học y dược. Bộ dữ liệu 15 tình huống thực tế cùng các bảng đối chiếu CRAAP và SIFT chi tiết trở thành tài liệu tham khảo giảng dạy sinh động.

Thứ ba, đóng góp về đạo đức y tế số: Báo cáo nghiên cứu làm sáng tỏ các ranh giới đạo đức, quyền riêng tư dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP và trách nhiệm pháp lý khi áp dụng AI trong y tế. Công trình góp phần định hình nhận thức chuẩn mực cho thế hệ Dược sĩ tương lai: làm chủ công nghệ trí tuệ nhân tạo nhưng kiên định giữ vững nguyên tắc con người nắm quyền kiểm soát lâm sàng và y đức người thầy thuốc.

## 6.3. Hạn chế của nghiên cứu

Mặc dù đạt được những kết quả khả quan, đề tài vẫn còn những hạn chế nhất định do giới hạn về nguồn lực và thời gian:
- Quy mô mẫu kiểm thử thực nghiệm mới dừng lại ở 15 tình huống đại diện, chưa bao phủ hết toàn bộ các nhóm bệnh lý phức tạp hoặc các biệt dược chuyên khoa sâu.
- Giải pháp hiện tại chủ yếu tiếp nhận dữ liệu đầu vào dạng văn bản, chưa tích hợp tính năng tự động nhận diện giọng nói và hình ảnh nhãn thuốc trực tiếp từ video ngắn.
- Dung lượng kho tri thức y văn cục bộ hiện mới tập trung vào Dược thư Quốc gia và các nghiên cứu RCTs phổ biến, cần tiếp tục cập nhật để theo kịp tốc độ lưu hành của các biệt dược mới.

## 6.4. Hướng phát triển và kiến nghị

Xuất phát từ kết quả nghiên cứu, nhóm tác giả đề xuất các định hướng chuyên môn và kiến nghị cụ thể:

### 6.4.1. Hướng phát triển chuyên môn
- Mở rộng năng lực nhận diện đa dạng dữ liệu, tích hợp công nghệ nhận dạng giọng nói và quét nhãn thuốc quang học để kiểm chứng thông tin trực tiếp từ video và hình ảnh toa thuốc.
- Mở rộng kho tri thức số bằng cách kết nối trực tiếp với Cơ sở dữ liệu Dược Quốc gia của Cục Quản lý Dược (Bộ Y tế) để cập nhật thông tin giấy phép và cảnh giác dược hàng ngày.
- Hoàn thiện ứng dụng thân thiện trên thiết bị di động, mở rộng phạm vi hỗ trợ từ sinh viên Dược sang mạng lưới Dược sĩ nhà thuốc cộng đồng và người dân.

### 6.4.2. Kiến nghị đối với cơ sở đào tạo Y Dược
- Khẩn trương đưa nội dung Năng lực số y tế và phương pháp kiểm chứng thông tin số (CRAAP, SIFT) vào chương trình đào tạo chính khóa, coi đây là chuẩn đầu ra bắt buộc của cử nhân Dược.
- Khuyến khích ứng dụng có kiểm soát các công cụ AI chuyên ngành vào học tập và nghiên cứu, đồng thời trang bị kiến thức vững vàng về bảo mật dữ liệu bệnh nhân và phòng tránh ảo giác AI.

### 6.4.3. Kiến nghị đối với cơ quan quản lý y tế
- Tăng cường cơ chế thanh tra, xử phạt nghiêm khắc các hành vi quảng cáo thuốc giả mạo, thổi phồng công dụng trên các nền tảng mạng xã hội.
- Xây dựng cổng thông tin kiểm chứng y tế số chính thống do nhà nước quản lý, tạo địa chỉ tin cậy giúp người dân và nhân viên y tế đối soát thông tin nhanh chóng trước vấn nạn tin giả y tế.
