using ControleurMonster_APIv1.Data.Context;
using ControleurMonster_APIv1.Models;
using ControleurMonster_APIv1.Models.Dto;
using ControleurMonster_APIv1.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ControleurMonster_APIv1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PersonnagesController : ControllerBase
    {
        private readonly MonsterContext context;
        private readonly TuileService tuileService;
        private readonly PersonnageService personnageService;

        // Limites de la carte (mets-les plus tard dans appsettings si besoin)
        private const int MinX = 0, MinY = 0, MaxX = 50, MaxY = 50;

        public PersonnagesController(MonsterContext context, TuileService tuileService, PersonnageService personnageService)
        {
            this.context = context;
            this.tuileService = tuileService;
            this.personnageService = personnageService;
        }

        // Méthode utilitaire pour vérifier qu'un utilisateur est connecté
        private async Task<(bool isValid, Utilisateur? user)> VerifyConnectedUser(string email)
        {
            if (string.IsNullOrEmpty(email))
                return (false, null);

            var user = await context.Utilisateur
                .Include(u => u.Personnage)
                .FirstOrDefaultAsync(u => u.Email == email);

            if (user == null || !user.EstConnecte)
                return (false, null);

            return (true, user);
        }

        [HttpPost("me")]
        public async Task<ActionResult<object>> GetMyPersonnage([FromBody] EmailRequestDto request)
        {
            var (isValid, user) = await VerifyConnectedUser(request.Email);
            if (!isValid || user == null)
                return Unauthorized("Utilisateur non connecté ou introuvable.");

            var perso = user.Personnage;
            if (perso == null)
                return NotFound("Personnage introuvable.");

            return Ok(new
            {
                id = perso.Id,
                nom = perso.Nom,
                hp = perso.PointVie,
                force = perso.Force,
                x = perso.PositionX,
                y = perso.PositionY
            });
        }

        // 2) POST /api/personnages/move
        //    Body: { "x": <int>, "y": <int> } → position CIBLE
        //    Règles: bornes + distance = 1 case (pas de vérif traversable ici)
        [HttpPost("move")]
        public async Task<ActionResult<ResultMoveDto>> Move([FromBody] MoveRequestDto request)
        {
            var (isValid, user) = await VerifyConnectedUser(request.Email);
            if (!isValid || user == null)
                return Unauthorized("Utilisateur non connecté ou introuvable.");

            var perso = user.Personnage;

            // Bornes carte
            if (request.X < MinX || request.X > MaxX || request.Y < MinY || request.Y > MaxY)
                return BadRequest("Destination hors limites.");

            // Distance 1 (voisinage 4-directions)
            var dx = Math.Abs(request.X - perso.PositionX);
            var dy = Math.Abs(request.Y - perso.PositionY);
            if (dx > 1 || dy > 1)
                return BadRequest("Déplacement non valide : une seule case adjacente (y compris diagonale).");

            // 3) vérifier traversabilité côté serveur (recalcul déterministe)
            Tuile tuileCible = await tuileService.GenererTuile(request.X, request.Y);
            if (tuileCible == null || !tuileCible.estTraversable)
                return BadRequest("Tuile non traversable");

            // 4) Vérifier la présence d'un monstre sur la tuile cible
            var instanceMonster = await context.InstanceMonster
                .Include(im => im.Monstre)
                .FirstOrDefaultAsync(im => im.PositionX == request.X && im.PositionY == request.Y);

            if (instanceMonster != null)
            {
                // Combat
                var result = await personnageService.Combat(perso, instanceMonster, request.X, request.Y);
                return Ok(result);
            }
            else
            {
                // Déplacement simple
                perso.PositionX = request.X;
                perso.PositionY = request.Y;
                
                // Vérifier si la tuile de destination est une ville
                if (tuileCible.Type == TypeTuile.VILLE)
                {
                    // Mettre à jour la ville domicile
                    perso.VilleDomicileX = request.X;
                    perso.VilleDomicileY = request.Y;
                }
                
                context.Personnage.Update(perso);
                await context.SaveChangesAsync();

                return Ok(new ResultMoveDto
                {
                    X = perso.PositionX,
                    Y = perso.PositionY,
                    CombatOutcome = null
                });
            }
        }

        [HttpPost("vision")]
        public async Task<ActionResult<ExplorationResponse>> Vision([FromBody] EmailRequestDto request)
        {
            var (isValid, user) = await VerifyConnectedUser(request.Email);
            if (!isValid || user == null)
                return Unauthorized("Utilisateur non connecté ou introuvable.");

            var perso = user.Personnage;

            // Utiliser la nouvelle fonction optimisée
            var explored = await tuileService.GenererTuilesDto(perso.PositionX, perso.PositionY, radius: 1, includeCenter: true);

            return Ok(new ExplorationResponse
            {
                CenterX = perso.PositionX,
                CenterY = perso.PositionY,
                Explored = explored,
            });
        }
    }
}
