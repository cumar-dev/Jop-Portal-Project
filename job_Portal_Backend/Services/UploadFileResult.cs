namespace job_Portal_Backend.Services
{
    public sealed class UploadFileResult
    {
        public string Url { get; init; } = string.Empty;
        public string PublicId { get; init; } = string.Empty;
        public string CloudinaryFolder { get; init; } = string.Empty;
        public string ResourceType { get; init; } = string.Empty;
    }

    public sealed class StorageDiagnostics
    {
        public bool CloudinaryConfigured { get; init; }
        public bool CloudinaryReachable { get; init; }
        public bool CanUpload { get; init; }
        public bool DirectUploadEnabled { get; init; }
        public string CloudName { get; init; } = string.Empty;
        public string UploadPreset { get; init; } = string.Empty;
        public string ImageUploadPreset { get; init; } = string.Empty;
        public string RawUploadPreset { get; init; } = string.Empty;
        public IReadOnlyList<string> Folders { get; init; } = Array.Empty<string>();
        public string? Message { get; init; }
        public string? UploadError { get; init; }
    }
}
