# How to set up a database (step-by-step)

Your app needs a **PostgreSQL** database to store users, itineraries, and stops. This guide uses **Supabase** (free) and takes about 5 minutes.

---

## What you’ll do

1. Create a free Supabase account and a new project.
2. Copy the database connection string.
3. Put it in your `web/.env` file as `DATABASE_URL`.
4. Run Prisma migrations and seed so your app can use the database.

---

## Part 1: Create a Supabase project

### Step 1 — Open Supabase

- In your browser go to: **https://supabase.com**
- Click **“Start your project”** (or **Sign in** if you prefer to use GitHub/Google).

### Step 2 — Sign up or sign in

- Enter your email and a password (or use “Continue with GitHub” / “Continue with Google”).
- Confirm your email if Supabase asks you to.

### Step 3 — Create a new organization (if asked)

- If you see “Create a new organization,” type a name (e.g. **My Apps**) and click **Create**.
- You only do this once per account.

### Step 4 — Create a new project

- Click **“New project”**.
- Fill in:
  - **Name:** e.g. **japan-itinerary** (anything you like).
  - **Database password:** Create a **strong password** and **save it somewhere safe** (e.g. a notes app). You need this later for the connection string.
  - **Region:** Pick one close to you (e.g. East US, West Europe).
- Click **“Create new project”**.
- Wait 1–2 minutes until the project status is **Active** (you’ll see a green dot or “Project is ready”).

---

## Part 2: Get the database connection string

### Step 5 — Open Project Settings

- In the left sidebar, click the **gear icon** (**Project Settings**).
- In the left menu under **Project Settings**, click **Database**.

### Step 6 — Find the connection string

- Scroll to the section **“Connection string”**.
- You’ll see a few tabs; click **“URI”**.
- You’ll see a string that looks like:
  ```text
  postgresql://postgres.[something]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
  ```
- **Important:** The string has a placeholder `[YOUR-PASSWORD]`. You must **replace** that with the **database password** you created in Step 4.

### Step 7 — Copy the full connection string

- After replacing `[YOUR-PASSWORD]` with your real password, **copy the entire string**.
- Example (yours will be different):
  ```text
  postgresql://postgres.abcdefghij:MySecurePassword123@aws-0-us-east-1.pooler.supabase.com:6543/postgres
  ```
- For Prisma we usually use the **direct** connection, not the pooler, for migrations. Supabase shows both:
  - **“Session mode”** or **“Direct connection”** — use this one for `DATABASE_URL` if you see it (port **5432**).
  - If you only see the **pooler** (port **6543**), that’s OK — use it. If migrations fail, we’ll switch to the direct URL.

To get the **direct** URL (recommended for Prisma):
- On the same **Database** settings page, look for **“Connection string”** and a dropdown or tab that says **“Direct connection”** or **“Session”** (port 5432).
- Copy that URI and replace `[YOUR-PASSWORD]` with your database password.

---

## Part 3: Put the URL in your app

### Step 8 — Open your `.env` file

- In Cursor, in the **web** folder, open the file **`.env`** (not `.env.example`).
- If you don’t have a **`web/.env`** file, copy **`web/.env.example`** and rename the copy to **`.env`**.

### Step 9 — Add or update `DATABASE_URL`

- Find the line that says:
  ```text
  DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
  ```
- **Replace** that whole line with your copied connection string, **in quotes**. For example:
  ```text
  DATABASE_URL="postgresql://postgres.abcdefghij:MySecurePassword123@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
  ```
- Use **your** URL and **your** password. No spaces around the `=`.
- **Save** the file (Ctrl+S).

**Security:** Never commit `.env` to Git. It’s already in `.gitignore`, so you’re good.

---

## Part 4: Create tables and a test user

### Step 10 — Open a terminal

- In Cursor: **Terminal → New Terminal** (or use an existing one).
- Make sure you’re in the **web** folder. If not, run:
  ```text
  cd "c:\Users\reese\Desktop\Reeses Test Project\web"
  ```

### Step 11 — Run migrations (create tables)

- Run:
  ```text
  npx prisma migrate dev --name init
  ```
- The first time, it will:
  - Create the `User`, `Itinerary`, and `ItineraryStop` tables in your Supabase database.
  - Ask you to create a new migration — type **y** and press Enter if it asks.
- When it finishes, you should see something like **“Applied migration …”** or **“Your database is now in sync.”**
- If you see **“Connection refused”** or **“timeout”**: double-check `DATABASE_URL` in `web/.env` (correct password, no extra spaces). If you used the pooler URL and it fails, try the **direct** connection URL (port 5432) from Supabase.

### Step 12 — Seed the test user

- Run:
  ```text
  npx prisma db seed
  ```
- You should see: **“Seed done. You can sign in with: test@example.com / password”**.

---

## Part 5: Check that it works

### Step 13 — Start the app and sign in

- From the **project root** (Reeses Test Project), run:
  ```text
  npm run dev
  ```
- Open **http://localhost:3000** in your browser.
- Click **Sign in**.
- Email: **test@example.com**
- Password: **password**
- You should see **“Signed in as test@example.com (role: USER)”**.

If that works, your database is set up correctly.

---

## Quick reference

| Step | What to do |
|------|------------|
| 1–4 | Supabase: sign up → New project → set name + **database password** (save it). |
| 5–7 | Project Settings → Database → Connection string (URI) → replace `[YOUR-PASSWORD]` → copy. |
| 8–9 | In **web/.env**, set `DATABASE_URL="your-copied-url"`. Save. |
| 10–11 | In **web** folder: `npx prisma migrate dev --name init`. |
| 12 | In **web** folder: `npx prisma db seed`. |
| 13 | From project root: `npm run dev` → open localhost:3000 → sign in with test@example.com / password. |

---

## If something goes wrong

- **“DATABASE_URL is not set”**  
  → You’re missing `DATABASE_URL` in **web/.env**, or the app is reading from the wrong folder. Ensure the line is in **web/.env** and has no typos.

- **“Connection refused” / “timeout”**  
  → Wrong URL or password in `DATABASE_URL`. Re-copy from Supabase and replace `[YOUR-PASSWORD]` with your real database password. Try the **direct** (port 5432) URL if you used the pooler (6543).

- **“Migration failed” / “relation already exists”**  
  → Tables might already exist. You can run `npx prisma migrate dev` again; if it says “already in sync,” that’s OK. Then run `npx prisma db seed`.

- **Seed fails with “unique constraint”**  
  → The test user might already exist. That’s fine — you can still sign in with test@example.com / password.

If you hit a different error, copy the exact message and we can fix it step by step.
