# CHƯƠNG 5
# ĐẠO ĐỨC SỐ VÀ AN TOÀN SỐ

## 5.1. Dữ liệu cá nhân và quyền riêng tư trong ứng dụng y tế

Trong kỷ nguyên y tế số, dữ liệu sức khỏe của người mẹ và trẻ sơ sinh được xếp vào nhóm dữ liệu nhạy cảm bậc nhất (Special Category Personal Data), đòi hỏi sự bảo vệ nghiêm ngặt về mặt kỹ thuật lẫn đạo đức pháp lý. Khi tương tác với chatbot AI để tra cứu an toàn thuốc, người mẹ có xu hướng chia sẻ các thông tin riêng tư như ngày sinh con, tình trạng bệnh hậu sản, các bệnh phụ khoa, tiền sử trầm cảm hoặc các loại thuốc đang sử dụng. Hành vi này làm phát sinh nguy cơ rò rỉ dữ liệu cá nhân nếu hệ thống không được bảo mật theo nguyên tắc "Bảo vệ quyền riêng tư ngay từ khâu thiết kế" (Privacy by Design).

Về mặt pháp lý tại Việt Nam, Nghị định số 13/2023/NĐ-CP của Chính phủ về bảo vệ dữ liệu cá nhân quy định rõ dữ liệu về tình trạng sức khỏe và đời tư là dữ liệu cá nhân nhạy cảm. Tổ chức hoặc cá nhân xử lý dữ liệu phải có sự đồng ý của chủ thể, phải áp dụng các biện pháp an ninh nhằm ngăn ngừa hành vi lộ lọt, mua bán hoặc sử dụng trái phép dữ liệu.

Đối với hệ thống LactaMed AI, giải pháp tuân thủ nghiêm ngặt ba nguyên tắc bảo vệ quyền riêng tư người bệnh:
- Thứ nhất, nguyên tắc vô danh hóa thông tin y tế (De-identification): Trước khi đưa câu hỏi vào phân tích, mọi thông tin định danh cá nhân của người mẹ và bé như họ tên, số điện thoại, địa chỉ hoặc mã hồ sơ sinh đều phải được loại bỏ hoàn toàn.
- Thứ hai, nguyên tắc không lưu vết và không tái sử dụng dữ liệu bệnh án: Dữ liệu đơn thuốc và câu hỏi của người dùng không được phép lưu trữ làm dữ liệu huấn luyện mở, ngăn ngừa nguy cơ tiết lộ thông tin bệnh tật của cá nhân cho bên thứ ba.
- Thứ ba, tuân thủ đạo đức bảo mật thông tin y khoa: Hệ thống bảo đảm tính toàn vẹn của dữ liệu sức khỏe theo Luật Khám bệnh, chữa bệnh và Nghị định 13/2023/NĐ-CP.

## 5.2. Tính chính xác, sai lệch AI và hiện tượng bịa nguồn (Hallucination)

Ảo giác (Hallucination) là hiện tượng mô hình ngôn ngữ lớn tạo ra các khẳng định hoặc trích dẫn nghe rất hợp lý, chuẩn mực về mặt ngữ pháp nhưng hoàn toàn sai sự thật, không có thực và không được hỗ trợ bởi bất kỳ tài liệu y văn nào. Trong lĩnh vực y dược học - nơi mỗi hoạt chất dùng cho người mẹ đều có thể đi qua sữa và ảnh hưởng đến não bộ, gan thận non nớt của trẻ - ảo giác của AI là một mối đe dọa trực tiếp đối với tính mạng con người.

