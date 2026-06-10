# Quarter Understanding Repository Contract

## 1. Purpose

The Quarter Understanding Repository is the persistence boundary for Quarter Understanding artifacts.

It owns:

* Loading Quarter Understanding artifacts
* Loading historical versions
* Persisting new versions
* Version discovery
* Existence checks

The repository owns storage interaction.

Builders do not own storage.

LLM execution does not own storage.

Prompts do not own storage.

Frontend applications do not own storage.

---

## 2. Repository Scope

Quarter Understanding artifacts are:

```text
Company + Reporting Period scoped
```

Examples:

```text
MSFT + 2026-Q1
AAPL + 2026-Q1
NVDA + 2026-Q1
```

The repository must treat each reporting period as an independent artifact.

Quarter Understanding is not a company-wide aggregate artifact.

---

## 3. Future Repository Interface

Future interface shape:

```ts
interface QuarterUnderstandingRepository {
  loadCurrent(
    ticker: string,
    reportingPeriod: string
  ): Promise<QuarterUnderstandingArtifact | null>;

  loadVersion(
    ticker: string,
    reportingPeriod: string,
    version: number
  ): Promise<QuarterUnderstandingArtifact | null>;

  save(
    ticker: string,
    reportingPeriod: string,
    artifact: QuarterUnderstandingArtifact
  ): Promise<void>;

  exists(
    ticker: string,
    reportingPeriod: string
  ): Promise<boolean>;

  listVersions(
    ticker: string,
    reportingPeriod: string
  ): Promise<number[]>;
}
```

This phase documents the interface only.

No implementation is created.

---

## 4. Storage Layout

Future storage convention:

```text
warehouse/
  companies/
    {ticker}/
      quarter-understanding/
        {period}/
          current.json
          archive/
            1.json
            2.json
            3.json
```

Example:

```text
warehouse/
  companies/
    MSFT/
      quarter-understanding/
        2026-Q1/
          current.json
          archive/
            1.json
            2.json
```

---

## 5. Current Artifact Rules

loadCurrent() reads:

```text
current.json
```

Consumers must not discover latest versions manually.

Consumers should use:

```text
loadCurrent()
```

---

## 6. Historical Version Rules

loadVersion() reads:

```text
archive/{version}.json
```

Historical versions are immutable.

Historical versions must never be modified.

---

## 7. Save Rules

Future save() behavior:

1. Validate artifact
2. Determine next version
3. Write archive version
4. Verify archive write
5. Atomically replace current.json

Repository owns write safety.

Callers must not implement write safety.

---

## 8. Version Discovery Rules

listVersions() returns:

```text
oldest -> newest
```

Examples:

```ts
[1, 2, 3, 4]
```

Consumers must not scan archive directories directly.

---

## 9. Existence Rules

exists() determines whether Quarter Understanding exists for:

```text
ticker + reporting period
```

Consumers must not probe storage paths directly.

---

## 10. Repository Ownership

Repository may:

* Read files
* Write files
* Discover versions
* Replace current artifacts
* Verify writes

Repository may not:

* Call LLMs
* Generate understandings
* Build confidence
* Generate semantic anchors
* Resolve evidence
* Modify lineage
* Modify metadata
* Recalculate hashes

Repositories persist artifacts.

Repositories do not generate intelligence.

---

## 11. Auditability Principles

Quarter Understanding history must remain:

* Reproducible
* Auditable
* Versioned
* Immutable

Repository design must support:

```text
Historical replay
Historical comparison
Pipeline evolution
Prompt evolution
Model evolution
```

---

## 12. Non Goals

This phase does not define:

* Repository implementation
* File IO details
* Database storage
* Cloud storage
* Caching
* Locking
* Concurrency
* API routes

This document defines repository ownership only.
