using System.Security.Cryptography;
using System.Text;
using Chatbot.Data.Models;
using Qdrant.Client;
using Qdrant.Client.Grpc;

namespace Chatbot.Rag.Services;

public class QdrantVectorService
{
    private readonly QdrantClient _client;
    private readonly string _collectionName;
    private readonly ulong _vectorSize;
    private bool _initialized;
    private readonly SemaphoreSlim _initLock = new(1, 1);

    public string CollectionName => _collectionName;
    public ulong VectorSize => _vectorSize;

    public QdrantVectorService(string endpoint, string apiKey, string collectionName = "medical_knowledge", ulong vectorSize = 768)
    {
        _collectionName = string.IsNullOrWhiteSpace(collectionName) ? "medical_knowledge" : collectionName;
        _vectorSize = vectorSize > 0 ? vectorSize : 768;

        // Xử lý endpoint để tương thích URL có http/https hoặc cổng
        string rawEndpoint = endpoint?.Trim() ?? string.Empty;
        if (!rawEndpoint.StartsWith("http://", StringComparison.OrdinalIgnoreCase) &&
            !rawEndpoint.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
        {
            rawEndpoint = "https://" + rawEndpoint;
        }

        var uri = new Uri(rawEndpoint);
        string host = uri.Host;
        int port = uri.Port > 0 && uri.Port != 80 && uri.Port != 443 ? uri.Port : 6334;
        bool isHttps = !uri.Scheme.Equals("http", StringComparison.OrdinalIgnoreCase);

        _client = new QdrantClient(host: host, port: port, https: isHttps, apiKey: apiKey);
    }

    public async Task EnsureCollectionExistsAsync(CancellationToken ct = default)
    {
        if (_initialized) return;

        await _initLock.WaitAsync(ct);
        try
        {
            if (_initialized) return;

            bool exists = await _client.CollectionExistsAsync(_collectionName, ct);
            if (!exists)
            {
                await _client.CreateCollectionAsync(
                    _collectionName,
                    new VectorParams { Size = _vectorSize, Distance = Distance.Cosine },
                    cancellationToken: ct);
                Console.WriteLine($"[Qdrant] Đã khởi tạo collection '{_collectionName}' với kích thước vector {_vectorSize} (Cosine).");
            }
            else
            {
                Console.WriteLine($"[Qdrant] Collection '{_collectionName}' đã tồn tại sẵn sàng.");
            }

            _initialized = true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Cảnh báo Qdrant] Lỗi kiểm tra/tạo collection: {ex.Message}");
            throw;
        }
        finally
        {
            _initLock.Release();
        }
    }

    public async Task UpsertChunksAsync(string documentId, string documentName, IEnumerable<ChunkEntity> chunks, CancellationToken ct = default)
    {
        await EnsureCollectionExistsAsync(ct);

        var points = new List<PointStruct>();
        foreach (var chunk in chunks)
        {
            if (chunk.Embedding == null || chunk.Embedding.Length == 0)
                continue;

            Guid pointId = DeterministicGuid(chunk.Id);

            var point = new PointStruct
            {
                Id = pointId,
                Vectors = chunk.Embedding,
                Payload =
                {
                    ["chunk_id"] = chunk.Id,
                    ["document_id"] = documentId,
                    ["document_name"] = documentName,
                    ["content"] = chunk.Content,
                    ["start_offset"] = chunk.StartOffset,
                    ["end_offset"] = chunk.EndOffset
                }
            };
            points.Add(point);
        }

        if (points.Count > 0)
        {
            await _client.UpsertAsync(_collectionName, points, cancellationToken: ct);
            Console.WriteLine($"[Qdrant] Đã upsert thành công {points.Count} vector chunks cho tài liệu '{documentName}'.");
        }
    }

    public async Task DeleteDocumentChunksAsync(string documentId, CancellationToken ct = default)
    {
        await EnsureCollectionExistsAsync(ct);

        try
        {
            var filter = new Filter
            {
                Must =
                {
                    new Condition
                    {
                        Field = new FieldCondition
                        {
                            Key = "document_id",
                            Match = new Match { Keyword = documentId }
                        }
                    }
                }
            };
            await _client.DeleteAsync(_collectionName, filter, cancellationToken: ct);
            Console.WriteLine($"[Qdrant] Đã xóa toàn bộ vector chunks của tài liệu '{documentId}'.");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Cảnh báo Qdrant] Lỗi khi xóa chunks cho {documentId}: {ex.Message}");
        }
    }

    public async Task<List<(ChunkEntity Chunk, float Score)>> SearchAsync(float[] queryVector, int topK = 3, float minScore = 0.38f, CancellationToken ct = default)
    {
        if (queryVector == null || queryVector.Length == 0)
            return new List<(ChunkEntity Chunk, float Score)>();

        await EnsureCollectionExistsAsync(ct);

        var searchResults = await _client.QueryAsync(
            collectionName: _collectionName,
            query: queryVector,
            limit: (ulong)topK,
            scoreThreshold: minScore,
            cancellationToken: ct
        );

        var results = new List<(ChunkEntity Chunk, float Score)>();
        foreach (var hit in searchResults)
        {
            var payload = hit.Payload;
            string chunkId = payload.TryGetValue("chunk_id", out var cidVal) ? cidVal.StringValue : hit.Id.ToString();
            string docId = payload.TryGetValue("document_id", out var didVal) ? didVal.StringValue : string.Empty;
            string docName = payload.TryGetValue("document_name", out var dnameVal) ? dnameVal.StringValue : string.Empty;
            string content = payload.TryGetValue("content", out var cVal) ? cVal.StringValue : string.Empty;
            int startOffset = payload.TryGetValue("start_offset", out var sVal) ? (int)sVal.IntegerValue : 0;
            int endOffset = payload.TryGetValue("end_offset", out var eVal) ? (int)eVal.IntegerValue : 0;

            var chunk = new ChunkEntity
            {
                Id = chunkId,
                DocumentId = docId,
                DocumentName = docName,
                Content = content,
                StartOffset = startOffset,
                EndOffset = endOffset,
                Embedding = Array.Empty<float>()
            };

            results.Add((chunk, hit.Score));
        }

        return results;
    }

    public async Task<int> GetTotalPointsCountAsync(CancellationToken ct = default)
    {
        try
        {
            await EnsureCollectionExistsAsync(ct);
            var info = await _client.GetCollectionInfoAsync(_collectionName, ct);
            return (int)info.PointsCount;
        }
        catch
        {
            return 0;
        }
    }

    private static Guid DeterministicGuid(string input)
    {
        if (Guid.TryParse(input, out var directGuid))
            return directGuid;

        byte[] hash = MD5.HashData(Encoding.UTF8.GetBytes(input));
        return new Guid(hash);
    }
}
