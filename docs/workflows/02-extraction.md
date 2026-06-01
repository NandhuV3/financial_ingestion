## Purpose
Extract important sections from the SEC filing.

## Why It Exists
LLMs should not analyze entire filings.

## We first isolate:
- Management Discussion
- Risk Factors

## Input
raw/latest-10q.html

## Output
processed/

- management-discussion.txt
- risk-factors.txt
- extraction-diagnostics.json

## Responsibilities

- Find section boundaries
- Select best candidate section
- Produce diagnostics

## Manual Validation

```bash
npm run extract:boundaries -- MSFT
```

```bash
cat extraction-diagnostics.json
```

## Questions To Ask

- How many candidates were found?
- Why was candidate #9 selected?
- Is TOC being ignored?

## Common Problems
- Table of contents selected
- Section heading variations
- XBRL artifacts