namespace Chatbot.Data.Text;

public record ChunkCandidate(string Content, int StartOffset, int EndOffset);

public static class OffsetChunker
{
    /// <summary>
    /// Chia văn bản thành các đoạn (chunks) có kích thước xấp xỉ maxChunkChars,
    /// bảo toàn ranh giới câu/đoạn và ghi nhận chính xác StartOffset & EndOffset trong văn bản gốc.
    /// </summary>
    public static List<ChunkCandidate> ChunkWithOffsets(string fullText, int maxChunkChars = 800, int minChunkChars = 100)
    {
        var results = new List<ChunkCandidate>();
        if (string.IsNullOrWhiteSpace(fullText))
            return results;

        // Tách theo các khối đoạn văn (paragraphs)
        var paragraphs = fullText.Split(new[] { "\r\n\r\n", "\n\n" }, StringSplitOptions.None);
        int currentSearchIndex = 0;

        string currentChunk = string.Empty;
        int chunkStartOffset = -1;
        int chunkEndOffset = -1;

        foreach (var p in paragraphs)
        {
            var trimmed = p.Trim();
            if (string.IsNullOrEmpty(trimmed))
                continue;

            int paraPos = fullText.IndexOf(trimmed, currentSearchIndex, StringComparison.Ordinal);
            if (paraPos < 0)
                paraPos = currentSearchIndex; // fallback an toàn

            int paraEndPos = paraPos + trimmed.Length;
            currentSearchIndex = paraEndPos;

            if (string.IsNullOrEmpty(currentChunk))
            {
                currentChunk = trimmed;
                chunkStartOffset = paraPos;
                chunkEndOffset = paraEndPos;
            }
            else if (currentChunk.Length + trimmed.Length + 2 <= maxChunkChars)
            {
                currentChunk += "\n\n" + trimmed;
                chunkEndOffset = paraEndPos;
            }
            else
            {
                // Đoạn hiện tại đã đủ lớn, lưu lại
                if (currentChunk.Length >= minChunkChars)
                {
                    results.Add(new ChunkCandidate(currentChunk, chunkStartOffset, chunkEndOffset));
                }

                currentChunk = trimmed;
                chunkStartOffset = paraPos;
                chunkEndOffset = paraEndPos;
            }
        }

        if (!string.IsNullOrEmpty(currentChunk) && currentChunk.Length >= minChunkChars)
        {
            results.Add(new ChunkCandidate(currentChunk, chunkStartOffset, chunkEndOffset));
        }
        else if (results.Count == 0 && !string.IsNullOrEmpty(currentChunk))
        {
            results.Add(new ChunkCandidate(currentChunk, chunkStartOffset, chunkEndOffset));
        }

        return results;
    }
}
