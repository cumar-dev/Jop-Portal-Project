using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using System.Security.Claims;
using job_Portal_Backend.DTOs;
using job_Portal_Backend.Models;
using job_Portal_Backend.Routes;
using job_Portal_Backend.Helpers;
using job_Portal_Backend.Services;

namespace job_Portal_Backend.Controllers
{
    [ApiController]
    [Route(JobRoutes.Base)]
    public class JobsController : ControllerBase
    {
        private readonly IMongoCollection<Job> _jobs;
        private readonly CloudinaryStorageService _storage;
        private readonly NotificationService _notifications;

        public JobsController(
            IMongoDatabase database,
            CloudinaryStorageService storage,
            NotificationService notifications)
        {
            _jobs = database.GetCollection<Job>("Jobs");
            _storage = storage;
            _notifications = notifications;
        }

        [HttpGet]
        public async Task<IActionResult> GetJobs()
        {
            var jobs = await _jobs.Find(_ => true).ToListAsync();
            return Ok(jobs.Select(ToJobResponse));
        }

        [Authorize(Roles = "Employer")]
        [HttpGet(JobRoutes.Mine)]
        public async Task<IActionResult> GetMyJobs()
        {
            var employerId = GetEmployerId();
            if (employerId == null)
                return Unauthorized("Invalid token");

            var jobs = await _jobs
                .Find(j => j.EmployerId == employerId)
                .ToListAsync();

            return Ok(jobs.Select(ToJobResponse));
        }

