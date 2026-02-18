using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RespiraLibere.Api.Data;
using RespiraLibere.Api.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace RespiraLibere.Api.Controllers;

[ApiController]
[Route("api/patients/{patientId:int}/[controller]")]
[Authorize]
public class MeasurementsController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    public MeasurementsController(ApplicationDbContext db) => _db = db;

    private bool IsPatientRole => User.IsInRole("Patient");
    private int? ClaimPatientId()
    {
        var pid = User.FindFirst("pid")?.Value;
        return int.TryParse(pid, out var val) ? val : (int?)null;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(int patientId, [FromQuery] DateTime? from, [FromQuery] DateTime? to, [FromQuery] string? tag)
    {
        var exists = await _db.Patients.AnyAsync(p => p.Id == patientId);
        if (!exists) return NotFound();

        if (IsPatientRole)
        {
            var pid = ClaimPatientId();
            if (!pid.HasValue || pid.Value != patientId) return Forbid();
        }

        var query = _db.Measurements.Where(m => m.PatientId == patientId);
        if (from.HasValue) query = query.Where(m => m.RecordedAt >= from.Value);
        if (to.HasValue) query = query.Where(m => m.RecordedAt <= to.Value);
        if (!string.IsNullOrWhiteSpace(tag)) query = query.Where(m => m.Tag == tag);

        var items = await query
            .OrderByDescending(m => m.RecordedAt)
            .ToListAsync();
        return Ok(items);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Doctor,Patient")]
    public async Task<IActionResult> Create(int patientId, Measurement input)
    {
        var patient = await _db.Patients.FindAsync(patientId);
        if (patient == null) return NotFound();

        if (IsPatientRole)
        {
            var pid = ClaimPatientId();
            if (!pid.HasValue || pid.Value != patientId) return Forbid();
        }

        input.PatientId = patientId;
        _db.Measurements.Add(input);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAll), new { patientId }, input);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin,Doctor,Patient")]
    public async Task<IActionResult> Delete(int patientId, int id)
    {
        var measurement = await _db.Measurements.FirstOrDefaultAsync(m => m.Id == id && m.PatientId == patientId);
        if (measurement == null) return NotFound();

        if (IsPatientRole)
        {
            var pid = ClaimPatientId();
            if (!pid.HasValue || pid.Value != patientId) return Forbid();
        }
        _db.Measurements.Remove(measurement);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
