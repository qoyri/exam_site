using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using api.DTO.Teacher;
using gest_abs.Models;

namespace api.Services.Teacher
{
    public class TeacherAbsenceService
    {
        private readonly GestionAbsencesContext _context;
        private readonly ILogger<TeacherAbsenceService> _logger;

        public TeacherAbsenceService(
            GestionAbsencesContext context,
            ILogger<TeacherAbsenceService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<List<AbsenceDto>> GetAllAbsences()
        {
            _logger.LogInformation("Récupération de toutes les absences");
            
            try
            {
                var absences = await _context.Absences
                    .Include(a => a.Student)
                        .ThenInclude(s => s.Class)
                    .Select(a => new AbsenceDto
                    {
                        Id = a.Id,
                        StudentId = a.StudentId,
                        StudentName = a.Student.FirstName + " " + a.Student.LastName,
                        ClassId = a.Student.ClassId,
                        ClassName = a.Student.Class.Name,
                        AbsenceDate = a.AbsenceDate,
                        Status = a.Status,
                        Reason = a.Reason,
                        Document = a.Document
                    })
                    .ToListAsync();
                
                return absences;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de la récupération de toutes les absences");
                throw;
            }
        }

        public async Task<List<AbsenceDto>> GetAbsences(AbsenceFilterDto filter)
        {
            _logger.LogInformation("Récupération des absences avec filtres");
            
            try
            {
                var query = _context.Absences
                    .Include(a => a.Student)
                        .ThenInclude(s => s.Class)
                    .AsQueryable();
                
                if (filter.ClassId.HasValue)
                {
                    query = query.Where(a => a.Student.ClassId == filter.ClassId.Value);
                }
                
                if (filter.StudentId.HasValue)
                {
                    query = query.Where(a => a.StudentId == filter.StudentId.Value);
                }
                
                if (filter.StartDate.HasValue)
                {
                    query = query.Where(a => a.AbsenceDate >= filter.StartDate.Value);
                }
                
                if (filter.EndDate.HasValue)
                {
                    query = query.Where(a => a.AbsenceDate <= filter.EndDate.Value);
                }
                
                if (!string.IsNullOrEmpty(filter.Status))
                {
                    query = query.Where(a => a.Status == filter.Status);
                }
                
                var absences = await query
                    .Select(a => new AbsenceDto
                    {
                        Id = a.Id,
                        StudentId = a.StudentId,
                        StudentName = a.Student.FirstName + " " + a.Student.LastName,
                        ClassId = a.Student.ClassId,
                        ClassName = a.Student.Class.Name,
                        AbsenceDate = a.AbsenceDate,
                        Status = a.Status,
                        Reason = a.Reason,
                        Document = a.Document
                    })
                    .ToListAsync();
                
                return absences;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de la récupération des absences avec filtres");
                throw;
            }
        }

        public async Task<AbsenceDto> GetAbsenceById(int id)
        {
            _logger.LogInformation("Récupération de l'absence avec l'ID: {Id}", id);
            
            try
            {
                var absence = await _context.Absences
                    .Include(a => a.Student)
                        .ThenInclude(s => s.Class)
                    .Where(a => a.Id == id)
                    .Select(a => new AbsenceDto
                    {
                        Id = a.Id,
                        StudentId = a.StudentId,
                        StudentName = a.Student.FirstName + " " + a.Student.LastName,
                        ClassId = a.Student.ClassId,
                        ClassName = a.Student.Class.Name,
                        AbsenceDate = a.AbsenceDate,
                        Status = a.Status,
                        Reason = a.Reason,
                        Document = a.Document
                    })
                    .FirstOrDefaultAsync();
                
                if (absence == null)
                {
                    _logger.LogWarning("Absence avec l'ID {Id} non trouvée", id);
                }
                
                return absence;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de la récupération de l'absence {Id}", id);
                throw;
            }
        }

        public async Task<AbsenceDto> CreateAbsence(AbsenceCreateDto createDto)
        {
            _logger.LogInformation("Création d'une nouvelle absence pour l'étudiant: {StudentId}", createDto.StudentId);
            
            try
            {
                var absence = new Absence
                {
                    StudentId = createDto.StudentId,
                    AbsenceDate = createDto.AbsenceDate,
                    Status = createDto.Status ?? "non justifiée",
                    Reason = createDto.Reason,
                    Document = createDto.Document,
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                };
                
                _context.Absences.Add(absence);
                await _context.SaveChangesAsync();
                
                // Récupérer l'absence créée avec les informations complètes
                return await GetAbsenceById(absence.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de la création d'une absence");
                throw;
            }
        }

        public async Task<bool> UpdateAbsence(int id, AbsenceUpdateDto updateDto)
        {
            _logger.LogInformation("Mise à jour de l'absence avec l'ID: {Id}", id);
            
            try
            {
                var absence = await _context.Absences.FindAsync(id);
                
                if (absence == null)
                {
                    _logger.LogWarning("Absence avec l'ID {Id} non trouvée lors de la mise à jour", id);
                    return false;
                }
                
                absence.AbsenceDate = updateDto.AbsenceDate;
                absence.Status = updateDto.Status ?? absence.Status;
                absence.Reason = updateDto.Reason;
                absence.Document = updateDto.Document;
                absence.UpdatedAt = DateTime.Now;
                
                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de la mise à jour de l'absence {Id}", id);
                throw;
            }
        }

        public async Task<bool> DeleteAbsence(int id)
        {
            _logger.LogInformation("Suppression de l'absence avec l'ID: {Id}", id);
            
            try
            {
                var absence = await _context.Absences.FindAsync(id);
                
                if (absence == null)
                {
                    _logger.LogWarning("Absence avec l'ID {Id} non trouvée lors de la suppression", id);
                    return false;
                }
                
                _context.Absences.Remove(absence);
                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de la suppression de l'absence {Id}", id);
                throw;
            }
        }
    }
}
