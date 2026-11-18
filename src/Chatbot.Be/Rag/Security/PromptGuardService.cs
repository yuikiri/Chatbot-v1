using System.Text.RegularExpressions;

namespace Chatbot.Rag.Security;

public enum SecurityRiskLevel
{
    Safe = 0,
    PromptInjection = 1,
    SelfHarmEmergency = 2
}

public record SecurityEvaluationResult(
    SecurityRiskLevel RiskLevel,
    string? ThreatDescription,
    string SanitizedQuery
);

public partial class PromptGuardService
{
    // 1. Regex nhận diện Prompt Injection / Jailbreak / Override quy tắc
    [GeneratedRegex(
        @"(?i)(ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|rules|prompts|directives|constraints)|" +
        @"disregard\s+(all\s+)?(previous|prior|instructions)|" +
        @"forget\s+(all\s+|your\s+)?(rules|instructions|prompts|identity)|" +
        @"bỏ\s+qua\s+(tất\s+cả\s+|mọi\s+)?(quy\s+tắc|chỉ\s+dẫn|hướng\s+dẫn|lời\s+nhắc|luật)|" +
        @"quên\s+(hết|tất\s+cả|đi)?\s*(các\s+)?(quy\s+tắc|chỉ\s+dẫn|hướng\s+dẫn|lời\s+nhắc)|" +
        @"\b(jailbreak|dan\s+mode|developer\s+mode|unrestricted\s+ai)\b|" +
        @"bây\s+giờ\s+bạn\s+là|từ\s+giờ\s+bạn\s+là|hãy\s+đóng\s+vai\s+(một\s+)?(hacker|người\s+khác|ai\s+đó)|" +
        @"you\s+are\s+now\s+(an?\s+)?|pretend\s+you\s+are\s+|act\s+as\s+(an?\s+)?(unrestricted|evil|hacker)|" +
        @"show\s+(me\s+)?(your\s+)?(system\s+prompt|instructions|rules)|" +
        @"reveal\s+(your\s+)?(system\s+prompt|instructions)|" +
        @"repeat\s+(the\s+)?(text|words)\s+above|" +
        @"(in|hiển\s+thị|cho\s+xem)\s+(ra\s+)?(toàn\s+bộ\s+)?(system\s+prompt|lời\s+nhắc\s+hệ\s+thống|hướng\s+dẫn\s+hệ\s+thống|prompt\s+ban\s+đầu)|" +
        @"what\s+is\s+your\s+system\s+prompt|câu\s+lệnh\s+hệ\s+thống\s+của\s+bạn)",
        RegexOptions.Compiled)]
    private static partial Regex PromptInjectionRegex();

    // 2. Regex nhận diện Tự hại / Uống thuốc tự tử / Ngộ độc cấp tính
    [GeneratedRegex(
        @"(?i)(\b(tự\s+tử|tự\s+sát|suicide|kill\s+myself|muốn\s+chết|muon\s+chet|kết\s+liễu\s+cuộc\s+đời)\b|" +
        @"uống\s+(bao\s+nhiêu\s+viên|mấy\s+vỉ|thuốc\s+gì)\s+để\s+(chết|tự\s+tử|ra\s+đi)|" +
        @"uống\s+hết\s+(cả\s+)?(vỉ|lọ|hộp|chai)\s+thuốc\s+(để|thì\s+có\s+chết)|" +
        @"liều\s+(chết|gây\s+chết|tử\s+vong|chết\s+người)\s+của|" +
        @"ngộ\s+độc\s+thuốc\s+cấp|uống\s+nhầm\s+thuốc\s+trừ\s+sâu|uống\s+nhầm\s+hóa\s+chất)",
        RegexOptions.Compiled)]
    private static partial Regex SelfHarmEmergencyRegex();

    // 3. Regex khử trùng delimiter nhạy cảm do người dùng cố tình chèn vào
    [GeneratedRegex(
        @"(?i)(:::MEDICAL_DISCLAIMER:::|\[CHUYÊN\s+LUẬN[^\]]*\]|</?patient_query>|</?system>|</?context>|```markdown|```system)",
        RegexOptions.Compiled)]
    private static partial Regex DelimiterSanitizeRegex();

    public SecurityEvaluationResult Evaluate(string rawQuery)
    {
        if (string.IsNullOrWhiteSpace(rawQuery))
        {
            return new SecurityEvaluationResult(SecurityRiskLevel.Safe, null, string.Empty);
        }

        // Bước 1: Khử trùng ký tự phân tách nhạy cảm
        string sanitized = DelimiterSanitizeRegex().Replace(rawQuery, " ").Trim();
        sanitized = Regex.Replace(sanitized, @"\s{2,}", " ");

        // Bước 2: Kiểm tra Tự hại & Nguy cấp (Ưu tiên số 1 vì mạng sống con người)
        if (SelfHarmEmergencyRegex().IsMatch(sanitized))
        {
            return new SecurityEvaluationResult(
                SecurityRiskLevel.SelfHarmEmergency,
                "Phát hiện nội dung có nguy cơ tự hại hoặc ngộ độc cấp tính.",
                sanitized
            );
        }

        // Bước 3: Kiểm tra Prompt Injection / Jailbreak
        if (PromptInjectionRegex().IsMatch(sanitized))
        {
            return new SecurityEvaluationResult(
                SecurityRiskLevel.PromptInjection,
                "Phát hiện chỉ thị can thiệp quy tắc hoặc cố tình jailbreak hệ thống.",
                sanitized
            );
        }

        return new SecurityEvaluationResult(SecurityRiskLevel.Safe, null, sanitized);
    }
}
