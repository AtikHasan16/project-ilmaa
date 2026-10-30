# Imlaa Platform Deployment & Operations Runbook

> Operational manual for deploying, monitoring, promoting environments, and managing infrastructure for the Imlaa Linguistic Mastery Platform.

---

## 1. Hosting Architecture & Service Providers

| Subproject | Runtime | Host Provider | Port / Protocol | Health Endpoint |
|---|---|---|---|---|
| **Frontend** (`project-ilmaa`) | Vite + React 19 SPA | **Vercel** (Global Edge CDN) | HTTPS / 443 | `GET /` |
| **TTS Service** (`server`) | Node.js Express 4 | **Render** (Web Service) | HTTPS / 443 (Internal 5000) | `GET /health`, `GET /ready` |
| **Database & Auth** | PostgreSQL 15 + GoTrue | **Supabase Cloud** | HTTPS / 443 (REST/Auth), Pooler 6543 | Cloud Dashboard |

---

## 2. Vercel Deployment Guide (Frontend Client)

### 2.1 Build Configuration
- **Framework Preset**: Vite
- **Root Directory**: `project-ilmaa`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm ci`
- **Node.js Version**: `22.x` (configured via `.nvmrc`)

### 2.2 Environment Variables (Vercel Project Settings)
```ini
VITE_SUPABASE_URL="https://[YOUR_PROJECT].supabase.co"
VITE_SUPABASE_ANON_KEY="[YOUR_ANON_KEY]"
VITE_BACKEND_URL="https://ilmaa-server.onrender.com"
VITE_FRONTEND_URL="https://imlaa.vercel.app"
VITE_EMAILJS_SERVICE_ID="service_ilmaa"
VITE_EMAILJS_TEMPLATE_ID="template_ilmaa"
VITE_EMAILJS_PUBLIC_KEY="[YOUR_PUBLIC_KEY]"
VITE_IMAGEBB_KEY="[YOUR_IMGBB_KEY]"
```
> [!IMPORTANT]
> Never set `SUPABASE_SERVICE_ROLE_KEY` in Vercel environment variables! The client bundle is public and strictly requires only the anonymous key.

---

## 3. Render Deployment Guide (TTS Microservice)

### 3.1 Web Service Configuration
- **Root Directory**: `server`
- **Environment**: Node
- **Build Command**: `npm ci`
- **Start Command**: `node index.js`
- **Health Check Path**: `/health`
- **Auto-Deploy**: Enabled on branch `main`

### 3.2 Environment Variables (Render Dashboard)
```ini
PORT=5000
NODE_ENV=production
SUPABASE_URL="https://[YOUR_PROJECT].supabase.co"
SUPABASE_ANON_KEY="[YOUR_ANON_KEY]"
CORS_ORIGINS="https://imlaa.vercel.app,http://localhost:5173"
```

### 3.3 Cold Start & Fallback Behavior
- Render free tier instances enter sleep after 15 minutes of inactivity.
- First-request cold starts may take $1.5\text{s}$ to $3.0\text{s}$.
- The client-side audio dispatch utility (`speechTts.js`) executes an `AbortController` timeout at $2.8\text{s}$. If Render does not respond within this window, the client immediately falls back to high-quality native browser `window.speechSynthesis` so candidate dictation drills are never interrupted.

---

## 4. Architectural Decision: Ephemeral `os.tmpdir()` vs Object Storage for TTS

### Decision: Ephemeral `os.tmpdir()` with Browser Client Cache
After analyzing usage patterns, EdgeTTS response characteristics, and infrastructure cost, **ephemeral disk caching (`os.tmpdir()`)** is confirmed as the authoritative design:
1. **Zero Cloud Cost**: No AWS S3, Cloudflare R2, or Supabase Storage bucket billing or bandwidth egress charges.
2. **Instant Microsecond Disk Reads**: Repeated lookups of core academic words (AWL Sublist A) on the same container read directly from local SSD temp cache.
3. **Browser Layer Shield**: The frontend v2 Service Worker caches up to 150 synthesized MP3 blobs directly in candidate browser cache, preventing 95% of candidate replay requests from ever reaching the server.
4. **Privacy-Preserving**: Temporary audio files are discarded whenever the Render instance recycles.

*Threshold for re-evaluating*: If unique daily synthesis volume exceeds 50,000 distinct words, migrate to Cloudflare R2 with a custom CDN domain.

---

## 5. Supabase Connection & Egress Budgets

To ensure stable database operation across high concurrency:

| Metric | Budget / Limit | Recommended Alert Threshold | Mitigation Action |
|---|---|---|---|
| **Connection Pooling** | Supavisor Pooler (Port 6543) | $\ge 75\%$ pool utilization | Use Transaction Mode pooling; ensure client queries close promptly |
| **Monthly Egress** | 2 GB (Free) / 250 GB (Pro) | $\ge 80\%$ monthly quota | In-memory `queryCache.js` shields database; SW blocks static asset egress |
| **Daily Upload Quota** | 200 words / candidate / day | Automated rejection in RPC | Quota guard enforces limit atomically in `submit_vocabulary_items` |
| **TTS Synthesis Limit** | 120 req/min (IP), 30 req/min (User) | Automated 429 response | Throttled gracefully with rate-limiting response |

---

## 6. Staging-to-Production Environment Promotion

1. **Feature Development**:
   - Work in isolated branch / worktree (`feature/<task-name>`).
   - Run verification locally: `npm run lint`, `npm test`, `npm run security:scan`, `npm run build`.
2. **Staging Validation**:
   - Push to staging environment.
   - Run automated load-testing suite: `node scripts/load-test.mjs --target=staging`.
   - Apply candidate SQL migrations to staging database.
3. **Production Deployment**:
   - Take on-demand Supabase backup snapshot (**Database -> Backups -> Backup Now**).
   - Apply versioned migration from `database/migrations/`.
   - Merge PR to `main` with required CI checks passing.
   - Verify health probes: `GET https://ilmaa-server.onrender.com/ready` returns `status: "ready", database: "connected"`.
