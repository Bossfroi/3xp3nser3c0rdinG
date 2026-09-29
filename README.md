# Multi-account double-entry ledger

Static frontend (index.html, style.css, app.js) + Vercel functions in /api. Data lives in `db.json` in your GitHub repo; every save is one commit.

## GitHub read → sha → update → commit flow
1. `GET /repos/{owner}/{repo}/contents/{path}?ref={branch}` returns base64 content and a `sha`.
2. The server decodes and returns parsed JSON to the browser (the sha stays server-side).
3. On each save, the server re-fetches the current `sha`, base64-encodes the new JSON, and calls `PUT` on the same URL with `{message, content, sha, branch}`.
4. GitHub accepts only if `sha` matches the current file. Success creates a commit. On `409`, the server re-reads the sha and retries once, then asks the user to reload.

## Setup
1. Create a GitHub repo, push these files (including `db.json`).
2. Create a fine-grained PAT: only this repo, **Contents: Read and write**.
3. Import the repo in Vercel (no build command, no framework preset).
4. Add env vars (see `.env.example`): GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH (e.g. `main`), GITHUB_FILE_PATH (`db.json`), APP_USERNAME, APP_PASSWORD, SESSION_SECRET (`openssl rand -hex 32`).
5. Deploy, open the site, sign in.

Notes: the session cookie is HMAC-signed, HttpOnly, Secure, and lasts 12 hours. Locally, use `vercel dev` (cookies are Secure, so use HTTPS or a Vercel preview URL).

## Accounting model
- One calculation module (`accounting.js`) feeds balances, cards, charts, Trial Balance, Income Statement, Balance Sheet and the ledger.
- Opening balances are journal entries against the locked "Opening Balance Equity" account. Old `openingBalance` fields are converted on load.
- The server (`lib/validate.js`) rejects saves with invalid entries or unequal total debits and credits.
- The integrity panel reports discrepancies and never forces totals to match.

## Normal balances (one definition: `normalBalance()` in accounting.js)
Asset, Expense: debit. Liability, Equity, Income: credit. Display balance = normal side minus opposite side; the Trial Balance keeps raw debit/credit columns.
A warning appears only when the raw balance sits on the opposite side of the account's normal balance, and it lists the entries responsible.
The app never rewrites entries. If an entry was posted the wrong way round, use the "Swap Dr/Cr" button in the warning (asks for confirmation) or edit the entry.
Run the accounting tests with `npm test`.
