using Microsoft.AspNetCore.Mvc;

// ✅ Your own project namespaces last
using job_Portal_Backend.DTOs;
using job_Portal_Backend.Models;
using job_Portal_Backend.Routes;
using job_Portal_Backend.Services;

namespace job_Portal_Backend.Controllers
{
    [ApiController]
    [Route(AuthRoutes.Base)]
    public class AuthController : ControllerBase
    {
        private readonly UserService _userService;
        private readonly JwtService _jwtService;

        public AuthController(UserService userService, JwtService jwtService)
        {
            _userService = userService;
            _jwtService = jwtService;
        }

        // ======================
        // REGISTER
        // ======================
        [HttpPost(AuthRoutes.Register)]
        public async Task<IActionResult> Register(RegisterDto dto)
        {
            if (dto == null
                || string.IsNullOrWhiteSpace(dto.Email)
                || string.IsNullOrWhiteSpace(dto.Password)
                || string.IsNullOrWhiteSpace(dto.FullName)
                || string.IsNullOrWhiteSpace(dto.Role))
            {
                return BadRequest("All fields are required.");
            }

            if (await _userService.EmailExists(dto.Email))
            {
                return Conflict("An account with this email already exists.");
            }

            var user = new User
            {
                FullName = dto.FullName,
                Email = dto.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Role = dto.Role
            };

            await _userService.CreateUser(user);

            return Ok(new
            {
                Message = "User registered successfully",
                User = new
                {
                    user.FullName,
                    user.Email,
                    user.Role
                }
            });
        }

        // ======================
        // LOGIN
        // ======================
        [HttpPost(AuthRoutes.Login)]
        public async Task<IActionResult> Login(LoginDto dto)
        {
            if (dto == null
                || string.IsNullOrWhiteSpace(dto.Email)
                || string.IsNullOrWhiteSpace(dto.Password))
            {
                return BadRequest("Email and password are required.");
            }

            var user = await _userService.GetByEmail(dto.Email);

            if (user == null)
            {
                return Unauthorized("Invalid email or password.");
            }

            bool isValidPassword = BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash);

            if (!isValidPassword)
            {
                return Unauthorized("Invalid email or password.");
            }

            var token = _jwtService.GenerateToken(user);

            return Ok(new
            {
                Message = "Login successful",
                Token = token,
                User = new
                {
                    user.FullName,
                    user.Email,
                    user.Role
                }
            });
        }
    }
}