using System.Numerics.Tensors;
using Chatbot.Data.Models;
using Chatbot.Data.Repositories;

namespace Chatbot.Rag.Services;

public class VectorSearchService
{
    private readonly IDocumentRepository _repo;
    private List<ChunkEntity> _cachedChunks = new();
    private readonly SemaphoreSlim _lock = new(1, 1);

    public VectorSearchService(IDocumentRepository repo)
    {
        _repo = repo;
    }

    public async Task ReloadIndexAsync(CancellationToken ct = default)
    {
        await _lock.WaitAsync(ct);
        try
        {
            var chunks = await _repo.GetAllChunksAsync(ct);
            _cachedChunks = chunks.Where(c => c.Embedding != null && c.Embedding.Length > 0).ToList();
            Console.WriteLine($"[RAG] Đã nạp {_cachedChunks.Count} vector chunks vào bộ nhớ RAM.");
        }
        finally
        {
            _lock.Release();
        }
    }

    public int TotalChunks => _cachedChunks.Count;

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
