using System.Text.RegularExpressions;

namespace Chatbot.Rag.Security;

public enum QueryIntent
{
    MedicationSafety = 0,       // Tra cứu thuốc, hoạt chất, vắc-xin, dược phẩm
    LactationCounseling = 1,    // Tư vấn nuôi con bằng sữa mẹ, tiết sữa, thiếu sữa, tắc tia, dinh dưỡng, chăm sóc hậu sản
    GreetingOrCapabilities = 2, // Chào hỏi, hỏi về năng lực trợ lý
    VagueSymptomsOnly = 3,      // Chỉ nêu triệu chứng mơ hồ ("em bị sốt", "tôi bị đau đầu")
    OutOfScope = 4              // Rõ ràng ngoài phạm vi y tế (code, toán, đời sống, chính trị, thể thao, giải trí...)
}

public record IntentClassificationResult(
    QueryIntent Intent,
    string? DetectedDrugOrSubstance,
    string? Explanation
);

public partial class MedicalIntentClassifier
{
    // 1. Nhận diện các chủ đề hoàn toàn ngoài lề y tế (Lập trình, toán, giải trí, chính trị, tài chính...)
    [GeneratedRegex(
        @"(?i)(\b(viết\s+code|lập\s+trình|python|javascript|typescript|c#|c\+\+|java|html|css|sql|react|vue|docker|kubernetes|linux|ubuntu|centos|git|github|database|cài\s+win|bug|hacker|wifi|source\s+code)\b|" +
        @"\b(tính\s+tích\s+phân|đạo\s+hàm|giải\s+phương\s+trình|bất\s+đẳng\s+thức|tam\s+giác|hình\s+học|toán\s+học|vật\s+lý|hóa\s+học\s+vô\s+cơ|định\s+lý)\b|" +
        @"\b(công\s+thức\s+nấu\s+(phở|bún|canh|cơm)|cách\s+nấu\s+(phở|bún|chè|bánh|lẩu)|làm\s+bánh|pha\s+cà\s+phê|công\s+thức\s+pha\s+chế|quán\s+ăn\s+ngon)\b|" +
        @"\b(chứng\s+khoán|tiền\s+ảo|bitcoin|crypto|giá\s+vàng|đầu\s+tư|lãi\s+suất|vay\s+tiền|thị\s+trường\s+tài\s+chính|bất\s+động\s+sản)\b|" +
        @"\b(làm\s+thơ|viết\s+(bài\s+)?(văn|thơ|tiểu\s+thuyết|kịch\s+bản)|kể\s+chuyện\s+cười|hát\s+cho|chơi\s+game|playstation|xbox|liên\s+quân|pubg|free\s+fire)\b|" +
        @"\b(tổng\s+thống|chính\s+trị|bầu\s+cử|quân\s+sự|chiến\s+tranh|thủ\s+đô\s+của|dân\s+số\s+của|diện\s+tích\s+của)\b|" +
        @"\b(thời\s+tiết\s+hôm\s+nay|dự\s+báo\s+thời\s+tiết|xem\s+bói|tử\s+vi|cung\s+hoàng\s+đạo|phong\s+thủy)\b)",
        RegexOptions.Compiled)]
    private static partial Regex ExplicitOutOfScopeRegex();

