using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace job_Portal_Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProtectedController : ControllerBase
    {
        // ======================
        // GET
        // ======================
        [Authorize(Roles = "Employer,JobSeeker")]
        [HttpGet]
        public IActionResult GetProtectedData()
        {
            return Ok(new
            {
                Message = "GET works",

                User = User.FindFirst(ClaimTypes.Name)?.Value,

                Role = User.FindFirst(ClaimTypes.Role)?.Value
            });
        }

        // ======================
        // POST
        // ======================
        [Authorize(Roles = "Employer,JobSeeker")]
        [HttpPost]
        public IActionResult CreateData([FromBody] object data)
        {
            return Ok(new
            {
                Message = "POST works",

                Data = data,

                User = User.FindFirst(ClaimTypes.Name)?.Value,

                Role = User.FindFirst(ClaimTypes.Role)?.Value
            });
        }
    }
}