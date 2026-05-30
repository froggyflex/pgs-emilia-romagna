# PGS Eventi Live

Workspace for `eventilive.pgsemiliaromagna.org`.

## Structure

- `frontend`: Next.js UI for Vercel, including public pages, admin pages, Google sign-in, and authenticated proxy routes.
- `backend`: Node API for Render, MongoDB Atlas persistence, comments, likes, and upload endpoints.

Atlas stores event data, comments, likes, and uploaded media files. Vercel serves the UI. Render serves the API that reads and writes Atlas.

The browser never receives the Atlas URI or the backend service token. Authenticated admin/comment writes go through Vercel API routes, then Vercel calls Render with the shared `BACKEND_SERVICE_TOKEN`. Large admin media uploads use a short-lived upload ticket, so the video goes directly from the browser to the Render backend instead of passing through Vercel.

`ADMIN_EMAILS` controls operator access. Signed-in non-admin users can comment and like media, but cannot upload media, open the admin editor, or write admin content.

## Local Setup

1. Install workspace dependencies:

```bash
npm install
```

2. Configure the local environment files:

```text
frontend/.env.local
backend/.env.local
```

The frontend needs:

```bash
AUTH_SECRET="long-random-secret"
AUTH_GOOGLE_ID="google-client-id"
AUTH_GOOGLE_SECRET="google-client-secret"
ADMIN_EMAILS="operator@example.com,andreas@example.com"
NEXT_PUBLIC_SITE_URL="http://127.0.0.1:5173"
NEXT_PUBLIC_API_URL="http://127.0.0.1:8787/api"
NEXT_PUBLIC_MAX_UPLOAD_SIZE_MB="750"
BACKEND_SERVICE_TOKEN="same-long-random-value-as-backend"
BYPASS_AUTH="true"
```

The backend needs:

```bash
MONGODB_URI="mongodb+srv://USER:PASSWORD@cluster.mongodb.net/pgs-eventi-live?retryWrites=true&w=majority"
MONGODB_DB="pgs-eventi-live"
PORT="8787"
FRONTEND_ORIGINS="http://127.0.0.1:5173,http://localhost:5173"
BACKEND_SERVICE_TOKEN="same-long-random-value-as-frontend"
MAX_UPLOAD_SIZE_MB="750"
BYPASS_AUTH="true"
```

3. Start the API:

```bash
npm run dev:backend
```

4. Start the UI in another terminal:

```bash
npm run dev --workspace frontend -- -H 127.0.0.1 -p 5173
```

5. Open:

```text
http://127.0.0.1:5173
```

## Ready For GitHub

Before pushing:

1. Confirm `.env.local` files are not staged. Only `.env.example` files should reach GitHub.
2. Push the repository root, which includes `frontend`, `backend`, `render.yaml`, and the GitHub build workflow.
3. Keep the Atlas URI only in Render environment variables and local backend environment files.

The GitHub workflow runs `npm ci` and `npm run build` for both services on every push and pull request.

## Deployment

### Vercel

Import the GitHub repository in Vercel and set the Vercel project **Root Directory** to `frontend`.

Set:

```bash
NEXT_PUBLIC_SITE_URL="https://eventilive.pgsemiliaromagna.org"
NEXT_PUBLIC_API_URL="https://YOUR-RENDER-SERVICE.onrender.com/api"
NEXT_PUBLIC_MAX_UPLOAD_SIZE_MB="750"
AUTH_SECRET="long-random-secret"
AUTH_GOOGLE_ID="google-client-id"
AUTH_GOOGLE_SECRET="google-client-secret"
ADMIN_EMAILS="operator@example.com,andreas@example.com"
BACKEND_SERVICE_TOKEN="same-long-random-value-as-render"
```

Google OAuth callback URL:

```text
https://eventilive.pgsemiliaromagna.org/api/auth/callback/google
```

### Render

The repository includes `render.yaml`. Create a Render Blueprint from the GitHub repository, or create a Node web service manually with the **Root Directory** set to `backend`.

Set:

```bash
MONGODB_URI="mongodb+srv://USER:PASSWORD@cluster.mongodb.net/pgs-eventi-live?retryWrites=true&w=majority"
MONGODB_DB="pgs-eventi-live"
FRONTEND_ORIGINS="https://eventilive.pgsemiliaromagna.org"
BACKEND_SERVICE_TOKEN="same-long-random-value-as-vercel"
MAX_UPLOAD_SIZE_MB="750"
```

Manual Render commands:

```bash
npm ci
npm start
```

Do not set `BYPASS_AUTH` on Vercel or Render.

## Atlas Setup

Run:

```bash
npm run db:setup
```

To also insert demo data:

```bash
npm run db:seed
```

The backend stores each event as a MongoDB document with nested matches, rankings, media, and feed items. Comments are separate documents indexed by event and target.

Uploaded files use MongoDB GridFS when Atlas is configured. If the backend has no MongoDB connection locally, uploads fall back to `backend/uploads` only for development.

For the first event this keeps deployment self-contained. If the media library grows heavily, move uploaded media to object storage and keep only URLs/metadata in Atlas.
