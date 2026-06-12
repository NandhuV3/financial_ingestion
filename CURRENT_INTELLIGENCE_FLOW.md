# Current Intelligence Flow

Generated: 2026-06-10

Scope: repository audit of the current implementation. This document describes what exists in code today. It does not propose new architecture.

## Summary

The current repository has two different levels of maturity:

1. Filing-level intelligence pipeline is script-reachable and currently runs through SEC ingestion, section processing, chunking, theme generation, topic assignment/evolution, quarter changes, investor insights, narratives, identity/profile generation, and health dashboard enrichment.
2. Newer warehouse-backed layers exist for Company Knowledge, Business Signals, and Quarter Understanding, but they are not wired into `package.json` scripts or the existing high-level filing pipeline.

The highest-level pipeline currently reachable from `package.json` is:

```text
npm run pipeline:filing -- <ticker> [filingDate]
```

That pipeline currently runs:

```text
Pre-AI filing processing
  ↓
Theme generation with cache decision
```

It does not currently invoke Company Identity, Company Profile, Company Knowledge, Business Signals, or Quarter Understanding.

## Package Scripts That Invoke These Layers

### Company Identity

```json
"identity:company": "tsx src/company-identity/build-company-identity.ts",
"identity:company:evidence": "tsx src/company-identity/build-company-identity.ts",
"identity:company:enrich": "tsx src/company-identity/enrichment/enrich-company-identity.ts"
```

### Company Profile

```json
"enrich:company-profile": "tsx src/company-profile/enrichment/enrich-company-profile.ts"
```

There is no direct `package.json` script for `src/company-profile/build-company-profile-intelligence.ts`, although the file has a CLI `main()` and can be run directly with `tsx`.

### Company Knowledge

No `package.json` script currently invokes:

```text
src/company-knowledge/generate-company-knowledge.ts
```

### Business Signals

No `package.json` script currently invokes:

```text
src/business-signal-intelligence/generate-business-signals.ts
```

### Quarter Understanding

No `package.json` script currently invokes:

```text
src/quarter-understanding-intelligence/generate-quarter-understanding.ts
```

## Highest-Level Pipeline Currently Present

### `npm run pipeline -- <ticker>`

Entrypoint:

```text
src/pipeline/run-company.ts
```

Actual flow:

```text
SEC ingestion
  ↓
Boundary extraction
  ↓
Section deduplication
  ↓
Overlap deduplication
  ↓
Section normalization
  ↓
Section chunking
  ↓
Theme generation
```

This pipeline uses latest SEC ingestion and does not run the newer identity/profile/knowledge/signal/understanding layers.

### `npm run pipeline:filing -- <ticker> [filingDate]`

Entrypoint:

```text
src/pipeline/pipeline-filing.ts
```

Actual flow:

```text
pipeline:pre-ai
  ↓
pipeline:themes
```

Expanded flow:

```text
Boundary extraction
  ↓
Section exploration
  ↓
Section deduplication
  ↓
Overlap deduplication
  ↓
Section normalization
  ↓
Section chunking
  ↓
Artifact freshness report
  ↓
Company filing report
  ↓
Theme cache decision
  ↓
Theme generation if needed
  ↓
Chunk hash metadata
  ↓
Theme generation report
  ↓
Artifact freshness report
  ↓
Company filing report
```

This is the highest-level current filing pipeline. It does not continue into Company Identity, Company Profile, Company Knowledge, Business Signals, or Quarter Understanding.

## 1. Company Identity

### Entrypoints

Package scripts:

```text
npm run identity:company -- <ticker> [filingDate]
npm run identity:company:evidence -- <ticker> [filingDate]
npm run identity:company:enrich -- <ticker>
```

Code entrypoints:

```text
src/company-identity/build-company-identity.ts
src/company-identity/enrichment/enrich-company-identity.ts
```

### Builder

Evidence builder:

```text
buildCompanyIdentityEvidenceForFiling(ticker, filingDate?)
buildCompanyIdentityEvidence(artifacts)
```

Defined in:

```text
src/company-identity/build-company-identity.ts
```

The evidence builder loads structured artifacts for a resolved filing and writes evidence.

### Repository

There is no repository abstraction for Company Identity.

Identity persistence is direct file IO through:

```text
writeJsonFile(...)
readJsonFile(...)
fileExists(...)
```

Accessors are provided by:

```text
src/company-identity/company-identity-accessors.ts
```

### Command

There is no separate thin command layer matching the newer builder/repository/command pattern.

Current command-like modules are:

```text
src/company-identity/build-company-identity.ts
src/company-identity/enrichment/enrich-company-identity.ts
```

### Who Calls It?

