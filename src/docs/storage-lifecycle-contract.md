# Production Storage Lifecycle Contract

This document defines production storage ownership for the financial intelligence pipeline.

This is a design contract only. It does not remove folders, delete artifacts, change runtime behavior, or change package scripts.

## Storage Tiers

### Tier 1: Permanent Production Artifacts

Preserve these in production because they are externally sourced, expensive to regenerate, LLM-generated, business-facing, or required for auditability.

### Tier 2: Cached/Rebuildable Artifacts

These can be regenerated from Tier 1 artifacts and deterministic code. They may be retained for performance, reproducibility checks, and operational convenience.

### Tier 3: Development Debug Artifacts

These are deterministic intermediate outputs used for pipeline inspection, troubleshooting, and development diagnostics. They are useful locally but should not be required in the future production read path.

## Artifact Ownership Audit

| Artifact Path | Producing Module | Upstream Dependencies | Rebuild Cost | Uses LLM? | Deterministic? | Storage Tier |
|---|---|---|---|---|---|---|
| `filings/{date}/raw/filings.json` | `src/ingestion/sec-ingestion.ts`, `src/ingestion/historical-sec-ingestion.ts` | SEC submissions API | High: external SEC fetch | No | No, external source may change | Tier 1 |
| `filings/{date}/raw/latest-10q-index.html` | `src/ingestion/sec-ingestion.ts`, `src/ingestion/historical-sec-ingestion.ts` | SEC filing index URL | High: external SEC fetch | No | No, external source may change | Tier 1 |
| `filings/{date}/raw/latest-10q.html` | `src/ingestion/sec-ingestion.ts`, `src/ingestion/historical-sec-ingestion.ts` | SEC filing document URL | High: external SEC fetch | No | No, external source may change | Tier 1 |
| `filings/{date}/metadata/filing.json` | `src/ingestion/sec-ingestion.ts`, `src/ingestion/historical-sec-ingestion.ts` | SEC metadata and company config | Medium: derived from external filing discovery | No | Mostly deterministic after raw inputs are fixed | Tier 1 |
| `filings/{date}/metadata/pipeline.json` | `src/ingestion/sec-ingestion.ts`, `src/ingestion/historical-sec-ingestion.ts` | Filing metadata, ingestion runtime | Low | No | Partially; includes generation timestamp | Tier 1 |
| `filings/{date}/metadata/chunk-hash.json` | `src/pipeline/theme-generation-cache.ts` | `chunks/*.json` | Low | No | Yes except timestamp | Tier 2 |
| `filings/{date}/processed/management-discussion.txt` | `src/extraction/extract-boundaries.ts` | `raw/latest-10q.html` | Medium: deterministic parse over large filing text | No | Yes | Tier 3 |
| `filings/{date}/processed/risk-factors.txt` | `src/extraction/extract-boundaries.ts` | `raw/latest-10q.html` | Medium | No | Yes | Tier 3 |
| `filings/{date}/processed/extraction-diagnostics.json` | `src/extraction/extract-boundaries.ts` | `raw/latest-10q.html` | Medium | No | Yes | Tier 3 |
| `filings/{date}/processed/section-headings.json` | `src/extraction/extract-sections.ts` | `raw/latest-10q.html` | Medium | No | Yes | Tier 3 |
| `filings/{date}/processed/*.deduped.txt` | `src/processing/deduplicate-sections.ts` | `processed/*.txt` | Low | No | Yes | Tier 3 |
| `filings/{date}/processed/deduplication-report.json` | `src/processing/deduplicate-sections.ts` | `processed/*.txt` | Low | No | Yes | Tier 3 |
| `filings/{date}/processed/*.overlap-deduped.txt` | `src/processing/deduplicate-overlap.ts` | `processed/*.deduped.txt` | Low | No | Yes | Tier 3 |
| `filings/{date}/processed/overlap-deduplication-report.json` | `src/processing/deduplicate-overlap.ts` | `processed/*.deduped.txt` | Low | No | Yes | Tier 3 |
| `filings/{date}/normalized/*.cleaned.txt` | `src/processing/normalize-sections.ts` | `processed/*.overlap-deduped.txt` or `processed/*.deduped.txt` | Low | No | Yes | Tier 3 |
| `filings/{date}/chunks/*.chunks.json` | `src/processing/chunk-sections.ts` | `normalized/*.cleaned.txt` | Low to medium | No | Yes | Tier 2 |
| `filings/{date}/intelligence/themes.json` | `src/themes/generate-themes.ts` | `chunks/*.json`, OpenAI model | High: LLM call | Yes | No | Tier 1 |
| `filings/{date}/intelligence/theme-embeddings.json` | `src/topic-intelligence/generate-theme-embedding.ts` | `themes.json`, embedding model | Medium: embedding call | Yes | No | Tier 2 |
| `filings/{date}/intelligence/semantic-topic-matches.json` | `src/topic-intelligence/match-topics.ts` | `theme-embeddings.json`, `data/registry/topic-embeddings.json` | Medium | No additional LLM if embeddings exist | Yes after embeddings are fixed | Tier 2 |
| `filings/{date}/intelligence/themes.with-topics.json` | `src/topic-assignment-v2/build-topic-assignments.ts` | `themes.json`, `semantic-topic-matches.json` | Low | No | Yes | Tier 1 |
| `filings/{date}/comparison/quarter-change-report.json` | `src/change-engine/generate-quarter-change-report.ts` | Current and previous `themes.json`, optional `themes.with-topics.json` | Low | No | Yes | Tier 1 |
| `filings/{date}/comparison/quarter-change-report.md` | `src/change-engine/generate-quarter-change-report.ts` | `quarter-change-report.json` | Low | No | Yes | Tier 1 |
| `companies/{ticker}/reports/topic-evolution-report.json` | `src/topic-evolution/generate-topic-evolution-report.ts` | Filing metadata and `themes.with-topics.json` across filings | Medium | No | Yes | Tier 1 |
| `companies/{ticker}/reports/topic-evolution-report.md` | `src/topic-evolution/generate-topic-evolution-report.ts` | `topic-evolution-report.json` | Low | No | Yes | Tier 1 |
| `filings/{date}/intelligence/structured-intelligence.prompt.txt` | `src/structured-intelligence/generate-structured-intelligence.ts` | Filing metadata, themes, topics, quarter changes, topic evolution | Low | No | Yes | Tier 1 |
| `filings/{date}/intelligence/structured-intelligence.raw.json` | `src/structured-intelligence/generate-structured-intelligence.ts` | LLM response | High: LLM call | Yes | No | Tier 1 |
| `filings/{date}/intelligence/structured-intelligence.json` | `src/structured-intelligence/generate-structured-intelligence.ts` and repository | Validated LLM output and source artifacts | High: LLM call | Yes | No | Tier 1 |
| `filings/{date}/intelligence/structured-intelligence.report.json` | `src/structured-intelligence/generate-structured-intelligence.ts` | Structured Intelligence generation run | Low | No | Partially; includes duration and timestamp | Tier 1 |
| `filings/{date}/reports/artifact-freshness.json` | `src/reporting/check-artifact-freshness.ts` | Filing folder artifacts | Low | No | Partially; includes timestamp | Tier 1 |
| `filings/{date}/reports/theme-generation-report.json` | `src/pipeline/theme-generation-cache.ts` | Theme generation decision, chunk hash | Low | No | Partially; includes timestamp | Tier 1 |
| `filings/{date}/reports/token-estimate.json` | `src/reporting/estimate-tokens.ts` | `chunks/*.json` | Low | No | Partially; includes timestamp | Tier 3 |
| `filings/{date}/reports/pipeline-summary.json` | `src/reporting/generate-company-report.ts` | Processed, normalized, chunks, themes, freshness | Low | No | Partially; includes timestamp | Tier 1 |
| `filings/{date}/reports/company-report.md` | `src/reporting/generate-company-report.ts` | `pipeline-summary.json` inputs | Low | No | Partially; includes timestamp | Tier 1 |
| `companies/{ticker}/reports/historical-ingestion-report.json` | `src/ingestion/historical-sec-ingestion.ts` | SEC historical filing discovery | Medium to high: external SEC fetch | No | No, external source may change | Tier 1 |
| `warehouse/companies/{ticker}/company-knowledge/current.json` | `src/company-knowledge/company-knowledge.repository.ts` via `generate-company-knowledge.ts` | Structured Intelligence, filing metadata | Low after Structured Intelligence exists | No | Yes | Tier 1 |
| `warehouse/companies/{ticker}/company-knowledge/archive/{version}.json` | `src/company-knowledge/company-knowledge.repository.ts` | Company Knowledge artifact | Low | No | Yes | Tier 1 |
| `warehouse/companies/{ticker}/business-signals/{period}/current.json` | `src/business-signal-intelligence/business-signal.repository.ts` via `generate-business-signals.ts` | Company Knowledge, filing metadata | Low | No | Yes | Tier 1 |
| `warehouse/companies/{ticker}/business-signals/{period}/archive/{version}.json` | `src/business-signal-intelligence/business-signal.repository.ts` | Business Signal artifact | Low | No | Yes | Tier 1 |
| `warehouse/companies/{ticker}/quarter-understanding/{period}/current.json` | `src/quarter-understanding-intelligence/quarter-understanding.repository.ts` via `generate-quarter-understanding.ts` | Company Knowledge, Business Signals, LLM reasoning output | High if reasoning output must be regenerated | Yes upstream | No if reasoning output is LLM-generated | Tier 1 |
| `warehouse/companies/{ticker}/quarter-understanding/{period}/archive/{version}.json` | `src/quarter-understanding-intelligence/quarter-understanding.repository.ts` | Quarter Understanding artifact | Low after artifact exists | No | Yes | Tier 1 |
| `src/harness/reports/{ticker}-harness-report.json` | `src/harness/run-harness.ts` | Structured Intelligence, Company Knowledge, Partner Domain, architecture checks | Low | No | Yes | Tier 3 |
| `validation-output/*.json` | `src/validation/validate-company-intelligence.ts` | Already loaded validation inputs and mock reasoning | Low | No | Yes | Tier 3 |

