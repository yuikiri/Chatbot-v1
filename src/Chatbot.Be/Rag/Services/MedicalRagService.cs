using Chatbot.Data.Models;
using Chatbot.Data.Repositories;
using Chatbot.Data.Text;
using Chatbot.Rag.Parsers;
using Chatbot.Rag.Prompts;
using Chatbot.Rag.Providers;
using System.Runtime.CompilerServices;

namespace Chatbot.Rag.Services;

public record RagQueryResult(
    IAsyncEnumerable<string> Stream,
    List<CitationItem> Citations,
    string SafetyLevel,
    bool IsRefusal,
    string Mode
);

public class MedicalRagService
{
    private readonly IDocumentRepository _documentRepo;
    private readonly VectorSearchService _searchService;
    private readonly ILlmClient _llmClient;
    private readonly IEmbeddingClient _embeddingClient;

    public MedicalRagService(
        IDocumentRepository documentRepo,
        VectorSearchService searchService,
        ILlmClient llmClient,
        IEmbeddingClient embeddingClient)
    {
        _documentRepo = documentRepo;
        _searchService = searchService;
        _llmClient = llmClient;
        _embeddingClient = embeddingClient;
    }

    public async Task InitializeAsync(CancellationToken ct = default)
    {
        await _searchService.ReloadIndexAsync(ct);
    }

    public async Task IngestDocumentAsync(string documentId, CancellationToken ct = default)
    {
        var doc = await _documentRepo.GetDocumentByIdAsync(documentId, ct);
        if (doc == null)
            throw new KeyNotFoundException($"Không tìm thấy tài liệu {documentId}");

        string fullText = await DocumentTextParser.ExtractTextAsync(doc.FilePath, ct);
        if (string.IsNullOrWhiteSpace(fullText))
            return;

        var rawChunks = OffsetChunker.ChunkWithOffsets(fullText);
        var chunkEntities = new List<ChunkEntity>(rawChunks.Count);

        for (int i = 0; i < rawChunks.Count; i++)
        {
            var raw = rawChunks[i];
            ct.ThrowIfCancellationRequested();

            float[] vector = Array.Empty<float>();
            try
            {
                vector = await _embeddingClient.GenerateEmbeddingAsync(raw.Content, ct);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Cảnh báo Embedding] Không thể tạo vector cho chunk {i}: {ex.Message}");
            }

            chunkEntities.Add(new ChunkEntity
            {
                Id = $"{doc.Id}_c{i:D4}",
                DocumentId = doc.Id,
                DocumentName = doc.FileName,
                Content = raw.Content,
                StartOffset = raw.StartOffset,
                EndOffset = raw.EndOffset,
                Embedding = vector
            });
        }

