namespace Chatbot.Data.Models;

public class DocumentEntity
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public DateTime UploadedAtUtc { get; set; } = DateTime.UtcNow;
    public int ChunkCount { get; set; }
}

public class ChunkEntity
{
    public string Id { get; set; } = string.Empty;
    public string DocumentId { get; set; } = string.Empty;
    public string DocumentName { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public int StartOffset { get; set; }
    public int EndOffset { get; set; }
    public float[] Embedding { get; set; } = Array.Empty<float>();
}

public class CitationItem
{
    public string CitationId { get; set; } = string.Empty;
    public string DocumentId { get; set; } = string.Empty;
    public string DocumentName { get; set; } = string.Empty;
    public int StartOffset { get; set; }
    public int EndOffset { get; set; }
    public string Snippet { get; set; } = string.Empty;
    public float RelevanceScore { get; set; }
    public string SourceType { get; set; } = "internal"; // "internal" | "external"
    public string? Url { get; set; }
    public string? VerifiedOrg { get; set; }
}