    // 2. Nhận diện các từ khóa/thuật ngữ chuyên sâu về Nuôi con bằng sữa mẹ, tiết sữa, hậu sản
    [GeneratedRegex(
        @"(?i)(\b(sữa|sữa\s+mẹ|sữa\s+non|sữa\s+đầu|sữa\s+cuối|nguồn\s+sữa|chất\s+lượng\s+sữa|sữa\s+công\s+thức|sữa\s+bị\s+chua|sữa\s+loãng|sữa\s+đặc)\b|" +
        @"\b(thiếu\s+sữa|ít\s+sữa|mất\s+sữa|hết\s+sữa|giảm\s+sữa|chậm\s+sữa|chậm\s+về\s+sữa|tắc\s+sữa|tắc\s+tia|tắc\s+tia\s+sữa|thông\s+tia|thông\s+sữa)\b|" +
        @"\b(cương\s+sữa|căng\s+sữa|tức\s+ngực|đau\s+ngực|áp\s+xe|áp\s+xe\s+vú|viêm\s+tuyến\s+vú|viêm\s+vú|nứt\s+cổ\s+gà|đau\s+núm\s+ti|rát\s+đầu\s+ti|núm\s+ti|đầu\s+ti|ti\s+mẹ)\b|" +
        @"\b(kích\s+sữa|tiết\s+sữa|tạo\s+sữa|lợi\s+sữa|phản\s+xạ\s+xuống\s+sữa|xuống\s+sữa|giảm\s+tiết\s+sữa|ức\s+chế\s+tiết\s+sữa)\b|" +
        @"\b(cho\s+con\s+bú|cho\s+bé\s+bú|nuôi\s+con\s+bằng\s+sữa|bú\s+mẹ|cữ\s+bú|khớp\s+ngậm|ngậm\s+bắt\s+vú|cai\s+sữa|dặm\s+sữa|bình\s+sữa|núm\s+trợ\s+ti)\b|" +
        @"\b(vắt\s+sữa|hút\s+sữa|máy\s+hút\s+sữa|trữ\s+sữa|bảo\s+quản\s+sữa|rã\s+đông\s+sữa|hâm\s+sữa|túi\s+trữ\s+sữa)\b|" +
        @"\b(sau\s+sinh|hậu\s+sản|ở\s+cữ|mẹ\s+sau\s+sinh|phụ\s+nữ\s+sau\s+sinh|sản\s+phụ|rạch\s+tầng\s+sinh\s+môn|sinh\s+mổ|sinh\s+thường|sản\s+dịch|co\s+hồi\s+tử\s+cung|trầm\s+cảm\s+sau\s+sinh|rụng\s+tóc\s+sau\s+sinh)\b|" +
        @"\b(thực\s+phẩm\s+lợi\s+sữa|ăn\s+gì\s+lợi\s+sữa|ăn\s+gì\s+để\s+nhiều\s+sữa|ăn\s+gì\s+mất\s+sữa|kiêng\s+gì\s+khi\s+cho\s+con\s+bú|chè\s+vằng|cỏ\s+cà\s+ri|ngũ\s+cốc\s+lợi\s+sữa|lá\s+đinh\s+lăng|móng\s+giò|uống\s+nước\s+gì\s+lợi\s+sữa)\b|" +
        @"\b(trẻ\s+bú|bé\s+bú|trẻ\s+sơ\s+sinh|em\s+bé|bỏ\s+bú|bú\s+kém|trớ\s+sữa|ọc\s+sữa|đầy\s+hơi|chướng\s+bụng|phân\s+hoa\s+cà|xì\s+xoẹt|vàng\s+da\s+sơ\s+sinh|chậm\s+tăng\s+cân)\b)",
        RegexOptions.Compiled)]
    private static partial Regex LactationAndMaternalRegex();

