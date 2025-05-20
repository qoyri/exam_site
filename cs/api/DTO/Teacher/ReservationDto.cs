using System;
using System.ComponentModel.DataAnnotations;

namespace gest_abs.DTO.Teacher
{
    public class ReservationDto
    {
        public int Id { get; set; }
        public int RoomId { get; set; }
        public string RoomName { get; set; }
        public DateOnly ReservationDate { get; set; }
        public TimeOnly StartTime { get; set; }
        public TimeOnly EndTime { get; set; }
        public string UserEmail { get; set; }
    }

    public class ReservationFilterDto
    {
        public int? RoomId { get; set; }
        public DateOnly? StartDate { get; set; }
        public DateOnly? EndDate { get; set; }
    }

    public class ReservationCreateDto
    {
        [Required]
        public int RoomId { get; set; }
        
        [Required]
        public DateOnly ReservationDate { get; set; }
        
        [Required]
        public TimeOnly StartTime { get; set; }
        
        [Required]
        public TimeOnly EndTime { get; set; }
    }

    public class ReservationUpdateDto
    {
        [Required]
        public DateOnly ReservationDate { get; set; }
        
        [Required]
        public TimeOnly StartTime { get; set; }
        
        [Required]
        public TimeOnly EndTime { get; set; }
    }
}
