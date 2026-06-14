# 005-quarter-understanding.md

# Purpose

Quarter Understanding is the first investor interpretation layer in the platform.

It answers:

"What happened this period and why does it matter?"

This is the layer where observations become meaning.

Business Signals detect facts.

Quarter Understanding explains significance.

---

# Architectural Position

Company Knowledge
        ↓

Business Signals
        ↓

Topic Evolution
        ↓

Trust Artifacts
        ↓

Quarter Understanding
        ↓

Investor Intelligence

Quarter Understanding is the bridge between deterministic observations and investor reasoning.

---

# Ownership

Quarter Understanding owns:

- Current period interpretation
- Signal interpretation
- Trust interpretation
- Business interpretation
- Narrative coherence assessment
- Pattern assessment
- Current period investor significance

---

# Does Not Own

Quarter Understanding never owns:

- Signal generation
- Company memory
- Filing understanding
- Topic assignment
- Topic evolution
- Investor recommendations
- Q1-Q5 synthesis
- Presentation

Those belong elsewhere.

---

# Inputs

Quarter Understanding receives structured inputs only.

---

## Business Signals

Provides:

- Business Signals
- Strategic Signals
- Operational Signals
- Trust Signals

---

## Company Knowledge

Provides:

- Business Model
- Revenue Structure
- Revenue Drivers
- Competitive Position
- Strategic Priorities
- Sector Context

---

## Topic Evolution

Provides:

- Emerging Topics
- Growing Topics
- Declining Topics
- Stable Topics

---

## Trust Artifacts

Provides:

- Commitment Tracking
- Narrative Consistency
- Accounting Stability

---

# Critical Constraint

Quarter Understanding never reads:

- Filing Text
- Earnings Call Text
- Raw MD&A
- Raw Financial Statements

Those responsibilities belong to Structured Intelligence.

Quarter Understanding only reads structured artifacts.

LOCKED.

---

# Business Question

Quarter Understanding answers:

1. What happened this period?
2. Why does it matter?
3. Is the change meaningful?
4. Does it align with historical company behavior?
5. Does management's explanation appear coherent?

---

# Interpretation Responsibilities

## Signal Clustering

Single signals rarely matter.

Quarter Understanding evaluates:

- Signal combinations
- Signal concentration
- Signal reinforcement
- Signal conflicts

Example:

COMMITMENT_OVERDUE

alone

is different from

COMMITMENT_OVERDUE
+
SEGMENT_REDEFINED
+
NON_GAAP_GAP_WIDENING

appearing together.

---

## Pattern Assessment

Quarter Understanding determines:

- First Occurrence
- Recurring Pattern
- Escalating Pattern
- Resolving Pattern

Example:

One overdue commitment

versus

four consecutive quarters of overdue commitments.

---

## Business Context Calibration

The same signal can have different meanings.

Example:

SEGMENT_REDEFINED

after acquisition

versus

SEGMENT_REDEFINED

after business underperformance.

Quarter Understanding uses Company Knowledge to interpret context.

---

## Narrative Coherence

Quarter Understanding evaluates:

Does management's explanation align with:

- Business Model
- Revenue Drivers
- Strategic Priorities
- Observable Signals

This is interpretation.

Not signal generation.

---

# Trust Interpretation

Quarter Understanding owns Trust Interpretation.

It does not own Trust Signals.

Trust Signals come from Business Signals.

Quarter Understanding explains what those signals mean together.

---

## Trust Interpretation Schema

```typescript
type TrustInterpretation = {
  period: string;

  signal_cluster: TrustSignal[];

  pattern_assessment:
    | "first_occurrence"
    | "recurring"
    | "escalating"
    | "resolving";

  business_context_calibration: string;

  narrative_coherence:
    | "coherent"
    | "partially_coherent"
    | "incoherent";

  trust_direction:
    | "strengthening"
    | "stable"
    | "weakening"
    | "deteriorating";

  interpretation_summary: string;

  confidence: StructuredConfidence;
}
```

---

# Output Structure

```typescript
type QuarterUnderstanding = {
  business_interpretation: BusinessInterpretation;

  trust_interpretation: TrustInterpretation;

  strategic_interpretation: StrategicInterpretation;

  overall_period_assessment: string;

  confidence: StructuredConfidence;
}
```

---

# LLM Usage

LLM REQUIRED.

Reason:

Investor interpretation requires judgment.

Deterministic systems can identify:

- What happened

They cannot reliably determine:

- Why it matters

Quarter Understanding is the correct location for this reasoning.

---

# Confidence Requirements

Confidence must be structured.

Never:

```json
{
  "confidence": 0.82
}
```

Instead:

```typescript
type StructuredConfidence = {
  overall: number;

  evidence_depth: number;

  signal_alignment: number;

  historical_coverage: number;

  explanation: string;
}
```

---

# Lineage Requirements

Every Quarter Understanding artifact must record:

- Prompt Version
- Prompt Snapshot
- Model Provider
- Model Version
- Input Hash
- Business Signal Versions
- Company Knowledge Version

This enables replayability.

---

# Evaluation Requirements

Quarter Understanding must be evaluated for:

---

## Grounding

Interpretation must trace to signals.

---

## Consistency

Interpretation must not contradict Company Knowledge.

---

## Trust Alignment

Trust interpretation must align with trust evidence.

---

## Historical Consistency

Large interpretation changes require supporting signal changes.

---

# Architectural Rules

## Rule 1

Quarter Understanding never generates signals.

LOCKED.

---

## Rule 2

Quarter Understanding never reads filing text.

LOCKED.

---

## Rule 3

Quarter Understanding interprets signals.

It does not detect them.

LOCKED.

---

## Rule 4

Trust verdicts originate here.

Trust signals do not.

LOCKED.

---

## Rule 5

Quarter Understanding is period-scoped.

Not company-scoped.

LOCKED.

---

# Relationship to Investor Intelligence

Quarter Understanding answers:

"What happened this period?"

Investor Intelligence answers:

"What should an owner understand across time?"

These are different scopes.

Quarter Understanding is one input into Investor Intelligence.

It is not Investor Intelligence itself.

LOCKED.

---

# Storage Structure

quarter-understanding/
├── current.json
├── archive/
├── evaluations/
└── lineage/

---

# Final Principle

Business Signals provide facts.

Quarter Understanding provides meaning.

Investor Intelligence provides ownership understanding.

Never collapse these layers.

LOCKED.