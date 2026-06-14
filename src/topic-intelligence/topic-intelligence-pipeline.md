# Topic Intelligence Pipeline

This document records the required orchestration path for Topic Intelligence.

## Required Flow

```text
themes.json
  ↓
generate-topic-embeddings.ts
  ↓
data/registry/topic-embeddings.json
  ↓
generate-theme-embedding.ts
  ↓
theme-embeddings.json
  ↓
match-topics.ts
  ↓
semantic-topic-matches.json
  ↓
generate-topic-assignments.ts
  ↓
themes.with-topics.json
  ↓
generate-topic-evolution-report.ts
  ↓
topic-evolution-report.json
```

## Scripts

```text
npm run generate:topic-embeddings
npm run generate:topic-matches -- <ticker> <filing-date>
npm run generate:topic-assignments -- <ticker> <filing-date>
npm run generate:topic-evolution -- <ticker>
```

## Artifact Contract

| Stage | Producer | Required Inputs | Output |
|---|---|---|---|
| Topic Embeddings | `src/topic-intelligence/generate-topic-embeddings.ts` | `data/registry/topics.json` | `data/registry/topic-embeddings.json` |
| Theme Embeddings | `src/topic-intelligence/generate-theme-embedding.ts` | `intelligence/themes.json` | `intelligence/theme-embeddings.json` |
| Semantic Topic Matches | `src/topic-intelligence/match-topics.ts` | `topic-embeddings.json`, `theme-embeddings.json` | `intelligence/semantic-topic-matches.json` |
| Topic Assignments | `src/topic-assignment-v2/generate-topic-assignments.ts` | `themes.json`, `semantic-topic-matches.json` | `intelligence/themes.with-topics.json` |
| Topic Evolution | `src/topic-evolution/generate-topic-evolution-report.ts` | filing metadata, `themes.with-topics.json` across filings | `reports/topic-evolution-report.json` |

## Reliability Rules

- Topic Assignment must not run when `semantic-topic-matches.json` is missing.
- Topic Evolution must not run when any filing is missing `themes.with-topics.json`.
- Topic Evolution must not write a report when no `assigned` or `low_confidence` topics exist across the input filings.
- Missing prerequisite artifacts are orchestration failures, not valid empty intelligence.
