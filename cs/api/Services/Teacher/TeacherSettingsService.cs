using System;
using System.IO;
using System.Drawing;
using System.Drawing.Imaging;
using System.Threading.Tasks;
using gest_abs.DTO.Teacher;
using gest_abs.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Linq;

namespace gest_abs.Services.Teacher
{
    public class TeacherSettingsService
    {
        private readonly GestionAbsencesContext _context;
        private readonly ILogger<TeacherSettingsService> _logger;

        public TeacherSettingsService(GestionAbsencesContext context, ILogger<TeacherSettingsService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<SettingsDto> GetSettingsAsync(int userId)
        {
            _logger.LogInformation($"Récupération des paramètres pour l'utilisateur {userId}");
            
            var settings = await _context.Settings
                .FirstOrDefaultAsync(s => s.UserId == userId);

            if (settings == null)
            {
                _logger.LogInformation($"Aucun paramètre trouvé pour l'utilisateur {userId}, création des paramètres par défaut");
                
                // Créer des paramètres par défaut si aucun n'existe
                settings = new Settings
                {
                    UserId = userId,
                    Nickname = "",
                    ProfileImage = "",
                    Theme = "light",
                    Language = "fr",
                    NotificationsEnabled = true,
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                };

                _context.Settings.Add(settings);
                await _context.SaveChangesAsync();
            }

            return MapToDto(settings);
        }

        public async Task<SettingsDto> UpdateSettingsAsync(int userId, UpdateSettingsDto updateDto)
        {
            _logger.LogInformation($"Mise à jour des paramètres pour l'utilisateur {userId}");
            
            var settings = await _context.Settings
                .FirstOrDefaultAsync(s => s.UserId == userId);

            if (settings == null)
            {
                _logger.LogInformation($"Aucun paramètre trouvé pour l'utilisateur {userId}, création des paramètres");
                
                settings = new Settings
                {
                    UserId = userId,
                    CreatedAt = DateTime.Now
                };
                
                _context.Settings.Add(settings);
            }

            // Mettre à jour les propriétés
            if (updateDto.Nickname != null)
                settings.Nickname = updateDto.Nickname;
                
            if (updateDto.ProfileImage != null && updateDto.ProfileImage.Length > 0)
            {
                // Compresser l'image si elle est trop grande
                if (updateDto.ProfileImage.Length > 500000) // 500KB
                {
                    try
                    {
                        _logger.LogInformation($"Compression de l'image de profil (taille originale: {updateDto.ProfileImage.Length} octets)");
                        settings.ProfileImage = CompressProfileImage(updateDto.ProfileImage);
                        _logger.LogInformation($"Image compressée (nouvelle taille: {settings.ProfileImage.Length} octets)");
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Erreur lors de la compression de l'image");
                        // En cas d'erreur, on utilise l'image originale
                        settings.ProfileImage = updateDto.ProfileImage;
                    }
                }
                else
                {
                    settings.ProfileImage = updateDto.ProfileImage;
                }
            }
                
            if (updateDto.Theme != null)
                settings.Theme = updateDto.Theme;
                
            if (updateDto.Language != null)
                settings.Language = updateDto.Language;
                
            settings.NotificationsEnabled = updateDto.NotificationsEnabled;
            settings.UpdatedAt = DateTime.Now;

            try
            {
                await _context.SaveChangesAsync();
                _logger.LogInformation($"Paramètres mis à jour pour l'utilisateur {userId}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de la sauvegarde des paramètres. Taille de l'image: {settings.ProfileImage?.Length ?? 0} octets");
                throw;
            }

            return MapToDto(settings);
        }

        private string CompressProfileImage(string base64Image)
        {
            // Extraire les données de l'image du format base64
            string[] parts = base64Image.Split(',');
            string imageData = parts.Length > 1 ? parts[1] : parts[0];
            string imageFormat = "";
            
            if (parts.Length > 1 && parts[0].Contains("image/"))
            {
                imageFormat = parts[0].Split(':')[1].Split(';')[0].Replace("image/", "");
            }
            
            byte[] imageBytes = Convert.FromBase64String(imageData);
            
            using (MemoryStream ms = new MemoryStream(imageBytes))
            {
                using (Image image = Image.FromStream(ms))
                {
                    // Redimensionner l'image à une taille raisonnable
                    int maxWidth = 300;
                    int maxHeight = 300;
                    
                    int newWidth, newHeight;
                    if (image.Width > image.Height)
                    {
                        newWidth = maxWidth;
                        newHeight = (int)(image.Height * ((float)maxWidth / image.Width));
                    }
                    else
                    {
                        newHeight = maxHeight;
                        newWidth = (int)(image.Width * ((float)maxHeight / image.Height));
                    }
                    
                    using (Bitmap resizedImage = new Bitmap(newWidth, newHeight))
                    {
                        using (Graphics g = Graphics.FromImage(resizedImage))
                        {
                            g.InterpolationMode = System.Drawing.Drawing2D.InterpolationMode.HighQualityBicubic;
                            g.DrawImage(image, 0, 0, newWidth, newHeight);
                        }
                        
                        using (MemoryStream compressedMs = new MemoryStream())
                        {
                            // Déterminer le format de l'image
                            ImageFormat format = ImageFormat.Jpeg; // Par défaut
                            if (imageFormat.ToLower() == "png")
                                format = ImageFormat.Png;
                            else if (imageFormat.ToLower() == "gif")
                                format = ImageFormat.Gif;
                            
                            // Enregistrer l'image avec compression
                            if (format == ImageFormat.Jpeg)
                            {
                                // Pour JPEG, on peut définir la qualité
                                System.Drawing.Imaging.Encoder qualityEncoder = System.Drawing.Imaging.Encoder.Quality;
                                EncoderParameters encoderParams = new EncoderParameters(1);
                                encoderParams.Param[0] = new EncoderParameter(qualityEncoder, 75L); // Qualité 75%
                                
                                ImageCodecInfo jpegCodec = ImageCodecInfo.GetImageDecoders()
                                    .FirstOrDefault(codec => codec.FormatID == ImageFormat.Jpeg.Guid);
                                
                                if (jpegCodec != null)
                                    resizedImage.Save(compressedMs, jpegCodec, encoderParams);
                                else
                                    resizedImage.Save(compressedMs, format);
                            }
                            else
                            {
                                resizedImage.Save(compressedMs, format);
                            }
                            
                            byte[] compressedBytes = compressedMs.ToArray();
                            string compressedBase64 = Convert.ToBase64String(compressedBytes);
                            
                            // Reconstruire la chaîne base64 avec le préfixe si nécessaire
                            if (parts.Length > 1)
                                return parts[0] + "," + compressedBase64;
                            else
                                return compressedBase64;
                        }
                    }
                }
            }
        }

        private SettingsDto MapToDto(Settings settings)
        {
            return new SettingsDto
            {
                Id = settings.Id,
                UserId = settings.UserId,
                Nickname = settings.Nickname,
                ProfileImage = settings.ProfileImage,
                Theme = settings.Theme,
                Language = settings.Language,
                NotificationsEnabled = settings.NotificationsEnabled,
                CreatedAt = settings.CreatedAt,
                UpdatedAt = settings.UpdatedAt
            };
        }
    }
}
