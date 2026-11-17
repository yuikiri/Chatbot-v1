namespace Chatbot.Rag.Providers;

public interface IEmbeddingClient
{
    Task<float[]> GenerateEmbeddingAsync(string text, CancellationToken ct = default);
}

public interface ILlmClient
{
    IAsyncEnumerable<string> StreamChatAsync(string systemPrompt, string userPrompt, CancellationToken ct = default);
    Task<string> CompleteChatAsync(string systemPrompt, string userPrompt, CancellationToken ct = default);
}
