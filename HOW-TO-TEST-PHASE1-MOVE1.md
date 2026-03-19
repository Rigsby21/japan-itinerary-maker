# How to test Phase 1 Move 1 — explained from zero

This guide assumes you’ve never done this before. Follow the steps in order.

---

## What you’re testing

You’re checking that **sign-in** works: you can “log in” with a fake email and password, see that you’re logged in, then “log out.” No real account or database yet — it’s just to see the flow.

---

## Part 1: Set the secret (so the app can “remember” who’s logged in)

### What this is

The app needs a **secret** (a long random string) to safely store your login state. You put it in a file called `.env` that only your computer has. The app reads it; we never put this file on GitHub.

### Step 1.1 — Open the `web` folder

- In Cursor (or File Explorer), go to your project folder: **Reeses Test Project**.
- Open the folder inside it called **web**.

You should see folders like `app`, `prisma`, and files like `package.json`, `.env.example`.

### Step 1.2 — Copy the example env file

- Find the file **`.env.example`** in the `web` folder.
  - If you don’t see it, it might be hidden. In Cursor it usually still shows in the file list.
- **Copy** that file **in the same folder** and name the copy **`.env`**.
  - So you now have both: `.env.example` and `.env`.

### Step 1.3 — Add the secret inside `.env`

- **Open** the **`.env`** file (the one you just created).
- Find the line that says something like:
  - `AUTH_SECRET="your-secret-at-least-32-chars-long"`
- **Change it** to a long random string. For example you can type:
  - `AUTH_SECRET="my-super-secret-key-for-japan-itinerary-app-12345"`
  - Or use any sentence or random letters that’s at least 32 characters long. No spaces in the value, or put the whole value in quotes.
- **Save** the file (Ctrl+S).

You’re done with the secret. The app will use this to keep your “logged in” state secure.

---

## Part 2: Start the app (run the website on your computer)

### What this is

“Running the app” means starting a small “server” on your computer so you can open the site in your browser at `http://localhost:3000`. You do this from a **terminal** (a place where you type commands).

### Step 2.1 — Open a terminal

- In Cursor: **Terminal → New Terminal** (or the shortcut it shows).
- A panel opens at the bottom with a line where you can type. That’s the terminal.

### Step 2.2 — Go to the project folder

- Type this and press **Enter**:
  ```text
  cd "c:\Users\reese\Desktop\Reeses Test Project"
  ```
- The next line should show the same folder path (or similar). That means you’re “in” the project folder.

### Step 2.3 — Start the app

- Type this and press **Enter**:
  ```text
  npm run dev
  ```
- Wait a few seconds. You should see text like “Ready” or “compiled” and maybe “localhost:3000”.

**If you see an error:**  
- “Cannot find module” or “npm not found” → make sure you’re in **Reeses Test Project** (the folder that has `package.json`) and that you’ve run `npm run dev` from there.  
- “AUTH_SECRET” error → go back to Part 1 and make sure `.env` exists in the **web** folder and has a long `AUTH_SECRET=...` line.

**Leave this terminal open.** The app is running. When you want to stop it later, you can press **Ctrl+C** in that terminal.

---

## Part 3: Open the site in your browser

### Step 3.1 — Open the address

- Open **Chrome** (or any browser).
- In the address bar at the top, type:
  ```text
  http://localhost:3000
  ```
- Press **Enter**.

### What you should see

- A page that looks like the Next.js default page (logo, “To get started, edit the page.tsx file”, etc.).
- **Near the top** you should see a link that says something like:
  - **“Sign in (Phase 1 — use any email, password: password)”**

If you see that link, the app and the auth setup are working so far. If you don’t see it, stop and say what you do see (or send a screenshot).

---

## Part 4: Test “Sign in” (log in with the test password)

### Step 4.1 — Click “Sign in”

- Click the **“Sign in (Phase 1 — use any email, password: password)”** link.

### What you should see

- A new page: the **sign-in page**. It might say “Sign in” at the top and have two boxes:
  - One for **email**
  - One for **password**

There might also be a dropdown or button that says “Credentials” or “Sign in with Credentials”. If you see that, you can leave it as is or select “Credentials.”

### Step 4.2 — Enter email and password

- In **Email**, type anything that looks like an email, for example:
  - `test@example.com`
- In **Password**, type exactly (all lowercase):
  - `password`

Then click **Sign in** (or **Submit** / whatever the button says).

### What should happen

- The page may flash or load.
- You should end up back on the **home page** (the one with the Next.js logo and “To get started, edit the page.tsx file”).

### Step 4.3 — Check that you’re “logged in”

- **Look at the top of the same page.** You should now see something like:
  - **“Signed in as test@example.com (role: USER)”**
  - And a link: **“Sign out”**

That means:
- The app accepted the email and password.
- It “remembered” you (session is working).
- It’s showing your email and a role (USER). We’ll use roles later for “who can do what.”

If you still see “Sign in” instead of “Signed in as…”, the login didn’t work. Double-check:
- Password is exactly **password** (lowercase, no extra spaces).
- You’re on `http://localhost:3000` (not a different port).

---

## Part 5: Test “Sign out” (log out)

### Step 5.1 — Click “Sign out”

- Click the **“Sign out”** link (the one next to “Signed in as …”).

### What should happen

- The page may reload or redirect.
- The **“Signed in as …”** and **“Sign out”** text should **disappear**.
- You should see the **“Sign in (Phase 1 — use any email, password: password)”** link again.

That means sign-out is working: the app “forgot” your login.

---

## Quick checklist (summary)

Use this to confirm you did everything:

- [ ] Created **`.env`** in the **web** folder and set **`AUTH_SECRET`** to a long string (at least 32 characters).
- [ ] Ran **`npm run dev`** from **Reeses Test Project** and left the terminal open.
- [ ] Opened **http://localhost:3000** in the browser.
- [ ] Saw the **“Sign in (Phase 1 — …)”** link on the home page.
- [ ] Clicked it, entered **any email** and password **`password`**, then clicked Sign in.
- [ ] Saw **“Signed in as … (role: USER)”** and **“Sign out”** on the home page.
- [ ] Clicked **“Sign out”** and saw the **“Sign in”** link again.

If every box is checked, **Phase 1 Move 1** is working. If something doesn’t match (e.g. wrong page, wrong text, or an error), tell me exactly what you see at which step and we’ll fix it.
