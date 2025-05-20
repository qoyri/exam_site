using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using gest_abs.DTO.Teacher;
using gest_abs.Services.Teacher;
using gest_abs.Utils;

namespace gest_abs.Controllers.Teacher
{
    [ApiController]
    [Route("api/teacher")]
    [Authorize(Roles = "professeur,admin")]
    public class TeacherRoomController : ControllerBase
    {
        private readonly ILogger<TeacherRoomController> _logger;
        private readonly TeacherRoomService _roomService;

        public TeacherRoomController(
            ILogger<TeacherRoomController> logger,
            TeacherRoomService roomService)
        {
            _logger = logger;
            _roomService = roomService;
        }

        #region Rooms

        // GET: api/teacher/rooms
        [HttpGet("rooms")]
        public async Task<IActionResult> GetRooms()
        {
            try
            {
                _logger.LogInformation("Récupération de toutes les salles");

                var rooms = await _roomService.GetAllRooms();
                return Ok(rooms);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de la récupération des salles");
                return StatusCode(500, new { Message = "Une erreur est survenue lors de la récupération des salles." });
            }
        }

        // GET: api/teacher/rooms/{id}
        [HttpGet("rooms/{id}")]
        public async Task<IActionResult> GetRoomById(int id)
        {
            try
            {
                var room = await _roomService.GetRoomById(id);

                if (room == null)
                {
                    return NotFound(new { Message = "Salle non trouvée." });
                }

                return Ok(room);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de la récupération de la salle {id}");
                return StatusCode(500, new { Message = "Une erreur est survenue lors de la récupération de la salle." });
            }
        }

        #endregion

        #region Reservations

        // GET: api/teacher/reservations
        [HttpGet("reservations")]
        public async Task<IActionResult> GetReservations(
            [FromQuery] int? roomId,
            [FromQuery] string startDate,
            [FromQuery] string endDate)
        {
            try
            {
                _logger.LogInformation("Récupération des réservations avec filtres: roomId={RoomId}, startDate={StartDate}, endDate={EndDate}",
                    roomId, startDate, endDate);

                var filter = new ReservationFilterDto
                {
                    RoomId = roomId,
                    StartDate = DateUtils.ParseDateOnly(startDate),
                    EndDate = DateUtils.ParseDateOnly(endDate)
                };

                var reservations = await _roomService.GetReservations(filter);
                return Ok(reservations);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de la récupération des réservations");
                return StatusCode(500, new { Message = "Une erreur est survenue lors de la récupération des réservations." });
            }
        }

        // GET: api/teacher/reservations/{id}
        [HttpGet("reservations/{id}")]
        public async Task<IActionResult> GetReservationById(int id)
        {
            try
            {
                var reservation = await _roomService.GetReservationById(id);

                if (reservation == null)
                {
                    return NotFound(new { Message = "Réservation non trouvée." });
                }

                return Ok(reservation);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de la récupération de la réservation {id}");
                return StatusCode(500, new { Message = "Une erreur est survenue lors de la récupération de la réservation." });
            }
        }

        // POST: api/teacher/reservations
        [HttpPost("reservations")]
        public async Task<IActionResult> CreateReservation([FromBody] ReservationCreateDto createDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                // Récupérer l'ID de l'utilisateur connecté
                var email = User.FindFirst(ClaimTypes.Name)?.Value;
                if (string.IsNullOrEmpty(email))
                {
                    return Unauthorized(new { Message = "Utilisateur non authentifié." });
                }

                var userId = await _roomService.GetUserIdFromEmail(email);
                if (userId == 0)
                {
                    return Unauthorized(new { Message = "Utilisateur non trouvé." });
                }

                var result = await _roomService.CreateReservation(userId, createDto);

                if (!result.Success)
                {
                    return BadRequest(new { Message = result.Message });
                }

                return CreatedAtAction(nameof(GetReservationById), new { id = result.Reservation.Id }, result.Reservation);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de la création d'une réservation");
                return StatusCode(500, new { Message = "Une erreur est survenue lors de la création de la réservation." });
            }
        }

        // PUT: api/teacher/reservations/{id}
        [HttpPut("reservations/{id}")]
        public async Task<IActionResult> UpdateReservation(int id, [FromBody] ReservationUpdateDto updateDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                // Récupérer l'ID de l'utilisateur connecté
                var email = User.FindFirst(ClaimTypes.Name)?.Value;
                if (string.IsNullOrEmpty(email))
                {
                    return Unauthorized(new { Message = "Utilisateur non authentifié." });
                }

                var userId = await _roomService.GetUserIdFromEmail(email);
                if (userId == 0)
                {
                    return Unauthorized(new { Message = "Utilisateur non trouvé." });
                }

                var result = await _roomService.UpdateReservation(id, userId, updateDto);

                if (!result.Success)
                {
                    if (result.Message.Contains("non trouvée"))
                    {
                        return NotFound(new { Message = result.Message });
                    }
                    return BadRequest(new { Message = result.Message });
                }

                return Ok(new { Message = result.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de la mise à jour de la réservation {id}");
                return StatusCode(500, new { Message = "Une erreur est survenue lors de la mise à jour de la réservation." });
            }
        }

        // DELETE: api/teacher/reservations/{id}
        [HttpDelete("reservations/{id}")]
        public async Task<IActionResult> DeleteReservation(int id)
        {
            try
            {
                // Récupérer l'ID de l'utilisateur connecté
                var email = User.FindFirst(ClaimTypes.Name)?.Value;
                if (string.IsNullOrEmpty(email))
                {
                    return Unauthorized(new { Message = "Utilisateur non authentifié." });
                }

                var userId = await _roomService.GetUserIdFromEmail(email);
                if (userId == 0)
                {
                    return Unauthorized(new { Message = "Utilisateur non trouvé." });
                }

                var result = await _roomService.DeleteReservation(id, userId);

                if (!result.Success)
                {
                    if (result.Message.Contains("non trouvée"))
                    {
                        return NotFound(new { Message = result.Message });
                    }
                    return BadRequest(new { Message = result.Message });
                }

                return Ok(new { Message = result.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de la suppression de la réservation {id}");
                return StatusCode(500, new { Message = "Une erreur est survenue lors de la suppression de la réservation." });
            }
        }

        // GET: api/teacher/rooms/{id}/reservations
        [HttpGet("rooms/{id}/reservations")]
        public async Task<IActionResult> GetRoomReservations(
            int id,
            [FromQuery] string startDate,
            [FromQuery] string endDate)
        {
            try
            {
                // Vérifier si la salle existe
                var room = await _roomService.GetRoomById(id);
                if (room == null)
                {
                    return NotFound(new { Message = "Salle non trouvée." });
                }

                _logger.LogInformation("Récupération des réservations pour la salle {RoomId} avec filtres: startDate={StartDate}, endDate={EndDate}",
                    id, startDate, endDate);

                var filter = new ReservationFilterDto
                {
                    RoomId = id,
                    StartDate = DateUtils.ParseDateOnly(startDate),
                    EndDate = DateUtils.ParseDateOnly(endDate)
                };

                var reservations = await _roomService.GetReservations(filter);
                return Ok(reservations);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de la récupération des réservations pour la salle {id}");
                return StatusCode(500, new { Message = "Une erreur est survenue lors de la récupération des réservations." });
            }
        }

        #endregion
    }
}
