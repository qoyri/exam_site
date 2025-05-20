using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Logging;
using api.Services.Teacher;

namespace api.Controllers.Teacher
{
    [ApiController]
    [Route("api/teacher/stats")]
    [Authorize]
    public class TeacherStatController : ControllerBase
    {
        private readonly TeacherStatService _statService;
        private readonly ILogger<TeacherStatController> _logger;

        public TeacherStatController(
            TeacherStatService statService,
            ILogger<TeacherStatController> logger)
        {
            _statService = statService;
            _logger = logger;
        }

        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboardStats()
        {
            try
            {
                var stats = await _statService.GetDashboardStats();
                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de la récupération des statistiques du tableau de bord");
                return StatusCode(500, "Une erreur est survenue");
            }
        }

        [HttpGet("absences")]
        public async Task<IActionResult> GetAbsenceStats()
        {
            try
            {
                var stats = await _statService.GetAbsenceStats();
                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de la récupération des statistiques d'absences");
                return StatusCode(500, "Une erreur est survenue");
            }
        }

        [HttpGet("class/{id}")]
        public async Task<IActionResult> GetClassStats(int id)
        {
            try
            {
                var stats = await _statService.GetClassStats(id);
                if (stats == null)
                {
                    return NotFound();
                }
                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de la récupération des statistiques de la classe {ClassId}", id);
                return StatusCode(500, "Une erreur est survenue");
            }
        }

        [HttpGet("student/{id}")]
        public async Task<IActionResult> GetStudentStats(int id)
        {
            try
            {
                var stats = await _statService.GetStudentStats(id);
                if (stats == null)
                {
                    return NotFound();
                }
                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de la récupération des statistiques de l'étudiant {StudentId}", id);
                return StatusCode(500, "Une erreur est survenue");
            }
        }

        [HttpGet("rooms")]
        public async Task<IActionResult> GetRoomStats()
        {
            try
            {
                var stats = await _statService.GetRoomStats();
                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de la récupération des statistiques des salles");
                return StatusCode(500, "Une erreur est survenue");
            }
        }
    }
}
