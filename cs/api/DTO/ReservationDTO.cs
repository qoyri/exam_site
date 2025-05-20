using System;
using System.ComponentModel.DataAnnotations;

namespace gest_abs.DTO
{
    public class ReservationDTO
    {
        public int Id { get; set; }
        public int RoomId { get; set; }
        public string RoomName { get; set; }
        public DateTime ReservationDate { get; set; }
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
    }

    public class ReservationCreateDTO
    {
        [Required]
        public int RoomId { get; set; }
        
        [Required]
        public DateTime ReservationDate { get; set; }
        
        [Required]
        public TimeSpan StartTime { get; set; }
        
        [Required]
        public TimeSpan EndTime { get; set; }
    }

    public class ReservationUpdateDTO
    {
        [Required]
        public DateTime ReservationDate { get; set; }
        
        [Required]
        public TimeSpan StartTime { get; set; }
        
        [Required]
        public TimeSpan EndTime { get; set; }
    }
}
