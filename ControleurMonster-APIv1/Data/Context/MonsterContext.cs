using APIv1_ControleurMonster.Models;
using ControleurMonster_APIv1.Models;
using Microsoft.EntityFrameworkCore;

namespace ControleurMonster_APIv1.Data.Context
{
    public class MonsterContext : DbContext
    {
        public DbSet<Monster> Monster { get; set; }
        public DbSet<Tuile> Tuiles { get; set; }
        public DbSet<Utilisateur> Utilisateur { get; set; }
        public MonsterContext(DbContextOptions<MonsterContext> options) : base(options) { }
        public DbSet<Personnage> Personnage { get; set; } = default!;
        public DbSet<InstanceMonster> InstanceMonster { get; set; } = default!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Relation 1–1 : Utilisateur (principal) ↔ Personnage (dépendant)
            modelBuilder.Entity<Utilisateur>()
                .HasOne(u => u.Personnage)
                .WithOne(p => p.Utilisateur)
                .HasForeignKey<Personnage>(p => p.UtilisateurID)
                .OnDelete(DeleteBehavior.Cascade); // optionnel
        }

    }
}
