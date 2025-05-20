using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using GestionAbsences.Services.Message;
using GestionAbsences.DTO.Message;
using gest_abs.Models;

namespace gest_abs.Controllers.Message
{
    [ApiController]
    [Route("api/message")]
    [Authorize]
    public class MessageController : ControllerBase
    {
        private readonly MessageService _messageService;
        private readonly ILogger<MessageController> _logger;
        private readonly GestionAbsencesContext _context;

        public MessageController(MessageService messageService, ILogger<MessageController> logger, GestionAbsencesContext context)
        {
            _messageService = messageService;
            _logger = logger;
            _context = context;
        }

        [HttpGet("conversations")]
        public async Task<IActionResult> GetConversations()
        {
            try
            {
                var userId = await GetUserIdFromEmail();
                var conversations = await _messageService.GetConversationsAsync(userId);
                return Ok(conversations);
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting conversations");
                return StatusCode(500, new { message = "Une erreur est survenue lors de la récupération des conversations." });
            }
        }

        [HttpGet("conversation/{userId}")]
        public async Task<IActionResult> GetConversation(int userId)
        {
            try
            {
                var currentUserId = await GetUserIdFromEmail();
                var messages = await _messageService.GetConversationMessagesAsync(currentUserId, userId);
                return Ok(messages);
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting conversation with user {userId}");
                return StatusCode(500, new { message = "Une erreur est survenue lors de la récupération de la conversation." });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateMessage([FromBody] MessageCreateDto messageDto)
        {
            try
            {
                var userId = await GetUserIdFromEmail();
                var message = await _messageService.CreateMessageAsync(userId, messageDto);
                return Ok(message);
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating message");
                return StatusCode(500, new { message = "Une erreur est survenue lors de la création du message." });
            }
        }

        [HttpPut("{messageId}/status")]
        public async Task<IActionResult> UpdateMessageStatus(int messageId, [FromBody] MessageUpdateDto updateDto)
        {
            try
            {
                var userId = await GetUserIdFromEmail();
                var message = await _messageService.UpdateMessageStatusAsync(messageId, userId, updateDto);
                return Ok(message);
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating message status for message {messageId}");
                return StatusCode(500, new { message = "Une erreur est survenue lors de la mise à jour du statut du message." });
            }
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetUsers([FromQuery] string role = null)
        {
            try
            {
                var userId = await GetUserIdFromEmail();
                var users = await _messageService.GetUsersAsync(userId, role);
                return Ok(users);
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting users");
                return StatusCode(500, new { message = "Une erreur est survenue lors de la récupération des utilisateurs." });
            }
        }

        private async Task<int> GetUserIdFromEmail()
        {
            var userEmail = User.FindFirst(ClaimTypes.Name)?.Value;
            if (string.IsNullOrEmpty(userEmail))
            {
                throw new UnauthorizedAccessException("Utilisateur non authentifié");
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == userEmail);
            if (user == null)
            {
                throw new UnauthorizedAccessException("Utilisateur introuvable");
            }

            return user.Id;
        }
    }
}
