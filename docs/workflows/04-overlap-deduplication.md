## Purpose
Remove containment and overlap duplication.

## Why It Exists

## Inline XBRL often renders:
- Large Paragraph
- Small Fragment

Both contain same information.

## Input
*.deduped.txt

## Output
*.overlap-deduped.txt
overlap-deduplication-report.json

## Responsibilities
- Remove contained paragraphs
- Remove overlap fragments

## Manual Validation

```bash
npm run dedupe:overlap -- MSFT
```

## Questions To Ask

- Why did file size reduce?
- How many fragments were removed?

## Common Problems

- Aggressive removal
- Missed containment