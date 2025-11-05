public class InstanceMonstreDto
{
    public int MonstreId { get; set; }
    public string Nom { get; set; }
    public string SpriteUrl { get; set; }
    public int Niveau { get; set; }
    
    // Position sur la carte
    public int X { get; set; }
    public int Y { get; set; }
    
    // Statistiques calculées du monstre
    public int PointsVieActuels { get; set; }
    public int PointsVieMax { get; set; }
    public int Attaque { get; set; }
    public int Defense { get; set; }
}