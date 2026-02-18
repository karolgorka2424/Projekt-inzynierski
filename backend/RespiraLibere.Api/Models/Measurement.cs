using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RespiraLibere.Api.Models;

public class Measurement
{
    public int Id { get; set; }

    [Required]
    public int PatientId { get; set; }

    [ForeignKey(nameof(PatientId))]
    public Patient? Patient { get; set; }

    [Required]
    [StringLength(32)]
    public string Type { get; set; } = "PEF"; // e.g., PEF, SpO2, FEV1

    [Range(0, 5000)]
    public double Value { get; set; }

    [Required]
    public DateTime RecordedAt { get; set; } = DateTime.UtcNow;

    [StringLength(1024)]
    public string? Notes { get; set; }

    // Optional marker e.g. "before_med", "after_med", "during_symptom"
    [StringLength(64)]
    public string? Tag { get; set; }
}
