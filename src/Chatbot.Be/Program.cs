using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Chatbot.Data.Repositories;
using Chatbot.Data.Storage;
using Chatbot.Rag.Parsers;
using Chatbot.Rag.Prompts;
using Chatbot.Rag.Providers;
using Chatbot.Rag.Services;

// Tự động tìm và nạp file .env từ thư mục gốc hoặc các thư mục cha
LoadDotEnv();

var builder = WebApplication.CreateBuilder(args);

// Hỗ trợ đọc biến môi trường
builder.Configuration.AddEnvironmentVariables();

// Cấu hình cổng lắng nghe (Render tự động inject PORT, mặc định 10000)
string serverPort = Environment.GetEnvironmentVariable("PORT") ?? builder.Configuration["PORT"] ?? "10000";
builder.WebHost.UseUrls($"http://+:{serverPort}");

// 1. Cấu hình đường dẫn lưu trữ dữ liệu cục bộ bên trong Chatbot.Be
string contentRoot = builder.Environment.ContentRootPath;
string defaultDataDir = Path.Combine(contentRoot, "data");

string docsPath = builder.Configuration["Storage:DocumentsPath"] 
    ?? Environment.GetEnvironmentVariable("STORAGE_DOCUMENTS_PATH") 
    ?? Path.Combine(defaultDataDir, "documents");

string dbPath = builder.Configuration["Storage:DbPath"] 
    ?? Environment.GetEnvironmentVariable("STORAGE_DB_PATH") 
    ?? Path.Combine(defaultDataDir, "index", "knowledge.db");

if (!Path.IsPathRooted(docsPath))
{
    docsPath = Path.GetFullPath(Path.Combine(defaultDataDir, docsPath));
}
if (!Path.IsPathRooted(dbPath))
{
    dbPath = Path.GetFullPath(Path.Combine(defaultDataDir, dbPath));
}

// 2. Đăng ký Services
builder.Services.AddHttpClient();
builder.Services.AddHttpClient("CrawlerClient")
    .ConfigurePrimaryHttpMessageHandler(() => new SocketsHttpHandler
    {
        SslOptions = new System.Net.Security.SslClientAuthenticationOptions
        {
            RemoteCertificateValidationCallback = (sender, cert, chain, sslPolicyErrors) => true
        },
        AutomaticDecompression = System.Net.DecompressionMethods.All
    });

builder.Services.AddSingleton(new SqliteKnowledgeStore(dbPath));
builder.Services.AddSingleton<IDocumentRepository>(sp =>
    new DocumentRepository(sp.GetRequiredService<SqliteKnowledgeStore>(), docsPath));

// Cấu hình Vector Store Provider (Qdrant Cloud hoặc SQLite In-Memory)
string vectorStoreProvider = builder.Configuration["VectorStoreProvider"] 
    ?? Environment.GetEnvironmentVariable("VECTOR_STORE_PROVIDER") 
    ?? "qdrant";

string qdrantEndpoint = builder.Configuration["Qdrant:Endpoint"] 
    ?? Environment.GetEnvironmentVariable("QDRANT_ENDPOINT") 
    ?? string.Empty;

string qdrantApiKey = builder.Configuration["Qdrant:ApiKey"] 
    ?? Environment.GetEnvironmentVariable("QDRANT_API_KEY") 
    ?? string.Empty;

string qdrantCollection = builder.Configuration["Qdrant:CollectionName"] 
    ?? Environment.GetEnvironmentVariable("QDRANT_COLLECTION_NAME") 
    ?? "medical_knowledge";

ulong qdrantVectorSize = ulong.TryParse(builder.Configuration["Qdrant:VectorSize"] 
    ?? Environment.GetEnvironmentVariable("QDRANT_VECTOR_SIZE"), out var parsedSize) && parsedSize > 0 ? parsedSize : 768;

