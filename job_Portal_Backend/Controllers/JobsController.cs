using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;

using job_Portal_Backend.Models;
using job_Portal_Backend.Routes;

namespace job_Portal_Backend.Controllers
{
    [ApiController]
    [Route(JobRoutes.Base)]
    public class JobsController : ControllerBase
    {
        private readonly IMongoCollection<Job> _jobs;

        public JobsController(IMongoClient mongoClient)
        {
            var database =
                mongoClient.GetDatabase("JobPortal");

            _jobs =
                database.GetCollection<Job>("Jobs");
        }

        // =========================
        // GET ALL JOBS
        // =========================
        [HttpGet(JobRoutes.GetAll)]
        public async Task<IActionResult> GetJobs()
        {
            var jobs =
                await _jobs.Find(_ => true).ToListAsync();

            return Ok(jobs);
        }

        // =========================
        // CREATE JOB
        // =========================
        [Authorize(Roles = "Employer")]
        [HttpPost(JobRoutes.Create)]
        public async Task<IActionResult> CreateJob(
            [FromBody] Job job)
        {
            if (string.IsNullOrWhiteSpace(job.Title)
                || string.IsNullOrWhiteSpace(job.Company)
                || string.IsNullOrWhiteSpace(job.Description)
                || string.IsNullOrWhiteSpace(job.Location)
                || string.IsNullOrWhiteSpace(job.Experience)
                )
            {
                return BadRequest(
                    "Title and Company are required"
                );
            }

            await _jobs.InsertOneAsync(job);

            return Ok(new
            {
                Message = "Job created successfully",
                Job = job
            });
        }

        // =========================
        // UPDATE JOB
        // =========================
        [Authorize(Roles = "Employer")]
        [HttpPut(JobRoutes.Update)]
        public async Task<IActionResult> UpdateJob(
            string id,
            [FromBody] Job updatedJob)
        {
            var result =
                await _jobs.ReplaceOneAsync(
                    j => j.Id == id,
                    updatedJob
                );

            if (result.MatchedCount == 0)
            {
                return NotFound("Job not found");
            }

            return Ok(new
            {
                Message = "Job updated successfully"
            });
        }

        // =========================
        // DELETE JOB
        // =========================
        [Authorize(Roles = "Employer")]
        [HttpDelete(JobRoutes.Delete)]
        public async Task<IActionResult> DeleteJob(
            string id)
        {
            var result =
                await _jobs.DeleteOneAsync(
                    j => j.Id == id
                );

            if (result.DeletedCount == 0)
            {
                return NotFound("Job not found");
            }

            return Ok(new
            {
                Message = "Job deleted successfully"
            });
        }
    }
}