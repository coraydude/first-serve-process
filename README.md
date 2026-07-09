# First Serve Process Solutions — Website

Marketing site for a Florida process-serving company. Implemented from the
Claude Design project **"Florida Process Serving Website"** (`home.dc.html`).

## Structure

```
index.html          # Home page (implemented from home.dc.html)
assets/
  styles.css        # All styling — palette, layout, responsive breakpoints
  main.js           # Mobile nav toggle + quote-form handling
  favicon.svg       # "FS" mark
```

## Run locally

```bash
cd first-serve-process
python3 -m http.server 8000
# open http://localhost:8000
```

## Notes

- **Fonts:** Instrument Sans + Source Serif 4 (Google Fonts).
- **Palette:** navy `#0D2B52`, blue `#2E7BEA`, green `#2F9E44`.
- **Responsive:** single stylesheet, breakpoints at 1024 / 860 / 600px. The
  original design was desktop-only; the mobile layout and hamburger nav were
  added in this implementation.
- **Quote form** validates client-side and shows a confirmation state. Wire the
  `submit` handler in `assets/main.js` to your CRM/email endpoint before launch.
- **Photography** — the hero, "why choose us", and service-areas blocks use
  legal-themed photos from Unsplash, stored in `assets/img/`:
  - `hero-courthouse.jpg` — courthouse colonnade (hero background)
  - `signing-affidavit.jpg` — signing a legal document (why-choose)
  - `florida-skyline.jpg` — Miami skyline (service areas)
  Each `background-image` layers over a gradient fallback, so the layout still
  degrades gracefully if an image fails to load. Photos are free under the
  [Unsplash License](https://unsplash.com/license); swap them by replacing the
  files (keep the same names) or updating the `background-image` in `styles.css`.
- **Client portal** — the header's **Client Login** button links to
  ServeManager's built-in client-collaboration portal
  (`https://www.servemanager.com/login`), where invited clients see job
  status, service attempts, GPS-stamped attempts, and downloadable
  affidavits. Clients are invited from the company's ServeManager account
  (My Account → collaborators). No custom backend is needed; the account-wide
  ServeManager API key is never exposed. To later replace this with a fully
  white-labeled portal on your own domain, build a small backend that holds
  the API key server-side and proxies a per-client, read-only view of the
  ServeManager REST API (jobs + `attempts` with `lat`/`lng`/`gps_timestamp`).
