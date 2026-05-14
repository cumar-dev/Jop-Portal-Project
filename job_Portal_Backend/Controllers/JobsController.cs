using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using job_Portal_Backend.Models;

namespace job_Portal_Backend.Controllers
{
    [ApiController]
    [Route("api/jobs")]
    public class JobsController : ControllerBase
    {
        private readonly IMongoCollection<Job> _jobs;

        public JobsController(IMongoClient mongoClient)
        {
            var database = mongoClient.GetDatabase("JobPortal");

            _jobs = database.GetCollection<Job>("Jobs");
        }

        // =========================
        // GET ALL JOBS
        // =========================
        [HttpGet]
        public async Task<IActionResult> GetJobs()
        {
            var jobs =
                await _jobs.Find(_ => true).ToListAsync();

            return Ok(jobs);
        }

        // =========================
        // GET JOB BY ID
        // =========================
        [HttpGet("{id}")]
        public async Task<IActionResult> GetJobById(string id)
        {
            var job =
                await _jobs.Find(j => j.Id == id)
                           .FirstOrDefaultAsync();

            if (job == null)
            {
                return NotFound("Job not found");
            }

            return Ok(job);
        }

        // =========================
        // CREATE JOB
        // =========================
        [Authorize(Roles = "Employer")]
        [HttpPost]
        public async Task<IActionResult> CreateJob(
            [FromBody] Job job)
        {
            if (string.IsNullOrWhiteSpace(job.Title)
                || string.IsNullOrWhiteSpace(job.Company)
                || string.IsNullOrWhiteSpace(job.Description)
                || string.IsNullOrWhiteSpace(job.Location)
                || string.IsNullOrWhiteSpace(job.Experience))
            {
                return BadRequest("All fields are required");
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
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateJob(
            string id,
            [FromBody] Job updatedJob)
        {
            if (updatedJob == null)
            {
                return BadRequest("Job data is required");
            }

            var filter =
                Builders<Job>.Filter.Eq(j => j.Id, id);

            var update =
                Builders<Job>.Update
                    .Set(j => j.Title, updatedJob.Title)
                    .Set(j => j.Company, updatedJob.Company)
                    .Set(j => j.Description, updatedJob.Description)
                    .Set(j => j.Location, updatedJob.Location)
                    .Set(j => j.Experience, updatedJob.Experience);

            var result =
                await _jobs.UpdateOneAsync(filter, update);

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
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteJob(string id)
        {
            var result =
                await _jobs.DeleteOneAsync(j => j.Id == id);

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