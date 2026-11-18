using Microsoft.AspNetCore.Mvc;
using Chatbot.Data.Models;
using Chatbot.Filters;
using Chatbot.Rag.Services;

namespace Chatbot.Endpoints;

public static class AdminEndpoints
{
    public static void MapAdminEndpoints(this IEndpointRouteBuilder app, DateTime appStartTime, string contentRoot)
    {
        // 1. Health check công khai
        app.MapGet("/api/health", (VectorSearchService vectorService, DynamicLlmService dynamicLlm, IServiceProvider sp) =>
        {
            var qdrant = sp.GetService<QdrantVectorService>();
            var cfg = dynamicLlm.GetConfiguration();

            return Results.Ok(new
            {
                status = "ok",
                provider = cfg.Provider,
                chatModel = cfg.Model,
                chatModels = cfg.ChatModels,
                embeddingModel = cfg.EmbeddingModel,
                embeddingModels = cfg.EmbeddingModels,
                vectorStore = qdrant != null ? "qdrant" : "sqlite",
                qdrantCollection = qdrant?.CollectionName,
                hasApiKey = cfg.HasApiKey,
                totalChunks = vectorService.TotalChunks,
                totalRequests = cfg.TotalRequests,
                successfulRequests = cfg.SuccessfulRequests,
                failedRequests = cfg.FailedRequests,
                estimatedInputTokens = cfg.EstimatedInputTokens,
                estimatedOutputTokens = cfg.EstimatedOutputTokens,
                uptimeSeconds = (long)(DateTime.UtcNow - appStartTime).TotalSeconds
            });
        });

        // 2. Xác thực mật khẩu Admin
        app.MapPost("/api/admin/verify", () =>
        {
            return Results.Ok(new
            {
                success = true,
                message = "Mật khẩu Admin chính xác."
            });
        }).AddEndpointFilter<AdminKeyAuthFilter>();

        // 3. Lấy danh mục Model chuẩn của Google AI Studio và các Preset
        app.MapGet("/api/admin/models/catalog", () =>
        {
            string[] possiblePaths = new[]
            {
                Path.Combine(AppContext.BaseDirectory, "models.catalog.json"),
                Path.Combine(Directory.GetCurrentDirectory(), "models.catalog.json"),
                Path.Combine(Directory.GetCurrentDirectory(), "src/Chatbot.Be/models.catalog.json"),
                Path.Combine(contentRoot, "models.catalog.json")
            };

            foreach (var p in possiblePaths)
            {
                if (File.Exists(p))
                {
                    var json = File.ReadAllText(p);
                    return Results.Content(json, "application/json");
                }
            }

            return Results.NotFound(new
            {
                success = false,
                error = new
                {
                    code = "CATALOG_NOT_FOUND",
                    message = "Không tìm thấy tệp danh mục models.catalog.json",
                    statusCode = 404
                }
            });
        }).AddEndpointFilter<AdminKeyAuthFilter>();

        // 4. Lấy cấu hình Model hiện tại
        app.MapGet("/api/admin/model-config", (DynamicLlmService dynamicLlm) =>
        {
            return Results.Ok(dynamicLlm.GetConfiguration());
        }).AddEndpointFilter<AdminKeyAuthFilter>();

        // 5. Cập nhật cấu hình Model (Hot-swap & Cascade setup)
        app.MapPost("/api/admin/model-config", ([FromBody] UpdateModelConfigRequest req, DynamicLlmService dynamicLlm) =>
        {
            bool changed = dynamicLlm.UpdateConfiguration(
                req.Provider,
                req.Model,
                req.BaseUrl,
                req.ApiKey,
                req.EmbeddingModel
            );

            return Results.Ok(new
            {
                success = true,
                changed,
                message = changed ? "Đã cập nhật cấu hình AI Model thành công!" : "Cấu hình không có thay đổi.",
                config = dynamicLlm.GetConfiguration()
            });
        }).AddEndpointFilter<AdminKeyAuthFilter>();

        // 6. Kiểm tra kết nối tới Model trước khi lưu
        app.MapPost("/api/admin/model-test", async (
            [FromBody] UpdateModelConfigRequest req, 
            DynamicLlmService dynamicLlm, 
            CancellationToken ct) =>
        {
            var result = await dynamicLlm.TestConnectionAsync(
                req.Provider,
                req.Model,
                req.BaseUrl,
                req.ApiKey,
                ct
            );

            return Results.Ok(result);
        }).AddEndpointFilter<AdminKeyAuthFilter>();

        // 7. Lấy Metrics Quota & Hiệu năng thời gian thực
        app.MapGet("/api/admin/metrics", (DynamicLlmService dynamicLlm, VectorSearchService vectorService, IServiceProvider sp) =>
        {
            var cfg = dynamicLlm.GetConfiguration();
            var qdrant = sp.GetService<QdrantVectorService>();

            return Results.Ok(new
            {
                totalChatRequests = cfg.TotalRequests,
                totalEmbeddingRequests = cfg.TotalRequests,
                totalTokensEstimated = cfg.EstimatedInputTokens + cfg.EstimatedOutputTokens,
                estimatedInputTokens = cfg.EstimatedInputTokens,
                estimatedOutputTokens = cfg.EstimatedOutputTokens,
                successfulRequests = cfg.SuccessfulRequests,
                failedRequests = cfg.FailedRequests,
                activeProvider = cfg.Provider,
                activeChatModel = cfg.Model,
                activeChatModels = cfg.ChatModels,
                activeEmbeddingModel = cfg.EmbeddingModel,
                activeEmbeddingModels = cfg.EmbeddingModels,
                lastSwitchedAtUtc = cfg.LastSwitchedAtUtc,
                totalKnowledgeChunks = vectorService.TotalChunks,
                vectorStore = qdrant != null ? "qdrant" : "sqlite",
                uptimeSeconds = (long)(DateTime.UtcNow - appStartTime).TotalSeconds
            });
        }).AddEndpointFilter<AdminKeyAuthFilter>();
    }
}
