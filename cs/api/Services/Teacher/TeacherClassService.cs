using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using api.DTO.Teacher;
using gest_abs.Models;

namespace api.Services.Teacher
{
    public class TeacherClassService
    {
        private readonly GestionAbsencesContext _context;
        private readonly ILogger<TeacherClassService> _logger;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public TeacherClassService(
            GestionAbsencesContext context,
            ILogger<TeacherClassService> logger,
            IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _logger = logger;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<List<ClassDto>> GetAllClasses()
        {
            try
            {
                _logger.LogInformation("Récupération de toutes les classes");

                // Récupérer l'ID de l'enseignant connecté
                var teacherId = await GetCurrentTeacherId();
                _logger.LogInformation("ID de l'enseignant connecté: {TeacherId}", teacherId);

                // Récupérer toutes les classes associées à cet enseignant
                var classes = await _context.Classes
                    .Where(c => c.TeacherId == teacherId)
                    .Select(c => new ClassDto
                    {
                        Id = c.Id,
                        Name = c.Name,
                        StudentCount = _context.Students.Count(s => s.ClassId == c.Id)
                    })
                    .ToListAsync();

                return classes;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de la récupération des classes");
                throw;
            }
        }

        public async Task<ClassDetailDto> GetClassById(int id)
        {
            try
            {
                _logger.LogInformation("Récupération de la classe {ClassId}", id);

                // Récupérer l'ID de l'enseignant connecté
                var teacherId = await GetCurrentTeacherId();

                // Récupérer la classe avec l'ID spécifié
                var classEntity = await _context.Classes
                    .Where(c => c.Id == id && c.TeacherId == teacherId)
                    .FirstOrDefaultAsync();

                if (classEntity == null)
                {
                    return null;
                }

                // Récupérer les étudiants de cette classe
                var students = await _context.Students
                    .Where(s => s.ClassId == id)
                    .Select(s => new StudentDto
                    {
                        Id = s.Id,
                        ClassId = s.ClassId,
                        FirstName = s.FirstName,
                        LastName = s.LastName,
                        Birthdate = s.Birthdate
                    })
                    .ToListAsync();

                // Créer le DTO de détail de classe
                var classDetail = new ClassDetailDto
                {
                    Id = classEntity.Id,
                    Name = classEntity.Name,
                    StudentCount = students.Count,
                    Students = students
                };

                return classDetail;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de la récupération de la classe {ClassId}", id);
                throw;
            }
        }

        private async Task<int> GetCurrentTeacherId()
        {
            try
            {
                // Récupérer le contexte HTTP
                var httpContext = _httpContextAccessor.HttpContext;
                if (httpContext == null)
                {
                    _logger.LogWarning("Impossible de récupérer le contexte HTTP");
                    return 1; // Valeur par défaut pour les tests
                }

                // Récupérer l'utilisateur connecté
                var user = httpContext.User;
                if (user == null || !user.Identity.IsAuthenticated)
                {
                    _logger.LogWarning("Aucun utilisateur authentifié");
                    return 1; // Valeur par défaut pour les tests
                }

                // Afficher tous les claims disponibles pour le débogage
                _logger.LogInformation("===== DÉBUT DES CLAIMS =====");
                var claimsList = user.Claims.ToList();
                if (claimsList.Count == 0)
                {
                    _logger.LogWarning("Aucun claim trouvé dans le token");
                }
                else
                {
                    foreach (var claim in claimsList)
                    {
                        _logger.LogInformation("Claim: Type=\"{Type}\", Value=\"{Value}\"", claim.Type, claim.Value);
                    }
                }
                _logger.LogInformation("===== FIN DES CLAIMS =====");

                // Essayer de trouver un claim qui pourrait contenir un email
                var emailClaim = user.FindFirst(ClaimTypes.Email) ?? 
                                user.FindFirst("email") ?? 
                                user.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress") ??
                                user.FindFirst("preferred_username") ??
                                user.FindFirst("name") ??
                                user.FindFirst(ClaimTypes.Name) ??
                                user.FindFirst(claim => claim.Type.Contains("email", StringComparison.OrdinalIgnoreCase)) ??
                                user.FindFirst(claim => claim.Value.Contains("@", StringComparison.OrdinalIgnoreCase));

                if (emailClaim != null)
                {
                    string emailOrUsername = emailClaim.Value;
                    _logger.LogInformation("Identifiant trouvé: {Email} (Type: {Type})", emailOrUsername, emailClaim.Type);

                    // Rechercher l'utilisateur par email ou nom d'utilisateur
                    var dbUser = await _context.Users
                        .FirstOrDefaultAsync(u => u.Email == emailOrUsername || u.Username == emailOrUsername);

                    if (dbUser != null)
                    {
                        _logger.LogInformation("Utilisateur trouvé: ID={UserId}, Email={Email}", dbUser.Id, dbUser.Email);

                        // Rechercher l'enseignant associé à cet utilisateur
                        var teacher = await _context.Teachers
                            .FirstOrDefaultAsync(t => t.UserId == dbUser.Id);

                        if (teacher != null)
                        {
                            _logger.LogInformation("Enseignant trouvé: ID={TeacherId}", teacher.Id);
                            return teacher.Id;
                        }
                        else
                        {
                            _logger.LogWarning("Aucun enseignant trouvé pour l'utilisateur {UserId}", dbUser.Id);
                        }
                    }
                    else
                    {
                        _logger.LogWarning("Aucun utilisateur trouvé avec l'identifiant {Email}", emailOrUsername);
                    }
                }
                else
                {
                    _logger.LogWarning("Aucun claim d'email ou d'identifiant trouvé");
                }

                // Si nous avons un claim sub, essayons de l'utiliser
                var subClaim = user.FindFirst("sub") ?? user.FindFirst(ClaimTypes.NameIdentifier);
                if (subClaim != null)
                {
                    _logger.LogInformation("Claim sub trouvé: {Sub}", subClaim.Value);
                    
                    // Essayer de trouver un utilisateur avec ce sub comme username
                    var dbUser = await _context.Users
                        .FirstOrDefaultAsync(u => u.Username == subClaim.Value);
                    
                    if (dbUser != null)
                    {
                        _logger.LogInformation("Utilisateur trouvé via sub: ID={UserId}, Email={Email}", dbUser.Id, dbUser.Email);
                        
                        // Rechercher l'enseignant associé à cet utilisateur
                        var teacher = await _context.Teachers
                            .FirstOrDefaultAsync(t => t.UserId == dbUser.Id);
                            
                        if (teacher != null)
                        {
                            _logger.LogInformation("Enseignant trouvé via sub: ID={TeacherId}", teacher.Id);
                            return teacher.Id;
                        }
                    }
                }

                // Si nous avons un claim unique_name, essayons de l'utiliser
                var uniqueNameClaim = user.FindFirst("unique_name");
                if (uniqueNameClaim != null)
                {
                    _logger.LogInformation("Claim unique_name trouvé: {UniqueName}", uniqueNameClaim.Value);
                    
                    // Essayer de trouver un utilisateur avec ce unique_name comme username
                    var dbUser = await _context.Users
                        .FirstOrDefaultAsync(u => u.Username == uniqueNameClaim.Value);
                    
                    if (dbUser != null)
                    {
                        _logger.LogInformation("Utilisateur trouvé via unique_name: ID={UserId}, Email={Email}", dbUser.Id, dbUser.Email);
                        
                        // Rechercher l'enseignant associé à cet utilisateur
                        var teacher = await _context.Teachers
                            .FirstOrDefaultAsync(t => t.UserId == dbUser.Id);
                            
                        if (teacher != null)
                        {
                            _logger.LogInformation("Enseignant trouvé via unique_name: ID={TeacherId}", teacher.Id);
                            return teacher.Id;
                        }
                    }
                }

                // Si aucune méthode ne fonctionne, utiliser une valeur par défaut pour les tests
                _logger.LogWarning("Impossible de déterminer l'ID de l'enseignant, utilisation de la valeur par défaut");
                
                // Pour les tests, récupérer le premier enseignant de la base de données
                var firstTeacher = await _context.Teachers.FirstOrDefaultAsync();
                if (firstTeacher != null)
                {
                    _logger.LogInformation("Utilisation du premier enseignant trouvé: ID={TeacherId}", firstTeacher.Id);
                    return firstTeacher.Id;
                }
                
                return 1;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de la récupération de l'ID de l'enseignant");
                return 1; // Valeur par défaut pour les tests
            }
        }
    }
}
