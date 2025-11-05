namespace ControleurMonster_APIv1.Services
{
    using System.Threading.Tasks;
    using ControleurMonster_APIv1.Data.Context;
    using ControleurMonster_APIv1.Models;
    using Microsoft.EntityFrameworkCore;

    public class PersonnageService
    {
        private readonly MonsterContext _context;
        const int ExperiencePourNiveauSup = 1000;
        private readonly MonsterService _monsterService;
        private readonly TuileService _tuileService;

        public PersonnageService(MonsterContext context, MonsterService monsterService, TuileService tuileService)
        {
            _context = context;
            _monsterService = monsterService;
            _tuileService = tuileService;
        }

        public async Task<ResultMoveDto> Combat(Personnage personnage, InstanceMonster instanceMonster, int PositionX, int PositionY)
        {
            var random = new Random();
            double facteurAleatoireJoueur = 0.8 + (random.NextDouble() * 0.45); // 0.8 à 1.25
            double facteurAleatoireMonstre = 0.8 + (random.NextDouble() * 0.45); // 0.8 à 1.25

            // Calcul des dégâts
            int degatsJoueur = Math.Max(0, (int)((personnage.Force - instanceMonster.CalculerDefense()*0.5) * facteurAleatoireJoueur));
            int degatsMonstre = Math.Max(0, (int)((instanceMonster.CalculerDegats() - personnage.Defense) * facteurAleatoireMonstre));

            // Application des dégâts
            Console.WriteLine($"Avant combat: Joueur PV={personnage.PointVie}, Monstre PV={instanceMonster.PointsDeVieActuel}, Dégâts Joueur={degatsJoueur}, Dégâts Monstre={degatsMonstre}");
            instanceMonster.PointsDeVieActuel -= degatsJoueur;
            Console.WriteLine($"Après attaque du joueur: Monstre PV={instanceMonster.PointsDeVieActuel}");
            personnage.PointVie -= degatsMonstre;
            CombatOutcomeDto.combatResult result = CombatOutcomeDto.combatResult.NONE;
            
            if (instanceMonster.PointsDeVieActuel <= 0)
            {
                // Monstre vaincu
                int experienceGagnee = CalculerExperienceGagnee(instanceMonster);
                personnage.Expirience += experienceGagnee;
                CheckAndHandleLevelUp(personnage);
                personnage.PositionX = PositionX;
                personnage.PositionY = PositionY;
                _context.InstanceMonster.Remove(instanceMonster);
                result = CombatOutcomeDto.combatResult.VICTORY;
            }
            else
            {
                // Monstre survit - garder ses PV réduits
                _context.InstanceMonster.Update(instanceMonster);
            }
            
            if (personnage.PointVie <= 0)
            {
                // Joueur vaincu
                personnage.PointVie = personnage.PointVieMax;
                personnage.PositionX = personnage.VilleDomicileX;
                personnage.PositionY = personnage.VilleDomicileY;
                result = CombatOutcomeDto.combatResult.DEFEAT;
            }
            
            _context.Personnage.Update(personnage);
            await _context.SaveChangesAsync();
            
            // Générer de nouveaux monstres si besoin (APRÈS sauvegarde)
            if (result == CombatOutcomeDto.combatResult.VICTORY)
            {
                await _monsterService.CheckAndGenerateMonsters();
            }

            return new ResultMoveDto
            {
                X = personnage.PositionX,
                Y = personnage.PositionY,
                CombatOutcome = new CombatOutcomeDto
                {
                    Result = result,
                    Niveau = personnage.Niveau,
                    Experience = personnage.Expirience,
                    Force = personnage.Force,
                    Defense = personnage.Defense,
                    PointVie = personnage.PointVie,
                    PointVieMax = personnage.PointVieMax,
                    InstanceMonstre = _tuileService.ConvertirInstanceMonstreVersDto(instanceMonster)
                }
            };
        }

        private int CalculerExperienceGagnee(InstanceMonster instanceMonster)
        {
            return (instanceMonster.Monstre.ExperienceBase + instanceMonster.Niveau) * 10;
        }
        
        private void CheckAndHandleLevelUp(Personnage personnage)
        {
            while (personnage.Expirience >= ExperiencePourNiveauSup)
            {
                personnage.Expirience -= ExperiencePourNiveauSup;
                personnage.Niveau += 1;
                personnage.Force += 1;
                personnage.Defense += 1;
                personnage.PointVieMax += 1;
                personnage.PointVie = personnage.PointVieMax;
            }
        }
    }
}