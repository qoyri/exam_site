using System;

namespace gest_abs.DTO.Points
{
    public class PointsHistoryDto
    {
        public int Id { get; set; }
        public int StudentId { get; set; }
        public int PointsChange { get; set; }
        public string Reason { get; set; }
        public int? AbsenceId { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
