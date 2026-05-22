using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using job_Portal_Backend.Helpers;
using job_Portal_Backend.Models;
using job_Portal_Backend.Routes;
using job_Portal_Backend.Services;

namespace job_Portal_Backend.Controllers
{
    [ApiController]
    [Route(UploadRoutes.Base)]
    public class UploadController : ControllerBase
    {
        private readonly CloudinaryStorageService _storage;
        private readonly IConfiguration _config;
        private readonly IWebHostEnvironment _env;
        private readonly IMongoCollection<JobApplication> _applications;
        private readonly IMongoCollection<Job> _jobs;

        public UploadController(
            CloudinaryStorageService storage,
            IConfiguration config,
            IWebHostEnvironment env,
            IMongoDatabase database)
        {
            _storage = storage;
            _config = config;
            _env = env;
            _applications = database.GetCollection<JobApplication>("Applications");
            _jobs = database.GetCollection<Job>("Jobs");
        }

        /// <summary>Public client upload settings (unsigned presets — no API secret exposed).</summary>
        [AllowAnonymous]
        [HttpGet(UploadRoutes.Config)]
        public IActionResult GetUploadConfig()
        {
            var cloudName = _config["CloudinarySettings:CloudName"]?.Trim() ?? string.Empty;
            var imagePreset = _config["CloudinarySettings:ImageUploadPreset"]?.Trim() ?? string.Empty;
            var rawPreset = _config["CloudinarySettings:RawUploadPreset"]?.Trim() ?? string.Empty;
            var legacyPreset = _config["CloudinarySettings:UploadPreset"]?.Trim() ?? string.Empty;

            if (string.IsNullOrEmpty(imagePreset) && !string.IsNullOrEmpty(legacyPreset))
                imagePreset = legacyPreset;

            return Ok(new
            {
                cloudName,
                imageUploadPreset = imagePreset,
                rawUploadPreset = rawPreset,
                directUploadEnabled =
                    !string.IsNullOrEmpty(cloudName)
                    && (!string.IsNullOrEmpty(imagePreset) || !string.IsNullOrEmpty(rawPreset)),
                folders = new
                {
                    cvs = CloudinaryStorageService.CvsFolder,
                    jobs = CloudinaryStorageService.JobsFolder,
                    companies = CloudinaryStorageService.CompaniesFolder,
                    profiles = CloudinaryStorageService.ProfilesFolder,
                },
            });
        }

        [HttpGet(UploadRoutes.Diagnostics)]
        public async Task<IActionResult> GetStorageDiagnostics()
        {
            if (!_env.IsDevelopment())
                return Unauthorized(new { message = "Diagnostics are only available in Development." });

            return Ok(await _storage.GetDiagnosticsAsync());
        }

        [Authorize(Roles = "Applicant")]
        [HttpPost(UploadRoutes.Cv)]
        [RequestSizeLimit(10_000_000)]
        public Task<IActionResult> UploadCv([FromForm] IFormFile file) =>
            UploadAsync(file, UploadCategory.Cv);

        [Authorize(Roles = "Employer")]
        [HttpPost(UploadRoutes.JobImage)]
        [RequestSizeLimit(10_000_000)]
        public Task<IActionResult> UploadJobImage([FromForm] IFormFile file) =>
            UploadAsync(file, UploadCategory.JobImage);

        [Authorize(Roles = "Employer")]
        [HttpPost(UploadRoutes.CompanyLogo)]
        [RequestSizeLimit(10_000_000)]
        public Task<IActionResult> UploadCompanyLogo([FromForm] IFormFile file) =>
            UploadAsync(file, UploadCategory.CompanyLogo);

        [Authorize(Roles = "Applicant,Employer")]
        [HttpPost(UploadRoutes.ProfileImage)]
        [RequestSizeLimit(10_000_000)]
        public Task<IActionResult> UploadProfileImage([FromForm] IFormFile file) =>
            UploadAsync(file, UploadCategory.ProfileImage);

        [Authorize(Roles = "Applicant,Employer")]
        [HttpGet("image")]
        public async Task<IActionResult> StreamImage([FromQuery] string url)
        {
            if (string.IsNullOrWhiteSpace(url))
                return BadRequest(new { message = "url query parameter is required" });

            if (!_storage.IsManagedFileUrl(url.Trim()))
                return BadRequest(new { message = "Invalid Cloudinary URL" });

            return await StreamFromStorageAsync(url.Trim(), download: false);
        }

