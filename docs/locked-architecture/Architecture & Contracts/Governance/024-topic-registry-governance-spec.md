Topic Registry Governance Specification

Status: LOCKED

# 1. Purpose

The Topic Registry is the canonical catalog of reusable business concepts used by the platform.

It exists to provide a stable, governed vocabulary that allows filing-specific Themes to be normalized into reusable concepts across companies and reporting periods.

The Topic Registry does **not** describe a company.

The Topic Registry does **not** describe a filing.

The Topic Registry does **not** describe a business observation.

The Topic Registry defines reusable business concepts that may appear repeatedly across many companies and many filings.

Its primary responsibilities are:

- Maintain the canonical Topic catalog.
- Govern Topic lifecycle.
- Ensure Topic consistency across time.
- Support deterministic Topic Assignment.
- Preserve historical reproducibility through registry versioning.

---

# 2. Position In Architecture

```
Themes
        │
        ▼
Topic Assignment
        │
        │ reads
        ▼
Topic Registry
        │
        ▼
Topic Evolution
```

The Topic Registry is a governance artifact.

It is **not** an intelligence layer.

It produces no business understanding.

It performs no business reasoning.

It exists only to govern reusable Topic definitions.

---

# 3. What Is A Topic?

A Topic is a reusable business concept.

A Topic represents a concept that may appear across:

- companies
- industries
- reporting periods
- filing types

Examples:

- Artificial Intelligence
- Subscription Revenue
- Cloud Computing
- Semiconductor Manufacturing
- Enterprise Security
- Developer Ecosystem
- Supply Chain
- Capital Allocation
- Advertising Platform

A Topic is intentionally independent from any individual filing.

---

# 4. What A Topic Is Not

A Topic is NOT:

- a Theme
- Company Knowledge
- Business Signal
- Trust Signal
- Quarter Change
- Investor conclusion
- KPI
- metric
- evidence paragraph
- filing section
- product name (unless universally reusable)
- company-specific observation

Invalid Topics:

- Azure Revenue Growth
- Microsoft AI Strategy
- Apple's Services Expansion
- Q3 Revenue Growth
- Operating Margin Increased
- Strong Cloud Demand
- AI Investment Increased

Those are filing observations.

They belong elsewhere.

---

# 5. Registry Ownership

The Topic Registry owns:

- canonical Topic definitions
- Topic identifiers
- Topic aliases
- Topic lifecycle
- Topic version history
- registry version
- Topic relationships

The Topic Registry does NOT own:

- Topic Assignment
- Theme extraction
- Theme interpretation
- Topic Evolution
- Business Signals
- Company Knowledge

---

# 6. Topic Lifecycle

Every Topic exists in exactly one lifecycle state.

```
Proposed
        │
        ▼
Provisional
        │
        ▼
Active
        │
 ┌──────┴─────────┐
 ▼                ▼
Deprecated      Merged
        │
        ▼
Retired
```

---

## Proposed

Candidate Topic awaiting governance review.

Cannot be used by Topic Assignment.

---

## Provisional

Approved for limited evaluation.

May be used experimentally.

Not considered stable.

---

## Active

Official Topic.

May be assigned by Topic Assignment.

May participate in Topic Evolution.

---

## Deprecated

No longer recommended for future assignments.

Historical assignments remain valid.

---

## Merged

Merged into another canonical Topic.

Historical assignments are never rewritten.

---

## Retired

No future use.

Retained only for historical lineage.

---

# 7. Registry Schema

Each Topic contains:

- topic_id
- canonical_name
- definition
- aliases
- lifecycle_state
- registry_version_created
- registry_version_modified
- parent_topic (optional)
- child_topics (optional)
- merged_into (optional)
- deprecated_reason (optional)
- embedding_version (optional)
- examples
- created_at
- updated_at

---

# 8. Admission Rules

A new Topic may only be admitted when all of the following are true.

It represents:

- a reusable business concept
- a company-independent concept
- a period-independent concept
- a concept useful across multiple companies
- a concept expected to remain useful over time

A Topic must not exist solely because it appeared in one filing.

---

# 9. Forbidden Admission

