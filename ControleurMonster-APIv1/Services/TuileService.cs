using ControleurMonster_APIv1.Models;
using ControleurMonster_APIv1.Data.Context;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace ControleurMonster_APIv1.Services
{
    public class TuileService
    {
        private const int MinX = 0, MinY = 0, MaxX = 50, MaxY = 50;
        private readonly MonsterContext _context;

        public TuileService(MonsterContext context)
        {
            _context = context;
        }

        public async Task<Tuile> GenererTuile(int x, int y)
        {
            // D'abord, vérifier si la tuile existe déjà en base de données
            var tuileExistante = await _context.Tuiles.FindAsync(x, y);
            if (tuileExistante != null)
            {
                return tuileExistante;
            }

            // Si elle n'existe pas, la générer
            var typeTuile = ChoisirType();
            bool estTraversable = true;
            if (typeTuile == TypeTuile.EAU || typeTuile == TypeTuile.MONTAGNE) { estTraversable = false; }

            var nouvelleTuile = new Tuile(x, y, typeTuile, estTraversable);

            // Sauvegarder la nouvelle tuile en base de données
            _context.Tuiles.Add(nouvelleTuile);
            await _context.SaveChangesAsync();

            return nouvelleTuile;
        }

        private TypeTuile ChoisirType()
        {
            Random rnd = new Random();
            int nbAleatoire = rnd.Next(1, 101);
            if (nbAleatoire <= 20) { return TypeTuile.HERBE; }
            else if (nbAleatoire <= 30) { return TypeTuile.EAU; }
            else if (nbAleatoire <= 45) { return TypeTuile.MONTAGNE; }
            else if (nbAleatoire <= 60) { return TypeTuile.FORET; }
            else if (nbAleatoire <= 65) { return TypeTuile.VILLE; }
            else return TypeTuile.ROUTE;
        }

        /// <summary>
        /// Convertit un InstanceMonster en InstanceMonstreDto (version publique)
        /// </summary>
        public InstanceMonstreDto ConvertirInstanceMonstreVersDto(InstanceMonster instanceMonstre)
        {
            return new InstanceMonstreDto
            {
                MonstreId = instanceMonstre.Id,
                Nom = instanceMonstre.Monstre.Nom,
                SpriteUrl = instanceMonstre.Monstre.SpriteURL,
                Niveau = instanceMonstre.Niveau,
                X = instanceMonstre.PositionX,
                Y = instanceMonstre.PositionY,
                PointsVieActuels = instanceMonstre.PointsDeVieActuel,
                PointsVieMax = instanceMonstre.PointsDeVieMax,
                Attaque = instanceMonstre.CalculerDegats(),
                Defense = instanceMonstre.CalculerDefense()
            };
        }

        public async Task GenererMap()
        {
            for (int y = MinY; y <= MaxY; y++)
            {
                for (int x = MinX; x <= MaxX; x++)
                {
                    await GenererTuile(x, y);
                }
            }
        }

        public async Task<int> ObtenirDistanceVilleLaPlusProche(int x, int y)
        {
            int distanceMin = int.MaxValue;

            var villes = await Task.Run(() => _context.Tuiles.Where(t => t.Type == TypeTuile.VILLE).ToList());

            foreach (var ville in villes)
            {
            int distance = Math.Abs(ville.PositionX - x) + Math.Abs(ville.PositionY - y);
            if (distance < distanceMin)
            {
                distanceMin = distance;
            }
            }

            return distanceMin == int.MaxValue ? -1 : distanceMin;
        }

        internal async Task<bool> EstTuileVideTraversableEtNonVille(int x, int y)
        {
            var tuile = await GenererTuile(x, y);

            var personnageSurTuile = _context.Personnage.Any(p => p.PositionX == x && p.PositionY == y);
            if (personnageSurTuile)
            return false;

            var instanceMonsterSurTuile = _context.InstanceMonster.Any(im => im.PositionX == x && im.PositionY == y);
            if (instanceMonsterSurTuile)
            return false;

            if (tuile.Type == TypeTuile.VILLE)
            return false;

            return tuile.estTraversable;
        }

        public async Task<TuileDto> GenererTuileDto(int x, int y)
        {
            // Générer ou récupérer la tuile
            var tuile = await GenererTuile(x, y);
            
            // Créer le DTO de base
            var tuileDto = new TuileDto
            {
                X = tuile.PositionX,
                Y = tuile.PositionY,
                Type = tuile.Type,
                EstTraversable = tuile.estTraversable,
                InstanceMonstre = null
            };

            // Vérifier s'il y a un monstre sur cette tuile
            var monstre = await _context.InstanceMonster
                .Include(im => im.Monstre)
                .FirstOrDefaultAsync(m => m.PositionX == x && m.PositionY == y);
                
            if (monstre != null)
            {
                tuileDto.InstanceMonstre = ConvertirInstanceMonstreVersDto(monstre);
            }

            return tuileDto;
        }

        /// <summary>
        /// Génère une liste de TuileDto dans un rayon donné (version optimisée)
        /// </summary>
        public async Task<List<TuileDto>> GenererTuilesDto(int centerX, int centerY, int radius, bool includeCenter = true)
        {
            var tuilesDto = new List<TuileDto>();

            // Pré-charger tous les monstres dans la zone pour éviter les requêtes multiples
            var monstresInZone = await _context.InstanceMonster
                .Include(im => im.Monstre)
                .Where(im => im.PositionX >= Math.Max(MinX, centerX - radius) &&
                           im.PositionX <= Math.Min(MaxX, centerX + radius) &&
                           im.PositionY >= Math.Max(MinY, centerY - radius) &&
                           im.PositionY <= Math.Min(MaxY, centerY + radius))
                .ToListAsync();

            for (int y = Math.Max(MinY, centerY - radius); y <= Math.Min(MaxY, centerY + radius); y++)
            {
                for (int x = Math.Max(MinX, centerX - radius); x <= Math.Min(MaxX, centerX + radius); x++)
                {
                    int dx = Math.Abs(x - centerX);
                    int dy = Math.Abs(y - centerY);
                    int chebyshev = Math.Max(dx, dy);
                    
                    if (chebyshev == 0 && !includeCenter) continue;
                    if (chebyshev <= radius)
                    {
                        var tuileDto = await GenererTuileDto(x, y);
                        tuilesDto.Add(tuileDto);
                    }
                }
            }

            return tuilesDto;
        }
    }
}
