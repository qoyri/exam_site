using System;
using System.Net.WebSockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace gest_abs.WebSocket
{
    public class WebSocketMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<WebSocketMiddleware> _logger;
        private readonly WebSocketHandler _webSocketHandler;

        public WebSocketMiddleware(
            RequestDelegate next,
            ILogger<WebSocketMiddleware> logger,
            WebSocketHandler webSocketHandler)
        {
            _next = next;
            _logger = logger;
            _webSocketHandler = webSocketHandler;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            if (context.Request.Path == "/ws/messages")
            {
                if (context.WebSockets.IsWebSocketRequest)
                {
                    _logger.LogInformation("WebSocket connection request received");
                    
                    try
                    {
                        var socket = await context.WebSockets.AcceptWebSocketAsync();
                        _logger.LogInformation("WebSocket connection established");
                        
                        // Passer le contrôle au gestionnaire de WebSocket
                        await _webSocketHandler.HandleWebSocketAsync(socket, context.RequestAborted);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error handling WebSocket connection");
                    }
                }
                else
                {
                    _logger.LogWarning("Non-WebSocket request received at WebSocket endpoint");
                    context.Response.StatusCode = 400;
                    await context.Response.WriteAsync("WebSocket connection expected");
                }
            }
            else
            {
                await _next(context);
            }
        }
    }
}
