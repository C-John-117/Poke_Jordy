namespace ControleurMonster_APIv1.Models
{
    public class ExplorationResponse
    {
        public int CenterX { get; set; }
        public int CenterY { get; set; }
        public List<TuileDto> Explored { get; set; } = new();    // rayon 1 (8 cases)
    }
}
