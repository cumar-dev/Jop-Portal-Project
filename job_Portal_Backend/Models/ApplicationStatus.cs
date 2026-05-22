namespace job_Portal_Backend.Models
{
    public static class ApplicationStatus
    {
        public const string Pending = "Pending";
        public const string Reviewed = "Reviewed";
        public const string Accepted = "Accepted";
        public const string Rejected = "Rejected";

        public static readonly string[] All = { Pending, Reviewed, Accepted, Rejected };

        public static bool IsValid(string? value) =>
            !string.IsNullOrWhiteSpace(value) &&
            All.Contains(value, StringComparer.OrdinalIgnoreCase);

        public static string Normalize(string? value) =>
            IsValid(value) ? All.First(s => s.Equals(value, StringComparison.OrdinalIgnoreCase)) : Pending;
    }
}
