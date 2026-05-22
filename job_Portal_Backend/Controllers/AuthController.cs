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
        private readonly CloudinaryStorageService _storage;

        public AuthController(
            UserService userService,
            JwtService jwtService,
            CloudinaryStorageService storage)
        {
            _userService = userService;
            _jwtService = jwtService;
            _storage = storage;
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

            var email = dto.Email.Trim().ToLowerInvariant();

            // CHECK EMAIL EXISTS
            if (await _userService.EmailExists(email))
            {
                return Conflict(
                    "An account with this email already exists.");
            }

            // VALIDATE ROLE (Only Applicant or Employer allowed)
            string userRole = dto.Role == "Employer" ? "Employer" : "Applicant";

            // CREATE USER
            var user = new User
            {
                FullName = dto.FullName,

                Email = email,

                PasswordHash =
                    BCrypt.Net.BCrypt.HashPassword(
                        dto.Password),

                Role = userRole
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

            var email = dto.Email.Trim().ToLowerInvariant();

            // FIND USER
            var user = await _userService.GetByEmail(email);

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

                User = MapUserResponse(user)
            });
        }

        private object MapUserResponse(User user)
        {
            var storedImage = Helpers.CloudinaryUrlHelper.CanonicalizeForStorage(user.ProfileImageUrl);
            var hasImage = !string.IsNullOrWhiteSpace(storedImage);

            return new
            {
                user.Id,
                user.FullName,
                user.Email,
                user.Role,
                profileImageUrl = hasImage
                    ? Helpers.CloudinaryUrlHelper.BuildCoverDeliveryUrl(storedImage, 400, 400)
                    : string.Empty,
                profileImageUrlStored = storedImage,
                hasProfileImage = hasImage,
            };
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