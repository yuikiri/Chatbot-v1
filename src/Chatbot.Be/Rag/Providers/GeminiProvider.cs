using System.Net.Http.Json;
using System.Runtime.CompilerServices;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using Chatbot.Common;

namespace Chatbot.Rag.Providers;

public class GeminiProvider : ILlmClient, IEmbeddingClient
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;
    private readonly List<string> _chatModels;
    private readonly List<string> _embeddingModels;

    private string _lastUsedChatModel = string.Empty;
    private string _lastUsedEmbeddingModel = string.Empty;

    public IReadOnlyList<string> ChatModels => _chatModels;
    public IReadOnlyList<string> EmbeddingModels => _embeddingModels;
    public string ActiveChatModel => !string.IsNullOrEmpty(_lastUsedChatModel) ? _lastUsedChatModel : (_chatModels.FirstOrDefault() ?? "gemini-3.5-flash-lite");
    public string ActiveEmbeddingModel => !string.IsNullOrEmpty(_lastUsedEmbeddingModel) ? _lastUsedEmbeddingModel : (_embeddingModels.FirstOrDefault() ?? "gemini-embedding-001");

    public GeminiProvider(
        HttpClient httpClient, 
        string apiKey, 
        string chatModel = "gemini-3.5-flash-lite,gemini-3.1-flash-lite,gemini-2.5-flash-lite", 
        string embeddingModel = "gemini-embedding-001,gemini-embedding-002")
    {
        _httpClient = httpClient;
        _apiKey = apiKey;

        _chatModels = RagConstants.ParseModelList(chatModel, "gemini-3.5-flash-lite");
        _embeddingModels = RagConstants.ParseModelList(embeddingModel, "gemini-embedding-001");
    }

    public async Task<float[]> GenerateEmbeddingAsync(string text, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_apiKey))
            throw new InvalidOperationException("Chưa cấu hình GEMINI_API_KEY.");

        Exception? lastEx = null;

        // Cơ chế failover: Thử lần lượt các model embedding trong danh sách ưu tiên
        foreach (var model in _embeddingModels)
        {
            try
            {
                string url = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:embedContent?key={_apiKey}";

                var payload = new
                {
                    model = $"models/{model}",
                    content = new
                    {
                        parts = new[] { new { text } }
                    }
                };

                var response = await _httpClient.PostAsJsonAsync(url, payload, ct);
                if (!response.IsSuccessStatusCode)
                {
                    var err = await response.Content.ReadAsStringAsync(ct);
                    Console.WriteLine($"[Gemini Embedding Failover] Model '{model}' trả về {(int)response.StatusCode}: {err}. Đang tự động chuyển sang model dự phòng tiếp theo...");
                    lastEx = new HttpRequestException($"Model '{model}' lỗi {(int)response.StatusCode}: {err}", null, response.StatusCode);
                    continue;
                }

                var json = await response.Content.ReadFromJsonAsync<JsonNode>(cancellationToken: ct);
                var valuesNode = json?["embedding"]?["values"]?.AsArray();

                if (valuesNode == null)
                {
                    Console.WriteLine($"[Gemini Embedding Failover] Model '{model}' không trả về vector. Thử model tiếp theo...");
                    continue;
                }

                var vector = new float[valuesNode.Count];
                for (int i = 0; i < valuesNode.Count; i++)
                {
                    vector[i] = (float)(valuesNode[i]?.GetValue<double>() ?? 0.0);
                }

                _lastUsedEmbeddingModel = model;
                return vector;
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                Console.WriteLine($"[Gemini Embedding Failover] Model '{model}' ngoại lệ: {ex.Message}. Đang thử model dự phòng tiếp theo...");
                lastEx = ex;
            }
        }

        throw lastEx ?? new InvalidOperationException("Không thể tạo vector embedding từ bất kỳ model nào trong danh sách.");
    }

    public async Task<string> CompleteChatAsync(string systemPrompt, string userPrompt, CancellationToken ct = default)
    {
        var sb = new StringBuilder();
        await foreach (var token in StreamChatAsync(systemPrompt, userPrompt, ct))
        {
            sb.Append(token);
        }
        return sb.ToString();
    }

    public async IAsyncEnumerable<string> StreamChatAsync(string systemPrompt, string userPrompt, [EnumeratorCancellation] CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_apiKey))
            throw new InvalidOperationException("Chưa cấu hình GEMINI_API_KEY.");

        var payload = new
        {
            system_instruction = new
            {
                parts = new[] { new { text = systemPrompt } }
            },
            contents = new[]
            {
                new
                {
                    role = "user",
                    parts = new[] { new { text = userPrompt } }
                }
            },
            generationConfig = new
            {
                temperature = 0.2
            }
        };

        string jsonPayload = JsonSerializer.Serialize(payload);
        HttpResponseMessage? activeResponse = null;
        Exception? lastEx = null;

        // Cơ chế failover: Thử lần lượt các chat model từ tối ưu nhất đến dự phòng
        foreach (var model in _chatModels)
        {
            try
            {
                string url = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:streamGenerateContent?alt=sse&key={_apiKey}";
                var request = new HttpRequestMessage(HttpMethod.Post, url)
                {
                    Content = new StringContent(jsonPayload, Encoding.UTF8, "application/json")
                };

                var response = await _httpClient.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, ct);
                if (!response.IsSuccessStatusCode)
                {
                    var err = await response.Content.ReadAsStringAsync(ct);
                    Console.WriteLine($"[Gemini Chat Failover] Model '{model}' trả về {(int)response.StatusCode}: {err}. Đang tự động chuyển sang model dự phòng tiếp theo...");
                    response.Dispose();
                    lastEx = new HttpRequestException($"Model '{model}' lỗi {(int)response.StatusCode}: {err}", null, response.StatusCode);
                    continue;
                }

                activeResponse = response;
                _lastUsedChatModel = model;
                break;
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                Console.WriteLine($"[Gemini Chat Failover] Kết nối tới model '{model}' lỗi: {ex.Message}. Đang thử model dự phòng tiếp theo...");
                lastEx = ex;
            }
        }

        if (activeResponse == null)
        {
            throw lastEx ?? new InvalidOperationException("Không thể kết nối tới bất kỳ mô hình AI nào trong danh sách dự phòng.");
        }

        using (activeResponse)
        {
            using var stream = await activeResponse.Content.ReadAsStreamAsync(ct);
            using var reader = new StreamReader(stream);

            while (!reader.EndOfStream && !ct.IsCancellationRequested)
            {
                var line = await reader.ReadLineAsync(ct);
                if (string.IsNullOrWhiteSpace(line)) continue;

                if (line.StartsWith("data: "))
                {
                    var jsonStr = line[6..].Trim();
                    if (jsonStr == "[DONE]") break;

                    string? piece = null;
                    try
                    {
                        var node = JsonNode.Parse(jsonStr);
                        var candidates = node?["candidates"]?.AsArray();
                        if (candidates != null && candidates.Count > 0)
                        {
                            var parts = candidates[0]?["content"]?["parts"]?.AsArray();
                            if (parts != null && parts.Count > 0)
                            {
                                piece = parts[0]?["text"]?.GetValue<string>();
                            }
                        }
                    }
                    catch
                    {
                        // Bỏ qua lỗi parse JSON nhỏ của từng dòng chunk SSE
                    }

                    if (!string.IsNullOrEmpty(piece))
                    {
                        yield return piece;
                    }
                }
            }
        }
    }
}
