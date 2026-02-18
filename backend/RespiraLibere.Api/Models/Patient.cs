using System.ComponentModel.DataAnnotations;

namespace RespiraLibere.Api.Models;

public class Patient
{
    public int Id { get; set; }

    [Required]
    [StringLength(128)]
    public string Name { get; set; } = string.Empty;

    [StringLength(1024)]
    public string Notes { get; set; } = string.Empty;

    // Opcjonalne powiązanie z kontem użytkownika (Patient). Unikalne, jeśli ustawione.
    [StringLength(450)]
    public string? OwnerUserId { get; set; }
}
