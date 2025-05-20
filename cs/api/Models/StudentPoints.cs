using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace gest_abs.Models
{
    [Table("student_points")]
    public class StudentPoints
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }
        
        [Column("student_id")]
        public int StudentId { get; set; }
        
        [Column("points")]
        public int Points { get; set; }
        
        [Column("last_updated")]
        public DateTime LastUpdated { get; set; }
        
        [ForeignKey("StudentId")]
        public virtual Student Student { get; set; }
    }
}
