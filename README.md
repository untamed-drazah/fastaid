# FastAId 🚑

**FastAId** is an AI‑guided first‑aid coach. It walks you through emergencies
(CPR, choking, bleeding, burns, and more) with step‑by‑step instructions,
spoken guidance, animated coaches, interactive timers, a CPR metronome, and
3D visual overlays. It also has an **offline mode**, so it still works even
without an internet/AI key.

This guide assumes **you have a brand‑new computer** — no programming tools, no
code editor, not even Git. Just follow the steps in order. It takes about
10 minutes.

> 🖥️ **What you'll end up with:** the app running in your web browser at
> **http://localhost:3000**

---

## Step 0 — Install Node.js (the only thing you must install)

The app runs on **Node.js**. Installing it also gives you **npm**, a command you'll
type later. You do **not** need Git, and you do **not** need a code editor.

1. Go to **https://nodejs.org**
2. Click the big button that says **“LTS”** (Long Term Support) and download it.
3. Open the downloaded file and click **Next / Continue / Install** until it finishes
   (the default options are fine).
   - **Windows:** it's a `.msi` installer.
   - **macOS:** it's a `.pkg` installer.
   - **Linux:** easiest is `sudo apt install nodejs npm` (Debian/Ubuntu), or use nodejs.org.
4. **Restart** your computer (or at least close and reopen any terminal windows).

### Check it worked
Open a terminal (see Step 2 if you don't know how) and type these two commands,
pressing **Enter** after each:

```bash
node --version
npm --version
```

If you see version numbers (for example `v20.11.0` and `10.2.4`), you're good. ✅
Node **18 or newer** is required.

---

## Step 1 — Get the code

You have two ways. **Option A needs no extra tools** and is easiest for beginners.

### Option A — Download the ZIP (no Git needed) ⭐ recommended
1. Open **https://github.com/untamed-drazah/fastaid** in your browser.
2. Click the green **`< > Code`** button → **Download ZIP**.
3. Find the downloaded `fastaid-main.zip`, **right‑click it → Extract All / Unzip**.
4. You now have a folder called **`fastaid-main`** (or `fastaid`). Remember where it is
   (e.g. your Downloads or Desktop).

### Option B — Use Git (only if you already have Git, or want to install it)
If you have Git, run:
```bash
git clone https://github.com/untamed-drazah/fastaid.git
```
(Don't have Git and don't want it? Use **Option A** above — it's the same result.)

---

## Step 2 — Open a terminal *inside* the project folder

A “terminal” (also called Command Prompt / PowerShell / Terminal) is where you type
commands. You need it to be pointing at the project folder.

### Windows
1. Open the project folder (`fastaid-main`) in **File Explorer**.
2. Click the **address bar** at the top (where the folder path is shown),
   type **`cmd`**, and press **Enter**.
   *(A black window opens, already inside the folder.)*

   *Alternative:* hold **Shift**, right‑click an empty area in the folder, and choose
   **“Open in Terminal”** or **“Open PowerShell window here.”**

### macOS
1. Open **Terminal** (press **Cmd + Space**, type `Terminal`, press Enter).
2. Type `cd ` (the word `cd` followed by a space), then **drag the project folder**
   from Finder onto the Terminal window and press **Enter**.

### Linux
- Right‑click the project folder → **“Open in Terminal”**, or open Terminal and
  `cd` into the folder.

✅ **Check you're in the right place:** type `dir` (Windows) or `ls` (macOS/Linux)
and press Enter. You should see files like `package.json`, `server.ts`, and `README.md`.

---

## Step 3 — (Optional) Add your free AI key

**You can skip this.** Without a key, FastAId runs in **offline mode** and still works —
it just uses built‑in guides instead of live AI.

To turn on the live AI features:

1. Get a **free** key from Google AI Studio: **https://aistudio.google.com/apikey**
   (sign in with a Google account → **Create API key** → copy it).
2. In your terminal (still inside the project folder), create your settings file by
   copying the example:
   - **Windows:** `copy .env.example .env`
   - **macOS/Linux:** `cp .env.example .env`
3. Open the new **`.env`** file in any text editor (Notepad works fine) and replace
   `MY_GEMINI_API_KEY` with the key you copied. Save the file. It should look like:
   ```
   GEMINI_API_KEY="paste-your-real-key-here"
   ```
   *(You can ignore the `APP_URL` line for local use.)*

> 🔒 Your `.env` file is private and is **never** uploaded to GitHub.

---

## Step 4 — Install the app's building blocks

In the terminal (inside the project folder), type:

```bash
npm install
```

Press Enter and **wait** — it downloads everything the app needs. This takes about
1–2 minutes the first time and prints a lot of text. When it finishes and you get your
cursor back, you're done. *(You only need to do this once.)*

---

## Step 5 — Run it! 🎉

```bash
npm run dev
```

Wait a few seconds until you see a message like:

```
Server running at http://localhost:3000
```

Now open your web browser (Chrome, Edge, Firefox, Safari…) and go to:

## 👉 http://localhost:3000

FastAId is live on your computer. To skip the sign‑up, click
**“Skip Registration & Bypass”** on the first screen.

---

## Starting and stopping

| I want to… | Do this |
|---|---|
| **Stop** the app | Click the terminal window and press **Ctrl + C** |
| **Run it again later** | Open the terminal in the project folder and run `npm run dev` again |
| **Update the AI key** | Edit the `.env` file, then stop (Ctrl+C) and re‑run `npm run dev` |

You do **not** need to run `npm install` again unless you download a fresh copy of the code.

---

## Troubleshooting

- **`node` or `npm` is not recognized / command not found**
  Node.js isn't installed correctly, or you didn't reopen the terminal. Redo **Step 0**,
  then close and reopen the terminal.

- **`npm run dev` says “address already in use” / port 3000 is busy**
  Something else is using port 3000. Run it on a different port instead:
  - **Windows (Command Prompt):** `set PORT=3001 && npm run dev`
  - **Windows (PowerShell):** `$env:PORT=3001; npm run dev`
  - **macOS/Linux:** `PORT=3001 npm run dev`

  Then open **http://localhost:3001** instead.

- **The AI parts don't respond / it says “offline”**
  That's expected if you skipped **Step 3** or the key is invalid. The app still works in
  offline mode. Double‑check your key in `.env`, then stop and re‑run `npm run dev`.

- **“It's not working!”**
  Make sure your terminal is **inside the project folder** (Step 2) — you should see
  `package.json` when you list the files. Then re‑run `npm install`, then `npm run dev`.

---

## What's under the hood (for the curious)

- **Frontend:** React + Vite + Tailwind CSS, with Three.js for the 3D overlays.
- **Backend:** a small Express server (`server.ts`) that talks to Google Gemini.
- **Offline mode:** if there's no valid `GEMINI_API_KEY`, the app serves built‑in
  first‑aid guides so it always works.
- **Available commands:** `npm run dev` (run), `npm run build` (make a production build),
  `npm start` (run the production build), `npm run lint` (type‑check).

---

> ⚠️ **Disclaimer:** FastAId is an educational training reference. It does **not** replace
> professional medical care. In a real emergency, call your local emergency number
> immediately (e.g. **999 / 112** in Kenya, **911** in the US).
