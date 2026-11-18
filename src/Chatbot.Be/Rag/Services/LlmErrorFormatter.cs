using System.Net;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace Chatbot.Rag.Services;

public record FormattedErrorInfo(
    string ErrorCode,
    string UserMessage,
    string AdminSummary,
    int? StatusCode,
    string? RawErrorDetails
);

public static class LlmErrorFormatter
{
    public static FormattedErrorInfo Format(Exception ex, string? provider = null, string? model = null)
    {
        string rawMessage = ex.InnerException != null ? $"{ex.Message} -> {ex.InnerException.Message}" : ex.Message;
        string prov = (provider ?? "AI Model").Trim();
        string mdl = (model ?? "hiện tại").Trim();

        int? statusCode = null;
        if (ex is HttpRequestException httpEx && httpEx.StatusCode.HasValue)
        {
            statusCode = (int)httpEx.StatusCode.Value;
        }
        else
        {
            var match = Regex.Match(rawMessage, @"\b(400|401|403|404|429|500|502|503|504)\b");
            if (match.Success && int.TryParse(match.Value, out int sc))
            {
                statusCode = sc;
            }
        }

        // 1. Quota Exceeded / Rate Limit (429)
        if (statusCode == 429 || 
            rawMessage.Contains("RESOURCE_EXHAUSTED", StringComparison.OrdinalIgnoreCase) ||
            rawMessage.Contains("quota", StringComparison.OrdinalIgnoreCase) ||
            rawMessage.Contains("rate limit", StringComparison.OrdinalIgnoreCase))
        {
            return new FormattedErrorInfo(
                ErrorCode: "MODEL_QUOTA_EXCEEDED",
                UserMessage: $"Hạn mức (Quota) của mô hình '{mdl}' đã tạm thời đạt giới hạn. Hệ thống đang tự động chuyển sang mô hình dự phòng tiếp theo. Quý khách vui lòng gửi lại câu hỏi sau giây lát.",
                AdminSummary: $"[Lỗi Quota 429] Provider: {prov} | Model: {mdl} | Đã hết quota token hoặc rate limit. Cần kích hoạt failover cascade hoặc đổi sang model khác.",
                StatusCode: 429,
                RawErrorDetails: CleanRawError(rawMessage)
            );
        }

        // 2. Model Not Found / Unsupported (404)
        if (statusCode == 404 || 
            rawMessage.Contains("NOT_FOUND", StringComparison.OrdinalIgnoreCase) ||
            rawMessage.Contains("not found", StringComparison.OrdinalIgnoreCase))
        {
            return new FormattedErrorInfo(
                ErrorCode: "MODEL_NOT_FOUND",
                UserMessage: $"Mô hình AI '{mdl}' hiện không tồn tại trên hệ thống hoặc API version hiện tại chưa hỗ trợ. Vui lòng mở trang Quản trị để chọn mô hình hợp lệ.",
                AdminSummary: $"[Lỗi Model 404] Provider: {prov} | Model: {mdl} | Tên model không tồn tại trên endpoint nhà cung cấp. Kiểm tra danh mục models.catalog.json.",
                StatusCode: 404,
                RawErrorDetails: CleanRawError(rawMessage)
            );
        }

        // 3. API Key Invalid / Unauthorized (401 / 403)
        if (statusCode == 401 || statusCode == 403 ||
            rawMessage.Contains("API_KEY_INVALID", StringComparison.OrdinalIgnoreCase) ||
            rawMessage.Contains("UNAUTHENTICATED", StringComparison.OrdinalIgnoreCase) ||
            rawMessage.Contains("permission", StringComparison.OrdinalIgnoreCase) ||
            rawMessage.Contains("unauthorized", StringComparison.OrdinalIgnoreCase))
        {
            return new FormattedErrorInfo(
                ErrorCode: "INVALID_API_KEY",
                UserMessage: $"Khóa API Key của dịch vụ AI ({prov}) không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại cấu hình API Key trong trang Quản trị.",
                AdminSummary: $"[Lỗi Xác thực 401/403] Provider: {prov} | API Key không chính xác hoặc tài khoản bị khóa quyền truy cập model '{mdl}'.",
                StatusCode: statusCode ?? 401,
                RawErrorDetails: CleanRawError(rawMessage)
            );
        }

        // 4. Timeout / Mất kết nối
        if (ex is TaskCanceledException || ex is TimeoutException ||
            rawMessage.Contains("timeout", StringComparison.OrdinalIgnoreCase) ||
            rawMessage.Contains("deadline", StringComparison.OrdinalIgnoreCase) ||
            rawMessage.Contains("connection refused", StringComparison.OrdinalIgnoreCase))
        {
            return new FormattedErrorInfo(
                ErrorCode: "REQUEST_TIMEOUT",
                UserMessage: $"Quá thời gian kết nối (Timeout) tới máy chủ AI ({prov}). Mạng truyền dữ liệu tạm thời gián đoạn, quý khách vui lòng thử lại sau giây lát.",
                AdminSummary: $"[Lỗi Timeout] Provider: {prov} | Model: {mdl} | Quá thời gian phản hồi (vượt ngưỡng timeout).",
                StatusCode: 408,
                RawErrorDetails: CleanRawError(rawMessage)
            );
        }

        // 5. Bad Request / Invalid Argument (400)
        if (statusCode == 400 || rawMessage.Contains("INVALID_ARGUMENT", StringComparison.OrdinalIgnoreCase))
        {
            return new FormattedErrorInfo(
                ErrorCode: "BAD_REQUEST",
                UserMessage: $"Yêu cầu gửi tới mô hình AI '{mdl}' không đúng cú pháp quy định. Vui lòng kiểm tra lại tham số câu hỏi hoặc cấu hình prompt.",
                AdminSummary: $"[Lỗi Cú pháp 400] Provider: {prov} | Model: {mdl} | Tham số request không hợp lệ.",
                StatusCode: 400,
                RawErrorDetails: CleanRawError(rawMessage)
            );
        }

        // 6. Lỗi máy chủ nhà cung cấp (500 / 502 / 503 / 504)
        if (statusCode >= 500)
        {
            return new FormattedErrorInfo(
                ErrorCode: "UPSTREAM_SERVER_ERROR",
                UserMessage: $"Máy chủ nhà cung cấp AI ({prov}) đang quá tải hoặc gặp sự cố kỹ thuật tạm thời (Mã lỗi {statusCode}). Vui lòng thử lại sau.",
                AdminSummary: $"[Lỗi Máy chủ {statusCode}] Provider: {prov} | Model: {mdl} | Máy chủ upstream phản hồi lỗi nội bộ.",
                StatusCode: statusCode,
                RawErrorDetails: CleanRawError(rawMessage)
            );
        }

        // 7. Fallback tổng quát sạch sẽ
        string cleanMsg = CleanRawError(rawMessage);
        return new FormattedErrorInfo(
            ErrorCode: "SYSTEM_ERROR",
            UserMessage: $"Hệ thống tư vấn y tế gặp sự cố phản hồi ({cleanMsg}). Vui lòng thử lại hoặc tham khảo ý kiến bác sĩ trực tiếp.",
            AdminSummary: $"[Sự cố không xác định] Provider: {prov} | Model: {mdl} | Chi tiết: {cleanMsg}",
            StatusCode: statusCode ?? 500,
            RawErrorDetails: cleanMsg
        );
    }

    private static string CleanRawError(string raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return "Lỗi không xác định.";

        // Nếu chuỗi chứa JSON error message của Google hoặc OpenAI, thử trích xuất phần text ý nghĩa
        try
        {
            var match = Regex.Match(raw, @"\{.*\}", RegexOptions.Singleline);
            if (match.Success)
            {
                using var doc = JsonDocument.Parse(match.Value);
                if (doc.RootElement.TryGetProperty("error", out var errObj))
                {
                    if (errObj.TryGetProperty("message", out var msgProp))
                    {
                        return msgProp.GetString() ?? raw;
                    }
                }
            }
        }
        catch
        {
            // Bỏ qua nếu parse JSON thất bại
        }

        // Rút gọn nếu quá dài
        string oneLine = Regex.Replace(raw, @"[\r\n\t]+", " ").Trim();
        if (oneLine.Length > 250)
        {
            oneLine = oneLine[..250] + "...";
        }
        return oneLine;
    }
}
