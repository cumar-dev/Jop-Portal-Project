using MongoDB.Driver;
using job_Portal_Backend.Models;

namespace job_Portal_Backend.Services
{
    public class UserService
    {
        private readonly IMongoCollection<User> _users;

        public UserService(IMongoClient mongoClient, IConfiguration config)
        {
            var dbName = config["MongoDbSettings:DatabaseName"];
            var database = mongoClient.GetDatabase(dbName);
            _users = database.GetCollection<User>("Users");

            var indexKeys = Builders<User>.IndexKeys.Ascending(u => u.Email);
            var indexOptions = new CreateIndexOptions { Unique = true };

            try
            {
                _users.Indexes.CreateOne(
                    new CreateIndexModel<User>(indexKeys, indexOptions));
            }
            catch (MongoCommandException)
            {
                // Index already exists
            }
        }

        public async Task CreateUser(User user)
        {
            await _users.InsertOneAsync(user);
        }

        public async Task<User?> GetByEmail(string email)
        {
            var normalized = NormalizeEmail(email);
            return await _users
                .Find(u => u.Email == normalized)
                .FirstOrDefaultAsync();
        }

        public async Task<bool> EmailExists(string email)
        {
            var normalized = NormalizeEmail(email);
            return await _users
                .Find(u => u.Email == normalized)
                .AnyAsync();
        }

        public async Task<User?> GetById(string id)
        {
            if (string.IsNullOrWhiteSpace(id))
                return null;

            return await _users.Find(u => u.Id == id).FirstOrDefaultAsync();
        }

        public async Task<User?> UpdateProfileAsync(
            string id,
            string fullName,
            string? profileImageUrl)
        {
            if (string.IsNullOrWhiteSpace(id))
                return null;

            var update = Builders<User>.Update.Set(u => u.FullName, fullName.Trim());

            if (profileImageUrl != null)
                update = update.Set(u => u.ProfileImageUrl, profileImageUrl);

            var result = await _users.UpdateOneAsync(u => u.Id == id, update);
            if (result.MatchedCount == 0)
                return null;

            return await GetById(id);
        }

        private static string NormalizeEmail(string email) =>
            email.Trim().ToLowerInvariant();
    }
}
