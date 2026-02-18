using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RespiraLibere.Api.Data;
using RespiraLibere.Api.Models;
using System.Security.Claims;

namespace RespiraLibere.Api.Controllers;

[ApiController]
[Route("api/patients/{patientId:int}/[controller]")]
[Authorize]
public class MedicationsController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    public MedicationsController(ApplicationDbContext db) => _db = db;

    private bool IsPatientRole => User.IsInRole("Patient");
    private int? ClaimPatientId()
    {
        var pid = User.FindFirst("pid")?.Value;
        return int.TryParse(pid, out var val) ? val : (int?)null;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(int patientId)
    {
        var exists = await _db.Patients.AnyAsync(p => p.Id == patientId);
        if (!exists) return NotFound();

        if (IsPatientRole)
        {
            var pid = ClaimPatientId();
            if (!pid.HasValue || pid.Value != patientId) return Forbid();
        }
        var items = await _db.Medications.Where(m => m.PatientId == patientId).ToListAsync();
        return Ok(items);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Doctor,Patient")]
    public async Task<IActionResult> Create(int patientId, Medication input)
    {
        var patient = await _db.Patients.FindAsync(patientId);
        if (patient == null) return NotFound();

        if (IsPatientRole)
        {
            var pid = ClaimPatientId();
            if (!pid.HasValue || pid.Value != patientId) return Forbid();
        }
        input.PatientId = patientId;
        _db.Medications.Add(input);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAll), new { patientId }, input);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin,Doctor,Patient")]
    public async Task<IActionResult> Delete(int patientId, int id)
    {
        var entry = await _db.Medications.FirstOrDefaultAsync(m => m.Id == id && m.PatientId == patientId);
        if (entry == null) return NotFound();

        if (IsPatientRole)
        {
            var pid = ClaimPatientId();
            if (!pid.HasValue || pid.Value != patientId) return Forbid();
        }
        _db.Medications.Remove(entry);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
