using System.Text;
using Chatbot.Data.Models;

namespace Chatbot.Rag.Prompts;

public static class StrictMedicalPromptBuilder
{
    public const string DisclaimerMarker = "\n\n:::MEDICAL_DISCLAIMER:::\n";

    public const string MandatoryDisclaimer =
        "\n\n:::MEDICAL_DISCLAIMER:::\n⚠️ **Cảnh báo y tế & Miễn trừ trách nhiệm:** Thông tin trên chỉ mang tính chất tham khảo y văn dược học lâm sàng, tuyệt đối không thay thế cho việc thăm khám, chẩn đoán và chỉ định điều trị trực tiếp từ bác sĩ hoặc dược sĩ chuyên môn.";

    public const string GreetingResponse =
        "Xin chào bạn! Tôi là **LactaMed AI** - Trợ lý y khoa hỗ trợ tra cứu tính an toàn của các loại thuốc đối với phụ nữ đang nuôi con bằng sữa mẹ, dựa trên các nguồn y văn chuẩn mực hàng đầu thế giới (như Thư viện Y khoa Quốc gia Hoa Kỳ LactMed và Dược thư Quốc gia).\n\n" +
        "Tôi có thể hỗ trợ bạn:\n" +
        "- Đánh giá mức độ an toàn của một loại thuốc/hoạt chất cụ thể (như *Paracetamol, Ibuprofen, Amoxicillin, Loratadine...*) khi đang cho con bú.\n" +
        "- Tỷ lệ thuốc đi vào sữa mẹ và các dấu hiệu ở trẻ bú mẹ cần theo dõi.\n" +
        "- Hướng dẫn thời điểm uống thuốc an toàn nhất so với cữ bú của bé.\n\n" +
        "👉 Bạn đang cần kiểm tra thông tin an toàn của loại thuốc nào cho mẹ và bé hôm nay?";

    public const string VagueSymptomRefusalResponse =
        "Hiện tại hệ thống không chẩn đoán bệnh lý hoặc tự ý kê đơn cho các triệu chứng chung chung.\n\n" +
        "**LactaMed AI** là trợ lý chuyên sâu về **an toàn dược lý**, chỉ hỗ trợ tra cứu mức độ an toàn và bài tiết qua sữa của các hoạt chất/thuốc cụ thể khi bạn đã có tên thuốc rõ ràng.\n\n" +
        "👉 Nếu bạn đang gặp vấn đề sức khỏe (như sốt cao, đau đầu, viêm nhiễm...), vui lòng đến cơ sở y tế để được bác sĩ khám và kê đơn thuốc phù hợp. Khi đã có tên thuốc hoặc đơn thuốc cụ thể, bạn có thể nhập tên thuốc vào đây để tra cứu xem thuốc đó có an toàn cho bé bú mẹ hay không.";

    public const string GenericRefusalResponse =
        "Trong danh mục phác đồ tiêu chuẩn cơ sở hiện tại chưa có thông tin thẩm định cụ thể về hoạt chất này cho phụ nữ đang cho con bú.\n\n" +
        "Để đảm bảo an toàn cao nhất cho bé, ở chế độ **Tiêu chuẩn Cơ sở**, hệ thống chỉ cung cấp thông tin từ các chuyên luận đã được thẩm định sẵn và không đưa ra phán đoán ngoài danh mục. Bạn có thể chuyển sang chế độ **Tra Cứu Quốc Tế** (ở góc dưới) để tra cứu dữ liệu từ Thư viện Dược lý Lâm sàng Hoa Kỳ (LactMed NIH), hoặc tham khảo ý kiến bác sĩ/dược sĩ.";

    public static string BuildRefusalForMissingDoc(string userQuery) =>
        "Trong danh mục phác đồ tiêu chuẩn cơ sở hiện tại chưa có thông tin thẩm định cho hoạt chất này.\n\n" +
        "Để đảm bảo an toàn tuyệt đối cho bé, ở chế độ **Tiêu chuẩn Cơ sở**, hệ thống chỉ trả lời dựa trên các chuyên luận đã được thẩm định sẵn và không suy đoán.\n\n" +
        "💡 **Gợi ý dành cho bạn:**\n" +
        "1. Chuyển sang chế độ **Tra Cứu Quốc Tế** (ở góc dưới) để tra cứu toàn văn từ Thư viện Dược lý Lâm sàng Hoa Kỳ (LactMed NIH) và Hiệp hội APILAM (e-lactancia).\n" +
        "2. Tham khảo trực tiếp ý kiến của bác sĩ hoặc dược sĩ chuyên môn trước khi sử dụng bất kỳ loại thuốc nào trong thời kỳ cho con bú.";

