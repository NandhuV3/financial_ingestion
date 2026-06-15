# 073-business-signals-spec.md

Status: LOCKED

Version: 1.0

Purpose:

Defines the Business Signals domain.

Business Signals convert Company Knowledge and business change information into deterministic business observations.

Business Signals are facts.

Business Signals are not interpretations.

Business Signals are not conclusions.

Business Signals are not recommendations.

LOCKED.

---

# Architectural Position

```text
Structured Intelligence
        ↓

Company Knowledge
        ↓

Topic Evolution
Quarter Change
        ↓

Business Signals
        ↓

Quarter Understanding
        ↓

Investor Intelligence
```

LOCKED.

---

# Mission

Business Signals provide deterministic observations about business changes.

Business Signals create a stable layer between:

```text
Knowledge
```

and

```text
Interpretation
```

This prevents interpretation logic from being embedded inside Company Knowledge or Quarter Understanding.

LOCKED.

---

# Owns

Business Signals owns:

* Signal generation
* Signal classification
* Signal typing
* Signal magnitude
* Signal direction
* Signal evidence references
* Signal lifecycle
* Signal versioning

LOCKED.

---

# Does Not Own

Business Signals does NOT own:

* Filing understanding
* Themes
* Topic Assignment
* Topic Evolution
* Company Knowledge
* Trust Signal generation
* Trust Signal classification
* Trust conclusions
* Quarter Understanding
* Investor Intelligence
* Recommendations
* Valuation opinions

LOCKED.

---

# Core Principle

Business Signals answer:

```text
What happened?
```

Quarter Understanding answers:

```text
What does it mean?
```

Investor Intelligence answers:

```text
Why does it matter to investors?
```

LOCKED.

---

# Signal Characteristics

Business Signals must be:

* Deterministic
* Explainable
* Auditable
* Reproducible
* Evidence-backed

Business Signals must never depend on:

* LLM reasoning
* Prompt interpretation
* Investor opinion

LOCKED.

---

# Inputs

Required Inputs:

```text
Company Knowledge Artifact
```

Business Signals follows the Artifact Enrichment Pattern.

Business Signals may generate a valid artifact when only Company Knowledge is available.

Missing enrichment inputs reduce signal coverage but do not prevent artifact generation.

LOCKED.

---

# Enrichment Inputs

Enrichment Inputs:

```text
Quarter Change
Topic Evolution
Transcript Signals
Market Context
Industry Context
Future Data Sources
```

Enrichment inputs increase signal coverage.

Enrichment inputs do not change ownership.

Missing enrichment inputs must not block artifact generation.

LOCKED.

---

# Signal Coverage Model

Business Signals follows a coverage-based enrichment model.

---

## Durable Signals

Required:

```text
Company Knowledge
```

Examples:

```text
Revenue Model Signals
Customer Concentration Signals
Product Concentration Signals
Business Dependency Signals
```

---

## Movement Signals

Required:

```text
Quarter Change
```

Examples:

```text
Revenue Acceleration
Margin Expansion
Customer Growth Acceleration
```

---

## Trend Signals

Required:

```text
Topic Evolution
```

Examples:

```text
Strategic Priority Strengthening
Strategic Priority Weakening
Topic Momentum Changes
```

Missing enrichment inputs reduce available signal categories.

Missing enrichment inputs do not invalidate the artifact.

LOCKED.

---

# Signal Categories

Business Signals are grouped into categories.

---

## Growth Signals

Examples:

```text
REVENUE_ACCELERATING

REVENUE_DECELERATING

CUSTOMER_GROWTH_ACCELERATING

CUSTOMER_GROWTH_DECELERATING
```

LOCKED.

---

## Margin Signals

Examples:

```text
MARGIN_EXPANDING

MARGIN_COMPRESSING

OPERATING_LEVERAGE_IMPROVING

OPERATING_LEVERAGE_DETERIORATING
```

Margin signals must describe observed margin movement.

They must not conclude that business quality improved or deteriorated.

LOCKED.

---

## Product Signals

Examples:

```text
PRODUCT_EXPANSION

PRODUCT_CONCENTRATION_INCREASING

PRODUCT_CONCENTRATION_DECREASING
```

LOCKED.

---

## Customer Signals

Examples:

```text
CUSTOMER_CONCENTRATION_INCREASING

CUSTOMER_CONCENTRATION_DECREASING

CUSTOMER_DIVERSIFICATION_IMPROVING
```

Customer signals must describe customer movement or concentration.

They must not conclude customer quality or business attractiveness.

LOCKED.

