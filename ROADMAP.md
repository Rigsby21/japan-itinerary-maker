# Japan Itinerary Maker — Roadmap & Build Path

## Product summary

- **What it is:** A web app for building and viewing Japan travel itineraries.
- **Who uses it:**  
  - **Public:** View featured itineraries (no account).  
  - **Registered users:** Account; can view/save (and later pay to become creators).  
  - **Creators (paying):** Create and edit their own itineraries; use map markers.  
  - **Admin:** Edit any itinerary, set featured itineraries, manage content and optionally users.

---

## Efficient build path (in order)

Building in this order avoids rework and keeps each phase buildable and testable:

1. **Define data model & set up stack**  
   So every feature (auth, itineraries, maps, payments) uses the same schema and APIs.

2. **Auth & roles**  
   Needed before you can gate “who can create,” “who is admin,” and “who paid.”

3. **Public featured itineraries**  
   No auth required; gives you something to show and share early; validates the idea.

4. **Itinerary builder + Google Maps**  
   Core value: create/edit itineraries and place markers. Build for admin first, then open to creators once payments exist.

5. **Payments & creator access**  
   Unlock “create itineraries” and map features for paying users (and optionally “sell the app” as a product).

6. **Admin console**  
   Central place to edit any itinerary, mark as featured, and (optional) manage users.

7. **Polish & launch**  
   UX, emails, legal, SEO, and going live.

---

## What is a "tech stack"?

A **tech stack** is the set of tools and technologies you use to build and run your app. Think of it like a stack of layers:

- **Frontend** — What users see and click in the browser (pages, buttons, forms). Example: Next.js (React).
- **Backend** — The server and logic that handle requests, talk to the database, and enforce rules. Example: Next.js API routes or a separate Node server.
- **Database** — Where you store data (users, itineraries, locations). Example: PostgreSQL.
- **Auth** — How you handle sign-up, login, and “who is this user?” Example: Supabase Auth or NextAuth.js.
- **External services** — Things you plug in (maps, payments). Examples: Google Maps API, Stripe.

You don’t have to memorize every option. For this project we pick one option per layer so everything works together. The table below is the **recommended stack** for this app.

---

## Recommended tech stack

| Layer        | Suggestion        | Why |
|-------------|--------------------|-----|
| **Frontend** | Next.js (React)   | One codebase for app + API; good SEO for public featured itineraries. |
| **Backend**  | Next.js API routes or separate Node API | Simple to start; scales to a dedicated API later if needed. |
| **Database** | PostgreSQL (e.g. Supabase or Neon) | Relational fit for users, itineraries, stops, roles; Supabase adds auth and realtime if you want. |
| **Auth**     | Supabase Auth or NextAuth.js | User accounts, sessions, and role checks (user / creator / admin). |
| **Maps**     | Google Maps JavaScript API (Places + Maps) | Markers for cities and locations; optional Places for search. |
| **Payments** | Stripe | Subscriptions or one-time for “creator” access and selling the app. |
| **Hosting**  | Vercel (frontend + serverless) + hosted Postgres | Fast to deploy; fits Next.js and serverless APIs. |

You can swap pieces (e.g. Firebase instead of Supabase, or a different host); the phases below still apply.

---

## Phase overview

| Phase | Name                         | Goal |
|-------|------------------------------|------|
| **0** | Foundation & data model     | Project + DB + schema; no UI yet. |
| **1** | Auth & roles                 | Sign up, login, and role: user / creator / admin. |
| **2** | Public & featured itineraries| Anyone can see featured itineraries without an account. |
| **3** | Itinerary builder + maps     | Create/edit itineraries and place markers on Google Maps. |
| **4** | Payments & creator access    | Pay to become creator; optionally “sell the app.” |
| **5** | Admin console                | Admin edits any itinerary, sets featured, manages content. |
| **6** | Polish & launch              | UX, email, legal, SEO, and release. |

---

## Version control & backups on GitHub

**Why use Git and GitHub?**

- **Version control (Git):** Saves snapshots of your project so you can see what changed, undo mistakes, and try ideas in branches without breaking the main app.
- **Backups on GitHub:** Your code lives in the cloud. If your computer breaks or you switch machines, you don’t lose the project. You can also collaborate later or show your repo in a portfolio.

**How to use it phase by phase**