## Filing Folder Storage Contract

| Folder | Tier | Keep in Production | Regenerable | Notes |
|---|---|---:|---:|---|
| `raw/` | Tier 1 | Yes | Not reliably | Externally sourced SEC input. Preserve for audit, reproducibility, and recovery. |
| `metadata/` | Tier 1 | Yes | Partially | Filing metadata is required by downstream intelligence, lineage, and API responses. `chunk-hash.json` is a cache entry but currently lives here. |
| `processed/` | Tier 3 | No, future optional debug only | Yes | Deterministic extraction and dedupe outputs from raw filing text. Useful for debugging parser quality. |
| `normalized/` | Tier 3 | No, future optional debug only | Yes | Deterministic cleaned text from processed sections. Useful for inspecting preprocessing quality. |
| `chunks/` | Tier 2 | Optional | Yes | Deterministic chunk cache used for LLM theme generation. Keeping it reduces regeneration cost and supports prompt/audit review. |
| `intelligence/` | Tier 1 | Yes | Expensive or partially expensive | Contains LLM-generated themes, Structured Intelligence, topic assignment outputs, prompts, raw LLM output, and reports. |
| `comparison/` | Tier 1 | Yes | Yes, but business-facing | Quarter changes are deterministic but consumed by Structured Intelligence, Partner Domain, and owner-facing flows. Preserve as source intelligence. |
| `reports/` | Tier 1 | Yes | Mostly yes | Business-facing and operational audit outputs. Some reports include timestamps and runtime metrics. |

