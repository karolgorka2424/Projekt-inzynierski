using Microsoft.AspNetCore.Identity;
using RespiraLibere.Api.Data;
using RespiraLibere.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace RespiraLibere.Api;

public static class AdminSeeder
{
    public static async Task SeedAsync(IServiceProvider services, IConfiguration config)
    {
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
        var db = services.GetRequiredService<ApplicationDbContext>();

        var adminSection = config.GetSection("Admin");
        var email = adminSection["Email"];
        var userName = adminSection["UserName"];
        var password = adminSection["Password"];

        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(userName) || string.IsNullOrWhiteSpace(password))
        {
            return; // No seeding if config not provided
        }

        var roles = new[] { "Admin", "Doctor", "Patient" };
        foreach (var r in roles)
        {
            if (!await roleManager.RoleExistsAsync(r))
            {
                await roleManager.CreateAsync(new IdentityRole(r));
            }
        }

        var adminUser = await userManager.FindByEmailAsync(email);
        if (adminUser == null)
        {
            adminUser = new ApplicationUser
            {
                UserName = userName,
                Email = email,
                EmailConfirmed = true
            };

            var createResult = await userManager.CreateAsync(adminUser, password);
            if (!createResult.Succeeded)
            {
                return; // Avoid throwing during startup; log could be added here
            }
        }

        if (!await userManager.IsInRoleAsync(adminUser, "Admin"))
        {
            await userManager.AddToRoleAsync(adminUser, "Admin");
        }

        var demoUsers = new List<(string Email, string UserName, string Password, string Role, bool CreatePatient)>
        {
            ("pacjent@example.com", "pacjent", "Password1!", "Patient", true),
            ("lekarz@example.com", "lekarz", "Password1!", "Doctor", false)
        };

        foreach (var (demoEmail, demoUserName, demoPassword, role, createPatient) in demoUsers)
        {
            var existing = await userManager.FindByEmailAsync(demoEmail);
            if (existing == null)
            {
                existing = new ApplicationUser
                {
                    UserName = demoUserName,
                    Email = demoEmail,
                    EmailConfirmed = true
                };

                var create = await userManager.CreateAsync(existing, demoPassword);
                if (!create.Succeeded) continue;
            }

            if (!await userManager.IsInRoleAsync(existing, role))
            {
                await userManager.AddToRoleAsync(existing, role);
            }

            // Utwórz pojedynczego pacjenta demo powiązanego z kontem pacjenta
            if (createPatient && role == "Patient")
            {
                var patient = await db.Patients.FirstOrDefaultAsync(p => p.OwnerUserId == existing.Id);
                if (patient == null)
                {
                    patient = new Patient
                    {
                        Name = "Demo Patient",
                        Notes = "Konto pacjent@example.com",
                        OwnerUserId = existing.Id
                    };
                    db.Patients.Add(patient);
                    await db.SaveChangesAsync();
                }

                // Seed przykładowe dane tylko jeśli brak pomiarów/symptomów
                var hasData = db.Measurements.Any(m => m.PatientId == patient.Id) || db.Symptoms.Any(s => s.PatientId == patient.Id);
                if (!hasData)
                {
                    var now = DateTime.UtcNow;
                    var measurements = new List<Measurement>
                    {
                        new() { PatientId = patient.Id, Type = "PEF", Value = 420, RecordedAt = now.AddDays(-5), Notes = "Poranek", Tag = "poranny" },
                        new() { PatientId = patient.Id, Type = "PEF", Value = 430, RecordedAt = now.AddDays(-4), Notes = "Wieczór", Tag = "wieczorny" },
                        new() { PatientId = patient.Id, Type = "PEF", Value = 415, RecordedAt = now.AddDays(-3), Notes = "Lekki kaszel", Tag = "kaszel" },
                        new() { PatientId = patient.Id, Type = "PEF", Value = 440, RecordedAt = now.AddDays(-2), Notes = "Po spacerze", Tag = "spacer" },
                        new() { PatientId = patient.Id, Type = "PEF", Value = 435, RecordedAt = now.AddDays(-1), Notes = "Stabilny" },
                        new() { PatientId = patient.Id, Type = "FEV1", Value = 3.2, RecordedAt = now.AddDays(-4), Notes = "Kontrola" },
                        new() { PatientId = patient.Id, Type = "FEV1", Value = 3.4, RecordedAt = now.AddDays(-1), Notes = "Poprawa" }
                    };

                    var symptoms = new List<SymptomEntry>
                    {
                        new() { PatientId = patient.Id, Severity = 2, Description = "Kaszel nocny", RecordedAt = now.AddDays(-3), TriggerTag = "zimne powietrze" },
                        new() { PatientId = patient.Id, Severity = 3, Description = "Ucisk w klatce", RecordedAt = now.AddDays(-2), TriggerTag = "wysiłek" },
                        new() { PatientId = patient.Id, Severity = 1, Description = "Świszczący oddech", RecordedAt = now.AddDays(-1), TriggerTag = "alergeny" }
                    };

                    db.Measurements.AddRange(measurements);
                    db.Symptoms.AddRange(symptoms);
                    await db.SaveChangesAsync();
                }
            }
        }
    }
}
