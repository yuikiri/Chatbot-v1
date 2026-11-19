# BỘ GIÁO DỤC VÀ ĐÀO TẠO
# BÁO CÁO HỌC PHẦN NĂNG LỰC SỐ

## CHATBOT AI TƯ VẤN SỬ DỤNG
## THUỐC CHO PHỤ NỮ CHO CON BÚ
### Nghiên cứu trường hợp LactaMed AI và xây dựng hệ thống tra cứu an toàn sữa mẹ theo chuẩn LactMed NIH

           Sinh viên thực hiện: HUỲNH TẤN LỘC  
           Mã số sinh viên: 2313030143  
           Lớp / Nhóm: KD23QĐV-DH2  
           Giảng viên hướng dẫn: MAI THANH TÂM  

Thành phố Hồ Chí Minh, tháng 11 năm 2026  

---

## TÓM TẮT

Báo cáo nghiên cứu khả năng ứng dụng trí tuệ nhân tạo (Chatbot AI) để hỗ trợ tư vấn an toàn sử dụng thuốc cho phụ nữ đang nuôi con bằng sữa mẹ, tập trung vào tính chuẩn xác của dữ liệu y văn, nồng độ bài tiết của dược chất vào sữa mẹ, liều tương đối của trẻ bú mẹ (Relative Infant Dose - RID), tỷ lệ nồng độ thuốc trong sữa so với huyết tương mẹ (L/P ratio), và ranh giới giữa hỗ trợ giáo dục sức khỏe số với quyết định điều trị lâm sàng. Trường hợp khảo sát là mô hình trợ lý LactaMed AI, nơi giới thiệu công cụ tra cứu mức độ an toàn theo bốn cấp bậc y văn, bóc tách hoạt chất, cảnh báo chống chỉ định thời kỳ cho con bú, hướng dẫn thời điểm uống thuốc sau cữ bú và theo dõi các triệu chứng bất lợi ở trẻ.

Phương pháp nghiên cứu gồm tổng quan tài liệu y văn từ Thư viện Dược lý Lâm sàng Hoa Kỳ (LactMed® NIH), Hiệp hội Quốc tế APILAM (e-lactancia), Viện Hàn lâm Nhi khoa Hoa Kỳ (AAP), Tổ chức Y tế Thế giới (WHO), Cục Quản lý Thực phẩm và Dược phẩm Hoa Kỳ (FDA) và Dược thư Quốc gia Việt Nam; xây dựng 15 tình huống lâm sàng mô phỏng các vấn đề sử dụng thuốc phổ biến nhất ở phụ nữ cho con bú (hạ sốt, giảm đau, kháng sinh, dị ứng, cảm cúm, kích sữa, ngừa thai sau sinh, nấm phụ khoa, nứt cổ gà...); phân tích dược động học bài tiết (RID, L/P ratio); đối chiếu chức năng của LactaMed AI với kiến trúc chatbot an toàn; đề xuất prompt y khoa tham chiếu, bộ kiểm thử 15 tình huống và phiếu chấm chất lượng tư vấn y tế.

Kết quả nghiên cứu cho thấy cần tách biệt cơ sở tri thức y văn đã được kiểm duyệt (LactMed, Dược thư QG) khỏi năng lực tạo sinh ngôn ngữ của AI; ưu tiên nhận diện chống chỉ định tuyệt đối (Aspirin liều cao gây hội chứng Reye, Estrogen gây tiêu sữa, Corticoid nuốt phải gây suy thượng thận); nghiêm cấm sử dụng câu trả lời của chatbot làm căn cứ tự ý ngưng thuốc kê đơn hoặc cai sữa sớm; dẫn nguồn khớp từng khẳng định lâm sàng; công khai cảnh báo khi y văn thiếu dữ liệu; và bảo vệ dữ liệu sức khỏe cá nhân theo Nghị định 13/2023/NĐ-CP. Báo cáo kết luận Chatbot AI có tiềm năng to lớn hỗ trợ người mẹ an tâm duy trì nguồn sữa mẹ quý giá và giúp sinh viên Dược nâng cao năng lực tư vấn dược lâm sàng, nhưng chỉ có thể phát huy giá trị an toàn dưới sự giám sát và thẩm định chuyên môn của nhân viên y tế có chứng chỉ hành nghề.

**Từ khóa:** Chatbot AI; tư vấn sử dụng thuốc; phụ nữ cho con bú; an toàn sữa mẹ; LactaMed AI; LactMed® NIH; RID; L/P ratio; APILAM; Dược thư Quốc gia; an toàn số.

---

## DANH MỤC CHỮ VIẾT TẮT

