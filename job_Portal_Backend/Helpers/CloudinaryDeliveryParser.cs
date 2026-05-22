namespace job_Portal_Backend.Helpers
{
    /// <summary>Parse Cloudinary delivery URLs into resource type, version, and public id.</summary>
    public static class CloudinaryDeliveryParser
    {
        public static bool TryParse(
            string url,
            string expectedCloudName,
            out string resourceType,
            out string? version,
            out string publicId)
        {
            resourceType = string.Empty;
            version = null;
            publicId = string.Empty;

            if (!Uri.TryCreate(url, UriKind.Absolute, out var uri))
                return false;

            var segments = uri.AbsolutePath.Trim('/').Split('/', StringSplitOptions.RemoveEmptyEntries);
            if (segments.Length < 4)
                return false;

            if (!segments[0].Equals(expectedCloudName, StringComparison.OrdinalIgnoreCase))
                return false;

            resourceType = segments[1].ToLowerInvariant();
            if (resourceType is not ("image" or "raw" or "video"))
                return false;

            if (!segments[2].Equals("upload", StringComparison.OrdinalIgnoreCase))
                return false;

            var rest = segments.Skip(3).ToList();

            while (rest.Count > 0 && IsTransformationSegment(rest[0]))
                rest.RemoveAt(0);

            if (rest.Count > 0 && TryParseVersionSegment(rest[0], out var versionNumber))
            {
                version = versionNumber;
                rest.RemoveAt(0);
            }

            if (rest.Count == 0)
                return false;

            publicId = Uri.UnescapeDataString(string.Join('/', rest));
            return !string.IsNullOrWhiteSpace(publicId);
        }

        private static bool IsTransformationSegment(string segment)
        {
            if (TryParseVersionSegment(segment, out _))
                return false;

            if (segment.Equals("fl_attachment", StringComparison.OrdinalIgnoreCase))
                return true;

            return segment.Contains('_', StringComparison.Ordinal)
                   || segment.Contains(',', StringComparison.Ordinal);
        }

        private static bool TryParseVersionSegment(string segment, out string version)
        {
            version = string.Empty;
            if (segment.Length < 2 || !segment.StartsWith('v'))
                return false;

            var digits = segment[1..];
            if (digits.Length == 0 || !digits.All(char.IsDigit))
                return false;

            version = digits;
            return true;
        }
    }
}