    // 3. Nhận diện các từ khóa/thuật ngữ y tế, dược phẩm và dùng thuốc
    [GeneratedRegex(
        @"(?i)(\b(thuốc|hoạt\s+chất|dược|dược\s+thư|dược\s+lý|kháng\s+sinh|giảm\s+đau|hạ\s+sốt|chống\s+viêm|kháng\s+histamin|vắc\s*xin|vaccine|tiêm\s+chủng|tiêm\s+phòng)\b|" +
        @"\b(uống\s+được\s+không|dùng\s+được\s+không|uống\s+khi\s+cho\s+con\s+bú|dùng\s+khi\s+cho\s+con\s+bú|có\s+ảnh\s+hưởng\s+(tới|đến)\s+(bé|sữa|con)|an\s+toàn\s+cho\s+(bé|con|mẹ)|tác\s+dụng\s+phụ)\b|" +
        @"\b(liều\s+dùng|quá\s+liều|thời\s+gian\s+bán\s+thải|nồng\s+độ\s+đỉnh|dược\s+động\s+học|chỉ\s+định|chống\s+chỉ\s+định|thời\s+điểm\s+uống|bài\s+tiết\s+(qua\s+)?sữa|tương\s+tác\s+thuốc)\b|" +
        @"\b(bệnh|bệnh\s+lý|chẩn\s+đoán|điều\s+trị|khám\s+bệnh|bác\s+sĩ|dược\s+sĩ|y\s+tế|bệnh\s+viện|phòng\s+khám|đơn\s+thuốc|kê\s+đơn)\b|" +
        @"\b(sốt|đau\s+đầu|đau\s+bụng|cảm\s+cúm|viêm\s+họng|ho|nghẹt\s+mũi|tiêu\s+chảy|dị\s+ứng|mề\s+đay|nôn\s+trớ|mệt\s+mỏi|nhiễm\s+trùng|nhiễm\s+khuẩn|nấm\s+núm\s+ti|tưa\s+lưỡi)\b|" +
        @"\b(vitamin|khoáng\s+chất|viên\s+sắt|canxi|dha|kẽm|men\s+vi\s+sinh|probiotic|dung\s+dịch\s+nhỏ|thuốc\s+xịt|thuốc\s+bôi|siro|viên\s+ngậm)\b)",
        RegexOptions.Compiled)]
    private static partial Regex GeneralMedicalRegex();

    // 4. Nhận diện các hậu tố hoặc tên hoạt chất dược lý phổ biến
    [GeneratedRegex(
        @"(?i)\b[a-z]{3,}(cillin|mycin|micin|cycline|floxacin|statin|prazole|olol|sartan|tadine|fen|mol|zol|pril|xine|mab|vir|caine|dopa|dine|pine|zone|asone)\b",
        RegexOptions.Compiled)]
    private static partial Regex DrugPatternRegex();

    private static readonly HashSet<string> KnownDrugs = new(StringComparer.OrdinalIgnoreCase)
    {
        // Giảm đau, hạ sốt, kháng viêm
        "paracetamol", "acetaminophen", "panadol", "hapacol", "efferalgan", "tylenol", "paracold",
        "ibuprofen", "advil", "motrin", "aspirin", "aspirine", "naproxen", "diclofenac", "celecoxib",
        "meloxicam", "mefenamic", "tramadol",

        // Kháng sinh & Kháng khuẩn
        "amoxicillin", "augmentin", "ampicillin", "cephalexin", "keflex", "cefixime", "cefuroxime",
        "azithromycin", "zithromax", "erythromycin", "clarithromycin", "ciprofloxacin", "levofloxacin",
        "metronidazole", "flagyl", "clindamycin", "doxycycline", "bactrim", "cotrimoxazol",

        // Dị ứng, cảm cúm, hô hấp
        "loratadine", "claritin", "cetirizine", "zyrtec", "fexofenadine", "telfast", "chlorpheniramine",
        "dextromethorphan", "bromhexine", "ambroxol", "acetylcysteine", "salbutamol", "ventolin",

        // Tiêu hóa & Dạ dày
        "omeprazole", "esomeprazole", "nexium", "pantoprazole", "ranitidine", "famotidine",
        "domperidone", "motilium", "metoclopramide", "loperamide", "smecta", "berberin", "simethicone",

        // Vitamin, vi chất & Khoáng chất
        "vitamin", "canxi", "calcium", "sat", "sắt", "iron", "kem", "kẽm", "zinc", "magie", "magnesium",
        "folic", "dha", "epa", "omega", "probiotic", "bioamicus", "biogaia"
    };

