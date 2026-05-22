using MongoDB.Driver;
using job_Portal_Backend.Models;

namespace job_Portal_Backend.Services
{
    public class NotificationService
    {
        private readonly IMongoCollection<Notification> _notifications;
        private readonly IMongoCollection<JobApplication> _applications;
        private readonly IMongoCollection<User> _users;

        public NotificationService(IMongoDatabase database)
        {
            _notifications = database.GetCollection<Notification>("Notifications");
            _applications = database.GetCollection<JobApplication>("Applications");
            _users = database.GetCollection<User>("Users");
        }

        public async Task NotifyApplicationStatusAsync(
            JobApplication application,
            Job job,
            string newStatus)
        {
            if (string.IsNullOrWhiteSpace(application.UserId))
                return;

            var notification = new Notification
            {
                UserId = application.UserId,
                Type = NotificationType.ApplicationUpdate,
                Title = "Application status updated",
                Message =
                    $"Your application for {job.Title} at {job.Company} is now {newStatus}.",
                JobId = job.Id,
                ApplicationId = application.Id,
                JobTitle = job.Title,
                Company = job.Company,
                Status = newStatus,
                IsRead = false,
                CreatedAt = DateTime.UtcNow,
            };

            await _notifications.InsertOneAsync(notification);
        }

        public async Task NotifyNewJobMatchesAsync(Job job)
        {
            if (string.IsNullOrWhiteSpace(job.Id))
                return;

            var applicantIds = (await _users
                .Find(u => u.Role == "Applicant")
                .Project(u => u.Id)
                .ToListAsync())
                .Where(id => !string.IsNullOrWhiteSpace(id))
                .Select(id => id!)
                .ToList();

            if (applicantIds.Count == 0)
                return;

            var applications = await _applications
                .Find(a => applicantIds.Contains(a.UserId))
                .ToListAsync();

            var skillsByApplicant = applications
                .GroupBy(a => a.UserId)
                .ToDictionary(
                    g => g.Key,
                    g => ParseSkillTokens(g.Select(a => a.Skills)));

            var notifications = new List<Notification>();

            foreach (var applicantId in applicantIds)
            {
                if (string.IsNullOrWhiteSpace(applicantId))
                    continue;

                if (!string.IsNullOrWhiteSpace(job.EmployerId) && applicantId == job.EmployerId)
                    continue;

                if (!skillsByApplicant.TryGetValue(applicantId, out var tokens) || tokens.Count == 0)
                    continue;

                if (!JobMatchesSkills(job, tokens))
                    continue;

                notifications.Add(new Notification
                {
                    UserId = applicantId,
                    Type = NotificationType.NewJobMatch,
                    Title = "New job matches your skills",
                    Message =
                        $"{job.Title} at {job.Company} may match skills from your profile.",
                    JobId = job.Id,
                    JobTitle = job.Title,
                    Company = job.Company,
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow,
                });
            }

            if (notifications.Count > 0)
                await _notifications.InsertManyAsync(notifications);
        }

        private static HashSet<string> ParseSkillTokens(IEnumerable<string> skillFields)
        {
            var tokens = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            foreach (var field in skillFields)
            {
                if (string.IsNullOrWhiteSpace(field))
                    continue;

                foreach (var part in field.Split(',', ';', '|', '\n'))
                {
                    var token = part.Trim().ToLowerInvariant();
                    if (token.Length >= 2)
                        tokens.Add(token);
                }
            }

            return tokens;
        }

        private static bool JobMatchesSkills(Job job, HashSet<string> skillTokens)
        {
            var haystack =
                $"{job.Title} {job.Description} {job.Experience} {job.Company} {job.Location}"
                    .ToLowerInvariant();

            return skillTokens.Any(token => haystack.Contains(token, StringComparison.Ordinal));
        }
    }
}
