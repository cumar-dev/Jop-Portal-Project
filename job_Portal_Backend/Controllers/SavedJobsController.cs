using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using System.Security.Claims;
using job_Portal_Backend.Helpers;
using job_Portal_Backend.Models;
using job_Portal_Backend.Routes;
using job_Portal_Backend.Services;

namespace job_Portal_Backend.Controllers
{
    [ApiController]
    [Route(SavedJobRoutes.Base)]
    [Authorize(Roles = "Applicant")]
    public class SavedJobsController : ControllerBase
    {
        private readonly IMongoCollection<SavedJob> _savedJobs;
        private readonly IMongoCollection<Job> _jobs;

        public SavedJobsController(IMongoDatabase database)
        {
            _savedJobs = database.GetCollection<SavedJob>("SavedJobs");
            _jobs = database.GetCollection<Job>("Jobs");
        }

        [HttpGet]
        public async Task<IActionResult> GetSavedJobs()
        {
            var applicantId = GetApplicantId();
            if (applicantId == null)
                return Unauthorized("Invalid token");

            var saved = await _savedJobs
                .Find(s => s.ApplicantId == applicantId)
                .SortByDescending(s => s.SavedAt)
                .ToListAsync();

            if (saved.Count == 0)
                return Ok(Array.Empty<object>());

            var jobIds = saved.Select(s => s.JobId).Distinct().ToList();
            var jobs = await _jobs
                .Find(j => jobIds.Contains(j.Id!))
                .ToListAsync();

            var jobById = jobs.ToDictionary(j => j.Id!);

            var result = saved
                .Where(s => jobById.ContainsKey(s.JobId))
                .Select(s => new
                {
                    savedAt = s.SavedAt,
                    job = ToJobResponse(jobById[s.JobId]),
                })
                .ToList();

            return Ok(result);
        }

        [HttpGet(SavedJobRoutes.Ids)]
        public async Task<IActionResult> GetSavedJobIds()
        {
            var applicantId = GetApplicantId();
            if (applicantId == null)
                return Unauthorized("Invalid token");

            var ids = await _savedJobs
                .Find(s => s.ApplicantId == applicantId)
                .Project(s => s.JobId)
                .ToListAsync();

            return Ok(ids);
        }

        [HttpPost(SavedJobRoutes.ByJobId)]
        public async Task<IActionResult> SaveJob(string jobId)
        {
            jobId = MongoIdValidator.Normalize(jobId) ?? string.Empty;
            if (!MongoIdValidator.IsValid(jobId))
                return BadRequest("Job id is not valid.");

            var applicantId = GetApplicantId();
            if (applicantId == null)
                return Unauthorized("Invalid token");

            var jobExists = await _jobs.Find(j => j.Id == jobId).AnyAsync();
            if (!jobExists)
                return NotFound("Job not found");

            var existing = await _savedJobs
                .Find(s => s.ApplicantId == applicantId && s.JobId == jobId)
                .FirstOrDefaultAsync();

            if (existing != null)
                return Ok(new { message = "Job already saved", jobId });

            var saved = new SavedJob
            {
                ApplicantId = applicantId,
                JobId = jobId,
                SavedAt = DateTime.UtcNow,
            };

            await _savedJobs.InsertOneAsync(saved);

            return Ok(new { message = "Job saved", jobId });
        }

        [HttpDelete(SavedJobRoutes.ByJobId)]
        public async Task<IActionResult> RemoveSavedJob(string jobId)
        {
            jobId = MongoIdValidator.Normalize(jobId) ?? string.Empty;
            if (!MongoIdValidator.IsValid(jobId))
                return BadRequest("Job id is not valid.");

            var applicantId = GetApplicantId();
            if (applicantId == null)
                return Unauthorized("Invalid token");

            var result = await _savedJobs.DeleteOneAsync(
                s => s.ApplicantId == applicantId && s.JobId == jobId);

            if (result.DeletedCount == 0)
                return NotFound("Saved job not found");

            return Ok(new { message = "Job removed from saved", jobId });
        }

        private string? GetApplicantId() =>
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        private static object ToJobResponse(Job j)
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
    }
}
