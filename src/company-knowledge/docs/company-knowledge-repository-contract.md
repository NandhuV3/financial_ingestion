# Company Knowledge Repository Contract

This document defines the future repository boundary for Company Knowledge.

It is documentation only. It does not implement repository classes, file reads, file writes, persistence, storage services, filesystem access, caching, locking, commands, accessors, orchestration, API routes, builders, enrichment, or generated artifacts.

## 1. Repository Purpose

The Company Knowledge Repository is the future persistence boundary for Company Knowledge.

Responsibilities:

- Load current Company Knowledge.
- Load historical versions.
- Persist new versions.
- Check existence.
- List available versions.

The repository owns storage interaction.

Builders do not own storage.

Partner Domain does not own storage.

Frontend does not own storage.

Narratives do not own storage.

Owner Questions do not own storage.

---

## 2. Future Repository Interface

Future interface shape:

```ts
interface CompanyKnowledgeRepository {
  loadCurrent(ticker: string): Promise<CompanyKnowledge | null>;

  loadVersion(
    ticker: string,
    version: number
  ): Promise<CompanyKnowledge | null>;

  save(
    ticker: string,
    artifact: CompanyKnowledge
  ): Promise<void>;

  exists(ticker: string): Promise<boolean>;

  listVersions(ticker: string): Promise<number[]>;
}
```

This phase does not create TypeScript files.

This phase does not create implementation.

This interface is documented only.

---

## 3. Repository Ownership Rules

Repository may:

- Read storage.
- Write storage.
- List versions.
- Validate version existence.

Repository may not:

- Assemble Company Knowledge.
- Enrich Company Knowledge.
- Generate narratives.
- Compute confidence.
- Compute hashes.
- Modify lineage.
- Perform business intelligence.

Repository stores artifacts.

Repository does not create intelligence.

---

## 4. Current Version Rules

`loadCurrent()` must read:

```text
company-knowledge/current.json
```

Consumers should not discover latest versions manually.

Consumers should use `loadCurrent()`.

---

## 5. Historical Version Rules

`loadVersion()` must read:

```text
archive/{version}.json
```

Version lookup must be explicit.

Historical versions are immutable.

Historical versions are never modified.

---

## 6. Save Rules

Future `save()` behavior:

1. Validate artifact.
2. Determine next version.
3. Write archive version.
4. Verify archive write.
5. Replace current atomically.

Repository owns write safety.

Callers must not implement write safety.

---

## 7. Existence Rules

`exists()` returns whether Company Knowledge exists for a company.

This prevents consumers from probing storage paths directly.

---

## 8. Version Listing Rules

`listVersions()` returns all known versions.

Ordering:

```text
oldest -> newest
```

Version discovery belongs in repository.

Consumers must not scan archive directories.

---

## 9. Future Schema Version Paths

Reserve future support for:

```text
company-knowledge/
  v1/
  v2/
```

This phase does not implement schema-version directories.

This section only reserves the convention.

## 10. Non Goals

This phase does not define:

- Repository implementation.
- Storage services.
- File IO.
- Caching.
- Locks.
- Concurrency.
- Cloud storage.
- Databases.
- API endpoints.
- Orchestration.

---

## 11. Repository Principles

### Single Storage Boundary

All storage access flows through repository abstractions.

### Storage Isolation

Consumers should not know physical file locations.

### Immutable History

Historical versions remain immutable.

### Stable Current Access

Current Company Knowledge is accessed through `loadCurrent()`.

### Auditability

Repository preserves archive history.

### Separation Of Concerns

Builders create artifacts.

Repositories persist artifacts.

---

### 12. Repository Return Contract

Repository returns stored artifacts exactly as persisted.

Repository must not:

- enrich artifacts
- mutate artifacts
- recalculate confidence
- recalculate hashes
- repair lineage

Repository is storage-only.

Returned artifacts must match persisted artifacts.