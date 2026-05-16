using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

// ✅ Project namespaces
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

        public AuthController(
            UserService userService,
            JwtService jwtService)
        {
            _userService = userService;
            _jwtService = jwtService;
        }

        // ======================
        // REGISTER
        // ======================
        [HttpPost(AuthRoutes.Register)]
        public async Task<IActionResult> Register(
            [FromBody] RegisterDto dto)
        {
            if (dto == null
                || string.IsNullOrWhiteSpace(dto.Email)
                || string.IsNullOrWhiteSpace(dto.Password)
                || string.IsNullOrWhiteSpace(dto.FullName))
            {
                return BadRequest(
                    "All fields are required.");
            }

            // CHECK EMAIL EXISTS
            if (await _userService.EmailExists(dto.Email))
            {
                return Conflict(
                    "An account with this email already exists.");
            }

            // CREATE USER
            var user = new User
            {
                FullName = dto.FullName,

                Email = dto.Email,

                PasswordHash =
                    BCrypt.Net.BCrypt.HashPassword(
                        dto.Password),

                // 🔥 IMPORTANT
                // NEVER TRUST FRONTEND ROLE
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
        public async Task<IActionResult> Login(
            [FromBody] LoginDto dto)
        {
            if (dto == null
                || string.IsNullOrWhiteSpace(dto.Email)
                || string.IsNullOrWhiteSpace(dto.Password))
            {
                return BadRequest(
                    "Email and password are required.");
            }

            // FIND USER
            var user =
                await _userService.GetByEmail(
                    dto.Email);

            if (user == null)
            {
                return Unauthorized(
                    "Invalid email or password.");
            }

            // VERIFY PASSWORD
            bool isValidPassword =
                BCrypt.Net.BCrypt.Verify(
                    dto.Password,
                    user.PasswordHash);

            if (!isValidPassword)
            {
                return Unauthorized(
                    "Invalid email or password.");
            }

            // GENERATE JWT
            var token =
                _jwtService.GenerateToken(user);

            return Ok(new
            {
                Message = "Login successful",

                Token = token,

                User = new
                {
                    user.Id,
                    user.FullName,
                    user.Email,
                    user.Role
                }
            });
        }

        // ======================
        // LOGOUT
        // ======================
        [Authorize]
        [HttpPost(AuthRoutes.Logout)]
        public IActionResult Logout()
        {
            return Ok(new
            {
                Message = "Logged out successfully"
            });
        }
    }
}