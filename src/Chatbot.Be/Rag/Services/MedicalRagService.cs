using Chatbot.Common;
using Chatbot.Data.Models;
using Chatbot.Data.Repositories;
using Chatbot.Data.Text;
using Chatbot.Rag.Parsers;
using Chatbot.Rag.Prompts;
using Chatbot.Rag.Providers;
using Chatbot.Rag.Security;
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
    private readonly VerifiedArticleResolver _articleResolver;
    private readonly PromptGuardService _promptGuard;
    private readonly MedicalIntentClassifier _intentClassifier;
    private readonly QdrantVectorService? _qdrantService;

    public MedicalRagService(
        IDocumentRepository documentRepo,
        VectorSearchService searchService,
        ILlmClient llmClient,
        IEmbeddingClient embeddingClient,
        VerifiedArticleResolver articleResolver,
        PromptGuardService promptGuard,
        MedicalIntentClassifier intentClassifier,
        QdrantVectorService? qdrantService = null)
    {
        _documentRepo = documentRepo;
        _searchService = searchService;
        _llmClient = llmClient;
        _embeddingClient = embeddingClient;
        _articleResolver = articleResolver;
        _promptGuard = promptGuard;
        _intentClassifier = intentClassifier;
        _qdrantService = qdrantService;
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
        var chunkEntities = new ChunkEntity[rawChunks.Count];

        // Tăng tốc tạo vector song song 4 luồng đồng thời
        await Parallel.ForEachAsync(
            Enumerable.Range(0, rawChunks.Count),
            new ParallelOptions { MaxDegreeOfParallelism = 4, CancellationToken = ct },
            async (i, token) =>
            {
                var raw = rawChunks[i];
                float[] vector = Array.Empty<float>();
                try
                {
                    vector = await _embeddingClient.GenerateEmbeddingAsync(raw.Content, token);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[Cảnh báo Embedding] Không thể tạo vector cho chunk {i}: {ex.Message}");
                }

                chunkEntities[i] = new ChunkEntity
                {
                    Id = $"{doc.Id}_c{i:D4}",
                    DocumentId = doc.Id,
                    DocumentName = doc.FileName,
                    Content = raw.Content,
                    StartOffset = raw.StartOffset,
                    EndOffset = raw.EndOffset,
                    Embedding = vector
                };
            });

        await _documentRepo.SaveChunksAsync(doc.Id, chunkEntities, ct);

        if (_qdrantService != null)
        {
            try
            {
                await _qdrantService.UpsertChunksAsync(doc.Id, doc.FileName, chunkEntities, ct);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Cảnh báo Qdrant Ingest] Lỗi đẩy vector lên Qdrant Cloud: {ex.Message}");
            }
        }

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

        // TẦNG 0: VỆ SĨ BẢO MẬT & CẢNH BÁO NGUY CẤP (Prompt Injection, Jailbreak, Tự hại, Quá liều cấp)
        var securityEval = _promptGuard.Evaluate(userQuery);
        if (securityEval.RiskLevel == SecurityRiskLevel.PromptInjection)
        {
            Console.WriteLine($"[Bảo mật] Chặn Prompt Injection: \"{userQuery}\" - {securityEval.ThreatDescription}");
            return new RagQueryResult(
                Stream: ToAsyncEnumerable(StrictMedicalPromptBuilder.SecurityRefusalResponse + StrictMedicalPromptBuilder.MandatoryDisclaimer),
                Citations: new List<CitationItem>(),
                SafetyLevel: "None",
                IsRefusal: true,
                Mode: mode
            );
        }
        if (securityEval.RiskLevel == SecurityRiskLevel.SelfHarmEmergency)
        {
            Console.WriteLine($"[Khẩn cấp] Phát hiện tình huống tự hại / ngộ độc: \"{userQuery}\"");
            return new RagQueryResult(
                Stream: ToAsyncEnumerable(StrictMedicalPromptBuilder.EmergencyHotlineResponse),
                Citations: new List<CitationItem>(),
                SafetyLevel: "Contraindicated",
                IsRefusal: true,
                Mode: mode
            );
        }

        string cleanQuery = securityEval.SanitizedQuery;

        // TẦNG 1: PHÂN LOẠI Ý ĐỊNH & KIỂM TRA PHẠM VI MIỀN Y TẾ
        var intentResult = _intentClassifier.Classify(cleanQuery);

        if (intentResult.Intent == QueryIntent.GreetingOrCapabilities)
        {
            return new RagQueryResult(
                Stream: ToAsyncEnumerable(StrictMedicalPromptBuilder.GreetingResponse + StrictMedicalPromptBuilder.MandatoryDisclaimer),
                Citations: new List<CitationItem>(),
                SafetyLevel: "None",
                IsRefusal: true,
                Mode: mode
            );
        }

        if (intentResult.Intent == QueryIntent.VagueSymptomsOnly)
        {
            return new RagQueryResult(
                Stream: ToAsyncEnumerable(StrictMedicalPromptBuilder.VagueSymptomRefusalResponse + StrictMedicalPromptBuilder.MandatoryDisclaimer),
                Citations: new List<CitationItem>(),
                SafetyLevel: "None",
                IsRefusal: true,
                Mode: mode
            );
        }

        if (intentResult.Intent == QueryIntent.OutOfScope)
        {
            return new RagQueryResult(
                Stream: ToAsyncEnumerable(StrictMedicalPromptBuilder.OutOfScopeRefusalResponse + StrictMedicalPromptBuilder.MandatoryDisclaimer),
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
                var queryVector = await _embeddingClient.GenerateEmbeddingAsync(cleanQuery, ct);
                searchHits = await _searchService.SearchAsync(queryVector, topK: RagConstants.DefaultTopK, minScore: RagConstants.DefaultMinRelevanceScore, ct);
            }

            // 2. Đối soát thực thể / từ khóa hoạt chất trong câu hỏi với nội dung Chunk
            var distinctiveKeywords = ExtractDistinctiveKeywords(cleanQuery);
            string primaryDrug = intentResult.DetectedDrugOrSubstance ?? ExtractPrimaryDrugName(cleanQuery, distinctiveKeywords);
            string drugCapitalized = char.ToUpperInvariant(primaryDrug[0]) + primaryDrug.Substring(1);

            // Bắt buộc chunk phải chứa tên thuốc (nếu có) hoặc từ khóa dược lý cụ thể
            var relevantHits = searchHits.Where(h => IsChunkRelevant(h.Chunk, distinctiveKeywords, primaryDrug)).ToList();

            var citations = new List<CitationItem>();
            string systemPrompt = string.Empty;
            string safetyLevel = "None";

            // TẦNG 2: XỬ LÝ THEO 3 CHẾ ĐỘ CO GIÃN
            if (mode == "strict")
            {
                // CHẾ ĐỘ 1: NGHIÊM NGẶT (100% tài liệu nội bộ cơ sở)
                if (relevantHits.Count == 0)
                {
                    return new RagQueryResult(
                        Stream: ToAsyncEnumerable(StrictMedicalPromptBuilder.BuildRefusalForMissingDoc(primaryDrug) + StrictMedicalPromptBuilder.MandatoryDisclaimer),
                        Citations: new List<CitationItem>(),
                        SafetyLevel: "None",
                        IsRefusal: true,
                        Mode: mode
                    );
                }

                citations.AddRange(BuildInternalCitations(relevantHits));
                var relevantChunks = relevantHits.Select(h => h.Chunk).ToList();
                systemPrompt = StrictMedicalPromptBuilder.BuildStrictPrompt(relevantChunks, cleanQuery);
                safetyLevel = StrictMedicalPromptBuilder.DetectSafetyLevelFromChunks(relevantChunks);
            }
            else if (mode == "balanced")
            {
                // CHẾ ĐỘ 2: CÂN BẰNG (Tài liệu nội bộ làm gốc + Bổ trợ y văn kiểm chứng)
                if (relevantHits.Count == 0)
                {
                    return new RagQueryResult(
                        Stream: ToAsyncEnumerable(StrictMedicalPromptBuilder.BuildBalancedNoDocRefusal(primaryDrug) + StrictMedicalPromptBuilder.MandatoryDisclaimer),
                        Citations: new List<CitationItem>(),
                        SafetyLevel: "None",
                        IsRefusal: true,
                        Mode: mode
                    );
                }

                citations.AddRange(BuildInternalCitations(relevantHits));
                var relevantChunks = relevantHits.Select(h => h.Chunk).ToList();

                var verifiedArticles = await _articleResolver.ResolveVerifiedArticlesAsync(primaryDrug, ct);
                citations.AddRange(verifiedArticles);

                systemPrompt = StrictMedicalPromptBuilder.BuildBalancedPrompt(relevantChunks, cleanQuery, verifiedArticles, drugCapitalized);
                safetyLevel = StrictMedicalPromptBuilder.DetectSafetyLevelFromChunks(relevantChunks);
            }
            else // mode == "flexible"
            {
                // CHẾ ĐỘ 3: MỞ RỘNG (Nghiên cứu y văn chính thống quốc tế tự do)
                var relevantChunks = relevantHits.Select(h => h.Chunk).ToList();
                if (relevantChunks.Any())
                {
                    citations.AddRange(BuildInternalCitations(relevantHits));
                }

                // Lấy danh sách bài viết chuyên luận thật đã được đối soát từ NIH / APILAM
                var verifiedArticles = await _articleResolver.ResolveVerifiedArticlesAsync(primaryDrug, ct);
                citations.AddRange(verifiedArticles);

                systemPrompt = StrictMedicalPromptBuilder.BuildFlexiblePrompt(relevantChunks, cleanQuery, verifiedArticles, drugCapitalized);
                safetyLevel = relevantChunks.Any() ? StrictMedicalPromptBuilder.DetectSafetyLevelFromChunks(relevantChunks) : "Compatible";
            }

            // Gọi streaming từ LLM được bao bọc trong thẻ an toàn
            var tokenStream = StreamWithDisclaimerAsync(_llmClient.StreamChatAsync(systemPrompt, cleanQuery, ct), ct);

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
            var formatted = LlmErrorFormatter.Format(ex, "LactaMed AI", mode);
            Console.WriteLine($"[RAG Lỗi Chuẩn Hóa] {formatted.AdminSummary}");

            return new RagQueryResult(
                Stream: ToAsyncEnumerable($"⚠️ {formatted.UserMessage}" + StrictMedicalPromptBuilder.MandatoryDisclaimer),
                Citations: new List<CitationItem>(),
                SafetyLevel: "None",
                IsRefusal: true,
                Mode: mode
            );
        }
    }

    private static readonly HashSet<string> StopWords = new(StringComparer.OrdinalIgnoreCase)
    {
        // Đại từ, xưng hô
        "tôi", "toi", "tao", "tớ", "to", "mình", "minh", "em", "anh", "chị", "chi", "cô", "co", "bác", "bac", "chú", "chu",
        "mẹ", "me", "bé", "be", "con", "trẻ", "tre", "sơ", "so", "sinh", "nhỏ", "nho", "bà", "ba", "ông", "ong",
        "người", "nguoi", "bệnh", "benh", "nhân", "nhan", "bác", "sĩ", "si", "dược", "duoc",

        // Động từ giao tiếp, mong muốn, hành động
        "muốn", "muon", "mong", "hỏi", "hoi", "tìm", "tim", "kiếm", "kiem", "tra", "cứu", "cuu", "xem", "đọc", "doc",
        "biết", "biet", "hiểu", "hieu", "thấy", "thay", "nghe", "nói", "noi", "bảo", "bao", "chỉ", "chi", "dạy", "day",
        "hướng", "huong", "dẫn", "dan", "giải", "giai", "thích", "thich", "tư", "tu", "vấn", "van", "khuyên", "khuyen",
        "giúp", "giup", "được", "duoc", "không", "khong", "k", "ko", "dc", "hok", "nha", "nhé", "nhe", "ạ", "a",
        "xin", "chào", "chao", "alo", "hi", "hello", "hey",

        // Động từ y tế chung
        "uống", "uong", "dùng", "dung", "sử", "su", "dụng", "tiêm", "tiem", "truyền", "truyen", "bôi", "boi",
        "nhỏ", "nho", "xịt", "xit", "chữa", "chua", "trị", "tri", "điều", "dieu", "khỏi", "khoi", "bớt", "bot",
        "hết", "het", "bú", "bu", "cho", "nuôi", "nuoi", "ti",

        // Trợ từ, liên từ, câu hỏi
        "có", "co", "là", "la", "thì", "thi", "mà", "ma", "hay", "hoặc", "hoac", "nếu", "neu", "vì", "vi", "do",
        "nên", "nen", "phải", "phai", "cần", "can", "làm", "lam", "sao", "thế", "the", "nào", "nao", "gì", "gi",
        "ai", "đâu", "dau", "mấy", "may", "bao", "nhiêu", "nhieu", "khi", "lúc", "luc", "sau", "trước", "truoc",
        "trong", "ngoài", "ngoai", "khoảng", "khoang", "tầm", "tam", "cỡ", "co", "với", "voi", "tại", "tai",
        "ở", "o", "về", "ve", "ra", "vào", "vao", "lên", "len", "xuống", "xuong", "lại", "lai", "đi", "di",
        "đến", "den", "tới", "toi", "từ", "tu", "và", "va", "cũng", "cung", "rồi", "roi", "chưa", "chua",
        "đã", "da", "đang", "dang", "sẽ", "se", "này", "nay", "đó", "do", "kia", "đây", "day",

        // Từ ngữ chỉ lượng & đơn vị
        "thuốc", "thuoc", "loại", "loai", "dạng", "dang", "viên", "vien", "gói", "goi", "chai", "lọ", "lo",
        "ống", "ong", "giọt", "giot", "liều", "lieu", "lượng", "luong", "hàm", "ham", "cữ", "cu", "lần", "lan",
        "ngày", "ngay", "giờ", "gio", "tiếng", "tieng", "tuần", "tuan", "tháng", "thang", "năm", "nam",
        "mức", "muc", "độ", "do", "thời", "thoi", "điểm", "diem",

        // Từ ngữ tính chất chung
        "tác", "tac", "dụng", "dung", "phụ", "phu", "nguy", "hiểm", "hiem", "hại", "hai", "ảnh", "anh",
        "hưởng", "huong", "độc", "doc", "tính", "tinh", "an", "toàn", "toan", "tốt", "tot", "xấu", "xau",
        "hiệu", "hieu", "quả", "qua",

        // Triệu chứng chung (không phải tên thuốc)
        "bị", "bi", "mắc", "mac", "nhiễm", "nhiem",
        "đau", "dau", "sốt", "sot", "cảm", "cam", "cúm", "cum", "ho", "họng", "hong", "đầu", "dau",
        "bụng", "bung", "viêm", "viem", "mệt", "met", "dị", "di", "ứng", "ung", "nổi", "noi", "mề", "me",
        "đay", "day", "ngứa", "ngua", "sổ", "so", "mũi", "mui", "nghẹt", "nghet", "chảy", "chay",
        "tiêu", "tieu", "nôn", "non", "trớ", "tro", "quấy", "quay", "khóc", "khoc", "ngủ", "ngu"
    };

    private static List<string> ExtractDistinctiveKeywords(string query)
    {
        if (string.IsNullOrWhiteSpace(query))
            return new List<string>();

        var rawTokens = query
            .ToLowerInvariant()
            .Split(new[] { ' ', ',', '.', '?', '!', ';', ':', '-', '(', ')', '[', ']', '/', '\\', '"', '\'', '\n', '\r', '\t' }, 
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

    private static bool IsChunkRelevant(ChunkEntity chunk, List<string> distinctiveKeywords, string? primaryDrug)
    {
        var chunkText = (chunk.DocumentName + " " + chunk.Content).ToLowerInvariant();

        // 1. Nếu xác định được tên thuốc rõ ràng, chunk BẮT BUỘC phải chứa tên thuốc này
        if (!string.IsNullOrWhiteSpace(primaryDrug) && primaryDrug != "medication")
        {
            if (chunkText.Contains(primaryDrug.ToLowerInvariant()))
            {
                return true;
            }
        }

        // 2. Nếu không có tên thuốc riêng, kiểm tra có ít nhất 1 từ khóa đặc thù khớp trong chunk
        if (distinctiveKeywords != null && distinctiveKeywords.Count > 0)
        {
            return distinctiveKeywords.Any(kw => chunkText.Contains(kw));
        }

        return false;
    }

    public static string ExtractPrimaryDrugName(string query, List<string> distinctiveKeywords)
    {
        if (distinctiveKeywords != null && distinctiveKeywords.Count > 0)
        {
            var candidate = distinctiveKeywords.OrderByDescending(k => k.Length).First();
            return MedicalIntentClassifier.NormalizeDrugName(candidate);
        }
        return "medication";
    }

    private static List<CitationItem> BuildInternalCitations(IEnumerable<(ChunkEntity Chunk, float Score)> hits)
    {
        int citeIndex = 1;
        return hits.Select(h => new CitationItem
        {
            CitationId = $"cite_{citeIndex++}",
            DocumentId = h.Chunk.DocumentId,
            DocumentName = h.Chunk.DocumentName,
            StartOffset = h.Chunk.StartOffset,
            EndOffset = h.Chunk.EndOffset,
            Snippet = h.Chunk.Content,
            RelevanceScore = h.Score,
            SourceType = "internal"
        }).ToList();
    }

    private static async IAsyncEnumerable<string> ToAsyncEnumerable(string text)
    {
        yield return text;
        await Task.CompletedTask;
    }

    private static async IAsyncEnumerable<string> StreamWithDisclaimerAsync(
        IAsyncEnumerable<string> sourceStream, 
        [EnumeratorCancellation] CancellationToken ct = default)
    {
        await foreach (var token in sourceStream.WithCancellation(ct))
        {
            yield return token;
        }

        yield return StrictMedicalPromptBuilder.MandatoryDisclaimer;
    }
}
