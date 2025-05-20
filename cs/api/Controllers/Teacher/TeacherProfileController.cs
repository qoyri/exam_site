using System;
using System.Linq;
using System.Threading.Tasks;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using gest_abs.Models;
using gest_abs.DTO.Teacher;
using gest_abs.Services.Teacher;

namespace gest_abs.Controllers.Teacher
{
    [ApiController]
    [Route("api/teacher/profile")]
    [Authorize(Roles = "professeur,admin")]
    public class TeacherProfileController : ControllerBase
    {
        private readonly GestionAbsencesContext _context;
        private readonly ILogger<TeacherProfileController> _logger;
        private readonly TeacherProfileService _teacherProfileService;

        public TeacherProfileController(
            GestionAbsencesContext context, 
            ILogger<TeacherProfileController> logger,
            TeacherProfileService teacherProfileService)
        {
            _context = context;
            _logger = logger;
            _teacherProfileService = teacherProfileService;
        }

        // GET: api/teacher/profile
        [HttpGet]
        public async Task<IActionResult> GetProfile()
        {
            try
            {
                var email = User.FindFirst(ClaimTypes.Name)?.Value;
                
                if (string.IsNullOrEmpty(email))
                {
                    return Unauthorized(new { Message = "Utilisateur non authentifié." });
                }

                var profileDto = await _teacherProfileService.GetTeacherProfileByEmail(email);
                
                if (profileDto == null)
                {
                    return NotFound(new { Message = "Profil enseignant non trouvé." });
                }

                return Ok(profileDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de la récupération du profil enseignant");
                return StatusCode(500, new { Message = "Une erreur est survenue lors de la récupération du profil." });
            }
        }

        // PUT: api/teacher/profile
        [HttpPut]
        public async Task<IActionResult> UpdateProfile([FromBody] TeacherProfileUpdateDto updateDto)
        {
            try
            {
                var email = User.FindFirst(ClaimTypes.Name)?.Value;
                
                if (string.IsNullOrEmpty(email))
                {
                    return Unauthorized(new { Message = "Utilisateur non authentifié." });
                }

                var result = await _teacherProfileService.UpdateTeacherProfile(email, updateDto);
                
                if (!result.Success)
                {
                    return BadRequest(new { Message = result.Message });
                }

                return Ok(new { Message = "Profil mis à jour avec succès." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de la mise à jour du profil enseignant");
                return StatusCode(500, new { Message = "Une erreur est survenue lors de la mise à jour du profil." });
            }
        }
    }
}
