using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RespiraLibere.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddPatientOwnerAndValidation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "OwnerUserId",
                table: "Patients",
                type: "TEXT",
                maxLength: 450,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Patients_OwnerUserId",
                table: "Patients",
                column: "OwnerUserId",
                unique: true,
                filter: "OwnerUserId IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Patients_OwnerUserId",
                table: "Patients");

            migrationBuilder.DropColumn(
                name: "OwnerUserId",
                table: "Patients");
        }
    }
}
