using Microsoft.AspNetCore.Mvc;
using Chatbot.Data.Models;
using Chatbot.Data.Storage;
using Chatbot.Filters;

namespace Chatbot.Endpoints;

public static class ScenarioEndpoints
{
    public static void MapScenarioEndpoints(this IEndpointRouteBuilder app)
    {
        // 1. Lấy danh sách tình huống công khai cho người dùng (Chỉ lấy tình huống đang kích hoạt IsActive = true)
        app.MapGet("/api/scenarios", async (SqliteKnowledgeStore store, CancellationToken ct) =>
        {
            var list = await store.GetActiveScenariosAsync(ct);
            return Results.Ok(new
            {
                success = true,
                count = list.Count,
                data = list
            });
        });

        // 2. Lấy toàn bộ danh sách tình huống cho Admin (Bao gồm cả đang ẩn)
        app.MapGet("/api/admin/scenarios", async (SqliteKnowledgeStore store, CancellationToken ct) =>
        {
            var list = await store.GetAllScenariosAsync(ct);
            return Results.Ok(new
            {
                success = true,
                count = list.Count,
                data = list
            });
        }).AddEndpointFilter<AdminKeyAuthFilter>();

        // 3. Thêm mới một tình huống
        app.MapPost("/api/admin/scenarios", async ([FromBody] CreateScenarioRequest req, SqliteKnowledgeStore store, CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(req.Title) || string.IsNullOrWhiteSpace(req.ClaimText))
            {
                return Results.BadRequest(new
                {
                    success = false,
                    message = "Tiêu đề và nội dung tình huống lâm sàng (ClaimText) không được để trống."
                });
            }

            var entity = new ScenarioEntity
            {
                Code = req.Code?.Trim() ?? string.Empty,
                Title = req.Title.Trim(),
                ClaimText = req.ClaimText.Trim(),
                Platform = string.IsNullOrWhiteSpace(req.Platform) ? "Khác" : req.Platform.Trim(),
                DoubtSignals = req.DoubtSignals?.Trim() ?? string.Empty,
                PotentialRisk = req.PotentialRisk?.Trim() ?? string.Empty,
                DisplayOrder = req.DisplayOrder ?? 0,
                IsActive = req.IsActive ?? true
            };

            var created = await store.CreateScenarioAsync(entity, ct);
            return Results.Ok(new
            {
                success = true,
                message = "Tạo tình huống lâm sàng thành công.",
                data = created
            });
        }).AddEndpointFilter<AdminKeyAuthFilter>();

        // 4. Chỉnh sửa một tình huống hiện có
        app.MapPut("/api/admin/scenarios/{id}", async (string id, [FromBody] UpdateScenarioRequest req, SqliteKnowledgeStore store, CancellationToken ct) =>
        {
            var existing = await store.GetScenarioByIdAsync(id, ct);
            if (existing == null)
            {
                return Results.NotFound(new
                {
                    success = false,
                    message = $"Không tìm thấy tình huống có ID: {id}"
                });
            }

            if (!string.IsNullOrWhiteSpace(req.Code)) existing.Code = req.Code.Trim();
            if (!string.IsNullOrWhiteSpace(req.Title)) existing.Title = req.Title.Trim();
            if (!string.IsNullOrWhiteSpace(req.ClaimText)) existing.ClaimText = req.ClaimText.Trim();
            if (!string.IsNullOrWhiteSpace(req.Platform)) existing.Platform = req.Platform.Trim();
            if (req.DoubtSignals != null) existing.DoubtSignals = req.DoubtSignals.Trim();
            if (req.PotentialRisk != null) existing.PotentialRisk = req.PotentialRisk.Trim();
            if (req.DisplayOrder.HasValue) existing.DisplayOrder = req.DisplayOrder.Value;
            if (req.IsActive.HasValue) existing.IsActive = req.IsActive.Value;

            bool ok = await store.UpdateScenarioAsync(existing, ct);
            if (ok)
            {
                return Results.Ok(new
                {
                    success = true,
                    message = "Cập nhật tình huống thành công.",
                    data = existing
                });
            }

            return Results.StatusCode(500);
        }).AddEndpointFilter<AdminKeyAuthFilter>();

        // 5. Xóa một tình huống
        app.MapDelete("/api/admin/scenarios/{id}", async (string id, SqliteKnowledgeStore store, CancellationToken ct) =>
        {
            var existing = await store.GetScenarioByIdAsync(id, ct);
            if (existing == null)
            {
                return Results.NotFound(new
                {
                    success = false,
                    message = $"Không tìm thấy tình huống có ID: {id}"
                });
            }

            bool ok = await store.DeleteScenarioAsync(id, ct);
            return Results.Ok(new
            {
                success = ok,
                message = ok ? "Xóa tình huống thành công." : "Không thể xóa tình huống."
            });
        }).AddEndpointFilter<AdminKeyAuthFilter>();

        // 6. Reset về danh sách 15 tình huống lâm sàng gốc
        app.MapPost("/api/admin/scenarios/reset-default", async (SqliteKnowledgeStore store, CancellationToken ct) =>
        {
            await store.SeedDefaultScenariosAsync(force: true, ct);
            var list = await store.GetAllScenariosAsync(ct);
            return Results.Ok(new
            {
                success = true,
                message = "Đã khôi phục thành công 15 tình huống lâm sàng tư vấn dùng thuốc khi cho con bú.",
                count = list.Count,
                data = list
            });
        }).AddEndpointFilter<AdminKeyAuthFilter>();
    }
}
