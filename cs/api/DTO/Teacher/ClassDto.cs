using System;
using System.Collections.Generic;

namespace api.DTO.Teacher
{
    public class ClassDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public int StudentCount { get; set; }
    }

    public class ClassDetailDto : ClassDto
    {
        public List<StudentDto> Students { get; set; }
    }

    public class StudentDto
    {
        public int Id { get; set; }
        public int ClassId { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public DateOnly? Birthdate { get; set; }
    }
}