        [Authorize(Roles = "Applicant,Employer")]
        [HttpGet("cv/{applicationId}")]
        public async Task<IActionResult> StreamCv(string applicationId, [FromQuery] bool download = false)
        {
            if (!MongoIdValidator.IsValid(applicationId))
                return BadRequest(new { message = "Application id is not valid." });

            var application = await _applications
                .Find(a => a.Id == applicationId)
                .FirstOrDefaultAsync();

            if (application == null)
                return NotFound(new { message = "Application not found" });

            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var role = User.FindFirst(ClaimTypes.Role)?.Value;

            if (string.IsNullOrWhiteSpace(userId))
                return Unauthorized(new { message = "Invalid token" });

            if (role == "Applicant" && application.UserId != userId)
                return Forbid();

            if (role == "Employer")
            {
                var job = await _jobs.Find(j => j.Id == application.JobId).FirstOrDefaultAsync();
                if (job == null)
                    return NotFound(new { message = "Job not found" });
                if (!string.IsNullOrWhiteSpace(job.EmployerId) && job.EmployerId != userId)
                    return Forbid();
            }

            if (string.IsNullOrWhiteSpace(application.CVFileUrl))
                return NotFound(new { message = "No CV uploaded for this application" });

            return await StreamFromStorageAsync(application.CVFileUrl, download);
        }

        private async Task<IActionResult> UploadAsync(IFormFile file, UploadCategory category)
        {
            try
            {
                var upload = await _storage.UploadAsync(file, category);
                var secureUrl = upload.Url.Trim();
                var storedUrl = CloudinaryUrlHelper.CanonicalizeForStorage(secureUrl);

                // Unsigned delivery URLs work in <img> tags; signed URLs break when transforms are applied.
                var (viewWidth, viewHeight) = category switch
                {
                    UploadCategory.ProfileImage => (400, 400),
                    UploadCategory.CompanyLogo => (256, 256),
                    _ => (1200, 500),
                };
                var viewUrl = CloudinaryUrlHelper.BuildCoverDeliveryUrl(storedUrl, viewWidth, viewHeight);
                if (string.IsNullOrWhiteSpace(viewUrl))
                    viewUrl = secureUrl;

                var downloadUrl = _storage.GetSignedDeliveryUrl(storedUrl, forceDownload: true);
                if (string.IsNullOrWhiteSpace(downloadUrl) || !downloadUrl.Contains("/s--", StringComparison.Ordinal))
                    downloadUrl = secureUrl;

                return Ok(new
                {
                    message = "File uploaded to Cloudinary successfully",
                    url = storedUrl,
                    secureUrl,
                    viewUrl,
                    downloadUrl,
                    publicId = upload.PublicId,
                    cloudinaryFolder = upload.CloudinaryFolder,
                    resourceType = upload.ResourceType,
                    storageProvider = "cloudinary",
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Upload failed: {ex.Message}" });
            }
        }

        private async Task<IActionResult> StreamFromStorageAsync(string storedUrl, bool download)
        {
            var downloaded = await _storage.TryDownloadAsync(storedUrl);
            if (downloaded == null)
            {
                return StatusCode(502, new
                {
                    message = "File could not be loaded from Cloudinary. Please upload again.",
                });
            }

            var (bytes, contentType) = downloaded.Value;
            var fileName = ResolveDownloadFileName(storedUrl);
            if (download && contentType == "application/octet-stream" && fileName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase))
                contentType = "application/pdf";

            if (download)
                return File(bytes, contentType, fileName);

            Response.Headers.ContentDisposition = $"inline; filename=\"{fileName}\"";
            return File(bytes, contentType);
        }

        private static string ResolveDownloadFileName(string storedUrl)
        {
            try
            {
                var path = new Uri(storedUrl).AbsolutePath;
                var name = Path.GetFileName(path);
                if (!string.IsNullOrWhiteSpace(name))
                {
                    if (name.EndsWith(".pdf.png", StringComparison.OrdinalIgnoreCase))
                        return name[..^4];
                    if (name.Contains('.'))
                        return name;
                }
            }
            catch
            {
                // ignore
            }

            if (storedUrl.Contains(".pdf", StringComparison.OrdinalIgnoreCase))
                return "cv.pdf";
            if (storedUrl.Contains(".docx", StringComparison.OrdinalIgnoreCase))
                return "cv.docx";

            return "cv.pdf";
        }
    }
}
