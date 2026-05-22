# Job Portal Frontend

React + Vite + TypeScript UI for the Job Portal API.

## Run locally

1. Start the backend (`http://localhost:5046`).
2. In this folder:

```bash
npm install
npm run dev
```

3. Open [http://localhost:5173](http://localhost:5173)

## Auth pages

| Route       | Page    |
|------------|---------|
| `/sign-up` | Register (Applicant or Employer) |
| `/sign-in` | Login (stores JWT in localStorage) |
| `/`        | Home (shows user when signed in)   |

API base URL: set `VITE_API_URL` in `.env` (default `http://localhost:5046`).
