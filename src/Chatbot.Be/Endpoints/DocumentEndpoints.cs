using Microsoft.AspNetCore.Mvc;
using Chatbot.Data.Models;
using Chatbot.Data.Repositories;
using Chatbot.Filters;
using Chatbot.Rag.Parsers;
using Chatbot.Rag.Services;

namespace Chatbot.Endpoints;

public static class DocumentEndpoints
{
    public static void MapDocumentEndpoints(this IEndpointRouteBuilder app)
    {
        // 1. Lấy danh sách tài liệu công khai
        app.MapGet("/api/documents", async (IDocumentRepository repo, CancellationToken ct) =>
        {
            var docs = await repo.GetAllDocumentsAsync(ct);
            return Results.Ok(docs);
        });

        // 2. Lấy nội dung toàn văn của 1 tài liệu
        app.MapGet("/api/documents/{id}", async (string id, IDocumentRepository repo, CancellationToken ct) =>
        {
            var doc = await repo.GetDocumentByIdAsync(id, ct);
            if (doc == null)
            {
                return Results.NotFound(new
                {
                    success = false,
                    error = new
                    {
                        code = "DOCUMENT_NOT_FOUND",
                        message = $"Không tìm thấy tài liệu y khoa có mã '{id}'",
                        statusCode = 404
                    }
                });
            }

            string? text = await repo.GetDocumentRawTextAsync(id, ct);
            return Results.Ok(new
            {
                id = doc.Id,
                title = doc.Title,
                fileName = doc.FileName,
                filePath = doc.FilePath,
                rawFilePath = doc.RawFilePath,
                normalizedFilePath = doc.NormalizedFilePath,
                sourceUrl = doc.SourceUrl,
                sourceType = doc.SourceType,
                fileSizeBytes = doc.FileSizeBytes,
                uploadedAtUtc = doc.UploadedAtUtc,
                chunkCount = doc.ChunkCount,
                content = text ?? string.Empty
            });
        });

        // 3. Admin Upload Document (Quy trình 2 tầng Raw & Normalized)
        app.MapPost("/api/admin/documents", async (
            HttpRequest request, 
            IDocumentRepository repo, 
            MedicalRagService rag,
            CancellationToken ct) =>
        {
            if (!request.HasFormContentType || request.Form.Files.Count == 0)
            {
                return Results.BadRequest(new
                {
                    success = false,
                    error = new
                    {
                        code = "FILE_MISSING",
                        message = "Vui lòng chọn tệp tài liệu y khoa (.txt, .md, .pdf) để tải lên.",
                        statusCode = 400
                    }
                });
            }

            var file = request.Form.Files[0];
            if (file.Length == 0)
            {
                return Results.BadRequest(new
                {
                    success = false,
                    error = new
                    {
                        code = "FILE_EMPTY",
                        message = "Tệp được chọn có dung lượng rỗng (0 bytes).",
                        statusCode = 400
                    }
                });
            }

            using var stream = file.OpenReadStream();
            var doc = await repo.SaveFileAsync(file.FileName, stream, ct);

            // Tự động phân đoạn và tạo vector trên bản Normalized Markdown
            await rag.IngestDocumentAsync(doc.Id, ct);

            var updatedDoc = await repo.GetDocumentByIdAsync(doc.Id, ct);
            return Results.Ok(new
            {
                success = true,
                document = updatedDoc ?? doc,
                message = $"Đã nạp và vector hóa thành công tài liệu: {updatedDoc?.Title ?? doc.Title}"
            });
        }).AddEndpointFilter<AdminKeyAuthFilter>();

        // 4. Admin Pre-check Inspect URL trước khi cào
        app.MapPost("/api/admin/documents/crawl/inspect", async (
            [FromBody] CrawlDocumentRequest req,
            IHttpClientFactory httpFactory,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(req.Url))
            {
                return Results.BadRequest(new
                {
                    success = false,
                    error = new
                    {
                        code = "URL_EMPTY",
                        message = "Vui lòng nhập đường dẫn URL y khoa hợp lệ.",
                        statusCode = 400
                    }
                });
            }

            var client = httpFactory.CreateClient("CrawlerClient");
            client.Timeout = TimeSpan.FromSeconds(15);
            var inspection = await WebArticleCrawler.InspectArticleAsync(req.Url, client, ct);
            return Results.Ok(inspection);
        }).AddEndpointFilter<AdminKeyAuthFilter>();

        // 5. Admin Crawl Document from Web URL (Lưu trữ 2 tầng: Raw HTML & Normalized Markdown)
        app.MapPost("/api/admin/documents/crawl", async (
            [FromBody] CrawlDocumentRequest req,
            IHttpClientFactory httpFactory,
            IDocumentRepository repo,
            MedicalRagService rag,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(req.Url))
            {
                return Results.BadRequest(new
                {
                    success = false,
                    error = new
                    {
                        code = "URL_EMPTY",
                        message = "Vui lòng nhập đường dẫn URL y khoa hợp lệ.",
                        statusCode = 400
                    }
                });
            }

            var client = httpFactory.CreateClient("CrawlerClient");
            client.Timeout = TimeSpan.FromSeconds(30);

            var crawlResult = await WebArticleCrawler.CrawlArticleAsync(req.Url, client, ct);
            var doc = await repo.SaveCrawledFileAsync(
                crawlResult.Title, 
                crawlResult.FormattedText, 
                crawlResult.SuggestedFileName, 
                crawlResult.SourceUrl, 
                crawlResult.RawHtml,
                ct
            );

            // Tự động phân đoạn và tạo vector trên bản chuẩn hóa Markdown
            await rag.IngestDocumentAsync(doc.Id, ct);

            var updatedDoc = await repo.GetDocumentByIdAsync(doc.Id, ct);
            return Results.Ok(new
            {
                success = true,
                document = updatedDoc ?? doc,
                message = $"Đã cào dữ liệu và tạo thành công {updatedDoc?.ChunkCount ?? 0} đoạn vector từ: {crawlResult.Title}"
            });
        }).AddEndpointFilter<AdminKeyAuthFilter>();

        // 6. Admin Delete Document (Xóa thác Raw, Normalized, SQLite, Qdrant)
        app.MapDelete("/api/admin/documents/{id}", async (
            string id, 
            IDocumentRepository repo, 
            VectorSearchService searchService, 
            IServiceProvider sp,
            CancellationToken ct) =>
        {
            bool deleted = await repo.DeleteDocumentAsync(id, ct);
            if (!deleted)
            {
                return Results.NotFound(new
                {
                    success = false,
                    error = new
                    {
                        code = "DOCUMENT_NOT_FOUND",
                        message = $"Không tìm thấy tài liệu '{id}' để thực hiện xóa.",
                        statusCode = 404
                    }
                });
            }

            var qdrant = sp.GetService<QdrantVectorService>();
            if (qdrant != null)
            {
                try
                {
                    await qdrant.DeleteDocumentChunksAsync(id, ct);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[Cảnh báo Qdrant Delete] Lỗi xóa vector point: {ex.Message}");
                }
            }

            // Nạp lại index bộ nhớ
            await searchService.ReloadIndexAsync(ct);
            return Results.Ok(new
            {
                success = true,
                message = $"Đã xóa thành công tài liệu '{id}' và giải phóng vector liên quan."
            });
        }).AddEndpointFilter<AdminKeyAuthFilter>();
    }
}