The registry must reject Topics that are:

Company specific

Examples:

- Microsoft Cloud
- Apple's Vision Products
- Google's Gemini

Period specific

Examples:

- AI Expansion Q3
- FY2026 Guidance

Metric specific

Examples:

- Revenue Increased
- Margin Expansion
- Operating Income Growth

Observation specific

Examples:

- Increased AI Investment
- Cloud Revenue Growth
- Strong Customer Demand

Investment specific

Examples:

- High Quality Business
- Attractive Valuation
- Strong Moat

These belong to downstream intelligence.

---

# 10. Alias Management

Multiple names may refer to one Topic.

Example

```
Artificial Intelligence

aliases

AI

Generative AI

Foundation Models
```

Aliases improve assignment quality.

Aliases never create new Topics.

---

# 11. Merge Rules

Topics may merge when governance determines they represent the same reusable concept.

Example

```
AI Infrastructure

+

AI Compute Infrastructure

↓

AI Infrastructure
```

Only governance may perform merges.

Historical assignments are preserved.

---

# 12. Deprecation Rules

Topics may be deprecated when:

- duplicated
- obsolete
- superseded
- merged

Deprecated Topics remain valid for historical artifacts.

Future Topic Assignment must not assign deprecated Topics.

---

# 13. Registry Versioning

Every registry modification produces a new registry version.

Registry versions are immutable.

Topic Assignment MUST record:

- registry_version

Example

```
Topic Assignment

registry_version = 8
```

This guarantees reproducibility.

---

# 14. Historical Immutability

Historical Topic Assignments are immutable.

Example

Registry Version 3

```
AI Infrastructure
```

Registry Version 7

```
AI Platform Infrastructure
```

merged from

```
AI Infrastructure
```

Assignments produced under Registry Version 3 remain unchanged forever.

The platform never rewrites historical Topic Assignments.

Registry evolution must never invalidate historical artifacts.

---

# 15. Topic Assignment Contract

Topic Assignment may:

- read Active Topics
- read aliases
- read Topic definitions
- read registry version

Topic Assignment must never:

- create Topics
- rename Topics
- merge Topics
- deprecate Topics
- edit definitions
- modify aliases
- change lifecycle states

Topic Assignment is a consumer of the registry.

It is never an owner.

---

# 16. Relationship To Topic Evolution

Topic Evolution consumes Topic Assignments.

Topic Evolution never modifies the Topic Registry.

Topic Evolution detects how assigned Topics evolve over time.

It does not govern Topics.

---

# 17. Relationship To Themes

Themes are filing-specific.

Topics are reusable.

One Theme may map to multiple Topics.

One Topic may appear across thousands of Themes.

Themes disappear after filing context.

Topics persist across the platform.

---

# 18. Governance Responsibilities

Governance owns:

- Topic approval
- Topic rejection
- Topic merge
- Topic split
- Topic deprecation
- alias approval
- registry version creation

Topic Assignment owns none of these responsibilities.

---

# 19. Examples

## Good Topics

- Cloud Computing
- Artificial Intelligence
- Subscription Revenue
- Developer Platform
- Enterprise Software
- Cybersecurity
- Semiconductor Manufacturing
- Supply Chain
- Advertising Platform
- Consumer Hardware

---

## Invalid Topics

- Azure Revenue Growth
- Microsoft AI Strategy
- Apple Services Expansion
- Revenue Increased 15%
- Strong Cloud Business
- AI Investment Growth
- Better Margins
- Attractive Business
- Strong Competitive Position

These are Themes, observations, metrics, or conclusions.

They are not reusable Topics.

---

# 20. Golden Rules

The Topic Registry governs concepts.

It does not generate intelligence.

A Topic is reusable.

A Topic is company-independent.

A Topic is period-independent.

A Topic is not evidence.

A Topic is not a Theme.

A Topic is not Company Knowledge.

A Topic is not a Signal.

A Topic is not an investment conclusion.

Topic Assignment reads the registry.

Only governance modifies the registry.

Registry evolution must never rewrite historical assignments.

Every Topic Assignment records the registry version used.

Historical reproducibility is mandatory.