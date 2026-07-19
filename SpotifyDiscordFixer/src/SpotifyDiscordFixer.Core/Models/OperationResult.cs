namespace SpotifyDiscordFixer.Core.Models;

public sealed class OperationResult
{
    public bool Success { get; init; }
    public string Message { get; init; } = "";
    public string? Detail { get; init; }

    public static OperationResult Ok(string message = "", string? detail = null) =>
        new() { Success = true, Message = message, Detail = detail };

    public static OperationResult Fail(string message, string? detail = null) =>
        new() { Success = false, Message = message, Detail = detail };
}
