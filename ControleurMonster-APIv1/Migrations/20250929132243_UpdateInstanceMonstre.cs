using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ControleurMonster_APIv1.Migrations
{
    /// <inheritdoc />
    public partial class UpdateInstanceMonstre : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "MonstreID",
                table: "InstanceMonstre",
                newName: "MonsterId");

            migrationBuilder.CreateIndex(
                name: "IX_InstanceMonstre_MonsterId",
                table: "InstanceMonstre",
                column: "MonsterId");

            migrationBuilder.AddForeignKey(
                name: "FK_InstanceMonstre_Monster_MonsterId",
                table: "InstanceMonstre",
                column: "MonsterId",
                principalTable: "Monster",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_InstanceMonstre_Monster_MonsterId",
                table: "InstanceMonstre");

            migrationBuilder.DropIndex(
                name: "IX_InstanceMonstre_MonsterId",
                table: "InstanceMonstre");

            migrationBuilder.RenameColumn(
                name: "MonsterId",
                table: "InstanceMonstre",
                newName: "MonstreID");
        }
    }
}
