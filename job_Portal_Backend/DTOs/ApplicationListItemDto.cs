using System.Text.Json.Serialization;
using job_Portal_Backend.Models;

namespace job_Portal_Backend.DTOs
{
    public class ApplicationListItemDto
    {
        public string? ApplicationId { get; set; }
        public string JobId { get; set; } = string.Empty;
        public string JobTitle { get; set; } = string.Empty;
        public string Company { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public string ApplicantName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public int YearsOfExperience { get; set; }
        public string Skills { get; set; } = string.Empty;
        public string EducationLevel { get; set; } = string.Empty;
        [JsonPropertyName("cvFileUrl")]
        public string CVFileUrl { get; set; } = string.Empty;

        [JsonPropertyName("cvDownloadUrl")]
        public string CVDownloadUrl { get; set; } = string.Empty;

        [JsonPropertyName("cvFileUrlStored")]
        public string CVFileUrlStored { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string Status { get; set; } = ApplicationStatus.Pending;
        public DateTime AppliedAt { get; set; }
    }
}
