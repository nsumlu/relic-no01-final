# RELIC No.01 — final website

Static, dependency-free website for RELIC No.01, a collectible sculptural table light concept by PAS Creative Studio.

- `index.html` — home
- `object/relic-01/index.html` — product page
- `css/style.css`, `js/main.js` — no build step
- `assets/` — supplied RELIC images (webp), trimmed films (mp4) and a temporary object-sheet PDF

## Run locally
    python3 -m http.server 8000

## Before launch
- Set `ENQUIRY_EMAIL` at the top of `js/main.js` (it is never shown to visitors).
- Replace `assets/relic-no01-object-sheet.pdf` with the real object sheet.
- The approved anatomy and material boards contain baked-in wording about manufacturing methods that is not yet confirmed; replace them once corrected boards exist.
