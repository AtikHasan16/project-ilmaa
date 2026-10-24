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

### 1. Hardware & Device-Locked Authentication
- **10-Digit Access ID**: Enrolled users receive a unique, randomly-generated 10-digit ID.
- **Device Fingerprint / Token**: On initial approved login, the user's browser device UUID is permanently bound. Unauthorized access from unfamiliar devices is routed to access pending or rejected queues.

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
- **General**: Full access to Vocabulary & Grammar modules.
- **Advance**: Access to **Upload to Study** to inject custom academic vocabulary.
- **Admin**: Access to **Admin Dashboard** with live ID generation, user role assignment, and pending device approval/rejection queues.

---

## 🛠️ Tech Stack

### Frontend (`project-ilmaa`)
- **React 19** + **Vite 8**
- **Tailwind CSS v4** (`@tailwindcss/vite`) + **DaisyUI v5**
- **React Router v7/v8**
- **React Icons** (filled Heroicons `hi2`)
- **Axios** (centralized API client with automatic device token interceptors)

### Backend (`server`)
- **Express.js** + **CORS** + **Dotenv**
- **Local JSON Collection Database** (`server/db.js`) — zero third-party network dependency, persistent local storage.

---

## 🏃 Getting Started

### 1. Start the Backend Server
```bash
cd server
npm install
npm run dev
# Server will run on http://localhost:5000
```

### 2. Start the Frontend Client
```bash
cd project-ilmaa
npm install
npm run dev
# Vite client will run on http://localhost:5173
```

### 3. Initial Login Credentials
- **Full Name**: `Admin User`
- **10-Digit Access ID**: `1234567890`
