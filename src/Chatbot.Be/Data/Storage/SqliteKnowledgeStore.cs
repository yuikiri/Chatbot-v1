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

        bool needReseed = force;
        if (!needReseed)
        {
            using var countCmd = conn.CreateCommand();
            countCmd.CommandText = "SELECT COUNT(1) FROM Scenarios;";
            var count = Convert.ToInt64(await countCmd.ExecuteScalarAsync(ct));

            if (count == 0)
            {
                needReseed = true;
            }
            else
            {
                // Kiểm tra xem dữ liệu có phải là 15 tình huống cũ (Metformin / Đái tháo đường) hay không
                using var checkCmd = conn.CreateCommand();
                checkCmd.CommandText = "SELECT ClaimText FROM Scenarios WHERE Code = 'TH01' LIMIT 1;";
                var th01Claim = (await checkCmd.ExecuteScalarAsync(ct))?.ToString() ?? string.Empty;
                if (th01Claim.Contains("Metformin", StringComparison.OrdinalIgnoreCase))
                {
                    needReseed = true;
                }
            }
        }

        if (!needReseed)
        {
            return; // Đã có dữ liệu chuẩn, không cần reseed
        }

        using var delCmd = conn.CreateCommand();
        delCmd.CommandText = "DELETE FROM Scenarios;";
        await delCmd.ExecuteNonQueryAsync(ct);

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
                Title = "Paracetamol hạ sốt giảm đau",
                ClaimText = "Tôi đang cho con bú, bị sốt 38.5 độ thì uống Panadol hoặc Hapacol (Paracetamol) có an toàn không? Có cần vắt bỏ sữa 3 ngày không và uống vào thời điểm nào tốt nhất?",
                Platform = "Hạ sốt & Giảm đau",
                DoubtSignals = "Chỉ số an toàn RID < 2%, L/P ratio thấp, nồng độ đỉnh trong sữa sau 1-2 giờ; không cần vắt bỏ sữa mẹ.",
                PotentialRisk = "Tránh uống quá liều 4g/ngày; nên uống ngay sau khi cho con bú xong để giảm nồng độ thuốc trong cữ bú kế tiếp.",
                DisplayOrder = 1,
                IsActive = true,
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            },
            new ScenarioEntity
            {
                Id = "scenario_th02",
                Code = "TH02",
                Title = "Ibuprofen giảm đau sau sinh",
                ClaimText = "Tôi bị đau răng và đau vết mổ sau sinh dữ dội, đang cho con bú uống Ibuprofen có được không và có nguy cơ độc tính gì cho bé không?",
                Platform = "Hạ sốt & Giảm đau",
                DoubtSignals = "Ibuprofen gắn kết protein huyết tương mẹ > 99%, bài tiết vào sữa với lượng vết (RID < 1%), là NSAID an toàn hàng đầu khi cho con bú.",
                PotentialRisk = "Chống chỉ định nếu người mẹ có tiền sử loét dạ dày tiến triển; theo dõi trẻ nếu mẹ dùng liều cao kéo dài.",
                DisplayOrder = 2,
                IsActive = true,
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            },
            new ScenarioEntity
            {
                Id = "scenario_th03",
                Code = "TH03",
                Title = "Amoxicillin trị nhiễm khuẩn",
                ClaimText = "Tôi bị viêm họng, bác sĩ kê kháng sinh Amoxicillin. Thuốc này có an toàn khi đang cho con bú không, có ảnh hưởng men răng hay hệ tiêu hóa của bé không?",
                Platform = "Kháng sinh",
                DoubtSignals = "Nhóm Penicillin/Beta-lactam tương thích cao với cho con bú, không ảnh hưởng men răng như Tetracycline.",
                PotentialRisk = "Theo dõi trẻ bú mẹ về nguy cơ rối loạn tiêu hóa nhẹ (phân lỏng, tiêu chảy thoáng qua) hoặc tưa lưỡi do thay đổi hệ vi khuẩn.",
                DisplayOrder = 3,
                IsActive = true,
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            },
            new ScenarioEntity
            {
                Id = "scenario_th04",
                Code = "TH04",
                Title = "Pseudoephedrine trị cảm cúm",
                ClaimText = "Tôi đang cho con bú nhưng bị nghẹt mũi sổ mũi cảm cúm, uống thuốc cảm chứa Pseudoephedrine có được không? Thuốc này có làm giảm tiết sữa mẹ không?",
                Platform = "Hô hấp & Cảm cúm",
                DoubtSignals = "Pseudoephedrine là chất cường giao cảm làm giảm bài tiết Prolactin, có thể làm giảm 24% thể tích sữa mẹ sau một liều.",
                PotentialRisk = "Nguy cơ mất sữa cấp tính; trẻ bú mẹ có thể bị bứt rứt, mất ngủ, nhịp tim nhanh. Khuyến cáo dùng nước muối sinh lý xịt mũi tại chỗ thay thế.",
                DisplayOrder = 4,
                IsActive = true,
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            },
            new ScenarioEntity
            {
                Id = "scenario_th05",
                Code = "TH05",
                Title = "Chè vằng & Thảo dược kích sữa",
                ClaimText = "Sau sinh tôi bị ít sữa, có nên uống cao chè vằng đặc để kích sữa không và uống thế nào để an toàn, không bị mất sữa?",
                Platform = "Tiết sữa & Sữa mẹ",
                DoubtSignals = "Uống chè vằng nồng độ quá đặc có thể gây co bóp tử cung mạnh và ức chế phản xạ tiết sữa, gây phản tác dụng làm tiêu sữa.",
                PotentialRisk = "Khuyến cáo kích sữa bằng biện pháp sinh lý (tăng cữ bú, vắt kiệt sữa, tiếp xúc da kề da, uống đủ 2.5-3 lít nước ấm mỗi ngày).",
                DisplayOrder = 5,
                IsActive = true,
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            },
            new ScenarioEntity
            {
                Id = "scenario_th06",
                Code = "TH06",
                Title = "Metronidazole trị nấm phụ khoa",
                ClaimText = "Tôi bị viêm nấm âm đạo cần uống Metronidazole liều cao 2g, thuốc có bài tiết qua sữa mẹ không và bao lâu sau uống thì cho con bú an toàn?",
                Platform = "Kháng sinh",
                DoubtSignals = "Metronidazole bài tiết qua sữa đáng kể (RID 10-15%) và làm sữa mẹ có vị đắng khiến trẻ dễ bỏ bú.",
                PotentialRisk = "Nếu uống liều cao duy nhất 2g, khuyến cáo tạm ngưng cho con bú và vắt bỏ sữa trong 12 - 24 giờ để thuốc đào thải khỏi cơ thể.",
                DisplayOrder = 6,
                IsActive = true,
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            },
            new ScenarioEntity
            {
                Id = "scenario_th07",
                Code = "TH07",
                Title = "Kháng histamin trị dị ứng",
                ClaimText = "Tôi bị dị ứng nổi mề đay ngứa ngáy sau sinh, uống Clorpheniramin được không hay nên đổi sang thuốc kháng histamin an toàn hơn như Loratadine?",
                Platform = "Dị ứng & Da liễu",
                DoubtSignals = "Clorpheniramin thế hệ 1 qua hàng rào máu não gây an thần mạnh, có thể ức chế hô hấp và gây buồn ngủ li bì ở trẻ nhỏ.",
                PotentialRisk = "Ưu tiên lựa chọn kháng histamin thế hệ 2 (Loratadine, Cetirizine) vì ít qua sữa, không gây an thần và không làm giảm tiết sữa.",
                DisplayOrder = 7,
                IsActive = true,
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            },
            new ScenarioEntity
            {
                Id = "scenario_th08",
                Code = "TH08",
                Title = "Aspirin & Nguy cơ hội chứng Reye",
                ClaimText = "Tôi bị đau đầu sau sinh, uống 1 viên Aspirin 500mg hạ sốt giảm đau được không hay có nguy cơ hội chứng Reye ở trẻ bú mẹ?",
                Platform = "Hạ sốt & Giảm đau",
                DoubtSignals = "Aspirin liều giảm đau hạ sốt (500mg) CHỐNG CHỈ ĐỊNH ở phụ nữ cho con bú do nguy cơ gây hội chứng Reye chết người ở trẻ bú mẹ.",
                PotentialRisk = "Hội chứng Reye gây suy gan não cấp tính với tỷ lệ tử vong cao; khuyến cáo thay thế hoàn toàn bằng Paracetamol hoặc Ibuprofen.",
                DisplayOrder = 8,
                IsActive = true,
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            },
            new ScenarioEntity
            {
                Id = "scenario_th09",
                Code = "TH09",
                Title = "Ciprofloxacin trị viêm tiết niệu",
                ClaimText = "Tôi bị viêm tiết niệu sau sinh, bác sĩ kê Ciprofloxacin 500mg. Kháng sinh này bài tiết qua sữa mẹ thế nào và có nguy cơ ảnh hưởng sụn khớp của bé không?",
                Platform = "Kháng sinh",
                DoubtSignals = "Nhóm Quinolone bài tiết vào sữa mẹ và trên mô hình thực nghiệm có nguy cơ gây thoái hóa mô sụn khớp ở động vật non.",
                PotentialRisk = "Chỉ dùng khi không có kháng sinh thay thế an toàn hơn; cần theo dõi phân của trẻ và tham vấn bác sĩ đổi sang nhóm Cephalosporin.",
                DisplayOrder = 9,
                IsActive = true,
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            },
            new ScenarioEntity
            {
                Id = "scenario_th10",
                Code = "TH10",
                Title = "Thuốc tránh thai an toàn sữa mẹ",
                ClaimText = "Phụ nữ đang nuôi con bằng sữa mẹ nên dùng thuốc tránh thai loại nào an toàn? Thuốc tránh thai kết hợp chứa Estrogen có làm mất sữa mẹ không?",
                Platform = "Sức khỏe sinh sản",
                DoubtSignals = "Estrogen làm giảm đáng kể nồng độ Prolactin, làm giảm thể tích và chất lượng sữa mẹ trong 6 tháng đầu sau sinh.",
                PotentialRisk = "Phụ nữ nuôi con bằng sữa mẹ nên dùng viên tránh thai chỉ chứa Progestin (POPs) hoặc cấy que tránh thai để không ảnh hưởng nguồn sữa.",
                DisplayOrder = 10,
                IsActive = true,
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            },
            new ScenarioEntity
            {
                Id = "scenario_th11",
                Code = "TH11",
                Title = "Trà & Viên giảm cân sau sinh",
                ClaimText = "Mẹ đang cho con bú có nên uống các loại trà hoặc viên giảm cân sau sinh không? Hoạt chất giảm cân có bài tiết qua sữa gây nguy hiểm cho bé không?",
                Platform = "Sữa mẹ & Dinh dưỡng",
                DoubtSignals = "Nhiều sản phẩm giảm cân trôi nổi chứa hoạt chất cấm Sibutramine và thuốc nhuận tràng bài tiết mạnh qua sữa mẹ.",
                PotentialRisk = "Gây nhịp tim nhanh, tăng huyết áp kịch phát, tiêu chảy cấp mất nước và co giật ở trẻ bú mẹ; tuyệt đối không dùng khi cho con bú.",
                DisplayOrder = 11,
                IsActive = true,
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            },
            new ScenarioEntity
            {
                Id = "scenario_th12",
                Code = "TH12",
                Title = "Rượu bia & Phản xạ tiết sữa",
                ClaimText = "Mẹo dân gian truyền miệng uống bia hoặc rượu nếp trước cữ bú để kích sữa có đúng không? Cồn ảnh hưởng thế nào đến lượng sữa và sức khỏe của trẻ?",
                Platform = "Tiết sữa & Sữa mẹ",
                DoubtSignals = "Cồn (Ethanol) ức chế bài tiết Oxytocin làm giảm lượng sữa mẹ thực tế 20%, không hề có tác dụng kích sữa như lời đồn.",
                PotentialRisk = "Cồn qua sữa mẹ làm trẻ ngủ li bì, ức chế phản xạ bú, chậm phát triển vận động và thần kinh; khuyến cáo kiêng hoàn toàn cồn.",
                DisplayOrder = 12,
                IsActive = true,
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            },
            new ScenarioEntity
            {
                Id = "scenario_th13",
                Code = "TH13",
                Title = "Nứt cổ gà & Thuốc bôi núm vú",
                ClaimText = "Tôi bị nứt cổ gà và đau rát núm ti khi cho con bú, nên bôi thuốc gì an toàn? Có được tự ý bôi kem Corticoid (Betamethasone) lên đầu ngực không?",
                Platform = "Dị ứng & Da liễu",
                DoubtSignals = "Trẻ nuốt phải Corticoid hiệu lực mạnh khi ngậm bú có nguy cơ suy thượng thận cấp tính, loét niêm mạc miệng và suy giảm miễn dịch.",
                PotentialRisk = "Khuyến cáo dùng Lanolin y tế tinh khiết 100% (an toàn không cần lau trước khi bú) và điều chỉnh khớp ngậm đúng của trẻ.",
                DisplayOrder = 13,
                IsActive = true,
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            },
            new ScenarioEntity
            {
                Id = "scenario_th14",
                Code = "TH14",
                Title = "Doxycycline & An toàn men răng",
                ClaimText = "Tôi bị mụn trứng cá sau sinh, có được uống kháng sinh Doxycycline 100mg kéo dài không, thuốc có ảnh hưởng men răng và xương của trẻ bú mẹ không?",
                Platform = "Kháng sinh",
                DoubtSignals = "Nhóm Tetracycline/Doxycycline tạo phức chelat với Canxi lắng đọng vào mầm răng và xương của trẻ sơ sinh.",
                PotentialRisk = "Dùng kéo dài (> 3 tuần) có nguy cơ làm ố vàng xỉn màu men răng vĩnh viễn và chậm phát triển xương; chống chỉ định dùng kéo dài cho mẹ cho con bú.",
                DisplayOrder = 14,
                IsActive = true,
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            },
            new ScenarioEntity
            {
                Id = "scenario_th15",
                Code = "TH15",
                Title = "Dấu hiệu dị ứng thuốc ở trẻ",
                ClaimText = "Trẻ sơ sinh bú mẹ nếu có biểu hiện dị ứng thuốc hoặc phát ban khó thở thì cần xử trí cấp cứu ra sao, có được áp dụng mẹo dân gian tại nhà không?",
                Platform = "Cấp cứu lâm sàng",
                DoubtSignals = "Dấu hiệu thở rít, tím tái, li bì, phát ban toàn thân là cấp cứu phản vệ tối khẩn cấp, tuyệt đối không vắt chanh hay dùng mẹo dân gian.",
                PotentialRisk = "Lập tức gọi Cấp cứu 115 hoặc đưa trẻ đến khoa Cấp cứu bệnh viện gần nhất; mang theo toàn bộ thuốc mẹ đang sử dụng để bác sĩ xử trí.",
                DisplayOrder = 15,
                IsActive = true,
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            }
        };
    }

    #endregion
}

