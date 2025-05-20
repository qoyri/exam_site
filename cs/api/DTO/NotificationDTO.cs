using System;
using System.ComponentModel.DataAnnotations;

namespace gest_abs.DTO
{
    public class NotificationDTO
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Message { get; set; }
        public string Type { get; set; }
        public bool IsRead { get; set; }
        public DateTime? CreatedAt { get; set; }
    }

    public class NotificationCreateDTO
    {
        [Required]
        public int UserId { get; set; }
        
        public string Title { get; set; }
        
        [Required]
        public string Message { get; set; }
        
        public string Type { get; set; }
    }
}
