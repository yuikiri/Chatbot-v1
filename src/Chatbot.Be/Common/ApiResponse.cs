namespace Chatbot.Common;

public class ApiErrorDetails
{
    public string Code { get; set; } = "UNKNOWN_ERROR";
    public string Message { get; set; } = string.Empty;
    public string? Details { get; set; }
    public int StatusCode { get; set; } = 400;
}

public class ApiResponse<T>
{
    public bool Success { get; set; }
    public T? Data { get; set; }
    public ApiErrorDetails? Error { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public static ApiResponse<T> Ok(T data) => new()
    {
        Success = true,
        Data = data
    };

    public static ApiResponse<T> Fail(string code, string message, string? details = null, int statusCode = 400) => new()
    {
        Success = false,
        Error = new ApiErrorDetails
        {
            Code = code,
            Message = message,
            Details = details,
            StatusCode = statusCode
        }
    };
}
