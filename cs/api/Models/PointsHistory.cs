using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace gest_abs.Models
{
    [Table("points_history")]
    public class PointsHistory
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }
        
        [Column("student_id")]
        public int StudentId { get; set; }
        
        [Column("points_change")]
        public int PointsChange { get; set; }
        
        [Column("reason")]
        public string Reason { get; set; }
        
        [Column("absence_id")]
        public int? AbsenceId { get; set; }
        
        [Column("created_at")]
        public DateTime CreatedAt { get; set; }
        
        [ForeignKey("StudentId")]
        public virtual Student Student { get; set; }
        
        [ForeignKey("AbsenceId")]
        public virtual Absence Absence { get; set; }
    }
}
