using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using api.DTO.Teacher;
using api.Services.Teacher;
using api.Utils;

namespace api.Controllers.Teacher
{
    [Authorize(Roles = "Teacher")]
    [ApiController]
    [Route("api/teacher/absences")]
    public class TeacherAbsenceController : ControllerBase
    {
        private readonly TeacherAbsenceService _absenceService;
        private readonly ILogger<TeacherAbsenceController> _logger;

        public TeacherAbsenceController(
            TeacherAbsenceService absenceService,
            ILogger<TeacherAbsenceController> logger)
        {
            _absenceService = absenceService;
            _logger = logger;
        }

        // GET: api/teacher/absences
        [HttpGet]
        public async Task<IActionResult> GetAbsences()
        {
            try
            {
                _logger.LogInformation("Récupération de toutes les absences");
                var absences = await _absenceService.GetAllAbsences();
                return Ok(absences);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de la récupération des absences");
                return StatusCode(500, new { Message = "Une erreur est survenue lors de la récupération des absences." });
            }
        }

        // GET: api/teacher/absences/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetAbsenceById(int id)
        {
            try
            {
                _logger.LogInformation("Récupération de l'absence avec l'ID: {Id}", id);
                var absence = await _absenceService.GetAbsenceById(id);
                
                if (absence == null)
                {
                    return NotFound(new { Message = $"Absence avec l'ID {id} non trouvée." });
                }
                
                return Ok(absence);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de la récupération de l'absence avec l'ID: {Id}", id);
                return StatusCode(500, new { Message = $"Une erreur est survenue lors de la récupération de l'absence avec l'ID {id}." });
            }
        }

        // POST: api/teacher/absences
        [HttpPost]
        public async Task<IActionResult> CreateAbsence([FromBody] AbsenceCreateDto createDto)
        {
            try
            {
                _logger.LogInformation("Création d'une nouvelle absence pour l'étudiant: {StudentId}", createDto.StudentId);
                var absence = await _absenceService.CreateAbsence(createDto);
                return CreatedAtAction(nameof(GetAbsenceById), new { id = absence.Id }, absence);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de la création d'une absence");
                return StatusCode(500, new { Message = "Une erreur est survenue lors de la création de l'absence." });
            }
        }

        // PUT: api/teacher/absences/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAbsence(int id, [FromBody] AbsenceUpdateDto updateDto)
        {
            try
            {
                _logger.LogInformation("Mise à jour de l'absence avec l'ID: {Id}", id);
                var updated = await _absenceService.UpdateAbsence(id, updateDto);
                
                if (!updated)
                {
                    return NotFound(new { Message = $"Absence avec l'ID {id} non trouvée." });
                }
                
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de la mise à jour de l'absence avec l'ID: {Id}", id);
                return StatusCode(500, new { Message = $"Une erreur est survenue lors de la mise à jour de l'absence avec l'ID {id}." });
            }
        }

        // DELETE: api/teacher/absences/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAbsence(int id)
        {
            try
            {
                _logger.LogInformation("Suppression de l'absence avec l'ID: {Id}", id);
                var deleted = await _absenceService.DeleteAbsence(id);
                
                if (!deleted)
                {
                    return NotFound(new { Message = $"Absence avec l'ID {id} non trouvée." });
                }
                
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de la suppression de l'absence avec l'ID: {Id}", id);
                return StatusCode(500, new { Message = $"Une erreur est survenue lors de la suppression de l'absence avec l'ID {id}." });
            }
        }
    }
}
