using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RespiraLibere.Api.Data;
using RespiraLibere.Api.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace RespiraLibere.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PatientsController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    public PatientsController(ApplicationDbContext db) => _db = db;

    private string? CurrentUserId => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
    private bool IsPatientRole => User.IsInRole("Patient");
    private int? ClaimPatientId()
    {
        var pid = User.FindFirst("pid")?.Value;
        return int.TryParse(pid, out var val) ? val : (int?)null;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        if (IsPatientRole)
        {
            var pid = ClaimPatientId();
            if (!pid.HasValue) return Forbid();
            var p = await _db.Patients.FirstOrDefaultAsync(x => x.Id == pid.Value);
            if (p == null) return NotFound();
            return Ok(new[] { p });
        }
        return Ok(await _db.Patients.ToListAsync());
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Doctor")]
    public async Task<IActionResult> Create(Patient p)
    {
        _db.Patients.Add(p);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAll), new { id = p.Id }, p);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id)
    {
        var p = await _db.Patients.FindAsync(id);
        if (p == null) return NotFound();
        if (IsPatientRole)
        {
            var pid = ClaimPatientId();
            if (!pid.HasValue || pid.Value != id) return Forbid();
        }
        return Ok(p);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Doctor")]
    public async Task<IActionResult> Update(int id, Patient model)
    {
        var p = await _db.Patients.FindAsync(id);
        if (p == null) return NotFound();
        p.Name = model.Name;
        p.Notes = model.Notes;
        p.OwnerUserId = model.OwnerUserId;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,Doctor")]
    public async Task<IActionResult> Delete(int id)
    {
        var p = await _db.Patients.FindAsync(id);
        if (p == null) return NotFound();
        _db.Patients.Remove(p);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
