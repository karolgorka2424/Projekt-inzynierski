using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RespiraLibere.Api.Models;

public class Medication
{
    public int Id { get; set; }

    [Required]
    public int PatientId { get; set; }

    [ForeignKey(nameof(PatientId))]
    public Patient? Patient { get; set; }

    [Required]
    [StringLength(128)]
    public string Name { get; set; } = string.Empty;

    [StringLength(128)]
    public string? Dosage { get; set; }

    // Simple schedule hint, e.g., "08:00;20:00" or "PRN"
    [StringLength(128)]
    public string? Schedule { get; set; }

    public bool Active { get; set; } = true;
}
