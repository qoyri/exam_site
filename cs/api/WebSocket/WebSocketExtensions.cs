using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using System;

namespace gest_abs.WebSocket
{
    public static class WebSocketExtensions
    {
        public static IServiceCollection AddWebSocketServer(this IServiceCollection services)
        {
            services.AddSingleton<WebSocketHandler>();
            return services;
        }

        public static IApplicationBuilder UseWebSocketServer(this IApplicationBuilder app)
        {
            app.UseWebSockets(new WebSocketOptions
            {
                KeepAliveInterval = TimeSpan.FromMinutes(2)
            });

            app.UseMiddleware<WebSocketMiddleware>();

            return app;
        }
    }
}