## Folder Purpose And Ownership

### `raw/`

Purpose: store externally sourced SEC filing discovery and filing document payloads.

Owner: ingestion modules.

Producing modules:

- `src/ingestion/sec-ingestion.ts`
- `src/ingestion/historical-sec-ingestion.ts`

Retention policy: permanent. Raw inputs are the replay and audit anchor for the filing pipeline.

Regeneration source: SEC endpoints. Because external responses may change or become unavailable, raw artifacts are not considered safely rebuildable.

Production recommendation: keep.

### `metadata/`

Purpose: store normalized filing metadata and pipeline metadata.

Owner: ingestion modules, with `chunk-hash.json` currently owned by the theme pipeline cache.

Producing modules:

- `src/ingestion/sec-ingestion.ts`
- `src/ingestion/historical-sec-ingestion.ts`
- `src/pipeline/theme-generation-cache.ts`

Retention policy: permanent for `filing.json` and `pipeline.json`; cache retention for `chunk-hash.json`.

Regeneration source: raw SEC artifacts and chunk artifacts.

Production recommendation: keep `filing.json` and `pipeline.json`. Consider moving `chunk-hash.json` into a cache namespace later.

### `processed/`

Purpose: store extracted, deduplicated, and overlap-deduplicated section text plus extraction diagnostics.

