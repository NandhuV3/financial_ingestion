## Purpose
Generate structured intelligence from chunks.

## Why It Exists
Convert raw filing text into actionable insights.

## Input
chunks/*.json

## Output
intelligence/themes.json

## Responsibilities

- Extract themes
- Attach evidence
- Produce structured output

## Manual Validation

```bash
cat themes.json
```

## Questions To Ask

- Does theme match evidence?
- Are chunk references valid?

## Common Problems

- Hallucinated themes
- Weak evidence coverage