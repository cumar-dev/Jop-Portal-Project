using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace job_Portal_Backend.Models
{
    public class Job
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        public string Title { get; set; } =
            string.Empty;
        public string Description { get; set; } =
            string.Empty;

         public string Experience { get; set; } =
            string.Empty;
        public string Company { get; set; } =
            string.Empty;

        public string Location { get; set; } =
            string.Empty;
    }
}