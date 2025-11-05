using System.ComponentModel.DataAnnotations;

namespace ControleurMonster_APIv1.Models.Dto
{
    public class EmailRequestDto
    {
        [Required(ErrorMessage = "L'email est requis")]
        [EmailAddress(ErrorMessage = "Format d'email invalide")]
        public string Email { get; set; } = string.Empty;
    }

    public class MoveRequestDto : EmailRequestDto
    {
        [Required]
        public int X { get; set; }
        
        [Required]
        public int Y { get; set; }
    }
}