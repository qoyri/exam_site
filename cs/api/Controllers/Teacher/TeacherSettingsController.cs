using System;
using System.Linq;
using System.Threading.Tasks;
using gest_abs.DTO.Teacher;
using gest_abs.Models;
using gest_abs.Services.Teacher;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace gest_abs.Controllers.Teacher
{
    [ApiController]
    [Route("api/teacher/settings")]
    [Authorize(Roles = "professeur")]
    public class TeacherSettingsController : ControllerBase
    {
        private readonly TeacherSettingsService _settingsService;
        private readonly GestionAbsencesContext _context;
        private readonly ILogger<TeacherSettingsController> _logger;

        public TeacherSettingsController(
            TeacherSettingsService settingsService, 
            GestionAbsencesContext context,
            ILogger<TeacherSettingsController> logger)
        {
            _settingsService = settingsService;
            _context = context;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetSettings()
        {
            try
            {
                // Récupérer l'email de l'utilisateur connecté
                var userEmail = User.Identity.Name;
                _logger.LogInformation($"Récupération de l'utilisateur avec l'email: {userEmail}");
                
                // Rechercher l'utilisateur par son email
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email == userEmail);
                
                if (user == null)
                {
                    _logger.LogWarning($"Utilisateur non trouvé avec l'email: {userEmail}");
                    return NotFound($"Utilisateur non trouvé avec l'email: {userEmail}");
                }
                
                _logger.LogInformation($"Récupération des paramètres pour l'utilisateur ID: {user.Id}");
                
                var settings = await _settingsService.GetSettingsAsync(user.Id);
                return Ok(settings);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de la récupération des paramètres");
                return StatusCode(500, "Une erreur est survenue lors de la récupération des paramètres");
            }
        }

        [HttpPut]
        public async Task<IActionResult> UpdateSettings([FromBody] UpdateSettingsDto updateDto)
        {
            try
            {
                // Récupérer l'email de l'utilisateur connecté
                var userEmail = User.Identity.Name;
                _logger.LogInformation($"Récupération de l'utilisateur avec l'email: {userEmail}");
                
                // Rechercher l'utilisateur par son email
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email == userEmail);
                
                if (user == null)
                {
                    _logger.LogWarning($"Utilisateur non trouvé avec l'email: {userEmail}");
                    return NotFound($"Utilisateur non trouvé avec l'email: {userEmail}");
                }
                
                _logger.LogInformation($"Mise à jour des paramètres pour l'utilisateur ID: {user.Id}");
                
                var updatedSettings = await _settingsService.UpdateSettingsAsync(user.Id, updateDto);
                return Ok(updatedSettings);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de la mise à jour des paramètres");
                return StatusCode(500, "Une erreur est survenue lors de la mise à jour des paramètres");
            }
        }
    }
}
