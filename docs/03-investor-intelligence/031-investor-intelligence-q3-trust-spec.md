# 031-investor-intelligence-q3-trust-spec.md

# Purpose

Q3 answers:

> "Can the story be trusted?"

Q3 is responsible for evaluating management credibility,
commitment reliability,
narrative consistency,
and accounting stability.

Q3 does NOT evaluate:

- business quality
- revenue growth
- valuation
- stock attractiveness
- business risk

Those belong to Q1, Q2, Q4, and Q5.

The purpose of Q3 is to determine whether management statements
are supported by observable behavior over time.

---

# Ownership

Owner Layer:

Investor Intelligence

Consumes:

- Commitment Tracking
- Narrative Consistency
- Accounting Stability
- Trust Signals
- Company Knowledge
- Quarter Understanding

Produces:

- Trust Verdict
- Trust Rationale
- Trust Evidence Package
- Trust Confidence

---

# Core Question

Q3 must answer:

1. Are management commitments being fulfilled?
2. Is management messaging consistent over time?
3. Are accounting practices stable?
4. Are reported results aligned with prior guidance?
5. Does observable evidence support management credibility?

---

# Inputs

## Required

Commitment Tracking Artifact

Narrative Consistency Artifact

Accounting Stability Artifact

Trust Signals Artifact

Company Knowledge Artifact

## Optional

Quarter Understanding

Historical Investor Intelligence

---

# Forbidden Inputs

Q3 MUST NOT consume:

Raw filings

Topic Assignment

Themes

Quarter Change directly

Business Signals directly

Market data

Valuation data

Price history

Analyst ratings

News

Social media

---

# Trust Dimensions

Q3 evaluates four dimensions.

## Commitment Reliability

Measures:

- commitments made
- commitments fulfilled
- commitments delayed
- commitments abandoned

Source:

Commitment Tracking

---

## Narrative Consistency

Measures:

- strategic message stability
- explanation consistency
- management communication drift

Source:

Narrative Consistency

---

## Accounting Stability

Measures:

- restatements
- accounting changes
- unusual adjustments
- reporting volatility

Source:

Accounting Stability

---

## Evidence Alignment

Measures:

Whether management claims align with:

- reported outcomes
- observed business signals
- prior commitments

Source:

Trust Signals

---

# Verdict Scale

```typescript
type TrustVerdict =
  | "high_trust"
  | "moderate_trust"
  | "trust_concerns"
  | "low_trust";
```

Definitions:

### high_trust

Management statements consistently align
with observable outcomes.

### moderate_trust

Minor inconsistencies exist
but overall credibility remains intact.

### trust_concerns

Repeated inconsistencies,
missed commitments,
or weak evidence alignment.

### low_trust

Material credibility concerns.

Evidence suggests management narrative
cannot be relied upon.

---

# Output Schema

```typescript
type Q3Answer = {
  verdict: TrustVerdict;

  rationale: string;

  key_evidence: TrustEvidence[];

  confidence: Q3Confidence;

  depth_indicator:
    | "current_period_only"
    | "longitudinal";

  status:
    | "answered"
    | "partial"
    | "insufficient_inputs";

  lineage: Q3Lineage;

  metadata: Metadata;
};
```

---

# Evidence Requirements

Every verdict must reference evidence.

```typescript
type TrustEvidence = {
  evidence_id: string;

  source:
    | "commitment_tracking"
    | "narrative_consistency"
    | "accounting_stability"
    | "trust_signal";

  summary: string;

  severity:
    | "low"
    | "medium"
    | "high";
};
```

No evidence → no verdict.

---

# Confidence Model

Confidence is derived.

Q3 never self-assesses confidence.

Confidence inputs:

- commitment coverage
- history depth
- narrative evidence density
- accounting evidence density

```typescript
type Q3Confidence = {
  overall: number;

  commitment_score: number;

  narrative_score: number;

  accounting_score: number;

  evidence_density: number;

  longitudinal_depth: number;
};
```

---

# Longitudinal Requirements

Longitudinal trust assessment requires:

Minimum:

3 periods

Preferred:

4+ periods

If insufficient history:

```typescript
depth_indicator =
  "current_period_only"
```

Q3 must not claim longitudinal trust assessment
without sufficient history.

---

# Governance Rules

Q3 must never:

recommend buying

recommend selling

recommend holding

predict stock returns

estimate price targets

evaluate valuation attractiveness

use investment-action language

Forbidden examples:

"Investors should buy."

"The stock is attractive."

"This is a compelling investment."

---

# Evaluation Rules

Automated Checks

- verdict populated
- evidence present
- valid trust verdict
- confidence populated
- lineage populated

Consistency Checks

high_trust cannot coexist with:

- multiple abandoned commitments
- severe accounting instability
- major narrative contradictions

low_trust requires:

at least one high-severity evidence item

---

# Invalidation Rules

Regenerate when:

Commitment Tracking changes

Narrative Consistency changes

Accounting Stability changes

Trust Signals change

Company Knowledge changes

Do not regenerate for:

Q4 updates

Market data updates

Partner Domain changes

Presentation changes

---

# Historical Comparison

Track:

Trust verdict evolution

Commitment fulfillment trends

Narrative drift trends

Accounting stability trends

Confidence trends

Historical comparison must operate using
structured evidence and verdicts,
not answer prose.

---

# Architectural Principles

Q3 evaluates credibility,
not business quality.

Q3 evaluates observable behavior,
not management intent.

Q3 produces trust intelligence,
not investment recommendations.

All trust conclusions must be evidence-backed,
traceable,
and longitudinally auditable.