using UglyToad.PdfPig;

namespace Chatbot.Rag.Parsers;

public static class DocumentTextParser
{
    private static readonly HashSet<string> SupportedTextExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".txt", ".md", ".markdown", ".json", ".csv", ".html", ".htm"
    };

    public static async Task<string> ExtractTextAsync(string filePath, CancellationToken ct = default)
    {
        if (!File.Exists(filePath))
            return string.Empty;

        var ext = Path.GetExtension(filePath).ToLowerInvariant();

        if (SupportedTextExtensions.Contains(ext))
        {
            return await File.ReadAllTextAsync(filePath, ct);
        }

        if (ext == ".pdf")
        {
            return await Task.Run(() =>
            {
                using var document = PdfDocument.Open(filePath);
                var pages = new List<string>();
                foreach (var page in document.GetPages())
                {
                    ct.ThrowIfCancellationRequested();
                    var pageText = page.Text;
                    if (!string.IsNullOrWhiteSpace(pageText))
                    {
                        pages.Add(pageText);
                    }
                }
                return string.Join("\n\n", pages);
            }, ct);
        }

        throw new NotSupportedException($"Định dạng tệp '{ext}' không được hỗ trợ. Hệ thống chỉ hỗ trợ các tài liệu y khoa dạng văn bản (.txt, .md, .pdf, .json, .csv, .html).");
    }
}
