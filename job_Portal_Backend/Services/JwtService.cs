using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using job_Portal_Backend.Models;

namespace job_Portal_Backend.Services
{
    public class JwtService
    {
        private readonly IConfiguration _config;

        public JwtService(IConfiguration config)
        {
            _config = config;
        }

        public string GenerateToken(User user)
        {
            var key = _config["JwtSettings:Key"];
            var issuer = _config["JwtSettings:Issuer"];
            var audience = _config["JwtSettings:Audience"];

            if (string.IsNullOrWhiteSpace(key))
                throw new Exception("JWT Key is missing");

            if (string.IsNullOrWhiteSpace(issuer))
                throw new Exception("JWT Issuer is missing");

            if (string.IsNullOrWhiteSpace(audience))
                throw new Exception("JWT Audience is missing");

            if (string.IsNullOrWhiteSpace(user.Id))
                throw new Exception("User Id is missing");

            if (string.IsNullOrWhiteSpace(user.Email))
                throw new Exception("User Email is missing");

            // IMPORTANT FIX: ROLE MUST MATCH CONTROLLER
            var role = string.IsNullOrWhiteSpace(user.Role)
                ? "Applicant"
                : user.Role;

            var securityKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(key)
            );

            var credentials = new SigningCredentials(
                securityKey,
                SecurityAlgorithms.HmacSha256
            );

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Name, user.FullName ?? "Unknown"),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, role),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddHours(12),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}