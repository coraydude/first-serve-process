# First Serve Intake Worker — Forms → ServeManager

This folder contains the relay that connects the website's forms (the homepage
"Start Your Serve" widget and the contact form) directly to ServeManager.
When it is deployed and wired up, a client fills out the form on
firstserveprocess.com, their documents upload, and a Job appears in your
ServeManager account with everything attached. No emails, no copy/paste.

## Why this exists

The website is static (GitHub Pages), and the ServeManager API uses a secret
key. If the browser talked to ServeManager directly, that key would be visible
to every visitor. This Worker is a tiny middleman that runs on Cloudflare's
free tier: the form posts to the Worker, the Worker holds the key as an
encrypted secret and talks to ServeManager.

```
Client fills form on firstserveprocess.com
        |  (fields + document files)
        v
Cloudflare Worker  (this folder; holds SERVEMANAGER_API_KEY as a secret)
        |  1. creates the Job          POST /api/jobs
        |  2. attaches each document   POST /api/jobs/{id}/documents_to_be_served + file upload
        v
ServeManager  (job appears in your queue with documents attached)
```

If the Worker or ServeManager is ever down, the website automatically falls
back to opening a prefilled email to hello@firstserveprocess.com, so a client
request is never lost.

## What you need before starting

1. **A ServeManager API key.**
   ServeManager → Settings → API → generate a key.
   If you don't see an API section, ask ServeManager support to enable API
   access on your plan.
2. **A free Cloudflare account.** You'll create one during step 2 below if
   you don't have one.
3. **Node.js installed** on your computer (you already have it).

## Deploy (about 10 minutes, one time)

Open Terminal and run these from this folder
(`cd ~/first-serve-process/intake-worker`):

```bash
# 1. Log in to Cloudflare (opens your browser; create the free account there)
npx wrangler login

# 2. Store the ServeManager API key as an encrypted secret (it will prompt you
#    to paste the key; it is never written to a file or committed to git)
npx wrangler secret put SERVEMANAGER_API_KEY

# 3. Deploy
npx wrangler deploy
```

Step 3 prints your Worker URL, something like:

```
https://first-serve-intake.<your-account>.workers.dev
```

## Wire the website to it

1. Open `assets/main.js` (one folder up, in the website).
2. Find this line near the top:
   ```js
   var INTAKE_API_URL = '';
   ```
3. Paste the Worker URL between the quotes:
   ```js
   var INTAKE_API_URL = 'https://first-serve-intake.<your-account>.workers.dev';
   ```
4. Commit and push (GitHub Pages redeploys automatically):
   ```bash
   cd ~/first-serve-process
   git add assets/main.js && git commit -m "wire intake worker" && git push
   ```

## Test it end to end

1. Wait ~2 minutes for GitHub Pages to rebuild, then hard refresh the site
   (Cmd+Shift+R).
2. On the homepage, drop a small test PDF into "Start Your Serve" and submit.
   The button should show "Sending to our dispatch system…" then
   "Received ✓ We are on it".
3. Check ServeManager: a new Job should be in your queue with the intake
   details in the service instructions and the PDF attached.
4. Do the same from the contact form with the fields filled in.

**If the button falls back to opening an email instead:** the Worker rejected
the request or ServeManager did. Check the Worker's logs:

```bash
npx wrangler tail
```

then submit the form again and read what prints. The most likely first-run
issue is a field-name mismatch with ServeManager's API response format. The
Worker code notes where it parses the upload URL
(`worker.js`, the `documents_to_be_served` section). Compare against
ServeManager's API docs at https://www.servemanager.com/api, or bring the
`wrangler tail` output back to Claude and it will be a quick fix.

## Security notes

- The API key exists only as a Cloudflare secret (`wrangler secret put`).
  Never paste it into any file in this repo, and never commit it.
- The Worker only accepts requests from firstserveprocess.com and the
  GitHub Pages domain (see `ALLOWED_ORIGINS` in `worker.js`). If you add a
  custom domain later, add it to that list and redeploy.
- Both website forms include a hidden honeypot field; bots that fill it get a
  fake success and nothing is created in ServeManager.
- Limits: 10 files per submission, 25MB per file (matches what the widget
  advertises).

## Changing things later

| What | Where |
|---|---|
| Turn direct sync off | Set `INTAKE_API_URL = ''` in `assets/main.js` (forms fall back to email) |
| Use ServeManager's hosted order form instead | Set `ORDER_FORM_URL` in `assets/main.js` |
| Rotate the API key | `npx wrangler secret put SERVEMANAGER_API_KEY` again, then `npx wrangler deploy` |
| Add a custom domain to allowed origins | Edit `ALLOWED_ORIGINS` in `worker.js`, then `npx wrangler deploy` |
| Watch live logs while testing | `npx wrangler tail` |

Priority order the site uses: `INTAKE_API_URL` (direct sync) →
`ORDER_FORM_URL` (hosted order form) → prefilled email fallback.
