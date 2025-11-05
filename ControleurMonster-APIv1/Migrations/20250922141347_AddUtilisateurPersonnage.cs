using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ControleurMonster_APIv1.Migrations
{
    /// <inheritdoc />
    public partial class AddUtilisateurPersonnage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "EstConnecte",
                table: "Utilisateur",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EstConnecte",
                table: "Utilisateur");
        }
    }
}
