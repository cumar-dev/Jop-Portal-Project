using MongoDB.Bson;

namespace job_Portal_Backend.Helpers
{
    public static class MongoIdValidator
    {
        public static bool IsValid(string? id)
        {
            if (string.IsNullOrWhiteSpace(id))
                return false;

            var trimmed = id.Trim();
            return trimmed.Length == 24 && ObjectId.TryParse(trimmed, out _);
        }

        public static string? Normalize(string? id) =>
            string.IsNullOrWhiteSpace(id) ? null : id.Trim();
    }
}
