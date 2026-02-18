using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RespiraLibere.Api.Models;

public class SymptomEntry
{
    public int Id { get; set; }

    [Required]
    public int PatientId { get; set; }

    [ForeignKey(nameof(PatientId))]
    public Patient? Patient { get; set; }

    [Required]
    [Range(1, 5)]
    public int Severity { get; set; } // 1-5 scale

    [Required]
    [StringLength(512)]
    public string Description { get; set; } = string.Empty;

    [Required]
    public DateTime RecordedAt { get; set; } = DateTime.UtcNow;

    [StringLength(64)]
    public string? TriggerTag { get; set; }
}
