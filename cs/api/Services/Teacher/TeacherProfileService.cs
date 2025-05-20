using System;
using System.Threading.Tasks;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using gest_abs.Models;
using gest_abs.DTO.Teacher;

namespace gest_abs.Services.Teacher
{
    public class TeacherProfileService
    {
        private readonly GestionAbsencesContext _context;
        private readonly ILogger<TeacherProfileService> _logger;

        public TeacherProfileService(GestionAbsencesContext context, ILogger<TeacherProfileService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<TeacherProfileDto> GetTeacherProfileByEmail(string email)
        {
            try
            {
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email == email);

                if (user == null)
                {
                    _logger.LogWarning($"Utilisateur non trouvé avec l'email: {email}");
                    return null;
                }

                var teacher = await _context.Teachers
                    .FirstOrDefaultAsync(t => t.UserId == user.Id);

                if (teacher == null && user.Role != "admin")
                {
                    _logger.LogWarning($"Enseignant non trouvé pour l'utilisateur: {email}");
                    return null;
                }

                return new TeacherProfileDto
                {
                    Id = teacher?.Id ?? 0,
                    Email = user.Email,
                    Subject = teacher?.Subject ?? "Administration",
                    FullName = "Nom de l'enseignant", // À remplacer par la vraie valeur si disponible
                    CreatedAt = user.CreatedAt ?? DateTime.UtcNow
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de la récupération du profil enseignant pour {email}");
                throw;
            }
        }

        public async Task<(bool Success, string Message)> UpdateTeacherProfile(string email, TeacherProfileUpdateDto updateDto)
        {
            try
            {
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email == email);

                if (user == null)
                {
                    return (false, "Utilisateur non trouvé.");
                }

                var teacher = await _context.Teachers
                    .FirstOrDefaultAsync(t => t.UserId == user.Id);

                if (teacher == null && user.Role != "admin")
                {
                    return (false, "Enseignant non trouvé.");
                }

                // Mise à jour du sujet enseigné
                if (teacher != null && !string.IsNullOrEmpty(updateDto.Subject))
                {
                    teacher.Subject = updateDto.Subject;
                }

                // Mise à jour du mot de passe si demandé
                if (!string.IsNullOrEmpty(updateDto.CurrentPassword) && !string.IsNullOrEmpty(updateDto.NewPassword))
                {
                    // Vérifier l'ancien mot de passe
                    var hashedCurrentPassword = HashPassword(updateDto.CurrentPassword);
                    if (user.Password != hashedCurrentPassword)
                    {
                        return (false, "Mot de passe actuel incorrect.");
                    }

                    // Mettre à jour avec le nouveau mot de passe
                    user.Password = HashPassword(updateDto.NewPassword);
                }

                await _context.SaveChangesAsync();
                return (true, "Profil mis à jour avec succès.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de la mise à jour du profil enseignant pour {email}");
                throw;
            }
        }

        private string HashPassword(string password)
        {
            using var sha256 = SHA256.Create();
            var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
            return BitConverter.ToString(hashedBytes).Replace("-", "").ToLower();
        }
    }
}
