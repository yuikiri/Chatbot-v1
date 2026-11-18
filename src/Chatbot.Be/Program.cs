using Chatbot.Data.Repositories;
using Chatbot.Data.Storage;
using Chatbot.Endpoints;
using Chatbot.Filters;
using Chatbot.Middleware;
using Chatbot.Rag.Providers;
using Chatbot.Rag.Services;

// 1. Tự động tìm và nạp file .env
LoadDotEnv();

DateTime appStartTime = DateTime.UtcNow;
var builder = WebApplication.CreateBuilder(args);

builder.Configuration.AddEnvironmentVariables();

// Cấu hình cổng lắng nghe
string serverPort = Environment.GetEnvironmentVariable("PORT") ?? builder.Configuration["PORT"] ?? "10000";
builder.WebHost.UseUrls($"http://+:{serverPort}");

// 2. Cấu hình thư mục lưu trữ dữ liệu
string contentRoot = builder.Environment.ContentRootPath;
string defaultDataDir = Path.Combine(contentRoot, "storage");

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

// 3. Đăng ký Services & Infrastructure
builder.Services.AddHttpClient();
builder.Services.AddHttpClient("CrawlerClient")
    .ConfigurePrimaryHttpMessageHandler(() => new SocketsHttpHandler
    {
        AutomaticDecompression = System.Net.DecompressionMethods.All
    });

builder.Services.AddSingleton(new SqliteKnowledgeStore(dbPath));
builder.Services.AddSingleton<IDocumentRepository>(sp =>
    new DocumentRepository(sp.GetRequiredService<SqliteKnowledgeStore>(), docsPath));

// Vector Store Provider: Qdrant Cloud hoặc Local SQLite In-Memory
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
    ?? Environment.GetEnvironmentVariable("QDRANT_VECTOR_SIZE"), out var parsedSize) && parsedSize > 0 ? parsedSize : 3072;

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

// Cấu hình Dynamic LLM Provider
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
    ?? "gemini-3.5-flash-lite,gemini-3.1-flash-lite,gemini-2.5-flash-lite";

string embeddingModel = builder.Configuration["LLM:EmbeddingModel"] 
    ?? Environment.GetEnvironmentVariable("LLM_EMBEDDING_MODEL") 
    ?? "gemini-embedding-001,gemini-embedding-002";

builder.Services.AddSingleton<DynamicLlmService>(sp =>
    new DynamicLlmService(
        sp.GetRequiredService<HttpClient>(),
        provider,
        baseUrl,
        apiKey,
        chatModel,
        embeddingModel
    ));

builder.Services.AddSingleton<ILlmClient>(sp => sp.GetRequiredService<DynamicLlmService>());
builder.Services.AddSingleton<IEmbeddingClient>(sp => sp.GetRequiredService<DynamicLlmService>());
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

builder.Services.AddSingleton<AdminKeyAuthFilter>();

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

// 4. Pipeline Middleware
app.UseMiddleware<GlobalExceptionMiddleware>();
app.UseCors("AllowAll");

// Khởi tạo RAG Index
using (var scope = app.Services.CreateScope())
{
    var ragService = scope.ServiceProvider.GetRequiredService<MedicalRagService>();
    await ragService.InitializeAsync();
}

// 5. Đăng ký các nhóm Endpoint chuyên biệt
app.MapChatEndpoints();
app.MapDocumentEndpoints();
app.MapAdminEndpoints(appStartTime, contentRoot);

// 6. Phục vụ Frontend Static Files & SPA Fallback
app.UseDefaultFiles();
app.UseStaticFiles();
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
