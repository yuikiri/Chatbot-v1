# CHƯƠNG 1: MỞ ĐẦU

## 1.1. Bối cảnh nghiên cứu

Sự bùng nổ của kỷ nguyên số hóa đã làm thay đổi căn bản phương thức tiếp cận thông tin sức khỏe của xã hội. Trong lĩnh vực y dược, mạng Internet và các nền tảng mạng xã hội như TikTok, Facebook, YouTube cùng các trang thương mại điện tử đã trở thành kênh tra cứu y tế phổ biến của người dân. Người bệnh có xu hướng tự tìm kiếm triệu chứng, tự tra cứu công dụng dược phẩm và tự định hướng điều trị trước khi tham vấn nhân viên y tế. Thực tế này mang lại sự thuận tiện nhất định nhưng đồng thời làm nảy sinh những hiểm họa lâm sàng to lớn đối với an toàn dùng thuốc trong cộng đồng.

Khối lượng dữ liệu khổng lồ trên không gian số đi kèm với sự suy giảm nghiêm trọng về độ chuẩn xác của thông tin y tế. Hiện tượng "đại dịch thông tin" (infodemic) khiến các nội dung sai lệch, mẹo vặt ngụy khoa học và quảng cáo thổi phồng công dụng thuốc lan truyền nhanh chóng. Nhiều tổ chức và cá nhân kinh doanh không chính thống đã lợi dụng tâm lý lo âu bệnh tật của người dân để phát tán các bài thuốc dân gian chưa qua thử nghiệm lâm sàng, ngụy tạo danh xưng bác sĩ nhằm trục lợi thương mại. Điều này đặt người bệnh trước nguy cơ ngộ độc, xuất hiện biến cố bất lợi của thuốc (ADR), tương tác dược chất nguy hiểm và bỏ lỡ thời điểm vàng can thiệp y khoa.

Đối với sinh viên Dược học, bối cảnh thông tin số mở ra nguồn tài liệu phong phú nhưng đặt ra yêu cầu cấp bách về năng lực thẩm định chuyên môn. Sinh viên Dược là nhân lực y tế tương lai, giữ vai trò nòng cốt trong hướng dẫn sử dụng thuốc an toàn, hợp lý và tư vấn dược lâm sàng. Người học không chỉ cần nắm vững kiến thức dược lý trong giáo trình, mà còn phải sở hữu kỹ năng đánh giá phản biện, sàng lọc và kiểm chứng thông tin thuốc đa nguồn trên không gian mạng. Tuy nhiên, trước sự tinh vi của các thông tin sai lệch hiện nay, các phương pháp tra cứu thủ công đang bộc lộ nhiều hạn chế về thời gian và độ bao quát.

## 1.2. Lý do chọn đề tài

Ngành Dược đòi hỏi tính chuẩn xác tuyệt đối vì liên quan trực tiếp đến tính mạng con người. Mọi quyết định về chỉ định, liều lượng, chống chỉ định và tương tác thuốc đều phải dựa trên bằng chứng lâm sàng đã được kiểm định nghiêm ngặt bởi Bộ Y tế hoặc FDA. Việc tiếp nhận thông tin sai lệch dẫn tới hậu quả nghiêm trọng như ngộ độc dược chất, suy gan thận cấp, làm chậm trễ phác đồ điều trị và gia tăng đề kháng kháng sinh.

Chương trình đào tạo Dược khoa hiện nay chủ yếu tập trung vào lý thuyết, chưa có học phần chuyên sâu rèn luyện thẩm định nguồn tin số. Khi tiếp cận thông tin ngụy khoa học trên mạng xã hội, sinh viên Dược thường lúng túng trong việc nhận diện nguồn tin và thiếu công cụ đối soát nhanh với Dược thư Quốc gia Việt Nam hay PubMed. Khoảng trống này ảnh hưởng trực tiếp đến năng lực thực hành Dược dựa trên bằng chứng của sinh viên.

Sự phát triển của Trí tuệ nhân tạo (AI), đặc biệt là mô hình ngôn ngữ lớn kết hợp phương pháp đối chiếu y văn tham chiếu (RAG), mở ra cơ hội đột phá trong hỗ trợ thực hành thông tin thuốc. AI có khả năng đọc hiểu ngôn ngữ tự nhiên, nhanh chóng bóc tách hoạt chất và chỉ định y khoa cốt lõi để đối chiếu tự động với nguồn y văn chính thống. Khi được tích hợp các khung thẩm định chuẩn mực như mô hình CRAAP và phương pháp đọc ngang SIFT, trợ lý AI trở thành công cụ hỗ trợ đắc lực cho sinh viên Dược trong việc sàng lọc tài liệu và chấm điểm độ tin cậy của thông tin một cách khách quan. Đề tài "Thiết kế và đánh giá trợ lý AI hỗ trợ kiểm chứng thông tin thuốc trên Internet dành cho sinh viên Dược" được lựa chọn nghiên cứu nhằm giải quyết một vấn đề thực tiễn cấp bách của ngành Dược học.

