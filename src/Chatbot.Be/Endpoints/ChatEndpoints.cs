using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Chatbot.Data.Models;
using Chatbot.Rag.Security;
using Chatbot.Rag.Services;

namespace Chatbot.Endpoints;

public static class ChatEndpoints
{
    public static void MapChatEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/chat", async (
            HttpContext context, 
            [FromBody] ChatRequest req, 
            MedicalRagService rag,
            GuestAccessService guestAccess) =>
        {
            if (string.IsNullOrWhiteSpace(req.Message))
            {
                context.Response.StatusCode = 400;
                context.Response.ContentType = "application/json; charset=utf-8";
                await context.Response.WriteAsync(JsonSerializer.Serialize(new
                {
                    success = false,
                    error = new
                    {
                        code = "EMPTY_QUERY",
                        message = "Câu hỏi của người bệnh không được để trống.",
                        statusCode = 400
                    }
                }));
                return;
            }

            // Kiểm tra trạng thái xác thực: Người dùng đã đăng nhập hoặc có khóa admin sẽ không bị giới hạn
            bool isAuthenticated = !string.IsNullOrWhiteSpace(req.UserId) ||
                                  (context.Request.Headers.TryGetValue("X-User-Id", out var uid) && !string.IsNullOrWhiteSpace(uid)) ||
                                  context.Request.Headers.ContainsKey("X-Admin-Key");

            if (!isAuthenticated)
            {
                string clientIp = context.Request.Headers["X-Forwarded-For"].FirstOrDefault()?.Split(',').FirstOrDefault()?.Trim()
                    ?? context.Connection.RemoteIpAddress?.ToString()
                    ?? "anonymous";

                if (!guestAccess.CanGuestAsk(clientIp))
                {
                    context.Response.StatusCode = 403;
                    context.Response.ContentType = "application/json; charset=utf-8";
                    await context.Response.WriteAsync(JsonSerializer.Serialize(new
                    {
                        success = false,
                        error = new
                        {
                            code = "GUEST_LIMIT_EXCEEDED",
                            message = "Bạn đã sử dụng hết 1 câu hỏi thử nghiệm miễn phí dành cho khách vãng lai. Vui lòng đăng nhập để tiếp tục tra cứu.",
                            statusCode = 403
                        }
                    }));
                    return;
                }

                guestAccess.RecordGuestQuery(clientIp);
            }

            context.Response.ContentType = "text/event-stream; charset=utf-8";
            context.Response.Headers.CacheControl = "no-cache";

            var result = await rag.AskAsync(req.Message, req.Mode ?? "strict", context.RequestAborted);

            var jsonOptions = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
            var metaJson = JsonSerializer.Serialize(new
            {
                citations = result.Citations,
                safetyLevel = result.SafetyLevel,
                isRefusal = result.IsRefusal,
                mode = result.Mode
            }, jsonOptions);

            await context.Response.WriteAsync($"event: metadata\ndata: {metaJson}\n\n");
            await context.Response.Body.FlushAsync();

            await foreach (var token in result.Stream.WithCancellation(context.RequestAborted))
            {
                var tokenJson = JsonSerializer.Serialize(new { token });
                await context.Response.WriteAsync($"event: token\ndata: {tokenJson}\n\n");
                await context.Response.Body.FlushAsync();
            }

            await context.Response.WriteAsync("event: done\ndata: [DONE]\n\n");
            await context.Response.Body.FlushAsync();
        });
    }
}
