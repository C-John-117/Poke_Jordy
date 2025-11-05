using System.Text.Json.Serialization;

public class ResultMoveDto
{

    public int X { get; set; }
    public int Y { get; set; }
    public CombatOutcomeDto? CombatOutcome { get; set; }
}

public class CombatOutcomeDto
{
    public enum combatResult
    {
        NONE,
        VICTORY,
        DEFEAT
    }
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public combatResult Result { get; set; }
    public int Niveau { get; set; }
    public int Experience { get; set; }
    public int Force { get; set; }
    public int Defense { get; set; }
    public int PointVie { get; set; }
    public int PointVieMax { get; set; }
    public InstanceMonstreDto InstanceMonstre { get; set; }
}