1. **Before you start Phase 0**
   - Install [Git](https://git-scm.com/downloads) if you don’t have it.
   - Create a **new repository on GitHub** (e.g. `japan-itinerary-maker`). Do *not* add a README, .gitignore, or license yet if the project already exists locally.
   - In your project folder, run:
     - `git init`
     - `git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git`
   - Add a `.gitignore` (so you don’t commit `node_modules`, `.env`, etc.). Many templates (e.g. Next.js) create this for you.

2. **During each phase**
   - Work on the tasks for that phase.
   - When you finish a logical chunk (e.g. “database connected” or “login page works”), commit:
     - `git add .`
     - `git commit -m "Phase 0: add database schema"`
   - Use clear messages, e.g. `Phase 1: add login page` or `Phase 2: featured itineraries list`.

3. **At the end of each phase**
   - Make a final commit for that phase if you haven’t already.
   - Push to GitHub so everything is backed up:
     - `git push -u origin main`
     - (Use `master` instead of `main` if your default branch is `master`.)
   - Optional: on GitHub, add a **tag** for the phase (e.g. `v0-phase0`, `v0-phase1`) so you can always get back to “end of Phase 1,” etc.

4. **Safety rules**
   - Never commit **secrets** (passwords, API keys). Keep them in `.env` and make sure `.env` is in `.gitignore`.
   - Commit and push at least at the end of each phase so you always have a recent backup.

**Quick reference**

| When              | What to do |
|-------------------|------------|
| Start of project  | `git init`, add `origin`, add `.gitignore`. |
| During a phase     | `git add .` → `git commit -m "describe change"`. |
| End of each phase  | Commit any last changes, then `git push origin main`. |
| After push         | Optional: create a tag on GitHub (e.g. `phase-1-done`). |

**Asking the AI to save to Git**

When you want a snapshot backed up to GitHub, say: **"Save to Git"**, **"Push to Git"**, or **"Commit and push"**. The AI will run `git add .`, commit with a short message, and push to `origin main`.

---

## Phase 0: Foundation & data model

**Goal:** Repo, database, and schema so the rest of the app has a single source of truth.

**Tasks:**

- Initialize project (e.g. Next.js), connect to PostgreSQL, set up env (DB URL, later: Google Maps key, Stripe keys).
- Define and implement schema (migrations or SQL), for example:
  - **users**  
    - id, email, password_hash (or rely on Supabase Auth), display_name, role (`user` \| `creator` \| `admin`), stripe_customer_id (optional), created_at, updated_at.
  - **itineraries**  
    - id, title, slug, description, author_id (FK → users), is_featured (boolean), is_public (boolean), created_at, updated_at.
  - **itinerary_stops** (or days + stops)  
    - id, itinerary_id, day_number, order_index, place_name, city, lat, lng, notes, created_at.
- No login or UI required yet; optional: seed a few test itineraries for development.

**Done when:** You can run the app, connect to the DB, and read/write users and itineraries (e.g. via scripts or a minimal API). Git is initialized, `.gitignore` is in place, and the repo is pushed to GitHub (first backup).

---

## Phase 1: Auth & roles

**Goal:** Users can sign up and log in; the app knows their role (user / creator / admin).

**Tasks:**

- Integrate auth (Supabase Auth or NextAuth.js).
- Sign up + login (email/password or OAuth).
- Session and role on every request (middleware or API checks).
- Role checks:
  - **user:** default for new signups.
  - **creator:** granted after payment (Phase 4) or manually in DB for testing.
  - **admin:** set in DB or via a first-user script; do not expose in public signup.
- Optional: simple “profile” page (e.g. email, name); no itinerary UI yet.

**Done when:** You can register, log in, and see role in session; backend can allow/deny by role.

---

## Phase 2: Public & featured itineraries

**Goal:** Anyone can see a list of featured itineraries and open one (no account). Registered users can optionally save/favorite later.

**Tasks:**

- **Public routes (no auth):**
  - Home or “Featured” page: list itineraries where `is_featured = true` (and optionally `is_public = true`).
  - Itinerary detail page: show title, description, days/stops (and later a read-only map).
- Data: only show itineraries marked as featured (admin will set this in Phase 5).
- Optional: basic SEO (meta title/description per itinerary) for shared links.

**Done when:** A visitor with no account can open the app and view featured itineraries; data comes from DB.

---

## Phase 3: Itinerary builder + Google Maps

**Goal:** Create and edit itineraries and place markers for cities and locations on Google Maps. Available first to admin, then to creators in Phase 4.

**Tasks:**

- **Builder UI (for admin, then creator):**
  - Create new itinerary (title, description).
  - Add/edit/remove days and stops; each stop: place name, city, optional notes.
  - For each stop (or city): set or pick location → store **lat/lng** in `itinerary_stops`.
- **Google Maps:**
  - One map per itinerary: show all stops as markers; optional: fit bounds to all markers.
  - In builder: click map or search to add a marker; save lat/lng to current stop.
  - Use Google Maps JavaScript API (and optionally Places for search).
- **Access control:** Only users with role `admin` or `creator` can create/edit; others get 403 or redirect.
- **Read-only map on public itinerary page:** Same map + markers, no editing.

**Done when:** Admin (and later creator) can create an itinerary, add stops, place markers on the map, and save; public page shows that itinerary with a read-only map.

---

## Phase 4: Payments & creator access

**Goal:** Users can pay to become “creators” and use the itinerary builder; optionally define “selling the app” (e.g. one-time or subscription).

**Tasks:**

- **Stripe:**
  - Product(s): e.g. “Creator access” (monthly or one-time).
  - Checkout session or Customer Portal; webhook to confirm payment.
- **After successful payment:**  
  - Set user’s role to `creator` (and/or set a “creator_until” date if subscription).  
  - Store stripe_customer_id and subscription_id if needed.
- **Gating:**  
  - “Create itinerary” and builder only for `creator` or `admin`.  
  - Show “Upgrade to create itineraries” for plain `user`.
- **“Sell the itinerary maker/app”:**
  - If you mean “charge for using the app”: same as above (creator = paid user).
  - If you mean “sell the code/product to another business”: no extra feature in the app; just licensing/contracts and optional white-label (later).

**Done when:** A user can pay via Stripe and then create/edit itineraries with map markers; non-paying users cannot access the builder.

---

## Phase 5: Admin console

**Goal:** One place for admin to manage itineraries and featured content (and optionally users).

**Tasks:**

- **Admin-only area** (e.g. `/admin`), protected by role `admin`.
- **Itinerary management:**
  - List all itineraries (table or cards).
  - Edit any itinerary (reuse same builder as Phase 3).
  - Toggle **featured** and **public** so they show on the public featured list.
  - Optional: delete or “unpublish.”
- **Optional:**
  - List users; set role to creator/admin (e.g. for support or early testers).
  - Simple stats: number of users, itineraries, featured count.

**Done when:** Admin can open the console, edit any itinerary, and control which itineraries are featured and public.

---

## Phase 6: Polish & launch

**Goal:** Ready to market and run in production.

**Tasks:**

- **UX:** Loading states, errors, empty states, mobile-friendly layout.
- **Email:** Password reset; optional: payment receipts and “your itinerary is live” emails.
- **Legal:** Terms of Service, Privacy Policy (required if you collect data and take payments).
- **SEO:** Sitemap, meta tags for featured itineraries, basic performance (images, caching).
- **Operations:** Env for production (DB, Stripe live keys, Google Maps key); monitoring and backups.
- **Launch:** Domain, SSL, go-live checklist (e.g. test signup, payment, and one featured itinerary).

**Done when:** A new visitor can find the site, view featured itineraries, sign up, pay to become a creator, and build an itinerary with map markers; admin can manage everything from the console.

---

## Dependency diagram (what blocks what)

```
Phase 0 (Foundation) ──────────────────────────────────────────────────────────┐
        │                                                                       │
        ▼                                                                       │
Phase 1 (Auth & roles) ────────────────────────────────────────────────────────┤
        │                                                                       │
        ├──────────────────────────┬───────────────────────────────────────────┤
        ▼                          ▼                                           │
Phase 2 (Public featured)    Phase 3 (Builder + Maps)                          │
        │                          │                                           │
        │                          │ (needs creator role from Phase 4 to open   │
        │                          │  builder to paying users)                  │
        │                          ▼                                           │
        │                  Phase 4 (Payments & creator)                        │
        │                          │                                           │
        │                          ▼                                           │
        │                  Phase 5 (Admin console)  ← uses same builder + DB    │
        │                          │                                           │
        └──────────────────────────┴───────────────────────────────────────────┤
                                    ▼                                           │
                            Phase 6 (Polish & launch)                            │
                                                                                 │
All phases depend on Phase 0 (and Phase 1 except public pages). ───────────────┘
```

---

## Quick reference: user capabilities by phase

| Capability                         | Phase 2 | Phase 3 | Phase 4 | Phase 5 |
|------------------------------------|--------|--------|--------|--------|
| View featured itineraries (no account) | ✅     | ✅     | ✅     | ✅     |
| Register / log in                  | ✅     | ✅     | ✅     | ✅     |
| Create/edit own itineraries + maps | —      | Admin  | Admin + Creator | Admin + Creator |
| Pay to become creator              | —      | —      | ✅     | ✅     |
| Admin: edit any itinerary, set featured | —  | ✅     | ✅     | ✅ (console) |

---

## Suggested next step

Start with **Phase 0:** set up the repo (e.g. Next.js), add PostgreSQL (Supabase or Neon), and define the tables (`users`, `itineraries`, `itinerary_stops`). Once that’s in place, Phase 1 (auth) and Phase 2 (public featured) can proceed in parallel if you want (auth for “my account,” public pages for “featured” view).

If you tell me your preferred stack (e.g. “Next.js + Supabase” or “React + Node + PostgreSQL”), I can turn Phase 0 into a concrete step-by-step checklist or generate starter code next.
