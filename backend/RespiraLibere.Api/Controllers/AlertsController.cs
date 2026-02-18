using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RespiraLibere.Api.Data;
using RespiraLibere.Api.Services;

namespace RespiraLibere.Api.Controllers;

[ApiController]
[Route("api/alerts")]
[Authorize]
public class AlertsController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly AirPollenClient _airClient;
    public AlertsController(ApplicationDbContext db, AirPollenClient airClient)
    {
        _db = db;
        _airClient = airClient;
    }

    [HttpGet("patient/{patientId:int}")]
    public async Task<IActionResult> GetPatientAlerts(int patientId, [FromQuery] double? lat, [FromQuery] double? lon, [FromQuery] int hours = 72, CancellationToken ct = default)
    {
        if (!await _db.Patients.AnyAsync(p => p.Id == patientId, ct)) return NotFound();

        var since = DateTime.UtcNow.AddHours(-hours);

        var recentMeasurements = await _db.Measurements
            .Where(m => m.PatientId == patientId && m.RecordedAt >= since)
            .OrderByDescending(m => m.RecordedAt)
            .ToListAsync(ct);

        var recentSymptoms = await _db.Symptoms
            .Where(s => s.PatientId == patientId && s.RecordedAt >= since)
            .OrderByDescending(s => s.RecordedAt)
            .ToListAsync(ct);

        var recentTriggers = await _db.Triggers
            .Where(t => t.PatientId == patientId && t.RecordedAt >= since)
            .ToListAsync(ct);

        var alerts = new List<string>();

        double? latestPef = recentMeasurements.FirstOrDefault(m => m.Type.Equals("PEF", StringComparison.OrdinalIgnoreCase))?.Value;
        if (latestPef.HasValue)
        {
            var last3 = recentMeasurements.Where(m => m.Type.Equals("PEF", StringComparison.OrdinalIgnoreCase)).Take(3).Select(m => m.Value).ToList();
            var prev3 = recentMeasurements.Where(m => m.Type.Equals("PEF", StringComparison.OrdinalIgnoreCase)).Skip(3).Take(3).Select(m => m.Value).ToList();
            if (last3.Count >= 2 && prev3.Count >= 2)
            {
                var avgRecent = last3.Average();
                var avgPrev = prev3.Average();
                var delta = avgPrev == 0 ? 0 : (avgRecent - avgPrev) / avgPrev;
                if (delta <= -0.1) alerts.Add("PEF trending down by more than 10%.");
            }
            if (latestPef < 350) alerts.Add("Latest PEF is low; consider rescue plan.");
        }

        if (recentSymptoms.Any())
        {
            var avgSeverity = recentSymptoms.Average(s => s.Severity);
            if (avgSeverity >= 3) alerts.Add("Symptoms severity elevated in recent period.");
        }

        if (recentTriggers.Count >= 3)
        {
            alerts.Add("Multiple triggers recorded recently.");
        }

        AirPollenClient.AirPollenSnapshot? air = null;
        if (lat.HasValue && lon.HasValue)
        {
            air = await _airClient.GetAsync(lat.Value, lon.Value, ct);
            if (air?.UsAqi is double aqi && aqi >= 100) alerts.Add("Air quality index is unhealthy.");
            if (air?.Pm25 is double pm && pm >= 25) alerts.Add("PM2.5 is elevated.");
            if (air?.GrassPollen is double gp && gp >= 50) alerts.Add("Grass pollen is high.");
        }

        return Ok(new
        {
            measurements = new
            {
                latestPef,
                count = recentMeasurements.Count,
                lastMeasuredAt = recentMeasurements.FirstOrDefault()?.RecordedAt
            },
            symptoms = new
            {
                count = recentSymptoms.Count,
                averageSeverity = recentSymptoms.Any() ? recentSymptoms.Average(s => s.Severity) : 0
            },
            triggers = new { count = recentTriggers.Count },
            air,
            alerts
        });
    }
}
