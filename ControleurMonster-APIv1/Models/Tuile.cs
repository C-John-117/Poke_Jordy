using Microsoft.EntityFrameworkCore;

namespace ControleurMonster_APIv1.Models
{
    [PrimaryKey(nameof(PositionX), nameof(PositionY))]
    public class Tuile
    {
        public int PositionX { get; set; }
        public int PositionY { get; set; }
        public TypeTuile Type { get; set; }
        public bool estTraversable { get; set; }

        public Tuile() { }
        public Tuile (int positionX, int positionY, TypeTuile type, bool estTraversable)
        {
            PositionX = positionX;
            PositionY = positionY;
            Type = type;
            this.estTraversable = estTraversable;
        }
    }
}
