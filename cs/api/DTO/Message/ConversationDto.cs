using System;

namespace GestionAbsences.DTO.Message
{
    public class ConversationDto
    {
        public int UserId { get; set; }
        public string UserName { get; set; }
        public string UserRole { get; set; }
        public DateTime LastMessageDate { get; set; }
        public string LastMessageContent { get; set; }
        public int UnreadCount { get; set; }
    }
}
