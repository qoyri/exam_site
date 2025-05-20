using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using gest_abs.Models;
using gest_abs.DTO.Teacher;

namespace gest_abs.Services.Teacher
{
    public class TeacherRoomService
    {
        private readonly GestionAbsencesContext _context;
        private readonly ILogger<TeacherRoomService> _logger;

        public TeacherRoomService(GestionAbsencesContext context, ILogger<TeacherRoomService> logger)
        {
            _context = context;
            _logger = logger;
        }

        #region Rooms

        public async Task<List<RoomDto>> GetRooms(RoomFilterDto filter = null)
        {
            try
            {
                _logger.LogInformation("Récupération des salles avec filtres: {Filter}", 
                    filter != null ? System.Text.Json.JsonSerializer.Serialize(filter) : "null");
                
                var query = _context.Rooms.AsQueryable();

                // Appliquer les filtres
                if (filter != null)
                {
                    if (!string.IsNullOrEmpty(filter.Name))
                    {
                        query = query.Where(r => r.Name.Contains(filter.Name));
                    }

                    if (!string.IsNullOrEmpty(filter.Location))
                    {
                        query = query.Where(r => r.Location.Contains(filter.Location));
                    }

                    if (filter.MinCapacity.HasValue)
                    {
                        query = query.Where(r => r.Capacity >= filter.MinCapacity.Value);
                    }
                }

                // Ordonner par nom
                query = query.OrderBy(r => r.Name);

                var rooms = await query.ToListAsync();

                return rooms.Select(r => new RoomDto
                {
                    Id = r.Id,
                    Name = r.Name,
                    Capacity = r.Capacity,
                    Location = r.Location
                }).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de la récupération des salles");
                throw;
            }
        }

        public async Task<List<RoomDto>> GetAllRooms()
        {
            try
            {
                _logger.LogInformation("Récupération de toutes les salles");
        
                var rooms = await _context.Rooms
                    .OrderBy(r => r.Name)
                    .ToListAsync();

                return rooms.Select(r => new RoomDto
                {
                    Id = r.Id,
                    Name = r.Name,
                    Capacity = r.Capacity,
                    Location = r.Location
                }).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de la récupération de toutes les salles");
                throw;
            }
        }