    public IntentClassificationResult Classify(string query)
    {
        var q = query.Trim();

        // 1. Kiểm tra Chào hỏi & Năng lực bot
        if (IsCapabilitiesOrGreeting(q))
        {
            return new IntentClassificationResult(
                QueryIntent.GreetingOrCapabilities,
                null,
                "Câu chào hỏi hoặc hỏi về năng lực trợ lý."
            );
        }

        // 2. Tìm kiếm tên thuốc / hoạt chất cụ thể trong câu hỏi
        string? detectedDrug = DetectDrugName(q);

        // 3. Nếu phát hiện tên thuốc cụ thể -> Phân loại trực tiếp vào MedicationSafety
        if (detectedDrug != null)
        {
            return new IntentClassificationResult(
                QueryIntent.MedicationSafety,
                detectedDrug,
                $"Phát hiện tra cứu an toàn hoạt chất: {detectedDrug}"
            );
        }

        // 4. Kiểm tra các câu hỏi về nuôi con bằng sữa mẹ, tiết sữa, thiếu sữa, chăm sóc hậu sản
        bool isLactationTopic = LactationAndMaternalRegex().IsMatch(q);
        if (isLactationTopic)
        {
            // Nếu có nhắc đến chữ "thuốc" kết hợp với sữa mẹ (ví dụ: "thuốc làm giảm tiết sữa", "thuốc cảm cho mẹ bú")
            if (q.Contains("thuốc", StringComparison.OrdinalIgnoreCase) || q.Contains("uống gì", StringComparison.OrdinalIgnoreCase))
            {
                return new IntentClassificationResult(
                    QueryIntent.MedicationSafety,
                    null,
                    "Câu hỏi liên quan đến thuốc/hoạt chất trong thời kỳ nuôi con bằng sữa mẹ."
                );
            }

            return new IntentClassificationResult(
                QueryIntent.LactationCounseling,
                null,
                "Câu hỏi tư vấn lâm sàng về nuôi con bằng sữa mẹ, tiết sữa hoặc chăm sóc mẹ và bé."
            );
        }

        // 5. Kiểm tra ngữ cảnh y tế / dược lý chung
        bool hasGeneralMedical = GeneralMedicalRegex().IsMatch(q);
        if (hasGeneralMedical)
        {
            // Nếu chỉ nêu triệu chứng mơ hồ không có thêm câu hỏi hay ngữ cảnh
            if (IsVagueSymptomOnly(q))
            {
                return new IntentClassificationResult(
                    QueryIntent.VagueSymptomsOnly,
                    null,
                    "Người dùng chỉ nêu triệu chứng mơ hồ, chưa có ngữ cảnh điều trị cụ thể."
                );
            }

            return new IntentClassificationResult(
                QueryIntent.LactationCounseling,
                null,
                "Câu hỏi sức khỏe y tế lâm sàng liên quan đến phụ nữ và trẻ bú mẹ."
            );
        }

        // 6. Kiểm tra các chủ đề hoàn toàn ngoài lề (lập trình, giải toán, đời sống, tài chính, chính trị...)
        bool matchesOutOfScope = ExplicitOutOfScopeRegex().IsMatch(q);
        if (matchesOutOfScope)
        {
            return new IntentClassificationResult(
                QueryIntent.OutOfScope,
                null,
                "Câu hỏi hoàn toàn thuộc chủ đề ngoài lề không liên quan đến y tế hoặc dược lý cho con bú."
            );
        }

        // 7. Nếu câu hỏi không chứa bất kỳ từ khóa y tế, dược phẩm hay nuôi con nào
        return new IntentClassificationResult(
            QueryIntent.OutOfScope,
            null,
            "Câu hỏi không chứa thông tin y tế, dược phẩm hoặc chăm sóc nuôi con bằng sữa mẹ."
        );
    }

