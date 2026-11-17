using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Runtime.CompilerServices;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace Chatbot.Rag.Providers;

public class OpenAiCompatibleProvider : ILlmClient, IEmbeddingClient
{
    private readonly HttpClient _httpClient;
    private readonly string _baseUrl;
    private readonly string _apiKey;
    private readonly string _chatModel;
    private readonly string _embeddingModel;

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
        _chatModel = chatModel;
        _embeddingModel = embeddingModel;
    }

    public async Task<float[]> GenerateEmbeddingAsync(string text, CancellationToken ct = default)
    {
        string url = $"{_baseUrl}/embeddings";

        var payload = new
        {
            model = _embeddingModel,
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
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadFromJsonAsync<JsonNode>(cancellationToken: ct);
        var dataArray = json?["data"]?.AsArray();
        var embeddingArray = dataArray?[0]?["embedding"]?.AsArray();

        if (embeddingArray == null)
            return Array.Empty<float>();

        var vector = new float[embeddingArray.Count];
        for (int i = 0; i < embeddingArray.Count; i++)
        {
            vector[i] = (float)(embeddingArray[i]?.GetValue<double>() ?? 0.0);
        }

        return vector;
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

        var payload = new
        {
            model = _chatModel,
            stream = true,
            temperature = 0.2,
            messages = new[]
            {
                new { role = "system", content = systemPrompt },
                new { role = "user", content = userPrompt }
            }
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, url)
        {
            Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")
        };
        if (!string.IsNullOrWhiteSpace(_apiKey))
        {
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
        }

        using var response = await _httpClient.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, ct);
        response.EnsureSuccessStatusCode();

        using var stream = await response.Content.ReadAsStreamAsync(ct);
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
