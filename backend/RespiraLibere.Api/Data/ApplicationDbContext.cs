using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using RespiraLibere.Api.Models;

namespace RespiraLibere.Api.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<Patient> Patients { get; set; } = null!;
    public DbSet<RevokedToken> RevokedTokens { get; set; } = null!;
    public DbSet<Measurement> Measurements { get; set; } = null!;
    public DbSet<SymptomEntry> Symptoms { get; set; } = null!;
    public DbSet<TriggerEntry> Triggers { get; set; } = null!;
    public DbSet<Medication> Medications { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Właściciel pacjenta jest unikalny, jeśli ustawiony (dla roli Patient)
        builder.Entity<Patient>()
            .HasIndex(p => p.OwnerUserId)
            .IsUnique()
            .HasFilter("OwnerUserId IS NOT NULL");
    }
}
