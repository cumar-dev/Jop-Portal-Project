namespace job_Portal_Backend.Routes
{
    public static class NotificationRoutes
    {
        public const string Base = "api/notifications";

        public const string UnreadCount = "unread-count";

        public const string MarkAllRead = "read-all";

        public const string MarkRead = "{id}/read";
    }
}