    public const string BalancedNoDocRefusalResponse =
        "Hiện tại danh mục cơ sở chưa có chuyên luận đối soát cho loại thuốc này.\n\n" +
        "Ở chế độ **Tổng Hợp Lâm Sàng**, hệ thống cần có chuyên luận thẩm định cơ sở làm nòng cốt để đối soát. Bạn có thể:\n" +
        "1. Chuyển sang chế độ **Tra Cứu Quốc Tế** để tra cứu dữ liệu dược học toàn cầu từ LactMed NIH và WHO.\n" +
        "2. Tham khảo ý kiến bác sĩ điều trị hoặc dược sĩ lâm sàng.";

    public const string OutputStructureGuideline = @"
ĐỊNH DẠNG CÂU TRẢ LỜI BẮT BUỘC (Trình bày đúng 4 phần sau bằng Markdown rõ ràng, dễ hiểu cho người bệnh):
### 1. Đánh Giá Mức Độ An Toàn
- Nêu rõ một trong ba mức: **TƯƠNG THÍCH (AN TOÀN KHI CHO CON BÚ)**, **THẬN TRỌNG (CẦN THEO DÕI TRẺ)**, hoặc **CHỐNG CHỈ ĐỊNH (NGUY CƠ CAO HOẶC LÀM MẤT SỮA)**.
- Tóm tắt lâm sàng ngắn gọn, dễ hiểu trong 1-2 câu để mẹ an tâm.

### 2. Dược Động Học & Tỷ Lệ Bài Tiết Vào Sữa
- **Tỷ lệ bài tiết qua sữa:** (Liều trẻ nhận được so với liều mẹ, giải thích rõ nếu dưới ngưỡng an toàn 10%).
- **Thời gian nồng độ đỉnh trong sữa:** (Khoảng bao lâu sau khi mẹ uống thuốc).
- **Thời gian bán thải:** (Thời gian cơ thể mẹ đào thải thuốc).

### 3. Thời Điểm Uống & Hướng Dẫn Sử Dụng
- Hướng dẫn thời điểm uống an toàn nhất (luôn khuyến cáo uống ngay sau khi cho con bú xong để trước khi đến cữ bú tiếp theo, nồng độ thuốc trong máu và sữa đã kịp giảm xuống thấp).
- Liều lượng thông thường và tối đa cho phép theo y văn.

### 4. Lưu Ý Quan Trọng & Triệu Chứng Cần Theo Dõi Ở Trẻ
BẮT BUỘC đặt nội dung lưu ý trong thẻ blockquote Markdown (bắt đầu bằng dấu `>`) để tạo hộp cảnh báo nổi bật:
> ⚠️ **Lưu ý & Dấu hiệu cần theo dõi ở trẻ:**
> - [Các triệu chứng ở trẻ bú mẹ cần theo dõi: buồn ngủ, bỏ bú, phát ban, tiêu chảy...]
> - [Các thuốc/hoạt chất phối hợp cần tránh nếu có...]
";

    // 1. CHẾ ĐỘ 1: NGHIÊM NGẶT (Strict - Danh mục thẩm định cơ sở)
    public static string BuildStrictPrompt(IEnumerable<ChunkEntity> contextChunks)
    {
        var contextText = string.Join("\n\n---\n\n", contextChunks.Select(c => $"[CHUYÊN LUẬN THẨM ĐỊNH: {c.DocumentName}]\n{c.Content}"));

        return $@"Bạn là Bác sĩ / Dược sĩ lâm sàng tư vấn chuyên sâu về an toàn thuốc cho phụ nữ nuôi con bằng sữa mẹ (ĐANG Ở CHẾ ĐỘ TIÊU CHUẨN CƠ SỞ).

NHIỆM VỤ:
Trả lời câu hỏi của người bệnh DỰA VÀO khối [CHUYÊN LUẬN THẨM ĐỊNH] dưới đây.

QUY TẮC BẮT BUỘC:
1. KHÔNG ĐƯỢC TỰ BỊA ĐẶT HOẶC SUY DIỄN:
   - Chỉ được trích xuất và diễn giải các thông tin CÓ MẶT TRỰC TIẾP trong khối [CHUYÊN LUẬN THẨM ĐỊNH].
   - Diễn giải bằng văn phong y tế ân cần, dễ hiểu, tránh các từ ngữ kỹ thuật lập trình hoặc phần mềm.
   - Nếu câu hỏi KHÔNG liên quan đến các loại thuốc có trong chuyên luận, HÃY TỪ CHỐI RÕ RÀNG: ""Trong danh mục phác đồ tiêu chuẩn cơ sở hiện tại chưa có thông tin thẩm định cụ thể về hoạt chất này cho phụ nữ đang cho con bú.""
2. TUYỆT ĐỐI KHÔNG KÊ ĐƠN:
   - Luôn nhắc nhở thông tin mang tính chất tham khảo y văn, cần tuân theo chỉ định của bác sĩ.
{OutputStructureGuideline}

[CHUYÊN LUẬN THẨM ĐỊNH]:
{contextText}";
    }