---

## Competitive Signals

Examples:

```text
COMPETITIVE_POSITION_STRENGTHENING

COMPETITIVE_POSITION_WEAKENING

MARKET_SHARE_GAINS

MARKET_SHARE_LOSSES
```

Competitive signals must describe observed competitive movement from approved upstream artifacts.

They must not conclude durable moat quality or investment attractiveness.

LOCKED.

---

## Strategic Signals

Examples:

```text
STRATEGIC_PRIORITY_EXPANDING

STRATEGIC_PRIORITY_CONTRACTING

INVESTMENT_INTENSIFYING

INVESTMENT_REDUCING
```

LOCKED.

---

# Trust Boundary

Business Signals must not emit Trust Signals.

Trust Signals are a separate Trust Architecture artifact.

Trust Signals are generated from:

```text
Commitment Tracking
Narrative Consistency
Accounting Stability
```

by the Trust Signals layer.

Business Signals may reference trust-related upstream availability only as lineage or enrichment status.

Business Signals may NOT emit:

```text
Trust Signals
Trust Conclusions
```

Trust conclusions belong to:

```text
Quarter Understanding and Investor Intelligence Q3
```

LOCKED.

---

# Signal Structure

```ts
type BusinessSignal = {
  signal_id: string;

  signal_type: string;

  company_id: string;

  period_id: string;

  category:
    | "growth"
    | "margin"
    | "product"
    | "customer"
    | "competitive"
    | "strategic";

  direction:
    | "improving"
    | "stable"
    | "deteriorating";

  magnitude:
    | "low"
    | "medium"
    | "high";

  observation: string;

  evidence_refs: string[];

  source_artifact_refs: SourceArtifactReference[];

  rule_ref: string;

  company_knowledge_refs: string[];

  topic_refs: string[];

  evidence_confidence: number;
};
```

```ts
type SourceArtifactReference = {
  artifact_id: string;

  artifact_type:
    | "company_knowledge"
    | "topic_evolution"
    | "quarter_change";

  artifact_version: number;
};
```

`observation` describes what happened.

It must not explain why it matters.

`direction` describes observed movement only.

It must not represent business quality, investor attractiveness, or management quality.

`magnitude` must be determined by documented deterministic rules.

`evidence_confidence` measures evidence quality or source coverage only.

It does not measure:

```text
Interpretation Confidence
Investment Confidence
Trust Confidence
```

`evidence_confidence` must be computed deterministically from the same inputs used to generate the signal.

No LLM reasoning may be used.

LOCKED.

---

# Signal Artifact

```ts
type BusinessSignalsArtifact = {
  company_id: string;

  period_id: string;

  signals: BusinessSignal[];

  signal_summary: {
    total_signals: number;

    by_category: Record<string, number>;

    by_magnitude: Record<string, number>;
  };
};
```

Artifact metadata, lineage, identity, versioning, and persistence belong to:

```text
Artifact Framework
```

LOCKED.

---

# Evidence Requirements

Every signal must contain:

```text
Evidence References
```

Signals without evidence are invalid.

Every signal must reference:

```text
At least one Company Knowledge reference

The deterministic rule reference that generated the signal
```

Movement Signals must reference Quarter Change.

Trend Signals must reference Topic Evolution.

Durable Signals may be generated from Company Knowledge alone.

LOCKED.

---

# Determinism Rule

Signal generation must be deterministic.

Examples:

Allowed:

```text
Quarter-over-quarter revenue acceleration
```

Allowed:

```text
Customer concentration increase
```

Forbidden:

```text
Management appears confident
```

Forbidden:

```text
This company is likely to outperform
```

LOCKED.

---

# Evaluation Requirements

Business Signals should be evaluated for:

* Signal correctness
* Signal coverage
* Signal consistency
* Signal duplication
* Evidence quality

LOCKED.

---

# Replayability

Signal generation must be replayable.

Required lineage:

```text
Company Knowledge
```

Enrichment lineage must be recorded when used:

```text
Topic Evolution
Quarter Change
Transcript Signals
Market Context
Industry Context
Future Data Sources
```

Used during signal generation.

LOCKED.

---

# Future Extensions

Future signal categories may be added.

Examples:

```text
Transcript Signals

Industry Signals

Market Signals

Alternative Data Signals
```

These extend Business Signals.

They do not change Business Signals ownership.

LOCKED.

---

# Final Principle

Business Signals describe business change.

They do not explain business change.

They do not evaluate business change.

They do not judge business change.

Interpretation belongs to Quarter Understanding.

LOCKED.
