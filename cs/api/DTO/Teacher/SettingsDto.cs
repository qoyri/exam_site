using System;

namespace gest_abs.DTO.Teacher
{
    public class SettingsDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Nickname { get; set; }
        public string ProfileImage { get; set; }
        public string Theme { get; set; }
        public string Language { get; set; }
        public bool NotificationsEnabled { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class UpdateSettingsDto
    {
        public string Nickname { get; set; }
        public string ProfileImage { get; set; }
        public string Theme { get; set; }
        public string Language { get; set; }
        public bool NotificationsEnabled { get; set; }
    }
}
