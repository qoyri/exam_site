using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System;

namespace gest_abs.Controllers
{
    [ApiController]
    [Route("api/diagnostic")]
    public class DiagnosticController : ControllerBase
    {
        private readonly ILogger<DiagnosticController> _logger;

        public DiagnosticController(ILogger<DiagnosticController> logger)
        {
            _logger = logger;
        }

        // GET: api/diagnostic/ping
        [HttpGet("ping")]
        [AllowAnonymous]
        public IActionResult Ping()
        {
            return Ok(new { 
                message = "API fonctionnelle", 
                timestamp = DateTime.UtcNow 
            });
        }

        // GET: api/diagnostic/info
        [HttpGet("info")]
        [AllowAnonymous]
        public IActionResult GetInfo()
        {
            var info = new
            {
                ApiVersion = "1.0.0",
                Environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production",
                ServerTime = DateTime.UtcNow,
                ServerTimeZone = TimeZoneInfo.Local.DisplayName,
                DotNetVersion = Environment.Version.ToString(),
                OperatingSystem = Environment.OSVersion.ToString()
            };

            return Ok(info);
        }
    }
}
