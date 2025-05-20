using System;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace gest_abs.DTO
{
    public class StudentDTO
    {
        public int Id { get; set; }
        public int ClassId { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        
        // Utiliser JsonConverter pour DateOnly
        [JsonConverter(typeof(DateOnlyJsonConverter))]
        public DateOnly? Birthdate { get; set; }
    }

    public class StudentCreateDTO
    {
        [Required]
        public int UserId { get; set; }
        
        [Required]
        public int ClassId { get; set; }
        
        [Required]
        [StringLength(100)]
        public string FirstName { get; set; }
        
        [Required]
        [StringLength(100)]
        public string LastName { get; set; }
        
        // Utiliser JsonConverter pour DateOnly
        [JsonConverter(typeof(DateOnlyJsonConverter))]
        public DateOnly? Birthdate { get; set; }
    }

    public class StudentUpdateDTO
    {
        [Required]
        public int ClassId { get; set; }
        
        [Required]
        [StringLength(100)]
        public string FirstName { get; set; }
        
        [Required]
        [StringLength(100)]
        public string LastName { get; set; }
        
        // Utiliser JsonConverter pour DateOnly
        [JsonConverter(typeof(DateOnlyJsonConverter))]
        public DateOnly? Birthdate { get; set; }
    }
}
