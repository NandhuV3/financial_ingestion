# Business Signal Storage Contract

## 1. Purpose

This document defines the future storage architecture for Business Signal Intelligence.

It is documentation only.

It does not implement:

* repositories
* file IO
* persistence
* commands
* builders
* storage services
* catalogs
* generated artifacts

---

## 2. Storage Purpose

Business Signal Intelligence stores observable business signals.

Signals represent:

* changes
* movement
* emphasis
* acceleration
* deceleration
* emerging conditions
* weakening conditions

Business Signals are:

* company-scoped
* period-aware
* versioned
* auditable

Business Signals are not:

* Company Knowledge
* Quarter Understanding
* Narratives
* Recommendations
* Owner Questions

---

## 3. Storage Scope

Unlike Company Knowledge, Business Signals are period-scoped.

Company Knowledge represents durable understanding.

Business Signals represent observations tied to a reporting period.

Examples:

```text
MSFT
  2026-Q1 Signals

MSFT
  2026-Q2 Signals
```

Both artifacts may exist simultaneously.

Neither replaces the other.

---

## 4. Official Storage Layout

Approved future layout:

```text
warehouse/
  companies/
    {ticker}/
      business-signals/
        current.json
        archive/
          1.json
          2.json
          3.json
```

current.json represents the latest signal artifact.

archive contains immutable historical versions.

---

## 5. Ownership

Future writers:

* Business Signal Builder
* Future Signal Enrichment

Future readers:

* Quarter Understanding
* Owner Questions
* Dashboard Systems
* Journal Systems

Consumers may read.

Consumers may not mutate.

---

## 6. Versioning Rules

Version numbering:

```text
1
2
3
...
```

Rules:

* monotonic
* never reused
* never decremented

Archive filenames:

```text
archive/1.json
archive/2.json
archive/3.json
```

Timestamps must not be used as identifiers.

---

## 7. Write Safety Contract

Required future write sequence:

```text
1. Generate artifact
2. Validate artifact
3. Write archive version
4. Verify archive write
5. Atomically replace current.json
```

current.json must never be modified in-place.

Archive write occurs first.

---

## 8. Regeneration Contract

Artifacts contain:

* schema_version
* pipeline_version
* model_version
* prompt_version
* input_hash

Regeneration rules:

```text
Same input_hash
    → Skip

Different input_hash
    → Regenerate
```

---

## 9. Archive Rules

Archive entries are:

* immutable
* self-contained
* independently readable

Archive entries are never:

* patched
* merged
* overwritten

Full snapshots only.

No diff storage.

---

## 10. Relationship To Company Knowledge

Company Knowledge:

```text
Durable Business Understanding
```

Business Signals:

```text
Period-Specific Observations
```

Signals may reference Company Knowledge.

Signals do not modify Company Knowledge.

---

## 11. Future Time Travel

Not implemented now.

Archive history enables future:

* signal evolution
* signal persistence
* signal emergence tracking
* signal disappearance tracking

No APIs are defined in this phase.

---

## 12. Future Catalog Requirement

Future requirement:

```text
catalog/index.json
```

Purpose:

* discovery
* coverage tracking
* regeneration planning

Not implemented in this phase.

---

## 13. Storage Principles

### Stable Read Path

current.json provides latest signals.

### Immutable History

Archive is permanent.

### Auditability

Signals remain traceable.

### Reproducibility

Signals can be regenerated.

### Atomic Writes

Current state replacement must be atomic.

### Observation Preservation

Signals preserve observations.

They do not preserve narratives.

---

## 14. Non Goals

This phase does not define:

* repositories
* builders
* commands
* storage services
* file IO
* APIs
* catalogs
* dashboards
* owner questions

This document defines storage architecture only.
