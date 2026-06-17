# 033-investor-intelligence-q2-spec.md

Version: 1.0
Status: LOCKED
Owner: Investor Intelligence Layer

---

# Purpose

Q2 answers:

> "Where does the next rupee come from?"

Q2 is the growth intelligence layer.

Q1 explains:

```text
What the business is.
```

Q2 explains:

```text
How the business grows.
```

Q2 identifies:

- future revenue drivers
- growth engines
- growth constraints
- demand trends
- business momentum

Q2 does NOT predict stock returns.

Q2 does NOT perform valuation.

Q2 does NOT recommend investments.

---

# Core Responsibility

Transform:

```text
Company Knowledge
+
Quarter Understanding
```

into:

```text
Revenue Growth Understanding
```

---

# Ownership

Q2 owns:

- growth engine identification
- revenue driver assessment
- growth durability assessment
- growth constraint identification
- revenue trajectory reasoning

Q2 does NOT own:

- trust assessment
- valuation assessment
- ownership thesis
- stock outlook
- investment recommendation

---

# Core Question

Q2 must answer:

```text
What is most likely
to drive future revenue growth
for this business?
```

---

# Inputs

## Required

Company Knowledge

Quarter Understanding

## Enrichment

Business Signals

Topic Evolution

Historical Investor Intelligence

Prior Investor Intelligence

---

# Forbidden Inputs

Q2 MUST NOT consume:

Market Data

Valuation Data

Price History

Analyst Reports

Q3 Outputs

Q4 Outputs

Q5 Outputs

Partner Domain

News

Social Media

---

# Growth Architecture

Q2 evaluates growth through:

```text
Revenue Drivers

Growth Signals

Business Momentum

Growth Constraints

Growth Durability
```

---

# Revenue Drivers

Purpose:

Identify where future revenue may originate.

Examples:

```text
Cloud Expansion

AI Adoption

Enterprise Migration

International Expansion

Subscription Growth

Pricing Power

Cross-Selling

New Product Adoption
```

---

# Growth Signals

Derived from:

Business Signals

Quarter Understanding

Topic Evolution

Examples:

```text
Revenue Acceleration

Customer Expansion

Demand Strength

Capacity Expansion

Market Share Gains
```

---

# Growth Constraints

Purpose:

Identify factors limiting growth.

Examples:

```text
Capacity Constraints

Competitive Pressure

Customer Concentration

Execution Risk

Regulatory Friction

Supply Constraints
```

Q2 identifies them.

Q2 does not assess risk severity.

---

# Growth Durability

Purpose:

Determine whether growth drivers are:

```typescript
type GrowthDurability =
  | "durable"
  | "moderately_durable"
  | "uncertain"
  | "temporary";
```

---

# Output Schema

```typescript
type Q2Answer = {
  revenue_outlook_summary: string;

  primary_growth_drivers: GrowthDriver[];

  growth_constraints: GrowthConstraint[];

  growth_durability: GrowthDurability;

  revenue_direction: RevenueDirection;

  confidence: Q2Confidence;

  status:
    | "answered"
    | "partial"
    | "insufficient_inputs";

  evidence_package: Q2EvidencePackage;

  replayability_metadata:
    Q2ReplayabilityMetadata;
};
```

---

# Revenue Direction

Purpose:

Summarize current growth trajectory.

```typescript
type RevenueDirection =
  | "accelerating"
  | "stable_growth"
  | "mixed"
  | "slowing"
  | "uncertain";
```

---

# Growth Driver Schema

```typescript
type GrowthDriver = {
  driver_id: string;

  title: string;

  description: string;

  source:
    | "company_knowledge"
    | "quarter_understanding"
    | "business_signal"
    | "topic_evolution";

  confidence: number;

  durability: GrowthDurability;
};
```

---

# Growth Constraint Schema

```typescript
type GrowthConstraint = {
  constraint_id: string;

  title: string;

  description: string;

  severity:
    | "low"
    | "medium"
    | "high";

  source: string;
};
```

---

# Evidence Package

Every growth claim must be grounded.

```typescript
type Q2EvidencePackage = {
  business_signal_refs: string[];

  understanding_refs: string[];

  concept_refs: string[];

  company_knowledge_refs: string[];

  supporting_artifacts: string[];
};
```

---

# Grounding Rules

Every revenue driver must trace to:

- Company Knowledge
- Quarter Understanding
- Business Signals
- Topic Evolution

