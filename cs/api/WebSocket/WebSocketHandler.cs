using System;
using System.Collections.Concurrent;
using System.Net.WebSockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using Microsoft.Extensions.Configuration;
using System.Text.Json;
using gest_abs.DTO.Message;
using Microsoft.EntityFrameworkCore;
using gest_abs.Models;
using Microsoft.Extensions.DependencyInjection;

namespace gest_abs.WebSocket
{
    public class WebSocketHandler
    {
        private readonly ILogger<WebSocketHandler> _logger;
        private readonly IConfiguration _configuration;
        private readonly IServiceProvider _serviceProvider;
        private readonly ConcurrentDictionary<int, System.Net.WebSockets.WebSocket> _userSockets = new ConcurrentDictionary<int, System.Net.WebSockets.WebSocket>();

        public WebSocketHandler(ILogger<WebSocketHandler> logger, IConfiguration configuration, IServiceProvider serviceProvider)
        {
            _logger = logger;
            _configuration = configuration;
            _serviceProvider = serviceProvider;
        }

        public async Task HandleWebSocketAsync(System.Net.WebSockets.WebSocket webSocket, CancellationToken ct)
        {
            int? userId = null;

            try
            {
                _logger.LogInformation("Starting WebSocket handling");
                var buffer = new byte[1024 * 4];
                var receiveResult = await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), ct);
                _logger.LogInformation($"Received WebSocket message: {receiveResult.MessageType}, {receiveResult.Count} bytes");

