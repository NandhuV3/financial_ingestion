# 005-quarter-understanding.md

# Purpose

Quarter Understanding is the first LLM-assisted interpretation layer in the platform.

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

Quarter Understanding
        ↓

Investor Intelligence

Enrichment inputs:

```text
Trust Signals
Topic Evolution
Concept Registry
```

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
- Current period business significance or Current period significance assessment

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

## Required Inputs

Quarter Understanding may generate a valid artifact when these inputs are available:

- Company Knowledge
- Business Signals

Without required inputs:

```text
Artifact Generation = Not Allowed
```

---

## Enrichment Inputs

Quarter Understanding may consume these inputs when available:

- Trust Signals
- Topic Evolution
- Concept Registry

Without enrichment inputs:

```text
Artifact Generation = Allowed
Artifact Depth = Reduced
```

Enrichment inputs increase artifact depth.

They do not change ownership.

---

## Business Signals

Provides:

- Business Signals
- Strategic Signals
- Operational Signals
- Quarter-over-quarter observations through movement signals

Quarter Understanding receives quarter-over-quarter observations exclusively through Business Signals movement signals and must not consume QuarterChangeArtifact directly.

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

Enrichment input.

Provides:

- Emerging Topics
- Growing Topics
- Declining Topics
- Stable Topics

---

## Trust Signals

Enrichment input.

Trust follows this governed flow:

```text
Trust Pillars
        ↓
Trust Signals
        ↓
Quarter Understanding
```

Provides:

- Trust observations generated from Commitment Tracking
- Trust observations generated from Narrative Consistency
- Trust observations generated from Accounting Stability
- Trust observations generated from Capital Allocation Tracking

Quarter Understanding never consumes Trust Pillars directly.

All trust observations arrive through Trust Signals.

---

# Critical Constraint

Quarter Understanding never reads:

- Quarter Change Artifact
- Commitment Tracking Artifact
- Narrative Consistency Artifact
- Accounting Stability Artifact
- Capital Allocation Tracking Artifact
- Filing Text
- Earnings Call Text
- Raw MD&A
- Raw Financial Statements
- Investor Intelligence

Quarter-over-quarter observations arrive exclusively through Business Signals
movement signals.

Trust observations arrive exclusively through Trust Signals.

Raw filing responsibilities belong to Structured Intelligence.

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

Trust Signals come from Trust Architecture.

When Trust Signals are available, Quarter Understanding explains what those signals mean together.

When Trust Signals are absent, Quarter Understanding must record reduced depth and must not generate trust conclusions.

---

# Enrichment Status

Quarter Understanding artifacts must expose enrichment availability.

```typescript
type EnrichmentInputStatus = {
  available: boolean;
  artifact_path: string | null;
  artifact_version: number | null;
  absent_reason: string | null;
};

type EnrichmentStatus = {
  trust_signals: EnrichmentInputStatus;

  topic_evolution: EnrichmentInputStatus;

  concept_registry: EnrichmentInputStatus;
};
```

The artifact paths and versions in enrichment status are Artifact
Framework-provided references to upstream artifacts. Quarter Understanding does
not own upstream artifact identity, versioning, or storage mechanics.

---

# Depth Indicator

Quarter Understanding artifacts must expose interpretation depth.

```typescript
type DepthIndicator = {
  overall: "base" | "standard" | "full";

  trust_dimension:
    | "present"
    | "absent";

  longitudinal_dimension:
    | "present"
    | "absent";
};
```

Base means Company Knowledge and Business Signals are present.

Standard means at least one enrichment dimension is present.

Full means all supported enrichment dimensions are present.

---

# Consumer Contract

Investor Intelligence consumers must inspect depth indicators.

Investor Intelligence must propagate depth limitations.

Investor Intelligence must not generate trust conclusions when:

```text
trust_dimension = absent
```

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

LLM-ASSISTED.

Quarter Understanding is the first interpretation layer in the platform.

This is a locked architecture decision.

Reason:

Investor interpretation requires judgment.

Deterministic systems can identify:

- What happened

They cannot reliably determine:

- Why it matters

Quarter Understanding is the correct location for this reasoning.

LLM execution requirements:

- Temperature = 0
- Model version must be pinned
- Prompt version must be resolved through the Prompt Registry
- Inputs and outputs must remain replayable

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

# Replayability Metadata

Quarter Understanding owns generation of the following content-level
replayability metadata:

- `prompt_version`
- `model_version`
- prompt lineage
- input hashes
- output hashes
- evaluation hooks
- enrichment status
- depth indicators

Prompt lineage includes the governed prompt snapshot reference and model
provider required to reproduce execution.

Input references must include the Company Knowledge and Business Signals
versions and every enrichment artifact actually used.

This metadata is not Artifact Framework lineage.

Artifact Framework owns:

- artifact identity
- artifact metadata
- Artifact Framework lineage
- artifact versioning
- persistence
- current pointer
- archive/history
- framework-level hashes

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

Trust interpretations may originate here when Trust Signals are available.

Trust verdicts do not.

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

# Storage Ownership

Quarter Understanding does not own storage mechanics.

Artifact storage, persistence, current-pointer resolution, archive/history, and
framework lineage are managed by the Artifact Framework.

---

# Final Principle

Business Signals provide facts.

Quarter Understanding provides meaning.

Investor Intelligence provides ownership understanding.

Never collapse these layers.

LOCKED.