## 1.3. Mục tiêu nghiên cứu

Mục tiêu tổng quát của nghiên cứu là ứng dụng công cụ trí tuệ nhân tạo để thiết kế, xây dựng và đánh giá thực nghiệm một giải pháp trợ lý chuyên biệt (Chatbot AI), hỗ trợ sinh viên Dược sàng lọc, phân tích phản biện và kiểm chứng độ xác thực của các thông tin thuốc trên Internet, góp phần nâng cao năng lực số và kỹ năng thực hành Dược dựa trên bằng chứng cho người học.

Nghiên cứu đặt ra bốn mục tiêu cụ thể: Thứ nhất, hệ thống hóa cơ sở lý thuyết về thông tin sai lệch trong lĩnh vực dược, chuẩn hóa quy trình thẩm định thông tin y tế dựa trên mô hình CRAAP, kỹ thuật đọc ngang SIFT và Khung năng lực số 6 bậc Việt Nam. Thứ hai, thu thập và xây dựng bộ dữ liệu thực nghiệm gồm 15 tình huống thông tin thuốc sai lệch điển hình trên TikTok, Facebook, YouTube và các trang web thương mại điện tử. Thứ ba, ứng dụng mô hình AI và kỹ nghệ prompt y khoa chuyên sâu để thiết lập kịch bản trợ lý kiểm chứng dược lâm sàng, kết nối trực tiếp với cơ sở tri thức y văn Dược thư Quốc gia Việt Nam và PubMed. Thứ tư, tiến hành kiểm thử thực nghiệm trên 15 tình huống, đo lường các chỉ số lâm sàng và đánh giá tác động của trợ lý AI đối với kỹ năng kiểm chứng của sinh viên Dược.

## 1.4. Đối tượng nghiên cứu

Đối tượng nghiên cứu của đề tài bao gồm ba thành phần tương hỗ trong khoa học giáo dục y dược. Về nội dung chuyên môn, đối tượng nghiên cứu là các luồng thông tin thuốc, thực phẩm chức năng và tuyên bố điều trị xuất hiện trên Internet có dấu hiệu sai lệch hoặc ngụy tạo bằng chứng khoa học. Về chủ thể ứng dụng, đối tượng nghiên cứu và thụ hưởng trực tiếp là sinh viên Dược học bậc đại học, nhóm nhân lực y tế đang trong quá trình hoàn thiện năng lực thẩm định thông tin thuốc. Về công cụ phương pháp, đối tượng nghiên cứu là việc ứng dụng mô hình ngôn ngữ lớn (LLM), kỹ nghệ xây dựng prompt y khoa chuyên sâu và cơ chế đối soát tài liệu y văn tham chiếu phục vụ quá trình hỗ trợ Dược sĩ ra quyết định.

## 1.5. Phạm vi nghiên cứu

Phạm vi nghiên cứu được xác lập rõ ràng trên các khía cạnh nội dung, không gian nền tảng, tài liệu y văn và thời gian thực hiện. Về nội dung chuyên môn, đề tài tập trung vào việc nhận diện và kiểm chứng các tuyên bố về công dụng, thành phần, liều lượng, tương tác thuốc và tính an toàn của các loại dược phẩm không kê đơn (OTC), thuốc kê đơn (ETC) bị lạm dụng thông tin và thực phẩm bảo vệ sức khỏe bị thần thánh hóa trên mạng xã hội. Đề tài không đi vào chẩn đoán bệnh học hay thay thế chỉ định của bác sĩ điều trị.

Về nền tảng khảo sát, nghiên cứu giới hạn trên bốn kênh mạng xã hội và thương mại điện tử phổ biến tại Việt Nam gồm TikTok, Facebook, YouTube và các trang web bán lẻ trực tuyến. Về nguồn tài liệu y văn đối chứng, nghiên cứu giới hạn trong các nguồn dữ liệu y học thực chứng chính thống gồm Dược thư Quốc gia Việt Nam bản cập nhật, Hướng dẫn điều trị của Bộ Y tế, cơ sở dữ liệu PubMed/MEDLINE. Về thời gian, các tình huống nghiên cứu thực tế được thu thập trong giai đoạn từ năm 2024 đến năm 2026.

## 1.6. Phương pháp nghiên cứu

