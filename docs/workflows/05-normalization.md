## Purpose
Convert noisy text into AI-ready text.

## Why It Exists

## SEC filings contain:
Unicode issues
Spacing issues
Formatting artifacts

## Input
*.overlap-deduped.txt

## Output
normalized/*.cleaned.txt

## Responsibilities

- Normalize whitespace
- Normalize quotes
- Remove artifacts

## Manual Validation

```bash
npm run normalize:sections -- MSFT
```

## Questions To Ask

- Is content readable?
- Were artifacts removed?