namespace Chatbot.Filters;

public class AdminKeyAuthFilter : IEndpointFilter
{
    private readonly IConfiguration _configuration;

    public AdminKeyAuthFilter(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        var httpContext = context.HttpContext;
        string expectedKey = _configuration["Admin:SecretKey"] 
            ?? Environment.GetEnvironmentVariable("ADMIN_SECRET_KEY") 
            ?? "admin_secret_key_123";

        if (!httpContext.Request.Headers.TryGetValue("X-Admin-Key", out var headerKey) ||
            !string.Equals(headerKey.ToString(), expectedKey, StringComparison.Ordinal))
        {
            return Results.Json(new
            {
                success = false,
                error = new
                {
                    code = "UNAUTHORIZED_ADMIN_KEY",
                    message = "Khóa quản trị (Admin Secret Key) không chính xác hoặc chưa được cung cấp.",
                    statusCode = 401
                }
            }, statusCode: 401);
        }

        return await next(context);
    }
}
