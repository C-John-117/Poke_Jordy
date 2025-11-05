namespace ControleurMonster_APIv1.Models.Dto
{
    public class LoginResponseDto
    {
        public string Email { get; set; } = string.Empty;
        public string Pseudo { get; set; } = string.Empty;
        public PersonnageDto Personnage { get; set; } = new PersonnageDto();
    }

    public class PersonnageDto
    {
        public string Nom { get; set; } = string.Empty;
        public int Niveau { get; set; }
        public int Experience { get; set; }
        public int PointVie { get; set; }
        public int PointVieMax { get; set; }
        public int Force { get; set; }
        public int Defense { get; set; }
        public int PositionX { get; set; }
        public int PositionY { get; set; }
    }
}