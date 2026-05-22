using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace job_Portal_Backend.Models
{
    public class SavedJob
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        public string ApplicantId { get; set; } = string.Empty;

        public string JobId { get; set; } = string.Empty;

        public DateTime SavedAt { get; set; } = DateTime.UtcNow;
    }
}
