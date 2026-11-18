using System.Numerics.Tensors;
using Chatbot.Data.Models;
using Chatbot.Data.Repositories;

namespace Chatbot.Rag.Services;

public class VectorSearchService
{
    private readonly IDocumentRepository _repo;
    private readonly QdrantVectorService? _qdrantService;
    private List<ChunkEntity> _cachedChunks = new();
    private int _totalQdrantPoints = 0;
    private readonly SemaphoreSlim _lock = new(1, 1);

    public VectorSearchService(IDocumentRepository repo, QdrantVectorService? qdrantService = null)
    {
        _repo = repo;
        _qdrantService = qdrantService;
    }

    public async Task ReloadIndexAsync(CancellationToken ct = default)
    {
        await _lock.WaitAsync(ct);
        try
        {
            var chunks = await _repo.GetAllChunksAsync(ct);
            _cachedChunks = chunks.Where(c => c.Embedding != null && c.Embedding.Length > 0).ToList();
            Console.WriteLine($"[RAG] Đã nạp {_cachedChunks.Count} vector chunks vào bộ nhớ RAM cục bộ.");

            if (_qdrantService != null)
            {
                try
                {
                    await _qdrantService.EnsureCollectionExistsAsync(ct);
                    _totalQdrantPoints = await _qdrantService.GetTotalPointsCountAsync(ct);
                    Console.WriteLine($"[RAG/Qdrant] Tổng số vector trên Qdrant Cloud: {_totalQdrantPoints}.");

                    // Tự động đồng bộ lên Qdrant nếu Qdrant trống và local SQLite có dữ liệu
                    if (_totalQdrantPoints == 0 && _cachedChunks.Count > 0)
                    {
                        Console.WriteLine($"[RAG/Qdrant] Qdrant Cloud đang trống. Tự động đồng bộ {_cachedChunks.Count} chunks từ SQLite lên Qdrant Cloud...");
                        var groupedByDoc = _cachedChunks.GroupBy(c => c.DocumentId);
                        foreach (var group in groupedByDoc)
                        {
                            string docName = group.First().DocumentName;
                            await _qdrantService.UpsertChunksAsync(group.Key, docName, group, ct);
                        }
                        _totalQdrantPoints = await _qdrantService.GetTotalPointsCountAsync(ct);
                        Console.WriteLine($"[RAG/Qdrant] Đồng bộ hoàn tất! Số vector trên Qdrant Cloud: {_totalQdrantPoints}.");
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[Cảnh báo Qdrant ReloadIndex] {ex.Message}");
                }
            }
        }
        finally
        {
            _lock.Release();
        }
    }

    public int TotalChunks => _qdrantService != null && _totalQdrantPoints > 0 ? _totalQdrantPoints : _cachedChunks.Count;

    public async Task<List<(ChunkEntity Chunk, float Score)>> SearchAsync(float[] queryEmbedding, int topK = 3, float minScore = 0.35f, CancellationToken ct = default)
    {
        if (queryEmbedding == null || queryEmbedding.Length == 0)
            return new List<(ChunkEntity Chunk, float Score)>();

        if (_qdrantService != null)
        {
            try
            {
                var qdrantHits = await _qdrantService.SearchAsync(queryEmbedding, topK, minScore, ct);
                if (qdrantHits.Count > 0)
                {
                    return qdrantHits;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Cảnh báo Qdrant Search] Thất bại, fallback về In-Memory: {ex.Message}");
            }
        }

        return Search(queryEmbedding, topK, minScore);
    }

    public List<(ChunkEntity Chunk, float Score)> Search(float[] queryEmbedding, int topK = 3, float minScore = 0.35f)
    {
        if (queryEmbedding == null || queryEmbedding.Length == 0 || _cachedChunks.Count == 0)
            return new List<(ChunkEntity Chunk, float Score)>();

        var results = new List<(ChunkEntity Chunk, float Score)>(_cachedChunks.Count);
        ReadOnlySpan<float> querySpan = queryEmbedding;

        foreach (var chunk in _cachedChunks)
        {
            if (chunk.Embedding.Length != queryEmbedding.Length)
                continue;

            ReadOnlySpan<float> chunkSpan = chunk.Embedding;
            float score = TensorPrimitives.CosineSimilarity(querySpan, chunkSpan);

            if (score >= minScore)
            {
                results.Add((chunk, score));
            }
        }

        return results
            .OrderByDescending(r => r.Score)
            .Take(topK)
            .ToList();
    }
}
