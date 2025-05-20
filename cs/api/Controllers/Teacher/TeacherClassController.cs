using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;
using api.DTO.Teacher;
using api.Services.Teacher;

namespace api.Controllers.Teacher
{
    [Authorize(Roles = "professeur,admin")]
    [ApiController]
    [Route("api/teacher/classes")]
    public class TeacherClassController : ControllerBase
    {
        private readonly TeacherClassService _classService;
        private readonly ILogger<TeacherClassController> _logger;

        public TeacherClassController(
            TeacherClassService classService,
            ILogger<TeacherClassController> logger)
        {
            _classService = classService;
            _logger = logger;
        }

        // GET: api/teacher/classes
        [HttpGet]
        public async Task<IActionResult> GetClasses()
        {
            try
            {
                _logger.LogInformation("Récupération de toutes les classes pour l'enseignant");

                var classes = await _classService.GetAllClasses();
                return Ok(classes);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de la récupération des classes");
                return StatusCode(500, new { Message = "Une erreur est survenue lors de la récupération des classes." });
            }
        }

        // GET: api/teacher/classes/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetClassById(int id)
        {
            try
            {
                _logger.LogInformation("Récupération de la classe {ClassId}", id);

                var classDetail = await _classService.GetClassById(id);
                if (classDetail == null)
                {
                    return NotFound(new { Message = $"La classe avec l'ID {id} n'a pas été trouvée." });
                }

                return Ok(classDetail);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de la récupération de la classe {ClassId}", id);
                return StatusCode(500, new { Message = "Une erreur est survenue lors de la récupération de la classe." });
            }
        }
    }
}