if (vectorStoreProvider.Equals("qdrant", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrWhiteSpace(qdrantEndpoint))
{
    Console.WriteLine($"[Cấu hình] Sử dụng Qdrant Cloud Vector Database: {qdrantEndpoint} (Collection: {qdrantCollection})");
    builder.Services.AddSingleton(new QdrantVectorService(qdrantEndpoint, qdrantApiKey, qdrantCollection, qdrantVectorSize));
    builder.Services.AddSingleton<VectorSearchService>(sp =>
        new VectorSearchService(sp.GetRequiredService<IDocumentRepository>(), sp.GetService<QdrantVectorService>()));
}
else
{
    Console.WriteLine("[Cấu hình] Sử dụng Local SQLite + In-Memory SIMD Vector Store.");
    builder.Services.AddSingleton<VectorSearchService>(sp =>
        new VectorSearchService(sp.GetRequiredService<IDocumentRepository>(), null));
}

// Cấu hình LLM Provider
string provider = builder.Configuration["LLM:Provider"] 
    ?? Environment.GetEnvironmentVariable("LLM_PROVIDER") 
    ?? "gemini";

string baseUrl = builder.Configuration["LLM:BaseUrl"] 
    ?? Environment.GetEnvironmentVariable("LLM_BASE_URL") 
    ?? "https://generativelanguage.googleapis.com";

string apiKey = builder.Configuration["LLM:ApiKey"] 
    ?? Environment.GetEnvironmentVariable("LLM_API_KEY") 
    ?? Environment.GetEnvironmentVariable("GEMINI_API_KEY") 
    ?? string.Empty;

string chatModel = builder.Configuration["LLM:Model"] 
    ?? Environment.GetEnvironmentVariable("LLM_MODEL") 
    ?? "gemini-1.5-flash";

string embeddingModel = builder.Configuration["LLM:EmbeddingModel"] 
    ?? Environment.GetEnvironmentVariable("LLM_EMBEDDING_MODEL") 
    ?? "text-embedding-004";

if (provider.Equals("custom_openai", StringComparison.OrdinalIgnoreCase) || 
    provider.Equals("openai", StringComparison.OrdinalIgnoreCase) ||
    provider.Equals("9router", StringComparison.OrdinalIgnoreCase))
{
    builder.Services.AddSingleton<ILlmClient>(sp =>
        new OpenAiCompatibleProvider(sp.GetRequiredService<HttpClient>(), baseUrl, apiKey, chatModel, embeddingModel));
    builder.Services.AddSingleton<IEmbeddingClient>(sp =>
        new OpenAiCompatibleProvider(sp.GetRequiredService<HttpClient>(), baseUrl, apiKey, chatModel, embeddingModel));
}
else
{
    // Mặc định: Google Gemini
    builder.Services.AddSingleton<ILlmClient>(sp =>
        new GeminiProvider(sp.GetRequiredService<HttpClient>(), apiKey, chatModel, embeddingModel));
    builder.Services.AddSingleton<IEmbeddingClient>(sp =>
        new GeminiProvider(sp.GetRequiredService<HttpClient>(), apiKey, chatModel, embeddingModel));
}

builder.Services.AddSingleton<VerifiedArticleResolver>();
builder.Services.AddSingleton<MedicalRagService>(sp =>
    new MedicalRagService(
        sp.GetRequiredService<IDocumentRepository>(),
        sp.GetRequiredService<VectorSearchService>(),
        sp.GetRequiredService<ILlmClient>(),
        sp.GetRequiredService<IEmbeddingClient>(),
        sp.GetRequiredService<VerifiedArticleResolver>(),
        sp.GetService<QdrantVectorService>()
    ));

// Cấu hình CORS cho phép Frontend gọi trong môi trường dev
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

app.UseCors("AllowAll");

// Khởi tạo RAG Index lúc ứng dụng chạy
using (var scope = app.Services.CreateScope())
{
    var ragService = scope.ServiceProvider.GetRequiredService<MedicalRagService>();
    await ragService.InitializeAsync();
}

// Cấu hình Admin Secret Key
string adminSecretKey = app.Configuration["Admin:SecretKey"] 
    ?? Environment.GetEnvironmentVariable("ADMIN_SECRET_KEY") 
    ?? "admin_secret_key_123";

bool ValidateAdmin(HttpRequest request)
{
    if (request.Headers.TryGetValue("X-Admin-Key", out var headerKey))
    {
        return string.Equals(headerKey.ToString(), adminSecretKey, StringComparison.Ordinal);
    }
    return false;
}

// ==========================================
// API ENDPOINTS
// ==========================================

// 1. Health check
app.MapGet("/api/health", (VectorSearchService vectorService, IServiceProvider sp) =>
{
    var qdrant = sp.GetService<QdrantVectorService>();
    return Results.Ok(new
    {
        status = "ok",
        provider,
        chatModel,
        embeddingModel,
        vectorStore = qdrant != null ? "qdrant" : "sqlite",
        qdrantCollection = qdrant?.CollectionName,
        hasApiKey = !string.IsNullOrWhiteSpace(apiKey),
        totalChunks = vectorService.TotalChunks
    });
});

// 2. Chat Streaming SSE Endpoint
app.MapPost("/api/chat", async (HttpContext context, [FromBody] ChatRequest req, MedicalRagService rag) =>
{
    if (string.IsNullOrWhiteSpace(req.Message))
    {
        context.Response.StatusCode = 400;
        await context.Response.WriteAsync("Câu hỏi không được để trống.");
        return;
    }

    context.Response.ContentType = "text/event-stream; charset=utf-8";
    context.Response.Headers.CacheControl = "no-cache";

    var result = await rag.AskAsync(req.Message, req.Mode ?? "strict", context.RequestAborted);

    // Gửi event metadata đầu tiên (Citations, SafetyLevel, IsRefusal, Mode)
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

    // Stream từng token
    await foreach (var token in result.Stream.WithCancellation(context.RequestAborted))
    {
        var tokenJson = JsonSerializer.Serialize(new { token });
        await context.Response.WriteAsync($"event: token\ndata: {tokenJson}\n\n");
        await context.Response.Body.FlushAsync();
    }

    // Gửi tín hiệu hoàn tất
    await context.Response.WriteAsync("event: done\ndata: [DONE]\n\n");
    await context.Response.Body.FlushAsync();
});

// 3. Lấy danh sách tài liệu công khai
app.MapGet("/api/documents", async (IDocumentRepository repo) =>
{
    var docs = await repo.GetAllDocumentsAsync();
    return Results.Ok(docs);
});

// 4. Lấy nội dung toàn văn của 1 tài liệu để phục vụ Citation Highlight Viewer
app.MapGet("/api/documents/{id}", async (string id, IDocumentRepository repo) =>
{
    var doc = await repo.GetDocumentByIdAsync(id);
    if (doc == null) return Results.NotFound(new { error = "Không tìm thấy tài liệu" });

    string targetPath = doc.FilePath;
    if (!File.Exists(targetPath))
    {
        var candidate1 = Path.Combine(docsPath, $"{doc.Id}_{doc.FileName}");
        var candidate2 = Path.Combine(docsPath, doc.FileName);
        var candidate3 = Directory.Exists(docsPath)
            ? Directory.GetFiles(docsPath, $"*{doc.Id}*").FirstOrDefault()
            : null;

        if (File.Exists(candidate1)) targetPath = candidate1;
        else if (File.Exists(candidate2)) targetPath = candidate2;
        else if (!string.IsNullOrEmpty(candidate3) && File.Exists(candidate3)) targetPath = candidate3;
    }

    string text = await DocumentTextParser.ExtractTextAsync(targetPath);
    return Results.Ok(new
    {
        id = doc.Id,
        title = doc.Title,
        fileName = doc.FileName,
        fileSizeBytes = doc.FileSizeBytes,
        uploadedAtUtc = doc.UploadedAtUtc,
        chunkCount = doc.ChunkCount,
        content = text
    });
});

// 4.1. Xác thực mật khẩu Admin
app.MapPost("/api/admin/verify", (HttpRequest request) =>
{
    if (ValidateAdmin(request))
    {
        return Results.Ok(new { success = true, message = "Mật khẩu Admin chính xác." });
    }
    return Results.Unauthorized();
});

// 5. Admin Upload Document
app.MapPost("/api/admin/documents", async (HttpRequest request, IDocumentRepository repo, MedicalRagService rag) =>
{
    if (!ValidateAdmin(request))
        return Results.Unauthorized();

    if (!request.HasFormContentType || request.Form.Files.Count == 0)
        return Results.BadRequest(new { error = "Vui lòng chọn tệp tài liệu y khoa để tải lên." });

    var file = request.Form.Files[0];
    if (file.Length == 0)
        return Results.BadRequest(new { error = "Tệp rỗng." });

    using var stream = file.OpenReadStream();
    var doc = await repo.SaveFileAsync(file.FileName, stream);

    // Tự động phân đoạn và tạo vector
    await rag.IngestDocumentAsync(doc.Id);

    // Đọc lại document cập nhật
    var updatedDoc = await repo.GetDocumentByIdAsync(doc.Id);
    return Results.Ok(updatedDoc ?? doc);
});

// 5.1. Admin Crawl Document from Web URL
app.MapPost("/api/admin/documents/crawl", async (
    [FromBody] CrawlDocumentRequest req,
    HttpRequest request,
    IHttpClientFactory httpFactory,
    IDocumentRepository repo,
    MedicalRagService rag) =>
{
    if (!ValidateAdmin(request))
        return Results.Unauthorized();

    if (string.IsNullOrWhiteSpace(req.Url))
        return Results.BadRequest(new { error = "Vui lòng nhập đường dẫn URL hợp lệ." });

    try
    {
        var client = httpFactory.CreateClient("CrawlerClient");
        client.Timeout = TimeSpan.FromSeconds(30);

        var crawlResult = await WebArticleCrawler.CrawlArticleAsync(req.Url, client);

        using var stream = new MemoryStream(Encoding.UTF8.GetBytes(crawlResult.FormattedText));
        var doc = await repo.SaveFileAsync(crawlResult.SuggestedFileName, stream);

        // Tự động phân đoạn và tạo vector
        await rag.IngestDocumentAsync(doc.Id);

        var updatedDoc = await repo.GetDocumentByIdAsync(doc.Id);
        return Results.Ok(new
        {
            success = true,
            document = updatedDoc ?? doc,
            message = $"Đã cào dữ liệu và tạo thành công {updatedDoc?.ChunkCount ?? 0} đoạn vector từ: {crawlResult.Title}"
        });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { error = $"Cào dữ liệu thất bại: {ex.Message}" });
    }
});

