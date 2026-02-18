using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using RespiraLibere.Api.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using RespiraLibere.Api.Models;

namespace RespiraLibere.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly IConfiguration _configuration;
    private readonly ApplicationDbContext _db;

    public AuthController(UserManager<ApplicationUser> userManager, SignInManager<ApplicationUser> signInManager, IConfiguration configuration, ApplicationDbContext db)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _configuration = configuration;
        _db = db;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest model)
    {
        var user = new ApplicationUser { UserName = model.Email, Email = model.Email };
        var result = await _userManager.CreateAsync(user, model.Password);
        if (!result.Succeeded) return BadRequest(result.Errors);
        return Ok();
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest model)
    {
        // allow login by email or username
        var user = await _userManager.FindByEmailAsync(model.EmailOrUsername) ?? await _userManager.FindByNameAsync(model.EmailOrUsername);
        if (user == null) return Unauthorized();

        var valid = await _userManager.CheckPasswordAsync(user, model.Password);
        if (!valid) return Unauthorized();

        var roles = await _userManager.GetRolesAsync(user);

        int? ownedPatientId = null;
        if (roles.Contains("Patient"))
        {
            ownedPatientId = await EnsurePatientForUser(user);
        }

        var jwt = _configuration.GetSection("JwtSettings");
        var key = Encoding.UTF8.GetBytes(jwt["Key"]!);
        var jti = Guid.NewGuid().ToString();
        var expires = DateTime.UtcNow.AddMinutes(double.Parse(jwt["DurationInMinutes"]!));
        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id),
            new Claim(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new Claim(JwtRegisteredClaimNames.Jti, jti)
        };
        claims.AddRange(roles.Select(r => new Claim(ClaimTypes.Role, r)));
        if (ownedPatientId.HasValue)
        {
            claims.Add(new Claim("pid", ownedPatientId.Value.ToString()));
        }

        var token = new JwtSecurityToken(
            issuer: jwt["Issuer"],
            audience: jwt["Audience"],
            claims: claims,
            expires: expires,
            signingCredentials: new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256)
        );

        return Ok(new { token = new JwtSecurityTokenHandler().WriteToken(token), expires = expires, jti = jti, roles, patientId = ownedPatientId });
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout()
    {
        var jti = User.FindFirst(JwtRegisteredClaimNames.Jti)?.Value;
        if (string.IsNullOrEmpty(jti)) return BadRequest();

        var expClaim = User.FindFirst("exp")?.Value;
        DateTime expires = DateTime.UtcNow.AddMinutes(60);
        if (!string.IsNullOrEmpty(expClaim) && long.TryParse(expClaim, out var exp))
        {
            expires = DateTimeOffset.FromUnixTimeSeconds(exp).UtcDateTime;
        }

        var revoked = new RevokedToken { Jti = jti, ExpiresAt = expires };
        _db.RevokedTokens.Add(revoked);
        await _db.SaveChangesAsync();
        return Ok();
    }

    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest model)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return Unauthorized();

        var result = await _userManager.ChangePasswordAsync(user, model.CurrentPassword, model.NewPassword);
        if (!result.Succeeded) return BadRequest(result.Errors);
        return Ok();
    }

    [Authorize]
    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest model)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return Unauthorized();

        user.Email = model.Email;
        user.UserName = model.UserName;
        user.NormalizedEmail = _userManager.NormalizeEmail(model.Email);
        user.NormalizedUserName = _userManager.NormalizeName(model.UserName);

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded) return BadRequest(result.Errors);
        return Ok(new { user.Id, user.Email, user.UserName });
    }

    [Authorize]
    [HttpDelete("delete-account")]
    public async Task<IActionResult> DeleteAccount()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return Unauthorized();

        await _signInManager.SignOutAsync();
        var result = await _userManager.DeleteAsync(user);
        if (!result.Succeeded) return BadRequest(result.Errors);
        return Ok(new { message = "Account deleted" });
    }

    [AllowAnonymous]
    [HttpPost("request-password-reset")]
    public async Task<IActionResult> RequestPasswordReset([FromBody] RequestResetRequest model)
    {
        var user = await _userManager.FindByEmailAsync(model.Email);
        if (user == null) return Ok(); // avoid leaking existence
        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        return Ok(new { resetToken = token });
    }

    [AllowAnonymous]
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest model)
    {
        var user = await _userManager.FindByEmailAsync(model.Email);
        if (user == null) return BadRequest("User not found");
        var result = await _userManager.ResetPasswordAsync(user, model.Token, model.NewPassword);
        if (!result.Succeeded) return BadRequest(result.Errors);
        return Ok(new { message = "Password reset" });
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return Unauthorized();
        var roles = await _userManager.GetRolesAsync(user);
        int? ownedPatientId = null;
        if (roles.Contains("Patient"))
        {
            ownedPatientId = await EnsurePatientForUser(user);
        }
        return Ok(new { user.Id, user.Email, user.UserName, roles, patientId = ownedPatientId });
    }

    private async Task<int?> EnsurePatientForUser(ApplicationUser user)
    {
        var existing = await _db.Patients.FirstOrDefaultAsync(p => p.OwnerUserId == user.Id);
        if (existing != null) return existing.Id;

        var patient = new Patient
        {
            Name = user.UserName ?? user.Email ?? "Pacjent",
            Notes = string.IsNullOrWhiteSpace(user.Email) ? string.Empty : user.Email,
            OwnerUserId = user.Id
        };
        _db.Patients.Add(patient);
        await _db.SaveChangesAsync();
        return patient.Id;
    }
}

public record RegisterRequest(string Email, string Password);
public record LoginRequest(string EmailOrUsername, string Password);
public record ChangePasswordRequest(string CurrentPassword, string NewPassword);
public record UpdateProfileRequest(string Email, string UserName);
public record RequestResetRequest(string Email);
public record ResetPasswordRequest(string Email, string Token, string NewPassword);