Nghiên cứu áp dụng phối hợp các phương pháp nghiên cứu liên ngành trong Khoa học Dược và Giáo dục Y tế. Phương pháp phân tích và tổng quan tài liệu y văn được sử dụng để tổng hợp lý luận về đại dịch thông tin y tế, Khung năng lực số 6 bậc Việt Nam, cùng mô hình CRAAP của Sarah Blakeslee và phương pháp đọc ngang SIFT của Mike Caulfield.

Phương pháp nghiên cứu tình huống thực tế (Case Study) được triển khai thông qua việc thu thập có chọn lọc 15 tình huống thông tin thuốc sai lệch trên mạng xã hội, phân tích bối cảnh phát tán, dấu hiệu nghi ngờ và nguy cơ lâm sàng tiềm ẩn đối với sức khỏe cộng đồng. Phương pháp ứng dụng công cụ AI và kỹ nghệ prompt y khoa được áp dụng để xây dựng kịch bản câu lệnh hệ thống chuyên sâu, định hình vai trò Dược sĩ lâm sàng thẩm định, nạp cơ sở tri thức y văn Dược thư Quốc gia và thiết lập rào chắn an toàn cấm tự ý kê đơn. Phương pháp thử nghiệm kiểm chứng và đánh giá định lượng được áp dụng để đo lường độ chính xác, độ nhạy phát hiện tin sai lệch và tỷ lệ trích dẫn y văn của trợ lý AI trên 15 tình huống, so sánh với kết luận thẩm định độc lập của Hội đồng chuyên gia Dược sĩ lâm sàng.

## 1.7. Ý nghĩa đề tài

Về mặt khoa học, đề tài tiên phong thiết lập mô hình tích hợp liên ngành giữa khoa học thông tin (CRAAP, SIFT) với ứng dụng trí tuệ nhân tạo trong kiểm chứng thông tin thuốc tại Việt Nam. Nghiên cứu cung cấp khung phương pháp luận có cấu trúc chặt chẽ, góp phần làm phong phú thêm lý thuyết về thực hành Dược dựa trên bằng chứng và phòng chống tin giả y tế.

Về mặt thực tiễn, đề tài cung cấp một công cụ hỗ trợ trực quan, giúp sinh viên Dược rèn luyện kỹ năng thẩm định y văn, rút ngắn đáng kể thời gian tra cứu và hình thành phản xạ đọc ngang phản biện trước mọi thông tin y tế trên không gian mạng. Sản phẩm nghiên cứu còn là tài liệu tham khảo giá trị cho giảng viên trong việc đổi mới phương pháp giảng dạy học phần Năng lực số và Dược lâm sàng, góp phần nâng cao chất lượng đào tạo nhân lực y tế đáp ứng yêu cầu chuyển đổi số quốc gia.

## 1.8. Cấu trúc báo cáo

Báo cáo nghiên cứu được bố cục thành 6 chương logic theo quy chuẩn học thuật đại học Việt Nam. Chương 1 giới thiệu bối cảnh nghiên cứu, tính cấp thiết của đề tài, xác định mục tiêu, đối tượng, phạm vi, phương pháp nghiên cứu, ý nghĩa khoa học và giá trị thực tiễn. Chương 2 trình bày cơ sở lý thuyết về thông tin thuốc, bản chất tin sai lệch y tế và hậu quả lâm sàng, phân tích hai mô hình CRAAP và SIFT, cùng tổng quan về ứng dụng công cụ AI tạo sinh và phương pháp đối chiếu y văn RAG. Chương 3 trình bày chi tiết quy trình thu thập và phân tích bộ dữ liệu 15 tình huống thực tế, tiến hành đánh giá thực chứng chuyên sâu thông qua hai bảng ma trận tiêu chuẩn CRAAP và SIFT, đối chiếu với cơ sở dữ liệu PubMed và Dược thư Quốc gia.

Chương 4 là chương trọng tâm ứng dụng, mô tả quy trình thiết kế kịch bản nghiệp vụ kiểm chứng thuốc cho Dược sĩ, kỹ nghệ xây dựng prompt y khoa chuyên sâu, quy trình vận hành và kết quả kiểm thử thực nghiệm trên 15 tình huống, đi kèm đánh giá so sánh hiệu năng với phương pháp tra cứu thủ công. Chương 5 bàn luận sâu sắc về các vấn đề đạo đức số và an toàn số trong y tế, bảo vệ quyền riêng tư dữ liệu sức khỏe, rủi ro ảo giác AI, ranh giới pháp lý và khẳng định vai trò kiểm soát chuyên môn không thể thay thế của người Dược sĩ. Chương 6 tổng kết các kết quả nghiên cứu, nêu bật đóng góp của đề tài, phân tích hạn chế và kiến nghị phát triển. Phần kết thúc gồm nhận xét cá nhân của sinh viên Dược và danh mục tài liệu tham khảo chuẩn APA 7th Edition.
