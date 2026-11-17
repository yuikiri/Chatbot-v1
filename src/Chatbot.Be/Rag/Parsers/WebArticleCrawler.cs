using System.Net.Http.Headers;
using System.Text;
using System.Text.RegularExpressions;
using HtmlAgilityPack;

namespace Chatbot.Rag.Parsers;

public record CrawledDocumentResult(
    string Title, 
    string FormattedText, 
    string SuggestedFileName, 
    string SourceUrl
);

public static class WebArticleCrawler
{
    private static readonly HashSet<string> TagsToRemove = new(StringComparer.OrdinalIgnoreCase)
    {
        "script", "style", "noscript", "nav", "header", "footer", 
        "aside", "svg", "iframe", "button", "input", "form", "select", 
        "textarea", "meta", "link"
    };

    public static async Task<CrawledDocumentResult> CrawlArticleAsync(
        string url, 
        HttpClient httpClient, 
        CancellationToken ct = default)
    {
        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri) || 
            (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
        {
            throw new ArgumentException("Đường dẫn URL không hợp lệ. Vui lòng nhập link bắt đầu bằng http:// hoặc https://");
        }

        using var request = new HttpRequestMessage(HttpMethod.Get, uri);
        request.Headers.UserAgent.ParseAdd("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("text/html"));
        request.Headers.AcceptLanguage.Add(new StringWithQualityHeaderValue("vi"));
        request.Headers.AcceptLanguage.Add(new StringWithQualityHeaderValue("en", 0.8));

        HttpResponseMessage response;
        try
        {
            response = await httpClient.SendAsync(request, HttpCompletionOption.ResponseContentRead, ct);
        }
        catch (Exception ex)
        {
            var detail = ex.InnerException != null ? $"{ex.Message} -> {ex.InnerException.Message}" : ex.Message;
            throw new HttpRequestException($"Không thể kết nối tới trang web: {detail}", ex);
        }

        if (!response.IsSuccessStatusCode)
        {
            throw new HttpRequestException($"Trang web phản hồi mã lỗi {(int)response.StatusCode} ({response.ReasonPhrase}).");
        }

        string html = await response.Content.ReadAsStringAsync(ct);
        if (string.IsNullOrWhiteSpace(html))
        {
            throw new InvalidOperationException("Nội dung trang web trả về rỗng.");
        }

        var doc = new HtmlDocument();
        doc.LoadHtml(html);

        // 1. Trích xuất Tiêu đề
        string title = string.Empty;
        var titleNode = doc.DocumentNode.SelectSingleNode("//title") 
                     ?? doc.DocumentNode.SelectSingleNode("//h1");
        if (titleNode != null)
        {
            title = HtmlEntity.DeEntitize(titleNode.InnerText).Trim();
        }
        if (string.IsNullOrWhiteSpace(title))
        {
            title = uri.Host;
        }

        // 2. Loại bỏ các thẻ không phải nội dung (script, style, nav, ads, footer...)
        var nodesToRemove = doc.DocumentNode.Descendants()
            .Where(n => TagsToRemove.Contains(n.Name))
            .ToList();

        foreach (var node in nodesToRemove)
        {
            node.Remove();
        }

        // 3. Ưu tiên tìm các khối bài viết chính (<article>, <main>, hoặc div content)
        var mainContentNode = doc.DocumentNode.SelectSingleNode("//article") 
                           ?? doc.DocumentNode.SelectSingleNode("//main")
                           ?? doc.DocumentNode.SelectSingleNode("//div[contains(@class, 'article') or contains(@class, 'content') or contains(@id, 'content') or contains(@class, 'post')]")
                           ?? doc.DocumentNode.SelectSingleNode("//body")
                           ?? doc.DocumentNode;

        // Trích xuất text từ các thẻ đoạn văn, tiêu đề, danh sách
        var sb = new StringBuilder();
        var contentBlocks = mainContentNode.Descendants()
            .Where(n => n.Name is "p" or "h1" or "h2" or "h3" or "h4" or "li" or "blockquote")
            .Select(n => HtmlEntity.DeEntitize(n.InnerText).Trim())
            .Where(t => !string.IsNullOrEmpty(t) && t.Length > 20);

        foreach (var block in contentBlocks)
        {
            sb.AppendLine(block);
            sb.AppendLine();
        }

        string cleanedText = sb.ToString().Trim();

        // Fallback nếu không bắt được thẻ con: bóc tách text thô từ node chính
        if (cleanedText.Length < 100)
        {
            var rawText = HtmlEntity.DeEntitize(mainContentNode.InnerText);
            cleanedText = Regex.Replace(rawText, @"[\r\n\t]+", "\n");
            cleanedText = Regex.Replace(cleanedText, @" {2,}", " ");
            cleanedText = cleanedText.Trim();
        }

        if (cleanedText.Length < 100)
        {
            throw new InvalidOperationException("Không thể trích xuất nội dung bài viết y khoa từ trang web này (nội dung quá ngắn hoặc trang web chặn bot đọc văn bản).");
        }

        // Tạo tên tệp gợi ý an toàn
        string safeTitle = Regex.Replace(title, @"[^\w\d\-]+", "_").Trim('_');
        if (safeTitle.Length > 40) safeTitle = safeTitle[..40];
        string suggestedFileName = $"web_{safeTitle}_{DateTime.UtcNow:yyyyMMdd_HHmm}.txt";

        // Định dạng văn bản lưu trữ chuẩn có ghi rõ trích dẫn nguồn
        string formattedContent = $@"TIÊU ĐỀ: {title}
NGUỒN TRÍCH DẪN GỐC: {url}
NGÀY THU THẬP: {DateTime.UtcNow:dd/MM/yyyy HH:mm:ss} UTC
NGƯỜI THU THẬP: Admin
============================================================

{cleanedText}";

        return new CrawledDocumentResult(title, formattedContent, suggestedFileName, url);
    }
}
