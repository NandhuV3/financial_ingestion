## Purpose
Split large documents into AI-sized units.

## Why It Exists
Sending entire filings to models is expensive.

## Input
normalized/*.cleaned.txt

## Output
chunks/*.chunks.json

## Responsibilities

- Create traceable chunks
- Preserve metadata
- Maintain evidence IDs

## Manual Validation

```bash
npm run chunk:sections -- MSFT
```

## Questions To Ask

- Why 34 chunks?
- Why chunk size ~2000 chars?

## Future Use Cases

- RAG
- Retrieval
- Search
- Evidence attribution