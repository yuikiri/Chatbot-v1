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
}
