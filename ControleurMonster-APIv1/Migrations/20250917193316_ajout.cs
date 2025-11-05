using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ControleurMonster_APIv1.Migrations
{
    /// <inheritdoc />
    public partial class ajout : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PersonnageId",
                table: "Utilisateur");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "PersonnageId",
                table: "Utilisateur",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }
    }
}