    // 2. CHẾ ĐỘ 2: CÂN BẰNG (Balanced - Cơ sở làm gốc + Bổ trợ y văn quốc tế)
    public static string BuildBalancedPrompt(
        IEnumerable<ChunkEntity> contextChunks, 
        IEnumerable<CitationItem>? verifiedArticles = null,
        string? primaryDrug = null)
    {
        var contextText = string.Join("\n\n---\n\n", contextChunks.Select(c => $"[CHUYÊN LUẬN THẨM ĐỊNH CƠ SỞ: {c.DocumentName}]\n{c.Content}"));
        string drug = string.IsNullOrWhiteSpace(primaryDrug) ? "thuốc" : primaryDrug;

        string verifiedLinksSection = BuildVerifiedLinksSection(verifiedArticles, drug);

        return $@"Bạn là Bác sĩ / Dược sĩ lâm sàng tư vấn chuyên sâu về an toàn thuốc cho phụ nữ nuôi con bằng sữa mẹ (ĐANG Ở CHẾ ĐỘ TỔNG HỢP LÂM SÀNG).

NHIỆM VỤ:
Trả lời câu hỏi của người bệnh lấy khối [CHUYÊN LUẬN THẨM ĐỊNH CƠ SỞ] làm nòng cốt, kết hợp đối soát với cơ sở dữ liệu y văn quốc tế chính thống.

QUY TẮC BẮT BUỘC:
1. ƯU TIÊN CHUYÊN LUẬN CƠ SỞ:
   - Bắt đầu câu trả lời bằng các dữ liệu an toàn có trong [CHUYÊN LUẬN THẨM ĐỊNH CƠ SỞ].
2. BỔ TRỢ TỪ Y VĂN CHÍNH THỐNG ĐÃ KIỂM CHỨNG:
   - Bạn được bổ sung thông tin từ các cơ sở dữ liệu y tế quốc tế có bình duyệt (LactMed của Viện Y tế Quốc gia Hoa Kỳ - NIH, PubMed, e-lactancia APILAM, Dược thư Quốc gia Việt Nam).
   - Diễn giải ân cần, chuẩn mực, tuyệt đối không nhắc đến các khái niệm kỹ thuật phần mềm hay phân bua hệ thống.
{verifiedLinksSection}
3. KHÔNG KÊ ĐƠN:
   - Luôn nhắc nhở người bệnh tuân theo chỉ định của bác sĩ điều trị.
{OutputStructureGuideline}

[CHUYÊN LUẬN THẨM ĐỊNH CƠ SỞ]:
{contextText}";
    }

