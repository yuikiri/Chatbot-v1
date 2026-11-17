using UglyToad.PdfPig;

namespace Chatbot.Rag.Parsers;

public static class DocumentTextParser
{
    public static async Task<string> ExtractTextAsync(string filePath, CancellationToken ct = default)
    {
        if (!File.Exists(filePath))
            return string.Empty;

        var ext = Path.GetExtension(filePath).ToLowerInvariant();

        if (ext == ".txt" || ext == ".md" || ext == ".json")
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

        // Fallback đọc dạng text
        return await File.ReadAllTextAsync(filePath, ct);
    }
}
