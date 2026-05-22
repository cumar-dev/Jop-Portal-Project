# Cloudinary upload setup

Uploads go to Cloudinary folders:

| Type | Folder |
|------|--------|
| CVs (PDF/DOCX) | `job-portal/cvs` |
| Job cover images | `job-portal/jobs` |
| Company logos | `job-portal/companies` |

## Recommended: unsigned upload presets (fixes “missing permissions create”)

If your API key cannot upload (`actions=["create"]`), use **browser uploads** via unsigned presets (already wired in the frontend).

1. Open [Cloudinary Console → Upload presets](https://console.cloudinary.com/settings/upload/presets).
2. Create preset **`job_portal_images`**:
   - **Signing mode:** Unsigned
   - **Folder:** `job-portal/jobs` (optional; the app also sends `folder` per upload)
   - **Allowed formats:** jpg, png, webp (or “Images”)
3. Create preset **`job_portal_cvs`**:
   - **Signing mode:** Unsigned
   - **Resource type:** Raw
   - **Folder:** `job-portal/cvs`
   - **Allowed formats:** pdf, docx (or allow all raw)
4. In `appsettings.json` ensure:

```json
"CloudinarySettings": {
  "CloudName": "YOUR_CLOUD_NAME",
  "ImageUploadPreset": "job_portal_images",
  "RawUploadPreset": "job_portal_cvs"
}
```

5. Restart the API and refresh the frontend. Job images and CVs upload directly to Cloudinary.

## Alternative: fix server-side API key

1. [Settings → API Keys](https://console.cloudinary.com/settings/api-keys)
2. Create a **new** key with **Upload / create** permission (or use the environment **Master** key).
3. Update `CloudName`, `ApiKey`, and `ApiSecret` in `appsettings.json`.
4. Call `GET http://localhost:5046/api/upload/diagnostics` in Development — `canUpload` should be `true`.

## Verify

- `GET /api/upload/config` → `directUploadEnabled: true`
- Upload a job cover image → file appears under **Media Library → job-portal/jobs**
- Upload a CV → **job-portal/cvs** (Raw tab)
