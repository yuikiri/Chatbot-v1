using Chatbot.Data.Models;

namespace Chatbot.Data.Repositories;

public interface IDocumentRepository
{
    Task<DocumentEntity> SaveFileAsync(string fileName, Stream contentStream, CancellationToken ct = default);
    Task<DocumentEntity> SaveCrawledFileAsync(string title, string formattedText, string suggestedFileName, string sourceUrl, string rawHtml, CancellationToken ct = default);
    Task<bool> DeleteDocumentAsync(string documentId, CancellationToken ct = default);
    Task<IReadOnlyList<DocumentEntity>> GetAllDocumentsAsync(CancellationToken ct = default);
    Task<DocumentEntity?> GetDocumentByIdAsync(string documentId, CancellationToken ct = default);
    Task<string?> GetDocumentRawTextAsync(string documentId, CancellationToken ct = default);
    Task SaveChunksAsync(string documentId, IEnumerable<ChunkEntity> chunks, CancellationToken ct = default);
    Task<IReadOnlyList<ChunkEntity>> GetAllChunksAsync(CancellationToken ct = default);
}