Direct callers:

- `package.json` scripts listed above
- `src/company-identity/enrichment/enrich-company-identity.ts` calls `buildCompanyIdentityEvidenceForFiling(...)` if evidence is missing
- `src/partner-domain/build-partner-intelligence.ts` reads identity through `readCompanyIdentityIntelligence(ticker)`

### Inputs Consumed

Loaded from the resolved filing:

- `metadata/filing.json`
- `intelligence/themes.json`
- `intelligence/themes.with-topics.json`
- `insights/investor-insight.json`
- `narratives/investor-narrative.json`
- `comparison/quarter-change-report.json`
- company-level `reports/topic-evolution-report.json`

### Artifacts Produced

Evidence:

```text
data/{ticker}/company-identity/company-identity.evidence.json
```

Enriched identity:

```text
data/{ticker}/company-identity/company-identity.enriched.json
data/{ticker}/company-identity/company-identity.json
```

Enrichment report:

```text
data/{ticker}/company-identity/company-identity-enrichment-report.json
```

### Storage Location

Company Identity uses `data/{ticker}/company-identity/`.

### Reachable From Existing Pipeline?

Not from `pipeline`, `pipeline:filing`, `pipeline:pre-ai`, or `pipeline:themes`.

It is reachable from dedicated `identity:*` package scripts and is read by Partner Domain aggregation when the Partner API is called.

## 2. Company Profile

### Entrypoints

Package script:

```text
npm run enrich:company-profile -- <ticker>
```

Code entrypoints:

```text
src/company-profile/build-company-profile-intelligence.ts
src/company-profile/enrichment/enrich-company-profile.ts
```

`build-company-profile-intelligence.ts` has a CLI `main()`, but no direct `package.json` script.

### Builder

Raw profile builder:

```text
buildCompanyProfileIntelligence(artifacts)
buildCompanyProfileIntelligenceForFiling(ticker, filingDate?)
```

Defined in:

```text
src/company-profile/build-company-profile-intelligence.ts
```

### Repository

There is no repository abstraction for Company Profile.

Profile persistence is direct file IO through:

```text
writeJsonFile(...)
readJsonFile(...)
fileExists(...)
```

Read/write helpers:

```text
readCompanyProfileIntelligence(ticker)
writeCompanyProfileIntelligence(ticker, profile)
writeCompanyProfileRaw(ticker, profile)
```

### Command

There is no separate thin command layer.

Current command-like module:

```text
src/company-profile/enrichment/enrich-company-profile.ts
```

Important current behavior:

- `enrichCompanyProfile(ticker)` reads or builds the raw profile.
- It writes an enrichment report.
- It intentionally skips enrichment because Company Identity owns business understanding.

### Who Calls It?

Direct callers:

- `npm run enrich:company-profile -- <ticker>`
- `src/partner-domain/build-partner-intelligence.ts` reads profile via `readCompanyProfileIntelligence(ticker)`
- If no profile exists, Partner Domain builds an in-memory raw profile via `buildCompanyProfileIntelligence(artifactsWithoutProfile)`

### Inputs Consumed

For raw profile generation:

- `metadata/filing.json`
- `intelligence/themes.json`
- `intelligence/themes.with-topics.json`
- `insights/investor-insight.json`
- `narratives/investor-narrative.json`
- `comparison/quarter-change-report.json`
- company-level `reports/topic-evolution-report.json`

### Artifacts Produced

Raw profile:

```text
data/{ticker}/company-profile/company-profile.raw.json
data/{ticker}/company-profile/company-profile.json
```

Enriched profile, when present from earlier phases:

```text
data/{ticker}/company-profile/company-profile.enriched.json
```

Enrichment report:

```text
data/{ticker}/company-profile/company-profile-enrichment-report.json
```

### Storage Location

Company Profile uses `data/{ticker}/company-profile/`.

### Reachable From Existing Pipeline?

Not from `pipeline`, `pipeline:filing`, `pipeline:pre-ai`, or `pipeline:themes`.

It is reachable from `enrich:company-profile` and is read or built in memory by Partner Domain aggregation when the Partner API is called.

## 3. Company Knowledge

### Entrypoint

No package script currently invokes Company Knowledge.

Code entrypoint:

```text
src/company-knowledge/generate-company-knowledge.ts
```

### Builder

```text
buildCompanyKnowledge(inputs)
```

Defined in:

```text
src/company-knowledge/build-company-knowledge.ts
```

### Repository

Repository interface and file implementation:

```text
CompanyKnowledgeRepository
FileCompanyKnowledgeRepository
```

Defined in:

```text
src/company-knowledge/company-knowledge.repository.ts
```

