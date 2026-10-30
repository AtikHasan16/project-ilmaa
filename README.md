# Imlaa. (إملاء) — Linguistic Mastery Platform

> **Hear it. Spell it. Own it.**  
> A focused orthography and auditory spelling mastery tool designed to test acoustic recall without visual bias, and achieve instinctive vocabulary retention.

---

## 🎯 Pedagogical Philosophy
Traditional vocabulary flashcards display the word first, inducing cognitive visual bias. **Imlaa** flips this dynamic entirely:
1. **Zero Distraction**: Absence of visual cues forces purely auditory-orthographic neuro-mapping.
2. **Acoustic Accuracy**: Calibrated speech synthesis enunciations covering high-friction phonemic transitions.
3. **Systematic Retention**: Spaced repetition, instant pedagogical rule explanations, and target-incorrect practice.

---

## 🎨 Strict Aesthetic & Design System
Imlaa follows an intentional, minimalist design system tailored for academic focus:
- **Canvas / Background**: Pure White (`#FFFFFF`)
- **Primary / Active Accent**: Deep Muted Plum (`#6D4E56`)
- **Hover State**: `#5A3E45`
- **Text Primary**: Charcoal Body Dark (`#1F2937`)
- **Text Secondary**: Muted Label (`#6B7280`)
- **Card Outline**: Deep Muted Plum with 20% opacity (`rgba(109, 78, 86, 0.20)`), `rounded-xl`
- **Typography Floor**: Universal `Roboto` font with an absolute size floor of `>= 1rem` (`16px`) across all interactive text, badges, and inputs.
- **Zero Distraction Navigation**: No top headers or cluttered banners in the workspace canvas. Navigation is achieved via a floating vertical dock (desktop) and floating bottom nav (mobile).

---

## 🚀 Key Features

### 1. Authentication
- Sign in with Supabase Auth using Google or email/password.
- User profile and role information is stored in Supabase; database access is governed by row-level security policies.

### 2. Auditory Vocabulary Flashcards
- **Front Side (Recall)**: Web Speech API pronunciation trigger with interactive waveform visualization and keyboard-friendly text spelling submission.
- **Back Side (Study Card)**: 4-row structured pedagogical layout:
  1. Target Word + Part of Speech (POS)
  2. Bengali Meaning
  3. Synonym Tags
  4. Italicized Academic Usage Example
- **Practice Incorrect Only**: Instantly isolates misspellings for targeted drills.

### 3. Grammar Drills
- Modules for high-frequency patterns including **Subject-Verb Agreement**, **Appropriate Prepositions**, and **Mixed Master Drill**.
- Instant rule explanations displayed immediately upon answer selection.

### 4. Role-Gated Capabilities
- **General**: Access to vocabulary and grammar study modules, plus personal uploads.
- **Admin**: Access to administrative dashboards and corpus management.

---

## 🛠️ Tech Stack

### Frontend (`project-ilmaa`)
- **React 19** + **Vite 8**
- **Tailwind CSS v4** (`@tailwindcss/vite`) + **DaisyUI v5**
- **React Router**
- **React Icons** (filled Heroicons `hi2`)
- **Supabase Auth and Postgres** (direct client access protected by RLS)

### Backend (`server`)
- **Express.js** and **node-edge-tts** for server-side speech generation
- Admin and user-data REST routes require a verified Supabase bearer token.
- The legacy device-token authentication API returns `410 Gone`.

---

## 🏃 Getting Started

### Supabase database setup

- For an existing Supabase project, run [`supabase_security_policies.sql`](../supabase_security_policies.sql) in the Supabase SQL Editor to apply the RLS and role-protection changes. This migration does not insert seed data.
- For a new project, run [`supabase_schema.sql`](../supabase_schema.sql) first, then run the security migration. Do not rerun the full schema against a populated project because it includes seed inserts.

### 1. Start the Backend Server
```bash
cd ../server
npm install
npm run dev
# Server will run on http://localhost:5000
```

### 2. Start the Frontend Client
```bash
npm install
npm run dev
# Vite client will run on http://localhost:5173
```

Configure frontend environment values from `.env.example` and server-side
Supabase settings in `server/.env`. Use Supabase Auth for sign-in; there are no
default application credentials.