        [HttpGet("{id}/cover")]
        public async Task<IActionResult> StreamJobCover(string id)
        {
            if (!MongoIdValidator.IsValid(id))
                return BadRequest("Job id is not valid.");

            var job = await _jobs.Find(j => j.Id == id).FirstOrDefaultAsync();
            if (job == null)
                return NotFound("Job not found");

            if (string.IsNullOrWhiteSpace(job.ImageUrl))
                return NotFound("This job has no cover image.");

            var downloaded = await _storage.TryDownloadAsync(job.ImageUrl);
            if (downloaded == null)
                return NotFound("Cover image could not be loaded. Edit the job and upload the cover again.");

            return File(downloaded.Value.Data, downloaded.Value.ContentType);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetJobById(string id)
        {
            if (!MongoIdValidator.IsValid(id))
                return BadRequest("Job id is not valid. Use the full 24-character id from GET /api/jobs.");

            var job = await _jobs
                .Find(j => j.Id == id)
                .FirstOrDefaultAsync();

            if (job == null)
                return NotFound("Job not found");

            return Ok(ToJobResponse(job));
        }

        [Authorize(Roles = "Employer")]
        [HttpPost]
        public async Task<IActionResult> CreateJob([FromBody] JobWriteDto dto)
        {
            if (dto == null)
                return BadRequest("Job data is required");

            if (string.IsNullOrWhiteSpace(dto.Title)
                || string.IsNullOrWhiteSpace(dto.Company)
                || string.IsNullOrWhiteSpace(dto.Description)
                || string.IsNullOrWhiteSpace(dto.Location)
                || string.IsNullOrWhiteSpace(dto.Experience))
            {
                return BadRequest("All fields are required");
            }

            if (string.IsNullOrWhiteSpace(dto.ImageUrl))
            {
                return BadRequest("Job image is required. Upload an image before publishing.");
            }

            var imageUrlCheck = CloudinaryUrlHelper.CanonicalizeForStorage(dto.ImageUrl);
            if (!_storage.IsOurCloudinaryUrl(imageUrlCheck) && !_storage.IsOurCloudinaryUrl(dto.ImageUrl))
            {
                return BadRequest(
                    "Job image must be uploaded to Cloudinary (POST /api/upload/job-image) first.");
            }

            var employerId = GetEmployerId();
            if (employerId == null)
                return Unauthorized("Invalid token");

            var job = new Job
            {
                Title = dto.Title.Trim(),
                Company = dto.Company.Trim(),
                Description = dto.Description.Trim(),
                Location = dto.Location.Trim(),
                Experience = dto.Experience.Trim(),
                ImageUrl = CloudinaryUrlHelper.CanonicalizeForStorage(dto.ImageUrl),
                EmployerId = employerId,
            };

            await _jobs.InsertOneAsync(job);

            await _notifications.NotifyNewJobMatchesAsync(job);

            return Ok(new
            {
                message = "Job created successfully",
                job = ToJobResponse(job),
            });
        }

        [Authorize(Roles = "Employer")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateJob(string id, [FromBody] JobWriteDto dto)
        {
            if (!MongoIdValidator.IsValid(id))
                return BadRequest("Job id is not valid. Use the full 24-character id from GET /api/jobs/mine.");

            if (dto == null)
                return BadRequest("Job data is required");

            if (string.IsNullOrWhiteSpace(dto.ImageUrl))
                return BadRequest("Job image is required.");

            var imageUrl = CloudinaryUrlHelper.CanonicalizeForStorage(dto.ImageUrl);
            if (!_storage.IsOurCloudinaryUrl(imageUrl) && !_storage.IsOurCloudinaryUrl(dto.ImageUrl))
            {
                return BadRequest(
                    "Job image must be uploaded to Cloudinary (POST /api/upload/job-image) first.");
            }

            var employerId = GetEmployerId();
            if (employerId == null)
                return Unauthorized("Invalid token");

            var existing = await _jobs
                .Find(j => j.Id == id)
                .FirstOrDefaultAsync();

            if (existing == null)
                return NotFound("Job not found");

            var ownershipError = GetOwnershipError(existing, employerId);
            if (ownershipError != null)
                return ownershipError;

            var filter = Builders<Job>.Filter.Eq(j => j.Id, id);
            var update = Builders<Job>.Update
                .Set(j => j.Title, dto.Title.Trim())
                .Set(j => j.Company, dto.Company.Trim())
                .Set(j => j.Description, dto.Description.Trim())
                .Set(j => j.Location, dto.Location.Trim())
                .Set(j => j.Experience, dto.Experience.Trim())
                .Set(j => j.ImageUrl, CloudinaryUrlHelper.CanonicalizeForStorage(dto.ImageUrl));

            if (string.IsNullOrWhiteSpace(existing.EmployerId))
                update = update.Set(j => j.EmployerId, employerId);

            await _jobs.UpdateOneAsync(filter, update);

            return Ok(new { Message = "Job updated successfully" });
        }

        [Authorize(Roles = "Employer")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteJob(string id)
        {
            if (!MongoIdValidator.IsValid(id))
                return BadRequest("Job id is not valid. Use the full 24-character id from GET /api/jobs/mine.");

            var employerId = GetEmployerId();
            if (employerId == null)
                return Unauthorized("Invalid token");

            var existing = await _jobs
                .Find(j => j.Id == id)
                .FirstOrDefaultAsync();

            if (existing == null)
                return NotFound("Job not found");

            var ownershipError = GetOwnershipError(existing, employerId);
            if (ownershipError != null)
                return ownershipError;

            await _jobs.DeleteOneAsync(j => j.Id == id);

            return Ok(new { Message = "Job deleted successfully" });
        }

        private object ToJobResponse(Job j)
        {
            var storedImage = CloudinaryUrlHelper.CanonicalizeForStorage(j.ImageUrl);
            var hasImage = !string.IsNullOrWhiteSpace(storedImage);
            return new
            {
                id = j.Id,
                title = j.Title,
                description = j.Description,
                experience = j.Experience,
                company = j.Company,
                location = j.Location,
                imageUrl = hasImage
                    ? CloudinaryUrlHelper.BuildCoverDeliveryUrl(storedImage)
                    : string.Empty,
                imageUrlOriginal = storedImage,
                hasCoverImage = hasImage,
                employerId = j.EmployerId,
            };
        }

        private string? GetEmployerId() =>
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        private IActionResult? GetOwnershipError(Job job, string yourUserId)
        {
            if (string.IsNullOrWhiteSpace(job.EmployerId))
                return null;

            if (job.EmployerId == yourUserId)
                return null;

            return StatusCode(403, new
            {
                Message = "This job belongs to another employer account. Use GET /api/jobs/mine to see only your jobs.",
                YourUserId = yourUserId,
                JobEmployerId = job.EmployerId,
                JobId = job.Id
            });
        }
    }
}
