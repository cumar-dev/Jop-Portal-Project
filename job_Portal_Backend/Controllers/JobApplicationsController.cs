using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using System.Security.Claims;

using job_Portal_Backend.Models;
using job_Portal_Backend.DTOs;
using job_Portal_Backend.Routes;

namespace job_Portal_Backend.Controllers
{
    [ApiController]
    [Route(ApplicationRoutes.Base)]
    public class JobApplicationsController : ControllerBase
    {
        private readonly IMongoCollection<JobApplication> _applications;

        public JobApplicationsController(IMongoClient mongoClient)
        {
            var db = mongoClient.GetDatabase("JobPortal");
            _applications = db.GetCollection<JobApplication>("Applications");
        }

        // =========================
        // APPLY FOR JOB (FIXED)
        // =========================
        [Authorize(Roles = "Applicant")]
        [HttpPost(ApplicationRoutes.Apply)]
        public async Task<IActionResult> ApplyJob([FromBody] ApplyJobDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.JobId))
                return BadRequest("JobId is required");

            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var name = User.FindFirst(ClaimTypes.Name)?.Value;
            var email = User.FindFirst(ClaimTypes.Email)?.Value;

            if (string.IsNullOrWhiteSpace(userId))
                return Unauthorized("Invalid token");

            // CHECK DUPLICATE
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
                Skills = dto.Skills,
                EducationLevel = dto.EducationLevel,
                CVFileUrl = dto.CVFileUrl,
                Message = dto.Message,
                AppliedAt = DateTime.UtcNow
            };

            await _applications.InsertOneAsync(app);

            return Ok(new
            {
                message = "Applied successfully",
                applicationId = app.Id
            });
        }

        // =========================
        // GET APPLICANTS FOR JOB
        // =========================
        [Authorize(Roles = "Employer")]
        [HttpGet(ApplicationRoutes.GetApplicantsForJob)]
        public async Task<IActionResult> GetApplicantsForJob(string jobId)
        {
            if (string.IsNullOrWhiteSpace(jobId))
                return BadRequest("JobId is required");

            var applications = await _applications
                .Find(a => a.JobId == jobId)
                .ToListAsync();

            if (applications.Count == 0)
                return NotFound("No applicants found");

            return Ok(applications);
        }

        // =========================
        // UPDATE APPLICATION
        // =========================
        [Authorize(Roles = "Applicant")]
        [HttpPut("update/{id}")]
        public async Task<IActionResult> UpdateApplication(
            string id,
            [FromBody] ApplyJobDto dto)
        {
            var userId =
                User.FindFirst(ClaimTypes.NameIdentifier)
                ?.Value;

            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized("Invalid token");
            }

            var existingApplication =
                await _applications
                .Find(a =>
                    a.Id == id &&
                    a.UserId == userId)
                .FirstOrDefaultAsync();

            if (existingApplication == null)
            {
                return NotFound(
                    "Application not found");
            }

            // UPDATE VALUES
            existingApplication.JobId =
          dto.JobId;

            existingApplication.UserId =
                userId;
           
           existingApplication.YearsOfExperience =
                dto.YearsOfExperience;

            existingApplication.Skills =
                dto.Skills;

            existingApplication.EducationLevel =
                dto.EducationLevel;

            existingApplication.CVFileUrl =
                dto.CVFileUrl;

            existingApplication.Message =
                dto.Message;

            existingApplication.AppliedAt =
                DateTime.UtcNow;

            await _applications.ReplaceOneAsync(
                a => a.Id == id,
                existingApplication);

            return Ok(new
            {
                Message =
                    "Application updated successfully",

                Application =
                    existingApplication
            });
        }

        // =========================
        // DELETE APPLICATION
        // =========================
        [Authorize(Roles = "Applicant")]
        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> DeleteApplication(
            string id)
        {
            var userId =
                User.FindFirst(ClaimTypes.NameIdentifier)
                ?.Value;

            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized("Invalid token");
            }

            var application =
                await _applications
                .Find(a =>
                    a.Id == id &&
                    a.UserId == userId)
                .FirstOrDefaultAsync();

            if (application == null)
            {
                return NotFound(
                    "Application not found");
            }

            await _applications.DeleteOneAsync(
                a => a.Id == id);

            return Ok(new
            {
                Message =
                    "Application deleted successfully"
            });
        }
    }
}