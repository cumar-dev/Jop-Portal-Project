using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace job_Portal_Backend.Models
{
    public class JobApplication
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        public string JobId { get; set; } = string.Empty;

        // FROM JWT (NEVER FROM FRONTEND)
        public string UserId { get; set; } = string.Empty;
        public string ApplicantName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;

        // APPLICATION DATA
        public int YearsOfExperience { get; set; }
        public string Skills { get; set; } = string.Empty;
        public string EducationLevel { get; set; } = string.Empty;

        public string CVFileUrl { get; set; } = string.Empty;

        public string Message { get; set; } = string.Empty;

        public string Status { get; set; } = ApplicationStatus.Pending;

        public DateTime AppliedAt { get; set; }
    }
}