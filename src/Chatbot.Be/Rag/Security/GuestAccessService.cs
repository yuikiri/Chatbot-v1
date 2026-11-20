using System.Collections.Concurrent;

namespace Chatbot.Rag.Security;

public class GuestAccessService
{
    private readonly ConcurrentDictionary<string, int> _ipQueryCounts = new(StringComparer.OrdinalIgnoreCase);

    public int MaxGuestQueries { get; } = 1;

    public bool CanGuestAsk(string clientIp)
    {
        if (string.IsNullOrWhiteSpace(clientIp)) return true;
        return _ipQueryCounts.TryGetValue(clientIp, out int count) ? count < MaxGuestQueries : true;
    }

    public void RecordGuestQuery(string clientIp)
    {
        if (string.IsNullOrWhiteSpace(clientIp)) return;
        _ipQueryCounts.AddOrUpdate(clientIp, 1, (_, existingCount) => existingCount + 1);
    }

    public int GetGuestQueryCount(string clientIp)
    {
        if (string.IsNullOrWhiteSpace(clientIp)) return 0;
        return _ipQueryCounts.TryGetValue(clientIp, out int count) ? count : 0;
    }

    public void ResetGuestQuery(string clientIp)
    {
        if (!string.IsNullOrWhiteSpace(clientIp))
        {
            _ipQueryCounts.TryRemove(clientIp, out _);
        }
    }
}
