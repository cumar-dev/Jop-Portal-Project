namespace job_Portal_Backend.Routes
{
    public static class JobRoutes
    {
        public const string Base = "api/jobs";

        // GET ALL JOBS
        public const string GetAll = "";

        // CREATE JOB
        public const string Create = "";

        // UPDATE JOB
        public const string Update = "{id}";

        // DELETE JOB
        public const string Delete = "{id}";

        // JOBS FOR LOGGED-IN EMPLOYER
        public const string Mine = "mine";
    }
}