        await _documentRepo.SaveChunksAsync(doc.Id, chunkEntities, ct);
        await _searchService.ReloadIndexAsync(ct);
    }

    public async Task<RagQueryResult> AskAsync(string userQuery, string mode = "strict", CancellationToken ct = default)
    {
        mode = (mode ?? "strict").Trim().ToLowerInvariant();
        if (mode != "balanced" && mode != "flexible")
        {
            mode = "strict";
        }

        if (string.IsNullOrWhiteSpace(userQuery))
        {
            return new RagQueryResult(
                Stream: ToAsyncEnumerable("Vui lòng nhập câu hỏi của bạn." + StrictMedicalPromptBuilder.MandatoryDisclaimer),
                Citations: new List<CitationItem>(),
                SafetyLevel: "None",
                IsRefusal: true,
                Mode: mode
            );
        }

        // TẦNG 1: Nhận diện Intent Chào hỏi & Hỏi năng lực bot (Chit-chat / Capabilities)
        if (IsCapabilitiesOrGreetingQuery(userQuery))
        {
            return new RagQueryResult(
                Stream: ToAsyncEnumerable(StrictMedicalPromptBuilder.GreetingResponse + StrictMedicalPromptBuilder.MandatoryDisclaimer),
                Citations: new List<CitationItem>(),
                SafetyLevel: "None",
                IsRefusal: true,
                Mode: mode
            );
        }

        // TẦNG 2: Nhận diện khi người dùng chỉ nêu triệu chứng chung chung ("tôi bị sốt", "em bị đau đầu"...)
        if (IsVagueSymptomOnly(userQuery))
        {
            return new RagQueryResult(
                Stream: ToAsyncEnumerable(StrictMedicalPromptBuilder.VagueSymptomRefusalResponse + StrictMedicalPromptBuilder.MandatoryDisclaimer),
                Citations: new List<CitationItem>(),
                SafetyLevel: "None",
                IsRefusal: true,
                Mode: mode
            );
        }

        try
        {
            // 1. Tìm kiếm vector trong kho tài liệu nội bộ nếu có
            var searchHits = new List<(ChunkEntity Chunk, float Score)>();
            if (_searchService.TotalChunks > 0)
            {
                var queryVector = await _embeddingClient.GenerateEmbeddingAsync(userQuery, ct);
                searchHits = _searchService.Search(queryVector, topK: 3, minScore: 0.38f);
            }

            // 2. Đối soát thực thể / từ khóa hoạt chất trong câu hỏi với nội dung Chunk
            var distinctiveKeywords = ExtractDistinctiveKeywords(userQuery);
            var relevantHits = searchHits.Where(h => IsChunkRelevant(h.Chunk, distinctiveKeywords)).ToList();

            var citations = new List<CitationItem>();
            string systemPrompt = string.Empty;
            string safetyLevel = "None";

            // TẦNG 3: XỬ LÝ THEO 3 CHẾ ĐỘ CO GIÃN
            if (mode == "strict")
            {
                // CHẾ ĐỘ 1: NGHIÊM NGẶT (100% tài liệu nội bộ)
                if (relevantHits.Count == 0)
                {
                    return new RagQueryResult(
                        Stream: ToAsyncEnumerable(StrictMedicalPromptBuilder.BuildRefusalForMissingDoc(userQuery) + StrictMedicalPromptBuilder.MandatoryDisclaimer),
                        Citations: new List<CitationItem>(),
                        SafetyLevel: "None",
                        IsRefusal: true,
                        Mode: mode
                    );
                }

                int citeIndex = 1;
                foreach (var hit in relevantHits)
                {
                    citations.Add(new CitationItem
                    {
                        CitationId = $"cite_{citeIndex++}",
                        DocumentId = hit.Chunk.DocumentId,
                        DocumentName = hit.Chunk.DocumentName,
                        StartOffset = hit.Chunk.StartOffset,
                        EndOffset = hit.Chunk.EndOffset,
                        Snippet = hit.Chunk.Content,
                        RelevanceScore = hit.Score,
                        SourceType = "internal"
                    });
                }

                var relevantChunks = relevantHits.Select(h => h.Chunk).ToList();
                systemPrompt = StrictMedicalPromptBuilder.BuildStrictPrompt(relevantChunks);
                safetyLevel = StrictMedicalPromptBuilder.DetectSafetyLevelFromChunks(relevantChunks);
            }
            else if (mode == "balanced")
            {
                // CHẾ ĐỘ 2: CÂN BẰNG (Tài liệu nội bộ làm gốc + Bổ trợ y văn kiểm chứng)
                if (relevantHits.Count == 0)
                {
                    return new RagQueryResult(
                        Stream: ToAsyncEnumerable(StrictMedicalPromptBuilder.BalancedNoDocRefusalResponse + StrictMedicalPromptBuilder.MandatoryDisclaimer),
                        Citations: new List<CitationItem>(),
                        SafetyLevel: "None",
                        IsRefusal: true,
                        Mode: mode
                    );
                }

                int citeIndex = 1;
                foreach (var hit in relevantHits)
                {
                    citations.Add(new CitationItem
                    {
                        CitationId = $"cite_{citeIndex++}",
                        DocumentId = hit.Chunk.DocumentId,
                        DocumentName = hit.Chunk.DocumentName,
                        StartOffset = hit.Chunk.StartOffset,
                        EndOffset = hit.Chunk.EndOffset,
                        Snippet = hit.Chunk.Content,
                        RelevanceScore = hit.Score,
                        SourceType = "internal"
                    });
                }

                var relevantChunks = relevantHits.Select(h => h.Chunk).ToList();
                systemPrompt = StrictMedicalPromptBuilder.BuildBalancedPrompt(relevantChunks);
                safetyLevel = StrictMedicalPromptBuilder.DetectSafetyLevelFromChunks(relevantChunks);
            }
            else // mode == "flexible"
            {
                // CHẾ ĐỘ 3: MỞ RỘNG (Nghiên cứu y văn chính thống quốc tế tự do)
                // Chỉ đính kèm trích dẫn khi THỰC SỰ có tài liệu nội bộ khớp với hoạt chất
                var relevantChunks = relevantHits.Select(h => h.Chunk).ToList();

                int citeIndex = 1;
                if (relevantChunks.Any())
                {
                    foreach (var hit in relevantHits)
                    {
                        citations.Add(new CitationItem
                        {
                            CitationId = $"cite_{citeIndex++}",
                            DocumentId = hit.Chunk.DocumentId,
                            DocumentName = hit.Chunk.DocumentName,
                            StartOffset = hit.Chunk.StartOffset,
                            EndOffset = hit.Chunk.EndOffset,
                            Snippet = hit.Chunk.Content,
                            RelevanceScore = hit.Score,
                            SourceType = "internal"
                        });
                    }
                }

                systemPrompt = StrictMedicalPromptBuilder.BuildFlexiblePrompt(relevantChunks, userQuery);
                safetyLevel = relevantChunks.Any() ? StrictMedicalPromptBuilder.DetectSafetyLevelFromChunks(relevantChunks) : "Compatible";
            }

            // Gọi streaming từ LLM
            var tokenStream = StreamWithDisclaimerAsync(_llmClient.StreamChatAsync(systemPrompt, userQuery, ct), ct);

            return new RagQueryResult(
                Stream: tokenStream,
                Citations: citations,
                SafetyLevel: safetyLevel,
                IsRefusal: false,
                Mode: mode
            );
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[RAG Lỗi] {ex.Message}");
            return new RagQueryResult(
                Stream: ToAsyncEnumerable($"⚠️ Hệ thống đang kết nối hoặc xác thực mô hình AI ({ex.Message}). Nếu bạn đang cấu hình API key, vui lòng kiểm tra lại tính hợp lệ của khóa trong file .env." + StrictMedicalPromptBuilder.MandatoryDisclaimer),
                Citations: new List<CitationItem>(),
                SafetyLevel: "None",
                IsRefusal: true,
                Mode: mode
            );
        }
    }

    private static bool IsCapabilitiesOrGreetingQuery(string query)
    {
        var q = query.Trim().ToLowerInvariant().Trim('.', '?', '!', ',', ';', ':', ' ');

        string[] phrases = new[]
        {
            // Chào hỏi
            "hi", "hello", "hey", "alo", "chao", "chào", "chao ban", "chào bạn", 
            "xin chao", "xin chào", "hi bot", "chào bot", "chao bot", "ad oi", "ad ơi",
            "bot oi", "bot ơi", "hello bot", "hi bạn", "chào em", "chao em",
            // Năng lực & chức năng bot
            "bạn là ai", "ban la ai", "who are you",
            "chức năng của bạn", "chuc nang cua ban", "chức năng của bạn là gì",
            "bạn có thể làm gì", "ban co the lam gi",
            "bạn giúp được gì", "ban giup duoc gi",
            "giúp tôi", "giup toi",
            "hướng dẫn sử dụng", "huong dan su dung",
            "bạn có thể trả lời câu hoi liên quan tới gì",
            "bạn có thể trả lời câu hỏi liên quan tới gì",
            "bạn trả lời được những gì", "ban tra loi duoc nhung gi",
            "bạn có thể trả lời những gì", "ban co the tra loi nhung gi",
            "trả lời câu hỏi gì", "tra loi cau hoi gi"
        };

        if (phrases.Contains(q))
            return true;

        if (q.StartsWith("chào bạn") || q.StartsWith("xin chào") || q.StartsWith("hello") || q == "hi")
            return true;

        if (q.Contains("bạn có thể trả lời") || q.Contains("bạn làm được gì") || q.Contains("bạn là ai"))
            return true;

        return false;
    }

    private static bool IsVagueSymptomOnly(string query)
    {
        var q = query.Trim().ToLowerInvariant().Trim('.', '?', '!', ',', ' ');

        string[] vaguePhrases = new[]
        {
            "bị sốt", "bi sot", "tôi bị sốt", "toi bi sot", "em bị sốt", "em bi sot", "đang bị sốt", "dang bi sot",
            "bị đau đầu", "bi dau dau", "tôi bị đau đầu", "toi bi dau dau", "đau đầu",
            "bị đau bụng", "bi dau bung", "bị tiêu chảy", "bi tieu chay", "bị cảm cúm", "bi cam cum",
            "bị cảm", "bi cam", "bị ho", "bi ho", "đau họng", "bị mệt", "bi met", "bị viêm họng"
        };

        foreach (var phrase in vaguePhrases)
        {
            if (q == phrase || q == $"{phrase} thì sao" || q == $"{phrase} làm sao" || q == $"{phrase} phải làm sao")
            {
                return true;
            }
        }

        return false;
    }

    private static readonly HashSet<string> StopWords = new(StringComparer.OrdinalIgnoreCase)
    {
        "cho", "con", "bú", "bu", "uống", "uong", "được", "duoc", "không", "khong", "k", "ko", "dc", "hok",
        "thế", "the", "nào", "nao", "dùng", "dung", "sử", "su", "dụng", "có", "co", "bị", "bi",
        "khi", "đang", "dang", "mẹ", "me", "bé", "be", "trẻ", "tre", "sơ", "so", "sinh", "nhỏ", "nho",
        "sao", "bao", "nhiêu", "nhieu", "thuốc", "thuoc", "loại", "loai", "hỏi", "hoi", "về", "ve",
        "giúp", "giup", "tôi", "toi", "em", "ạ", "a", "nhé", "nhe", "xin", "chào", "chao", "với", "voi",
        "là", "la", "gì", "gi", "như", "nhu", "cần", "can", "lưu", "luu", "ý", "y", "thời", "thoi",
        "điểm", "diem", "tác", "tac", "dụng", "dung", "phụ", "phu", "liều", "lieu", "lượng", "luong",
        "an", "toàn", "toan", "mức", "muc", "độ", "do", "ở", "o", "trong", "và", "va", "hoặc", "hoac",
        "hay", "nên", "nen", "phải", "phai", "làm", "lam", "thì", "thi", "tại", "tai", "lâu", "lau",
        "chữa", "chua", "trị", "tri", "sau", "trước", "truoc", "cữ", "cu", "người", "nguoi",
        "này", "nay", "đó", "bác", "bac", "sĩ", "si", "dược", "duoc", "khuyên", "khuyen",
        "hết", "het", "bệnh", "benh", "đau", "dau", "sốt", "sot", "cảm", "cam", "cúm", "cum",
        "ho", "họng", "hong", "bụng", "bung", "viêm", "viem", "mệt", "met", "dị", "di", "ứng", "ung"
    };

    private static List<string> ExtractDistinctiveKeywords(string query)
    {
        if (string.IsNullOrWhiteSpace(query))
            return new List<string>();

        var rawTokens = query
            .ToLowerInvariant()
            .Split(new[] { ' ', ',', '.', '?', '!', ';', ':', '-', '(', ')', '[', ']', '/', '\\', '"', '\'' }, 
                   StringSplitOptions.RemoveEmptyEntries);

        var list = new List<string>();
        foreach (var t in rawTokens)
        {
            var clean = t.Trim();
            if (clean.Length >= 2 && !StopWords.Contains(clean) && !int.TryParse(clean, out _))
            {
                list.Add(clean);
            }
        }
        return list;
    }

    private static bool IsChunkRelevant(ChunkEntity chunk, List<string> distinctiveKeywords)
    {
        if (distinctiveKeywords == null || distinctiveKeywords.Count == 0)
        {
            return true;
        }

        var chunkText = (chunk.DocumentName + " " + chunk.Content).ToLowerInvariant();
        return distinctiveKeywords.Any(kw => chunkText.Contains(kw));
    }

    private static async IAsyncEnumerable<string> StreamWithDisclaimerAsync(
        IAsyncEnumerable<string> sourceStream, 
        [EnumeratorCancellation] CancellationToken ct)
    {
        await foreach (var token in sourceStream.WithCancellation(ct))
        {
            yield return token;
        }

        yield return StrictMedicalPromptBuilder.MandatoryDisclaimer;
    }

    private static async IAsyncEnumerable<string> ToAsyncEnumerable(string text)
    {
        yield return text;
        await Task.CompletedTask;
    }
}
