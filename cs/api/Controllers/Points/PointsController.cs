using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using gest_abs.DTO.Points;
using gest_abs.Services.Points;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace gest_abs.Controllers.Points;

[ApiController]
[Route("api/[controller]")]
public class PointsController : ControllerBase
{
    private readonly PointsService _pointsService;
    private readonly ILogger<PointsController> _logger;
    
    public PointsController(PointsService pointsService, ILogger<PointsController> logger)
    {
        _pointsService = pointsService;
        _logger = logger;
    }
    
    [HttpGet("student/ranking")]
    [Authorize(Roles = "professeur,admin")]
    public async Task<ActionResult<List<StudentPointsDto>>> GetStudentRanking()
    {
        try
        {
            var ranking = await _pointsService.GetStudentRankingAsync();
            return Ok(ranking);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la récupération du classement des élèves");
            return StatusCode(500, "Une erreur est survenue lors de la récupération du classement");
        }
    }
    
    [HttpGet("class/{classId}/ranking")]
    [Authorize(Roles = "professeur,admin")]
    public async Task<ActionResult<List<StudentPointsDto>>> GetClassRanking(int classId)
    {
        try
        {
            var ranking = await _pointsService.GetClassRankingAsync(classId);
            return Ok(ranking);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la récupération du classement de la classe {ClassId}", classId);
            return StatusCode(500, "Une erreur est survenue lors de la récupération du classement de la classe");
        }
    }
    
    [HttpGet("student/{studentId}")]
    [Authorize]
    public async Task<ActionResult<StudentPointsDto>> GetStudentPoints(int studentId)
    {
        try
        {
            var points = await _pointsService.GetStudentPointsAsync(studentId);
            if (points == null)
                return NotFound($"Aucun élève trouvé avec l'ID {studentId}");
            
            return Ok(points);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la récupération des points de l'élève {StudentId}", studentId);
            return StatusCode(500, "Une erreur est survenue lors de la récupération des points");
        }
    }
    
    [HttpGet("history/{studentId}")]
    [Authorize]
    public async Task<ActionResult<List<PointsHistoryDto>>> GetPointsHistory(int studentId)
    {
        try
        {
            var history = await _pointsService.GetPointsHistoryAsync(studentId);
            return Ok(history);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la récupération de l'historique des points de l'élève {StudentId}", studentId);
            return StatusCode(500, "Une erreur est survenue lors de la récupération de l'historique des points");
        }
    }
    
    [HttpGet("config")]
    [Authorize(Roles = "professeur,admin")]
    public async Task<ActionResult<List<PointsConfigDto>>> GetPointsConfig()
    {
        try
        {
            var config = await _pointsService.GetPointsConfigAsync();
            return Ok(config);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la récupération de la configuration des points");
            return StatusCode(500, "Une erreur est survenue lors de la récupération de la configuration");
        }
    }
    
    [HttpPut("config/{id}")]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult> UpdatePointsConfig(int id, PointsConfigDto configDto)
    {
        try
        {
            var result = await _pointsService.UpdatePointsConfigAsync(id, configDto);
            if (!result)
                return NotFound($"Configuration non trouvée avec l'ID {id}");
            
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la mise à jour de la configuration des points {ConfigId}", id);
            return StatusCode(500, "Une erreur est survenue lors de la mise à jour de la configuration");
        }
    }
    
    // Endpoint pour ajouter des points à un étudiant
    [HttpPost("student/{studentId}/add")]
    [Authorize(Roles = "professeur,admin")]
    public async Task<ActionResult> AddPointsToStudent(int studentId, [FromBody] AddPointsDto pointsDto)
    {
        try
        {
            var result = await _pointsService.AddPointsToStudentAsync(studentId, pointsDto.Points, pointsDto.Reason, pointsDto.AbsenceId);
            if (!result)
                return NotFound($"Élève non trouvé avec l'ID {studentId}");
            
            return Ok(new { success = true, message = $"{Math.Abs(pointsDto.Points)} points {(pointsDto.Points >= 0 ? "ajoutés" : "retirés")} avec succès" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de l'ajout de points à l'élève {StudentId}", studentId);
            return StatusCode(500, "Une erreur est survenue lors de l'ajout de points");
        }
    }
}
