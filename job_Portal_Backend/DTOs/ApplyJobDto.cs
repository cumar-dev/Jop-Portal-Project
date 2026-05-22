using System.Text.Json.Serialization;

namespace job_Portal_Backend.DTOs
{
    public class ApplyJobDto
    {
        public string JobId { get; set; } = string.Empty;
        public int YearsOfExperience { get; set; }
        public string Skills { get; set; } = string.Empty;
        public string EducationLevel { get; set; } = string.Empty;

        [JsonPropertyName("cvFileUrl")]
        public string CVFileUrl { get; set; } = string.Empty;

        public string Message { get; set; } = string.Empty;
    }
}