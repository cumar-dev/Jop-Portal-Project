using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using job_Portal_Backend.DTOs;
using job_Portal_Backend.Helpers;
using job_Portal_Backend.Routes;
using job_Portal_Backend.Services;

namespace job_Portal_Backend.Controllers
{
    [ApiController]
    [Route(ProfileRoutes.Base)]
    [Authorize]
    public class ProfileController : ControllerBase
    {
        private readonly UserService _userService;
        private readonly CloudinaryStorageService _storage;

        public ProfileController(UserService userService, CloudinaryStorageService storage)
        {
            _userService = userService;
            _storage = storage;
        }

        [HttpGet("photo")]
        public async Task<IActionResult> StreamProfilePhoto()
        {
            var user = await GetCurrentUserAsync();
            if (user == null)
                return Unauthorized("Invalid token");

            if (string.IsNullOrWhiteSpace(user.ProfileImageUrl))
                return NotFound("No profile photo.");

            var downloaded = await _storage.TryDownloadAsync(user.ProfileImageUrl);
            if (downloaded == null)
                return NotFound("Profile photo could not be loaded. Upload again from your profile page.");

            Response.Headers.CacheControl = "private, max-age=300";
            return File(downloaded.Value.Data, downloaded.Value.ContentType);
        }

        [HttpGet]
        public async Task<IActionResult> GetProfile()
        {
            var user = await GetCurrentUserAsync();
            if (user == null)
                return Unauthorized("Invalid token");

            return Ok(ToProfileResponse(user));
        }

        [HttpPut]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
        {
            if (dto == null)
                return BadRequest("Profile data is required");

            var user = await GetCurrentUserAsync();
            if (user == null)
                return Unauthorized("Invalid token");

            var fullName = string.IsNullOrWhiteSpace(dto.FullName)
                ? user.FullName ?? string.Empty
                : dto.FullName.Trim();

            if (string.IsNullOrWhiteSpace(fullName))
                return BadRequest("Full name is required");

            string? profileImageUrl = null;
            if (dto.ProfileImageUrl != null)
            {
                var trimmed = dto.ProfileImageUrl.Trim();
                if (string.IsNullOrWhiteSpace(trimmed))
                {
                    profileImageUrl = string.Empty;
                }
                else
                {
                    var canonical = CloudinaryUrlHelper.CanonicalizeForStorage(trimmed);
                    if (!_storage.IsOurCloudinaryUrl(canonical) && !_storage.IsOurCloudinaryUrl(trimmed))
                    {
                        return BadRequest(
                            "Profile image must be uploaded to Cloudinary (POST /api/upload/profile-image) first.");
                    }

                    profileImageUrl = CloudinaryUrlHelper.CanonicalizeForStorage(canonical);
                }
            }

            var updated = await _userService.UpdateProfileAsync(
                user.Id!,
                fullName,
                profileImageUrl);

            if (updated == null)
                return NotFound("User not found");

            return Ok(new
            {
                message = "Profile updated successfully",
                user = ToProfileResponse(updated),
            });
        }

        private async Task<Models.User?> GetCurrentUserAsync()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrWhiteSpace(userId))
                return null;

            return await _userService.GetById(userId);
        }

        private object ToProfileResponse(Models.User user)
        {
            var storedImage = CloudinaryUrlHelper.CanonicalizeForStorage(user.ProfileImageUrl);
            var hasImage = !string.IsNullOrWhiteSpace(storedImage);

            return new
            {
                id = user.Id,
                fullName = user.FullName,
                email = user.Email,
                role = user.Role,
                profileImageUrl = hasImage
                    ? CloudinaryUrlHelper.BuildCoverDeliveryUrl(storedImage, 400, 400)
                    : string.Empty,
                profileImageUrlStored = storedImage,
                hasProfileImage = hasImage,
            };
        }
    }
}