                while (!receiveResult.CloseStatus.HasValue)
                {
                    if (receiveResult.MessageType == WebSocketMessageType.Text)
                    {
                        var messageText = Encoding.UTF8.GetString(buffer, 0, receiveResult.Count);
                        _logger.LogInformation($"Message reçu: {messageText}");

                        try
                        {
                            // Désérialiser le message
                            var jsonDocument = System.Text.Json.JsonDocument.Parse(messageText);
                            var root = jsonDocument.RootElement;

                            if (root.TryGetProperty("type", out var typeElement) && typeElement.GetString() == "auth")
                            {
                                // Authentification
                                if (root.TryGetProperty("token", out var tokenElement))
                                {
                                    var token = tokenElement.GetString();
                                    _logger.LogInformation($"Token reçu: {token?.Substring(0, Math.Min(10, token?.Length ?? 0))}...");
                                    
                                    userId = await GetUserIdFromToken(token);

                                    if (userId.HasValue)
                                    {
                                        _logger.LogInformation($"Utilisateur {userId.Value} authentifié");
                                        
                                        // Supprimer toute connexion existante pour cet utilisateur
                                        if (_userSockets.TryRemove(userId.Value, out var existingSocket) && existingSocket != webSocket)
                                        {
                                            try
                                            {
                                                await existingSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Nouvelle connexion établie", CancellationToken.None);
                                            }
                                            catch (Exception ex)
                                            {
                                                _logger.LogError(ex, $"Erreur lors de la fermeture de la connexion existante pour l'utilisateur {userId.Value}");
                                            }
                                        }
                                        
                                        // Ajouter la nouvelle connexion
                                        _userSockets[userId.Value] = webSocket;
                                        
                                        // Log des utilisateurs connectés
                                        _logger.LogInformation($"Utilisateurs connectés: {string.Join(", ", _userSockets.Keys)}");

                                        // Envoyer une confirmation d'authentification
                                        await SendToSocketAsync(webSocket, new
                                        {
                                            type = "auth_success",
                                            userId = userId.Value
                                        });
                                    }
                                    else
                                    {
                                        _logger.LogWarning("Token invalide");
                                        await SendToSocketAsync(webSocket, new
                                        {
                                            type = "auth_error",
                                            message = "Token invalide"
                                        });
                                    }
                                }
                            }
                            else if (userId.HasValue)
                            {
                                // Traiter les autres types de messages
                                if (root.TryGetProperty("type", out var msgTypeElement))
                                {
                                    var msgType = msgTypeElement.GetString();

                                    if (msgType == "message" && root.TryGetProperty("data", out var dataElement))
                                    {
                                        // Message à envoyer
                                        var receiverId = dataElement.GetProperty("receiverId").GetInt32();
                                        var content = dataElement.GetProperty("content").GetString();

                                        _logger.LogInformation($"Message de {userId.Value} à {receiverId}: {content}");

                                        // Créer un message dans la base de données
                                        using (var scope = _serviceProvider.CreateScope())
                                        {
                                            var dbContext = scope.ServiceProvider.GetRequiredService<GestionAbsencesContext>();
                                            
                                            var newMessage = new Message
                                            {
                                                SenderId = userId.Value,
                                                ReceiverId = receiverId,
                                                Content = content,
                                                SentAt = DateTime.Now,
                                                Status = "sent"
                                            };
                                            
                                            dbContext.Messages.Add(newMessage);
                                            await dbContext.SaveChangesAsync();
                                            
                                            // Récupérer les informations des utilisateurs
                                            var sender = await dbContext.Users.FindAsync(userId.Value);
                                            var receiver = await dbContext.Users.FindAsync(receiverId);
                                            
                                            if (sender != null && receiver != null)
                                            {
                                                var messageDto = new
                                                {
                                                    id = newMessage.Id,
                                                    senderId = newMessage.SenderId,
                                                    senderName = sender.Email,
                                                    senderRole = sender.Role,
                                                    receiverId = newMessage.ReceiverId,
                                                    receiverName = receiver.Email,
                                                    receiverRole = receiver.Role,
                                                    content = newMessage.Content,
                                                    sentAt = newMessage.SentAt,
                                                    deliveredAt = newMessage.DeliveredAt,
                                                    readAt = newMessage.ReadAt,
                                                    status = newMessage.Status
                                                };
                                                
                                                // Envoyer le message au destinataire s'il est connecté
                                                if (_userSockets.TryGetValue(receiverId, out var receiverSocket))
                                                {
                                                    _logger.LogInformation($"Envoi du message à l'utilisateur {receiverId}");
                                                    await SendToSocketAsync(receiverSocket, new
                                                    {
                                                        type = "message",
                                                        message = messageDto
                                                    });
                                                }
                                                else
                                                {
                                                    _logger.LogInformation($"L'utilisateur {receiverId} n'est pas connecté");
                                                }
                                                
                                                // Envoyer une confirmation à l'expéditeur
                                                await SendToSocketAsync(webSocket, new
                                                {
                                                    type = "message_sent",
                                                    message = messageDto
                                                });
                                            }
                                        }
                                    }
                                    else if (msgType == "status_update" && root.TryGetProperty("data", out var statusDataElement))
                                    {
                                        // Mise à jour de statut
                                        var messageId = statusDataElement.GetProperty("messageId").GetInt32();
                                        var status = statusDataElement.GetProperty("status").GetString();
                                        
                                        using (var scope = _serviceProvider.CreateScope())
                                        {
                                            var dbContext = scope.ServiceProvider.GetRequiredService<GestionAbsencesContext>();
                                            
                                            var existingMessage = await dbContext.Messages.FindAsync(messageId);
                                            if (existingMessage != null)
                                            {
                                                existingMessage.Status = status;
                                                
                                                if (status == "delivered" && existingMessage.DeliveredAt == null)
                                                {
                                                    existingMessage.DeliveredAt = DateTime.Now;
                                                }
                                                else if (status == "read" && existingMessage.ReadAt == null)
                                                {
                                                    existingMessage.ReadAt = DateTime.Now;
                                                }
                                                
                                                await dbContext.SaveChangesAsync();
                                                
                                                // Envoyer la mise à jour à l'expéditeur s'il est connecté
                                                if (_userSockets.TryGetValue(existingMessage.SenderId, out var senderSocket))
                                                {
                                                    await SendToSocketAsync(senderSocket, new
                                                    {
                                                        type = "status_update",
                                                        update = new
                                                        {
                                                            messageId,
                                                            status,
                                                            updatedAt = DateTime.Now
                                                        }
                                                    });
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Error processing WebSocket message");
                        }
                    }

                    buffer = new byte[1024 * 4];
                    receiveResult = await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), ct);
                }

                // Fermeture propre
                await webSocket.CloseAsync(
                    receiveResult.CloseStatus.Value,
                    receiveResult.CloseStatusDescription,
                    ct);
                
                _logger.LogInformation("WebSocket closed gracefully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error handling WebSocket connection");
            }
            finally
            {
                // Supprimer l'utilisateur de la liste des connexions
                if (userId.HasValue)
                {
                    _userSockets.TryRemove(userId.Value, out _);
                    _logger.LogInformation($"Utilisateur {userId.Value} déconnecté");
                    _logger.LogInformation($"Utilisateurs connectés restants: {string.Join(", ", _userSockets.Keys)}");
                }
            }
        }

        public async Task SendMessage(MessageDto messageDto)
        {
            _logger.LogInformation($"Tentative d'envoi de message à l'utilisateur {messageDto.ReceiverId}");
            
            if (_userSockets.TryGetValue(messageDto.ReceiverId, out var socket))
            {
                _logger.LogInformation($"Envoi du message à l'utilisateur {messageDto.ReceiverId}");
                await SendToSocketAsync(socket, new
                {
                    type = "message",
                    message = messageDto
                });
            }
            else
            {
                _logger.LogInformation($"L'utilisateur {messageDto.ReceiverId} n'est pas connecté");
            }
        }

        public async Task SendMessageStatusUpdate(int messageId, int senderId, int receiverId, string status)
        {
            if (_userSockets.TryGetValue(senderId, out var socket))
            {
                await SendToSocketAsync(socket, new
                {
                    type = "status_update",
                    update = new
                    {
                        messageId,
                        receiverId,
                        status,
                        updatedAt = DateTime.Now
                    }
                });
            }
        }

        public bool IsUserConnected(int userId)
        {
            return _userSockets.ContainsKey(userId);
        }

        private async Task SendToSocketAsync(System.Net.WebSockets.WebSocket socket, object data)
        {
            if (socket.State != WebSocketState.Open)
            {
                _logger.LogWarning("Tentative d'envoi à un socket fermé");
                return;
            }

            var json = JsonConvert.SerializeObject(data);
            var bytes = Encoding.UTF8.GetBytes(json);
            
            try
            {
                await socket.SendAsync(
                    new ArraySegment<byte>(bytes),
                    WebSocketMessageType.Text,
                    true,
                    CancellationToken.None);
                
                _logger.LogInformation($"Message envoyé: {json}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de l'envoi du message WebSocket");
            }
        }

        private async Task<int?> GetUserIdFromToken(string token)
        {
            try
            {
                _logger.LogInformation("Validating token...");
                
                if (string.IsNullOrEmpty(token))
                {
                    _logger.LogWarning("Token is null or empty");
                    return null;
                }
                
                // Récupérer la clé JWT depuis la configuration
                var jwtSettings = _configuration.GetSection("JwtSettings");
                var key = jwtSettings["Key"];
                
                if (string.IsNullOrEmpty(key))
                {
                    // Essayer avec l'autre format de configuration
                    key = _configuration["Jwt:Key"];
                    
                    if (string.IsNullOrEmpty(key))
                    {
                        _logger.LogError("JWT key is not configured in JwtSettings:Key or Jwt:Key");
                        
                        // Afficher toutes les clés de configuration disponibles pour le débogage
                        foreach (var configSection in _configuration.GetChildren())
                        {
                            _logger.LogInformation($"Configuration section: {configSection.Key}");
                            foreach (var configItem in configSection.GetChildren())
                            {
                                _logger.LogInformation($"  {configItem.Key} = {configItem.Value}");
                            }
                        }
                        
                        return null;
                    }
                }
                
                _logger.LogInformation($"Using JWT key: {key.Substring(0, Math.Min(5, key.Length))}...");
                
                var tokenHandler = new JwtSecurityTokenHandler();
                var validationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
                    ValidateIssuer = false,
                    ValidateAudience = false,
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero
                };
                
                try
                {
                    // Valider le token
                    var principal = tokenHandler.ValidateToken(token, validationParameters, out var validatedToken);
                    
                    // Récupérer l'ID utilisateur depuis les claims
                    var userIdClaim = principal.FindFirst("userId") ?? principal.FindFirst("nameid");
                    if (userIdClaim != null && int.TryParse(userIdClaim.Value, out var userId))
                    {
                        _logger.LogInformation($"Token validated successfully for user ID: {userId}");
                        return userId;
                    }
                    
                    // Si l'ID n'est pas disponible, essayer de récupérer l'email
                    var emailClaim = principal.FindFirst(ClaimTypes.Name) ?? principal.FindFirst(ClaimTypes.Email);
                    if (emailClaim != null)
                    {
                        _logger.LogInformation($"Email found in token: {emailClaim.Value}");
                        
                        // Rechercher l'utilisateur dans la base de données
                        using (var scope = _serviceProvider.CreateScope())
                        {
                            var dbContext = scope.ServiceProvider.GetRequiredService<GestionAbsencesContext>();
                            var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Email == emailClaim.Value);
                            
                            if (user != null)
                            {
                                _logger.LogInformation($"User found in database: ID = {user.Id}");
                                return user.Id;
                            }
                        }
                    }
                    
                    _logger.LogWarning("No user ID or email found in token");
                    return null;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error validating token");
                    return null;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetUserIdFromToken");
                return null;
            }
        }
    }
}
