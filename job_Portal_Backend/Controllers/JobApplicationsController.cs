using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using System.Security.Claims;
using job_Portal_Backend.Models;
using job_Portal_Backend.DTOs;
using job_Portal_Backend.Routes;
using job_Portal_Backend.Helpers;
using job_Portal_Backend.Services;

namespace job_Portal_Backend.Controllers
{
    [ApiController]
    [Route(ApplicationRoutes.Base)]
    public class JobApplicationsController : ControllerBase
    {
        private readonly IMongoCollection<JobApplication> _applications;
        private readonly IMongoCollection<Job> _jobs;
        private readonly CloudinaryStorageService _storage;
        private readonly NotificationService _notifications;

        public JobApplicationsController(
            IMongoDatabase database,
            CloudinaryStorageService storage,
            NotificationService notifications)
        {
            _applications = database.GetCollection<JobApplication>("Applications");
            _jobs = database.GetCollection<Job>("Jobs");
            _storage = storage;
            _notifications = notifications;
        }

        [Authorize(Roles = "Applicant")]
        [HttpPost(ApplicationRoutes.Apply)]
        public async Task<IActionResult> ApplyJob([FromBody] ApplyJobDto dto)
        {
            if (dto == null)
                return BadRequest("Application data is required");

            dto.JobId = MongoIdValidator.Normalize(dto.JobId) ?? string.Empty;

            if (string.IsNullOrWhiteSpace(dto.JobId))
                return BadRequest("JobId is required");

            if (!MongoIdValidator.IsValid(dto.JobId))
            {
                return BadRequest(new
                {
                    Message = "JobId is not valid. It must be exactly 24 characters (letters a-f and numbers 0-9).",
                    Example = "6a0b41e2fd08bba37c159f1c",
                    YouSent = dto.JobId,
                    Length = dto.JobId.Length,
                    Hint = "Run GET /api/jobs and copy the full \"id\" field — do not type a short or fake id."
                });
            }

            if (string.IsNullOrWhiteSpace(dto.CVFileUrl))
                return BadRequest("CV file URL is required. Upload your CV first, then submit.");

            var cvUrl = CloudinaryUrlHelper.CanonicalizeForStorage(dto.CVFileUrl);
            if (!_storage.IsOurCloudinaryUrl(cvUrl) && !_storage.IsOurCloudinaryUrl(dto.CVFileUrl))
            {
                return BadRequest(
                    "CV must be uploaded to Cloudinary (POST /api/upload/cv) before applying.");
            }

            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var name = User.FindFirst(ClaimTypes.Name)?.Value;
            var email = User.FindFirst(ClaimTypes.Email)?.Value;

            if (string.IsNullOrWhiteSpace(userId))
                return Unauthorized("Invalid token");

            var jobExists = await _jobs
                .Find(j => j.Id == dto.JobId)
                .AnyAsync();

            if (!jobExists)
                return NotFound("Job not found");

            var alreadyApplied = await _applications
                .Find(a => a.JobId == dto.JobId && a.UserId == userId)
                .FirstOrDefaultAsync();

            if (alreadyApplied != null)
                return BadRequest("You already applied");

            var app = new JobApplication
            {
                JobId = dto.JobId,
                UserId = userId,
                ApplicantName = name ?? "Unknown",
                Email = email ?? "Unknown",
                YearsOfExperience = dto.YearsOfExperience,
                Skills = dto.Skills ?? string.Empty,
                EducationLevel = dto.EducationLevel ?? string.Empty,
                CVFileUrl = CloudinaryUrlHelper.NormalizeDocumentUrl(dto.CVFileUrl),
                Message = dto.Message ?? string.Empty,
                Status = ApplicationStatus.Pending,
                AppliedAt = DateTime.UtcNow
            };

            await _applications.InsertOneAsync(app);

            return Ok(new
            {
                message = "Applied successfully",
                applicationId = app.Id
            });
        }

        [Authorize(Roles = "Employer")]
        [HttpGet(ApplicationRoutes.GetApplicantsForJob)]
        public async Task<IActionResult> GetApplicantsForJob(string jobId)
        {
            if (string.IsNullOrWhiteSpace(jobId))
                return BadRequest("JobId is required");

            if (!MongoIdValidator.IsValid(jobId))
                return BadRequest("JobId is not valid. Use the full 24-character id from GET /api/jobs.");

            var employerId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrWhiteSpace(employerId))
                return Unauthorized("Invalid token");

