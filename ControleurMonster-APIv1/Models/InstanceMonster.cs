using APIv1_ControleurMonster.Models;

namespace ControleurMonster_APIv1.Models
{
    public class InstanceMonster
    {
        public int Id { get; set; }
        public int PositionX { get; set; }
        public int PositionY { get; set; }
        public int MonsterId { get; set; }
        public int Niveau { get; set; }
        public int PointsDeVieMax { get; set; }
        public int PointsDeVieActuel { get; set; }
        public Monster Monstre { get; set; }

        public InstanceMonster() { }

        public InstanceMonster(int positionX, int positionY, Monster monster, int niveau)
        {
            PositionX = positionX;
            PositionY = positionY;
            MonsterId = monster.Id;
            Monstre = monster;
            Niveau = niveau;
            PointsDeVieMax = monster.PointVieBase + niveau;
            PointsDeVieActuel = PointsDeVieMax;
        }

        public int CalculerDegats()
        {
            return Monstre.ForceBase + Niveau;
        }

        public int CalculerDefense()
        {
            return Monstre.DefenseBase + Niveau;
        }
    }
}