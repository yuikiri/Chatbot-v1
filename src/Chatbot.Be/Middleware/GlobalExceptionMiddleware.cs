using System.Net;
using System.Text.Json;
using Chatbot.Rag.Services;

namespace Chatbot.Middleware;

public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;

    public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[GlobalExceptionMiddleware] Lỗi không xử lý được tại {Path}: {Message}", context.Request.Path, ex.Message);
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception ex)
    {
        if (context.Response.HasStarted)
        {
            return;
        }

        context.Response.ContentType = "application/json; charset=utf-8";

        int statusCode = ex switch
        {
            ArgumentException or FormatException => (int)HttpStatusCode.BadRequest,
            UnauthorizedAccessException => (int)HttpStatusCode.Unauthorized,
            KeyNotFoundException or FileNotFoundException => (int)HttpStatusCode.NotFound,
            HttpRequestException httpEx when httpEx.StatusCode.HasValue => (int)httpEx.StatusCode.Value,
            _ => (int)HttpStatusCode.InternalServerError
        };

        var formatted = LlmErrorFormatter.Format(ex);
        if (formatted.StatusCode.HasValue && formatted.StatusCode.Value != 500)
        {
            statusCode = formatted.StatusCode.Value;
        }

        context.Response.StatusCode = statusCode;

        var errorResponse = new
        {
            success = false,
            error = new
            {
                code = formatted.ErrorCode,
                message = formatted.UserMessage,
                details = formatted.AdminSummary,
                statusCode = statusCode,
                path = context.Request.Path.Value,
                timestamp = DateTime.UtcNow
            }
        };

        var json = JsonSerializer.Serialize(errorResponse, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = false
        });

        await context.Response.WriteAsync(json);
    }
}
