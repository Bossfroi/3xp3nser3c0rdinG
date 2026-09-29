# Budget Book — GitHub-as-database, on Vercel

Static frontend (`index.html` / `style.css` / `app.js`) + two tiny serverless
API routes. Data lives in **`db.json` inside a GitHub repo**; every save is a
GitHub commit, so you get free version history. No database server, no ORM.

```
Browser  →  Vercel Serverless Function (/api/*)  →  GitHub REST API  →  db.json  →  Git commit
```

## Why this is safe to expose publicly

- The GitHub token only ever lives in a Vercel **environment variable**. It is
  read with `process.env.GITHUB_TOKEN` inside `/api` functions, which run on
  the server — it is never sent to, or readable from, the browser.
- The login page no longer contains a hardcoded username/password. Credentials
  are checked server-side in `/api/auth/login.js` against `APP_USERNAME` /
  `APP_PASSWORD` env vars, and a signed, `HttpOnly` cookie is set. `HttpOnly`
  means client-side JavaScript can't read the cookie either.
- `/api/data.js` refuses any request without a valid session cookie.

## How the GitHub Contents API flow works (requirement #10)

1. **GET the file + sha** — `GET /repos/{owner}/{repo}/contents/db.json?ref={branch}`
   returns the file's content **base64-encoded**, plus a `sha` field. That
   `sha` identifies the exact version of the file you just read.
2. **Decode + modify** — base64-decode the content, `JSON.parse` it, apply
   the change in memory.
3. **PUT the update** — `PUT /repos/{owner}/{repo}/contents/db.json` with a
   JSON body of `{ message, content, sha, branch }`, where `content` is the
   **new** data, base64-encoded again, and `sha` is the value from step 1.
   GitHub checks that `sha` still matches the file's current version before
   accepting the write.
4. **Commit created** — a successful PUT *is* a new commit on `branch`. Git
   history of `db.json` is simply the repo's commit history — visible on
   GitHub under that file's "History", no extra bookkeeping needed.
5. **Conflict (409)** — if someone/something else committed to `db.json`
   between your GET and your PUT, the `sha` you sent no longer matches, and
   GitHub returns `409`. `api/data.js` handles this by re-fetching the latest
   `sha` and retrying the write once; if it still conflicts, it tells the
   browser to reload before trying again. (This is a single-user app, so in
   practice this mostly protects against you having the app open in two tabs.)

All of this is implemented in `lib/github.js` (`getFile`, `updateFile`) and
called from `api/data.js`.

## Project layout

```
index.html, style.css, app.js   → the app (static files, served as-is)
api/auth/login.js               → POST { username, password } → sets session cookie
api/auth/logout.js              → POST → clears session cookie
api/data.js                     → GET  → current db.json contents
                                   PUT  → replace db.json contents (1 commit)
lib/github.js                   → GitHub Contents API calls (server-only)
lib/session.js                  → signed-cookie session helpers (server-only)
db.json                         → starting data — commit this to your repo
.env.example                    → names of the env vars you must set in Vercel
```

The frontend keeps the whole budget in memory as one JSON object and calls
`GET /api/data` once on load, then `PUT /api/data` with the *entire* object
every time something changes (add, edit, delete, pay a liability, etc.) — so
every action is its own commit, as you asked for. A **"Saving… / All changes
saved / Not saved"** indicator in the top bar shows the result of each save.

## Setup

### 1. Create the GitHub repo and token

1. Create (or reuse) a GitHub repo and push this project's files to it,
   **including `db.json`** at the repo root (or wherever you set
   `GITHUB_FILE_PATH`) — the API returns a 404 until that file exists on the
   branch you configure.
2. GitHub → **Settings → Developer settings → Personal access tokens →
   Fine-grained tokens → Generate new token**.
   - **Repository access:** "Only select repositories" → pick this repo.
   - **Permissions → Repository permissions → Contents: Read and write.**
     (No other permissions are needed.)
3. Copy the token — you'll paste it into Vercel next, not into any file.

> **If a token was ever pasted into a chat, doc, commit, or screenshot,
> treat it as compromised: revoke it on GitHub and generate a new one.**
> A token is a password; once it has been shown anywhere outside your own
> environment variables, it should not keep being used.

### 2. Deploy to Vercel

1. Import the GitHub repo in Vercel (or run `vercel` from this folder). No
   framework preset is needed — Vercel auto-detects the static files and the
   `/api` functions.
2. Vercel → Project → **Settings → Environment Variables**, add (see
   `.env.example` for the full list and format):

   | Name | Value |
   |---|---|
   | `GITHUB_TOKEN` | the fine-grained PAT you just generated |
   | `GITHUB_OWNER` | your GitHub username or org |
   | `GITHUB_REPO` | the repo name |
   | `GITHUB_BRANCH` | usually `main` |
   | `GITHUB_FILE_PATH` | usually `db.json` |
   | `APP_USERNAME` | the one username you'll log in with |
   | `APP_PASSWORD` | a strong password |
   | `SESSION_SECRET` | random string — generate with the command in `.env.example` |

3. Redeploy so the new env vars take effect.
4. Visit the deployed URL, sign in, and start adding entries. Check your
   GitHub repo's commit history — each save shows up as a commit to `db.json`.

## Error handling notes

- **Wrong login** → `401` from `/api/auth/login`, shown inline on the form.
- **Session expired** while using the app → the next save gets a `401`, the
  status pill shows an error, and you're returned to the login screen (no
  data is lost client-side — reload after signing in and your unsaved change
  will still be in the form if you re-enter it, but *already-saved* entries
  are safe since each one commits individually).
- **db.json missing from the repo** → `GET /api/data` returns `404` with a
  message telling you the path/repo/branch it looked for.
- **Concurrent edits (409)** → automatically retried once; if it still
  conflicts you're asked to reload before continuing.
- **Any other GitHub API failure** (bad token, rate limit, network) →
  surfaced as a `502` with GitHub's error message, shown in the save-status
  pill or login-screen error text.
