using System.Text.RegularExpressions;

namespace Chatbot.Rag.Security;

public enum QueryIntent
{
    MedicationSafety = 0,
    GreetingOrCapabilities = 1,
    VagueSymptomsOnly = 2,
    OutOfScope = 3
}

public record IntentClassificationResult(
    QueryIntent Intent,
    string? DetectedDrugOrSubstance,
    string? Explanation
);

public partial class MedicalIntentClassifier
{
    // 1. Nhận diện các chủ đề hoàn toàn ngoài lề (Lập trình, toán, ẩm thực, giải trí, chính trị, tài chính...)
    [GeneratedRegex(
        @"(?i)(\b(viết\s+code|lập\s+trình|python|javascript|typescript|c#|c\+\+|java|html|css|sql|react|vue|docker|kubernetes|linux|ubuntu|centos|git|github|database|cài\s+win|bug|hacker|wifi|source\s+code)\b|" +
        @"\b(tính\s+tích\s+phân|đạo\s+hàm|giải\s+phương\s+trình|bất\s+đẳng\s+thức|tam\s+giác|hình\s+học|toán\s+học|vật\s+lý|hóa\s+học\s+vô\s+cơ|định\s+lý)\b|" +
        @"\b(công\s+thức\s+nấu|cách\s+nấu\s+(phở|bún|canh|cơm)|làm\s+bánh|cách\s+làm\s+món|pha\s+cà\s+phê|công\s+thức\s+pha\s+chế|món\s+ngon)\b|" +
        @"\b(chứng\s+khoán|tiền\s+ảo|bitcoin|crypto|giá\s+vàng|đầu\s+tư|lãi\s+suất|vay\s+tiền|thị\s+trường\s+tài\s+chính|bất\s+động\s+sản)\b|" +
        @"\b(làm\s+thơ|viết\s+(bài\s+)?(văn|thơ|tiểu\s+thuyết|kịch\s+bản)|kể\s+chuyện\s+cười|hát\s+cho|chơi\s+game|playstation|xbox|liên\s+quân|pubg|free\s+fire)\b|" +
        @"\b(tổng\s+thống|chính\s+trị|bầu\s+cử|quân\s+sự|chiến\s+tranh|thủ\s+đô\s+của|dân\s+số\s+của|diện\s+tích\s+của)\b|" +
        @"\b(thời\s+tiết\s+hôm\s+nay|dự\s+báo\s+thời\s+tiết|xem\s+bói|tử\s+vi|cung\s+hoàng\s+đạo|phong\s+thủy)\b)",
        RegexOptions.Compiled)]
    private static partial Regex ExplicitOutOfScopeRegex();

    // 2. Nhận diện các từ khóa/thuật ngữ y tế, dược lý và sức khỏe mẹ & bé
    [GeneratedRegex(
        @"(?i)(\b(thuốc|hoạt\s+chất|dược|kháng\s+sinh|giảm\s+đau|hạ\s+sốt|chống\s+viêm|kháng\s+histamin|vắc\s*xin|vaccine|tiêm\s+chủng|tiêm\s+phòng)\b|" +
        @"\b(cho\s+con\s+bú|cho\s+bé\s+bú|nuôi\s+con\s+bằng\s+sữa|sữa\s+mẹ|ti\s+mẹ|bài\s+tiết\s+(qua\s+)?sữa|mất\s+sữa|ít\s+sữa|cữ\s+bú|trẻ\s+bú|sau\s+sinh|hậu\s+sản)\b|" +
        @"\b(uống\s+được\s+không|dùng\s+được\s+không|uống\s+khi\s+cho\s+con\s+bú|có\s+ảnh\s+hưởng\s+(tới|đến)\s+(bé|sữa|con)|an\s+toàn\s+cho\s+(bé|con)|tác\s+dụng\s+phụ)\b|" +
        @"\b(liều\s+dùng|thời\s+gian\s+bán\s+thải|nồng\s+độ\s+đỉnh|dược\s+động\s+học|chỉ\s+định|chống\s+chỉ\s+định)\b|" +
        @"\b(sốt|đau\s+đầu|đau\s+bụng|cảm\s+cúm|viêm\s+họng|ho|nghẹt\s+mũi|tiêu\s+chảy|dị\s+ứng|mề\s+đay|nôn\s+trớ|mệt\s+mỏi)\b|" +
        @"\b(vitamin|khoáng\s+chất|viên\s+sắt|canxi|dha|kẽm|men\s+vi\s+sinh|probiotic|dung\s+dịch\s+nhỏ|thuốc\s+xịt|thuốc\s+bôi)\b)",
        RegexOptions.Compiled)]
    private static partial Regex MedicalContextRegex();

