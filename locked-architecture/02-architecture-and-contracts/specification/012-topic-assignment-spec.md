# 012 - Topic Assignment Specification

**Status:** LOCKED  
**Layer:** Company Intelligence  
**Owner:** Company Intelligence Architecture  
**Producer:** Builder 012 - Topic Assignment  
**Last Updated:** 2026-07-01

---

# 1. Purpose

Topic Assignment maps filing-specific Themes into the Platform's canonical Topic Registry.

Themes describe filing-specific business observations.

Topic Assignment normalizes those observations into reusable canonical Topics.

Topic Assignment answers:

> Which canonical Topics are represented by this Theme?

Topic Assignment performs deterministic classification only.

It does not:

- interpret business meaning
- assess significance
- create Topics
- evolve the Platform Registry

---

# 2. Position in Architecture

```text
Themes
        │
        ▼
Topic Assignment
        │
        ├───────────────┐
        │               │
        ▼               ▼
Topic Assignment   Topic Signals
Platform Artifact  Execution Record
        │
        ▼
Topic Evolution
```

Builder 012 has two independent responsibilities:

1. Produce Topic Assignments for Company Intelligence.
2. Produce Topic Signals for Platform Intelligence.

These outputs intentionally serve different architectural layers.

---

# 3. Inputs

## Required Inputs

- Themes
- Topic Registry

The Topic Registry provides canonical reusable concepts, including:

- Topic ID
- Canonical Name
- Definition
- Aliases
- Examples
- Status

---

# 4. Forbidden Inputs

Topic Assignment must never consume:

- Company Knowledge
- Quarter Change
- Business Signals
- Trust Signals
- Quarter Understanding
- Investor Intelligence
- Market Context
- Industry Context

Topic Assignment performs classification only.

Downstream intelligence must never influence Topic Assignment.

---

# 5. Outputs

Builder 012 produces two independent outputs.

## Company Intelligence Output

Topic Assignment Platform Artifact

Example

```json
{
  "theme_id": "theme_001",
  "topic_ids": [
    "artificial_intelligence",
    "cloud"
  ]
}
```

## Platform Intelligence Output

Topic Signal Execution Record

Topic Signals preserve qualified execution observations.

They do not preserve the complete computational trace.

---

# 6. Allowed Reasoning

Topic Assignment may:

- compare Theme meaning with Topic definitions
- compare Theme meaning with Topic aliases
- compare Theme meaning with Topic examples
- perform deterministic semantic similarity evaluation
- assign one Theme to multiple Topics
- assign multiple Themes to one Topic

Topic Assignment performs only canonical classification.

---

# 7. Forbidden Reasoning

Topic Assignment must never:

- create Topics
- merge Topics
- delete Topics
- evolve the Platform Registry
- assess importance
- assess significance
- assess investor relevance
- produce business conclusions
- produce trust conclusions
- produce ownership conclusions
- perform temporal analysis

Invalid:

> "This Topic is strategically important."

Invalid:

> "This Theme strengthens the investment thesis."

Invalid:

> "This Theme indicates future growth."

---

# 8. Assignment Rules

A Topic may receive:

- zero Themes
- one Theme
- many Themes

A Theme may map to:

- zero Topics
- one Topic
- many Topics

Assignments are determined only by deterministic semantic classification against the Topic Registry.

Assignment never depends on perceived business importance.

---

# 9. Deterministic Qualification Rules

Builder 012 performs many internal computations.

Not every computation becomes Company Intelligence or Platform Intelligence.

The Builder Specification defines deterministic qualification rules.

These rules determine which execution results become:

- Topic Assignments
- Topic Signals

Builder implementations apply these rules.

They never redefine them.

---

## Qualified Assignments

A Topic Assignment contains only Topics that satisfy the deterministic assignment rules defined by Builder 012.

Assignments are:

- deterministic
- replayable
- versioned
- specification-defined

---

## Qualified Execution Observations

Topic Signals preserve only qualified execution observations.

Qualified observations include:

- accepted assignments
- qualified rejected candidates
- deterministic rejection reasons

Only observations satisfying the deterministic qualification rules may be persisted.

---

## Transient Computation

The following remain internal execution computation:

- discarded candidate comparisons
- discarded similarity evaluations
- temporary ranking structures
- intermediate lookup tables
- embedding vectors
- implementation caches

Transient computation is never persisted.

---

# 10. Ownership Boundaries

## Themes vs Topic Assignment

| Themes | Topic Assignment |
|---------|------------------|
| Filing observations | Canonical classification |
| Filing language | Topic Registry mapping |
| Narrative | Canonical Topics |

Example

Theme

```text
AI Infrastructure Expansion
```

Topic Assignment

```text
artificial_intelligence
```

---

## Topic Assignment vs Topic Evolution

| Topic Assignment | Topic Evolution |
|------------------|-----------------|
| Which Topics exist? | How Topics evolve |
| Single filing | Multiple periods |
| Classification | Temporal analysis |

Topic Assignment performs no temporal reasoning.

---

## Topic Assignment vs Platform Intelligence

| Company Intelligence | Platform Intelligence |
|----------------------|-----------------------|
| Topic Assignment | Topic Signals |
| Business output | Execution observations |
| Consumed downstream | Aggregated across companies |

These outputs intentionally serve different architectural responsibilities.

---

# 11. Relationship to Ownership Questions

Topic Assignment contributes indirectly by providing normalized Topic mappings.

It enables downstream intelligence such as:

- longitudinal Topic analysis
- narrative consistency
- ownership reasoning
- business signal generation

Topic Assignment never answers those questions itself.

---

# 12. Execution Model

Execution Type

```text
Deterministic
```

Given identical:

- Themes
- Topic Registry
- Builder Specification
- embedding model
- Builder implementation

Builder 012 must produce identical:

- Topic Assignments
- Topic Signals

Execution is:

- deterministic
- replayable
- specification-defined
- implementation-independent

Builder implementations execute the specification.

They do not define platform behavior.

---

# 13. Architecture Summary

Topic Assignment is the canonical classification layer of Company Intelligence.

It transforms filing-specific Themes into reusable Platform Topics while simultaneously producing qualified execution observations for Platform Intelligence.

The Builder Specification defines deterministic qualification rules that distinguish qualified execution observations from transient computation.

By separating business classification from execution observations, the platform enables deterministic Company Intelligence and autonomous Platform Intelligence without exposing implementation details or coupling execution to downstream governance.