Owner: extraction and processing modules.

Producing modules:

- `src/extraction/extract-boundaries.ts`
- `src/extraction/extract-sections.ts`
- `src/processing/deduplicate-sections.ts`
- `src/processing/deduplicate-overlap.ts`

Retention policy: development/debug in future production.

Regeneration source: `raw/latest-10q.html`.

Production recommendation: do not require in future production read path. Preserve for now until regeneration tooling and audit requirements are finalized.

### `normalized/`

Purpose: store cleaned section text used as the input to chunking.

Owner: processing modules.

Producing module:

- `src/processing/normalize-sections.ts`

Retention policy: development/debug in future production.

Regeneration source: `processed/*.overlap-deduped.txt`, `processed/*.deduped.txt`, or `processed/*.txt`.

Production recommendation: do not require in future production read path. Preserve for now.

### `chunks/`

Purpose: store deterministic LLM input chunks produced from normalized filing text.

Owner: processing modules.

Producing module:

- `src/processing/chunk-sections.ts`

Retention policy: cache.

Regeneration source: `normalized/*.cleaned.txt`.

Production recommendation: optional production cache. Keep when LLM prompt reproducibility and regeneration speed matter.

### `intelligence/`

Purpose: store generated intelligence artifacts and LLM audit materials.

Owner: intelligence modules.

Producing modules:

- `src/themes/generate-themes.ts`
- `src/topic-intelligence/generate-theme-embedding.ts`
- `src/topic-intelligence/match-topics.ts`
- `src/topic-assignment-v2/build-topic-assignments.ts`
- `src/structured-intelligence/generate-structured-intelligence.ts`
- `src/structured-intelligence/structured-intelligence.repository.ts`

Retention policy: permanent for `themes.json`, `themes.with-topics.json`, `structured-intelligence.*`, and prompt/raw response/report artifacts. Cache retention for embeddings and semantic match artifacts.

Regeneration source: chunks, topic registry, embedding registry, deterministic assignment, and LLM calls.

Production recommendation: keep.

### `comparison/`

Purpose: store quarter-over-quarter change intelligence.

Owner: change engine.

Producing module:

- `src/change-engine/generate-quarter-change-report.ts`

Retention policy: permanent.

Regeneration source: current and prior filing `themes.json`, optional `themes.with-topics.json`.

Production recommendation: keep because it is downstream input to Structured Intelligence and Partner Domain.

### `reports/`

Purpose: store operational, business-facing, and audit reports for filing processing.

Owner: reporting and pipeline modules.

Producing modules:

- `src/reporting/check-artifact-freshness.ts`
- `src/pipeline/theme-generation-cache.ts`
- `src/reporting/estimate-tokens.ts`
- `src/reporting/generate-company-report.ts`

Retention policy: permanent for operational reports used to understand pipeline state. Debug-only reports may later move to a development namespace.

Regeneration source: current filing artifacts and runtime metadata.

Production recommendation: keep, but classify `token-estimate.json` as future cleanup candidate.

## Company-Level Storage Contract

| Folder | Tier | Keep in Production | Regenerable | Notes |
|---|---|---:|---:|---|
| `companies/{ticker}/reports/` | Tier 1 | Yes | Partially | Contains company-level historical ingestion and topic evolution reports. |
| `warehouse/companies/{ticker}/company-knowledge/` | Tier 1 | Yes | Yes, after Structured Intelligence exists | Durable normalized business understanding with version archive. |
| `warehouse/companies/{ticker}/business-signals/{period}/` | Tier 1 | Yes | Yes, after Company Knowledge exists | Durable signal artifact with version archive. |
| `warehouse/companies/{ticker}/quarter-understanding/{period}/` | Tier 1 | Yes | Expensive if LLM reasoning must be regenerated | Durable understanding artifact with version archive. |

