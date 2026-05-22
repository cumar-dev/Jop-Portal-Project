# Push to GitHub safely

## Files that must stay private

| File | Project | What to do |
|------|---------|------------|
| `job_Portal_frontend/.env` | Frontend | Keep locally; copy from `.env.example` |
| `job_Portal_Backend/appsettings.json` | Backend | Keep locally; copy from `appsettings.example.json` |
| `job_Portal_Backend/.env` | Backend | Optional; already ignored |

These paths are listed in `.gitignore` and should **never** be committed.

## First-time setup (you)

```bash
# Frontend
copy job_Portal_frontend\.env.example job_Portal_frontend\.env

# Backend
copy job_Portal_Backend\appsettings.example.json job_Portal_Backend\appsettings.json
# Then edit appsettings.json with your real MongoDB, JWT, and Cloudinary values.
```

## If secrets were already staged

```bash
git rm --cached job_Portal_frontend/.env
git rm --cached job_Portal_Backend/appsettings.json
git add .gitignore job_Portal_frontend/.gitignore job_Portal_Backend/.gitignore
git commit -m "Stop tracking env files and appsettings secrets"
```

## Push to GitHub

1. Create a new repository on GitHub (empty, no README).
2. From the project root:

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

## If you already pushed secrets

Rotate them immediately:

- Cloudinary: new API key / secret in the dashboard  
- JWT: generate a new signing key  
- MongoDB: change password if the connection string was exposed  

Then remove the file from Git history (GitHub docs: “Removing sensitive data from a repository”) or use `git filter-repo`.
