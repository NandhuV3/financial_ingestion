# Company Knowledge Storage Contract

This document defines the future storage architecture for Company Knowledge.

It is documentation only. It does not implement repositories, file reads, file writes, commands, accessors, services, persistence, catalogs, current artifacts, or archive artifacts.

## 1. Storage Purpose

Company Knowledge is company-scoped durable business understanding.

It is:

- Company-scoped.
- Versioned.
- Authoritative.
- Stored in Warehouse.
- Durable across filings.
- Not quarter-scoped.
- Not filing-scoped.

Company Knowledge represents what the platform knows about a company as a business: what it does, who it serves, how it makes money, how it operates, what advantages it has, and what dependencies matter.

Company Knowledge is different from filings because filings are source documents and filing-scoped artifacts.

Company Knowledge is different from signals because signals describe changes, risks, events, or directional observations.

Company Knowledge is different from narratives because narratives are presentation and explanation layers.

Company Knowledge is different from dashboards because dashboards summarize current state or owner-facing views.

---

## 2. Official Storage Layout

Approved future layout:

```text
warehouse/
  companies/
    {ticker}/
      company-knowledge/
        current.json
        archive/
          1.json
          2.json
          3.json
```

`current.json` is the stable read path.

Consumers should read `current.json` when they need the latest Company Knowledge artifact for a company.

`archive/` contains immutable historical versions.

Archive entries are never modified.

Archive entries are never deleted.

---

## 3. Storage Ownership

Future writers:

- Company Knowledge Builder.
- Future Company Knowledge Enrichment.

Systems that may not write Company Knowledge storage:

- Health Dashboard.
- Narratives.
- Owner Questions.
- Partner Domain.
- Frontend.

Consumers may read Company Knowledge artifacts but must never mutate them.

---

## 4. Versioning Rules

`knowledge_version` starts at:

```text
1
```

Version rules:

- Versions increment monotonically.
- Versions never decrease.
- Version numbers are never reused.
- Each persisted version maps to exactly one archive file.

Archive naming:

```text
archive/
  1.json
  2.json
  3.json
```

Timestamps must not be used as version identifiers.

Reason:

- Numeric versions are stable.
- Numeric versions make ordering explicit.
- Numeric versions avoid ambiguity caused by clock skew, retries, or regenerated artifacts.
- Numeric versions make deterministic regeneration and audit review simpler.

---

## 5. Write Safety Contract

Required future write sequence:

1. Generate artifact.
2. Validate artifact.
3. Write `archive/{version}.json`.
4. Verify archive file.
5. Replace `current.json` atomically.

`current.json` must never be edited in place.

Archive is written first.

Crashes must not corrupt current state.

If a crash occurs before `current.json` is replaced, the previous `current.json` must remain readable.

If a crash occurs after archive write but before current replacement, recovery can compare archive and current state.

---

## 6. Regeneration Contract

Company Knowledge artifacts carry `input_hash`.

Regeneration rules:

- Identical `input_hash` means skip regeneration.
- Changed `input_hash` means create a new version.

Version and compatibility fields:

- `schema_version`
- `pipeline_version`
- `model_version`
- `prompt_version`

Purpose:

- Determine whether schema changes require regeneration.
- Determine whether pipeline changes require regeneration.
- Determine whether model upgrades require regeneration.
- Determine whether prompt upgrades require regeneration.
- Preserve deterministic auditability across rebuilds.

---

## 7. Archive Contract

Archive rules:

- Full snapshots only.
- No diffs.
- No patch files.
- Every version must be self-contained.
- Every version must be independently readable.

Archive entries must remain complete because future readers should not need to reconstruct a version by replaying patches, reading current state, or loading other archive entries.

Complete snapshots make recovery, audit review, time travel, and debugging simpler.

---

## 8. Future Time Travel Support

Time travel is not implemented now.

However, `archive/` exists specifically so future phases can reconstruct historical Company Knowledge states.

This document does not design APIs.

This document does not design queries.

It only reserves immutable archive storage as the foundation for future time travel.

---

## 9. Catalog Requirement

Future requirement:

```text
catalog/index.json
```

Purpose:

- Company discovery.
- Artifact coverage.
- Regeneration planning.

Catalog is not implemented in Phase 5.4.6.

---

## 10. Non Goals

This phase does not define:

- Repositories.
- Accessors.
- Storage services.
- File IO.
- Persistence implementation.
- Catalog implementation.
- Time-travel APIs.
- Multi-company intelligence.

---

## 11. Storage Principles

### Stable Read Path

`current.json` is the stable read path for latest Company Knowledge.

### Immutable History

Archive entries are immutable and retained.

### Company Scoped Ownership

Company Knowledge is stored by company, not by filing or quarter.

### Deterministic Regeneration

Input hashes and version metadata determine whether regeneration is needed.

### Atomic Writes

Future writes must replace `current.json` atomically after archive verification.

### Full Snapshot Archive

Every archive entry is a complete Company Knowledge artifact.

### Auditability Before Optimization

Storage favors traceability, recovery, and auditability over compactness or premature optimization.

---

## 12. Future Schema Version Paths

Major breaking schema versions may introduce:

company-knowledge/
  v1/
    current.json
    archive/
  v2/
    current.json
    archive/

    