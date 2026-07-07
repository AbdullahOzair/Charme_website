# Deployment — Cloudflare (free plan)

Architecture: **Frontend → Cloudflare Pages · Media → Cloudflare R2 · Django API → external free host.**

Cloudflare's free plan cannot run Django (Pages/Workers don't host a Python WSGI app),
so the API runs on a separate host (Render / Railway / Fly free tier) and uploaded
media lives in an R2 bucket.

---

## 1. Media bucket — Cloudflare R2

1. Cloudflare dashboard → **R2** → create a bucket, e.g. `charme-media`.
2. Enable public access: bucket → **Settings → Public access** (get the `pub-xxxx.r2.dev`
   URL, or attach a custom domain like `media.yourdomain.com`).
3. Create an **R2 API token** (Account → R2 → Manage API Tokens) → note the
   Access Key ID, Secret Access Key, and the S3 endpoint
   `https://<account_id>.r2.cloudflarestorage.com`.
4. These map to the backend env vars below (`R2_*`).

Existing local media in `backend/media/` must be re-uploaded once (via the Django
admin, or by syncing the folder to the bucket with `rclone`/`aws s3 cp`).

---

## 2. Backend API — external host (example: Render)

- **Root directory:** `backend`
- **Build command:** `pip install -r requirements.txt && python manage.py collectstatic --noinput`
- **Start command:** `gunicorn config.wsgi` (or rely on the `Procfile`)
- **Environment variables:**

  | Var | Value |
  |-----|-------|
  | `DJANGO_SETTINGS_MODULE` | `config.settings.production` |
  | `SECRET_KEY` | (a long random string) |
  | `DEBUG` | `False` |
  | `ALLOWED_HOSTS` | `charme-api.onrender.com` (your backend domain) |
  | `CORS_ALLOWED_ORIGINS` | `https://charme.pages.dev` (your Pages domain) |
  | `GEMINI_API_KEY` | (your key) |
  | `R2_ACCESS_KEY_ID` | from R2 token |
  | `R2_SECRET_ACCESS_KEY` | from R2 token |
  | `R2_BUCKET_NAME` | `charme-media` |
  | `R2_ENDPOINT_URL` | `https://<account_id>.r2.cloudflarestorage.com` |
  | `R2_PUBLIC_DOMAIN` | `pub-xxxx.r2.dev` or `media.yourdomain.com` |
  | `REDIS_URL` | optional — omit to use local-memory cache |

  `migrate` runs automatically via the `Procfile` `release` step (or run it once
  from the host shell). Static files are served by WhiteNoise.

---

## 3. Frontend — Cloudflare Pages

1. Cloudflare dashboard → **Workers & Pages → Create → Pages** → connect the repo.
2. Build settings:
   - **Root directory:** `frontend`
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
3. Environment variable:
   - `VITE_API_URL = https://charme-api.onrender.com/api/v1` (your backend URL)
4. SPA routing is handled by `frontend/public/_redirects` (`/* /index.html 200`),
   so deep links like `/wishlist` work.

---

## 4. Verify

- Open the Pages URL → products and bead images load (served from the R2 domain,
  no CORS errors in the console).
- Deep-link directly to `/wishlist` → loads (not a 404).
- Upload a new bead in the Django admin → its image appears at
  `https://<R2_PUBLIC_DOMAIN>/beads/...` and shows in the configurator.