### Command

Thin orchestration command:

```text
generateCompanyKnowledge(params)
```

Defined in:

```text
src/company-knowledge/generate-company-knowledge.ts
```

The command:

1. Calls `buildCompanyKnowledge(...)`
2. Calls `repository.save(ticker, knowledge)`
3. Returns the artifact

It accepts already-loaded inputs and does not load files itself.

### Who Calls It?

Current callers found:

- Tests

No source pipeline or package script currently calls `generateCompanyKnowledge(...)`.

### Inputs Consumed

The command accepts already-loaded inputs:

- `CompanyIdentityEnriched | null`
- `CompanyProfileIntelligence | null`
- `FilingMetadata | null`
- optional `derivedFrom`
- `CompanyKnowledgeRepository`

The builder consumes the same in-memory data.

### Artifact Produced

```text
CompanyKnowledge
```

Fields include:

- `business_description`
- `business_model`
- `products`
- `customers`
- `revenue_drivers`
- `competitive_positioning`
- `operating_model`
- `key_dependencies`
- `confidence`
- `metadata`
- `lineage`

### Storage Location

When persisted through `FileCompanyKnowledgeRepository`:

```text
warehouse/
  companies/
    {ticker}/
      company-knowledge/
        current.json
        archive/
          {version}.json
```

No `warehouse/` directory currently exists in the audited working tree.

### Reachable From Existing Pipeline?

No.

The builder, repository, and command exist and are test-covered, but no current package script or high-level pipeline invokes them.

## 4. Business Signals

### Entrypoint

No package script currently invokes Business Signals.

Code entrypoint:

```text
src/business-signal-intelligence/generate-business-signals.ts
```

### Builder

```text
buildBusinessSignals(inputs)
```

Defined in:

```text
src/business-signal-intelligence/build-business-signals.ts
```

### Repository

Repository interface and file implementation:

```text
BusinessSignalRepository
FileBusinessSignalRepository
```

Defined in:

```text
src/business-signal-intelligence/business-signal.repository.ts
```

### Command

Thin orchestration command:

```text
generateBusinessSignals(params)
```

Defined in:

```text
src/business-signal-intelligence/generate-business-signals.ts
```

The command:

1. Calls `buildBusinessSignals(...)`
2. Calls `repository.save(ticker, reportingPeriod, artifact)`
3. Returns the artifact

It accepts already-loaded inputs and does not load files itself.

### Who Calls It?

Current callers found:

- Tests

No source pipeline or package script currently calls `generateBusinessSignals(...)`.

### Inputs Consumed

The command accepts:

- `ticker`
- `reportingPeriod`
- `CompanyKnowledge | null`
- `FilingMetadata | null`
- optional `derivedFrom`
- `BusinessSignalRepository`

The builder generates signals from `CompanyKnowledge` fields:

- `revenue_drivers`
- `competitive_positioning`
- `key_dependencies`
- `operating_model`
- `products`
- `customers`

### Artifact Produced

```text
BusinessSignalArtifact
```

Fields include:

- `company`
- `period`
- `signals`
- `metadata`
- `lineage`

Each signal includes deterministic evidence sourced from Company Knowledge.

### Storage Location

When persisted through `FileBusinessSignalRepository`:

```text
warehouse/
  companies/
    {ticker}/
      business-signals/
        {reportingPeriod}/
          current.json
          archive/
            {version}.json
```

No `warehouse/` directory currently exists in the audited working tree.

### Reachable From Existing Pipeline?

No.

The builder, repository, and command exist and are test-covered, but no current package script or high-level pipeline invokes them.

## 5. Quarter Understanding

### Entrypoint

No package script currently invokes Quarter Understanding.

Code entrypoint:

```text
src/quarter-understanding-intelligence/generate-quarter-understanding.ts
```

### Builder

```text
buildQuarterUnderstanding(inputs)
```

Defined in:

```text
src/quarter-understanding-intelligence/build-quarter-understanding.ts
```

### Repository

Repository interface and file implementation:

```text
QuarterUnderstandingRepository
FileQuarterUnderstandingRepository
```

Defined in:

```text
src/quarter-understanding-intelligence/quarter-understanding.repository.ts
```

### Command

Thin orchestration command:

```text
generateQuarterUnderstanding(params)
```

Defined in:

```text
src/quarter-understanding-intelligence/generate-quarter-understanding.ts
```

The command:

1. Calls `buildQuarterUnderstanding(...)`
2. Calls `repository.save(ticker, reportingPeriod, artifact)`
3. Returns the artifact

It accepts already-loaded inputs and does not load files itself.

### Who Calls It?

Current callers found:

- Tests

