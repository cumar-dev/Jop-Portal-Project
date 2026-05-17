using Microsoft.AspNetCore.Mvc;
using job_Portal_Backend.Routes;
using job_Portal_Backend.Services;

namespace job_Portal_Backend.Controllers
{
    [ApiController]
    [Route(UploadRoutes.Base)]
    public class UploadController : ControllerBase
    {
        private readonly CloudinaryService _cloudinaryService;

        public UploadController(CloudinaryService cloudinaryService)
        {
            _cloudinaryService = cloudinaryService;
        }

        // POST: api/upload/file
        [HttpPost(UploadRoutes.UploadFile)]
        [RequestSizeLimit(10_000_000)] // 10MB limit
        public async Task<IActionResult> UploadFile([FromForm] IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded");

            var url = await _cloudinaryService.UploadFileAsync(file);

            return Ok(new
            {
                message = "File uploaded successfully",
                url
            });
        }
    }
}