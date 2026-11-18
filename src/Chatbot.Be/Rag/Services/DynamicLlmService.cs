using System.Runtime.CompilerServices;
using Chatbot.Rag.Providers;

namespace Chatbot.Rag.Services;

public record ModelConfigurationInfo(
    string Provider,
    string Model,
    string BaseUrl,
    string EmbeddingModel,
    bool HasApiKey,
    DateTime LastSwitchedAtUtc,
    long TotalRequests,
    long SuccessfulRequests,
    long FailedRequests,
    long EstimatedInputTokens,
    long EstimatedOutputTokens,
    IReadOnlyList<string> ChatModels,
    IReadOnlyList<string> EmbeddingModels,
    string ActiveChatModel,
    string ActiveEmbeddingModel
);

public record ModelTestResult(
    bool Success, 
    long LatencyMs, 
    string? Reply, 
    string? Error
);

public class DynamicLlmService : ILlmClient, IEmbeddingClient
{
    private readonly HttpClient _httpClient;
    private readonly object _lock = new();

    private string _provider;
    private string _baseUrl;
    private string _apiKey;
    private string _geminiApiKey;
    private string _chatModel;
    private string _embeddingModel;
    private DateTime _lastSwitchedAtUtc = DateTime.UtcNow;

    private ILlmClient _activeLlmClient = null!;
    private IEmbeddingClient _activeEmbeddingClient = null!;

    // Metrics counter
    private long _totalRequests;
    private long _successfulRequests;
    private long _failedRequests;
    private long _estimatedInputTokens;
    private long _estimatedOutputTokens;

    public DynamicLlmService(
        HttpClient httpClient,
        string provider,
        string baseUrl,
        string apiKey,
        string chatModel,
        string embeddingModel)
    {
        _httpClient = httpClient;
        _provider = string.IsNullOrWhiteSpace(provider) ? "gemini" : provider.Trim().ToLowerInvariant();
        _baseUrl = string.IsNullOrWhiteSpace(baseUrl) ? "https://generativelanguage.googleapis.com" : baseUrl.Trim();
        _apiKey = apiKey?.Trim() ?? string.Empty;
        _geminiApiKey = _provider.Equals("gemini", StringComparison.OrdinalIgnoreCase) 
            ? _apiKey 
            : (Environment.GetEnvironmentVariable("GEMINI_API_KEY") ?? Environment.GetEnvironmentVariable("LLM_API_KEY") ?? string.Empty);
        _chatModel = string.IsNullOrWhiteSpace(chatModel) ? "gemini-1.5-flash" : chatModel.Trim();
        _embeddingModel = string.IsNullOrWhiteSpace(embeddingModel) ? "gemini-embedding-001" : embeddingModel.Trim();

        RebuildClients();
    }