## Retention Policy Summary

Tier 1 artifacts should be retained permanently in production unless a future migration provides a stronger replacement and a replay-safe archive strategy.

Tier 2 artifacts may be retained in production as caches. They can be deleted only when the regeneration source and deterministic code version are available.

Tier 3 artifacts should remain available in development and during pipeline hardening. They should not be required by long-term production readers once production rebuild commands exist.

## Future Cleanup Candidates

Do not delete these now. They are candidates for future cleanup once explicit production rebuild commands and retention policies are implemented.

| Artifact / Folder | Reason | Required Before Cleanup |
|---|---|---|
| `processed/*.txt` | Deterministic extraction intermediates from raw filing HTML. | Reliable production rebuild command from `raw/latest-10q.html`; extraction diagnostics retained elsewhere if required. |
| `processed/*.deduped.txt` | Deterministic dedupe intermediates. | Rebuild command and tests proving identical downstream chunks. |
| `processed/*.overlap-deduped.txt` | Deterministic overlap-dedupe intermediates. | Rebuild command and tests proving identical normalized text/chunks. |
| `processed/deduplication-report.json` | Debug/reporting artifact currently read by `generate-company-report.ts`. | Report generation updated to tolerate missing debug reports or regenerate on demand. |
| `processed/overlap-deduplication-report.json` | Debug/reporting artifact currently read by `generate-company-report.ts`. | Report generation updated to tolerate missing debug reports or regenerate on demand. |
| `processed/extraction-diagnostics.json` | Debug/quality artifact. | Decide whether extraction diagnostics are operational audit artifacts or development-only diagnostics. |
| `processed/section-headings.json` | Section exploration artifact with no confirmed downstream production dependency. | Confirm no production consumers and retain parser quality tests elsewhere. |
| `normalized/*.cleaned.txt` | Deterministic chunking input. | Rebuild command from processed/raw and tests proving chunk stability. |
| `chunks/*.chunks.json` | Deterministic cache, but useful for LLM reproducibility. | Keep unless prompt lineage stores enough input context to replay theme generation without chunks. |
| `metadata/chunk-hash.json` | Theme generation cache metadata. | Move to cache namespace or keep with cache lifecycle policy. |
| `intelligence/theme-embeddings.json` | Embedding cache. | Keep if embedding cost matters; otherwise rebuildable from `themes.json` and embedding model/version. |
| `intelligence/semantic-topic-matches.json` | Deterministic match output after embeddings exist. | Keep if audit of topic assignment decisions requires candidate scores; otherwise rebuildable. |
| `reports/token-estimate.json` | Development cost-estimation report. | Move to development reports or regenerate on demand. |
| `src/harness/reports/*.json` | Harness output for local evaluation. | CI/reporting decision on whether harness reports should live outside source tree. |
| `validation-output/*.json` | Manual validation output. | Move to temp/build output or ignore in production packaging. |

## Recommended Production Filing Layout

Future production layout should preserve permanent artifacts and treat caches/debug artifacts explicitly.

```text
filings/{date}/
├── raw/
├── metadata/
├── intelligence/
├── comparison/
├── reports/
```

Optional production cache:

```text
filings/{date}/
├── chunks/
```

Development-only / rebuildable debug artifacts:

```text
filings/{date}/
├── normalized/
├── processed/
```

Company-level production layout:

```text
companies/{ticker}/
├── reports/

warehouse/
└── companies/
    └── {ticker}/
        ├── company-knowledge/
        │   ├── current.json
        │   └── archive/
        ├── business-signals/
        │   └── {period}/
        │       ├── current.json
        │       └── archive/
        └── quarter-understanding/
            └── {period}/
                ├── current.json
                └── archive/
```

## Production Principles

- Raw SEC artifacts are the replay anchor.
- LLM outputs, prompts, raw responses, and validation reports are production audit artifacts.
- Deterministic intermediate text transforms are rebuildable and should not become long-term production dependencies.
- Cache artifacts must declare their regeneration source and code/model version assumptions.
- Business-facing and API-facing artifacts should have stable read paths.
- Archived durable artifacts should be immutable full snapshots.
- Cleanup must be introduced only after tests prove downstream artifacts can be regenerated without semantic drift.
