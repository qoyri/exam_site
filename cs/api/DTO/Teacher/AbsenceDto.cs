using System;
using System.ComponentModel.DataAnnotations;

namespace api.DTO.Teacher
{
    public class AbsenceDto
    {
        public int Id { get; set; }
        public int StudentId { get; set; }
        public string? StudentName { get; set; }
        public int? ClassId { get; set; }
        public string? ClassName { get; set; }
        public DateOnly AbsenceDate { get; set; }
        public string? Status { get; set; }
        public string? Reason { get; set; }
        public string? Document { get; set; }
    }

    public class AbsenceFilterDto
    {
        public int? ClassId { get; set; }
        public int? StudentId { get; set; }
        public DateOnly? StartDate { get; set; }
        public DateOnly? EndDate { get; set; }
        public string? Status { get; set; }
    }

    public class AbsenceCreateDto
    {
        [Required]
        public int StudentId { get; set; }
        
        [Required]
        public DateOnly AbsenceDate { get; set; }
        
        public string? Status { get; set; } = "en attente";
        
        public string? Reason { get; set; }
        
        public string? Document { get; set; }
    }

    public class AbsenceUpdateDto
    {
        public DateOnly AbsenceDate { get; set; }
        public string? Status { get; set; }
        public string? Reason { get; set; }
        public string? Document { get; set; }
    }
}
