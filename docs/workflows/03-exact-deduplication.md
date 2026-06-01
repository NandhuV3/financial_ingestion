## Purpose
Remove obvious duplicate content.

## Why It Exists
SEC filings often repeat content.

## Input

- management-discussion.txt
- risk-factors.txt

## Output

- *.deduped.txt
-deduplication-report.json

## Responsibilities

- Remove exact duplicate lines
- Remove repeated headings
- Preserve ordering

## Manual Validation

```bash
npm run dedupe:sections -- MSFT
```

## Questions To Ask

- How many duplicates were removed?
- What qualifies as a duplicate?

## Common Problems

- Duplicate paragraphs
- Repeated section headers