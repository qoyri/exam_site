using System.ComponentModel.DataAnnotations;

namespace gest_abs.DTO
{
    public class UserLoginDTO
    {
        [Required]
        public string Username { get; set; }

        [Required]
        public string Password { get; set; }
    }

    public class AuthResponseDTO
    {
        public string Token { get; set; }
        public string Username { get; set; }
        public string Role { get; set; }
    }

    public class ErrorResponseDTO
    {
        public string Message { get; set; }
    }
}
