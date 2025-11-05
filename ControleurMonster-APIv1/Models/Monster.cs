using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace APIv1_ControleurMonster.Models
{
    public class Monster
    {
        public int Id { get; set; }
        public int PokemonId { get; set; }
        public string Nom { get; set; }
        public int PointVieBase { get; set; }
        public int ForceBase { get; set; }
        public int DefenseBase { get; set; }
        public int ExperienceBase { get; set; }
        public string SpriteURL { get; set; }
        public string Type1 { get; set; }
        public string Type2 { get; set; }

        public Monster() { }

        public Monster(int id, int pokemonId, string nom, int pointVieBase, int forceBase, int defenseBase, int experienceBase, string spriteURL, string type1, string type2)
        {
            Id = id;
            PokemonId = pokemonId;
            Nom = nom;
            PointVieBase = pointVieBase;
            ForceBase = forceBase;
            DefenseBase = defenseBase;
            ExperienceBase = experienceBase;
            SpriteURL = spriteURL;
            Type1 = type1;
            Type2 = type2;
        }
    }
}