    // 3. Nhận diện triệu chứng bệnh lý thông thường
    [GeneratedRegex(
        @"(?i)\b(sốt|sot|đau\s+đầu|dau\s+dau|đau\s+bụng|dau\s+bung|đau\s+họng|dau\s+hong|cảm\s+cúm|cam\s+cum|cảm|cam|ho|sổ\s+mũi|so\s+mui|nghẹt\s+mũi|nghet\s+mui|tiêu\s+chảy|tieu\s+chay|mệt|met|dị\s+ứng|di\s+ung|mề\s+đay|me\s+day|buồn\s+nôn|buon\s+non|nôn\s+mửa|non\s+mua)\b",
        RegexOptions.Compiled)]
    private static partial Regex SymptomWordsRegex();

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

        // 1. Kiểm tra Chào hỏi & Năng lực
        if (IsCapabilitiesOrGreeting(q))
        {
            return new IntentClassificationResult(
                QueryIntent.GreetingOrCapabilities,
                null,
                "Câu chào hỏi hoặc hỏi về năng lực trợ lý."
            );
        }

        // 2. Tìm kiếm tên thuốc / hoạt chất trong câu hỏi
        string? detectedDrug = DetectDrugName(q);

        // 3. Nếu KHÔNG có tên thuốc cụ thể mà câu hỏi chỉ nói về triệu chứng bệnh
        if (detectedDrug == null && HasSymptomWithoutDrug(q))
        {
            return new IntentClassificationResult(
                QueryIntent.VagueSymptomsOnly,
                null,
                "Người dùng chỉ nêu triệu chứng mơ hồ, chưa có tên thuốc cụ thể."
            );
        }

        // 4. Kiểm tra ngữ cảnh y tế / cho con bú
        bool hasMedicalContext = MedicalContextRegex().IsMatch(q) || detectedDrug != null;

        // 5. Kiểm tra nếu câu hỏi rõ ràng thuộc các chủ đề ngoài lề (Out of Scope)
        bool matchesOutOfScope = ExplicitOutOfScopeRegex().IsMatch(q);

        if (matchesOutOfScope && !hasMedicalContext)
        {
            return new IntentClassificationResult(
                QueryIntent.OutOfScope,
                null,
                "Câu hỏi hoàn toàn thuộc chủ đề ngoài lề không liên quan đến y tế hoặc dược lý cho con bú."
            );
        }

        // 6. Nếu không phát hiện bất kỳ dấu hiệu y tế hay tên thuốc nào
        if (!hasMedicalContext)
        {
            return new IntentClassificationResult(
                QueryIntent.OutOfScope,
                null,
                "Câu hỏi ngoài lề, không chứa thông tin về thuốc hay sức khỏe phụ nữ cho con bú."
            );
        }

        return new IntentClassificationResult(
            QueryIntent.MedicationSafety,
            detectedDrug,
            "Câu hỏi hợp lệ về an toàn thuốc và dược lý cho phụ nữ cho con bú."
        );
    }

    private static bool HasSymptomWithoutDrug(string query)
    {
        var lower = query.ToLowerInvariant();
        return SymptomWordsRegex().IsMatch(lower);
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

        // Quét theo mẫu hậu tố dược lý (ví dụ: ampicillin, ciprofloxacin...)
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
}