        public async Task<RoomDto> GetRoomById(int id)
        {
            try
            {
                var room = await _context.Rooms.FindAsync(id);

                if (room == null)
                {
                    return null;
                }

                return new RoomDto
                {
                    Id = room.Id,
                    Name = room.Name,
                    Capacity = room.Capacity,
                    Location = room.Location
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de la récupération de la salle {id}");
                throw;
            }
        }

        #endregion

        #region Reservations

        public async Task<List<ReservationDto>> GetReservations(ReservationFilterDto filter = null)
        {
            try
            {
                _logger.LogInformation("Récupération des réservations avec filtres: {Filter}", 
                    filter != null ? System.Text.Json.JsonSerializer.Serialize(filter) : "null");
                
                var query = _context.Reservations
                    .Include(r => r.Room)
                    .Include(r => r.User)
                    .AsQueryable();

                // Appliquer les filtres
                if (filter != null)
                {
                    if (filter.RoomId.HasValue)
                    {
                        query = query.Where(r => r.RoomId == filter.RoomId.Value);
                    }

                    if (filter.StartDate.HasValue)
                    {
                        query = query.Where(r => r.ReservationDate >= filter.StartDate.Value);
                    }

                    if (filter.EndDate.HasValue)
                    {
                        query = query.Where(r => r.ReservationDate <= filter.EndDate.Value);
                    }
                }

                // Ordonner par date et heure
                query = query.OrderBy(r => r.ReservationDate).ThenBy(r => r.StartTime);

                var reservations = await query.ToListAsync();

                return reservations.Select(r => new ReservationDto
                {
                    Id = r.Id,
                    RoomId = r.RoomId,
                    RoomName = r.Room.Name,
                    ReservationDate = r.ReservationDate,
                    StartTime = r.StartTime,
                    EndTime = r.EndTime,
                    UserEmail = r.User.Email
                }).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de la récupération des réservations");
                throw;
            }
        }

        public async Task<ReservationDto> GetReservationById(int id)
        {
            try
            {
                var reservation = await _context.Reservations
                    .Include(r => r.Room)
                    .Include(r => r.User)
                    .FirstOrDefaultAsync(r => r.Id == id);

                if (reservation == null)
                {
                    return null;
                }

                return new ReservationDto
                {
                    Id = reservation.Id,
                    RoomId = reservation.RoomId,
                    RoomName = reservation.Room.Name,
                    ReservationDate = reservation.ReservationDate,
                    StartTime = reservation.StartTime,
                    EndTime = reservation.EndTime,
                    UserEmail = reservation.User.Email
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de la récupération de la réservation {id}");
                throw;
            }
        }

        public async Task<(bool Success, string Message, ReservationDto Reservation)> CreateReservation(int userId, ReservationCreateDto createDto)
        {
            try
            {
                // Vérifier si la salle existe
                var room = await _context.Rooms.FindAsync(createDto.RoomId);
                if (room == null)
                {
                    return (false, $"Salle avec ID {createDto.RoomId} non trouvée", null);
                }

                // Vérifier si la salle est disponible pour cette période
                var isAvailable = await IsRoomAvailable(
                    createDto.RoomId, 
                    createDto.ReservationDate, 
                    createDto.StartTime, 
                    createDto.EndTime);

                if (!isAvailable)
                {
                    return (false, "La salle n'est pas disponible pour cette période", null);
                }

                // Vérifier que l'heure de début est avant l'heure de fin
                if (createDto.StartTime >= createDto.EndTime)
                {
                    return (false, "L'heure de début doit être antérieure à l'heure de fin", null);
                }

                var reservation = new Reservation
                {
                    RoomId = createDto.RoomId,
                    UserId = userId,
                    ReservationDate = createDto.ReservationDate,
                    StartTime = createDto.StartTime,
                    EndTime = createDto.EndTime
                };

                _context.Reservations.Add(reservation);
                await _context.SaveChangesAsync();

                // Récupérer l'utilisateur pour le DTO de retour
                var user = await _context.Users.FindAsync(userId);

                var reservationDto = new ReservationDto
                {
                    Id = reservation.Id,
                    RoomId = reservation.RoomId,
                    RoomName = room.Name,
                    ReservationDate = reservation.ReservationDate,
                    StartTime = reservation.StartTime,
                    EndTime = reservation.EndTime,
                    UserEmail = user.Email
                };

                return (true, "Réservation créée avec succès", reservationDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de la création d'une réservation");
                throw;
            }
        }

        public async Task<(bool Success, string Message)> UpdateReservation(int id, int userId, ReservationUpdateDto updateDto)
        {
            try
            {
                var reservation = await _context.Reservations.FindAsync(id);

                if (reservation == null)
                {
                    return (false, "Réservation non trouvée");
                }

                // Vérifier que l'utilisateur est le propriétaire de la réservation ou un admin
                var user = await _context.Users.FindAsync(userId);
                if (reservation.UserId != userId && user.Role != "admin")
                {
                    return (false, "Vous n'êtes pas autorisé à modifier cette réservation");
                }

                // Vérifier que l'heure de début est avant l'heure de fin
                if (updateDto.StartTime >= updateDto.EndTime)
                {
                    return (false, "L'heure de début doit être antérieure à l'heure de fin");
                }

                // Vérifier si la salle est disponible pour cette nouvelle période
                var isAvailable = await IsRoomAvailableExcludingReservation(
                    reservation.RoomId, 
                    updateDto.ReservationDate, 
                    updateDto.StartTime, 
                    updateDto.EndTime,
                    id);

                if (!isAvailable)
                {
                    return (false, "La salle n'est pas disponible pour cette période");
                }

                reservation.ReservationDate = updateDto.ReservationDate;
                reservation.StartTime = updateDto.StartTime;
                reservation.EndTime = updateDto.EndTime;

                await _context.SaveChangesAsync();
                return (true, "Réservation mise à jour avec succès");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de la mise à jour de la réservation {id}");
                throw;
            }
        }

        public async Task<(bool Success, string Message)> DeleteReservation(int id, int userId)
        {
            try
            {
                var reservation = await _context.Reservations.FindAsync(id);

                if (reservation == null)
                {
                    return (false, "Réservation non trouvée");
                }

                // Vérifier que l'utilisateur est le propriétaire de la réservation ou un admin
                var user = await _context.Users.FindAsync(userId);
                if (reservation.UserId != userId && user.Role != "admin")
                {
                    return (false, "Vous n'êtes pas autorisé à supprimer cette réservation");
                }

                _context.Reservations.Remove(reservation);
                await _context.SaveChangesAsync();
                return (true, "Réservation supprimée avec succès");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de la suppression de la réservation {id}");
                throw;
            }
        }

        #endregion

        #region Helpers

        public async Task<bool> IsRoomAvailable(int roomId, DateOnly date, TimeOnly startTime, TimeOnly endTime)
        {
            // Vérifier s'il existe déjà une réservation pour cette salle à cette date et qui chevauche l'horaire demandé
            var conflictingReservation = await _context.Reservations
                .AnyAsync(r => r.RoomId == roomId && 
                               r.ReservationDate == date && 
                               ((r.StartTime <= startTime && r.EndTime > startTime) || 
                                (r.StartTime < endTime && r.EndTime >= endTime) ||
                                (r.StartTime >= startTime && r.EndTime <= endTime)));

            return !conflictingReservation;
        }

        public async Task<bool> IsRoomAvailableExcludingReservation(int roomId, DateOnly date, TimeOnly startTime, TimeOnly endTime, int excludeReservationId)
        {
            // Vérifier s'il existe déjà une réservation pour cette salle à cette date et qui chevauche l'horaire demandé
            var conflictingReservation = await _context.Reservations
                .AnyAsync(r => r.Id != excludeReservationId &&
                               r.RoomId == roomId && 
                               r.ReservationDate == date && 
                               ((r.StartTime <= startTime && r.EndTime > startTime) || 
                                (r.StartTime < endTime && r.EndTime >= endTime) ||
                                (r.StartTime >= startTime && r.EndTime <= endTime)));

            return !conflictingReservation;
        }

        public async Task<int> GetUserIdFromEmail(string email)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
            return user?.Id ?? 0;
        }

        #endregion
    }
}
