using System.Text.RegularExpressions;

namespace job_Portal_Backend.Helpers
{
    public static class CloudinaryUrlHelper
    {
        private static readonly Regex SignedSegmentRegex = new(
            @"/s--[^/]+--/",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);
        /// <summary>
        /// Fixes Cloudinary document URLs so PDFs/DOCs open in the browser (raw delivery, not image).
        /// </summary>
        public static string NormalizeDocumentUrl(string? url)
        {
            if (string.IsNullOrWhiteSpace(url))
                return string.Empty;

            var fixedUrl = url.Trim();

            if (fixedUrl.Contains(".pdf.png", StringComparison.OrdinalIgnoreCase))
                fixedUrl = fixedUrl.Replace(".pdf.png", ".pdf", StringComparison.OrdinalIgnoreCase);
            if (fixedUrl.Contains(".pdf.jpg", StringComparison.OrdinalIgnoreCase))
                fixedUrl = fixedUrl.Replace(".pdf.jpg", ".pdf", StringComparison.OrdinalIgnoreCase);
            if (fixedUrl.Contains(".docx.png", StringComparison.OrdinalIgnoreCase))
                fixedUrl = fixedUrl.Replace(".docx.png", ".docx", StringComparison.OrdinalIgnoreCase);
            else if (
                (fixedUrl.Contains("pdf", StringComparison.OrdinalIgnoreCase)
                 || fixedUrl.Contains("/raw/", StringComparison.OrdinalIgnoreCase))
                && fixedUrl.EndsWith(".jpg", StringComparison.OrdinalIgnoreCase))
            {
                fixedUrl = fixedUrl[..^4];
            }
            else if (
                (fixedUrl.Contains("pdf", StringComparison.OrdinalIgnoreCase)
                 || fixedUrl.Contains("/raw/", StringComparison.OrdinalIgnoreCase))
                && fixedUrl.EndsWith(".png", StringComparison.OrdinalIgnoreCase)
                && !fixedUrl.EndsWith(".pdf.png", StringComparison.OrdinalIgnoreCase))
            {
                fixedUrl = fixedUrl[..^4];
            }

            return fixedUrl;
        }

        /// <summary>Remove Cloudinary signature segment so we store a stable URL in MongoDB.</summary>
        public static string CanonicalizeForStorage(string? url)
        {
            if (string.IsNullOrWhiteSpace(url))
                return string.Empty;

            var trimmed = NormalizeDocumentUrl(url.Trim());
            return SignedSegmentRegex.Replace(trimmed, "/");
        }

        /// <summary>Optimized delivery URL for job cover cards (crop, auto quality/format).</summary>
        public static string BuildCoverDeliveryUrl(string? url, int width = 960, int height = 400)
        {
            var canonical = CanonicalizeForStorage(url);
            if (string.IsNullOrWhiteSpace(canonical))
                return string.Empty;

            if (!canonical.Contains("res.cloudinary.com", StringComparison.OrdinalIgnoreCase)
                || !canonical.Contains("/image/upload/", StringComparison.OrdinalIgnoreCase))
            {
                return canonical;
            }

            const string marker = "/image/upload/";
            var markerIndex = canonical.IndexOf(marker, StringComparison.OrdinalIgnoreCase);
            var head = canonical[..(markerIndex + marker.Length)];
            var tail = canonical[(markerIndex + marker.Length)..].TrimStart('/');

            if (tail.Contains("c_fill", StringComparison.Ordinal)
                || tail.StartsWith("w_", StringComparison.Ordinal)
                || tail.Contains(",q_auto", StringComparison.Ordinal))
            {
                return canonical;
            }

            var transform = $"c_fill,w_{width},h_{height},q_auto,f_auto/";
            return head + transform + tail;
        }

