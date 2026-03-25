<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# PROJECT SPECIFIC RULES: "Urge Relief" (Quitcia) Hybrid App

## 1. Architecture & Distribution
- **Hybrid Mobile App:** This is a Next.js application explicitly designed to run as a native Android app via Ionic **Capacitor** and as a Progressive Web App (PWA) via `next-pwa`.
- **Static Export Enforcement:** The application relies entirely on `output: "export"` in `next.config.ts` to output into an `out/` directory for Capacitor. Therefore, you **MUST NOT** use Next.js Server Actions, Server-Side Rendering (`getServerSideProps`), or dynamic server components anywhere.
- **REST/API Constraints:** Because of static exports, standard Next.js API Routes (`app/api/`) will compile but **will fail** when bundled into the Android APK. Any server-side logic (e.g., pushing data to Google Sheets during Onboarding) must either happen via client-side fetch calls to external backends or be migrated to Firebase Cloud Functions.

## 2. Tech Stack & State Management
- **Frontend Framework:** React 18+ (Next.js App Router). Every interactive component MUST have `"use client"` at the top.
- **Backend & Database:** **Firebase** (Google Cloud). We strictly use Firebase Authentication for login and Firestore for all real-time logic and Database CRUD operations (e.g., storing user profiles, tracking daily streaks, logging urges).
- **Global State Management:** Use **Zustand** (`src/app/store/`). Do not introduce Redux context or excessive React Context API.
- **Form Handling:** Use `react-hook-form` paired with `zod` for rigorously typed schemas.

## 3. Core App Logic & Features
- **Purpose:** A health widget/wellness app focused on helping users break impulsive loops and negative habits (urges).
- **Core Modules:** 
  - `Onboarding` (Multi-step forms capturing usage history, age, motivations).
  - `Dashboard` (Displays daily relief tasks on a radial progress bar, calculates streaks based on Firebase `lastLoginDate`, features a Breathing Exercise trigger).
  - `Urge Logging` (Time-stamped impulse tracking pushed to Firestore `users/{uid}/urges`).
  - `Audio / Analytics` (Meditation playback (`/play-audio`) and streak progress evaluation).

## 4. UI / UX Design Principles
- **Aesthetic Guidelines:** The UI must feel hyper-modern, calming, tactile, and exceptionally "premium." Do not build basic MVP interfaces.
- **Tailwind CSS:** Rely entirely on Vanilla Tailwind utilities. Avoid writing raw CSS unless absolutely necessary (for complex `globals.css` keyframes). 
- **Animations:** Extensive use of `framer-motion` for micro-interactions (e.g., `whileTap={{ scale: 0.98 }}`), layout transitions, modal popups, and stagger children effects. 
- **Components:** Avoid heavy external libraries. Utilize radix primitives, `class-variance-authority` (cva), and `clsx`/`tailwind-merge` (`cn` utility) for robust styling logic. All icons must be from `lucide-react`.
