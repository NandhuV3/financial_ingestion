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

- Quarter Understanding
- Quarter Understanding trust interpretation

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

Quarter Understanding Artifact

## Optional

Prior Investor Intelligence

Company Knowledge reaches Q3 through Quarter Understanding.

```text
Company Knowledge
        ↓
Quarter Understanding
        ↓
Investor Intelligence Q3
```

Q3 does not consume Company Knowledge directly.

Q3 consumes Quarter Understanding trust interpretation.

---

# Forbidden Inputs

Q3 MUST NOT consume:

Raw filings

Topic Assignment

Themes

Quarter Change directly

Business Signals directly

Trust Signals directly

Commitment Tracking directly

Narrative Consistency directly

Accounting Stability directly

Capital Allocation Tracking directly

Raw trust evidence

Market data

Valuation data

Price history

Analyst ratings

News

Social media

---

# Trust Dimension Source Rules

Q3 may synthesize trust only from trust interpretation already present in Quarter Understanding.

Q3 consumes Quarter Understanding trust interpretation only.

Quarter Understanding is the sole trust interpretation source.

Q3 never consumes:

```text
Trust Signals
Commitment Tracking
Narrative Consistency
Accounting Stability
Capital Allocation Tracking
Raw trust evidence
```

Q3 synthesizes investor-facing trust understanding from Quarter Understanding
trust interpretation.

## Commitment Reliability

Source:

Quarter Understanding trust interpretation.

---

## Narrative Consistency

Source:

Quarter Understanding trust interpretation.

No direct Narrative Consistency artifact consumption is allowed.

---

## Accounting Stability

Source:

Quarter Understanding trust interpretation.

No direct Accounting Stability artifact consumption is allowed.

---

## Evidence Alignment

Source:

Quarter Understanding trust interpretation.

No direct Trust Signals or Trust Pillar artifact consumption is allowed.

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

This is Investor Intelligence content-level replayability metadata.

It is not Artifact Framework lineage.

Artifact Framework owns artifact identity, artifact metadata, framework
lineage, artifact versioning, persistence, current pointers, archive/history,
and framework hashes.

```typescript
type Q3ReplayabilityMetadata = {
  prompt_lineage: InvestorPromptLineage;

  prompt_version: string;

  model_version: string;

  section_input_hash: string;

  section_output_hash: string;

  evaluation_metadata: Q3EvaluationMetadata;
};
```

---

# Evidence Requirements

Every trust assessment must reference evidence.

```typescript
type TrustEvidence = {
  evidence_id: string;

  source:
    | "quarter_understanding";

  replayability_refs: string[];

  summary: string;

  severity:
    | "low"
    | "medium"
    | "high";
};
```

No evidence → no trust assessment.

Q3 evidence is derived from Quarter Understanding trust interpretation and
approved Investor Intelligence replayability references.

---

# Confidence Model

Confidence is derived.

Q3 never self-assesses confidence.

Confidence inputs:

- Quarter Understanding trust depth
- Trust coverage availability
- evidence density
- Historical continuity when available

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

Q3 may not generate trust verdicts when Quarter Understanding trust
interpretation is unavailable.

Q3 never consumes Trust Signals directly.

---

# Invalidation Rules

Regenerate when:

Quarter Understanding changes

Prior Investor Intelligence changes

Do not regenerate for:

Q4 updates

Market data updates

Partner Domain changes

Presentation changes

Q3 publishes immutable content only.

Dependency Index owns dependency registration.

Invalidation Engine owns staleness determination and propagation.

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

Q3 synthesizes investor-facing trust understanding,
not business quality.

Q3 consumes Quarter Understanding trust interpretation only.

Q3 does not consume Trust Signals directly.

Q3 does not consume Trust Pillars directly.

Q3 does not reinterpret raw trust evidence.

Q3 produces trust intelligence,
not investment recommendations.

All trust assessments must be evidence-backed,
traceable,
and longitudinally auditable.

Canonical trust chain:

```text
Trust Pillars
        ↓
Trust Signals
        ↓
Quarter Understanding
        ↓
Investor Intelligence Q3
```