| Ký hiệu | Giải thích đầy đủ |
| :--- | :--- |
| **AAP** | American Academy of Pediatrics (Viện Hàn lâm Nhi khoa Hoa Kỳ) |
| **ADR** | Adverse Drug Reaction (Phản ứng có hại của thuốc / Biến cố bất lợi) |
| **AI** | Artificial Intelligence (Trí tuệ nhân tạo) |
| **APILAM** | Association for Promotion of and Research into Breastfeeding (Hiệp hội APILAM / e-lactancia) |
| **BYT** | Bộ Y tế Việt Nam |
| **CDSS** | Clinical Decision Support System (Hệ thống hỗ trợ ra quyết định lâm sàng) |
| **CRAAP** | Currency, Relevance, Authority, Accuracy, Purpose (Mô hình đánh giá nguồn tin) |
| **DSR** | Design Science Research (Phương pháp nghiên cứu thiết kế khoa học) |
| **Dược thư QG** | Dược thư Quốc gia Việt Nam |
| **FDA** | Food and Drug Administration (Cơ quan Quản lý Thực phẩm và Dược phẩm Hoa Kỳ) |
| **L/P ratio** | Milk-to-Plasma ratio (Tỷ lệ nồng độ thuốc trong sữa / huyết tương mẹ) |
| **LactMed** | Drugs and Lactation Database (Cơ sở dữ liệu Thuốc và Cho con bú - NIH Hoa Kỳ) |
| **LLM** | Large Language Model (Mô hình ngôn ngữ lớn) |
| **MeSH** | Medical Subject Headings (Tiêu đề đề mục y học chuẩn quốc tế) |
| **NER** | Named Entity Recognition (Nhận diện thực thể định danh y dược) |
| **OTC** | Over The Counter (Thuốc không kê đơn) |
| **RAG** | Retrieval-Augmented Generation (Tăng cường truy xuất dữ liệu tham chiếu) |
| **RCT** | Randomized Controlled Trial (Thử nghiệm lâm sàng ngẫu nhiên có đối chứng) |
| **RID** | Relative Infant Dose (Liều tương đối của trẻ bú mẹ so với liều mẹ) |
| **SaMD** | Software as a Medical Device (Phần mềm giữ vai trò thiết bị y tế) |
| **SIFT** | Stop, Investigate the source, Find better coverage, Trace claims (Phương pháp đọc ngang) |
| **WHO** | World Health Organization (Tổ chức Y tế Thế giới) |

---

## MỤC LỤC

