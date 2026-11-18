using System.Text;
using Chatbot.Data.Models;
using Chatbot.Data.Storage;
using Chatbot.Rag.Parsers;

namespace Chatbot.Data.Repositories;

public class DocumentRepository : IDocumentRepository
{
    private readonly SqliteKnowledgeStore _store;
    private readonly string _documentsDirectory;
    private readonly string _rawDirectory;
    private readonly string _normalizedDirectory;

    public DocumentRepository(SqliteKnowledgeStore store, string documentsDirectory)
    {
        _store = store;
        _documentsDirectory = documentsDirectory;

        _rawDirectory = Path.Combine(_documentsDirectory, "raw");
        _normalizedDirectory = Path.Combine(_documentsDirectory, "normalized");

        Directory.CreateDirectory(_documentsDirectory);
        Directory.CreateDirectory(_rawDirectory);
        Directory.CreateDirectory(_normalizedDirectory);
    }

    public async Task<DocumentEntity> SaveFileAsync(string fileName, Stream contentStream, CancellationToken ct = default)
    {
        string docId = "doc_" + Guid.NewGuid().ToString("N")[..12];
        string safeFileName = Path.GetFileName(fileName);
        string rawStorageFileName = $"{docId}_{safeFileName}";
        string rawPhysicalPath = Path.Combine(_rawDirectory, rawStorageFileName);

        // 1. Tầng 1: Lưu tệp nguyên gốc (Raw File)
        using (var fileStream = new FileStream(rawPhysicalPath, FileMode.Create, FileAccess.Write, FileShare.None))
        {
            await contentStream.CopyToAsync(fileStream, ct);
        }

        var fileInfo = new FileInfo(rawPhysicalPath);

        // 2. Tầng 2: Giải mã và chuẩn hóa sang tệp Markdown đồng nhất (Normalized Form)
        string title = Path.GetFileNameWithoutExtension(safeFileName);
        string extractedText = await DocumentTextParser.ExtractTextAsync(rawPhysicalPath, ct);

        string normalizedContent = $@"# TIÊU ĐỀ: {title}
- TỆP GỐC THAM CHIẾU: {safeFileName}
- NGÀY THU THẬP: {DateTime.UtcNow:dd/MM/yyyy HH:mm:ss} UTC
- LOẠI NGUỒN: Tải lên trực tiếp
============================================================

{extractedText}";

        string normStorageFileName = $"{docId}_normalized.md";
        string normPhysicalPath = Path.Combine(_normalizedDirectory, normStorageFileName);
        await File.WriteAllTextAsync(normPhysicalPath, normalizedContent, Encoding.UTF8, ct);

        var doc = new DocumentEntity
        {
            Id = docId,
            Title = title,
            FileName = safeFileName,
            FilePath = normPhysicalPath,
            RawFilePath = rawPhysicalPath,
            NormalizedFilePath = normPhysicalPath,
            SourceUrl = null,
            SourceType = "upload",
            FileSizeBytes = fileInfo.Length,
            UploadedAtUtc = DateTime.UtcNow,
            ChunkCount = 0
        };

        await _store.UpsertDocumentAsync(doc, ct);
        return doc;
    }

    public async Task<DocumentEntity> SaveCrawledFileAsync(
        string title, 
        string formattedText, 
        string suggestedFileName, 
        string sourceUrl, 
        string rawHtml, 
        CancellationToken ct = default)
    {
        string docId = "doc_" + Guid.NewGuid().ToString("N")[..12];
        string safeFileName = Path.GetFileName(suggestedFileName);

        // 1. Tầng 1: Lưu mã HTML gốc vào thư mục raw
        string rawFileName = $"{docId}_source.html";
        string rawPhysicalPath = Path.Combine(_rawDirectory, rawFileName);
        await File.WriteAllTextAsync(rawPhysicalPath, rawHtml ?? formattedText, Encoding.UTF8, ct);

        // 2. Tầng 2: Lưu tệp văn bản chuẩn hóa Markdown vào thư mục normalized
        string normFileName = $"{docId}_normalized.md";
        string normPhysicalPath = Path.Combine(_normalizedDirectory, normFileName);
        await File.WriteAllTextAsync(normPhysicalPath, formattedText, Encoding.UTF8, ct);

        var fileInfo = new FileInfo(normPhysicalPath);

        var doc = new DocumentEntity
        {
            Id = docId,
            Title = title,
            FileName = safeFileName,
            FilePath = normPhysicalPath,
            RawFilePath = rawPhysicalPath,
            NormalizedFilePath = normPhysicalPath,
            SourceUrl = sourceUrl,
            SourceType = "crawl",
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

        // Xóa thác 2 tầng trên ổ cứng (Raw & Normalized)
        DeletePhysicalFileSafely(doc.RawFilePath);
        DeletePhysicalFileSafely(doc.NormalizedFilePath);
        DeletePhysicalFileSafely(doc.FilePath);

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
        if (doc == null)
            return null;

        // Ưu tiên đọc từ tệp chuẩn hóa (Normalized)
        string targetPath = !string.IsNullOrEmpty(doc.NormalizedFilePath) && File.Exists(doc.NormalizedFilePath)
            ? doc.NormalizedFilePath
            : doc.FilePath;

        if (!File.Exists(targetPath) && !string.IsNullOrEmpty(doc.RawFilePath) && File.Exists(doc.RawFilePath))
        {
            targetPath = doc.RawFilePath;
        }

        if (!File.Exists(targetPath))
            return null;

        return await DocumentTextParser.ExtractTextAsync(targetPath, ct);
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

    private static void DeletePhysicalFileSafely(string? path)
    {
        if (string.IsNullOrWhiteSpace(path)) return;
        try
        {
            if (File.Exists(path))
            {
                File.Delete(path);
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Cảnh báo] Không thể xóa file vật lý '{path}': {ex.Message}");
        }
    }
}
