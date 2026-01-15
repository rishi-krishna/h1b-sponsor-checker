# H1B Sponsor Checker (Chrome Extension)

## What this is
A lightweight Chrome extension that checks whether a company has H1B sponsorship records and shows top roles. It works entirely client-side and reads from a local JSON index bundled with the extension.

## How to run
1. Open Chrome and go to `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select `h1b-extension`.

## Update data
- Use the script in `scripts/build_dol_index.py` to generate `data/h1b_index.json` from DOL LCA data (details in `scripts/README.md`).
- Reload the extension in `chrome://extensions` after updating the JSON.

## Notes
- The extension does not fetch data from GitHub or any remote host.
