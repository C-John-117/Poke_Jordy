namespace ControleurMonster_APIv1.Models
{
    public class TuileDto
    {
        public int X { get; set; }
        public int Y { get; set; }
        public TypeTuile Type { get; set; }
        public bool EstTraversable { get; set; }
        public InstanceMonstreDto? InstanceMonstre { get; set; }
    }
}