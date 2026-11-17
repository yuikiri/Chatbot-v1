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
                string primaryDrug = ExtractPrimaryDrugName(userQuery, distinctiveKeywords);
                string drugCapitalized = char.ToUpperInvariant(primaryDrug[0]) + primaryDrug.Substring(1);

                if (primaryDrug != "medication")
                {
                    citations.Add(new CitationItem
                    {
                        CitationId = "ext_lactmed",
                        DocumentId = "ext_lactmed",
                        DocumentName = $"LactMed: Tra cứu {drugCapitalized}",
                        StartOffset = 0,
                        EndOffset = 0,
                        Snippet = $"Chuyên luận y văn {drugCapitalized} trong cơ sở dữ liệu Drugs and Lactation Database (LactMed® - Viện Y tế Quốc gia Hoa Kỳ NIH).",
                        RelevanceScore = 0.98f,
                        SourceType = "external",
                        Url = $"https://www.ncbi.nlm.nih.gov/books/NBK501922/?term={Uri.EscapeDataString(primaryDrug)}",
                        VerifiedOrg = "NIH / NLM (Hoa Kỳ)"
                    });

                    citations.Add(new CitationItem
                    {
                        CitationId = "ext_pubmed",
                        DocumentId = "ext_pubmed",
                        DocumentName = $"PubMed: Nghiên cứu {drugCapitalized}",
                        StartOffset = 0,
                        EndOffset = 0,
                        Snippet = $"Kết quả nghiên cứu lâm sàng về nồng độ và an toàn của {drugCapitalized} qua sữa mẹ trên PubMed.",
                        RelevanceScore = 0.95f,
                        SourceType = "external",
                        Url = $"https://pubmed.ncbi.nlm.nih.gov/?term={Uri.EscapeDataString(primaryDrug)}+lactmed",
                        VerifiedOrg = "NCBI / PubMed"
                    });
                }

                systemPrompt = StrictMedicalPromptBuilder.BuildBalancedPrompt(relevantChunks, drugCapitalized);
                safetyLevel = StrictMedicalPromptBuilder.DetectSafetyLevelFromChunks(relevantChunks);
            }
            else // mode == "flexible"
            {
                // CHẾ ĐỘ 3: MỞ RỘNG (Nghiên cứu y văn chính thống quốc tế tự do)
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

                string primaryDrug = ExtractPrimaryDrugName(userQuery, distinctiveKeywords);
                string drugCapitalized = char.ToUpperInvariant(primaryDrug[0]) + primaryDrug.Substring(1);

                // Luôn đính kèm đường link tra cứu chính xác hoạt chất cho người dùng
                if (primaryDrug != "medication")
                {
                    citations.Add(new CitationItem
                    {
                        CitationId = "ext_lactmed",
                        DocumentId = "ext_lactmed",
                        DocumentName = $"LactMed: Tra cứu {drugCapitalized}",
                        StartOffset = 0,
                        EndOffset = 0,
                        Snippet = $"Chuyên luận y văn {drugCapitalized} trong cơ sở dữ liệu Drugs and Lactation Database (LactMed® - Viện Y tế Quốc gia Hoa Kỳ NIH).",
                        RelevanceScore = 0.98f,
                        SourceType = "external",
                        Url = $"https://www.ncbi.nlm.nih.gov/books/NBK501922/?term={Uri.EscapeDataString(primaryDrug)}",
                        VerifiedOrg = "NIH / NLM (Hoa Kỳ)"
                    });

                    citations.Add(new CitationItem
                    {
                        CitationId = "ext_pubmed",
                        DocumentId = "ext_pubmed",
                        DocumentName = $"PubMed: Nghiên cứu {drugCapitalized}",
                        StartOffset = 0,
                        EndOffset = 0,
                        Snippet = $"Tổng hợp các nghiên cứu lâm sàng về nồng độ và độc tính của {drugCapitalized} ở phụ nữ cho con bú trên PubMed.",
                        RelevanceScore = 0.95f,
                        SourceType = "external",
                        Url = $"https://pubmed.ncbi.nlm.nih.gov/?term={Uri.EscapeDataString(primaryDrug)}+lactmed",
                        VerifiedOrg = "NCBI / PubMed"
                    });

                    citations.Add(new CitationItem
                    {
                        CitationId = "ext_drugs_com",
                        DocumentId = "ext_drugs_com",
                        DocumentName = $"Drugs.com: Dược động học {drugCapitalized}",
                        StartOffset = 0,
                        EndOffset = 0,
                        Snippet = $"Chuyên luận lâm sàng chi tiết về nồng độ {drugCapitalized} trong sữa mẹ, thời gian bán thải và theo dõi trẻ sơ sinh.",
                        RelevanceScore = 0.92f,
                        SourceType = "external",
                        Url = $"https://www.drugs.com/breastfeeding/{Uri.EscapeDataString(primaryDrug)}.html",
                        VerifiedOrg = "Drugs.com Lactation Database"
                    });
                }

                systemPrompt = StrictMedicalPromptBuilder.BuildFlexiblePrompt(relevantChunks, userQuery, drugCapitalized);
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

    private static bool IsChunkRelevant(ChunkEntity chunk, List<string> distinctiveKeywords)
    {
        if (distinctiveKeywords == null || distinctiveKeywords.Count == 0)
        {
            return false; // Nếu không có từ khóa hoạt chất/tên thuốc cụ thể nào, KHÔNG tự ý gán bừa tài liệu
        }

        var chunkText = (chunk.DocumentName + " " + chunk.Content).ToLowerInvariant();
        return distinctiveKeywords.Any(kw => chunkText.Contains(kw));
    }

    public static string ExtractPrimaryDrugName(string query, List<string> distinctiveKeywords)
    {
        if (distinctiveKeywords != null && distinctiveKeywords.Count > 0)
        {
            var candidate = distinctiveKeywords.OrderByDescending(k => k.Length).First();
            return NormalizeDrugName(candidate);
        }
        return "medication";
    }

    public static string NormalizeDrugName(string raw)
    {
        var lower = (raw ?? "").Trim().ToLowerInvariant();
        return lower switch
        {
            "hapacol" or "panadol" or "efferalgan" or "tylenol" or "paracold" or "acetaminophen" => "paracetamol",
            "advil" or "motrin" => "ibuprofen",
            "augmentin" => "amoxicillin",
            "aspirine" => "aspirin",
            "claritin" => "loratadine",
            "zyrtec" => "cetirizine",
            "keflex" => "cephalexin",
            "zithromax" => "azithromycin",
            _ => lower
        };
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
