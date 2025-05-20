using System;

namespace gest_abs.DTO.Teacher
{
    public class TeacherProfileDto
    {
        public int Id { get; set; }
        public string Email { get; set; }
        public string Subject { get; set; }
        public string FullName { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class TeacherProfileUpdateDto
    {
        public string Subject { get; set; }
        public string CurrentPassword { get; set; }
        public string NewPassword { get; set; }
    }
}
