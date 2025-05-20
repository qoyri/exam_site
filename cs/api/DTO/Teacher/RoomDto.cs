using System.ComponentModel.DataAnnotations;

namespace gest_abs.DTO.Teacher
{
    public class RoomDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public int? Capacity { get; set; }
        public string Location { get; set; }
    }
}
