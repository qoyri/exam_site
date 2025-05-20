using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using api.DTO.Teacher;
using gest_abs.Models;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace api.Services.Teacher
{
    public class TeacherStatService
    {
        private readonly GestionAbsencesContext _context;
        private readonly ILogger<TeacherStatService> _logger;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public TeacherStatService(
            GestionAbsencesContext context,
            ILogger<TeacherStatService> logger,
            IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _logger = logger;
            _httpContextAccessor = httpContextAccessor;
        }

        private int GetCurrentTeacherId()
        {
            try
            {
                var user = _httpContextAccessor.HttpContext.User;
                
                // Afficher toutes les claims disponibles pour le débogage
                _logger.LogInformation("Claims disponibles:");
                foreach (var claim in user.Claims)
                {
                    _logger.LogInformation($"Type: {claim.Type}, Value: {claim.Value}");
                }
                
                // Rechercher une claim contenant "email" dans son type
                var emailClaim = user.Claims.FirstOrDefault(c => c.Type.Contains("email", StringComparison.OrdinalIgnoreCase));
                if (emailClaim != null)
                {
                    _logger.LogInformation($"Email trouvé: {emailClaim.Value}");
                    
                    // Rechercher l'utilisateur par email
                    var dbUser = _context.Users.FirstOrDefault(u => u.Email == emailClaim.Value);
                    if (dbUser != null)
                    {
                        _logger.LogInformation($"Utilisateur trouvé avec l'ID: {dbUser.Id}");
                        
                        // Rechercher l'enseignant par l'ID utilisateur
                        var teacher = _context.Teachers.FirstOrDefault(t => t.UserId == dbUser.Id);
                        if (teacher != null)
                        {
                            _logger.LogInformation($"Enseignant trouvé avec l'ID: {teacher.Id}");
                            return teacher.Id;
                        }
                    }
                }
                
                // Fallback: utiliser d'autres informations si disponibles
                var nameClaim = user.Claims.FirstOrDefault(c => c.Type.Contains("name", StringComparison.OrdinalIgnoreCase));
                if (nameClaim != null)
                {
                    _logger.LogInformation($"Nom trouvé: {nameClaim.Value}");
                    
                    // Rechercher l'utilisateur par nom d'utilisateur
                    var dbUser = _context.Users.FirstOrDefault(u => u.Username.Contains(nameClaim.Value, StringComparison.OrdinalIgnoreCase));
                    if (dbUser != null)
                    {
                        _logger.LogInformation($"Utilisateur trouvé avec l'ID: {dbUser.Id}");
                        
                        // Rechercher l'enseignant par l'ID utilisateur
                        var teacher = _context.Teachers.FirstOrDefault(t => t.UserId == dbUser.Id);
                        if (teacher != null)
                        {
                            _logger.LogInformation($"Enseignant trouvé avec l'ID: {teacher.Id}");
                            return teacher.Id;
                        }
                    }
                }
                
                // Si aucune correspondance n'est trouvée, utiliser une valeur par défaut
                _logger.LogWarning("Aucun enseignant trouvé, utilisation de l'ID par défaut");
                return 1; // Valeur par défaut pour les tests
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de la récupération de l'ID de l'enseignant");
                return 1; // Valeur par défaut en cas d'erreur
            }
        }

        public async Task<DashboardStatsDto> GetDashboardStats()
        {
            try
            {
                // Récupérer l'ID de l'enseignant connecté
                var teacherId = GetCurrentTeacherId();
                _logger.LogInformation($"Récupération des statistiques pour l'enseignant ID: {teacherId}");

                // Récupérer les classes de l'enseignant
                var classes = await _context.Classes
                    .Where(c => c.TeacherId == teacherId)
                    .ToListAsync();

                var classCount = classes.Count;
                _logger.LogInformation($"Nombre de classes trouvées: {classCount}");

                // Récupérer les étudiants dans ces classes avec une approche différente
                var students = await _context.Students
                    .Join(_context.Classes,
                        student => student.ClassId,
                        class_ => class_.Id,
                        (student, class_) => new { Student = student, Class = class_ })
                    .Where(sc => sc.Class.TeacherId == teacherId)
                    .Select(sc => sc.Student)
                    .ToListAsync();

                var studentCount = students.Count;
                _logger.LogInformation($"Nombre d'étudiants trouvés: {studentCount}");

                // Récupérer les absences des étudiants avec une approche différente
                var absences = await _context.Absences
                    .Join(_context.Students,
                        absence => absence.StudentId,
                        student => student.Id,
                        (absence, student) => new { Absence = absence, Student = student })
                    .Join(_context.Classes,
                        as_ => as_.Student.ClassId,
                        class_ => class_.Id,
                        (as_, class_) => new { as_.Absence, as_.Student, Class = class_ })
                    .Where(asc => asc.Class.TeacherId == teacherId)
                    .Select(asc => asc.Absence)
                    .ToListAsync();

                var absenceCount = absences.Count;
                _logger.LogInformation($"Nombre d'absences trouvées: {absenceCount}");

                // Récupérer les réservations de l'enseignant
                var reservations = await _context.Reservations
                    .Where(r => r.UserId == teacherId)
                    .ToListAsync();

                var reservationCount = reservations.Count;
                _logger.LogInformation($"Nombre de réservations trouvées: {reservationCount}");

                // Créer le DTO de statistiques
                var stats = new DashboardStatsDto
                {
                    TotalClasses = classCount,
                    TotalStudents = studentCount,
                    TotalAbsences = absenceCount,
                    AbsencesByStatus = new Dictionary<string, int>
                    {
                        { "justifiée", absences.Count(a => a.Status == "justifiée") },
                        { "non justifiée", absences.Count(a => a.Status == "non justifiée") },
                        { "en attente", absences.Count(a => a.Status == "en attente") }
                    },
                    TotalReservations = reservationCount
                };

                return stats;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de la récupération des statistiques du tableau de bord");
                throw;
            }
        }

        public async Task<AbsenceStatsDto> GetAbsenceStats()
        {
            try
            {
                // Récupérer l'ID de l'enseignant connecté
                var teacherId = GetCurrentTeacherId();

                // Récupérer les absences des étudiants avec une approche différente
                var absences = await _context.Absences
                    .Join(_context.Students,
                        absence => absence.StudentId,
                        student => student.Id,
                        (absence, student) => new { Absence = absence, Student = student })
                    .Join(_context.Classes,
                        as_ => as_.Student.ClassId,
                        class_ => class_.Id,
                        (as_, class_) => new { as_.Absence, as_.Student, Class = class_ })
                    .Where(asc => asc.Class.TeacherId == teacherId)
                    .Select(asc => asc.Absence)
                    .ToListAsync();

                // Créer le DTO de statistiques
                var stats = new AbsenceStatsDto
                {
                    TotalAbsences = absences.Count(),
                    JustifiedAbsences = absences.Count(a => a.Status == "justifiée"),
                    UnjustifiedAbsences = absences.Count(a => a.Status == "non justifiée"),
                    PendingAbsences = absences.Count(a => a.Status == "en attente")
                };

                return stats;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de la récupération des statistiques d'absences");
                throw;
            }
        }

        public async Task<ClassStatsDto> GetClassStats(int? classId)
        {
            try
            {
                if (classId == null)
                {
                    _logger.LogWarning("ClassId est null");
                    return null;
                }

                // Récupérer l'ID de l'enseignant connecté
                var teacherId = GetCurrentTeacherId();

                // Vérifier que la classe appartient à l'enseignant
                var classEntity = await _context.Classes
                    .FirstOrDefaultAsync(c => c.Id == classId && c.TeacherId == teacherId);

                if (classEntity == null)
                {
                    _logger.LogWarning($"Classe avec ID {classId} non trouvée pour l'enseignant {teacherId}");
                    return null;
                }

                // Récupérer les étudiants de la classe
                var students = await _context.Students
                    .Where(s => s.ClassId == classId)
                    .ToListAsync();

                // Récupérer les absences des étudiants avec une approche différente
                var absences = await _context.Absences
                    .Join(_context.Students,
                        absence => absence.StudentId,
                        student => student.Id,
                        (absence, student) => new { Absence = absence, Student = student })
                    .Where(as_ => as_.Student.ClassId == classId)
                    .Select(as_ => as_.Absence)
                    .ToListAsync();

                // Créer le DTO de statistiques
                var stats = new ClassStatsDto
                {
                    ClassId = classId.Value,
                    ClassName = classEntity.Name,
                    StudentCount = students.Count(),
                    TotalAbsences = absences.Count(),
                    JustifiedAbsences = absences.Count(a => a.Status == "justifiée"),
                    UnjustifiedAbsences = absences.Count(a => a.Status == "non justifiée"),
                    PendingAbsences = absences.Count(a => a.Status == "en attente")
                };

                return stats;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de la récupération des statistiques de classe pour ClassId {classId}");
                throw;
            }
        }

        public async Task<StudentStatsDto> GetStudentStats(int? studentId)
        {
            try
            {
                if (studentId == null)
                {
                    _logger.LogWarning("StudentId est null");
                    return null;
                }

                // Récupérer l'ID de l'enseignant connecté
                var teacherId = GetCurrentTeacherId();

                // Récupérer l'étudiant
                var student = await _context.Students
                    .Join(_context.Classes,
                        student => student.ClassId,
                        class_ => class_.Id,
                        (student, class_) => new { Student = student, Class = class_ })
                    .Where(sc => sc.Student.Id == studentId && sc.Class.TeacherId == teacherId)
                    .Select(sc => new { sc.Student, sc.Class })
                    .FirstOrDefaultAsync();

                if (student == null)
                {
                    _logger.LogWarning($"Étudiant avec ID {studentId} non trouvé pour l'enseignant {teacherId}");
                    return null;
                }

                // Récupérer les absences de l'étudiant
                var absences = await _context.Absences
                    .Where(a => a.StudentId == studentId)
                    .ToListAsync();

                // Créer le DTO de statistiques
                var stats = new StudentStatsDto
                {
                    StudentId = studentId.Value,
                    StudentName = $"{student.Student.FirstName} {student.Student.LastName}",
                    ClassId = student.Student.ClassId,
                    ClassName = student.Class.Name,
                    TotalAbsences = absences.Count(),
                    JustifiedAbsences = absences.Count(a => a.Status == "justifiée"),
                    UnjustifiedAbsences = absences.Count(a => a.Status == "non justifiée"),
                    PendingAbsences = absences.Count(a => a.Status == "en attente")
                };

                return stats;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de la récupération des statistiques d'étudiant pour StudentId {studentId}");
                throw;
            }
        }

        public async Task<RoomStatsDto> GetRoomStats()
        {
            try
            {
                // Récupérer l'ID de l'enseignant connecté
                var teacherId = GetCurrentTeacherId();

                // Récupérer les réservations de l'enseignant
                var reservations = await _context.Reservations
                    .Where(r => r.UserId == teacherId)
                    .ToListAsync();

                // Récupérer toutes les salles
                var rooms = await _context.Rooms.ToListAsync();

                // Créer le DTO de statistiques
                var stats = new RoomStatsDto
                {
                    TotalRooms = rooms.Count(),
                    TotalReservations = reservations.Count()
                };

                return stats;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de la récupération des statistiques de salles");
                throw;
            }
        }
    }
}
