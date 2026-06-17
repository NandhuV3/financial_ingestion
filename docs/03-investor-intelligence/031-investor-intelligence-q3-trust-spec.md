# 031-investor-intelligence-q3-trust-spec.md

# Purpose

Q3 answers:

> "Can the story be trusted?"

Q3 is responsible for synthesizing investor-facing trust understanding
from Quarter Understanding.

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

- Company Knowledge
- Quarter Understanding
- Trust Signals (conditional exception only)
- Commitment Tracking (longitudinal depth only)

Produces:

- Trust Synthesis
- Trust Depth Limitation
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

Company Knowledge Artifact

Quarter Understanding Artifact

## Enrichment

Trust Signals Artifact

Commitment Tracking Artifact

## Optional

Historical Investor Intelligence

Trust Signals may be consumed directly only when:

```text
quarter_understanding.depth_indicator.trust_dimension = "absent"
```

When:

```text
quarter_understanding.depth_indicator.trust_dimension = "present"
```

Trust Signals must not be consumed directly.

Quarter Understanding remains the sole trust interpretation source.

Commitment Tracking may be consumed only for longitudinal depth.

---

# Forbidden Inputs

Q3 MUST NOT consume:

Raw filings

Topic Assignment

Themes

Quarter Change directly

Business Signals directly

Narrative Consistency directly

Accounting Stability directly

Market data

Valuation data

Price history

Analyst ratings

News

Social media

---

# Trust Dimension Source Rules

Q3 may synthesize trust only from trust interpretation already present in Quarter Understanding.

Q3 must not reinterpret raw trust pillar evidence.

Q3 must not consume Trust Signals directly when Quarter Understanding trust dimension is present.

Q3 may consume Trust Signals directly only as a fallback when Quarter Understanding trust dimension is absent.

Q3 may consume Commitment Tracking only for longitudinal depth.

## Commitment Reliability

Source:

Quarter Understanding trust interpretation.

Commitment Tracking may provide longitudinal depth only.

---

## Narrative Consistency

Source:

Quarter Understanding trust interpretation.

Narrative Consistency artifact is not a direct Investor Intelligence input.

---

## Accounting Stability

Source:

Quarter Understanding trust interpretation.

Accounting Stability artifact is not a direct Investor Intelligence input.

---

## Evidence Alignment

Source:

Quarter Understanding trust interpretation.

Trust Signals may be used only under the conditional fallback rule.

LOCKED.

---

# Trust Assessment Scale

```typescript
type TrustAssessment =
  | "supported_by_quarter_understanding"
  | "limited_by_missing_trust_dimension"
  | "limited_by_partial_trust_coverage";
```

Definitions:

Q3 must not generate trust verdicts when Quarter Understanding trust dimension is absent.

Q3 must not reinterpret raw Trust Signals into a management credibility conclusion.

---

# Output Schema

```typescript
type Q3Answer = {
  trust_assessment: TrustAssessment | null;

  summary: string;

  trust_depth_limitation: string | null;

  key_evidence: TrustEvidence[];

  confidence: Q3Confidence;

  depth_indicator:
    | "current_period_only"
    | "longitudinal";

  status:
    | "answered"
    | "partial"
    | "insufficient_inputs";

  replayability_metadata:
    Q3ReplayabilityMetadata;
};
```

This is replayability metadata owned by Investor Intelligence and is not
Artifact Framework lineage. Artifact Framework owns metadata, lineage,
versioning, artifact_version, persistence, current pointer, and archive/history.

```typescript
type Q3ReplayabilityMetadata = {
  quarter_understanding_version: number;

  trust_signals_version: number | null;

  commitment_tracking_version: number | null;

  prompt_version: string;

  model_version: string;

  input_hash: string;
};
```

---

# Evidence Requirements

Every trust assessment must reference evidence.

```typescript
type TrustEvidence = {
  evidence_id: string;

  source:
    | "commitment_tracking"
    | "quarter_understanding"
    | "trust_signal";

  summary: string;

  severity:
    | "low"
    | "medium"
    | "high";
};
```

No evidence → no trust assessment.

---

# Confidence Model

Confidence is derived.

Q3 never self-assesses confidence.

Confidence inputs:

- Quarter Understanding trust depth
- Trust Signals fallback coverage
- Commitment Tracking longitudinal depth
- evidence density

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

- trust_assessment or trust_depth_limitation populated
- evidence present
- valid trust assessment
- confidence populated
- replayability metadata populated

Consistency Checks

trust_assessment must be null when:

```text
quarter_understanding.depth_indicator.trust_dimension = "absent"
```

unless Trust Signals are consumed under the conditional fallback rule.

Trust Signals must not be present when:

```text
quarter_understanding.depth_indicator.trust_dimension = "present"
```

---

# Invalidation Rules

Regenerate when:

Commitment Tracking changes

Trust Signals change

Company Knowledge changes

Quarter Understanding changes

Do not regenerate for:

Q4 updates

Market data updates

Partner Domain changes

Presentation changes

---

# Historical Comparison

Track:

Trust assessment evolution

Commitment fulfillment trends

Narrative drift trends

Accounting stability trends

Confidence trends

Historical comparison must operate using
structured evidence and assessments,
not answer prose.

---

# Architectural Principles

Q3 synthesizes trust understanding,
not business quality.

Q3 does not reinterpret raw trust evidence.

Q3 produces trust intelligence,
not investment recommendations.

All trust assessments must be evidence-backed,
traceable,
and longitudinally auditable.
