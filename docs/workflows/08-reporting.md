## Purpose
Provide operational visibility.

## Why It Exists
Engineers should not inspect 20 files manually.

## Input
Existing artifacts

## Output

- pipeline-summary.json
- company-report.md

## Responsibilities

- Surface metrics
- Surface health checks
- Summarize pipeline

## Manual Validation

```bash
npm run report:company -- MSFT
```

## Questions To Ask

- Is company healthy?
- Which stage failed?