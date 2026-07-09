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
- **Photo areas** (hero background, "why choose us", coverage map) render as
  brand-gradient blocks. Drop in real photography by giving those elements a
  `background-image` in `styles.css`.
- Internal links (`services.html`, `contact.html`, etc.) point to the sibling
  pages from the same design project, ready to be implemented next.