    private void RebuildClients()
    {
        if (_provider.Equals("custom_openai", StringComparison.OrdinalIgnoreCase) || 
            _provider.Equals("openai", StringComparison.OrdinalIgnoreCase) ||
            _provider.Equals("9router", StringComparison.OrdinalIgnoreCase))
        {
            var openAi = new OpenAiCompatibleProvider(_httpClient, _baseUrl, _apiKey, _chatModel, _embeddingModel);
            _activeLlmClient = openAi;

            // Nếu embeddingModel là của Gemini (tương thích 3072 chiều trên Qdrant) và có geminiApiKey, bảo tồn GeminiProvider
            if (_embeddingModel.Contains("gemini", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrWhiteSpace(_geminiApiKey))
            {
                _activeEmbeddingClient = new GeminiProvider(_httpClient, _geminiApiKey, _chatModel, _embeddingModel);
            }
            else
            {
                _activeEmbeddingClient = openAi;
            }
        }
        else
        {
            var gemini = new GeminiProvider(_httpClient, _apiKey, _chatModel, _embeddingModel);
            _activeLlmClient = gemini;
            _activeEmbeddingClient = gemini;
            if (!string.IsNullOrWhiteSpace(_apiKey))
            {
                _geminiApiKey = _apiKey;
            }
        }
    }

    public ModelConfigurationInfo GetConfiguration()
    {
        lock (_lock)
        {
            IReadOnlyList<string> chatModels = _activeLlmClient switch
            {
                GeminiProvider g => g.ChatModels,
                OpenAiCompatibleProvider o => o.ChatModels,
                _ => new[] { _chatModel }
            };

            IReadOnlyList<string> embModels = _activeEmbeddingClient switch
            {
                GeminiProvider g => g.EmbeddingModels,
                OpenAiCompatibleProvider o => o.EmbeddingModels,
                _ => new[] { _embeddingModel }
            };

            string activeChat = _activeLlmClient switch
            {
                GeminiProvider g => g.ActiveChatModel,
                OpenAiCompatibleProvider o => o.ActiveChatModel,
                _ => _chatModel
            };

            string activeEmb = _activeEmbeddingClient switch
            {
                GeminiProvider g => g.ActiveEmbeddingModel,
                OpenAiCompatibleProvider o => o.ActiveEmbeddingModel,
                _ => _embeddingModel
            };

            return new ModelConfigurationInfo(
                Provider: _provider,
                Model: _chatModel,
                BaseUrl: _baseUrl,
                EmbeddingModel: _embeddingModel,
                HasApiKey: !string.IsNullOrWhiteSpace(_apiKey),
                LastSwitchedAtUtc: _lastSwitchedAtUtc,
                TotalRequests: Volatile.Read(ref _totalRequests),
                SuccessfulRequests: Volatile.Read(ref _successfulRequests),
                FailedRequests: Volatile.Read(ref _failedRequests),
                EstimatedInputTokens: Volatile.Read(ref _estimatedInputTokens),
                EstimatedOutputTokens: Volatile.Read(ref _estimatedOutputTokens),
                ChatModels: chatModels,
                EmbeddingModels: embModels,
                ActiveChatModel: activeChat,
                ActiveEmbeddingModel: activeEmb
            );
        }
    }

    public IReadOnlyList<string> ChatModels
    {
        get
        {
            lock (_lock)
            {
                if (_activeLlmClient is GeminiProvider g) return g.ChatModels;
                if (_activeLlmClient is OpenAiCompatibleProvider o) return o.ChatModels;
                return new[] { _chatModel };
            }
        }
    }

    public IReadOnlyList<string> EmbeddingModels
    {
        get
        {
            lock (_lock)
            {
                if (_activeEmbeddingClient is GeminiProvider g) return g.EmbeddingModels;
                if (_activeEmbeddingClient is OpenAiCompatibleProvider o) return o.EmbeddingModels;
                return new[] { _embeddingModel };
            }
        }
    }

    public bool UpdateConfiguration(
        string? newProvider, 
        string? newModel, 
        string? newBaseUrl, 
        string? newApiKey, 
        string? newEmbeddingModel)
    {
        lock (_lock)
        {
            bool changed = false;

            if (!string.IsNullOrWhiteSpace(newProvider))
            {
                var p = newProvider.Trim().ToLowerInvariant();
                if (p != _provider) { _provider = p; changed = true; }
            }

            if (!string.IsNullOrWhiteSpace(newModel))
            {
                var m = newModel.Trim();
                if (m != _chatModel) { _chatModel = m; changed = true; }
            }

            if (!string.IsNullOrWhiteSpace(newBaseUrl))
            {
                var b = newBaseUrl.Trim();
                if (b != _baseUrl) { _baseUrl = b; changed = true; }
            }

            if (!string.IsNullOrWhiteSpace(newApiKey))
            {
                var k = newApiKey.Trim();
                if (k != _apiKey) { _apiKey = k; changed = true; }
            }

            if (!string.IsNullOrWhiteSpace(newEmbeddingModel))
            {
                var e = newEmbeddingModel.Trim();
                if (e != _embeddingModel) { _embeddingModel = e; changed = true; }
            }

            if (changed)
            {
                if (_provider.Equals("gemini", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrWhiteSpace(_apiKey))
                {
                    _geminiApiKey = _apiKey;
                }
                _lastSwitchedAtUtc = DateTime.UtcNow;
                RebuildClients();
                Console.WriteLine($"[DynamicLlmService] Đã cập nhật cấu hình: Provider='{_provider}', Model='{_chatModel}', BaseUrl='{_baseUrl}'");
            }

            return changed;
        }
    }

    public async Task<ModelTestResult> TestConnectionAsync(
        string? testProvider,
        string? testModel,
        string? testBaseUrl,
        string? testApiKey,
        CancellationToken ct = default)
    {
        string prov = (testProvider ?? _provider).Trim().ToLowerInvariant();
        string mdl = (testModel ?? _chatModel).Trim();
        string url = (testBaseUrl ?? _baseUrl).Trim();
        string key = !string.IsNullOrWhiteSpace(testApiKey) ? testApiKey.Trim() : _apiKey;

        if (prov.Equals("gemini", StringComparison.OrdinalIgnoreCase) && string.IsNullOrWhiteSpace(key))
        {
            key = _geminiApiKey;
        }

        if (string.IsNullOrWhiteSpace(key))
        {
            return new ModelTestResult(false, 0, null, "Chưa cung cấp API Key để kiểm tra.");
        }

        var sw = System.Diagnostics.Stopwatch.StartNew();
        using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        cts.CancelAfter(TimeSpan.FromSeconds(15));

        try
        {
            ILlmClient client;
            if (prov.Equals("custom_openai", StringComparison.OrdinalIgnoreCase) || 
                prov.Equals("openai", StringComparison.OrdinalIgnoreCase) ||
                prov.Equals("9router", StringComparison.OrdinalIgnoreCase))
            {
                client = new OpenAiCompatibleProvider(_httpClient, url, key, mdl, _embeddingModel);
            }
            else
            {
                client = new GeminiProvider(_httpClient, key, mdl, _embeddingModel);
            }

            var reply = await client.CompleteChatAsync(
                "You are an assistant. Reply with only one word: OK", 
                "Ping test", 
                cts.Token
            );
            sw.Stop();

            return new ModelTestResult(true, sw.ElapsedMilliseconds, reply.Trim(), null);
        }
        catch (Exception ex)
        {
            sw.Stop();
            var errMsg = ex.InnerException != null ? $"{ex.Message} -> {ex.InnerException.Message}" : ex.Message;
            return new ModelTestResult(false, sw.ElapsedMilliseconds, null, errMsg);
        }
    }

    public async Task<float[]> GenerateEmbeddingAsync(string text, CancellationToken ct = default)
    {
        IEmbeddingClient client;
        lock (_lock) { client = _activeEmbeddingClient; }

        Interlocked.Increment(ref _totalRequests);
        int estTokens = Math.Max(1, text.Length / 4);
        Interlocked.Add(ref _estimatedInputTokens, estTokens);

        try
        {
            var res = await client.GenerateEmbeddingAsync(text, ct);
            Interlocked.Increment(ref _successfulRequests);
            return res;
        }
        catch
        {
            Interlocked.Increment(ref _failedRequests);
            throw;
        }
    }

    public async Task<string> CompleteChatAsync(string systemPrompt, string userPrompt, CancellationToken ct = default)
    {
        ILlmClient client;
        lock (_lock) { client = _activeLlmClient; }

        Interlocked.Increment(ref _totalRequests);
        int estIn = Math.Max(1, (systemPrompt.Length + userPrompt.Length) / 4);
        Interlocked.Add(ref _estimatedInputTokens, estIn);

        try
        {
            var res = await client.CompleteChatAsync(systemPrompt, userPrompt, ct);
            Interlocked.Increment(ref _successfulRequests);
            int estOut = Math.Max(1, res.Length / 4);
            Interlocked.Add(ref _estimatedOutputTokens, estOut);
            return res;
        }
        catch
        {
            Interlocked.Increment(ref _failedRequests);
            throw;
        }
    }

    public async IAsyncEnumerable<string> StreamChatAsync(
        string systemPrompt, 
        string userPrompt, 
        [EnumeratorCancellation] CancellationToken ct = default)
    {
        ILlmClient client;
        lock (_lock) { client = _activeLlmClient; }

        Interlocked.Increment(ref _totalRequests);
        int estIn = Math.Max(1, (systemPrompt.Length + userPrompt.Length) / 4);
        Interlocked.Add(ref _estimatedInputTokens, estIn);

        int outChars = 0;
        IAsyncEnumerable<string> stream;
        try
        {
            stream = client.StreamChatAsync(systemPrompt, userPrompt, ct);
        }
        catch
        {
            Interlocked.Increment(ref _failedRequests);
            throw;
        }

        var enumerator = stream.GetAsyncEnumerator(ct);
        bool hasNext = true;

        while (hasNext)
        {
            string piece;
            try
            {
                hasNext = await enumerator.MoveNextAsync();
                if (!hasNext) break;
                piece = enumerator.Current;
            }
            catch
            {
                Interlocked.Increment(ref _failedRequests);
                throw;
            }

            outChars += piece.Length;
            yield return piece;
        }

        Interlocked.Increment(ref _successfulRequests);
        int estOut = Math.Max(1, outChars / 4);
        Interlocked.Add(ref _estimatedOutputTokens, estOut);
    }
}