            var job = await _jobs
                .Find(j => j.Id == jobId)
                .FirstOrDefaultAsync();

            if (job == null)
                return NotFound("Job not found");

            if (string.IsNullOrWhiteSpace(job.EmployerId) || job.EmployerId != employerId)
            {
                return StatusCode(403, new
                {
                    Message = "You can only view applicants for jobs you posted. Log in as the employer who created this job, or use a job id from GET /api/jobs/mine.",
                    YourUserId = employerId,
                    JobEmployerId = job.EmployerId,
                    JobId = job.Id
                });
            }

            var applications = await _applications
                .Find(a => a.JobId == jobId)
                .SortByDescending(a => a.AppliedAt)
                .ToListAsync();

            var result = await MapApplicationsWithJobs(applications);
            return Ok(result);
        }

        [Authorize(Roles = "Applicant")]
        [HttpGet(ApplicationRoutes.MyApplications)]
        public async Task<IActionResult> GetMyApplications([FromQuery] int limit = 50)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrWhiteSpace(userId))
                return Unauthorized("Invalid token");

            if (limit < 1) limit = 1;
            if (limit > 100) limit = 100;

            var applications = await _applications
                .Find(a => a.UserId == userId)
                .SortByDescending(a => a.AppliedAt)
                .Limit(limit)
                .ToListAsync();

            var result = await MapApplicationsWithJobs(applications);
            return Ok(result);
        }

        [Authorize(Roles = "Employer")]
        [HttpGet(ApplicationRoutes.RecentApplications)]
        public async Task<IActionResult> GetRecentApplications([FromQuery] int limit = 50)
        {
            var employerId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrWhiteSpace(employerId))
                return Unauthorized("Invalid token");

            if (limit < 1) limit = 1;
            if (limit > 100) limit = 100;

            var myJobIds = await _jobs
                .Find(j => j.EmployerId == employerId)
                .Project(j => j.Id)
                .ToListAsync();

            var jobIdList = myJobIds
                .Where(id => !string.IsNullOrWhiteSpace(id))
                .Select(id => id!)
                .ToList();

            if (jobIdList.Count == 0)
                return Ok(Array.Empty<ApplicationListItemDto>());

            var applications = await _applications
                .Find(a => jobIdList.Contains(a.JobId))
                .SortByDescending(a => a.AppliedAt)
                .Limit(limit)
                .ToListAsync();

            var result = await MapApplicationsWithJobs(applications);
            return Ok(result);
        }

        [Authorize(Roles = "Employer")]
        [HttpPut(ApplicationRoutes.UpdateStatus)]
        public async Task<IActionResult> UpdateApplicationStatus(
            string id,
            [FromBody] UpdateApplicationStatusDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.Status))
                return BadRequest("Status is required");

            if (!ApplicationStatus.IsValid(dto.Status))
            {
                return BadRequest(new
                {
                    Message = "Invalid status. Use Pending, Reviewed, Accepted, or Rejected.",
                    Allowed = ApplicationStatus.All
                });
            }

            if (!MongoIdValidator.IsValid(id))
                return BadRequest("Application id is not valid.");

            var employerId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrWhiteSpace(employerId))
                return Unauthorized("Invalid token");

            var application = await _applications
                .Find(a => a.Id == id)
                .FirstOrDefaultAsync();

            if (application == null)
                return NotFound("Application not found");

            var job = await _jobs
                .Find(j => j.Id == application.JobId)
                .FirstOrDefaultAsync();

            if (job == null)
                return NotFound("Job not found");

            if (string.IsNullOrWhiteSpace(job.EmployerId) || job.EmployerId != employerId)
                return StatusCode(403, new { Message = "You can only update applications for your own jobs." });

            var previousStatus = application.Status;
            application.Status = ApplicationStatus.Normalize(dto.Status);

            await _applications.ReplaceOneAsync(a => a.Id == id, application);

            if (!string.Equals(previousStatus, application.Status, StringComparison.OrdinalIgnoreCase))
            {
                await _notifications.NotifyApplicationStatusAsync(application, job, application.Status);
            }

            return Ok(new
            {
                message = "Application status updated",
                applicationId = application.Id,
                status = application.Status
            });
        }

        [Authorize(Roles = "Applicant")]
        [HttpPut("update/{id}")]
        public async Task<IActionResult> UpdateApplication(
            string id,
            [FromBody] ApplyJobDto dto)
        {
            if (dto == null)
                return BadRequest("Application data is required");

            if (!MongoIdValidator.IsValid(id))
                return BadRequest("Application id is not valid.");

            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrWhiteSpace(userId))
                return Unauthorized("Invalid token");

            var existingApplication = await _applications
                .Find(a => a.Id == id && a.UserId == userId)
                .FirstOrDefaultAsync();

            if (existingApplication == null)
                return NotFound("Application not found");

            existingApplication.YearsOfExperience = dto.YearsOfExperience;
            existingApplication.Skills = dto.Skills ?? string.Empty;
            existingApplication.EducationLevel = dto.EducationLevel ?? string.Empty;

            var requestedCv = (dto.CVFileUrl ?? string.Empty).Trim();
            if (!string.IsNullOrWhiteSpace(requestedCv))
            {
                var canonicalCv = CloudinaryUrlHelper.CanonicalizeForStorage(requestedCv);
                if (_storage.IsOurCloudinaryUrl(canonicalCv) || _storage.IsOurCloudinaryUrl(requestedCv))
                {
                    existingApplication.CVFileUrl =
                        CloudinaryUrlHelper.NormalizeDocumentUrl(canonicalCv);
                }
            }

            existingApplication.Message = dto.Message ?? string.Empty;
            existingApplication.AppliedAt = DateTime.UtcNow;

            await _applications.ReplaceOneAsync(
                a => a.Id == id,
                existingApplication);

            return Ok(new
            {
                Message = "Application updated successfully",
                Application = existingApplication
            });
        }

        [Authorize(Roles = "Applicant")]
        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> DeleteApplication(string id)
        {
            if (!MongoIdValidator.IsValid(id))
                return BadRequest("Application id is not valid.");

            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrWhiteSpace(userId))
                return Unauthorized("Invalid token");

            var application = await _applications
                .Find(a => a.Id == id && a.UserId == userId)
                .FirstOrDefaultAsync();

            if (application == null)
                return NotFound("Application not found");

            await _applications.DeleteOneAsync(a => a.Id == id);

            return Ok(new { Message = "Application deleted successfully" });
        }

        private async Task<List<ApplicationListItemDto>> MapApplicationsWithJobs(
            List<JobApplication> applications)
        {
            if (applications.Count == 0)
                return new List<ApplicationListItemDto>();

            var jobIds = applications
                .Select(a => a.JobId)
                .Distinct()
                .Where(id => MongoIdValidator.IsValid(id))
                .ToList();

            var jobs = await _jobs
                .Find(j => j.Id != null && jobIds.Contains(j.Id))
                .ToListAsync();

            var jobMap = jobs
                .Where(j => j.Id != null)
                .ToDictionary(j => j.Id!);

            return applications.Select(a =>
            {
                jobMap.TryGetValue(a.JobId, out var job);
                var storedCv = CloudinaryUrlHelper.NormalizeDocumentUrl(a.CVFileUrl);
                return new ApplicationListItemDto
                {
                    ApplicationId = a.Id,
                    JobId = a.JobId,
                    JobTitle = job?.Title ?? "Unknown",
                    Company = job?.Company ?? "Unknown",
                    Location = job?.Location ?? "Unknown",
                    ApplicantName = a.ApplicantName,
                    Email = a.Email,
                    YearsOfExperience = a.YearsOfExperience,
                    Skills = a.Skills,
                    EducationLevel = a.EducationLevel,
                    CVFileUrl = _storage.GetCvViewUrl(storedCv),
                    CVFileUrlStored = storedCv,
                    CVDownloadUrl = _storage.GetCvDownloadUrl(storedCv),
                    Message = a.Message,
                    Status = ApplicationStatus.Normalize(a.Status),
                    AppliedAt = a.AppliedAt
                };
            }).ToList();
        }
    }
}
