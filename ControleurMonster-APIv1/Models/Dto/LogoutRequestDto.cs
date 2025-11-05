using System.ComponentModel.DataAnnotations;

namespace ControleurMonster_APIv1.Models.Dto
{
    public class LogoutRequestDto
    {
        [Required(ErrorMessage = "L'email est requis")]
        [EmailAddress(ErrorMessage = "Format d'email invalide")]
        public string Email { get; set; } = string.Empty;
    }
}