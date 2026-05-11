using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace job_Portal_Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProtectedController : ControllerBase
    {
        [Authorize(Roles = "Employer,JobSeeker")]
        [HttpGet]
        public IActionResult GetProtectedData()
        {
            return Ok(new
            {
                Message = "Access granted",

                User = User.FindFirst(ClaimTypes.Name)?.Value,

                Role = User.FindFirst(ClaimTypes.Role)?.Value
            });
        }
    }
}