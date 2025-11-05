namespace ControleurMonster_APIv1.Models
{
    public class Utilisateur
    {
        public int Id { get; set; }
        public string Email { get; set; }
        public string Pseudo { get; set; }
        public string MotDePasse { get; set; }
        public DateTime DateInscription { get; set; }
        public Personnage Personnage { get; set; } = null!;
        public bool EstConnecte { get; set; } = false;

        public Utilisateur(string email, string pseudo, string motDePasse) 
        {
            Email = email;
            Pseudo = pseudo;
            MotDePasse = motDePasse;
            DateInscription = DateTime.Now;
        }
    }
}
