using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace gest_abs.Models
{
    [Table("settings")]
    public class Settings
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("user_id")]
        public int UserId { get; set; }

        [Column("nickname")]
        [StringLength(50)]
        public string Nickname { get; set; }

        [Column("profile_image")]
        public string ProfileImage { get; set; }

        [Column("theme")]
        [StringLength(20)]
        public string Theme { get; set; } = "light";

        [Column("language")]
        [StringLength(10)]
        public string Language { get; set; } = "fr";

        [Column("notifications_enabled")]
        public bool NotificationsEnabled { get; set; } = true;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.Now;

        // Relation avec l'utilisateur
        [ForeignKey("UserId")]
        public virtual User User { get; set; }
    }
}