No speculative growth drivers allowed.

---

# Confidence Model

Confidence is derived.

Never self-assessed.

```typescript
type Q2Confidence = {
  overall: number;

  revenue_driver_clarity: number;

  signal_strength_score: number;

  growth_consistency_score: number;

  durability_score: number;

  historical_support_score: number;
};
```

---

# Confidence Interpretation

High Confidence

```text
Growth drivers are clear,
supported,
and historically consistent.
```

Moderate Confidence

```text
Growth drivers exist,
but evidence is mixed.
```

Low Confidence

```text
Future revenue trajectory
is uncertain.
```

---

# Status Rules

## Answered

Growth understanding available.

Confidence above threshold.

---

## Partial

Growth drivers identified.

Important supporting evidence missing.

---

## Insufficient Inputs

Cannot determine future revenue drivers.

Evidence unavailable.

---

# Historical Requirements

Q2 benefits from history.

Minimum:

```text
2 periods
```

Preferred:

```text
4+ periods
```

---

# Growth Persistence

Q2 should evaluate:

```text
Temporary Growth

vs

Durable Growth
```

using Topic Evolution.

---

# Revenue Driver Persistence

Examples:

Durable:

```text
Cloud Migration

Subscription Expansion

Platform Adoption
```

Temporary:

```text
One-Time Contracts

Short-Term Pricing Changes

Temporary Demand Surges
```

---

# Evaluation Metrics

---

## Revenue Driver Grounding

Measures:

```text
Whether growth drivers
are evidence-backed.
```

---

## Growth Signal Utilization

Measures:

```text
Use of available signals.
```

---

## Revenue Direction Accuracy

Measures:

```text
Consistency with
Quarter Understanding.
```

---

## Durability Accuracy

Measures:

```text
Correct classification
of growth persistence.
```

---

## Forward-Looking Quality

Measures:

```text
Ability to explain
future revenue sources.
```

---

# Governance Rules

Q2 must remain explanatory.

Q2 must never become:

```text
Stock Forecast

Price Forecast

Investment Recommendation

Valuation Assessment
```

---

# Forbidden Language

Examples:

```text
The stock should rise.

Investors should buy.

Expected return is high.

This is undervalued.

This is overvalued.
```

---

# Invalidation Rules

Regenerate when:

```text
Company Knowledge changes

Quarter Understanding changes

Business Signals change

Topic Evolution changes
```

---

# No Regeneration Required

Do NOT regenerate for:

```text
Market Data Updates

Q4 Updates

Partner Domain Changes

Presentation Changes
```

---

# Historical Comparison

Track:

```typescript
type Q2HistoricalComparison = {
  growth_driver_changes: boolean;

  durability_changes: boolean;

  revenue_direction_changes: boolean;

  new_growth_drivers_detected: boolean;

  growth_constraints_changed: boolean;
};
```

---

# Longitudinal Analysis

Q2 should identify:

```text
Emerging Growth Drivers

Persisting Growth Drivers

Declining Growth Drivers
```

across periods.

---

# Replayability Metadata

```typescript
type Q2ReplayabilityMetadata = {
  company_knowledge_version: number;

  quarter_understanding_version: number;

  business_signals_version: number;

  topic_evolution_version: number;

  prompt_version: string;

  model_version: string;

  input_hash: string;
};
```

This is replayability metadata owned by Investor Intelligence and is not
Artifact Framework lineage.

---

# Artifact Framework Metadata

Metadata, artifact_version, Artifact Framework lineage, artifact-level hashes,
persistence, current pointer, and archive/history are provided by Artifact
Framework and are not part of Q2 content.

---

# Scaling Requirements

Target:

```text
10,000+ companies
```

Must support:

- growth trend tracking
- portfolio growth analysis
- durable growth identification
- Q5 ownership thesis generation

---

# Architectural Invariants

LOCKED.

1. Q2 answers future revenue drivers.
2. Q2 does not evaluate trust.
3. Q2 does not evaluate valuation.
4. Q2 does not recommend investments.
5. All growth claims require evidence.
6. Revenue drivers must be traceable.
7. Growth durability must be explicit.
8. Topic Evolution enriches persistence assessment; absence must be recorded as a limitation.
9. Q2 is forward-looking but evidence-grounded.
10. Q2 serves as a primary input into Q5 ownership thesis generation.

End of Specification.
