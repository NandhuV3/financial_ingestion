# First Period Handling Specification

Status: LOCKED

# 1. Purpose

This document defines the platform-wide standard for handling situations where historical artifacts do not yet exist.

It provides one canonical definition of:

- First Filing
- First Artifact
- Missing Dependency

Every longitudinal layer must follow this contract.

No layer may invent its own first-period behavior.

This document exists to ensure deterministic behavior, auditability, and consistent downstream interpretation across the platform.

---

# 2. Why This Contract Exists

Many platform layers compare information across time.

Examples include:

Examples include:

- Topic Evolution
- Quarter Change
- Trust Pillars
    - Commitment Tracking
    - Narrative Consistency
    - Accounting Stability
    - Capital Allocation Tracking
- Trust Signals
- Quarter Understanding
- Investor Intelligence

Without a shared contract, every layer would implement different logic for missing historical data.

That would create inconsistent behavior across the platform.

This document prevents that.

---

# 3. Golden Rules

## Rule 1

First period is a valid business state.

It is never an error.

---

## Rule 2

Missing history is different from missing data.

A company being processed for the first time is expected.

A missing artifact due to processing failure is not.

---

## Rule 3

Every layer must produce deterministic outputs even when history is unavailable.

No layer may silently skip execution.

---

## Rule 4

Downstream layers must never guess historical state.

Only upstream artifacts define historical availability.

---

## Rule 5

All first-period states must be explicitly represented inside artifacts.

Nothing is implied.

---

# 4. Canonical States

The platform recognizes exactly three historical availability states.

---

## State A — First Filing

Definition

The company has never been processed before.

No historical platform artifacts exist.

Example

```
Microsoft

2026 Q1

↓

First filing ever processed
```

Characteristics

- expected
- valid
- deterministic

Not an error.

---

## State B — First Artifact

Definition

The company has historical platform data.

However, this specific artifact has never existed.

Example

```
Company Knowledge

exists

↓

Topic Evolution

does not yet exist
```

Reasons may include

- newly introduced architecture layer

- migrated platform

- artifact added after deployment

This is also valid.

---

## State C — Missing Dependency

Definition

A required upstream artifact should exist but cannot be found.

Examples

- build failure

- archive corruption

- governance rollback

- processing interruption

Example

```
Quarter Change

requires previous Structured Intelligence

↓

previous artifact missing
```

This is NOT first period.

This represents dependency unavailability.

---

# 5. Canonical Artifact Representation

Every artifact that performs temporal comparison across historical periods must expose historical availability explicitly.

Example

```json
{
  "history_state": "...",
  "reason": "...",
  "requires_previous_period": true,
  "comparison_performed": false
}
```

history_state values

```
FIRST_FILING
FIRST_ARTIFACT
DEPENDENCY_MISSING
HISTORY_AVAILABLE
```

No additional values may be introduced.

---

# 6. Standard Reason Vocabulary

When comparison cannot occur, artifacts must provide one typed reason.

Allowed reasons

```
FIRST_FILING

FIRST_ARTIFACT

PREVIOUS_ARTIFACT_NOT_FOUND

PREVIOUS_ARTIFACT_FAILED

PREVIOUS_ARTIFACT_REJECTED

DEPENDENCY_NOT_AVAILABLE
```

Reason vocabulary is platform-governed.

---

# 7. Layer Behaviour

## Topic Evolution

Requires

Historical Topic Assignment Artifacts.

Each consumed Topic Assignment must preserve the Topic Registry version recorded during Topic Assignment.

Topic Evolution evaluates historical Topic Assignment artifacts only.

It never regenerates Topic Assignment.

If unavailable

Produces

```
history_state

FIRST_FILING
```

No longitudinal Topic behavior is inferred.

No historical Topic Assignment is fabricated.

Replay behavior remains deterministic.

No evolution signals.

No error.

---

## Platform Intelligence Boundary

First-period handling applies only after required upstream artifacts have been successfully produced.

If Platform Intelligence has not produced the required Topic Assignment artifacts, this represents:

DEPENDENCY_MISSING

It must never be treated as FIRST_FILING.

## Quarter Change

Requires

Previous Structured Intelligence.

If unavailable

Produces

```
comparison_performed

false
```

No delta signals.

Never invents baseline comparisons.

---

## Commitment Tracking

Requires

Previous Commitment Tracking artifact.

If unavailable

Every commitment begins lifecycle as

```
OPEN
```

No historical fulfillment calculations occur.

---

## Narrative Consistency

Requires

Previous Narrative Consistency artifact.

If unavailable

No language comparison occurs.

Only current-period observations are stored.

---

## Accounting Stability

Requires

Previous Accounting Stability artifact.

If unavailable

No accounting change signals are generated.

Current accounting structure becomes baseline.

---

## Capital Allocation Tracking

Requires

Previous Capital Allocation artifact.

If unavailable

Observed allocation becomes baseline.

No consistency gaps produced.

---

## Trust Signals

Requires

Trust Pillars.

If pillars report

```
FIRST_FILING
```

Trust Signals do not infer trust.

Instead

```
status

INSUFFICIENT_HISTORY
```

is produced.

---

## Quarter Understanding

Consumes

Business Signals

Trust Signals

Company Knowledge

Quarter Understanding never interprets missing history.

Instead it reports

```
Longitudinal interpretation unavailable.

Reason:

First Filing.
```

---

## Investor Intelligence

Investor Intelligence never fabricates historical conclusions.

Q3

returns

```
Historical trust evidence unavailable.
```

Q5

returns

```
Ownership change conditions unavailable until historical observations exist.
```

Confidence is reduced accordingly.

---

# 8. Downstream Rules

Consumers must distinguish

```
FIRST_FILING

≠

DEPENDENCY_MISSING
```

These states have different meanings.

First Filing

means

history legitimately does not exist.

Dependency Missing

means

history should exist but cannot be loaded.

Downstream behavior must differ accordingly.

---

# 9. Confidence Rules

First Filing

↓

reduces longitudinal confidence

but does not reduce filing confidence.

Example

Q1

can still have

HIGH confidence.

Q3

may have

LOW confidence.

Reason

Longitudinal evidence is unavailable.

---

# 10. Prohibited Behaviour

Layers must never

- fabricate previous state

- infer historical trends

- compare against Company Knowledge instead of previous artifacts

- silently suppress first-period state

- emit empty artifacts without history metadata

- treat first filing as an error

- convert dependency failures into first-period state

- regenerate historical upstream artifacts during replay

---

# 11. Relationship To Layer Ownership

This document defines historical availability only.

It does not modify layer ownership.

Quarter Change still owns business deltas.

Topic Evolution still owns topic evolution.

Trust Signals still own trust observations.

Investor Intelligence still owns ownership conclusions.

This document only standardizes how missing history is represented.

---

# 12. Relationship To Artifact Framework

Every artifact with temporal dependencies must implement

```
history_state

reason

comparison_performed

requires_previous_period
```

Historical availability metadata is artifact content.

Execution provenance, replay metadata, and execution context remain owned by the Artifact Framework and Execution Framework.

Layers must not duplicate those concerns inside business content.

using the definitions in this document.

No layer may define alternative representations.

---

# 13. Future Compatibility

New longitudinal layers added to the platform must adopt this contract.

No future layer may introduce custom first-period behavior without updating this specification.

This document is the single source of truth for historical availability throughout the platform.