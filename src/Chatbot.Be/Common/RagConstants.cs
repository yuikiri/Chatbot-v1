namespace Chatbot.Common;

public static class RagConstants
{
    // Ngưỡng tương đồng vector cosine
    public const float DefaultMinRelevanceScore = 0.38f;
    public const int DefaultTopK = 3;

    // Kích thước phân đoạn văn bản (Chunking)
    public const int DefaultMaxChunkChars = 800;
    public const int DefaultMinChunkChars = 100;
    public const int MaxSingleParagraphChars = 1200;

    // Cấu hình AI Model mặc định
    public const string DefaultProvider = "gemini";
    public const string DefaultGoogleStudioBaseUrl = "https://generativelanguage.googleapis.com";
    public const string DefaultChatCascade = "gemini-3.5-flash-lite,gemini-3.1-flash-lite,gemini-2.5-flash-lite";
    public const string DefaultEmbeddingCascade = "gemini-embedding-001,gemini-embedding-002";

    // Qdrant Vector Cloud
    public const string DefaultQdrantCollection = "medical_knowledge";
    public const ulong DefaultVectorDimensions = 3072;

    // Thời gian timeout (giây)
    public const int CrawlerTimeoutSeconds = 30;
    public const int InspectTimeoutSeconds = 15;
    public const int VerifiedArticleTimeoutSeconds = 3;

    // Ký tự phân tách danh sách model cascade
    private static readonly char[] ModelSeparators = new[] { ',', ';', '|' };

    public static List<string> ParseModelList(string? raw, string fallback)
    {
        var list = (raw ?? fallback)
            .Split(ModelSeparators, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .ToList();
        if (list.Count == 0) list.Add(fallback);
        return list;
    }
}
