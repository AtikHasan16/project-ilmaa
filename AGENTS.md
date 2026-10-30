# Agent Instructions & Development Governance (AGENTS.md)

This document establishes the mandatory governance model, security rules, environment setup, and verification checklists for all automated agents and human contributors working on Imlaa.

---

## 1. Project Map & Architecture

Imlaa operates under a single authoritative data pipeline:
$$\text{Browser (React 19)} \longrightarrow \text{Supabase PostgREST + RPC (anon key + RLS)}$$
$$\text{Browser (React 19)} \longrightarrow \text{Dedicated Express TTS (\texttt{POST /api/tts} + Supabase JWT)}$$

- `src/App.jsx`: Lazy-loaded routes, Suspense fallbacks, and Route Error Boundaries.
- `src/auth/`: Focused authentication hooks (`useSession`, `useSignIn`, `useOtp`, `usePasswordReset`).
- `src/context/`: Auth context composition and public `useAuth()` interface.
- `src/features/admin/`: Admin user directory, audit log table, user inspector, and role change dialog.
- `src/services/`: Decoupled domain services (`vocabularyService.js`, `progressService.js`, `adminService.js`, `auditService.js`, `grammarService.js`, `studySessionService.js`, `queryCache.js`, `telemetryService.js`).
- `src/services/apiClient.js`: Backward-compatibility facade delegating to domain services.
- `src/utils/cryptoRandom.js`: Web Crypto API based `secureShuffle` and `secureRandomUUID`.
- `database/`: Canonical schema, RLS policies, migrations, rollback scripts, and backup/restore SOP.
- `../server/`: Dedicated Express text-to-speech service (`POST /api/tts`, `GET /health`, `GET /ready`).

---

## 2. Mandatory Commands

### Frontend (`project-ilmaa/`)
```bash
npm ci                  # Clean dependency installation
npm run dev             # Launch local development server (http://localhost:5173)
npm run lint            # ESLint static analysis (must exit 0)
npm test                # Automated unit test suite (node --test)
npm run security:scan   # Secret scanner (must find 0 credentials)
npm run loadtest        # Automated load-testing suite (500 users, burst, TTS, quota)
npm run precommit       # Complete pre-commit verification pipeline
npm run build           # Vite production build (must compile without warnings)
```

### Backend (`server/`)
```bash
npm ci                  # Clean dependency installation
npm run dev             # Launch development server (http://localhost:5000)
npm run check           # Node syntax and module resolution check
npm test                # Server test suite (node --test)
npm run security:scan   # Secret scanner (must find 0 credentials)
```

---

## 3. Strict Prohibitions (Forbidden Paths & Actions)

- **NEVER** inspect, read, copy, or print values from `.env` or `.env.*` files.
- **NEVER** place a Supabase `service_role` key, database connection password, or private secret in frontend code, client configurations, or `VITE_` environment variables.
- **NEVER** run migrations, `DROP TABLE`, or destructive SQL against a production database.
- **NEVER** edit files directly on the `main` branch. All agent work must be performed on dedicated task worktrees or feature branches (`feature/<task-name>`).
- **NEVER** disable Row-Level Security (`ALTER TABLE ... DISABLE ROW LEVEL SECURITY`) on any public table.
- **NEVER** commit generated assets (`dist/`), temporary audio caches (`data/audio_cache/`, `*.mp3`), or `.env` files.

---

## 4. Human-in-the-Loop Review Gates

Automated agents may propose changes, but a **human-reviewed diff is mandatory** before merging any changes touching:
1. **Authentication & Authorization**: `src/auth/*`, `src/context/AuthContext.jsx`, or `server/middleware/*`.
2. **Database Security & RLS**: `database/schema.sql`, `database/security_policies.sql`, or any migration in `database/migrations/*`.
3. **Third-Party Integrations**: EmailJS (`ContactPage.jsx`), ImgBB (`ProfilePage.jsx`), or payment providers.
4. **Production Deployment Configurations**: `vercel.json`, `render.yaml`, or CI/CD pipelines in `.github/workflows/*`.

---

## 5. Code Conventions & Standards

- **File Size Target**: $\le 300\text{--}400$ lines per file. Complex monolithic pages must be decomposed into sub-components in `src/features/`.
- **Touch Target Floor**: All interactive buttons, inputs, links, and select menus must have a minimum touch target size of $44\text{px}$ (`min-h-11`, `min-w-11` or `px-4 py-2.5`) for mobile thumb accessibility.
- **Design System Consistency**: Strict Plum palette (`#6D4E56`) with clean neutral white canvas (`#FFFFFF`). Zero bulky external component kits.
- **Cryptographic Security**: Always use `secureShuffle` and `secureRandomUUID` from `src/utils/cryptoRandom.js` instead of insecure `Math.random()`.
- **Text Escaping**: Escape all dynamic user-controlled strings using `escapeHtml()` before interpolating into HTML strings or print frames to prevent XSS.

---

## 6. Pre-Submission Checklist

Before submitting or proposing any pull request, ensure:
- [ ] `npm run lint` passes with 0 errors and 0 warnings.
- [ ] `npm test` passes all test suites.
- [ ] `npm run security:scan` reports 0 detected credential patterns.
- [ ] `npm run build` completes with 0 warnings and adheres to vendor chunk limits.
- [ ] Target database changes include both a forward migration (`YYYYMMDD_*.sql`) and a verified rollback script (`YYYYMMDD_*_rollback.sql`).