Để triệt tiêu nguy cơ ảo giác trong tư vấn thuốc cho con bú, LactaMed AI áp dụng cơ chế tham chiếu y văn khép kín (RAG Grounding) kết hợp với Chính sách từ chối nghiêm ngặt (Strict Refusal Policy). Mô hình AI bị tước bỏ quyền tự do sáng tạo nội dung y khoa; mọi câu trả lời bắt buộc phải được buộc chặt vào dữ liệu LactMed và Dược thư Quốc gia. Nếu một loại thuốc chưa có dữ liệu nghiên cứu đầy đủ, hệ thống bắt buộc phải kích hoạt quy tắc từ chối an toàn và hướng dẫn người mẹ tham vấn bác sĩ, kiên quyết không cho phép mô hình suy đoán ngoài ngữ cảnh.

## 5.3. Rủi ro đạo đức khi truyền thông về thuốc cho phụ nữ cho con bú

Trong thời đại mạng xã hội thuật toán, ranh giới giữa việc truyền thông giáo dục sức khỏe và hành vi tiếp thị trục lợi thương mại trở nên vô cùng mong manh. Rất nhiều nội dung y tế được dàn dựng khéo léo dưới danh nghĩa chia sẻ kinh nghiệm nuôi con nhưng thực chất là các chiến dịch quảng cáo ngầm nhằm bán trà lợi sữa, cao thảo mộc hoặc viên giảm cân sau sinh không rõ nguồn gốc.

Rủi ro đạo đức lớn nhất là việc gieo rắc nỗi sợ hãi phi lý đối với y học hiện đại (Fear-mongering). Những người làm tin giả thường xuyên rêu rao rằng "uống thuốc tây làm sữa mẹ thành thuốc độc", khiến người mẹ hoảng loạn tự ý chịu đau đớn không dám dùng thuốc, hoặc vội vã cai sữa sớm cho con. Ngược lại, việc tâng bốc thảo dược tự nhiên vô hại làm nhiều mẹ bỉm sữa dùng các chế phẩm chứa hoạt chất cấm, khiến trẻ bú mẹ bị ngộ độc nguy hiểm.

Dược sĩ và người làm truyền thông y tế số phải luôn giữ vững chuẩn mực y đức: không tham gia quảng cáo phóng đại thực phẩm chức năng thành thần dược, bảo vệ quyền được bú sữa mẹ tự nhiên của trẻ và kiên quyết lên tiếng phản bác các thông tin sai lệch trên không gian mạng.

## 5.4. Trách nhiệm pháp lý, chuyên môn và quản trị rủi ro

Sự trỗi dậy của các ứng dụng trí tuệ nhân tạo trong y tế đặt ra những thách thức pháp lý về trách nhiệm bồi thường thiệt hại và tư cách pháp nhân của các phần mềm thông minh.

Xét dưới góc độ pháp luật y tế (Nghị định 98/2021/NĐ-CP), các phần mềm y tế được phân định thành: Phần mềm hỗ trợ thông tin / giáo dục sức khỏe và Phần mềm giữ vai trò thiết bị y tế (Software as a Medical Device - SaMD). Các hệ thống trực tiếp chẩn đoán hoặc kê đơn bắt buộc phải trải qua thử nghiệm lâm sàng và được Bộ Y tế cấp phép dưới dạng thiết bị y tế loại C hoặc D.

Hệ thống LactaMed AI được định vị rõ ràng về mặt pháp lý là một **công cụ phần mềm hỗ trợ học tập, nghiên cứu và giáo dục năng lực số cho sinh viên Dược và phụ nữ cho con bú**, hoàn toàn không phải là một thiết bị y tế chẩn đoán hay kê đơn điều trị. Để tuân thủ pháp luật, hệ thống triển khai cơ chế Miễn trừ trách nhiệm y khoa bắt buộc (Mandatory Medical Disclaimer). Mỗi phản hồi đều khẳng định thông tin chỉ mang tính chất tham khảo y văn, không có giá trị thay thế cho y lệnh lâm sàng của bác sĩ chuyên khoa.

## 5.5. Năng lực số của người dùng và vai trò nhân viên y tế

