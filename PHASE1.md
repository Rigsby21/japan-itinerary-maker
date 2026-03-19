# Phase 1: Auth & roles — moves and review

## Move 1: NextAuth + minimal sign-in (no database yet) ✅ Ready for your review

**What was added**

- **next-auth** (v5 beta) for sign-in/sign-out and session.
- **`web/auth.ts`** — NextAuth config with a **Credentials** provider that, for testing only, accepts **any email** and password **`password`**. Session includes a hardcoded **role: USER**.
- **`web/app/api/auth/[...nextauth]/route.ts`** — Route handler so `/api/auth/signin`, `/api/auth/signout`, etc. work.
- **`web/.env.example`** — Added **`AUTH_SECRET`**. You must set this in `web/.env` for auth to work (see below).
- **Home page** — Shows “Sign in” when logged out, and “Signed in as … (role: USER)” + “Sign out” when logged in.

**How to review**

1. **Add `AUTH_SECRET` to your env**
   - If you don’t have `web/.env`, copy `web/.env.example` to `web/.env`.
   - In `web/.env`, set:
     - `AUTH_SECRET=any-string-at-least-32-characters-long`
   - (You can generate one with: `openssl rand -base64 32`, or use any long random string. Never commit `.env`.)

2. **Run the app**
   - From project root: `npm run dev`
   - Open [http://localhost:3000](http://localhost:3000).

3. **Check when logged out**
   - You should see a “Sign in (Phase 1 — use any email, password: password)” link.

4. **Sign in**
   - Click the link → NextAuth sign-in page.
   - Email: any (e.g. `test@example.com`).
   - Password: **`password`** (lowercase).
   - Submit.

5. **Check when logged in**
   - You should be redirected to the home page and see “Signed in as test@example.com (role: USER)” and a “Sign out” link.

6. **Sign out**
   - Click “Sign out” → you should be signed out and see the “Sign in” link again.

If anything doesn’t match (e.g. no link, wrong password, or session not showing), tell me what you see and we’ll fix it. Once you’re happy, say **approved** or **move on**, and we’ll do **Move 2** (connect auth to the database and real login).

---

## Move 2: Real login with the database ✅ Ready for your review

**What was added**

- Sign-in now uses the **database**: we look up the user by email and check the password with a secure hash (bcrypt).
- **`web/auth.ts`** — `authorize()` calls `getPrisma()`, finds the user by email, verifies the password with `bcrypt.compare`, and puts the user’s **role from the DB** in the session.
- **`web/prisma/seed.ts`** — A seed script that creates (or updates) a test user **test@example.com** with password **password** and role **USER**. Run it once so you can sign in.

**You need a database for this.** If you didn’t set one up in Phase 0, add `DATABASE_URL` to `web/.env` (e.g. from [Supabase](https://supabase.com) or [Neon](https://neon.tech)), then run the steps below.

**How to review**

1. **Database and tables**
   - In `web/.env` you must have **`DATABASE_URL`** set to a real PostgreSQL connection string.
   - From the **web** folder, run:
     - `npx prisma migrate dev --name init`
     - (If you already ran this in Phase 0, you can skip it. If it runs, it creates the `User`, `Itinerary`, and `ItineraryStop` tables.)

2. **Create the test user**
   - From the **web** folder, run:
     - `npx prisma db seed`
   - You should see: “Seed done. You can sign in with: test@example.com / password”.

3. **Run the app**
   - From project root: `npm run dev`
   - Open [http://localhost:3000](http://localhost:3000).

4. **Sign in with the seeded user**
   - Click “Sign in”.
   - Email: **test@example.com**
   - Password: **password**
   - Submit.

5. **Check the session**
   - You should see “Signed in as test@example.com (role: USER)”. The role comes from the database now.

6. **Wrong password**
   - Sign out, then try to sign in with **test@example.com** and password **wrong**. You should **not** be logged in (invalid credentials).

If you don’t have a database yet, sign-in will fail (we return “invalid credentials” when the DB isn’t available). Set up Postgres and run migrate + seed, then test again. Once you’re happy, say **approved** or **move on** for **Move 3** (sign-up / register).

---

## Move 3: Sign-up (register) flow ✅ Ready for your review

**What was added**

- **`/register`** — A sign-up page with email, password (min 8 chars), and optional display name.
- **`web/lib/actions/register.ts`** — Server action that checks email isn’t taken, hashes the password with bcrypt, creates a **User** in the DB with role **USER**, then redirects to the sign-in page.
- **Home page** — When logged out, shows both **Sign in** and **Sign up** links.

**How to review**

1. Run the app (`npm run dev`), open **http://localhost:3000**.
2. Click **Sign up** (or go to **http://localhost:3000/register**).
3. Enter a **new** email (e.g. `newuser@example.com`), password (at least 8 characters), and optionally a display name. Click **Sign up**.
4. You should be redirected to the sign-in page. Sign in with that email and password — you should see “Signed in as …”.
5. In **Supabase** → Table Editor → **User**, you should see the new row (email, displayName, role USER).
6. Try signing up again with the **same** email — you should see: “An account with this email already exists.”
7. Try a password shorter than 8 characters — you should see a validation error.

Once you’re happy, say **approved** or **move on** for **Move 4** (role in session + protect a page).

---

## Move 4: Role in session + protect a page ✅ Ready for your review

**What was added**

- **`/dashboard`** — Protected page: only logged-in users can see it. Redirects to sign-in if not logged in. Shows your role.
- **`/admin`** — Admin-only page: only users with role **ADMIN** can see it. Others are redirected to home with an “Admin access required” message.
- **`web/lib/auth.ts`** — `requireAuth()` (must be logged in) and `requireAdmin()` (must be ADMIN).
- **Home page** — When logged in: links to **Dashboard** and (if admin) **Admin**. When redirected from /admin without permission: shows an amber message.
- **Seed** — Adds **admin@example.com** with password **password** and role **ADMIN**. Run **`npx prisma db seed`** again to create the admin user (or update an existing user’s role in Supabase).

**How to review**

1. **Create the admin user (if you haven’t)**  
   From the **web** folder: `npx prisma db seed`. You should see the message about test@example.com and admin@example.com.

2. **Dashboard (any logged-in user)**  
   Sign in with **test@example.com** / **password**. Click **Dashboard**. You should see the dashboard with your role (USER). Sign out.

3. **Admin page (ADMIN only)**  
   Sign in with **admin@example.com** / **password**. You should see **Dashboard** and **Admin** on the home page. Click **Admin** — you should see the admin console. Sign out.

4. **Non-admin cannot open /admin**  
   Sign in with **test@example.com** / **password**. In the address bar go to **http://localhost:3000/admin**. You should be redirected to home and see: “Admin access required. Sign in with an admin account to view that page.”

5. **Guest cannot open /dashboard**  
   Sign out. Go to **http://localhost:3000/dashboard**. You should be redirected to the sign-in page.

Phase 1 is complete after this. Next: **Phase 2 — Public & featured itineraries**.
