# DOL Data Pipeline

This script builds a compact employer index JSON from the DOL LCA public CSV.

## Steps
1. Download the DOL LCA CSV file(s).
2. Run the script:

```bash
python scripts/build_dol_index.py path/to/lca_data.csv data/h1b_index.json --target-year 2024
```

## Column notes
Default columns:
- `EMPLOYER_NAME`
- `JOB_TITLE`
- `CASE_SUBMITTED`
- `VISA_CLASS` (filtered to `H-1B` by default)

If your CSV uses different names, pass overrides:

```bash
python scripts/build_dol_index.py lca.csv data/h1b_index.json --target-year 2024 --date-column CASE_RECEIVED_DATE
```

If your file has a year column instead of a date column:

```bash
python scripts/build_dol_index.py lca.csv data/h1b_index.json --target-year 2024 --year-column FY
```

To disable the year filter (include all years in the CSV):

```bash
python scripts/build_dol_index.py lca.csv data/h1b_index.json --target-year 0
```

If you want to disable or change the visa filter:

```bash
python scripts/build_dol_index.py lca.csv data/h1b_index.json --visa-class H-1B1
```

## Hosting
- Host `data/h1b_index.json` on GitHub Pages or any free static host.
- Set the Data URL in the extension settings page.
