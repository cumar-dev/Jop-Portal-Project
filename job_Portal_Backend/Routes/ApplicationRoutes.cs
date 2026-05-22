namespace job_Portal_Backend.Routes
{
    public static class ApplicationRoutes
    {
        public const string Base = "api/applications";

        public const string Apply = "apply";

        // Applicant: jobs I applied to (newest first)
        public const string MyApplications = "my";

        // Employer: latest applications on my jobs (newest first)
        public const string RecentApplications = "recent";

        public const string GetApplicantsForJob = "job/{jobId}";

        public const string UpdateStatus = "{id}/status";
    }
}