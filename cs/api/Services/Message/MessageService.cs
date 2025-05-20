using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using GestionAbsences.DTO.Message;
using gest_abs.Models;

namespace GestionAbsences.Services.Message
{
    public class MessageService
    {
        private readonly GestionAbsencesContext _context;
        private readonly ILogger<MessageService> _logger;

        public MessageService(GestionAbsencesContext context, ILogger<MessageService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<List<ConversationDto>> GetConversationsAsync(int userId)
        {
            try
            {
                _logger.LogInformation($"Récupération des conversations pour l'utilisateur {userId}");

                // Récupérer tous les utilisateurs avec qui l'utilisateur actuel a échangé des messages
                var conversationUsers = await _context.Messages
                    .Where(m => m.SenderId == userId || m.ReceiverId == userId)
                    .Select(m => m.SenderId == userId ? m.ReceiverId : m.SenderId)
                    .Distinct()
                    .ToListAsync();

                var conversations = new List<ConversationDto>();

                foreach (var otherUserId in conversationUsers)
                {
                    // Récupérer le dernier message échangé avec cet utilisateur
                    var lastMessage = await _context.Messages
                        .Where(m => (m.SenderId == userId && m.ReceiverId == otherUserId) ||
                                    (m.SenderId == otherUserId && m.ReceiverId == userId))
                        .OrderByDescending(m => m.SentAt)
                        .FirstOrDefaultAsync();

                    // Récupérer le nombre de messages non lus
                    var unreadCount = await _context.Messages
                        .Where(m => m.SenderId == otherUserId && m.ReceiverId == userId && m.Status != "read")
                        .CountAsync();

                    // Récupérer les informations de l'autre utilisateur
                    var otherUser = await _context.Users.FindAsync(otherUserId);

                    if (otherUser != null && lastMessage != null)
                    {
                        conversations.Add(new ConversationDto
                        {
                            UserId = otherUserId,
                            UserName = otherUser.Email, // Utiliser l'email comme nom d'utilisateur
                            UserRole = otherUser.Role,
                            LastMessageDate = lastMessage.SentAt,
                            LastMessageContent = lastMessage.Content,
                            UnreadCount = unreadCount
                        });
                    }
                }

                return conversations.OrderByDescending(c => c.LastMessageDate).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de la récupération des conversations pour l'utilisateur {userId}");
                throw;
            }
        }

        public async Task<List<MessageDto>> GetConversationMessagesAsync(int userId, int otherUserId)
        {
            try
            {
                _logger.LogInformation($"Récupération des messages entre les utilisateurs {userId} et {otherUserId}");

                var messages = await _context.Messages
                    .Where(m => (m.SenderId == userId && m.ReceiverId == otherUserId) ||
                                (m.SenderId == otherUserId && m.ReceiverId == userId))
                    .OrderBy(m => m.SentAt)
                    .ToListAsync();

                // Récupérer les informations des utilisateurs
                var sender = await _context.Users.FindAsync(userId);
                var receiver = await _context.Users.FindAsync(otherUserId);

                if (sender == null || receiver == null)
                {
                    throw new Exception("Utilisateur introuvable");
                }

                // Marquer les messages non lus comme "delivered"
                var unreadMessages = messages
                    .Where(m => m.SenderId == otherUserId && m.ReceiverId == userId && m.Status == "sent")
                    .ToList();

                foreach (var message in unreadMessages)
                {
                    message.Status = "delivered";
                    message.DeliveredAt = DateTime.Now;
                }

                await _context.SaveChangesAsync();

                return messages.Select(m => new MessageDto
                {
                    Id = m.Id,
                    SenderId = m.SenderId,
                    SenderName = m.SenderId == userId ? sender.Email : receiver.Email,
                    SenderRole = m.SenderId == userId ? sender.Role : receiver.Role,
                    ReceiverId = m.ReceiverId,
                    ReceiverName = m.ReceiverId == userId ? sender.Email : receiver.Email,
                    ReceiverRole = m.ReceiverId == userId ? sender.Role : receiver.Role,
                    Content = m.Content,
                    SentAt = m.SentAt,
                    DeliveredAt = m.DeliveredAt,
                    ReadAt = m.ReadAt,
                    Status = m.Status
                }).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de la récupération des messages entre les utilisateurs {userId} et {otherUserId}");
                throw;
            }
        }

        public async Task<MessageDto> CreateMessageAsync(int senderId, MessageCreateDto messageDto)
        {
            try
            {
                _logger.LogInformation($"Création d'un message de {senderId} à {messageDto.ReceiverId}");

                var sender = await _context.Users.FindAsync(senderId);
                var receiver = await _context.Users.FindAsync(messageDto.ReceiverId);

                if (sender == null || receiver == null)
                {
                    throw new Exception("Expéditeur ou destinataire introuvable");
                }

                var message = new gest_abs.Models.Message
                {
                    SenderId = senderId,
                    ReceiverId = messageDto.ReceiverId,
                    Content = messageDto.Content,
                    SentAt = DateTime.Now,
                    Status = "sent"
                };

                _context.Messages.Add(message);
                await _context.SaveChangesAsync();

                return new MessageDto
                {
                    Id = message.Id,
                    SenderId = message.SenderId,
                    SenderName = sender.Email,
                    SenderRole = sender.Role,
                    ReceiverId = message.ReceiverId,
                    ReceiverName = receiver.Email,
                    ReceiverRole = receiver.Role,
                    Content = message.Content,
                    SentAt = message.SentAt,
                    DeliveredAt = message.DeliveredAt,
                    ReadAt = message.ReadAt,
                    Status = message.Status
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de la création d'un message de {senderId} à {messageDto.ReceiverId}");
                throw;
            }
        }

        public async Task<MessageDto> UpdateMessageStatusAsync(int messageId, int userId, MessageUpdateDto updateDto)
        {
            try
            {
                _logger.LogInformation($"Mise à jour du statut du message {messageId} par l'utilisateur {userId}");

                var message = await _context.Messages.FindAsync(messageId);

                if (message == null)
                {
                    throw new Exception("Message introuvable");
                }

                // Vérifier que l'utilisateur est bien le destinataire du message
                if (message.ReceiverId != userId)
                {
                    throw new Exception("Vous n'êtes pas autorisé à mettre à jour ce message");
                }

                message.Status = updateDto.Status;

                if (updateDto.Status == "delivered" && message.DeliveredAt == null)
                {
                    message.DeliveredAt = DateTime.Now;
                }
                else if (updateDto.Status == "read" && message.ReadAt == null)
                {
                    message.ReadAt = DateTime.Now;
                }

                await _context.SaveChangesAsync();

                // Récupérer les informations des utilisateurs
                var sender = await _context.Users.FindAsync(message.SenderId);
                var receiver = await _context.Users.FindAsync(message.ReceiverId);

                return new MessageDto
                {
                    Id = message.Id,
                    SenderId = message.SenderId,
                    SenderName = sender.Email,
                    SenderRole = sender.Role,
                    ReceiverId = message.ReceiverId,
                    ReceiverName = receiver.Email,
                    ReceiverRole = receiver.Role,
                    Content = message.Content,
                    SentAt = message.SentAt,
                    DeliveredAt = message.DeliveredAt,
                    ReadAt = message.ReadAt,
                    Status = message.Status
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de la mise à jour du statut du message {messageId}");
                throw;
            }
        }

        public async Task<List<UserDto>> GetUsersAsync(int currentUserId, string role = null)
        {
            try
            {
                _logger.LogInformation($"Récupération des utilisateurs pour l'utilisateur {currentUserId}, filtre par rôle: {role ?? "tous"}");

                IQueryable<User> query = _context.Users.Where(u => u.Id != currentUserId);

                if (!string.IsNullOrEmpty(role))
                {
                    query = query.Where(u => u.Role == role);
                }

                var users = await query.ToListAsync();

                return users.Select(u => new UserDto
                {
                    Id = u.Id,
                    Email = u.Email,
                    Role = u.Role
                }).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de la récupération des utilisateurs pour l'utilisateur {currentUserId}");
                throw;
            }
        }
    }
}