Dù công nghệ trí tuệ nhân tạo có phát triển mạnh mẽ đến đâu, nguyên tắc đạo đức y khoa tối thượng bất biến luôn là: "Trước hết, không làm điều gì có hại cho người bệnh" (Primum non nocere). Trong bối cảnh số hóa, nguyên tắc này được cụ thể hóa thông qua triết lý "Con người giữ quyền kiểm soát cuối cùng" (Human-in-the-loop).

Trợ lý AI, dù sở hữu năng lực xử lý dữ liệu và truy xuất y văn vượt trội, vẫn chỉ là một cỗ máy tính toán xác suất. AI hoàn toàn thiếu vắng trí tuệ cảm xúc, không có khả năng thấu cảm trước nỗi đau của người mẹ hay sự nhạy cảm của trẻ sơ sinh. Chỉ có người Bác sĩ và Dược sĩ bằng xương bằng thịt, với chứng chỉ hành nghề và y đức được rèn luyện, mới có tư cách pháp lý và lương tâm để đưa ra các quyết định điều trị cuối cùng.

Sinh viên Dược phải coi AI là người trợ lý cần mẫn hỗ trợ đắc lực cho công việc, nhưng ngọn hải đăng soi sáng con đường hành nghề y dược vẫn mãi mãi là y đức và tinh thần trách nhiệm với tính mạng của người bệnh.

## 5.6. Đề xuất quy tắc ứng xử số và an toàn vận hành

Bảng 5.1 tổng hợp bảng kiểm tra an toàn và đạo đức số được đề xuất áp dụng cho các ứng dụng trí tuệ nhân tạo trong lĩnh vực tư vấn thuốc cho phụ nữ cho con bú.

### Bảng 5.1. Bảng kiểm tra an toàn và đạo đức số cho ứng dụng thông tin y dược

| Tiêu chí đạo đức & an toàn | Câu hỏi kiểm tra chuyên môn | Yêu cầu đạt chuẩn bắt buộc |
| :--- | :--- | :--- |
| **1. Bảo vệ dữ liệu cá nhân** | Hệ thống có tự động lọc bỏ họ tên, số điện thoại, ngày sinh của mẹ và bé trước khi gửi tới mô hình AI không? | Bắt buộc vô danh hóa 100% dữ liệu nhạy cảm theo Nghị định 13/2023/NĐ-CP. |
| **2. Kiểm soát ảo giác thông tin** | Hệ thống có cơ chế kiểm tra chéo nguồn y văn đối chứng và từ chối trả lời khi không có dữ liệu LactMed không? | Tỷ lệ trích dẫn ảo giác bằng 0%; từ chối an toàn khi thiếu dữ liệu kiểm duyệt. |
| **3. Minh bạch ranh giới pháp lý** | Hệ thống có hiển thị thông báo miễn trừ trách nhiệm y khoa rõ ràng ở đầu và cuối phiên đàm thoại không? | Bắt buộc hiển thị khuyến cáo không thay thế chỉ định của bác sĩ điều trị. |
| **4. Phòng ngừa kê đơn tự do** | Hệ thống có từ chối thẳng thắn các câu hỏi yêu cầu kê đơn thuốc mới hoặc tự ý thay đổi liều phác đồ không? | Tuyệt đối không đưa ra đơn thuốc điều trị; hướng dẫn người mẹ đi khám bác sĩ. |
| **5. Nhận diện tình huống cấp cứu** | Hệ thống có ưu tiên kích hoạt cảnh báo cấp cứu 115 khi phát hiện dấu hiệu ngộ độc, khó thở ở trẻ bú mẹ không? | Bắt buộc phân luồng ưu tiên nhận diện cấp cứu sốc phản vệ và suy hô hấp. |
| **6. Quyền kiểm soát của con người** | Người Dược sĩ và người mẹ có thể dễ dàng kiểm tra đoạn văn bản y văn gốc được dùng làm căn cứ kết luận không? | Cung cấp liên kết bằng chứng trực tiếp đến Dược thư QG và LactMed NIH. |
