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
