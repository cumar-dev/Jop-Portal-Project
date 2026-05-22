using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;

namespace job_Portal_Backend.Services
{
    /// <summary>Cloudinary-only file storage with production folder layout.</summary>
    public class CloudinaryStorageService
    {
        public const string CvsFolder = "job-portal/cvs";
        public const string JobsFolder = "job-portal/jobs";
        public const string CompaniesFolder = "job-portal/companies";
        public const string ProfilesFolder = "job-portal/profiles";

        private static readonly byte[] TinyPngBytes = Convert.FromBase64String(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==");

        private static readonly JsonSerializerOptions JsonOptions = new()
        {
            PropertyNameCaseInsensitive = true,
        };

        private readonly Cloudinary _cloudinary;
        private readonly string _cloudName;
        private readonly string _apiKey;
        private readonly string? _uploadPreset;
        private readonly string? _imageUploadPreset;
        private readonly string? _rawUploadPreset;
        private readonly ILogger<CloudinaryStorageService> _logger;

        public bool DirectUploadEnabled =>
            !string.IsNullOrWhiteSpace(_imageUploadPreset)
            || !string.IsNullOrWhiteSpace(_rawUploadPreset);

        public CloudinaryStorageService(IConfiguration config, ILogger<CloudinaryStorageService> logger)
        {
            _logger = logger;

            var cloudinaryUrl =
                config["CloudinarySettings:CloudinaryUrl"]?.Trim()
                ?? Environment.GetEnvironmentVariable("CLOUDINARY_URL")?.Trim();

            if (!string.IsNullOrWhiteSpace(cloudinaryUrl))
            {
                _cloudinary = new Cloudinary(cloudinaryUrl);
                _cloudName = _cloudinary.Api.Account.Cloud ?? string.Empty;
                _apiKey = _cloudinary.Api.Account.ApiKey ?? string.Empty;
                if (string.IsNullOrWhiteSpace(_cloudName))
                {
                    throw new InvalidOperationException(
                        "CloudinaryUrl is invalid. Copy the full CLOUDINARY_URL from Cloudinary Console → Dashboard.");
                }
            }
            else
            {
                _cloudName = config["CloudinarySettings:CloudName"]?.Trim()
                    ?? throw new InvalidOperationException(
                        "Set CloudinarySettings:CloudName or CloudinarySettings:CloudinaryUrl in appsettings.json.");

                var apiKey = config["CloudinarySettings:ApiKey"]?.Trim()
                    ?? throw new InvalidOperationException("CloudinarySettings:ApiKey is required.");

                var apiSecret = config["CloudinarySettings:ApiSecret"]?.Trim()
                    ?? throw new InvalidOperationException("CloudinarySettings:ApiSecret is required.");

                _apiKey = apiKey;
                _cloudinary = new Cloudinary(new Account(_cloudName, apiKey, apiSecret));
            }

            _uploadPreset = config["CloudinarySettings:UploadPreset"]?.Trim();
            _imageUploadPreset = config["CloudinarySettings:ImageUploadPreset"]?.Trim();
            _rawUploadPreset = config["CloudinarySettings:RawUploadPreset"]?.Trim();

            if (string.IsNullOrWhiteSpace(_imageUploadPreset) && !string.IsNullOrWhiteSpace(_uploadPreset))
                _imageUploadPreset = _uploadPreset;

            var presetMode = DirectUploadEnabled
                ? $"unsigned (images={_imageUploadPreset}, raw={_rawUploadPreset})"
                : string.IsNullOrWhiteSpace(_uploadPreset) ? "signed API" : _uploadPreset;

            _logger.LogInformation(
                "Cloudinary ready. Cloud={Cloud}, Mode={Mode}, Folders: {Cvs}, {Jobs}, {Companies}",
                _cloudName,
                presetMode,
                CvsFolder,
                JobsFolder,
                CompaniesFolder,
                ProfilesFolder);
        }

        public bool IsOurCloudinaryUrl(string? url) =>
            !string.IsNullOrWhiteSpace(url)
            && url.Contains($"res.cloudinary.com/{_cloudName}/", StringComparison.OrdinalIgnoreCase);

        public bool IsManagedFileUrl(string? url) => IsOurCloudinaryUrl(url);

        public string GetSignedDeliveryUrl(string? storedUrl, bool forceDownload = false)
        {
            if (string.IsNullOrWhiteSpace(storedUrl))
                return string.Empty;

            var normalized = Helpers.CloudinaryUrlHelper.CanonicalizeForStorage(
                Helpers.CloudinaryUrlHelper.NormalizeDocumentUrl(storedUrl));

            if (!IsOurCloudinaryUrl(normalized))
                return normalized;

            if (!Helpers.CloudinaryDeliveryParser.TryParse(
                    normalized,
                    _cloudName,
                    out var resourceType,
                    out var version,
                    out var publicId))
            {
                return normalized;
            }

            var builder = _cloudinary
                .Api
                .Url
                .ResourceType(resourceType)
                .Secure(true)
                .Signed(true);

            if (!string.IsNullOrEmpty(version))
                builder = builder.Version(version);

            if (forceDownload)
                builder = builder.Transform(new Transformation().Flags("attachment"));

            return builder.BuildUrl(publicId);
        }

        /// <summary>Browser-safe view URL for CVs (unsigned Cloudinary delivery).</summary>
        public string GetCvViewUrl(string? storedUrl)
        {
            var normalized = Helpers.CloudinaryUrlHelper.CanonicalizeForStorage(
                Helpers.CloudinaryUrlHelper.NormalizeDocumentUrl(storedUrl));
            if (string.IsNullOrWhiteSpace(normalized))
                return string.Empty;

            if (!IsOurCloudinaryUrl(normalized))
                return normalized;

            return normalized;
        }

        /// <summary>Download URL for CVs with attachment flag when possible.</summary>
        public string GetCvDownloadUrl(string? storedUrl)
        {
            var view = GetCvViewUrl(storedUrl);
            if (string.IsNullOrWhiteSpace(view))
                return string.Empty;

            return Helpers.CloudinaryUrlHelper.WithAttachmentDelivery(view);
        }

        public async Task<(byte[] Data, string ContentType)?> TryDownloadAsync(string? storedUrl)
        {
            if (string.IsNullOrWhiteSpace(storedUrl) || !IsOurCloudinaryUrl(storedUrl))
                return null;

            var normalized = Helpers.CloudinaryUrlHelper.CanonicalizeForStorage(
                Helpers.CloudinaryUrlHelper.NormalizeDocumentUrl(storedUrl));

            var candidates = Helpers.CloudinaryUrlHelper.GetCvFetchCandidates(normalized).ToList();
            var signed = GetSignedDeliveryUrl(normalized);
            if (!string.IsNullOrWhiteSpace(signed) && !candidates.Contains(signed))
                candidates.Add(signed);

            using var client = new HttpClient();
            foreach (var url in candidates)
            {
                try
                {
                    var response = await client.GetAsync(url);
                    if (!response.IsSuccessStatusCode)
                        continue;

                    var data = await response.Content.ReadAsByteArrayAsync();
                    if (data.Length == 0)
                        continue;

                    var contentType = response.Content.Headers.ContentType?.MediaType
                        ?? GuessContentTypeFromUrl(url);

                    if (data.Length >= 4 && data[0] == 0x25 && data[1] == 0x50 && data[2] == 0x44 && data[3] == 0x46)
                        contentType = "application/pdf";

                    return (data, contentType);
                }
                catch
                {
                    // try next
                }
            }

            return null;
        }

        public async Task<StorageDiagnostics> GetDiagnosticsAsync()
        {
            string? message = null;
            var reachable = false;
            var canUpload = false;
            string? uploadError = null;

            try
            {
                var ping = _cloudinary.Ping();
                reachable = ping.Error == null;
                message = reachable
                    ? "Cloudinary API is reachable."
                    : MapCloudinaryError(ping.Error?.Message ?? "Ping failed.");
            }
            catch (Exception ex)
            {
                message = $"Cloudinary ping failed: {ex.Message}";
            }

            if (reachable)
            {
                try
                {
                    if (DirectUploadEnabled)
                    {
                        var testId = $"diag-{Guid.NewGuid():N}";
                        string? testedPreset = null;

                        if (!string.IsNullOrWhiteSpace(_imageUploadPreset))
                        {
                            testedPreset = _imageUploadPreset;
                            await UploadUnsignedAsync(
                                TinyPngBytes,
                                "diagnostics.png",
                                JobsFolder,
                                _imageUploadPreset,
                                "image",
                                testId);
                        }
                        else if (!string.IsNullOrWhiteSpace(_rawUploadPreset))
                        {
                            testedPreset = _rawUploadPreset;
                            await UploadUnsignedAsync(
                                TinyPngBytes,
                                "diagnostics.png",
                                CvsFolder,
                                _rawUploadPreset,
                                "raw",
                                testId);
                        }

                        canUpload = true;
                        message = $"Cloudinary uploads OK via unsigned preset \"{testedPreset}\".";
                    }
                    else
                    {
                        await using var stream = new MemoryStream(TinyPngBytes);
                        var testParams = new ImageUploadParams
                        {
                            File = new FileDescription("diagnostics.png", stream),
                            Folder = JobsFolder,
                            PublicId = $"diag-{Guid.NewGuid():N}",
                            Overwrite = true,
                            UseFilename = false,
                            UniqueFilename = false,
                        };

                        var test = await _cloudinary.UploadAsync(testParams);
                        canUpload = test.Error == null;
                        if (test.Error != null)
                        {
                            uploadError = MapCloudinaryError(test.Error.Message);
                            message = uploadError;
                        }
                        else
                        {
                            message = "Cloudinary is configured and signed uploads are permitted.";
                        }
                    }
                }
                catch (Exception ex)
                {
                    uploadError = MapCloudinaryError(ex.Message);
                    message = uploadError;
                }
            }

            return new StorageDiagnostics
            {
                CloudinaryConfigured = true,
                CloudinaryReachable = reachable,
                CanUpload = canUpload,
                DirectUploadEnabled = DirectUploadEnabled,
                CloudName = _cloudName,
                UploadPreset = _uploadPreset ?? string.Empty,
                ImageUploadPreset = _imageUploadPreset ?? string.Empty,
                RawUploadPreset = _rawUploadPreset ?? string.Empty,
                Folders = new[] { CvsFolder, JobsFolder, CompaniesFolder },
                Message = message,
                UploadError = uploadError,
            };
        }

        public StorageDiagnostics GetDiagnostics() =>
            GetDiagnosticsAsync().GetAwaiter().GetResult();

        public async Task<UploadFileResult> UploadAsync(IFormFile file, UploadCategory category)
        {
            if (file == null || file.Length == 0)
                throw new InvalidOperationException("No file uploaded.");

            if (file.Length > 10 * 1024 * 1024)
                throw new InvalidOperationException("File must be 10 MB or smaller.");

            return category switch
            {
                UploadCategory.Cv => await UploadCvAsync(file),
                UploadCategory.JobImage => await UploadImageAsync(file, JobsFolder, "Job image"),
                UploadCategory.CompanyLogo => await UploadImageAsync(file, CompaniesFolder, "Company logo"),
                UploadCategory.ProfileImage => await UploadImageAsync(file, ProfilesFolder, "Profile photo"),
                _ => throw new InvalidOperationException("Unknown upload category."),
            };
        }

        private async Task<UploadFileResult> UploadCvAsync(IFormFile file)
        {
            if (!IsCvFile(file))
            {
                throw new InvalidOperationException(
                    "Invalid CV file type. Upload a PDF or DOCX document only.");
            }

            var publicId = BuildRawPublicId(file);
            await using var stream = file.OpenReadStream();
            using var buffer = new MemoryStream();
            await stream.CopyToAsync(buffer);
            var fileBytes = buffer.ToArray();

            string url;
            string resultPublicId;

            if (!string.IsNullOrWhiteSpace(_rawUploadPreset))
            {
                var unsigned = await UploadUnsignedAsync(
                    fileBytes,
                    file.FileName,
                    CvsFolder,
                    _rawUploadPreset,
                    "raw",
                    publicId);
                url = unsigned.SecureUrl;
                resultPublicId = unsigned.PublicId;
            }
            else
            {
                await using var rawStream = new MemoryStream(fileBytes);
                var uploadParams = new RawUploadParams
                {
                    File = new FileDescription(file.FileName, rawStream),
                    Folder = CvsFolder,
                    PublicId = publicId,
                    Overwrite = false,
                    UseFilename = false,
                    UniqueFilename = false,
                };
                var result = await _cloudinary.UploadAsync(uploadParams);

                if (result.Error != null)
                    throw new InvalidOperationException(MapCloudinaryError($"CV upload failed: {result.Error.Message}"));

                url = result.SecureUrl?.ToString()
                    ?? throw new InvalidOperationException("Cloudinary did not return a secure URL.");
                resultPublicId = result.PublicId ?? publicId;
            }

            _logger.LogInformation("CV uploaded to {Folder}/{PublicId}", CvsFolder, resultPublicId);

            return new UploadFileResult
            {
                Url = url,
                PublicId = resultPublicId,
                CloudinaryFolder = CvsFolder,
                ResourceType = "raw",
            };
        }

        private async Task<UploadFileResult> UploadImageAsync(
            IFormFile file,
            string folder,
            string label)
        {
            if (!IsImageFile(file))
            {
                throw new InvalidOperationException(
                    $"{label} must be JPG, PNG, or WebP.");
            }

            var publicId = BuildImagePublicId();
            await using var stream = file.OpenReadStream();
            using var buffer = new MemoryStream();
            await stream.CopyToAsync(buffer);
            var fileBytes = buffer.ToArray();

            string url;
            string resultPublicId;
            var preset = _imageUploadPreset ?? _uploadPreset;

            if (!string.IsNullOrWhiteSpace(preset))
            {
                var unsigned = await UploadUnsignedAsync(
                    fileBytes,
                    file.FileName,
                    folder,
                    preset,
                    "image",
                    publicId);
                url = unsigned.SecureUrl;
                resultPublicId = unsigned.PublicId;
            }
            else
            {
                await using var imageStream = new MemoryStream(fileBytes);
                var uploadParams = new ImageUploadParams
                {
                    File = new FileDescription(file.FileName, imageStream),
                    Folder = folder,
                    PublicId = publicId,
                    Overwrite = false,
                    UseFilename = false,
                    UniqueFilename = false,
                };
                var result = await _cloudinary.UploadAsync(uploadParams);

                if (result.Error != null)
                    throw new InvalidOperationException(MapCloudinaryError($"{label} upload failed: {result.Error.Message}"));

                url = result.SecureUrl?.ToString()
                    ?? throw new InvalidOperationException("Cloudinary did not return a secure URL.");
                resultPublicId = result.PublicId ?? publicId;
            }

            _logger.LogInformation("Image uploaded to {Folder}/{PublicId}", folder, resultPublicId);

            return new UploadFileResult
            {
                Url = url,
                PublicId = resultPublicId,
                CloudinaryFolder = folder,
                ResourceType = "image",
            };
        }

        private async Task<(string SecureUrl, string PublicId)> UploadUnsignedAsync(
            byte[] fileBytes,
            string fileName,
            string folder,
            string uploadPreset,
            string resourceType,
            string publicId)
        {
            uploadPreset = uploadPreset.Trim();
            if (string.IsNullOrWhiteSpace(uploadPreset))
            {
                throw new InvalidOperationException(
                    "CloudinarySettings:ImageUploadPreset or RawUploadPreset is missing in appsettings.json.");
            }

            if (fileBytes.Length == 0)
                throw new InvalidOperationException("Cannot upload an empty file to Cloudinary.");

            var safeFileName = string.IsNullOrWhiteSpace(fileName) ? "upload" : fileName;

            if (resourceType == "image")
            {
                try
                {
                    return await UploadUnsignedViaSdkAsync(
                        fileBytes,
                        safeFileName,
                        folder,
                        uploadPreset,
                        publicId);
                }
                catch (Exception ex)
                {
                    _logger.LogDebug(ex, "SDK unsigned image upload failed, trying HTTP multipart.");
                }
            }

            return await UploadUnsignedViaHttpAsync(
                fileBytes,
                safeFileName,
                folder,
                uploadPreset,
                resourceType,
                publicId);
        }

        private async Task<(string SecureUrl, string PublicId)> UploadUnsignedViaSdkAsync(
            byte[] fileBytes,
            string fileName,
            string folder,
            string uploadPreset,
            string publicId)
        {
            await using var stream = new MemoryStream(fileBytes);
            var uploadParams = new ImageUploadParams
            {
                File = new FileDescription(fileName, stream),
                UploadPreset = uploadPreset,
                Unsigned = true,
                Folder = folder,
                PublicId = publicId,
            };

            var result = await _cloudinary.UploadAsync(uploadParams);
            if (result.Error != null)
                throw new InvalidOperationException(MapCloudinaryError(result.Error.Message));

            var secureUrl = result.SecureUrl?.ToString()?.Trim();
            if (string.IsNullOrWhiteSpace(secureUrl))
                throw new InvalidOperationException("Cloudinary did not return a secure URL.");

            return (secureUrl, result.PublicId?.Trim() ?? publicId);
        }

        private async Task<(string SecureUrl, string PublicId)> UploadUnsignedViaHttpAsync(
            byte[] fileBytes,
            string fileName,
            string folder,
            string uploadPreset,
            string resourceType,
            string publicId)
        {
            var mime = resourceType == "raw" ? "application/octet-stream" : "image/png";
            var (bodyStream, boundary) = BuildUnsignedMultipartBody(
                fileBytes,
                fileName,
                mime,
                uploadPreset,
                folder,
                publicId,
                _apiKey);

            using var client = new HttpClient();
            await using (bodyStream)
            {
                using var content = new StreamContent(bodyStream);
                content.Headers.ContentType = MediaTypeHeaderValue.Parse(
                    $"multipart/form-data; boundary={boundary}");

                var endpoint = $"https://api.cloudinary.com/v1_1/{_cloudName}/{resourceType}/upload";
                var response = await client.PostAsync(endpoint, content);
                var responseBody = await response.Content.ReadAsStringAsync();

                var parsed = JsonSerializer.Deserialize<CloudinaryHttpUploadResponse>(responseBody, JsonOptions);
                var errorMessage = parsed?.Error?.Message;
                if (!response.IsSuccessStatusCode || !string.IsNullOrWhiteSpace(errorMessage))
                {
                    throw new InvalidOperationException(MapCloudinaryError(errorMessage ?? responseBody));
                }

                var secureUrl = parsed?.SecureUrl?.Trim();
                if (string.IsNullOrWhiteSpace(secureUrl))
                    throw new InvalidOperationException("Cloudinary did not return a secure URL.");

                return (secureUrl, parsed?.PublicId?.Trim() ?? publicId);
            }

        }

        private static (MemoryStream Body, string Boundary) BuildUnsignedMultipartBody(
            byte[] fileBytes,
            string fileName,
            string mimeType,
            string uploadPreset,
            string folder,
            string publicId,
            string apiKey)
        {
            var boundary = "----CloudinaryBoundary" + Guid.NewGuid().ToString("N");
            var body = new MemoryStream();

            void WriteField(string name, string value)
            {
                var header = $"--{boundary}\r\nContent-Disposition: form-data; name=\"{name}\"\r\n\r\n{value}\r\n";
                var headerBytes = Encoding.UTF8.GetBytes(header);
                body.Write(headerBytes, 0, headerBytes.Length);
            }

            WriteField("upload_preset", uploadPreset);
            if (!string.IsNullOrWhiteSpace(apiKey))
                WriteField("api_key", apiKey);
            WriteField("folder", folder);
            WriteField("public_id", publicId);

            var fileHeader =
                $"--{boundary}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"{fileName}\"\r\nContent-Type: {mimeType}\r\n\r\n";
            var fileHeaderBytes = Encoding.UTF8.GetBytes(fileHeader);
            body.Write(fileHeaderBytes, 0, fileHeaderBytes.Length);
            body.Write(fileBytes, 0, fileBytes.Length);

            var footer = Encoding.UTF8.GetBytes($"\r\n--{boundary}--\r\n");
            body.Write(footer, 0, footer.Length);
            body.Position = 0;

            return (body, boundary);
        }

        private sealed class CloudinaryHttpUploadResponse
        {
            [JsonPropertyName("secure_url")]
            public string? SecureUrl { get; set; }

            [JsonPropertyName("public_id")]
            public string? PublicId { get; set; }

            [JsonPropertyName("error")]
            public CloudinaryHttpError? Error { get; set; }
        }

        private sealed class CloudinaryHttpError
        {
            [JsonPropertyName("message")]
            public string? Message { get; set; }
        }

        private static string BuildImagePublicId() => Guid.NewGuid().ToString("N");

        private static string BuildRawPublicId(IFormFile file)
        {
            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            var id = Guid.NewGuid().ToString("N");
            return string.IsNullOrEmpty(ext) ? id : $"{id}{ext}";
        }

        private static bool IsCvFile(IFormFile file)
        {
            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            var contentType = file.ContentType?.ToLowerInvariant() ?? string.Empty;

            if (ext is ".pdf" or ".docx")
                return true;

            return contentType is "application/pdf"
                or "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        }

        private static bool IsImageFile(IFormFile file)
        {
            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            var contentType = file.ContentType?.ToLowerInvariant() ?? string.Empty;

            if (ext is ".jpg" or ".jpeg" or ".png" or ".webp")
                return true;

            return contentType is "image/jpeg" or "image/png" or "image/webp";
        }

        private static string GuessContentTypeFromUrl(string url)
        {
            var path = url.Split('?')[0].ToLowerInvariant();
            if (path.EndsWith(".pdf")) return "application/pdf";
            if (path.EndsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            if (path.EndsWith(".png")) return "image/png";
            if (path.EndsWith(".webp")) return "image/webp";
            if (path.EndsWith(".jpg") || path.EndsWith(".jpeg")) return "image/jpeg";
            return "application/octet-stream";
        }

        /// <summary>Turn Cloudinary API errors into actionable setup instructions.</summary>
        public static string MapCloudinaryError(string message)
        {
            if (string.IsNullOrWhiteSpace(message))
                return "Cloudinary upload failed.";

            if (message.Contains("Upload preset must be specified", StringComparison.OrdinalIgnoreCase)
                || message.Contains("ImageUploadPreset or RawUploadPreset is missing", StringComparison.OrdinalIgnoreCase))
            {
                return
                    "Cloudinary unsigned upload failed: upload_preset was not accepted. " +
                    "In appsettings.json set ImageUploadPreset=job_portal_images and RawUploadPreset=job_portal_cvs, " +
                    "and create matching UNSIGNED presets in Cloudinary Console → Settings → Upload.";
            }

            if (message.Contains("Upload preset not found", StringComparison.OrdinalIgnoreCase)
                || message.Contains("Invalid upload preset", StringComparison.OrdinalIgnoreCase))
            {
                return
                    "Cloudinary upload preset not found. In Cloudinary Console → Settings → Upload, " +
                    "create UNSIGNED presets named \"job_portal_images\" (images) and \"job_portal_cvs\" (raw/PDF), " +
                    "then restart the backend.";
            }

            if (message.Contains("missing permissions", StringComparison.OrdinalIgnoreCase)
                || message.Contains("actions=[\"create\"]", StringComparison.OrdinalIgnoreCase))
            {
                return
                    "Cloudinary API key cannot upload via signed API (missing create permission). " +
                    "Create unsigned presets \"job_portal_images\" and \"job_portal_cvs\" in Cloudinary Console → Settings → Upload, " +
                    "or use an API key with Upload permission in appsettings.json.";
            }

            if (message.Contains("Invalid API key", StringComparison.OrdinalIgnoreCase)
                || message.Contains("Invalid Signature", StringComparison.OrdinalIgnoreCase))
            {
                return
                    "Cloudinary API key or secret is incorrect. Copy fresh credentials from " +
                    "Cloudinary Console → Dashboard for the same product environment as your cloud name.";
            }

            return message;
        }
    }
}
