using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using RespiraLibere.Api.Data;
using RespiraLibere.Api.Models;

namespace RespiraLibere.Api.Controllers;

[ApiController]
[Route("api/reports")] 
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    public ReportsController(ApplicationDbContext db) => _db = db;

    [HttpGet("mock/pdf")]
    public IActionResult MockPdf()
    {
        var patient = new Patient { Id = 0, Name = "Demo", Notes = "Raport demonstracyjny" };
        var now = DateTime.UtcNow;
        var measurements = new List<Measurement>
        {
            new() { Id = 1, PatientId = 0, Type = "PEF", Value = 420, RecordedAt = now.AddHours(-1), Notes = "Poranek", Tag = "przed_lekiem" },
            new() { Id = 2, PatientId = 0, Type = "PEF", Value = 470, RecordedAt = now.AddHours(-7), Notes = "Po leku", Tag = "po_leku" },
            new() { Id = 3, PatientId = 0, Type = "FEV1", Value = 3.2, RecordedAt = now.AddDays(-1), Notes = "Stabilny", Tag = string.Empty }
        };
        var symptoms = new List<SymptomEntry>
        {
            new() { Id = 1, PatientId = 0, Severity = 3, Description = "Kaszel", RecordedAt = now.AddHours(-6), TriggerTag = "pylki" }
        };
        var triggers = new List<TriggerEntry>
        {
            new() { Id = 1, PatientId = 0, Name = "Pyłki", Notes = "Wysokie pyłki traw", RecordedAt = now.AddDays(-1) }
        };
        var meds = new List<Medication>
        {
            new() { Id = 1, PatientId = 0, Name = "Salbutamol", Dosage = "2 wziewy", Schedule = "doraźnie" },
            new() { Id = 2, PatientId = 0, Name = "Budezonid", Dosage = "1 dawka", Schedule = "08:00;20:00" }
        };

        var pdfBytes = GeneratePdf(patient, measurements, symptoms, triggers, meds, null, null);
        return File(pdfBytes, "application/pdf", "raport-demo.pdf");
    }

    [HttpGet("patients/{patientId:int}/measurements/csv")]
    public async Task<IActionResult> MeasurementsCsv(int patientId, [FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        var exists = await _db.Patients.AnyAsync(p => p.Id == patientId);
        if (!exists) return NotFound();
        var query = _db.Measurements.Where(m => m.PatientId == patientId);
        if (from.HasValue) query = query.Where(m => m.RecordedAt >= from.Value);
        if (to.HasValue) query = query.Where(m => m.RecordedAt <= to.Value);
        var items = await query.OrderBy(m => m.RecordedAt).ToListAsync();
        var sb = new StringBuilder();
        sb.AppendLine("Id,Type,Value,RecordedAt,Notes,Tag");
        foreach (var m in items)
        {
            sb.AppendLine(string.Join(',', new[]
            {
                m.Id.ToString(),
                Quote(m.Type),
                m.Value.ToString(System.Globalization.CultureInfo.InvariantCulture),
                m.RecordedAt.ToString("o"),
                Quote(m.Notes ?? string.Empty),
                Quote(m.Tag ?? string.Empty)
            }));
        }
        return File(Encoding.UTF8.GetBytes(sb.ToString()), "text/csv", $"measurements-{patientId}.csv");
    }

    [HttpGet("patients/{patientId:int}/full/pdf")]
    public async Task<IActionResult> FullPdf(int patientId, [FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        var patient = await _db.Patients.FirstOrDefaultAsync(p => p.Id == patientId);
        if (patient == null) return NotFound();

        var measQuery = _db.Measurements.Where(m => m.PatientId == patientId);
        if (from.HasValue) measQuery = measQuery.Where(m => m.RecordedAt >= from.Value);
        if (to.HasValue) measQuery = measQuery.Where(m => m.RecordedAt <= to.Value);
        var measurements = await measQuery.OrderByDescending(m => m.RecordedAt).Take(100).ToListAsync();

        var symptoms = await _db.Symptoms.Where(s => s.PatientId == patientId).OrderByDescending(s => s.RecordedAt).Take(100).ToListAsync();
        var triggers = await _db.Triggers.Where(t => t.PatientId == patientId).OrderByDescending(t => t.RecordedAt).Take(100).ToListAsync();
        var meds = await _db.Medications.Where(m => m.PatientId == patientId).ToListAsync();

        var pdfBytes = GeneratePdf(patient, measurements, symptoms, triggers, meds, from, to);
        var fileName = $"report-{patientId}.pdf";
        return File(pdfBytes, "application/pdf", fileName);
    }

    private static byte[] GeneratePdf(Patient patient, List<Measurement> measurements, List<SymptomEntry> symptoms, List<TriggerEntry> triggers, List<Medication> meds, DateTime? from, DateTime? to)
    {
        QuestPDF.Settings.License = LicenseType.Community;
        return Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(30);
                page.DefaultTextStyle(x => x.FontSize(10));

                page.Header().Text($"Respira Libere — Patient Report").SemiBold().FontSize(16);

                page.Content().Column(col =>
                {
                    col.Spacing(12);
                    col.Item().Text($"Patient: {patient.Name} ({patient.Id})");
                    col.Item().Text($"Notes: {patient.Notes}");
                    if (from.HasValue || to.HasValue)
                        col.Item().Text($"Range: {(from?.ToString("u") ?? "-")} to {(to?.ToString("u") ?? "-")}");

                    col.Item().Text("Medications").SemiBold();
                    col.Item().Table(t =>
                    {
                        t.ColumnsDefinition(c => { c.RelativeColumn(); c.RelativeColumn(); c.RelativeColumn(); });
                        t.Header(h =>
                        {
                            h.Cell().Text("Name").SemiBold();
                            h.Cell().Text("Dosage").SemiBold();
                            h.Cell().Text("Schedule").SemiBold();
                        });
                        foreach (var m in meds)
                        {
                            t.Cell().Text(m.Name);
                            t.Cell().Text(m.Dosage ?? "-");
                            t.Cell().Text(m.Schedule ?? "-");
                        }
                        if (!meds.Any()) t.Cell().ColumnSpan(3).Text("No medications");
                    });

                    col.Item().Text("Measurements (latest 100)").SemiBold();
                    col.Item().Table(t =>
                    {
                        t.ColumnsDefinition(c => { c.RelativeColumn(); c.RelativeColumn(); c.RelativeColumn(); c.RelativeColumn(); c.RelativeColumn(); });
                        t.Header(h =>
                        {
                            h.Cell().Text("Type").SemiBold();
                            h.Cell().Text("Value").SemiBold();
                            h.Cell().Text("When").SemiBold();
                            h.Cell().Text("Notes").SemiBold();
                            h.Cell().Text("Tag").SemiBold();
                        });
                        foreach (var m in measurements)
                        {
                            t.Cell().Text(m.Type);
                            t.Cell().Text(m.Value.ToString("0.##"));
                            t.Cell().Text(m.RecordedAt.ToString("u"));
                            t.Cell().Text(m.Notes ?? "-");
                            t.Cell().Text(m.Tag ?? "-");
                        }
                        if (!measurements.Any()) t.Cell().ColumnSpan(5).Text("No measurements");
                    });

                    col.Item().Text("Symptoms (latest 100)").SemiBold();
                    col.Item().Table(t =>
                    {
                        t.ColumnsDefinition(c => { c.RelativeColumn(); c.RelativeColumn(); c.RelativeColumn(); c.RelativeColumn(); });
                        t.Header(h =>
                        {
                            h.Cell().Text("Severity").SemiBold();
                            h.Cell().Text("Description").SemiBold();
                            h.Cell().Text("When").SemiBold();
                            h.Cell().Text("Trigger").SemiBold();
                        });
                        foreach (var s in symptoms)
                        {
                            t.Cell().Text(s.Severity.ToString());
                            t.Cell().Text(s.Description);
                            t.Cell().Text(s.RecordedAt.ToString("u"));
                            t.Cell().Text(s.TriggerTag ?? "-");
                        }
                        if (!symptoms.Any()) t.Cell().ColumnSpan(4).Text("No symptoms");
                    });

                    col.Item().Text("Triggers (latest 100)").SemiBold();
                    col.Item().Table(t =>
                    {
                        t.ColumnsDefinition(c => { c.RelativeColumn(); c.RelativeColumn(); c.RelativeColumn(); });
                        t.Header(h =>
                        {
                            h.Cell().Text("Name").SemiBold();
                            h.Cell().Text("Notes").SemiBold();
                            h.Cell().Text("When").SemiBold();
                        });
                        foreach (var tr in triggers)
                        {
                            t.Cell().Text(tr.Name);
                            t.Cell().Text(tr.Notes ?? "-");
                            t.Cell().Text(tr.RecordedAt.ToString("u"));
                        }
                        if (!triggers.Any()) t.Cell().ColumnSpan(3).Text("No triggers");
                    });
                });

                page.Footer().AlignCenter().Text(x =>
                {
                    x.Span("Generated: ");
                    x.Span(DateTime.UtcNow.ToString("u"));
                });
            });
        }).GeneratePdf();
    }

    private static string Quote(string input) => $"\"{input.Replace("\"", "\"\"" )}\"";
}
