using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Runtime.CompilerServices;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using Chatbot.Common;

namespace Chatbot.Rag.Providers;

public class OpenAiCompatibleProvider : ILlmClient, IEmbeddingClient
{
    private readonly HttpClient _httpClient;
    private readonly string _baseUrl;
    private readonly string _apiKey;
    private readonly List<string> _chatModels;
    private readonly List<string> _embeddingModels;
    private string _lastUsedChatModel = string.Empty;
    private string _lastUsedEmbeddingModel = string.Empty;

    public IReadOnlyList<string> ChatModels => _chatModels;
    public IReadOnlyList<string> EmbeddingModels => _embeddingModels;
    public string ActiveChatModel => !string.IsNullOrEmpty(_lastUsedChatModel) ? _lastUsedChatModel : (_chatModels.FirstOrDefault() ?? "gpt-4o-mini");
    public string ActiveEmbeddingModel => !string.IsNullOrEmpty(_lastUsedEmbeddingModel) ? _lastUsedEmbeddingModel : (_embeddingModels.FirstOrDefault() ?? "text-embedding-3-small");

    public OpenAiCompatibleProvider(
        HttpClient httpClient, 
        string baseUrl, 
        string apiKey, 
        string chatModel = "gpt-4o-mini", 
        string embeddingModel = "text-embedding-3-small")
    {
        _httpClient = httpClient;
        _baseUrl = baseUrl.TrimEnd('/');
        _apiKey = apiKey;

        _chatModels = RagConstants.ParseModelList(chatModel, "gpt-4o-mini");
        _embeddingModels = RagConstants.ParseModelList(embeddingModel, "text-embedding-3-small");
    }

    public async Task<float[]> GenerateEmbeddingAsync(string text, CancellationToken ct = default)
    {
        string url = $"{_baseUrl}/embeddings";
        Exception? lastEx = null;

        foreach (var model in _embeddingModels)
        {
            try
            {
                var payload = new
                {
                    model = model,
                    input = text
                };

                using var request = new HttpRequestMessage(HttpMethod.Post, url)
                {
                    Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")
                };
                if (!string.IsNullOrWhiteSpace(_apiKey))
                {
                    request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
                }

                var response = await _httpClient.SendAsync(request, ct);
                if (!response.IsSuccessStatusCode)
                {
                    var err = await response.Content.ReadAsStringAsync(ct);
                    Console.WriteLine($"[OpenAI Embedding Failover] Model '{model}' lỗi {(int)response.StatusCode}: {err}. Chuyển sang model tiếp theo...");
                    lastEx = new HttpRequestException($"Model '{model}' lỗi {(int)response.StatusCode}: {err}", null, response.StatusCode);
                    continue;
                }

                var json = await response.Content.ReadFromJsonAsync<JsonNode>(cancellationToken: ct);
                var dataArray = json?["data"]?.AsArray();
                var embeddingArray = dataArray?[0]?["embedding"]?.AsArray();

                if (embeddingArray == null)
                {
                    Console.WriteLine($"[OpenAI Embedding Failover] Model '{model}' không trả về embedding. Thử model tiếp theo...");
                    continue;
                }

                var vector = new float[embeddingArray.Count];
                for (int i = 0; i < embeddingArray.Count; i++)
                {
                    vector[i] = (float)(embeddingArray[i]?.GetValue<double>() ?? 0.0);
                }

                _lastUsedEmbeddingModel = model;
                return vector;
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                Console.WriteLine($"[OpenAI Embedding Failover] Ngoại lệ model '{model}': {ex.Message}. Thử model tiếp theo...");
                lastEx = ex;
            }
        }

        throw lastEx ?? new InvalidOperationException("Không thể tạo vector embedding từ bất kỳ model nào.");
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
        string url = $"{_baseUrl}/chat/completions";
        HttpResponseMessage? activeResponse = null;
        Exception? lastEx = null;

        foreach (var model in _chatModels)
        {
            try
            {
                var payload = new
                {
                    model = model,
                    stream = true,
                    temperature = 0.2,
                    messages = new[]
                    {
                        new { role = "system", content = systemPrompt },
                        new { role = "user", content = userPrompt }
                    }
                };

                var request = new HttpRequestMessage(HttpMethod.Post, url)
                {
                    Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")
                };
                if (!string.IsNullOrWhiteSpace(_apiKey))
                {
                    request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
                }

                var response = await _httpClient.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, ct);
                if (!response.IsSuccessStatusCode)
                {
                    var err = await response.Content.ReadAsStringAsync(ct);
                    Console.WriteLine($"[OpenAI Chat Failover] Model '{model}' trả về {(int)response.StatusCode}: {err}. Đang chuyển sang model dự phòng tiếp theo...");
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
                Console.WriteLine($"[OpenAI Chat Failover] Model '{model}' ngoại lệ: {ex.Message}. Đang thử model tiếp theo...");
                lastEx = ex;
            }
        }

        if (activeResponse == null)
        {
            throw lastEx ?? new InvalidOperationException("Không thể kết nối tới bất kỳ mô hình AI nào.");
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
                        piece = node?["choices"]?[0]?["delta"]?["content"]?.GetValue<string>();
                    }
                    catch
                    {
                        // ignore malformed SSE line
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