MỤC LỤC	i  
DANH MỤC BẢNG	iii  
CHƯƠNG 1 TỔNG QUAN VỀ ĐỀ TÀI NGHIÊN CỨU	1  
1.1. Bối cảnh nghiên cứu và nhu cầu dùng thuốc ở phụ nữ cho con bú	1  
1.2. Lý do chọn đề tài và vấn đề nghiên cứu	1  
1.3. Mục tiêu nghiên cứu	2  
1.4. Đối tượng nghiên cứu	3  
1.5. Phạm vi nghiên cứu	3  
1.6. Phương pháp nghiên cứu	4  
1.7. Ý nghĩa khoa học và thực tiễn	5  
1.8. Cấu trúc báo cáo	6  
CHƯƠNG 2 CƠ SỞ LÝ THUYẾT VỀ SỬ DỤNG THUỐC KHI CHO CON BÚ VÀ TRÍ TUỆ NHÂN TẠO	7  
2.1. Dược động học của thuốc qua sữa mẹ và các chỉ số an toàn	7  
2.2. Phân loại mức độ an toàn thuốc ở phụ nữ cho con bú theo chuẩn quốc tế	8  
2.3. Thực trạng khó khăn và rào cản trong tư vấn thuốc cho phụ nữ cho con bú	9  
2.4. Trí tuệ nhân tạo tạo sinh và mô hình ngôn ngữ lớn trong y tế	10  
2.5. Chatbot AI và kỹ thuật tăng cường truy xuất thông tin (RAG)	10  
2.6. Nguyên tắc thiết kế rào chắn an toàn (Safety Guardrails) trong tư vấn dược khoa	11  
2.7. Ứng dụng của AI trong thực hành Dược lâm sàng và thông tin thuốc	12  
2.8. Vai trò của Chatbot AI trong tư vấn sử dụng thuốc cho phụ nữ cho con bú	12  
CHƯƠNG 3 KHẢO SÁT NHU CẦU VÀ XÂY DỰNG BỘ KỊCH BẢN TƯ VẤN THUỐC CHO PHỤ NỮ CHO CON BÚ	13  
3.1. Phương pháp khảo sát và xây dựng 15 tình huống tư vấn thực tế	13  
3.2. Dữ liệu 15 tình huống sử dụng thuốc ở phụ nữ cho con bú	14  
3.3. Đánh giá phân loại mức độ an toàn lâm sàng theo LactMed và APILAM	16  
3.4. Phân tích dược động học bài tiết (Chỉ số RID, L/P ratio và thời gian bán thải)	19  
3.5. Chiến lược tra cứu y văn LactMed, PubMed MeSH và Dược thư Quốc gia	21  
3.6. So sánh tổng hợp các phương pháp tư vấn thông tin thuốc cho mẹ bỉm sữa	21  
3.7. Đánh giá nhu cầu người dùng và khoảng trống thông tin trong thực tế	22  
3.8. Kết luận chương và các yêu cầu dữ liệu cho hệ thống chatbot tư vấn	23  
CHƯƠNG 4 THIẾT KẾ VÀ ĐÁNH GIÁ CHATBOT AI TƯ VẤN SỬ DỤNG THUỐC CHO PHỤ NỮ CHO CON BÚ	24  
4.1. Mục tiêu thiết kế và các nguyên tắc an toàn y tế cốt tử	24  
4.2. Phân tích chức năng hệ thống LactaMed AI và kiến trúc đề xuất	25  
4.3. Thiết kế câu lệnh hệ thống tham chiếu (System Prompt LactaMed AI)	26  
4.4. Quy trình tư vấn 5 bước và phân luồng thông điệp lâm sàng	28  
4.5. Thiết kế bộ kiểm thử chatbot theo 15 tình huống	29  
4.6. Khảo sát thực nghiệm và kết quả có thể xác nhận	30  
4.7. Chỉ số đánh giá chất lượng và ngưỡng nghiệm thu đề xuất	31  
4.8. Thảo luận về tính khả thi, độ tin cậy và giới hạn sử dụng	33  
CHƯƠNG 5 ĐẠO ĐỨC SỐ VÀ AN TOÀN SỐ TRONG CHATBOT TƯ VẤN Y TẾ	34  
5.1. Bảo vệ dữ liệu cá nhân và quyền riêng tư y tế của mẹ và bé	34  
5.2. Kiểm soát rủi ro ảo giác AI (Hallucination) và an toàn tính mạng trẻ sơ sinh	35  
5.3. Rủi ro đạo đức khi tư vấn thuốc cho đối tượng dễ tổn thương	36  
5.4. Trách nhiệm pháp lý, ranh giới phần mềm y tế (SaMD) và tuyên bố miễn trừ y khoa	37  
5.5. Năng lực số của người dùng và vai trò giám sát chuyên môn của Dược sĩ	37  
5.6. Đề xuất quy tắc ứng xử số và an toàn vận hành	38  
CHƯƠNG 6 KẾT LUẬN VÀ KIẾN NGHỊ	39  
6.1. Kết luận chung của đề tài	39  
6.2. Đóng góp của báo cáo nghiên cứu	40  
6.3. Hạn chế nghiên cứu	41  
6.4. Kiến nghị và định hướng phát triển	42  
TÀI LIỆU THAM KHẢO	44  
NHẬN XÉT CÁ NHÂN SAU KHI THỰC HIỆN ĐỀ TÀI	46  
PHỤ LỤC A  BỘ CÂU HỎI KIỂM THỬ GỢI Ý CHO PHỤ NỮ CHO CON BÚ	47  
PHỤ LỤC B  PHIẾU CHẤM PHẢN HỒI CHATBOT TƯ VẤN DƯỢC KHOA	50  

---

## DANH MỤC BẢNG

Bảng 1.1. Liên hệ sáu miền năng lực số theo Thông tư 02/2025/TT-BGDĐT với nội dung thực hiện	6  
Bảng 2.1. Phân loại các nhóm thuốc phổ biến ở phụ nữ cho con bú và lưu ý lâm sàng	8  
Bảng 3.1. Mười lăm tình huống sử dụng thuốc phổ biến ở phụ nữ cho con bú	15  
Bảng 3.2. Đánh giá mức độ an toàn theo phân loại LactMed và e-lactancia	17  
Bảng 3.3. Dữ liệu dược động học bài tiết qua sữa mẹ (L/P ratio, RID, T1/2) của 15 hoạt chất	19  
Bảng 3.4. Chiến lược tra cứu y văn LactMed và PubMed MeSH cho các hoạt chất phổ biến	21  
Bảng 3.5. So sánh tổng hợp các phương pháp tư vấn thông tin thuốc cho phụ nữ cho con bú	22  
Bảng 4.1. Kiến trúc chức năng đề xuất của LactaMed AI và ranh giới an toàn y tế	26  
Bảng 4.2. Kết quả kiểm thử thực nghiệm trên 15 tình huống đối chiếu tiêu chuẩn vàng	31  
Bảng 4.3. Bộ chỉ số chất lượng và nguyên tắc nghiệm thu đề xuất cho chatbot y tế	32  
Bảng 5.1. Bảng kiểm tra an toàn và đạo đức số cho ứng dụng tư vấn thuốc cho con bú	38  
