import argparse
import csv
import json
import re
from collections import defaultdict, Counter
from datetime import datetime


def normalize_name(value):
    if not value:
        return ""
    cleaned = value.upper()
    cleaned = re.sub(r"\b(LLC|INC|LTD|CO|CORP|CORPORATION|LIMITED)\b", "", cleaned)
    cleaned = re.sub(r"[^A-Z0-9 ]", " ", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


def extract_year(value):
    if not value:
        return None
    if isinstance(value, int):
        return value
    text = str(value).strip()
    if text.isdigit() and len(text) == 4:
        return int(text)
    match = re.search(r"(19|20)\d{2}", text)
    if match:
        return int(match.group(0))
    try:
        return datetime.fromisoformat(text).year
    except ValueError:
        return None


def build_index(
    csv_path,
    target_year,
    employer_column,
    title_column,
    date_column,
    year_column,
    visa_column,
    visa_class,
    max_roles,
):
    counts = defaultdict(int)
    company_names = {}
    role_counts = defaultdict(Counter)

    with open(csv_path, newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            employer = row.get(employer_column, "").strip()
            if not employer:
                continue

            if target_year:
                if year_column:
                    year_value = extract_year(row.get(year_column, ""))
                else:
                    year_value = extract_year(row.get(date_column, ""))

                if year_value != target_year:
                    continue

            if visa_column and visa_class:
                visa_value = (row.get(visa_column, "") or "").strip().upper()
                if visa_value != visa_class.upper():
                    continue

            normalized = normalize_name(employer)
            if not normalized:
                continue

            counts[normalized] += 1
            company_names[normalized] = employer.strip()

            title = row.get(title_column, "").strip()
            if title:
                role_counts[normalized][title] += 1

    index = {}
    for key, count in counts.items():
        roles = [role for role, _ in role_counts[key].most_common(max_roles)]
        index[key] = {
            "company": company_names.get(key, key.title()),
            "year": target_year,
            "count": count,
            "roles": roles,
        }

    return index


def main():
    parser = argparse.ArgumentParser(
        description="Build a compact H1B employer index from DOL LCA CSV data."
    )
    parser.add_argument("input_csv", help="Path to DOL LCA CSV file")
    parser.add_argument("output_json", help="Path to output JSON file")
    parser.add_argument(
        "--target-year",
        type=int,
        default=datetime.now().year,
        help="Year to filter by (default: current year). Use 0 to disable.",
    )
    parser.add_argument(
        "--employer-column",
        default="EMPLOYER_NAME",
        help="CSV column for employer name",
    )
    parser.add_argument(
        "--title-column",
        default="JOB_TITLE",
        help="CSV column for job title",
    )
    parser.add_argument(
        "--date-column",
        default="CASE_SUBMITTED",
        help="CSV column with a date string",
    )
    parser.add_argument(
        "--year-column",
        default="",
        help="CSV column with a year (optional, overrides date-column)",
    )
    parser.add_argument(
        "--visa-column",
        default="VISA_CLASS",
        help="CSV column for visa class",
    )
    parser.add_argument(
        "--visa-class",
        default="H-1B",
        help="Visa class filter (default: H-1B)",
    )
    parser.add_argument(
        "--max-roles",
        type=int,
        default=5,
        help="Max roles to include per employer",
    )

    args = parser.parse_args()
    index = build_index(
        args.input_csv,
        args.target_year or None,
        args.employer_column,
        args.title_column,
        args.date_column,
        args.year_column or None,
        args.visa_column,
        args.visa_class,
        args.max_roles,
    )

    with open(args.output_json, "w", encoding="utf-8") as handle:
        json.dump(index, handle, indent=2, ensure_ascii=True)

    print(f"Wrote {len(index)} employers to {args.output_json}")


if __name__ == "__main__":
    main()
