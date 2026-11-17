using Chatbot.Data.Models;
using Chatbot.Data.Storage;

namespace Chatbot.Data.Repositories;

public class DocumentRepository : IDocumentRepository
{
    private readonly SqliteKnowledgeStore _store;
    private readonly string _documentsDirectory;

    public DocumentRepository(SqliteKnowledgeStore store, string documentsDirectory)
    {
        _store = store;
        _documentsDirectory = documentsDirectory;

        if (!Directory.Exists(_documentsDirectory))
        {
            Directory.CreateDirectory(_documentsDirectory);
        }
    }

    public async Task<DocumentEntity> SaveFileAsync(string fileName, Stream contentStream, CancellationToken ct = default)
    {
        string docId = "doc_" + Guid.NewGuid().ToString("N")[..12];
        string safeFileName = Path.GetFileName(fileName);
        string extension = Path.GetExtension(safeFileName);
        string storageFileName = $"{docId}_{safeFileName}";
        string physicalPath = Path.Combine(_documentsDirectory, storageFileName);

        using (var fileStream = new FileStream(physicalPath, FileMode.Create, FileAccess.Write, FileShare.None))
        {
            await contentStream.CopyToAsync(fileStream, ct);
        }

        var fileInfo = new FileInfo(physicalPath);

        var doc = new DocumentEntity
        {
            Id = docId,
            Title = Path.GetFileNameWithoutExtension(safeFileName),
            FileName = safeFileName,
            FilePath = physicalPath,
            FileSizeBytes = fileInfo.Length,
            UploadedAtUtc = DateTime.UtcNow,
            ChunkCount = 0
        };

        await _store.UpsertDocumentAsync(doc, ct);
        return doc;
    }

    public async Task<bool> DeleteDocumentAsync(string documentId, CancellationToken ct = default)
    {
        var doc = await _store.GetDocumentByIdAsync(documentId, ct);
        if (doc == null)
            return false;

        // Xóa file vật lý trên đĩa
        if (File.Exists(doc.FilePath))
        {
            try
            {
                File.Delete(doc.FilePath);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Cảnh báo] Không thể xóa file vật lý: {ex.Message}");
            }
        }

        // Xóa trong SQLite
        await _store.DeleteDocumentAsync(documentId, ct);
        return true;
    }

    public async Task<IReadOnlyList<DocumentEntity>> GetAllDocumentsAsync(CancellationToken ct = default)
    {
        return await _store.GetAllDocumentsAsync(ct);
    }

    public async Task<DocumentEntity?> GetDocumentByIdAsync(string documentId, CancellationToken ct = default)
    {
        return await _store.GetDocumentByIdAsync(documentId, ct);
    }

    public async Task<string?> GetDocumentRawTextAsync(string documentId, CancellationToken ct = default)
    {
        var doc = await _store.GetDocumentByIdAsync(documentId, ct);
        if (doc == null || !File.Exists(doc.FilePath))
            return null;

        var ext = Path.GetExtension(doc.FilePath).ToLowerInvariant();
        if (ext == ".txt" || ext == ".md" || ext == ".json")
        {
            return await File.ReadAllTextAsync(doc.FilePath, ct);
        }

        // Với file khác, nếu là PDF thì sẽ được bóc tách thông qua Parser của RAG
        return await File.ReadAllTextAsync(doc.FilePath, ct);
    }

    public async Task SaveChunksAsync(string documentId, IEnumerable<ChunkEntity> chunks, CancellationToken ct = default)
    {
        var chunkList = chunks.ToList();
        await _store.SaveChunksAsync(documentId, chunkList, ct);

        var doc = await _store.GetDocumentByIdAsync(documentId, ct);
        if (doc != null)
        {
            doc.ChunkCount = chunkList.Count;
            await _store.UpsertDocumentAsync(doc, ct);
        }
    }

    public async Task<IReadOnlyList<ChunkEntity>> GetAllChunksAsync(CancellationToken ct = default)
    {
        return await _store.GetAllChunksAsync(ct);
    }
}
