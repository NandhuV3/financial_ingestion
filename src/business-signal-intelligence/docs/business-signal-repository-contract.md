# Business Signal Repository Contract

## 1. Purpose

This document defines the future repository boundary for Business Signal Intelligence.

It is documentation only.

It does not implement:

* repositories
* file IO
* persistence
* caching
* storage services
* commands
* builders
* generated artifacts

---

## 2. Repository Responsibility

The Business Signal Repository owns persistence operations for Business Signal artifacts.

Responsibilities:

* load current signals
* load historical versions
* persist new versions
* check existence
* list available versions

The repository owns storage interaction.

Builders do not own storage.

Quarter Understanding does not own storage.

Owner Questions does not own storage.

Dashboards do not own storage.

---

## 3. Future Repository Interface

Future interface shape:

```ts
interface BusinessSignalRepository {
  loadCurrent(
    ticker: string
  ): Promise<BusinessSignalArtifact | null>;

  loadVersion(
    ticker: string,
    version: number
  ): Promise<BusinessSignalArtifact | null>;

  save(
    ticker: string,
    artifact: BusinessSignalArtifact
  ): Promise<void>;

  exists(
    ticker: string
  ): Promise<boolean>;

  listVersions(
    ticker: string
  ): Promise<number[]>;
}
```

This phase does not create TypeScript files.

This interface is documentation only.

---

## 4. Repository Ownership Rules

Repository may:

* read storage
* write storage
* discover versions
* validate existence

Repository may not:

* detect signals
* classify signals
* prioritize signals
* generate confidence
* modify lineage
* perform business intelligence
* explain signals

Repository persists artifacts.

Repository does not create intelligence.

---

## 5. Current Version Rules

loadCurrent() must read:

```text id="z7c6s9"
business-signals/current.json
```

Consumers should not determine latest versions themselves.

Consumers should use repository abstractions.

---

## 6. Historical Version Rules

loadVersion() must read:

```text id="n4kr2h"
archive/{version}.json
```

Historical versions are immutable.

Historical versions are never modified.

Historical versions are never regenerated in-place.

---

## 7. Save Rules

Future save behavior:

```text id="7m5g1x"
1. Validate artifact
2. Determine next version
3. Write archive version
4. Verify archive write
5. Replace current.json atomically
```

Repository owns write safety.

Callers do not implement write safety.

---

## 8. Existence Rules

exists() determines whether Business Signals exist for a company.

Consumers must not inspect storage paths directly.

Repository abstracts storage discovery.

---

## 9. Version Listing Rules

listVersions() returns:

```text id="z9w7l3"
oldest → newest
```

Version discovery belongs in repository.

Consumers must not scan archive folders directly.

---

## 10. Future Schema Version Support

Reserve future support for:

```text id="l5v8q1"
business-signals/
  v1/
  v2/
```

This phase does not implement schema-version directories.

The convention is reserved only.

---

## 11. Error Handling Principles

Missing artifacts:

```text id="u2s9d4"
return null
```

Invalid artifacts:

```text id="p4x7j6"
throw descriptive error
```

Repository errors should identify:

* company
* artifact type
* operation

Errors should remain auditable.

---

## 12. Repository Principles

### Single Storage Boundary

All Business Signal storage access flows through repositories.

### Storage Isolation

Consumers do not know physical paths.

### Immutable History

Archive versions remain immutable.

### Stable Current Access

Current signals are accessed through loadCurrent().

### Auditability

Repositories preserve version history.

### Separation Of Concerns

Builders create artifacts.

Repositories persist artifacts.

---

## 13. Future Consumers

Potential future consumers:

* Quarter Understanding Intelligence
* Owner Questions Intelligence
* Dashboard Systems
* Journal Systems
* Historical Analysis Systems

These consumers read Business Signals.

They do not own Business Signal persistence.

---

## 14. Non Goals

This phase does not define:

* repository implementation
* storage services
* file IO
* caching
* locking
* concurrency
* cloud storage
* databases
* APIs
* builders
* prompts

This document defines repository boundaries only.
