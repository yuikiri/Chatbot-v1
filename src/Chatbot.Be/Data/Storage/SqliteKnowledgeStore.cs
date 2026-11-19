using System.Data;
using Microsoft.Data.Sqlite;
using Chatbot.Data.Models;

namespace Chatbot.Data.Storage;

public class SqliteKnowledgeStore
{
    private readonly string _connectionString;

    public SqliteKnowledgeStore(string dbPath)
    {
        var dir = Path.GetDirectoryName(dbPath);
        if (!string.IsNullOrEmpty(dir) && !Directory.Exists(dir))
        {
            Directory.CreateDirectory(dir);
        }

        _connectionString = new SqliteConnectionStringBuilder
        {
            DataSource = dbPath,
            Mode = SqliteOpenMode.ReadWriteCreate
        }.ToString();

        Initialize();
    }

    private void Initialize()
    {
        using var conn = new SqliteConnection(_connectionString);
        conn.Open();

        using var cmd = conn.CreateCommand();
        cmd.CommandText = @"
            PRAGMA journal_mode = WAL;
            PRAGMA foreign_keys = ON;

            CREATE TABLE IF NOT EXISTS Documents (
                Id TEXT PRIMARY KEY,
                Title TEXT NOT NULL,
                FileName TEXT NOT NULL,
                FilePath TEXT NOT NULL,
                RawFilePath TEXT NOT NULL DEFAULT '',
                NormalizedFilePath TEXT NOT NULL DEFAULT '',
                SourceUrl TEXT NULL,
                SourceType TEXT NOT NULL DEFAULT 'upload',
                FileSizeBytes INTEGER NOT NULL,
                UploadedAtUtc TEXT NOT NULL,
                ChunkCount INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS Chunks (
                Id TEXT PRIMARY KEY,
                DocumentId TEXT NOT NULL,
                DocumentName TEXT NOT NULL,
                Content TEXT NOT NULL,
                StartOffset INTEGER NOT NULL,
                EndOffset INTEGER NOT NULL,
                Embedding BLOB NOT NULL,
                FOREIGN KEY (DocumentId) REFERENCES Documents(Id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_chunks_docid ON Chunks(DocumentId);

            CREATE TABLE IF NOT EXISTS Scenarios (
                Id TEXT PRIMARY KEY,
                Code TEXT NOT NULL DEFAULT '',
                Title TEXT NOT NULL,
                ClaimText TEXT NOT NULL,
                Platform TEXT NOT NULL DEFAULT 'Khác',
                DoubtSignals TEXT NOT NULL DEFAULT '',
                PotentialRisk TEXT NOT NULL DEFAULT '',
                DisplayOrder INTEGER NOT NULL DEFAULT 0,
                IsActive INTEGER NOT NULL DEFAULT 1,
                CreatedAtUtc TEXT NOT NULL,
                UpdatedAtUtc TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_scenarios_order ON Scenarios(DisplayOrder, IsActive);
        ";
        cmd.ExecuteNonQuery();

        // Migration an toàn cho database hiện có
        string[] migrations = new[]
        {
            "ALTER TABLE Documents ADD COLUMN RawFilePath TEXT NOT NULL DEFAULT '';",
            "ALTER TABLE Documents ADD COLUMN NormalizedFilePath TEXT NOT NULL DEFAULT '';",
            "ALTER TABLE Documents ADD COLUMN SourceUrl TEXT NULL;",
            "ALTER TABLE Documents ADD COLUMN SourceType TEXT NOT NULL DEFAULT 'upload';"
        };

        foreach (var mig in migrations)
        {
            try
            {
                using var migCmd = conn.CreateCommand();
                migCmd.CommandText = mig;
                migCmd.ExecuteNonQuery();
            }
            catch
            {
                // Cột đã tồn tại, bỏ qua an toàn
            }
        }
    }

    public async Task UpsertDocumentAsync(DocumentEntity doc, CancellationToken ct = default)
    {
        using var conn = new SqliteConnection(_connectionString);
        await conn.OpenAsync(ct);

        using var cmd = conn.CreateCommand();
        cmd.CommandText = @"
            INSERT INTO Documents (Id, Title, FileName, FilePath, RawFilePath, NormalizedFilePath, SourceUrl, SourceType, FileSizeBytes, UploadedAtUtc, ChunkCount)
            VALUES (@Id, @Title, @FileName, @FilePath, @RawFilePath, @NormalizedFilePath, @SourceUrl, @SourceType, @FileSizeBytes, @UploadedAtUtc, @ChunkCount)
            ON CONFLICT(Id) DO UPDATE SET
                Title = excluded.Title,
                FileName = excluded.FileName,
                FilePath = excluded.FilePath,
                RawFilePath = excluded.RawFilePath,
                NormalizedFilePath = excluded.NormalizedFilePath,
                SourceUrl = excluded.SourceUrl,
                SourceType = excluded.SourceType,
                FileSizeBytes = excluded.FileSizeBytes,
                UploadedAtUtc = excluded.UploadedAtUtc,
                ChunkCount = excluded.ChunkCount;
        ";
        cmd.Parameters.AddWithValue("@Id", doc.Id);
        cmd.Parameters.AddWithValue("@Title", doc.Title);
        cmd.Parameters.AddWithValue("@FileName", doc.FileName);
        cmd.Parameters.AddWithValue("@FilePath", doc.FilePath);
        cmd.Parameters.AddWithValue("@RawFilePath", doc.RawFilePath ?? string.Empty);
        cmd.Parameters.AddWithValue("@NormalizedFilePath", doc.NormalizedFilePath ?? string.Empty);
        cmd.Parameters.AddWithValue("@SourceUrl", (object?)doc.SourceUrl ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@SourceType", doc.SourceType ?? "upload");
        cmd.Parameters.AddWithValue("@FileSizeBytes", doc.FileSizeBytes);
        cmd.Parameters.AddWithValue("@UploadedAtUtc", doc.UploadedAtUtc.ToString("o"));
        cmd.Parameters.AddWithValue("@ChunkCount", doc.ChunkCount);

        await cmd.ExecuteNonQueryAsync(ct);
    }

    public async Task SaveChunksAsync(string docId, IEnumerable<ChunkEntity> chunks, CancellationToken ct = default)
    {
        using var conn = new SqliteConnection(_connectionString);
        await conn.OpenAsync(ct);

        using var trans = conn.BeginTransaction();

        // Xóa các chunk cũ của document nếu có
        using (var delCmd = conn.CreateCommand())
        {
            delCmd.Transaction = trans;
            delCmd.CommandText = "DELETE FROM Chunks WHERE DocumentId = @DocId;";
            delCmd.Parameters.AddWithValue("@DocId", docId);
            await delCmd.ExecuteNonQueryAsync(ct);
        }

        // Chèn các chunk mới bằng cách tái sử dụng 1 Prepared Command duy nhất
        using var insCmd = conn.CreateCommand();
        insCmd.Transaction = trans;
        insCmd.CommandText = @"
            INSERT INTO Chunks (Id, DocumentId, DocumentName, Content, StartOffset, EndOffset, Embedding)
            VALUES (@Id, @DocId, @DocName, @Content, @StartOffset, @EndOffset, @Embedding);
        ";
        var pId = insCmd.Parameters.Add("@Id", SqliteType.Text);
        var pDocId = insCmd.Parameters.Add("@DocId", SqliteType.Text);
        var pDocName = insCmd.Parameters.Add("@DocName", SqliteType.Text);
        var pContent = insCmd.Parameters.Add("@Content", SqliteType.Text);
        var pStartOffset = insCmd.Parameters.Add("@StartOffset", SqliteType.Integer);
        var pEndOffset = insCmd.Parameters.Add("@EndOffset", SqliteType.Integer);
        var pEmbedding = insCmd.Parameters.Add("@Embedding", SqliteType.Blob);

        foreach (var chunk in chunks)
        {
            pId.Value = chunk.Id;
            pDocId.Value = chunk.DocumentId;
            pDocName.Value = chunk.DocumentName;
            pContent.Value = chunk.Content;
            pStartOffset.Value = chunk.StartOffset;
            pEndOffset.Value = chunk.EndOffset;
            pEmbedding.Value = FloatArrayToBytes(chunk.Embedding);

            await insCmd.ExecuteNonQueryAsync(ct);
        }

        trans.Commit();
    }

    public async Task DeleteDocumentAsync(string docId, CancellationToken ct = default)
    {
        using var conn = new SqliteConnection(_connectionString);
        await conn.OpenAsync(ct);

        using var trans = conn.BeginTransaction();

        using (var delChunk = conn.CreateCommand())
        {
            delChunk.Transaction = trans;
            delChunk.CommandText = "DELETE FROM Chunks WHERE DocumentId = @DocId;";
            delChunk.Parameters.AddWithValue("@DocId", docId);
            await delChunk.ExecuteNonQueryAsync(ct);
        }

        using (var delDoc = conn.CreateCommand())
        {
            delDoc.Transaction = trans;
            delDoc.CommandText = "DELETE FROM Documents WHERE Id = @DocId;";
            delDoc.Parameters.AddWithValue("@DocId", docId);
            await delDoc.ExecuteNonQueryAsync(ct);
        }

        trans.Commit();
    }

    public async Task<List<DocumentEntity>> GetAllDocumentsAsync(CancellationToken ct = default)
    {
        var list = new List<DocumentEntity>();
        using var conn = new SqliteConnection(_connectionString);
        await conn.OpenAsync(ct);

        using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT Id, Title, FileName, FilePath, RawFilePath, NormalizedFilePath, SourceUrl, SourceType, FileSizeBytes, UploadedAtUtc, ChunkCount FROM Documents ORDER BY UploadedAtUtc DESC;";
        using var reader = await cmd.ExecuteReaderAsync(ct);

        while (await reader.ReadAsync(ct))
        {
            list.Add(new DocumentEntity
            {
                Id = reader.GetString(0),
                Title = reader.GetString(1),
                FileName = reader.GetString(2),
                FilePath = reader.GetString(3),
                RawFilePath = !reader.IsDBNull(4) ? reader.GetString(4) : string.Empty,
                NormalizedFilePath = !reader.IsDBNull(5) ? reader.GetString(5) : string.Empty,
                SourceUrl = !reader.IsDBNull(6) ? reader.GetString(6) : null,
                SourceType = !reader.IsDBNull(7) ? reader.GetString(7) : "upload",
                FileSizeBytes = reader.GetInt64(8),
                UploadedAtUtc = DateTime.Parse(reader.GetString(9)),
                ChunkCount = reader.GetInt32(10)
            });
        }
        return list;
    }

    public async Task<DocumentEntity?> GetDocumentByIdAsync(string docId, CancellationToken ct = default)
    {
        using var conn = new SqliteConnection(_connectionString);
        await conn.OpenAsync(ct);

        using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT Id, Title, FileName, FilePath, RawFilePath, NormalizedFilePath, SourceUrl, SourceType, FileSizeBytes, UploadedAtUtc, ChunkCount FROM Documents WHERE Id = @Id LIMIT 1;";
        cmd.Parameters.AddWithValue("@Id", docId);

        using var reader = await cmd.ExecuteReaderAsync(ct);
        if (await reader.ReadAsync(ct))
        {
            return new DocumentEntity
            {
                Id = reader.GetString(0),
                Title = reader.GetString(1),
                FileName = reader.GetString(2),
                FilePath = reader.GetString(3),
                RawFilePath = !reader.IsDBNull(4) ? reader.GetString(4) : string.Empty,
                NormalizedFilePath = !reader.IsDBNull(5) ? reader.GetString(5) : string.Empty,
                SourceUrl = !reader.IsDBNull(6) ? reader.GetString(6) : null,
                SourceType = !reader.IsDBNull(7) ? reader.GetString(7) : "upload",
                FileSizeBytes = reader.GetInt64(8),
                UploadedAtUtc = DateTime.Parse(reader.GetString(9)),
                ChunkCount = reader.GetInt32(10)
            };
        }
        return null;
    }

    public async Task<List<ChunkEntity>> GetAllChunksAsync(CancellationToken ct = default)
    {
        var list = new List<ChunkEntity>();
        using var conn = new SqliteConnection(_connectionString);
        await conn.OpenAsync(ct);

        using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT Id, DocumentId, DocumentName, Content, StartOffset, EndOffset, Embedding FROM Chunks;";
        using var reader = await cmd.ExecuteReaderAsync(ct);

        while (await reader.ReadAsync(ct))
        {
            var id = reader.GetString(0);
            var docId = reader.GetString(1);
            var docName = reader.GetString(2);
            var content = reader.GetString(3);
            var startOffset = reader.GetInt32(4);
            var endOffset = reader.GetInt32(5);
            var blob = (byte[])reader.GetValue(6);

            list.Add(new ChunkEntity
            {
                Id = id,
                DocumentId = docId,
                DocumentName = docName,
                Content = content,
                StartOffset = startOffset,
                EndOffset = endOffset,
                Embedding = BytesToFloatArray(blob)
            });
        }
        return list;
    }

    private static byte[] FloatArrayToBytes(float[] floats)
    {
        if (floats == null || floats.Length == 0) return Array.Empty<byte>();
        var bytes = new byte[floats.Length * sizeof(float)];
        Buffer.BlockCopy(floats, 0, bytes, 0, bytes.Length);
        return bytes;
    }

    private static float[] BytesToFloatArray(byte[] bytes)
    {
        if (bytes == null || bytes.Length == 0) return Array.Empty<float>();
        var floats = new float[bytes.Length / sizeof(float)];
        Buffer.BlockCopy(bytes, 0, floats, 0, bytes.Length);
        return floats;
    }

    #region Scenarios Management

    public async Task<List<ScenarioEntity>> GetActiveScenariosAsync(CancellationToken ct = default)
    {
        var list = new List<ScenarioEntity>();
        using var conn = new SqliteConnection(_connectionString);
        await conn.OpenAsync(ct);

        using var cmd = conn.CreateCommand();
        cmd.CommandText = @"
            SELECT Id, Code, Title, ClaimText, Platform, DoubtSignals, PotentialRisk, DisplayOrder, IsActive, CreatedAtUtc, UpdatedAtUtc
            FROM Scenarios
            WHERE IsActive = 1
            ORDER BY DisplayOrder ASC, Code ASC;
        ";
        using var reader = await cmd.ExecuteReaderAsync(ct);
        while (await reader.ReadAsync(ct))
        {
            list.Add(ReadScenario(reader));
        }
        return list;
    }

    public async Task<List<ScenarioEntity>> GetAllScenariosAsync(CancellationToken ct = default)
    {
        var list = new List<ScenarioEntity>();
        using var conn = new SqliteConnection(_connectionString);
        await conn.OpenAsync(ct);

        using var cmd = conn.CreateCommand();
        cmd.CommandText = @"
            SELECT Id, Code, Title, ClaimText, Platform, DoubtSignals, PotentialRisk, DisplayOrder, IsActive, CreatedAtUtc, UpdatedAtUtc
            FROM Scenarios
            ORDER BY DisplayOrder ASC, Code ASC;
        ";
        using var reader = await cmd.ExecuteReaderAsync(ct);
        while (await reader.ReadAsync(ct))
        {
            list.Add(ReadScenario(reader));
        }
        return list;
    }

    public async Task<ScenarioEntity?> GetScenarioByIdAsync(string id, CancellationToken ct = default)
    {
        using var conn = new SqliteConnection(_connectionString);
        await conn.OpenAsync(ct);

        using var cmd = conn.CreateCommand();
        cmd.CommandText = @"
            SELECT Id, Code, Title, ClaimText, Platform, DoubtSignals, PotentialRisk, DisplayOrder, IsActive, CreatedAtUtc, UpdatedAtUtc
            FROM Scenarios
            WHERE Id = @Id
            LIMIT 1;
        ";
        cmd.Parameters.AddWithValue("@Id", id);

        using var reader = await cmd.ExecuteReaderAsync(ct);
        if (await reader.ReadAsync(ct))
        {
            return ReadScenario(reader);
        }
        return null;
    }

    public async Task<ScenarioEntity> CreateScenarioAsync(ScenarioEntity s, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(s.Id))
        {
            s.Id = Guid.NewGuid().ToString("N");
        }
        s.CreatedAtUtc = DateTime.UtcNow;
        s.UpdatedAtUtc = DateTime.UtcNow;

        using var conn = new SqliteConnection(_connectionString);
        await conn.OpenAsync(ct);

        using var cmd = conn.CreateCommand();
        cmd.CommandText = @"
            INSERT INTO Scenarios (Id, Code, Title, ClaimText, Platform, DoubtSignals, PotentialRisk, DisplayOrder, IsActive, CreatedAtUtc, UpdatedAtUtc)
            VALUES (@Id, @Code, @Title, @ClaimText, @Platform, @DoubtSignals, @PotentialRisk, @DisplayOrder, @IsActive, @CreatedAtUtc, @UpdatedAtUtc);
        ";
        cmd.Parameters.AddWithValue("@Id", s.Id);
        cmd.Parameters.AddWithValue("@Code", s.Code ?? string.Empty);
        cmd.Parameters.AddWithValue("@Title", s.Title ?? string.Empty);
        cmd.Parameters.AddWithValue("@ClaimText", s.ClaimText ?? string.Empty);
        cmd.Parameters.AddWithValue("@Platform", s.Platform ?? "Khác");
        cmd.Parameters.AddWithValue("@DoubtSignals", s.DoubtSignals ?? string.Empty);
        cmd.Parameters.AddWithValue("@PotentialRisk", s.PotentialRisk ?? string.Empty);
        cmd.Parameters.AddWithValue("@DisplayOrder", s.DisplayOrder);
        cmd.Parameters.AddWithValue("@IsActive", s.IsActive ? 1 : 0);
        cmd.Parameters.AddWithValue("@CreatedAtUtc", s.CreatedAtUtc.ToString("o"));
        cmd.Parameters.AddWithValue("@UpdatedAtUtc", s.UpdatedAtUtc.ToString("o"));

        await cmd.ExecuteNonQueryAsync(ct);
        return s;
    }

    public async Task<bool> UpdateScenarioAsync(ScenarioEntity s, CancellationToken ct = default)
    {
        s.UpdatedAtUtc = DateTime.UtcNow;

        using var conn = new SqliteConnection(_connectionString);
        await conn.OpenAsync(ct);

        using var cmd = conn.CreateCommand();
        cmd.CommandText = @"
            UPDATE Scenarios
            SET Code = @Code,
                Title = @Title,
                ClaimText = @ClaimText,
                Platform = @Platform,
                DoubtSignals = @DoubtSignals,
                PotentialRisk = @PotentialRisk,
                DisplayOrder = @DisplayOrder,
                IsActive = @IsActive,
                UpdatedAtUtc = @UpdatedAtUtc
            WHERE Id = @Id;
        ";
        cmd.Parameters.AddWithValue("@Id", s.Id);
        cmd.Parameters.AddWithValue("@Code", s.Code ?? string.Empty);
        cmd.Parameters.AddWithValue("@Title", s.Title ?? string.Empty);
        cmd.Parameters.AddWithValue("@ClaimText", s.ClaimText ?? string.Empty);
        cmd.Parameters.AddWithValue("@Platform", s.Platform ?? "Khác");
        cmd.Parameters.AddWithValue("@DoubtSignals", s.DoubtSignals ?? string.Empty);
        cmd.Parameters.AddWithValue("@PotentialRisk", s.PotentialRisk ?? string.Empty);
        cmd.Parameters.AddWithValue("@DisplayOrder", s.DisplayOrder);
        cmd.Parameters.AddWithValue("@IsActive", s.IsActive ? 1 : 0);
        cmd.Parameters.AddWithValue("@UpdatedAtUtc", s.UpdatedAtUtc.ToString("o"));

        int rows = await cmd.ExecuteNonQueryAsync(ct);
        return rows > 0;
    }

    public async Task<bool> DeleteScenarioAsync(string id, CancellationToken ct = default)
    {
        using var conn = new SqliteConnection(_connectionString);
        await conn.OpenAsync(ct);

        using var cmd = conn.CreateCommand();
        cmd.CommandText = "DELETE FROM Scenarios WHERE Id = @Id;";
        cmd.Parameters.AddWithValue("@Id", id);

        int rows = await cmd.ExecuteNonQueryAsync(ct);
        return rows > 0;
    }

    public async Task SeedDefaultScenariosAsync(bool force = false, CancellationToken ct = default)
    {
        using var conn = new SqliteConnection(_connectionString);
        await conn.OpenAsync(ct);

        if (!force)
        {
            using var countCmd = conn.CreateCommand();
            countCmd.CommandText = "SELECT COUNT(1) FROM Scenarios;";
            var count = Convert.ToInt64(await countCmd.ExecuteScalarAsync(ct));
            if (count > 0)
            {
                return; // Đã có dữ liệu, không cần reseed
            }
        }
        else
        {
            using var delCmd = conn.CreateCommand();
            delCmd.CommandText = "DELETE FROM Scenarios;";
            await delCmd.ExecuteNonQueryAsync(ct);
        }

        var defaultScenarios = GetPrompt04SeedData();
        using var trans = conn.BeginTransaction();
        foreach (var s in defaultScenarios)
        {
            using var insCmd = conn.CreateCommand();
            insCmd.Transaction = trans;
            insCmd.CommandText = @"
                INSERT INTO Scenarios (Id, Code, Title, ClaimText, Platform, DoubtSignals, PotentialRisk, DisplayOrder, IsActive, CreatedAtUtc, UpdatedAtUtc)
                VALUES (@Id, @Code, @Title, @ClaimText, @Platform, @DoubtSignals, @PotentialRisk, @DisplayOrder, @IsActive, @CreatedAtUtc, @UpdatedAtUtc);
            ";
            insCmd.Parameters.AddWithValue("@Id", s.Id);
            insCmd.Parameters.AddWithValue("@Code", s.Code);
            insCmd.Parameters.AddWithValue("@Title", s.Title);
            insCmd.Parameters.AddWithValue("@ClaimText", s.ClaimText);
            insCmd.Parameters.AddWithValue("@Platform", s.Platform);
            insCmd.Parameters.AddWithValue("@DoubtSignals", s.DoubtSignals);
            insCmd.Parameters.AddWithValue("@PotentialRisk", s.PotentialRisk);
            insCmd.Parameters.AddWithValue("@DisplayOrder", s.DisplayOrder);
            insCmd.Parameters.AddWithValue("@IsActive", s.IsActive ? 1 : 0);
            insCmd.Parameters.AddWithValue("@CreatedAtUtc", s.CreatedAtUtc.ToString("o"));
            insCmd.Parameters.AddWithValue("@UpdatedAtUtc", s.UpdatedAtUtc.ToString("o"));
            await insCmd.ExecuteNonQueryAsync(ct);
        }
        await trans.CommitAsync(ct);
    }

    private static ScenarioEntity ReadScenario(SqliteDataReader reader)
    {
        return new ScenarioEntity
        {
            Id = reader.GetString(0),
            Code = reader.GetString(1),
            Title = reader.GetString(2),
            ClaimText = reader.GetString(3),
            Platform = reader.GetString(4),
            DoubtSignals = reader.GetString(5),
            PotentialRisk = reader.GetString(6),
            DisplayOrder = reader.GetInt32(7),
            IsActive = reader.GetInt32(8) == 1,
            CreatedAtUtc = DateTime.Parse(reader.GetString(9)),
            UpdatedAtUtc = DateTime.Parse(reader.GetString(10))
        };
    }

    private static List<ScenarioEntity> GetPrompt04SeedData()
    {
        DateTime now = DateTime.UtcNow;
        return new List<ScenarioEntity>
        {
            new ScenarioEntity
            {
                Id = "scenario_th01",
                Code = "TH01",
                Title = "Cần tây + dứa thay Metformin trị đái tháo đường",
                ClaimText = "Uống nước ép cần tây phối hợp dứa và bài thuốc gia truyền có thể thay thế hoàn toàn Metformin, chữa khỏi dứt điểm tiểu đường tuýp 2 sau 14 ngày mà không cần dùng thuốc tây cả đời.",
                Platform = "TikTok",
                DoubtSignals = "Khẳng định chữa dứt điểm bệnh mãn tính; kêu gọi bỏ thuốc tây; dùng từ ngữ tuyệt đối hóa ('100%', 'sau 14 ngày'); không có trích dẫn thử nghiệm lâm sàng.",
                PotentialRisk = "Bệnh nhân tự ý bỏ Metformin dẫn tới tăng đường huyết cấp tính, nguy cơ hôn mê do nhiễm toan ceton hoặc tăng áp lực thẩm thấu, lâu dài thúc đẩy biến chứng võng mạc, suy thận.",
                DisplayOrder = 1,
                IsActive = true,
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            },
            new ScenarioEntity
            {
                Id = "scenario_th02",
                Code = "TH02",
                Title = "Trà thảo mộc giảm 7kg trong 1 tuần (chứa Sibutramine)",
                ClaimText = "Trà thảo mộc giảm cân nguồn gốc thiên nhiên, cam kết giảm 7kg trong 1 tuần, không cần ăn kiêng hay tập luyện, đào thải mỡ thừa tuyệt đối an toàn cho cả phụ nữ sau sinh.",
                Platform = "TikTok",
                DoubtSignals = "Giảm cân quá nhanh (1kg/ngày); không công bố bảng kiểm nghiệm hoạt chất; dấu hiệu che giấu hoạt chất cấm Sibutramine; hiệu ứng hình ảnh dàn dựng.",
                PotentialRisk = "Độc tính tim mạch nặng nề do Sibutramine (tăng huyết áp kịch phát, rối loạn nhịp thất, đột quỵ); mất nước và rối loạn điện giải nghiêm trọng do thuốc xổ ngụy trang.",
                DisplayOrder = 2,
                IsActive = true,
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            },
            new ScenarioEntity
            {
                Id = "scenario_th03",
                Code = "TH03",
                Title = "Kem trộn Dexamethasone + Aspirin trị nám cấp tốc sau 3 ngày",
                ClaimText = "Công thức kem trộn thần thánh chứa Dexamethasone và Aspirin pH8 giúp đánh bay nám mảng, tàn nhang và da trắng mịn không tì vết chỉ sau 3 ngày sử dụng.",
                Platform = "TikTok",
                DoubtSignals = "Hiệu quả cấp tốc ('3 ngày'); hướng dẫn tự phối trộn thuốc kê đơn; không cảnh báo chống chỉ định; sử dụng hình ảnh lọc sáng đánh lừa thị giác.",
                PotentialRisk = "Teo da, rạn da không hồi phục, giãn mao mạch, bùng phát mụn trứng cá ồ ạt, nhiễm trùng da thứ phát, hội chứng Cushing do thuốc khi Corticoid hấp thu toàn thân.",
                DisplayOrder = 3,
                IsActive = true,
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            },
            new ScenarioEntity
            {
                Id = "scenario_th04",
                Code = "TH04",
                Title = "Tự tiêm truyền tĩnh mạch Glutathione 1200mg tại nhà",
                ClaimText = "Dịch vụ truyền trắng da tại nhà bằng Glutathione 1200mg kết hợp Vitamin C liều cao, an toàn tuyệt đối, trắng bật tông ngay buổi đầu tiên, thay thế hoàn toàn kem chống nắng.",
                Platform = "TikTok",
                DoubtSignals = "Tự ý thực hiện thủ thuật tiêm truyền ngoài cơ sở y tế; thần thánh hóa Glutathione làm trắng da; tuyên bố thay thế kem chống nắng phi khoa học.",
                PotentialRisk = "Nguy cơ sốc phản vệ gây tử vong ngay lập tức; nhiễm trùng huyết, viêm tắc tĩnh mạch; suy giảm chức năng gan thận do quá tải liều dùng truyền tĩnh mạch không kiểm soát.",
                DisplayOrder = 4,
                IsActive = true,
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            },
            new ScenarioEntity
            {
                Id = "scenario_th05",
                Code = "TH05",
                Title = "Uống Ivermectin liều gấp 5 lần ngừa và diệt virus cúm mùa",
                ClaimText = "Phác đồ bí mật ngừa và diệt virus cúm mùa, cúm A tại nhà bằng cách uống Ivermectin liều gấp 5 lần kết hợp Hydroxychloroquine và Kẽm, hiệu quả 100% không cần đến bệnh viện.",
                Platform = "Facebook",
                DoubtSignals = "Tuyên bố 'phác đồ bí mật bị giấu kín'; khuyên dùng liều gấp nhiều lần hướng dẫn; áp dụng thuốc trị ký sinh trùng cho bệnh do virus; kích động tâm lý chống y tế chính thống.",
                PotentialRisk = "Độc tính thần kinh nghiêm trọng (co giật, hôn mê, suy nhược thần kinh); kéo dài khoảng QT gây loạn nhịp thất chết người; tổn thương gan cấp và mù lòa do ngộ độc võng mạc.",
                DisplayOrder = 5,
                IsActive = true,
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            },
            new ScenarioEntity
            {
                Id = "scenario_th06",
                Code = "TH06",
                Title = "Uống Paracetamol 500mg mỗi 2 giờ hạ sốt khi sốt xuất huyết",
                ClaimText = "Trẻ sốt cao 39 độ do sốt xuất huyết cần cho uống xen kẽ Paracetamol 500mg mỗi 2 tiếng một lần để dập sốt nhanh, tránh biến chứng co giật não.",
                Platform = "Facebook",
                DoubtSignals = "Sai khoảng cách liều an toàn (chuẩn là 4-6 giờ); liều vượt ngưỡng tối đa cho phép ở trẻ em; không đề cập đến liều lượng theo cân nặng (mg/kg).",
                PotentialRisk = "Ngộ độc Paracetamol cấp tính dẫn đến hoại tử tế bào gan ồ ạt, suy gan cấp đe dọa tính mạng, đặc biệt nguy hiểm ở bệnh nhân sốt xuất huyết đang có rối loạn đông máu.",
                DisplayOrder = 6,
                IsActive = true,
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            },
            new ScenarioEntity
            {
                Id = "scenario_th07",
                Code = "TH07",
                Title = "Ngừng Amlodipine khi huyết áp về 120/80 để tránh suy thận",
                ClaimText = "Khi đo thấy chỉ số huyết áp về 120/80 mmHg thì phải lập tức dừng uống Amlodipine để thận nghỉ ngơi, uống thuốc tây liên tục sẽ gây suy thận và mục xương.",
                Platform = "Facebook",
                DoubtSignals = "Hiểu sai bản chất bệnh lý mãn tính; đánh đồng tác dụng kiểm soát với khỏi bệnh; gieo rắc nỗi sợ hãi vô căn cứ về thuốc tây; không hiểu cơ chế huyết áp.",
                PotentialRisk = "Tăng huyết áp dội ngược kịch phát (Rebound hypertension) dẫn đến vỡ mạch máu não, đột quỵ xuất huyết não, nhồi máu cơ tim cấp hoặc suy tim cấp.",
                DisplayOrder = 7,
                IsActive = true,
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            },
            new ScenarioEntity
            {
                Id = "scenario_th08",
                Code = "TH08",
                Title = "Lá đu đủ đực và củ sả trị khỏi ung thư phổi giai đoạn 4",
                ClaimText = "Kỳ tích khỏi hoàn toàn ung thư phổi giai đoạn 4 nhờ bài thuốc uống nước sắc lá đu đủ đực và củ sả tươi, từ bỏ hóa chất độc hại của bệnh viện để sống thọ.",
                Platform = "Facebook",
                DoubtSignals = "Cam kết chữa khỏi ung thư giai đoạn muộn; kêu gọi từ bỏ phác đồ điều trị chuẩn của bệnh viện; hình ảnh chứng minh bệnh án không rõ ràng, có dấu hiệu photoshop.",
                PotentialRisk = "Bệnh nhân đánh mất 'thời gian vàng' điều trị ung thư bằng y học hiện đại; khối u tiến triển xâm lấn di căn mất kiểm soát, dẫn đến suy kiệt và tử vong nhanh chóng.",
                DisplayOrder = 8,
                IsActive = true,
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            },
            new ScenarioEntity
            {
                Id = "scenario_th09",
                Code = "TH09",
                Title = "Sụn vi cá mập nano phục hồi 100% sụn khớp và thoát vị đĩa đệm",
                ClaimText = "Công nghệ nano siêu phân tử từ sụn vi cá mập giúp tái tạo 100% sụn khớp đã thoái hóa, phục hồi đĩa đệm thoát vị hoàn toàn sau 1 tháng, cam kết không cần phẫu thuật.",
                Platform = "YouTube",
                DoubtSignals = "Giả mạo giao diện bản tin thời sự; phóng đại hiệu quả phục hồi thoái hóa sụn khớp; dàn dựng phỏng vấn bệnh nhân giả.",
                PotentialRisk = "Trì hoãn can thiệp chỉnh hình y khoa dẫn đến teo cơ, biến dạng khớp, dính khớp vĩnh viễn và mất khả năng vận động; tương tác bất lợi với các thuốc tim mạch đang dùng.",
                DisplayOrder = 9,
                IsActive = true,
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            },
            new ScenarioEntity
            {
                Id = "scenario_th10",
                Code = "TH10",
                Title = "Uống nước ion kiềm pH 11.5 trung hòa toàn bộ axit dạ dày",
                ClaimText = "Uống nước ion kiềm độ pH 11.5 mỗi ngày giúp trung hòa toàn bộ axit trong dạ dày, chữa lành dứt điểm viêm loét trào ngược và kiềm hóa máu ngăn ngừa mọi loại bệnh tật.",
                Platform = "YouTube",
                DoubtSignals = "Khái niệm sinh lý học sai lầm nghiêm trọng (độ pH máu được hệ đệm duy trì nghiêm ngặt ở 7.35-7.45); tuyên bố trung hòa toàn bộ axit dạ dày trái ngược với sinh lý tiêu hóa.",
                PotentialRisk = "Phá hủy hàng rào axit bảo vệ dạ dày dẫn đến nhiễm khuẩn tiêu hóa; kiềm chuyển hóa (Metabolic alkalosis) gây rối loạn điện giải, co giật tetany cơ và tổn thương niêm mạc.",
                DisplayOrder = 10,
                IsActive = true,
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            },
            new ScenarioEntity
            {
                Id = "scenario_th11",
                Code = "TH11",
                Title = "Vaccine biến đổi DNA, thụt tháo ruột bằng cà phê để ngừa bệnh",
                ClaimText = "Vắc-xin chứa kim loại nặng làm biến đổi cấu trúc DNA người, chỉ cần thụt tháo ruột bằng nước cà phê hữu cơ sẽ tống khứ mọi độc tố và ngừa được mọi bệnh lây nhiễm.",
                Platform = "YouTube",
                DoubtSignals = "Luận điểm ngụy khoa học đã bị giới y khoa toàn cầu bác bỏ; gieo rắc sự sợ hãi phi lý; khuyến khích phương pháp xâm lấn trực tràng không có chỉ định y học.",
                PotentialRisk = "Bùng phát các dịch bệnh truyền nhiễm nguy hiểm trong cộng đồng; biến chứng thủng trực tràng, rách niêm mạc đại tràng, nhiễm trùng huyết và mất cân bằng điện giải nặng.",
                DisplayOrder = 11,
                IsActive = true,
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            },
            new ScenarioEntity
            {
                Id = "scenario_th12",
                Code = "TH12",
                Title = "Uống Amoxicillin + Ciprofloxacin chữa dứt điểm cảm cúm trong 1 ngày",
                ClaimText = "Kinh nghiệm điều trị cảm cúm dứt điểm sau 1 ngày: Uống kết hợp Amoxicillin 500mg và Ciprofloxacin 500mg ngay khi mới chớm sốt nghẹt mũi để diệt tận gốc mầm bệnh.",
                Platform = "YouTube",
                DoubtSignals = "Lạm dụng kháng sinh cho bệnh lý nhiễm virus (cảm cúm do virus, kháng sinh hoàn toàn không có tác dụng); phối hợp kháng sinh vô căn cứ và nguy cơ tạo đề kháng cao.",
                PotentialRisk = "Thúc đẩy vi khuẩn kháng kháng sinh đa kháng thuốc; rối loạn khuẩn thù ruột gây tiêu chảy do Clostridioides difficile; tác dụng phụ đứt gân gót Achilles do Ciprofloxacin.",
                DisplayOrder = 12,
                IsActive = true,
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            },
            new ScenarioEntity
            {
                Id = "scenario_th13",
                Code = "TH13",
                Title = "Viên sủi An Đường X ổn định đường huyết dưới 6.0 sau 7 ngày",
                ClaimText = "Viên sủi An Đường X - Thành tựu thảo dược số 1 thế giới, cam kết hạ và ổn định đường huyết dưới 6.0 sau 7 ngày, dứt điểm tiểu đường không tái phát, không tác dụng phụ.",
                Platform = "Website bán hàng",
                DoubtSignals = "Khẳng định khỏi bệnh tiểu đường sau 7 ngày; sử dụng hình ảnh chứng nhận của Bộ Y tế bị chỉnh sửa; dấu hiệu trộn tân dược hạ đường huyết cấm (như Phenformin hoặc Glibenclamide).",
                PotentialRisk = "Tụt đường huyết đột ngột dẫn tới co giật, tổn thương não không hồi phục và tử vong nếu không cấp cứu kịp; suy thận mạn tính do gánh nặng tạp chất không rõ nguồn gốc.",
                DisplayOrder = 13,
                IsActive = true,
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            },
            new ScenarioEntity
            {
                Id = "scenario_th14",
                Code = "TH14",
                Title = "Cao dán nam châm hút sạch tinh thể Urat dứt điểm gout sau 1 đêm",
                ClaimText = "Cao dán chiết xuất nam châm sinh học hút sạch tinh thể muối Urat qua lỗ chân lông sau 1 đêm, dứt điểm cơn đau gout cấp tính, cam kết ăn nhậu thoải mái không lo tái phát.",
                Platform = "Website bán hàng",
                DoubtSignals = "Tuyên bố cơ chế phi lý ('hút tinh thể urat qua da'); dùng từ ngữ giật gân, cam kết ăn uống tự do; không có địa chỉ doanh nghiệp và giấy phép lưu hành sản phẩm.",
                PotentialRisk = "Loét hoại tử da, bỏng hóa chất và nhiễm trùng mô mềm vùng khớp dán cao; tinh thể Urat tiếp tục lắng đọng phá hủy khớp xương và thận gây suy thận giai đoạn cuối.",
                DisplayOrder = 14,
                IsActive = true,
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            },
            new ScenarioEntity
            {
                Id = "scenario_th15",
                Code = "TH15",
                Title = "Siro ho thảo dược cắt cơn hen cấp tính ở trẻ nhỏ sau 5 phút",
                ClaimText = "Siro ho cao cấp thảo dược cắt dứt điểm cơn co thắt hen phế quản ở trẻ nhỏ sau 5 phút, thay thế hoàn toàn bình xịt Ventolin và máy khí dung độc hại của bệnh viện.",
                Platform = "Website bán hàng",
                DoubtSignals = "Tuyên bố thay thế thuốc cấp cứu giãn phế quản; phỉ báng thuốc điều trị chuẩn mực tại bệnh viện; đối tượng mục tiêu là trẻ sơ sinh cực kỳ nhạy cảm và dễ tổn thương.",
                PotentialRisk = "Trẻ bị ngạt thở cấp do cơn hen phế quản ác tính không được cắt cơn kịp thời bằng thuốc giãn phế quản tác dụng nhanh, dẫn đến suy hô hấp cấp, thiếu oxy não và tử vong.",
                DisplayOrder = 15,
                IsActive = true,
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            }
        };
    }

    #endregion
}

