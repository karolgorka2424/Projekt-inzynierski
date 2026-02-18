using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RespiraLibere.Api.Models;

public class TriggerEntry
{
    public int Id { get; set; }

    [Required]
    public int PatientId { get; set; }

    [ForeignKey(nameof(PatientId))]
    public Patient? Patient { get; set; }

    [Required]
    [StringLength(128)]
    public string Name { get; set; } = string.Empty; // e.g., pollen, stress, exercise

    [StringLength(512)]
    public string? Notes { get; set; }

    [Required]
    public DateTime RecordedAt { get; set; } = DateTime.UtcNow;
}