No source pipeline or package script currently calls `generateQuarterUnderstanding(...)`.

### Inputs Consumed

The command accepts:

- `ticker`
- `reportingPeriod`
- `CompanyKnowledge`
- `BusinessSignalArtifact`
- `QuarterUnderstandingReasoningOutput`
- `QuarterUnderstandingRepository`
- optional `derivedFrom`

The builder consumes:

- Company Knowledge
- Business Signal Artifact
- LLM reasoning output already supplied by caller
- reporting period

The builder does not call an LLM and does not load reasoning output from storage.

### Artifact Produced

```text
QuarterUnderstandingArtifact
```

Fields include:

- `company`
- `period`
- `understandings`
- `metadata`
- `lineage`

Each understanding includes:

- deterministic `understanding_id`
- `semantic_anchor_key`
- `business_key`
- evidence references resolved from Business Signal IDs
- deterministic confidence

### Storage Location

When persisted through `FileQuarterUnderstandingRepository`:

```text
warehouse/
  companies/
    {ticker}/
      quarter-understanding/
        {reportingPeriod}/
          current.json
          archive/
            {version}.json
```

No `warehouse/` directory currently exists in the audited working tree.

### Reachable From Existing Pipeline?

No.

The builder, repository, and command exist and are test-covered, but no current package script or high-level pipeline invokes them.

## Partner API Consumption

The Partner API currently builds a frontend-facing aggregate from existing `data/` artifacts, not from the newer warehouse layers.

Entrypoint:

```text
src/api/server.ts
```

Partner aggregate builder:

```text
src/partner-domain/build-partner-intelligence.ts
```

Current source loading includes:

- filing metadata
- themes
- themes with topics
- investor insight
- investor narrative
- quarter change report
- topic evolution report
- company profile
- company identity
- enriched health dashboard

Current source loading does not include:

- Company Knowledge from `warehouse/`
- Business Signals from `warehouse/`
- Quarter Understanding from `warehouse/`

## Actual Flow Diagram

The current implemented and script-reachable intelligence flow is:

```text
SEC Filing
  ↓
SEC ingestion
  ↓
Filing metadata / raw filing artifacts
  ↓
Boundary extraction
  ↓
Section exploration
  ↓
Section deduplication
  ↓
Overlap deduplication
  ↓
Section normalization
  ↓
Chunk generation
  ↓
Theme generation
  ↓
themes.json
```

Additional script-reachable layers can be run manually after supporting artifacts exist:

```text
themes.json / themes.with-topics.json / insights / narratives / quarter changes / topic evolution
  ↓
Company Identity Evidence
  ↓
Company Identity Enrichment
  ↓
company-identity.enriched.json
```

```text
themes.json / themes.with-topics.json / insights / narratives / quarter changes / topic evolution
  ↓
Company Profile Raw
  ↓
company-profile.raw.json
```

The newer in-memory/warehouse-backed flow exists in code but is not wired to a package script or high-level pipeline:

```text
Company Identity + Company Profile + Filing Metadata
  ↓
buildCompanyKnowledge(...)
  ↓
generateCompanyKnowledge(...)
  ↓
warehouse/companies/{ticker}/company-knowledge/current.json
  ↓
buildBusinessSignals(...)
  ↓
generateBusinessSignals(...)
  ↓
warehouse/companies/{ticker}/business-signals/{reportingPeriod}/current.json
  ↓
LLM reasoning output supplied by caller
  ↓
buildQuarterUnderstanding(...)
  ↓
generateQuarterUnderstanding(...)
  ↓
warehouse/companies/{ticker}/quarter-understanding/{reportingPeriod}/current.json
```

## Reachability Matrix

| Layer | Builder Exists | Repository Exists | Command Exists | Package Script Exists | Called By Existing High-Level Pipeline |
|---|---:|---:|---:|---:|---:|
| Company Identity | Yes | No | Partial / module CLI | Yes | No |
| Company Profile | Yes | No | Partial / enrichment CLI | Yes, enrichment only | No |
| Company Knowledge | Yes | Yes | Yes | No | No |
| Business Signals | Yes | Yes | Yes | No | No |
| Quarter Understanding | Yes | Yes | Yes | No | No |

## Current End State

The current end-to-end pipeline does not yet reach Quarter Understanding.

The current highest-level script-reachable pipeline ends at Theme generation and filing reports. Company Identity and Company Profile are separately script-reachable and are consumed by Partner Domain when the Partner API builds a response. Company Knowledge, Business Signals, and Quarter Understanding are implemented as in-memory builders plus repositories plus thin commands, but they currently require an external caller to load inputs, instantiate repositories, and invoke commands.
