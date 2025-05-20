using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace gest_abs.Middleware
{
    public class RequestResponseLoggingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<RequestResponseLoggingMiddleware> _logger;

        public RequestResponseLoggingMiddleware(RequestDelegate next, ILogger<RequestResponseLoggingMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                // Journaliser la requête
                LogRequest(context);

                // Mesurer le temps de réponse
                var startTime = DateTime.UtcNow;
                
                // Continuer le pipeline
                await _next(context);
                
                // Calculer le temps de réponse
                var elapsedTime = DateTime.UtcNow - startTime;
                
                // Journaliser la réponse
                LogResponse(context, elapsedTime);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Une erreur s'est produite lors du traitement de la requête");
                throw; // Relancer l'exception pour que le middleware d'erreur puisse la gérer
            }
        }

        private void LogRequest(HttpContext context)
        {
            var request = context.Request;
            
            _logger.LogInformation(
                "Requête HTTP {Method} {Scheme}://{Host}{Path}{QueryString}",
                request.Method,
                request.Scheme,
                request.Host,
                request.Path,
                request.QueryString);
            
            // Journaliser les en-têtes de la requête (sauf Authorization)
            foreach (var header in request.Headers)
            {
                if (!header.Key.Equals("Authorization", StringComparison.OrdinalIgnoreCase))
                {
                    _logger.LogDebug("En-tête de requête: {Key}: {Value}", header.Key, header.Value);
                }
                else
                {
                    _logger.LogDebug("En-tête de requête: {Key}: [REDACTED]", header.Key);
                }
            }
        }

        private void LogResponse(HttpContext context, TimeSpan elapsedTime)
        {
            var response = context.Response;
            
            _logger.LogInformation(
                "Réponse HTTP {StatusCode} pour {Method} {Path} - Temps: {ElapsedTime}ms",
                response.StatusCode,
                context.Request.Method,
                context.Request.Path,
                elapsedTime.TotalMilliseconds);
        }
    }
}
