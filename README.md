# H1B Sponsor Checker (Chrome Extension)

## What this is
A lightweight Chrome extension that checks whether a company sponsored H1B this year and shows top roles. It works entirely client-side and reads from a JSON index (local sample file by default).

## How to run
1. Open Chrome and go to `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select `h1b-extension`.

## Configure real data
- Host your DOL-derived JSON index on a free static host (e.g., GitHub Pages).
- Open the extension settings page and set the Data URL to your hosted JSON.
- Use the script in `scripts/build_dol_index.py` to generate the JSON (details in `scripts/README.md`).

## Notes
- The current `data/h1b_index.json` is a small sample only.
- You can clear the cache from the settings page if you update the hosted JSON.