    public string? DetectDrugName(string query)
    {
        var tokens = query
            .ToLowerInvariant()
            .Split(new[] { ' ', ',', '.', '?', '!', ';', ':', '-', '(', ')', '[', ']', '/', '\\', '"', '\'', '\n', '\r', '\t' },
                   StringSplitOptions.RemoveEmptyEntries);

        // Quét trong từ điển thuốc chuẩn
        foreach (var t in tokens)
        {
            var clean = t.Trim();
            if (clean.Length >= 3 && KnownDrugs.Contains(clean))
            {
                return NormalizeDrugName(clean);
            }
        }

        // Quét theo mẫu hậu tố dược lý (ví dụ: ampicillin, ciprofloxacin, omeprazole...)
        foreach (var t in tokens)
        {
            var clean = t.Trim();
            if (clean.Length >= 4 && DrugPatternRegex().IsMatch(clean))
            {
                return clean;
            }
        }

        return null;
    }

    public static string NormalizeDrugName(string raw)
    {
        var lower = (raw ?? "").Trim().ToLowerInvariant();
        return lower switch
        {
            "hapacol" or "panadol" or "efferalgan" or "tylenol" or "paracold" or "acetaminophen" => "paracetamol",
            "advil" or "motrin" => "ibuprofen",
            "augmentin" => "amoxicillin",
            "aspirine" => "aspirin",
            "claritin" => "loratadine",
            "zyrtec" => "cetirizine",
            "keflex" => "cephalexin",
            "zithromax" => "azithromycin",
            "nexium" => "esomeprazole",
            "smecta" => "diosmectite",
            "motilium" => "domperidone",
            _ => lower
        };
    }

    private static bool IsCapabilitiesOrGreeting(string query)
    {
        var q = query.Trim().ToLowerInvariant().Trim('.', '?', '!', ',', ';', ':', ' ');

        string[] phrases = new[]
        {
            "hi", "hello", "hey", "alo", "chao", "chào", "chao ban", "chào bạn",
            "xin chao", "xin chào", "hi bot", "chào bot", "chao bot", "ad oi", "ad ơi",
            "bot oi", "bot ơi", "hello bot", "hi bạn", "chào em", "chao em",
            "bạn là ai", "ban la ai", "who are you",
            "chức năng của bạn", "chuc nang cua ban", "chức năng của bạn là gì",
            "bạn có thể làm gì", "ban co the lam gi",
            "bạn giúp được gì", "ban giup duoc gi",
            "giúp tôi", "giup toi",
            "hướng dẫn sử dụng", "huong dan su dung",
            "bạn có thể trả lời câu hoi liên quan tới gì",
            "bạn có thể trả lời câu hỏi liên quan tới gì",
            "bạn trả lời được những gì", "ban tra loi duoc nhung gi",
            "bạn có thể trả lời những gì", "ban co the tra loi nhung gi",
            "trả lời câu hỏi gì", "tra loi cau hoi gi"
        };

        if (phrases.Contains(q))
            return true;

        if (q.StartsWith("chào bạn") || q.StartsWith("xin chào") || q.StartsWith("hello") || q == "hi")
            return true;

        if (q.Contains("bạn có thể trả lời") || q.Contains("bạn làm được gì") || q.Contains("bạn là ai"))
            return true;

        return false;
    }

    private static bool IsVagueSymptomOnly(string query)
    {
        var q = query.Trim().ToLowerInvariant().Trim('.', '?', '!', ',', ' ');

        string[] vaguePhrases = new[]
        {
            "bị sốt", "bi sot", "tôi bị sốt", "toi bi sot", "em bị sốt", "em bi sot", "đang bị sốt", "dang bi sot",
            "bị đau đầu", "bi dau dau", "tôi bị đau đầu", "toi bi dau dau", "đau đầu",
            "bị đau bụng", "bi dau bung", "bị tiêu chảy", "bi tieu chay", "bị cảm cúm", "bi cam cum",
            "bị cảm", "bi cam", "bị ho", "bi ho", "đau họng", "bị mệt", "bi met", "bị viêm họng"
        };

        foreach (var phrase in vaguePhrases)
        {
            if (q == phrase || q == $"{phrase} thì sao" || q == $"{phrase} làm sao" || q == $"{phrase} phải làm sao")
            {
                return true;
            }
        }

        return false;
    }
}