        /// <summary>Force browser download for raw documents (PDF/DOCX).</summary>
        public static string WithAttachmentDelivery(string? url)
        {
            if (string.IsNullOrWhiteSpace(url))
                return string.Empty;

            var trimmed = url.Trim();
            const string marker = "/upload/";
            var markerIndex = trimmed.IndexOf(marker, StringComparison.OrdinalIgnoreCase);
            if (markerIndex < 0)
                return trimmed;

            var afterUpload = trimmed[(markerIndex + marker.Length)..];
            if (afterUpload.StartsWith("fl_attachment/", StringComparison.OrdinalIgnoreCase))
                return trimmed;

            return trimmed[..(markerIndex + marker.Length)] + "fl_attachment/" + afterUpload;
        }

        /// <summary>Candidate Cloudinary URLs to fetch a CV (raw PDF/DOCX).</summary>
        public static IReadOnlyList<string> GetCvFetchCandidates(string? url)
        {
            var results = new List<string>();
            void Add(string? candidate)
            {
                var trimmed = candidate?.Trim() ?? string.Empty;
                if (trimmed.StartsWith("http", StringComparison.OrdinalIgnoreCase) && !results.Contains(trimmed))
                    results.Add(trimmed);
            }

            var normalized = CanonicalizeForStorage(url);
            if (string.IsNullOrWhiteSpace(normalized))
                return results;

            Add(normalized);
            Add(WithAttachmentDelivery(normalized));

            if (normalized.Contains(".pdf.png", StringComparison.OrdinalIgnoreCase))
                Add(normalized.Replace(".pdf.png", ".pdf", StringComparison.OrdinalIgnoreCase));

            if (normalized.Contains("/image/upload/", StringComparison.OrdinalIgnoreCase)
                && normalized.Contains(".pdf", StringComparison.OrdinalIgnoreCase))
            {
                Add(normalized.Replace("/image/upload/", "/raw/upload/", StringComparison.OrdinalIgnoreCase));
            }

            if (normalized.Contains("/raw/upload/", StringComparison.OrdinalIgnoreCase)
                && !normalized.Contains(".pdf", StringComparison.OrdinalIgnoreCase)
                && normalized.Contains("pdf", StringComparison.OrdinalIgnoreCase))
            {
                Add(normalized + ".pdf");
            }

            foreach (var rebuilt in RebuildRawDeliveryUrls(normalized))
                Add(rebuilt);

            return results;
        }

        /// <summary>Rebuild canonical raw delivery URLs from a stored Cloudinary link.</summary>
        public static IEnumerable<string> RebuildRawDeliveryUrls(string normalizedUrl)
        {
            if (string.IsNullOrWhiteSpace(normalizedUrl)
                || !normalizedUrl.Contains("res.cloudinary.com", StringComparison.OrdinalIgnoreCase))
            {
                yield break;
            }

            if (!Uri.TryCreate(normalizedUrl, UriKind.Absolute, out var uri))
                yield break;

            var segments = uri.AbsolutePath.Trim('/').Split('/', StringSplitOptions.RemoveEmptyEntries);
            if (segments.Length < 4 || !segments[2].Equals("upload", StringComparison.OrdinalIgnoreCase))
                yield break;

            var cloud = segments[0];
            var rest = segments.Skip(3).ToList();

            while (rest.Count > 0 && rest[0].StartsWith("fl_", StringComparison.OrdinalIgnoreCase))
                rest.RemoveAt(0);

            string? version = null;
            if (rest.Count > 0 && rest[0].StartsWith('v') && rest[0].Length > 1 && rest[0][1..].All(char.IsDigit))
            {
                version = rest[0];
                rest.RemoveAt(0);
            }

            if (rest.Count == 0)
                yield break;

            var publicId = Uri.UnescapeDataString(string.Join('/', rest));
            if (publicId.EndsWith(".pdf.png", StringComparison.OrdinalIgnoreCase))
                publicId = publicId.Replace(".pdf.png", ".pdf", StringComparison.OrdinalIgnoreCase);

            var versionPart = version != null ? $"{version}/" : string.Empty;
            yield return $"https://res.cloudinary.com/{cloud}/raw/upload/{versionPart}{publicId}";
            yield return $"https://res.cloudinary.com/{cloud}/raw/upload/fl_attachment/{versionPart}{publicId}";
        }
    }
}
