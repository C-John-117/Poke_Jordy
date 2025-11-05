using ControleurMonster_APIv1.Data.Context;
using ControleurMonster_APIv1.Models;
using ControleurMonster_APIv1.Models.Dto;
using ControleurMonster_APIv1.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ControleurMonster_APIv1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly MonsterContext _context;
        private const int MaxX = 50;
        private const int MaxY = 50;

        public AuthController(MonsterContext context)
        {
            _context = context;
        }

        // POST: api/Authentification
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        [Route("register")]
        public async Task<ActionResult<RegisterResponseDto>> PostUtilisateur([FromBody] RegisterModel model)
        {
            if (model.Email.ToString().Trim() == "" || model.Password.ToString().Trim() == "" || model.NomHeros.ToString().Trim() == "" || model.Pseudo.ToString().Trim() == "")
            {
                return BadRequest(ModelState);
            }
            // Vérifier si l'email est déjà utilisé
            var existingUser = await _context.Utilisateur.FirstOrDefaultAsync(u => u.Email == model.Email);
            if (existingUser != null) return Conflict("Cet email est déjà utilisé");

            var random = new Random();
            Tuile? tuileSpawn;
            TuileService _tuileService = new TuileService(_context);
            var x = 0; var y = 0;

            // trouver une tuile de type VILLE dans les bornes
            do
            {
                x = random.Next(0, MaxX + 1);
                y = random.Next(0, MaxY + 1);

                tuileSpawn = await _context.Tuiles.FindAsync(x, y);
                if (tuileSpawn == null)
                {
                    tuileSpawn = await _tuileService.GenererTuile(x, y);
                }
            }
            while (tuileSpawn.Type != TypeTuile.VILLE);

            // Hasher le mot de passe
            string hashedPassword = BCrypt.Net.BCrypt.HashPassword(model.Password);

            // créer l'utilisateur avec le mot de passe hashé
            var utilisateur = new Utilisateur(model.Email, model.Pseudo, hashedPassword);

            // créer le personnage (pas d’UtilisateurID ici : EF le pose via la relation)
            var personnage = new Personnage(
                model.NomHeros,
                niveau: 1,
                expirience: 0,
                pointVie: 100,
                pointVieMax: 100,
                force: 10,
                defense: 10,
                positionX: x,
                positionY: y
            );

            // lier
            utilisateur.Personnage = personnage;

            // persister (EF crée Utilisateur + Personnage et remplit UtilisateurID côté personnage)
            _context.Utilisateur.Add(utilisateur);
            await _context.SaveChangesAsync();

            // Retourne uniquement l'ID de l'utilisateur
            return Ok(new { UtilisateurId = utilisateur.Id });
        }

        [HttpPost]
        [Route("Login")]
        public async Task<ActionResult<LoginResponseDto>> Login([FromBody] LoginRequestDto model)
        {
            if (model.Email.ToString().Trim() == "" || model.Password.ToString().Trim() == "")
            {
                return BadRequest(ModelState);
            }
            Utilisateur? user = await _context.Utilisateur
                .Include(u => u.Personnage)
                .FirstOrDefaultAsync(u => u.Email == model.Email);

            if (user == null || !BCrypt.Net.BCrypt.Verify(model.Password, user.MotDePasse)) return Unauthorized("Email ou mot de passe incorrect");

            // Met à jour le statut de connexion
            user.EstConnecte = true;
            await _context.SaveChangesAsync();

            // Prépare la réponse avec les données de l'utilisateur et du personnage
            var response = new LoginResponseDto
            {
                Email = user.Email,
                Pseudo = user.Pseudo,
                Personnage = new PersonnageDto
                {
                    Nom = user.Personnage.Nom,
                    Niveau = user.Personnage.Niveau,
                    Experience = user.Personnage.Expirience,
                    PointVie = user.Personnage.PointVie,
                    PointVieMax = user.Personnage.PointVieMax,
                    Force = user.Personnage.Force,
                    Defense = user.Personnage.Defense,
                    PositionX = user.Personnage.PositionX,
                    PositionY = user.Personnage.PositionY
                }
            };
            return Ok(response);
        }

        [HttpPost("logout")]
        public async Task<IActionResult> Logout([FromBody] LogoutRequestDto model)
        {
            Utilisateur? user = await _context.Utilisateur
                .FirstOrDefaultAsync(u => u.Email == model.Email);

            if (user == null)
                return NotFound("Utilisateur non trouvé");

            // Met à jour le statut de connexion
            user.EstConnecte = false;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Déconnecté avec succès !" });
        }
    }
}
