namespace Chatbot.Data.Models;

public class DocumentEntity
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public string RawFilePath { get; set; } = string.Empty;
    public string NormalizedFilePath { get; set; } = string.Empty;
    public string? SourceUrl { get; set; }
    public string SourceType { get; set; } = "upload"; // "upload" | "crawl"
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

public record ChatRequest(string Message, string? Mode = "strict");
public record CrawlDocumentRequest(string Url);
public record UpdateModelConfigRequest(string? Provider, string? Model, string? BaseUrl, string? ApiKey, string? EmbeddingModel);

public class ScenarioEntity
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string Code { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string ClaimText { get; set; } = string.Empty;
    public string Platform { get; set; } = "Khác";
    public string DoubtSignals { get; set; } = string.Empty;
    public string PotentialRisk { get; set; } = string.Empty;
    public int DisplayOrder { get; set; } = 0;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
}

public record CreateScenarioRequest(
    string? Code,
    string Title,
    string ClaimText,
    string? Platform,
    string? DoubtSignals,
    string? PotentialRisk,
    int? DisplayOrder,
    bool? IsActive
);

public record UpdateScenarioRequest(
    string? Code,
    string? Title,
    string? ClaimText,
    string? Platform,
    string? DoubtSignals,
    string? PotentialRisk,
    int? DisplayOrder,
    bool? IsActive
);

