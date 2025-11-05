using System.Text.Json.Serialization;

namespace ControleurMonster_APIv1.Models
{
    public class Personnage
    {
        public int Id { get; set; }
        public string Nom { get; set; } = null!;
        public int Niveau { get; set; }
        public int Expirience { get; set; }
        public int PointVie { get; set; }
        public int PointVieMax { get; set; }
        public int Force { get; set; }
        public int Defense { get; set; }
        public int PositionX { get; set; }
        public int PositionY { get; set; }
        public int VilleDomicileX { get; set; } = 0;
        public int VilleDomicileY { get; set; } = 0;
        public int UtilisateurID { get; set; }  // FK vers Utilisateur
        public DateTime DateCreation { get; set; } = DateTime.Now;

        [JsonIgnore]               // évite les cycles JSON
        public Utilisateur Utilisateur { get; set; } = null!;

        public Personnage() { }

        public Personnage(string nom, int niveau, int expirience, int pointVie, int pointVieMax,
                          int force, int defense, int positionX, int positionY)
        {
            Nom = nom;
            Niveau = niveau;
            Expirience = expirience;
            PointVie = pointVie;
            PointVieMax = pointVieMax;
            Force = force;
            Defense = defense;
            PositionX = positionX;
            PositionY = positionY;
            VilleDomicileX = positionX;  // Par défaut, ville domicile = position initiale
            VilleDomicileY = positionY;  // Par défaut, ville domicile = position initiale
        }
    }
}
