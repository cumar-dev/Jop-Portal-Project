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

            // Ensure unique index on Email at startup
            var indexKeys = Builders<User>.IndexKeys.Ascending(u => u.Email);
            var indexOptions = new CreateIndexOptions { Unique = true };
            _users.Indexes.CreateOne(new CreateIndexModel<User>(indexKeys, indexOptions));
        }

        public async Task CreateUser(User user)
        {
            await _users.InsertOneAsync(user);
        }

        public async Task<User?> GetByEmail(string email)
        {
            return await _users
                .Find(u => u.Email == email)
                .FirstOrDefaultAsync();
        }

        public async Task<bool> EmailExists(string email)
        {
            return await _users
                .Find(u => u.Email == email)
                .AnyAsync();
        }
    }
}