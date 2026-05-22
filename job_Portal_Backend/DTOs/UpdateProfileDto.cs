using System.Text.Json.Serialization;

namespace job_Portal_Backend.DTOs
{
    public class UpdateProfileDto
    {
        public string? FullName { get; set; }

        [JsonPropertyName("profileImageUrl")]
        public string? ProfileImageUrl { get; set; }
    }
}
