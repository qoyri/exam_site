using System;
using System.ComponentModel.DataAnnotations;

namespace gest_abs.DTO
{
    public class AbsenceDTO
    {
        public int Id { get; set; }
        public int StudentId { get; set; }
        public string StudentName { get; set; }
        public int ClassId { get; set; }
        public string ClassName { get; set; }
        public DateTime AbsenceDate { get; set; }
        public string Status { get; set; }
        public string Reason { get; set; }
    }

    public class AbsenceFilterDTO
    {
        public int? ClassId { get; set; }
        public int? StudentId { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string Status { get; set; }
    }

    public class AbsenceCreateDTO
    {
        [Required]
        public int StudentId { get; set; }
        
        [Required]
        public DateTime AbsenceDate { get; set; }
        
        public string Status { get; set; }
        
        public string Reason { get; set; }
    }

    public class AbsenceUpdateDTO
    {
        public DateTime AbsenceDate { get; set; }
        public string Status { get; set; }
        public string Reason { get; set; }
    }

    public class TeacherProfileDTO
    {
        public int Id { get; set; }
        public string Email { get; set; }
        public string Subject { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class AbsenceReportDTO
    {
        public DateTime GeneratedAt { get; set; }
        public string ReportPeriod { get; set; }
        public int TotalAbsences { get; set; }
        public List<AbsenceDTO> Absences { get; set; }
        public Dictionary<string, int> AbsencesByClass { get; set; }
        public Dictionary<string, int> AbsencesByStudent { get; set; }
        public Dictionary<string, int> AbsencesByMonth { get; set; }
    }

    public class ReportFilterDTO
    {
        public int? ClassId { get; set; }
        public int? StudentId { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
    }
}