// 6. Admin Delete Document
app.MapDelete("/api/admin/documents/{id}", async (string id, HttpRequest request, IDocumentRepository repo, VectorSearchService searchService, IServiceProvider sp) =>
{
    if (!ValidateAdmin(request))
        return Results.Unauthorized();

    bool deleted = await repo.DeleteDocumentAsync(id);
    if (!deleted)
        return Results.NotFound(new { error = "Không tìm thấy tài liệu để xóa" });

    var qdrant = sp.GetService<QdrantVectorService>();
    if (qdrant != null)
    {
        await qdrant.DeleteDocumentChunksAsync(id);
    }

    // Nạp lại index
    await searchService.ReloadIndexAsync();
    return Results.Ok(new { success = true });
});

// 7. Phục vụ Frontend Static Files (nếu có thư mục wwwroot)
app.UseDefaultFiles();
app.UseStaticFiles();

// SPA Fallback: Các route không khớp API sẽ chuyển về index.html của React
app.MapFallbackToFile("index.html");

app.Run();

void LoadDotEnv()
{
    string[] searchPaths = new[]
    {
        Path.Combine(Directory.GetCurrentDirectory(), ".env"),
        Path.Combine(Directory.GetCurrentDirectory(), "../.env"),
        Path.Combine(Directory.GetCurrentDirectory(), "../../.env"),
        Path.Combine(AppContext.BaseDirectory, ".env"),
        Path.Combine(AppContext.BaseDirectory, "../../../.env"),
        Path.Combine(AppContext.BaseDirectory, "../../../../.env")
    };

    foreach (var path in searchPaths)
    {
        if (File.Exists(path))
        {
            foreach (var line in File.ReadAllLines(path))
            {
                var trimmed = line.Trim();
                if (string.IsNullOrEmpty(trimmed) || trimmed.StartsWith("#")) continue;
                int eqIdx = trimmed.IndexOf('=');
                if (eqIdx > 0)
                {
                    string key = trimmed[..eqIdx].Trim();
                    string val = trimmed[(eqIdx + 1)..].Trim();
                    if (string.IsNullOrEmpty(Environment.GetEnvironmentVariable(key)))
                    {
                        Environment.SetEnvironmentVariable(key, val);
                    }
                }
            }
            break;
        }
    }
}

public record ChatRequest(string Message, string? Mode = "strict");
public record CrawlDocumentRequest(string Url);