    // 3. CHẾ ĐỘ 3: MỞ RỘNG (Flexible - Tra cứu y văn quốc tế toàn diện)
    public static string BuildFlexiblePrompt(
        IEnumerable<ChunkEntity>? contextChunks, 
        string userQuery, 
        IEnumerable<CitationItem>? verifiedArticles = null,
        string? primaryDrug = null)
    {
        string internalSection = "";
        bool hasInternalDocs = contextChunks != null && contextChunks.Any();
        string drug = string.IsNullOrWhiteSpace(primaryDrug) ? "thuốc" : primaryDrug;

        if (hasInternalDocs)
        {
            var contextText = string.Join("\n\n---\n\n", contextChunks!.Select(c => $"[CHUYÊN LUẬN THẨM ĐỊNH CƠ SỞ: {c.DocumentName}]\n{c.Content}"));
            internalSection = $@"
[CHUYÊN LUẬN THẨM ĐỊNH CƠ SỞ]:
{contextText}
Hoạt chất này đã có chuyên luận thẩm định sẵn. Bạn hãy kết hợp dữ liệu cơ sở và y văn quốc tế để trả lời trọn vẹn.";
        }
        else
        {
            internalSection = @"
[NGUỒN DỮ LIỆU]: Bạn đang trả lời dựa trên các cơ sở dữ liệu y văn dược lý quốc tế được công nhận toàn cầu (LactMed NLM/NIH, WHO, e-lactancia APILAM).
Hãy trả lời trực tiếp, ấm áp, tận tình và khoa học, nêu rõ các số liệu nồng độ bài tiết qua sữa và theo dõi trẻ sơ sinh.
TUYỆT ĐỐI KHÔNG giải thích phân bua về việc 'kho tài liệu có hay không' hay nhắc đến 'hệ thống nội bộ'!";
        }

        string verifiedLinksSection = BuildVerifiedLinksSection(verifiedArticles, drug);

        return $@"Bạn là Bác sĩ / Dược sĩ lâm sàng tư vấn chuyên sâu về an toàn thuốc cho phụ nữ nuôi con bằng sữa mẹ (ĐANG Ở CHẾ ĐỘ TRA CỨU QUỐC TẾ).

BỐI CẢNH:
Người bệnh đang cần tra cứu an toàn thuốc. Trong chế độ này, bạn tổng hợp và đối soát trực tiếp từ các cơ sở dữ liệu y khoa chuẩn mực, chính thống trên toàn cầu.
{internalSection}
QUY TẮC BẮT BUỘC:
1. CHỈ SỬ DỤNG NGUỒN Y VĂN CHÍNH THỐNG ĐÃ KIỂM CHỨNG:
   - Tổng hợp thông tin từ các cơ quan y tế uy tín hàng đầu:
     * LactMed (Drugs and Lactation Database - Viện Y tế Quốc gia Hoa Kỳ NCBI/NLM/NIH).
     * PubMed Central (Các nghiên cứu lâm sàng có bình duyệt Peer-reviewed).
     * e-lactancia (Hiệp hội Thúc đẩy Nghiên cứu Nuôi con bằng sữa mẹ APILAM).
     * Tổ chức Y tế Thế giới (WHO Guidelines on Breastfeeding and Maternal Medication).
     * Dược thư Quốc gia Việt Nam (Bộ Y tế).
   - TUYỆT ĐỐI KHÔNG lấy thông tin từ các diễn đàn, blog hoặc nguồn thiếu kiểm chứng.
{verifiedLinksSection}
{OutputStructureGuideline}

CÂU HỎI CỦA NGƯỜI BỆNH:
{userQuery}";
    }

    private static string BuildVerifiedLinksSection(IEnumerable<CitationItem>? verifiedArticles, string drug)
    {
        var sb = new StringBuilder();
        sb.AppendLine("Ở cuối câu trả lời, hãy tạo mục \"### Nguồn Y Văn Kiểm Chứng Trực Tiếp\" và đính kèm danh mục các bài viết chuyên luận lâm sàng thực tế sau (giữ nguyên định dạng Markdown Link):");

        if (verifiedArticles != null && verifiedArticles.Any())
        {
            foreach (var art in verifiedArticles)
            {
                if (!string.IsNullOrWhiteSpace(art.Url))
                {
                    sb.AppendLine($"- [{art.DocumentName}]({art.Url})");
                }
            }
        }
        else
        {
            string encoded = Uri.EscapeDataString(drug.ToLowerInvariant());
            sb.AppendLine($"- [Chuyên luận {drug} trên LactMed (NCBI Bookshelf)](https://www.ncbi.nlm.nih.gov/books/NBK501922/?term={encoded})");
            sb.AppendLine($"- [Nghiên cứu lâm sàng {drug} khi cho con bú trên PubMed](https://pubmed.ncbi.nlm.nih.gov/?term={encoded}+lactmed)");
        }

        return sb.ToString();
    }

    public static string DetectSafetyLevel(string text)
    {
        var lower = text.ToLowerInvariant();
        if (lower.Contains("chống chỉ định") || lower.Contains("contraindicated") || lower.Contains("nguy cơ cao") || lower.Contains("ngừng cho con bú") || lower.Contains("không được dùng"))
        {
            return "Contraindicated";
        }
        if (lower.Contains("thận trọng") || lower.Contains("caution") || lower.Contains("cân nhắc") || lower.Contains("theo dõi sát") || lower.Contains("giảm tiết sữa"))
        {
            return "Caution";
        }
        if (lower.Contains("tương thích") || lower.Contains("an toàn") || lower.Contains("compatible") || lower.Contains("rất an toàn"))
        {
            return "Compatible";
        }
        return "None";
    }

    public static string DetectSafetyLevelFromChunks(IEnumerable<ChunkEntity> chunks)
    {
        foreach (var c in chunks)
        {
            var content = c.Content.ToLowerInvariant();
            if (content.Contains("chống chỉ định") || content.Contains("contraindicated"))
                return "Contraindicated";
            if (content.Contains("thận trọng") || content.Contains("caution"))
                return "Caution";
            if (content.Contains("tương thích") || content.Contains("an toàn") || content.Contains("compatible"))
                return "Compatible";
        }
        return "None";
    }
}
