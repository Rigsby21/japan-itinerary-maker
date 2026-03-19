# Phase 0: Foundation — How to run and verify

## What’s in place

- **Next.js app** in the `web` folder (TypeScript, Tailwind, App Router).
- **Env**: `web/.env.example` lists variables; copy to `web/.env` and never commit `.env`.
- **Database schema** (Prisma): `users`, `itineraries`, `itinerary_stops` in `web/prisma/schema.prisma`.
- **API**: `GET /api/db` — returns `{ ok: true, itinerariesCount: 0 }` when the DB is connected, or `503` with a message if not.

## How to review each part

### 1. Next.js app runs

From the project root:

```bash
cd web
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You should see the Next.js welcome page.

### 2. API responds (without a database)

With the dev server running, open [http://localhost:3000/api/db](http://localhost:3000/api/db).

You should see a **503** response and a message like: *"Set DATABASE_URL in .env..."*. That’s expected until you add a real database.

### 3. Prisma schema and client

```bash
cd web
npx prisma validate
npx prisma generate
```

- `prisma validate` should report no errors.
- `prisma generate` should say the client was generated to `app/generated/prisma`.

### 4. Database connected (optional for Phase 0)

When you have a PostgreSQL URL (e.g. from [Supabase](https://supabase.com) or [Neon](https://neon.tech)):

1. Copy `web/.env.example` to `web/.env`.
2. Set `DATABASE_URL` in `web/.env` to your Postgres connection string.
3. Run:

   ```bash
   cd web
   npx prisma migrate dev --name init
   ```

4. Restart the dev server and open [http://localhost:3000/api/db](http://localhost:3000/api/db). You should get **200** and `{ "ok": true, "itinerariesCount": 0 }`.

## Move 4: Git and first backup on GitHub

You need **Git** installed: [git-scm.com/downloads](https://git-scm.com/downloads). After installing, close and reopen your terminal (and Cursor if needed).

Then, in your project folder (`Reeses Test Project`), run these one by one.

### 1. Create the repo on GitHub (in the browser)

- Go to [github.com/new](https://github.com/new).
- Repository name: e.g. `japan-itinerary-maker`.
- Leave “Add a README” **unchecked** (you already have files).
- Create repository.

### 2. Connect your project and push

In PowerShell (or Terminal), from the project root:

```powershell
cd "c:\Users\reese\Desktop\Reeses Test Project"

git init
git add .
git status
```

Check that `web/.env` and `web/node_modules` do **not** appear (they’re in `.gitignore`). Then:

```powershell
git commit -m "Phase 0: Next.js app, Prisma schema, DB API, env setup"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/japan-itinerary-maker.git
git push -u origin main
```

Replace `YOUR_USERNAME` and `japan-itinerary-maker` with your GitHub username and repo name. If GitHub asks for login, use a **Personal Access Token** as the password (Settings → Developer settings → Personal access tokens).

### How to review Move 4

- Run `git status` and confirm there are no uncommitted changes (or only expected ones).
- On GitHub, refresh the repo page: you should see `ROADMAP.md`, `PHASE0.md`, and the `web/` folder with your code. No `.env` file should be there.

---

After this, Phase 0 is complete. Next: **Phase 1 — Auth & roles**.
