using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using System.Security.Claims;
using job_Portal_Backend.Helpers;
using job_Portal_Backend.Models;
using job_Portal_Backend.Routes;

namespace job_Portal_Backend.Controllers
{
    [ApiController]
    [Route(NotificationRoutes.Base)]
    [Authorize(Roles = "Applicant")]
    public class NotificationsController : ControllerBase
    {
        private readonly IMongoCollection<Notification> _notifications;

        public NotificationsController(IMongoDatabase database)
        {
            _notifications = database.GetCollection<Notification>("Notifications");
        }

        [HttpGet]
        public async Task<IActionResult> GetNotifications([FromQuery] int limit = 50)
        {
            var userId = GetUserId();
            if (userId == null)
                return Unauthorized("Invalid token");

            limit = Math.Clamp(limit, 1, 100);

            var items = await _notifications
                .Find(n => n.UserId == userId)
                .SortByDescending(n => n.CreatedAt)
                .Limit(limit)
                .ToListAsync();

            return Ok(items.Select(ToResponse));
        }

        [HttpGet(NotificationRoutes.UnreadCount)]
        public async Task<IActionResult> GetUnreadCount()
        {
            var userId = GetUserId();
            if (userId == null)
                return Unauthorized("Invalid token");

            var count = await _notifications.CountDocumentsAsync(
                n => n.UserId == userId && !n.IsRead);

            return Ok(new { count });
        }

        [HttpPut(NotificationRoutes.MarkRead)]
        public async Task<IActionResult> MarkAsRead(string id)
        {
            if (!MongoIdValidator.IsValid(id))
                return BadRequest("Notification id is not valid.");

            var userId = GetUserId();
            if (userId == null)
                return Unauthorized("Invalid token");

            var result = await _notifications.UpdateOneAsync(
                n => n.Id == id && n.UserId == userId,
                Builders<Notification>.Update.Set(n => n.IsRead, true));

            if (result.MatchedCount == 0)
                return NotFound("Notification not found");

            return Ok(new { message = "Notification marked as read" });
        }

        [HttpPut(NotificationRoutes.MarkAllRead)]
        public async Task<IActionResult> MarkAllAsRead()
        {
            var userId = GetUserId();
            if (userId == null)
                return Unauthorized("Invalid token");

            await _notifications.UpdateManyAsync(
                n => n.UserId == userId && !n.IsRead,
                Builders<Notification>.Update.Set(n => n.IsRead, true));

            return Ok(new { message = "All notifications marked as read" });
        }

        private string? GetUserId() =>
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        private static object ToResponse(Notification n) => new
        {
            id = n.Id,
            type = n.Type,
            title = n.Title,
            message = n.Message,
            jobId = n.JobId,
            applicationId = n.ApplicationId,
            jobTitle = n.JobTitle,
            company = n.Company,
            status = n.Status,
            isRead = n.IsRead,
            createdAt = n.CreatedAt,
        };
    }
}
