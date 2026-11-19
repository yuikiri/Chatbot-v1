using System.Text;
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
    // 1. Nhận diện các chủ đề hoàn toàn ngoài lề y tế (Lập trình, toán, giải trí, chính trị, ẩm thực, tài chính...)
    [GeneratedRegex(
        @"(?i)(\b(viết\s+code|lập\s+trình|python|javascript|typescript|c#|c\+\+|java|html|css|sql|react|vue|docker|kubernetes|linux|ubuntu|centos|git|github|database|cài\s+win|bug|hacker|wifi|source\s+code)\b|" +
        @"\b(tính\s+tích\s+phân|đạo\s+hàm|giải\s+phương\s+trình|bất\s+đẳng\s+thức|tam\s+giác|hình\s+học|toán\s+học|vật\s+lý|hóa\s+học\s+vô\s+cơ|định\s+lý)\b|" +
        @"\b(nấu\s+(phở|bún|canh|cơm|chè|bánh|lẩu|món|cháo)|cách\s+nấu|nấu\s+ăn|món\s+ăn|ẩm\s+thực|quán\s+ăn|nhà\s+hàng|làm\s+bánh|pha\s+cà\s+phê|công\s+thức\s+pha\s+chế)\b|" +
        @"\b(chứng\s+khoán|tiền\s+ảo|bitcoin|crypto|giá\s+vàng|đầu\s+tư|lãi\s+suất|vay\s+tiền|thị\s+trường\s+tài\s+chính|bất\s+động\s+sản)\b|" +
        @"\b(làm\s+thơ|viết\s+(bài\s+)?(văn|thơ|tiểu\s+thuyết|kịch\s+bản)|kể\s+chuyện\s+cười|hát\s+cho|chơi\s+game|playstation|xbox|liên\s+quân|pubg|free\s+fire|bóng\s+đá|world\s+cup|thể\s+thao)\b|" +
        @"\b(tổng\s+thống|chính\s+trị|bầu\s+cử|quân\s+sự|chiến\s+tranh|thủ\s+đô\s+của|dân\s+số\s+của|diện\s+tích\s+của)\b|" +
        @"\b(thời\s+tiết\s+hôm\s+nay|dự\s+báo\s+thời\s+tiết|xem\s+bói|tử\s+vi|cung\s+hoàng\s+đạo|phong\s+thủy|du\s+lịch|khách\s+sạn|vé\s+máy\s+bay|thời\s+trang|quần\s+áo|mỹ\s+phẩm)\b)",
        RegexOptions.Compiled)]
    private static partial Regex ExplicitOutOfScopeRegex();

    // 2. Nhận diện các từ khóa/thuật ngữ chuyên sâu về Nuôi con bằng sữa mẹ, tiết sữa, hậu sản (có dấu & không dấu)
    [GeneratedRegex(
        @"(?i)(\b(sữa|sua|sữa\s+mẹ|sua\s+me|sữa\s+non|sua\s+non|sữa\s+đầu|sua\s+dau|sữa\s+cuối|sua\s+cuoi|nguồn\s+sữa|nguon\s+sua|chất\s+lượng\s+sữa|sữa\s+công\s+thức|sua\s+cong\s+thuc|sữa\s+bị\s+chua|sữa\s+loãng|sua\s+loang|sữa\s+đặc|sua\s+dac)\b|" +
        @"\b(thiếu\s+sữa|thieu\s+sua|ít\s+sữa|it\s+sua|mất\s+sữa|mat\s+sua|hết\s+sữa|het\s+sua|giảm\s+sữa|giam\s+sua|chậm\s+sữa|chậm\s+về\s+sữa|tắc\s+sữa|tac\s+sua|tắc\s+tia|tac\s+tia|tắc\s+tia\s+sữa|tac\s+tia\s+sua|thông\s+tia|thong\s+tia|thông\s+sữa|thong\s+sua)\b|" +
        @"\b(cương\s+sữa|cuong\s+sua|căng\s+sữa|cang\s+sua|tức\s+ngực|tuc\s+nguc|đau\s+ngực|dau\s+nguc|áp\s+xe|ap\s+xe|áp\s+xe\s+vú|ap\s+xe\s+vu|viêm\s+tuyến\s+vú|viem\s+tuyen\s+vu|viêm\s+vú|viem\s+vu|nứt\s+cổ\s+gà|nut\s+co\s+ga|đau\s+núm\s+ti|dau\s+num\s+ti|rát\s+đầu\s+ti|núm\s+ti|num\s+ti|đầu\s+ti|dau\s+ti|ti\s+mẹ|ti\s+me)\b|" +
        @"\b(kích\s+sữa|kich\s+sua|tiết\s+sữa|tiet\s+sua|tạo\s+sữa|tao\s+sua|lợi\s+sữa|loi\s+sua|phản\s+xạ\s+xuống\s+sữa|phan\s+xa\s+xuong\s+sua|xuống\s+sữa|xuong\s+sua|giảm\s+tiết\s+sữa|ức\s+chế\s+tiết\s+sữa)\b|" +
        @"\b(cho\s+con\s+bú|cho\s+con\s+bu|cho\s+bé\s+bú|cho\s+be\s+bu|nuôi\s+con\s+bằng\s+sữa|nuoi\s+con\s+bang\s+sua|bú\s+mẹ|bu\s+me|cữ\s+bú|cu\s+bu|khớp\s+ngậm|khop\s+ngam|ngậm\s+bắt\s+vú|cai\s+sữa|cai\s+sua|dặm\s+sữa|dam\s+sua|bình\s+sữa|binh\s+sua|núm\s+trợ\s+ti)\b|" +
        @"\b(vắt\s+sữa|vat\s+sua|hút\s+sữa|hut\s+sua|máy\s+hút\s+sữa|may\s+hut\s+sua|trữ\s+sữa|tru\s+sua|bảo\s+quản\s+sữa|bao\s+quan\s+sua|rã\s+đông\s+sữa|hâm\s+sữa|ham\s+sua|túi\s+trữ\s+sữa)\b|" +
        @"\b(sau\s+sinh|hậu\s+sản|hau\s+san|ở\s+cữ|o\s+cu|mẹ\s+sau\s+sinh|me\s+sau\s+sinh|phụ\s+nữ\s+sau\s+sinh|phu\s+nu\s+sau\s+sinh|sản\s+phụ|san\s+phu|rạch\s+tầng\s+sinh\s+môn|sinh\s+mổ|sinh\s+mo|sinh\s+thường|sinh\s+thuong|sản\s+dịch|san\s+dich|co\s+hồi\s+tử\s+cung|trầm\s+cảm\s+sau\s+sinh|rụng\s+tóc\s+sau\s+sinh)\b|" +
        @"\b(thuốc\s+tránh\s+thai|thuoc\s+tranh\s+thai|tránh\s+thai|tranh\s+thai|ngừa\s+thai|ngua\s+thai|que\s+cấy|que\s+cay|đặt\s+vòng|dat\s+vong|giảm\s+cân\s+sau\s+sinh|giam\s+can\s+sau\s+sinh)\b|" +
        @"\b(thực\s+phẩm\s+lợi\s+sữa|ăn\s+gì\s+lợi\s+sữa|an\s+gi\s+loi\s+sua|ăn\s+gì\s+để\s+nhiều\s+sữa|ăn\s+gì\s+mất\s+sữa|an\s+gi\s+mat\s+sua|kiêng\s+gì\s+khi\s+cho\s+con\s+bú|chè\s+vằng|che\s+vang|cỏ\s+cà\s+ri|ngũ\s+cốc\s+lợi\s+sữa|lá\s+đinh\s+lăng|móng\s+giò|mong\s+gio)\b|" +
        @"\b(trẻ\s+bú|tre\s+bu|bé\s+bú|be\s+bu|trẻ\s+sơ\s+sinh|tre\s+so\s+sinh|em\s+bé|em\s+be|bỏ\s+bú|bo\s+bu|bú\s+kém|bu\s+kem|trớ\s+sữa|tro\s+sua|ọc\s+sữa|oc\s+sua|đầy\s+hơi|day\s+hoi|chướng\s+bụng|chuong\s+bung|phân\s+hoa\s+cà|xì\s+xoẹt|vàng\s+da\s+sơ\s+sinh|chậm\s+tăng\s+cân)\b)",
        RegexOptions.Compiled)]
    private static partial Regex LactationAndMaternalRegex();

    // 3. Nhận diện các từ khóa/thuật ngữ y tế, dược phẩm, công dụng và dùng thuốc (có dấu & không dấu)
    [GeneratedRegex(
        @"(?i)(\b(tác\s+dụng|tac\s+dung|có\s+tác\s+dụng\s+gì|co\s+tac\s+dung\s+gi|tác\s+dụng\s+gì|tac\s+dung\s+gi|công\s+dụng|cong\s+dung|công\s+dụng\s+gì|cong\s+dung\s+gi|dùng\s+để\s+làm\s+gì|dung\s+de\s+lam\s+gi|dùng\s+làm\s+gì|dung\s+lam\s+gi|chữa\s+bệnh\s+gì|chua\s+benh\s+gi|trị\s+bệnh\s+gì|tri\s+benh\s+gi|chữa\s+gì|chua\s+gi|trị\s+gì|tri\s+gi|uống\s+để\s+làm\s+gì|uong\s+de\s+lam\s+gi|uống\s+làm\s+gì|uong\s+lam\s+gi)\b|" +
        @"\b(thuốc|thuoc|hoạt\s+chất|hoat\s+chat|dược|duoc|dược\s+thư|dược\s+lý|duoc\s+ly|kháng\s+sinh|khang\s+sinh|giảm\s+đau|giam\s+dau|hạ\s+sốt|ha\s+sot|chống\s+viêm|chong\s+viem|kháng\s+histamin|khang\s+histamin|vắc\s*xin|vaccine|tiêm\s+chủng|tiem\s+chung|tiêm\s+phòng|tiem\s+phong)\b|" +
        @"\b(uống\s+được\s+không|uong\s+duoc\s+khong|uống\s+được\s+ko|uong\s+duoc\s+ko|dùng\s+được\s+không|dung\s+duoc\s+khong|dùng\s+được\s+ko|dung\s+duoc\s+ko|uống\s+khi\s+cho\s+con\s+bú|uong\s+khi\s+cho\s+con\s+bu|dùng\s+khi\s+cho\s+con\s+bú|dung\s+khi\s+cho\s+con\s+bu|có\s+ảnh\s+hưởng|co\s+anh\s+huong|an\s+toàn|an\s+toan|tác\s+dụng\s+phụ|tac\s+dung\s+phu)\b|" +
        @"\b(liều\s+dùng|lieu\s+dung|quá\s+liều|qua\s+lieu|thời\s+gian\s+bán\s+thải|thoi\s+gian\s+ban\s+thai|nồng\s+độ\s+đỉnh|nong\s+do\s+dinh|dược\s+động\s+học|duoc\s+dong\s+hoc|chỉ\s+định|chi\s+dinh|chống\s+chỉ\s+định|chong\s+chi\s+dinh|thời\s+điểm\s+uống|thoi\s+diem\s+uong|bài\s+tiết|bai\s+tiet|tương\s+tác\s+thuốc|tuong\s+tac\s+thuoc)\b|" +
        @"\b(bệnh|benh|bệnh\s+lý|benh\s+ly|chẩn\s+đoán|chan\s+doan|điều\s+trị|dieu\s+tri|khám\s+bệnh|kham\s+benh|bác\s+sĩ|bac\s+si|dược\s+sĩ|duoc\s+si|y\s+tế|y\s+te|bệnh\s+viện|benh\s+vien|phòng\s+khám|phong\s+kham|đơn\s+thuốc|don\s+thuoc|kê\s+đơn|ke\s+don)\b|" +
        @"\b(sốt|sot|đau\s+đầu|dau\s+dau|đau\s+bụng|dau\s+bung|cảm\s+cúm|cam\s+cum|viêm\s+họng|viem\s+hong|ho|nghẹt\s+mũi|nghet\s+mui|tiêu\s+chảy|tieu\s+chay|dị\s+ứng|di\s+ung|mề\s+đay|me\s+day|nôn\s+trớ|non\s+tro|mệt\s+mỏi|met\s+moi|nhiễm\s+trùng|nhiem\s+trung|nhiễm\s+khuẩn|nhiem\s+khuan|nấm\s+núm\s+ti|tưa\s+lưỡi|tua\s+luoi)\b|" +
        @"\b(vitamin|khoáng\s+chất|khoang\s+chat|viên\s+sắt|vien\s+sat|canxi|calcium|dha|kẽm|kem|zinc|magie|magnesium|men\s+vi\s+sinh|probiotic|dung\s+dịch\s+nhỏ|thuốc\s+xịt|thuoc\s+xit|thuốc\s+bôi|thuoc\s+boi|siro|viên\s+ngậm|vien\s+ngam)\b)",
        RegexOptions.Compiled)]
    private static partial Regex GeneralMedicalRegex();

    // 4. Nhận diện các hậu tố hoặc tên hoạt chất dược lý phổ biến (bao gồm cả chuẩn quốc tế và phiên âm Việt ngữ)
    [GeneratedRegex(
        @"(?i)\b[a-z]{3,}(cillin|cilin|xilin|xylyn|silin|mycin|mycine|myxin|micin|cycline|cyclin|xiclin|floxacin|floxacine|statin|prazole|prazol|olol|sartan|tadine|fen|mol|zol|pril|xine|mab|vir|caine|dopa|dine|pine|zone|asone)\b",
        RegexOptions.Compiled)]
    private static partial Regex DrugPatternRegex();

    private static readonly HashSet<string> KnownDrugs = new(StringComparer.OrdinalIgnoreCase)
    {
        // Kháng sinh nhóm Beta-lactam & Penicillin (bao gồm cả các biến thể chính tả, phiên âm tiếng Việt)
        "penicillin", "penicilin", "penixilin", "penixylyn", "penisilin", "penicilline", "peniciline",
        "amoxicillin", "amoxicilin", "amox", "amoxi", "amoxixilin", "amoxycillin", "augmentin",
        "ampicillin", "ampicilin", "ampixilin",
        "cephalexin", "cefalexin", "keflex", "cefixime", "cefuroxime", "ceftriaxone", "cefotaxime", "cefadroxil",

        // Kháng sinh nhóm khác
        "azithromycin", "zithromax", "azithro", "erythromycin", "erythro", "clarithromycin",
        "ciprofloxacin", "cipro", "levofloxacin", "ofloxacin",
        "metronidazole", "flagyl", "clindamycin", "doxycycline", "tetracycline", "tetraxiclin", "tetra",
        "bactrim", "cotrimoxazol", "gentamicin", "tobramycin", "vancomycin",

        // Giảm đau, hạ sốt, kháng viêm (NSAIDs & Paracetamol)
        "paracetamol", "acetaminophen", "panadol", "hapacol", "efferalgan", "tylenol", "paracold", "paraxetamol", "para",
        "ibuprofen", "advil", "motrin", "ibu", "ibuprophen",
        "aspirin", "aspirine", "axpirin", "naproxen", "diclofenac", "celecoxib",
        "meloxicam", "mefenamic", "tramadol", "codeine",

        // Corticoid kháng viêm
        "prednisone", "prednisolone", "methylprednisolone", "medrol", "dexamethasone", "dexa", "betamethasone",

        // Dị ứng, cảm cúm, hô hấp & Thông mũi
        "loratadine", "claritin", "cetirizine", "zyrtec", "fexofenadine", "telfast", "chlorpheniramine", "clorpheniramin",
        "pseudoephedrine", "sudafed", "decolgen", "phenylephrine", "oxymetazoline",
        "dextromethorphan", "bromhexine", "ambroxol", "acetylcysteine", "salbutamol", "ventolin", "albuterol", "montelukast",

        // Sức khỏe sinh sản, tránh thai & Nội tiết
        "estrogen", "progestin", "progesterone", "levonorgestrel", "desogestrel",

        // Hoạt chất da liễu & bôi núm vú
        "lanolin",

        // Hoạt chất giảm cân
        "sibutramine", "phenolphthalein",

        // Tiêu hóa & Dạ dày
        "omeprazole", "esomeprazole", "nexium", "pantoprazole", "rabeprazole", "lansoprazole", "ranitidine", "famotidine",
        "domperidone", "motilium", "metoclopramide", "loperamide", "smecta", "berberin", "simethicone", "phosphalugel",

        // Vitamin, vi chất & Khoáng chất
        "vitamin", "canxi", "calcium", "sat", "sắt", "iron", "kem", "kẽm", "zinc", "magie", "magnesium",
        "folic", "dha", "epa", "omega", "probiotic", "bioamicus", "biogaia"
    };

    // Bảng tra cứu ngữ âm (Phonetic Key -> Canonical Drug) hỗ trợ nhận diện từ lóng/sai chính tả
    private static readonly Dictionary<string, string> PhoneticDrugMap = BuildPhoneticDrugMap();

    private static Dictionary<string, string> BuildPhoneticDrugMap()
    {
        var map = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        foreach (var drug in KnownDrugs)
        {
            var key = PhoneticKey(drug);
            if (!string.IsNullOrEmpty(key) && !map.ContainsKey(key))
            {
                map[key] = drug;
            }
        }
        return map;
    }

    public IntentClassificationResult Classify(string query, string mode = "strict")
    {
        var q = query.Trim();
        var rawMode = (mode ?? "strict").Trim().ToLowerInvariant();
        mode = rawMode switch
        {
            "flexible" or "easy" or "de dang" or "dễ dàng" or "mo rong" or "mở rộng" or "quoc te" or "quốc tế" => "flexible",
            "balanced" or "can bang" or "cân bằng" or "tong hop" or "tổng hợp" => "balanced",
            _ => "strict"
        };

        // 1. Kiểm tra Chào hỏi & Năng lực bot
        if (IsCapabilitiesOrGreeting(q))
        {
            return new IntentClassificationResult(
                QueryIntent.GreetingOrCapabilities,
                null,
                "Câu chào hỏi hoặc hỏi về năng lực trợ lý."
            );
        }

        // 2. Tìm kiếm tên thuốc / hoạt chất cụ thể trong câu hỏi (chuẩn hóa ngữ âm, sửa lỗi chính tả)
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
            // Nếu có nhắc đến chữ "thuốc" kết hợp với sữa mẹ
            if (q.Contains("thuốc", StringComparison.OrdinalIgnoreCase) || 
                q.Contains("thuoc", StringComparison.OrdinalIgnoreCase) || 
                q.Contains("uống gì", StringComparison.OrdinalIgnoreCase) ||
                q.Contains("uong gi", StringComparison.OrdinalIgnoreCase))
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

            // Nếu câu hỏi về công dụng, tác dụng, cách dùng thuốc
            if (IsMedicationUsageQuery(q))
            {
                string? candidate = ExtractPotentialDrugCandidate(q);
                return new IntentClassificationResult(
                    QueryIntent.MedicationSafety,
                    candidate,
                    "Câu hỏi về công dụng, tác dụng hoặc cách dùng thuốc trong y tế."
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

        // 7. Xử lý các câu hỏi về công dụng/cách dùng thuốc chưa có tên thuốc trong từ điển cứng
        if (IsMedicationUsageQuery(q))
        {
            string? candidate = ExtractPotentialDrugCandidate(q);
            return new IntentClassificationResult(
                QueryIntent.MedicationSafety,
                candidate,
                "Câu hỏi về công dụng, tác dụng hoặc cách dùng thuốc trong y tế."
            );
        }

        // 8. Xử lý theo CHẾ ĐỘ RAG:
        // Ở chế độ "flexible" (Tra cứu Quốc tế / Chế độ dễ dàng, mở rộng):
        // Khi câu hỏi KHÔNG thuộc ExplicitOutOfScope và có ngữ cảnh sức khỏe
        if (mode == "flexible" && IsHealthRelatedQuery(q))
        {
            string? potentialDrug = ExtractPotentialDrugCandidate(q);
            if (!string.IsNullOrEmpty(potentialDrug))
            {
                return new IntentClassificationResult(
                    QueryIntent.MedicationSafety,
                    potentialDrug,
                    $"Chế độ Tra cứu Quốc tế (Mở rộng): Tiếp nhận câu hỏi tra cứu hoạt chất '{potentialDrug}'."
                );
            }

            return new IntentClassificationResult(
                QueryIntent.LactationCounseling,
                null,
                "Chế độ Tra cứu Quốc tế (Mở rộng): Tiếp nhận câu hỏi tư vấn sức khỏe lâm sàng."
            );
        }

        // 9. Nếu hoàn toàn không chứa bất kỳ từ khóa y tế, dược phẩm hay nuôi con nào
        return new IntentClassificationResult(
            QueryIntent.OutOfScope,
            null,
            "Câu hỏi không chứa thông tin y tế, dược phẩm hoặc chăm sóc nuôi con bằng sữa mẹ."
        );
    }

    // Overload giữ tính tương thích ngược
    public IntentClassificationResult Classify(string query) => Classify(query, "strict");

    public string? DetectDrugName(string query)
    {
        var tokens = query
            .ToLowerInvariant()
            .Split(new[] { ' ', ',', '.', '?', '!', ';', ':', '-', '(', ')', '[', ']', '/', '\\', '"', '\'', '`', '~', '\n', '\r', '\t' },
                   StringSplitOptions.RemoveEmptyEntries);

        // 1. Quét trong từ điển thuốc chuẩn trực tiếp
        foreach (var t in tokens)
        {
            var clean = t.Trim().Trim('`', '\'', '"');
            if (clean.Length >= 3 && KnownDrugs.Contains(clean))
            {
                return NormalizeDrugName(clean);
            }
        }

        // 2. Quét qua thuật toán Phonetic Key (bắt các biến thể phiên âm như penixylyn, penixilin, amoxixilin...)
        foreach (var t in tokens)
        {
            var clean = t.Trim().Trim('`', '\'', '"');
            if (clean.Length >= 4)
            {
                var pKey = PhoneticKey(clean);
                if (!string.IsNullOrEmpty(pKey) && PhoneticDrugMap.TryGetValue(pKey, out var matchedDrug))
                {
                    return NormalizeDrugName(matchedDrug);
                }
            }
        }

        // 3. Quét theo khoảng cách Levenshtein (cho các trường hợp gõ nhầm 1-2 ký tự)
        foreach (var t in tokens)
        {
            var clean = t.Trim().Trim('`', '\'', '"');
            if (clean.Length >= 5)
            {
                foreach (var known in KnownDrugs)
                {
                    if (Math.Abs(clean.Length - known.Length) <= 2)
                    {
                        int dist = LevenshteinDistance(clean, known);
                        if (dist <= 2)
                        {
                            return NormalizeDrugName(known);
                        }
                    }
                }
            }
        }

        // 4. Quét theo mẫu hậu tố dược lý quốc tế và phiên âm (ví dụ: ampicillin, ciprofloxacin, omeprazole...)
        foreach (var t in tokens)
        {
            var clean = t.Trim().Trim('`', '\'', '"');
            if (clean.Length >= 4 && DrugPatternRegex().IsMatch(clean))
            {
                return NormalizeDrugName(clean);
            }
        }

        return null;
    }

    public static string NormalizeDrugName(string raw)
    {
        var lower = (raw ?? "").Trim().ToLowerInvariant().Trim('`', '\'', '"');
        return lower switch
        {
            // Nhóm Penicillin
            "penixylyn" or "penixilin" or "penicilin" or "penisilin" or "penicillin" or "penicilline" or "peniciline" or "penicillin-v" or "penicillin-g" => "penicillin",

            // Nhóm Paracetamol
            "hapacol" or "panadol" or "efferalgan" or "tylenol" or "paracold" or "paraxetamol" or "para" or "acetaminophen" => "paracetamol",

            // Nhóm Ibuprofen & NSAIDs
            "advil" or "motrin" or "ibu" or "ibuprophen" => "ibuprofen",
            "aspirine" or "axpirin" => "aspirin",

            // Kháng sinh khác
            "augmentin" or "amox" or "amoxi" or "amoxicilin" or "amoxixilin" or "amoxycillin" => "amoxicillin",
            "ampicilin" or "ampixilin" => "ampicillin",
            "keflex" or "cefalexin" or "cefalexine" => "cephalexin",
            "zithromax" or "azithro" => "azithromycin",
            "erythro" => "erythromycin",
            "cipro" => "ciprofloxacin",
            "tetraxiclin" or "tetra" => "tetracycline",

            // Dị ứng, dạ dày
            "claritin" => "loratadine",
            "zyrtec" => "cetirizine",
            "nexium" => "esomeprazole",
            "smecta" => "diosmectite",
            "motilium" => "domperidone",
            "dexa" => "dexamethasone",
            "medrol" => "methylprednisolone",
            _ => lower
        };
    }

    // Thuật toán chuẩn hóa ngữ âm tiếng Việt & quốc tế cho tên thuốc
    private static string PhoneticKey(string raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return string.Empty;
        var s = raw.Trim().ToLowerInvariant().Trim('`', '\'', '"');

        // 1. Chuyển y -> i (penixylyn -> penixilin, amoxycillin -> amoxicillin)
        s = s.Replace('y', 'i');

        // 2. Chuyển x -> c trước i, e hoặc ở đầu/đuôi (penixilin -> penicilin, paraxetamol -> paracetamol)
        s = Regex.Replace(s, @"x(?=[ie])", "c");
        s = Regex.Replace(s, @"xil", "cil");
        s = Regex.Replace(s, @"x(?=$)", "c");

        // 3. Chuyển đuôi silin -> cilin (penisilin -> penicilin)
        s = Regex.Replace(s, @"sil+in(e)?$", "cilin");

        // 4. Khử phụ âm đôi liên tiếp (ll -> l, tt -> t, pp -> p, ss -> s, mm -> m, ff -> f, cc -> c, nn -> n)
        var sb = new StringBuilder(s.Length);
        char prev = '\0';
        foreach (var ch in s)
        {
            if (ch == prev && "lptmfscdnbr".Contains(ch))
            {
                continue;
            }
            sb.Append(ch);
            prev = ch;
        }

        // 5. Bỏ chữ 'e' câm ở cuối nếu là dạng tiếng Anh/Pháp (aspirine -> aspirin, ampicilline -> ampicillin)
        var res = sb.ToString();
        if (res.Length > 4 && res.EndsWith('e') && !res.EndsWith("ine") && !res.EndsWith("one") && !res.EndsWith("ole"))
        {
            res = res[..^1];
        }

        return res;
    }

    private static int LevenshteinDistance(string s, string t)
    {
        if (string.IsNullOrEmpty(s)) return t?.Length ?? 0;
        if (string.IsNullOrEmpty(t)) return s.Length;

        int n = s.Length;
        int m = t.Length;
        int[,] d = new int[n + 1, m + 1];

        for (int i = 0; i <= n; i++) d[i, 0] = i;
        for (int j = 0; j <= m; j++) d[0, j] = j;

        for (int i = 1; i <= n; i++)
        {
            for (int j = 1; j <= m; j++)
            {
                int cost = (s[i - 1] == t[j - 1]) ? 0 : 1;
                d[i, j] = Math.Min(
                    Math.Min(d[i - 1, j] + 1, d[i, j - 1] + 1),
                    d[i - 1, j - 1] + cost);
            }
        }

        return d[n, m];
    }

    private static bool IsMedicationUsageQuery(string query)
    {
        var q = query.Trim().ToLowerInvariant();
        string[] indicators = new[]
        {
            "tác dụng", "tac dung", "công dụng", "cong dung", "dùng để", "dung de", "dùng làm", "dung lam",
            "chữa", "chua", "trị", "tri", "uống để", "uong de", "chỉ định", "chi dinh",
            "uống thế nào", "uong the nao", "dùng thế nào", "dung the nao", "cách dùng", "cach dung",
            "uống được không", "uong duoc khong", "uống được ko", "uong duoc ko",
            "an toàn không", "an toan khong", "tác dụng phụ", "tac dung phu", "có hại không", "co hai khong",
            "uống sao", "uong sao", "dùng sao", "dung sao", "ngày mấy viên", "ngay may vien"
        };

        return indicators.Any(ind => q.Contains(ind, StringComparison.OrdinalIgnoreCase));
    }

    private static bool IsHealthRelatedQuery(string query)
    {
        var q = query.Trim().ToLowerInvariant();
        string[] indicators = new[]
        {
            "sức khỏe", "suc khoe", "bệnh", "benh", "ốm", "om", "đau", "dau", "viêm", "viem",
            "mệt", "met", "sốt", "sot", "dị ứng", "di ung", "ngứa", "ngua", "uống", "uong",
            "tiêm", "tiem", "thuốc", "thuoc", "mẹ", "me", "bé", "be", "con", "bú", "bu",
            "sữa", "sua", "ăn kiêng", "an kieng", "dinh dưỡng", "dinh duong", "tác dụng", "tac dung",
            "công dụng", "cong dung", "liều", "lieu", "kháng sinh", "khang sinh", "an toàn", "an toan"
        };

        return indicators.Any(ind => q.Contains(ind, StringComparison.OrdinalIgnoreCase));
    }

    private static string? ExtractPotentialDrugCandidate(string query)
    {
        var tokens = query
            .ToLowerInvariant()
            .Split(new[] { ' ', ',', '.', '?', '!', ';', ':', '-', '(', ')', '[', ']', '/', '\\', '"', '\'', '`', '~', '\n', '\r', '\t' },
                   StringSplitOptions.RemoveEmptyEntries);

        var stopWords = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "co", "có", "tac", "tác", "dung", "dụng", "gi", "gì", "la", "là", "uong", "uống",
            "nhu", "như", "the", "thế", "nao", "nào", "sao", "duoc", "được", "khong", "không", "ko",
            "bi", "bị", "toi", "tôi", "em", "minh", "mình", "cho", "con", "bu", "bú", "me", "mẹ",
            "hay", "hãy", "va", "và", "voi", "với", "o", "ở", "trong", "khi", "luc", "lúc",
            "sau", "truoc", "trước", "nay", "này", "do", "đó", "thi", "thì", "sẽ", "se",
            "can", "cần", "phai", "phải", "nen", "nên", "hoi", "hỏi", "giup", "giúp", "lam", "làm",
            "de", "để", "chua", "chữa", "tri", "trị", "benh", "bệnh", "thuoc", "thuốc", "loai", "loại",
            "vien", "viên", "lieu", "liều", "an", "toan", "toàn", "hai", "hại", "tot", "tốt"
        };

        foreach (var t in tokens)
        {
            var clean = t.Trim().Trim('`', '\'', '"');
            if (clean.Length >= 3 && !stopWords.Contains(clean) && clean.All(char.IsLetter))
            {
                return NormalizeDrugName(clean);
            }
        }

        return null;
    }

    private static bool IsCapabilitiesOrGreeting(string query)
    {
        var q = query.Trim().ToLowerInvariant().Trim('.', '?', '!', ',', ';', ':', ' ', '`');

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
        var q = query.Trim().ToLowerInvariant().Trim('.', '?', '!', ',', ' ', '`');

        string[] vaguePhrases = new[]
        {
            "bị sốt", "bi sot", "tôi bị sốt", "toi bi sot", "em bị sốt", "em bi sot", "đang bị sốt", "dang bi sot",
            "bị đau đầu", "bi dau dau", "tôi bị đau đầu", "toi bi dau dau", "đau đầu", "dau dau",
            "bị đau bụng", "bi dau bung", "bị tiêu chảy", "bi tieu chay", "bị cảm cúm", "bi cam cum",
            "bị cảm", "bi cam", "bị ho", "bi ho", "đau họng", "dau hong", "bị mệt", "bi met", "bị viêm họng", "bi viem hong"
        };

        foreach (var phrase in vaguePhrases)
        {
            if (q == phrase || q == $"{phrase} thì sao" || q == $"{phrase} làm sao" || q == $"{phrase} phải làm sao" ||
                q == $"{phrase} thi sao" || q == $"{phrase} lam sao" || q == $"{phrase} phai lam sao")
            {
                return true;
            }
        }

        return false;
    }
}
