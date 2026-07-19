using Microsoft.Extensions.DependencyInjection;
using SpotifyDiscordFixer.Infrastructure.Services;

namespace SpotifyDiscordFixer.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddSpotifyDiscordFixerInfrastructure(this IServiceCollection services)
    {
        services.AddSingleton<GeoHideProbeService>();
        services.AddSingleton<HostsService>();
        services.AddSingleton<UpdateService>();
        return services;
    }
}
