using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace gest_abs.DTO
{
    public class ClassDTO
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public int StudentCount { get; set; }
    }

    public class ClassDetailDTO
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public List<StudentDTO> Students { get; set; }
    }
}
