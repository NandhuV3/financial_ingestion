# 018-artifact-enrichment-pattern-spec.md

Status: LOCKED

Version: 1.0

Purpose:

Defines the canonical enrichment pattern for intelligence artifacts.

This specification standardizes how artifacts evolve as additional inputs become available.

The pattern applies across the platform.

LOCKED.

---

# Problem

Not all intelligence inputs become available simultaneously.

Examples:

* Trust Signals may not exist yet.
* Topic Evolution may not exist yet.
* Transcript Signals may not exist yet.
* Cross-company context may not exist yet.

Waiting for every possible input before generating an artifact creates:

* delayed intelligence
* unnecessary coupling
* roadmap conflicts
* reduced platform value

LOCKED.

---

# Principle

An intelligence artifact should be generated when its required inputs are available.

Additional inputs should enrich the artifact rather than block its creation.

LOCKED.

---

# Input Categories

Every intelligence layer must classify dependencies into:

1. Required Inputs
2. Enrichment Inputs

LOCKED.

---

# Required Inputs

Required inputs are mandatory.

Without required inputs:

```text
Artifact Generation = Not Allowed
```

Required inputs define the minimum viable artifact.

LOCKED.

---

# Enrichment Inputs

Enrichment inputs are optional.

Without enrichment inputs:

```text
Artifact Generation = Allowed
```

Artifact depth is reduced.

LOCKED.

---

# Example

Quarter Understanding

Required:

```text
Company Knowledge
Business Signals
```

Enrichment:

```text
Trust Signals
Topic Evolution
Advanced Concept Registry
```

Quarter Understanding remains valid when enrichment inputs are absent.

LOCKED.

---

# Artifact Contract

Artifacts using the enrichment pattern must include:

```ts
type EnrichmentStatus = {
  [dimension: string]: {
    available: boolean;
    artifact_path: string | null;
    artifact_version: number | null;
    absent_reason: string | null;
  };
};
```

LOCKED.

---

# Depth Indicator

Artifacts must expose depth.

```ts
type DepthIndicator = {
  overall: "base" | "standard" | "full";

  [dimension: string]:
    | "present"
    | "absent"
    | string;
};
```

LOCKED.

---

# Artifact Example

```ts
type IntelligenceArtifact = {
  content: unknown;

  enrichment_status: EnrichmentStatus;

  depth_indicator: DepthIndicator;
};
```

LOCKED.

---

# Depth Levels

Base

Meaning:

Only required inputs available.

Example:

Quarter Understanding generated from:

* Company Knowledge
* Business Signals

without Trust Signals.

---

Standard

Meaning:

Some enrichment inputs available.

Example:

Quarter Understanding generated from:

* Company Knowledge
* Business Signals
* Topic Evolution

without Trust Signals.

---

Full

Meaning:

All supported enrichment inputs available.

LOCKED.

---

# Regeneration Rule

Arrival of enrichment inputs must trigger regeneration.

Example:

```text
Quarter Understanding
    ↓
Generated

Trust Signals Arrive
    ↓
Input Hash Changes
    ↓
Artifact Becomes Stale
    ↓
Quarter Understanding Regenerated
```

No special-case enrichment logic.

Existing invalidation architecture handles regeneration.

LOCKED.

---

# Ownership Rule

Enrichment inputs do not change ownership.

Example:

Trust Signals remain owned by:

```text
Trust Architecture
```

Quarter Understanding remains owned by:

```text
Interpretation Layer
```

Quarter Understanding may consume Trust Signals.

Quarter Understanding may not generate Trust Signals.

LOCKED.

---

# Consumer Contract

Consumers must inspect depth indicators.

Consumers may not assume enrichment exists.

LOCKED.

---

# Depth Propagation Rule

A consumer artifact cannot have deeper depth than its shallowest required input.

LOCKED.

---

# Example

Quarter Understanding:

```text
trust_dimension = absent
overall = base
```

Investor Intelligence Q3:

Must inspect:

```text
trust_dimension
```

Before generating trust conclusions.

Investor Intelligence may not generate:

```text
full trust verdict
```

from:

```text
trust_dimension = absent
```

LOCKED.

---

# Propagation Example

```text
Trust Signals Missing
        ↓

Quarter Understanding
overall = base
trust_dimension = absent

        ↓

Investor Intelligence Q3
trust_dimension = absent

        ↓

Investor Intelligence
overall depth limited
```

Depth limitations propagate downstream.

LOCKED.

---

# Governance Rule

Enrichment status is part of artifact governance.

Consumers must treat:

```text
Absent
```

as a first-class state.

Not as:

```text
null
unknown
error
```

LOCKED.

---

# Future Enrichment Sources

Future inputs may be added without redesigning artifact contracts.

Examples:

```text
Transcript Signals
Cross-Company Context
Market Context
Alternative Data
Industry Context
```

New enrichment dimensions extend:

```ts
EnrichmentStatus
DepthIndicator
```

without changing artifact structure.

LOCKED.

---

# Platform Rule

All future intelligence layers should evaluate whether dependencies belong in:

```text
Required Inputs
```

or

```text
Enrichment Inputs
```

before implementation.

LOCKED.

---

# Final Principle

Generate valid intelligence as early as possible.

Deepen intelligence as additional evidence becomes available.

Do not block artifact creation because optional enrichment is absent.

LOCKED.
