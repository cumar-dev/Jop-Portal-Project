using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace job_Portal_Backend.Models
{
    public static class NotificationType
    {
        public const string ApplicationUpdate = "application_update";
        public const string NewJobMatch = "new_job_match";
    }

    public class Notification
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        public string UserId { get; set; } = string.Empty;

        public string Type { get; set; } = string.Empty;

        public string Title { get; set; } = string.Empty;

        public string Message { get; set; } = string.Empty;

        public string? JobId { get; set; }

        public string? ApplicationId { get; set; }

        public string? JobTitle { get; set; }

        public string? Company { get; set; }

        public string? Status { get; set; }

        public bool IsRead { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
