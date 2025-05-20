using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using gest_abs.DTO.Points;
using gest_abs.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace gest_abs.Services.Points
{
    public class PointsService
    {
        private readonly GestionAbsencesContext _context;
        private readonly ILogger<PointsService> _logger;

        public PointsService(GestionAbsencesContext context, ILogger<PointsService> logger)
        {
            _context = context;
            _logger = logger;
        }

        // Récupérer le classement global des étudiants
        public async Task<List<StudentPointsDto>> GetStudentRankingAsync()
        {
            try
            {
                // Utiliser une requête SQL directe pour obtenir le classement depuis la vue student_ranking
                var ranking = await _context.Database.SqlQueryRaw<StudentPointsDto>(
                    "SELECT student_id AS StudentId, first_name AS FirstName, last_name AS LastName, " +
                    "class_name AS ClassName, points AS Points, rank_overall AS RankOverall, " +
                    "rank_in_class AS RankInClass, total_absences AS TotalAbsences, " +
                    "unjustified_absences AS UnjustifiedAbsences " +
                    "FROM student_ranking ORDER BY rank_overall"
                ).ToListAsync();

                return ranking;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de la récupération du classement des étudiants");
                throw;
            }
        }

        // Récupérer le classement des étudiants d'une classe
        public async Task<List<StudentPointsDto>> GetClassRankingAsync(int classId)
        {
            try
            {
                // Utiliser une requête SQL directe pour obtenir le classement d'une classe depuis la vue student_ranking
                var ranking = await _context.Database.SqlQueryRaw<StudentPointsDto>(
                    "SELECT student_id AS StudentId, first_name AS FirstName, last_name AS LastName, " +
                    "class_name AS ClassName, points AS Points, rank_overall AS RankOverall, " +
                    "rank_in_class AS RankInClass, total_absences AS TotalAbsences, " +
                    "unjustified_absences AS UnjustifiedAbsences " +
                    "FROM student_ranking " +
                    "WHERE student_id IN (SELECT id FROM students WHERE class_id = {0}) " +
                    "ORDER BY rank_in_class",
                    classId
                ).ToListAsync();

                return ranking;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de la récupération du classement de la classe {ClassId}", classId);
                throw;
            }
        }

        // Récupérer les points d'un étudiant
        public async Task<StudentPointsDto> GetStudentPointsAsync(int studentId)
        {
            try
            {
                // Vérifier si l'étudiant existe
                var student = await _context.Students
                    .Include(s => s.Class)
                    .FirstOrDefaultAsync(s => s.Id == studentId);

                if (student == null)
                {
                    return null;
                }

                // Récupérer les points de l'étudiant
                var studentPoints = await _context.StudentPoints
                    .FirstOrDefaultAsync(sp => sp.StudentId == studentId);

                // Si l'étudiant n'a pas encore de points, créer une entrée avec 100 points par défaut
                if (studentPoints == null)
                {
                    studentPoints = new StudentPoints
                    {
                        StudentId = studentId,
                        Points = 100,
                        LastUpdated = DateTime.Now
                    };

                    _context.StudentPoints.Add(studentPoints);
                    await _context.SaveChangesAsync();
                }

                // Récupérer le classement de l'étudiant
                var ranking = await _context.Database.SqlQueryRaw<StudentPointsDto>(
                    "SELECT student_id AS StudentId, first_name AS FirstName, last_name AS LastName, " +
                    "class_name AS ClassName, points AS Points, rank_overall AS RankOverall, " +
                    "rank_in_class AS RankInClass, total_absences AS TotalAbsences, " +
                    "unjustified_absences AS UnjustifiedAbsences " +
                    "FROM student_ranking " +
                    "WHERE student_id = {0}",
                    studentId
                ).FirstOrDefaultAsync();

                if (ranking == null)
                {
                    // Si l'étudiant n'est pas dans le classement, créer un DTO manuellement
                    ranking = new StudentPointsDto
                    {
                        StudentId = studentId,
                        FirstName = student.FirstName,
                        LastName = student.LastName,
                        ClassName = student.Class?.Name,
                        Points = studentPoints.Points,
                        RankOverall = 0,
                        RankInClass = 0,
                        TotalAbsences = await _context.Absences.CountAsync(a => a.StudentId == studentId),
                        UnjustifiedAbsences = await _context.Absences.CountAsync(a => a.StudentId == studentId && a.Status == "non justifiée")
                    };
                }

                return ranking;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de la récupération des points de l'étudiant {StudentId}", studentId);
                throw;
            }
        }

        // Récupérer l'historique des points d'un étudiant
        public async Task<List<PointsHistoryDto>> GetPointsHistoryAsync(int studentId)
        {
            try
            {
                var history = await _context.PointsHistory
                    .Where(ph => ph.StudentId == studentId)
                    .OrderByDescending(ph => ph.CreatedAt)
                    .Select(ph => new PointsHistoryDto
                    {
                        Id = ph.Id,
                        StudentId = ph.StudentId,
                        PointsChange = ph.PointsChange,
                        Reason = ph.Reason,
                        AbsenceId = ph.AbsenceId,
                        CreatedAt = ph.CreatedAt
                    })
                    .ToListAsync();

                return history;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de la récupération de l'historique des points de l'étudiant {StudentId}", studentId);
                throw;
            }
        }

        // Récupérer la configuration des points
        public async Task<List<PointsConfigDto>> GetPointsConfigAsync()
        {
            try
            {
                var config = await _context.PointsConfig
                    .Where(pc => pc.Active)
                    .Select(pc => new PointsConfigDto
                    {
                        Id = pc.Id,
                        AbsenceType = pc.AbsenceType,
                        PointsValue = pc.PointsValue,
                        Description = pc.Description,
                        Active = pc.Active
                    })
                    .ToListAsync();

                return config;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de la récupération de la configuration des points");
                throw;
            }
        }

        // Mettre à jour la configuration des points
        public async Task<bool> UpdatePointsConfigAsync(int id, PointsConfigDto configDto)
        {
            try
            {
                var config = await _context.PointsConfig.FindAsync(id);
                if (config == null)
                {
                    return false;
                }

                config.PointsValue = configDto.PointsValue;
                config.Description = configDto.Description;
                config.Active = configDto.Active;

                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de la mise à jour de la configuration des points {ConfigId}", id);
                throw;
            }
        }

        // Ajouter des points à un étudiant
        public async Task<bool> AddPointsToStudentAsync(int studentId, int points, string reason, int? absenceId = null)
        {
            try
            {
                // Vérifier si l'étudiant existe
                var student = await _context.Students.FindAsync(studentId);
                if (student == null)
                {
                    return false;
                }

                // Récupérer les points actuels de l'étudiant
                var studentPoints = await _context.StudentPoints.FirstOrDefaultAsync(sp => sp.StudentId == studentId);
                
                // Si l'étudiant n'a pas encore de points, créer une entrée avec 100 points par défaut
                if (studentPoints == null)
                {
                    studentPoints = new StudentPoints
                    {
                        StudentId = studentId,
                        Points = 100,
                        LastUpdated = DateTime.Now
                    };
                    _context.StudentPoints.Add(studentPoints);
                }

                // Mettre à jour les points
                studentPoints.Points += points;
                studentPoints.LastUpdated = DateTime.Now;

                // Ajouter l'historique
                var history = new PointsHistory
                {
                    StudentId = studentId,
                    PointsChange = points,
                    Reason = reason,
                    AbsenceId = absenceId,
                    CreatedAt = DateTime.Now
                };
                _context.PointsHistory.Add(history);

                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de l'ajout de points à l'étudiant {StudentId}", studentId);
                throw;
            }
        }
    }
}
