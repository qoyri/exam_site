using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace gest_abs.Models
{
    [Table("points_config")]
    public class PointsConfig
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }
        
        [Column("absence_type")]
        public string AbsenceType { get; set; }
        
        [Column("points_value")]
        public int PointsValue { get; set; }
        
        [Column("description")]
        public string Description { get; set; }
        
        [Column("active")]
        public bool Active { get; set; }
        
        [Column("created_at")]
        public DateTime CreatedAt { get; set; }
        
        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; }
    }
}
