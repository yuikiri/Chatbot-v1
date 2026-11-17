using System.Net.Http.Json;
using System.Runtime.CompilerServices;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace Chatbot.Rag.Providers;

public class GeminiProvider : ILlmClient, IEmbeddingClient
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;
    private readonly string _chatModel;
    private readonly string _embeddingModel;

    public GeminiProvider(HttpClient httpClient, string apiKey, string chatModel = "gemini-3.5-flash-lite", string embeddingModel = "gemini-embedding-001")
    {
        _httpClient = httpClient;
        _apiKey = apiKey;
        _chatModel = chatModel;
        _embeddingModel = embeddingModel;
    }

    public async Task<float[]> GenerateEmbeddingAsync(string text, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_apiKey))
            throw new InvalidOperationException("Chưa cấu hình GEMINI_API_KEY.");

        string url = $"https://generativelanguage.googleapis.com/v1beta/models/{_embeddingModel}:embedContent?key={_apiKey}";

        var payload = new
        {
            model = $"models/{_embeddingModel}",
            content = new
            {
                parts = new[] { new { text } }
            }
        };

        var response = await _httpClient.PostAsJsonAsync(url, payload, ct);
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadFromJsonAsync<JsonNode>(cancellationToken: ct);
        var valuesNode = json?["embedding"]?["values"]?.AsArray();

        if (valuesNode == null)
            return Array.Empty<float>();

        var vector = new float[valuesNode.Count];
        for (int i = 0; i < valuesNode.Count; i++)
        {
            vector[i] = (float)(valuesNode[i]?.GetValue<double>() ?? 0.0);
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
        if (string.IsNullOrWhiteSpace(_apiKey))
            throw new InvalidOperationException("Chưa cấu hình GEMINI_API_KEY.");

        // Dùng SSE stream endpoint của Google Gemini
        string url = $"https://generativelanguage.googleapis.com/v1beta/models/{_chatModel}:streamGenerateContent?alt=sse&key={_apiKey}";

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

        using var request = new HttpRequestMessage(HttpMethod.Post, url)
        {
            Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")
        };

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
                    // bỏ qua lỗi parse json từng dòng SSE nhỏ
                }

                if (!string.IsNullOrEmpty(piece))
                {
                    yield return piece;
                }
            }
        }
    }
}
