# Platform Object Catalog

Status: LOCKED

---

# 1. Purpose

This document defines every durable platform object.

It is the canonical inventory of all persisted objects within the platform.

Every object listed here has

* a single owner
* a single producer
* a defined lifecycle
* a defined contract
* a defined persistence model

If an object is not listed here,

it is **not** a platform object.

---

# 2. Platform Object Model

The platform contains three classes of objects.

```text
Platform Objects

├── Intelligence Artifacts
├── Governance Artifacts
└── Operational Records
```

Every persisted object belongs to exactly one class.

---

# 3. Intelligence Artifacts

Intelligence Artifacts represent business understanding produced by the intelligence pipeline.

Characteristics

* versioned
* persisted
* downstream consumable
* lineage tracked
* evidence backed

---

| Artifact                | Produced By                     | Primary Consumers                                              | Versioned | Persisted |
| ----------------------- | ------------------------------- | -------------------------------------------------------------- | --------- | --------- |
| Themes                  | Themes Builder                  | Topic Assignment, Structured Intelligence                      | ✅         | ✅         |
| Structured Intelligence | Structured Intelligence Builder | Company Knowledge Candidate, Quarter Change                    | ✅         | ✅         |
| Company Knowledge       | Governance Promotion            | Business Signals, Quarter Understanding, Investor Intelligence | ✅         | ✅         |
| Quarter Change          | Quarter Change Builder          | Business Signals                                               | ✅         | ✅         |
| Business Signals        | Business Signals Builder        | Quarter Understanding, Investor Intelligence                   | ✅         | ✅         |
| Trust Signals           | Trust Signals Builder           | Quarter Understanding, Investor Intelligence                   | ✅         | ✅         |
| Quarter Understanding   | Quarter Understanding Builder   | Investor Intelligence                                          | ✅         | ✅         |
| Investor Intelligence   | Investor Intelligence Builder   | Partner Domain                                                 | ✅         | ✅         |

---

# 4. Governance Artifacts

Governance Artifacts manage quality, promotion, approval, and auditability.

Characteristics

* versioned
* persisted
* audit focused
* governance owned

---

| Artifact                    | Produced By                         | Purpose                            |
| --------------------------- | ----------------------------------- | ---------------------------------- |
| Filing Artifact             | Filing Builder                      | Canonical filing representation    |
| Evidence Identity           | Evidence Builder                    | Stable evidence addressing         |
| Themes Quality              | Themes Quality Builder              | Structural quality assessment      |
| Company Knowledge Candidate | Company Knowledge Candidate Builder | Proposed Company Knowledge updates |
| Governance Decision         | Governance Builder                  | Promotion decision                 |
| Review Queue Entry          | Governance Builder                  | Manual review workflow             |
| Human Review Decision       | Human Reviewer                      | Manual governance decision         |
| Rollback Approval           | Governance                          | Controlled rollback authorization  |

---

# 5. Trust Artifacts

Trust Artifacts accumulate longitudinal evidence.

Characteristics

* versioned
* persisted
* deterministic
* evidence based

---

| Artifact                    | Produced By                | Purpose                     |
| --------------------------- | -------------------------- | --------------------------- |
| Commitment Tracking         | Commitment Builder         | Commitment lifecycle        |
| Narrative Consistency       | Narrative Builder          | Narrative stability         |
| Accounting Stability        | Accounting Builder         | Accounting behavior         |
| Capital Allocation Tracking | Capital Allocation Builder | Capital deployment behavior |

These artifacts are consumed by Trust Signals.

---

# 6. Operational Records

Operational Records capture execution history.

They are not intelligence.

They are not downstream business inputs.

Characteristics

* immutable
* append only
* operational

Examples

* raw SEC filing
* ingestion logs
* execution logs
* builder execution history
* prompt execution history
* retry records
* audit events

Operational Records support observability and auditing.

---

# 7. Ownership Rules

Every platform object has

* exactly one producer
* exactly one owning layer
* exactly one contract

Objects may have many consumers.

Objects never have multiple owners.

---

# 8. Versioning Rules

Every Intelligence Artifact

* is versioned
* retains history
* supports lineage

Every Governance Artifact

* is versioned
* auditable
* immutable

Operational Records are append-only.

---

# 9. Persistence Rules

Platform Objects are durable.

Builders may use temporary working data during execution.

Temporary working data is **not** a Platform Object.

Only completed platform objects are persisted.

---

# 10. Consumption Rules

Artifacts may only be consumed according to Layer Ownership.

Downstream layers consume upstream artifacts.

Upstream layers never consume downstream artifacts.

No layer may bypass the architecture.

---

# 11. Object Lifecycle

Every Platform Object follows the same lifecycle.

```text
Created

↓

Validated

↓

Persisted

↓

Versioned

↓

Consumed

↓

Archived
```

Objects are never modified in place.

Changes produce new versions.

---

# 12. Lineage

Every Platform Object records

* producer
* inputs
* timestamp
* version
* lineage
* schema version

LLM artifacts additionally record

* prompt version
* prompt contract version
* model version

---

# 13. Success Criteria

The Platform Object Catalog is complete when

* every persisted object is listed
* every object has exactly one owner
* every object has one producing Builder
* every object belongs to exactly one object class
* every object has a governing specification

This document is the authoritative inventory of all durable objects in the platform.

All future platform objects must be added here before implementation.
