using System.Text;
using Chatbot.Common;

namespace Chatbot.Data.Text;

public record ChunkCandidate(string Content, int StartOffset, int EndOffset);

public static class OffsetChunker
{
    /// <summary>
    /// Chia văn bản thành các đoạn (chunks) có kích thước xấp xỉ maxChunkChars,
    /// bảo toàn ranh giới câu/đoạn và ghi nhận chính xác StartOffset & EndOffset trong văn bản gốc.
    /// Tối ưu hóa StringBuilder để giảm áp lực cấp phát rác trên Managed Heap.
    /// </summary>
    public static List<ChunkCandidate> ChunkWithOffsets(
        string fullText, 
        int maxChunkChars = RagConstants.DefaultMaxChunkChars, 
        int minChunkChars = RagConstants.DefaultMinChunkChars)
    {
        var results = new List<ChunkCandidate>();
        if (string.IsNullOrWhiteSpace(fullText))
            return results;

        var paragraphs = fullText.Split(new[] { "\r\n\r\n", "\n\n" }, StringSplitOptions.None);
        int currentSearchIndex = 0;

        var sb = new StringBuilder(maxChunkChars + 100);
        int chunkStartOffset = -1;
        int chunkEndOffset = -1;

        void FlushCurrentChunk()
        {
            if (sb.Length >= minChunkChars || (results.Count == 0 && sb.Length > 0))
            {
                results.Add(new ChunkCandidate(sb.ToString(), chunkStartOffset, chunkEndOffset));
            }
            sb.Clear();
            chunkStartOffset = -1;
            chunkEndOffset = -1;
        }

        foreach (var p in paragraphs)
        {
            var trimmed = p.Trim();
            if (string.IsNullOrEmpty(trimmed))
                continue;

            int paraPos = fullText.IndexOf(trimmed, currentSearchIndex, StringComparison.Ordinal);
            if (paraPos < 0)
                paraPos = currentSearchIndex;

            int paraEndPos = paraPos + trimmed.Length;
            currentSearchIndex = paraEndPos;

            // Nếu đoạn văn đơn lẻ vượt quá maxChunkChars, chia nhỏ theo câu để không làm vỡ giới hạn vector
            if (trimmed.Length > maxChunkChars)
            {
                FlushCurrentChunk();
                SplitLongParagraph(fullText, trimmed, paraPos, maxChunkChars, minChunkChars, results);
                continue;
            }

            if (sb.Length == 0)
            {
                sb.Append(trimmed);
                chunkStartOffset = paraPos;
                chunkEndOffset = paraEndPos;
            }
            else if (sb.Length + trimmed.Length + 2 <= maxChunkChars)
            {
                sb.Append("\n\n").Append(trimmed);
                chunkEndOffset = paraEndPos;
            }
            else
            {
                FlushCurrentChunk();
                sb.Append(trimmed);
                chunkStartOffset = paraPos;
                chunkEndOffset = paraEndPos;
            }
        }

        FlushCurrentChunk();
        return results;
    }

    private static void SplitLongParagraph(
        string fullText, 
        string paragraph, 
        int paraStartOffset, 
        int maxChunkChars, 
        int minChunkChars, 
        List<ChunkCandidate> results)
    {
        var sentenceSeparators = new[] { ". ", "? ", "! ", ".\n", "; " };
        var sentences = paragraph.Split(sentenceSeparators, StringSplitOptions.None);

        var sb = new StringBuilder(maxChunkChars + 50);
        int subStart = paraStartOffset;
        int subEnd = paraStartOffset;
        int currentIdx = paraStartOffset;

        foreach (var s in sentences)
        {
            var trimmedSentence = s.Trim();
            if (string.IsNullOrEmpty(trimmedSentence))
                continue;

            int sPos = fullText.IndexOf(trimmedSentence, currentIdx, StringComparison.Ordinal);
            if (sPos < 0) sPos = currentIdx;
            int sEndPos = sPos + trimmedSentence.Length;
            currentIdx = sEndPos;

            if (sb.Length == 0)
            {
                sb.Append(trimmedSentence);
                subStart = sPos;
                subEnd = sEndPos;
            }
            else if (sb.Length + trimmedSentence.Length + 2 <= maxChunkChars)
            {
                sb.Append(". ").Append(trimmedSentence);
                subEnd = sEndPos;
            }
            else
            {
                if (sb.Length >= minChunkChars || results.Count == 0)
                {
                    results.Add(new ChunkCandidate(sb.ToString(), subStart, subEnd));
                }
                sb.Clear();
                sb.Append(trimmedSentence);
                subStart = sPos;
                subEnd = sEndPos;
            }
        }

        if (sb.Length > 0)
        {
            results.Add(new ChunkCandidate(sb.ToString(), subStart, subEnd));
        }
    }
}
