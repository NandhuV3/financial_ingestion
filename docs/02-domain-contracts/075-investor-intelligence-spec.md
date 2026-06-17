# 075-investor-intelligence-spec.md

Status: LOCKED

Version: 1.0

Purpose:

Defines the Investor Intelligence domain.

Investor Intelligence converts business understanding into investor-facing intelligence.

Investor Intelligence owns the Q1–Q5 framework.

Investor Intelligence is the final intelligence layer in the platform.

Partner Domain presents Investor Intelligence.

Partner Domain does not generate Investor Intelligence.

LOCKED.

---

# Architectural Position

```text
Company Knowledge
        ↓

Business Signals
        ↓

Quarter Understanding
        ↓

Investor Intelligence
        ↓

Partner Domain
```

LOCKED.

---

# Mission

Investor Intelligence answers:

```text
What should an investor understand?
```

Investor Intelligence transforms:

```text
Business Understanding
```

into:

```text
Investor Understanding
```

LOCKED.

---

# Owns

Investor Intelligence owns:

* Q1 Business
* Q2 Money
* Q3 Trust
* Q4 Price
* Q5 Reason

Investor Intelligence owns:

* Cross-dimension synthesis
* Investor framing
* Evidence-backed investor understanding
* Final intelligence generation
* Depth propagation
* Investor narrative generation

LOCKED.

---

# Does Not Own

Investor Intelligence does NOT own:

* Filing understanding
* Themes
* Topic Assignment
* Topic Evolution
* Company Knowledge
* Business Signals
* Trust Signal generation
* Quarter Understanding
* Valuation models
* Buy recommendations
* Sell recommendations
* Portfolio allocation
* Trade execution
* Partner Domain presentation

LOCKED.

---

# Artifact Model

Investor Intelligence is a:

```text
Single Artifact
```

Investor Intelligence is NOT:

```text
Five Separate Artifacts
```

Q1–Q5 are sections of a single artifact.

LOCKED.

---

# Required Inputs

Required:

```text
Company Knowledge

Quarter Understanding
```

Investor Intelligence may not generate an artifact without:

```text
Company Knowledge

Quarter Understanding
```

LOCKED.

---

# Enrichment Inputs

Optional:

```text
Business Signals

Trust Signals

Commitment Tracking

Topic Evolution

Prior Investor Intelligence

Market Data
```

Enrichment scope:

```text
Business Signals: Q2 only

Trust Signals: conditional exception only

Commitment Tracking: Q3 longitudinal depth only

Topic Evolution: longitudinal context

Prior Investor Intelligence: historical continuity

Market Data: Q4 only
```

Missing enrichment reduces depth.

Missing enrichment does not block artifact generation.

LOCKED.

---

# Artifact Enrichment Pattern

Investor Intelligence follows:

```text
018-artifact-enrichment-pattern.md
```

LOCKED.

---

# Enrichment Status

```ts
type EnrichmentInputStatus = {
  available: boolean;
  artifact_path: string | null;
  artifact_version: number | null;
  absent_reason: string | null;
};
```

```ts
type EnrichmentStatus = {
  business_signals: EnrichmentInputStatus;
  trust_signals: EnrichmentInputStatus;
  commitment_tracking: EnrichmentInputStatus;
  topic_evolution: EnrichmentInputStatus;
  prior_investor_intelligence: EnrichmentInputStatus;
  market_data: EnrichmentInputStatus;
};
```

LOCKED.

---

# Depth Indicator

```ts
type DepthIndicator = {
  overall:
    | "base"
    | "standard"
    | "full";

  trust_dimension:
    | "present"
    | "absent";

  longitudinal_dimension:
    | "present"
    | "absent";
};
```

Investor Intelligence inherits depth constraints from Quarter Understanding.

Only:

```text
trust_dimension
longitudinal_dimension
```

participate in depth propagation.

Other enrichment inputs are represented through:

```text
enrichment_status
```

only.

LOCKED.

---

# Q1-Q5 Section Contracts

```ts
type SectionLimitations = {
  limitations: string[];
};
```

```ts
type Q1Business = {
  summary: string;

  strengths: string[];

  weaknesses: string[];

  evidence_refs: string[];

  limitations: string[];
};
```

```ts
type Q2Money = {
  summary: string;

  revenue_quality: string;

  margin_quality: string;

  cash_generation_quality: string;

  evidence_refs: string[];

  limitations: string[];
};
```

```ts
type Q3Trust = {
  summary: string;

  trust_assessment: string | null;

  trust_depth_limitation: string | null;

  evidence_refs: string[];

  limitations: string[];
};
```

```ts
type Q4Price = {
  summary: string;

  expectation_context: string;

  valuation_depth_limitation: string | null;

  evidence_refs: string[];

  limitations: string[];
};
```

```ts
type Q5Reason = {
  bull_case: string[];

  bear_case: string[];

  key_drivers: string[];

  key_risks: string[];

  evidence_refs: string[];

  limitations: string[];
};
```

LOCKED.

---

# Q1 Business

Q1 answers:

```text
How good is the business?
```

Q1 owns:

* Business quality synthesis
* Competitive position synthesis
* Strategic position synthesis
* Customer strength synthesis
* Product strength synthesis

Q1 must be grounded in Quarter Understanding.

LOCKED.

---

# Q2 Money

Q2 answers:

```text
How strong is the economic engine?
```

Q2 owns:

* Revenue quality synthesis
* Margin quality synthesis
* Cash generation synthesis
* Capital efficiency synthesis
* Financial durability synthesis

Q2 must be grounded in:

```text
Company Knowledge

Quarter Understanding
```

Q2 may consume:

```text
Business Signals
```

only as Q2 enrichment.

Q2 does not generate Business Signals.

LOCKED.

---

# Q3 Trust

Q3 answers:

```text
Can management be trusted?
```

Q3 owns:

* Trust synthesis
* Management credibility synthesis
* Commitment assessment synthesis
* Narrative consistency synthesis

Q3 consumes trust interpretation from Quarter Understanding.

Q3 does not generate Trust Signals.

Q3 may consume Trust Signals directly only when:

```text
quarter_understanding.depth_indicator.trust_dimension = "absent"
```

When:

```text
quarter_understanding.depth_indicator.trust_dimension = "present"
```

Trust Signals must not be consumed directly.

Quarter Understanding remains the sole trust interpretation source.

Commitment Tracking may be consumed only for Q3 longitudinal depth enrichment.

Investor Intelligence must not consume Trust pillar artifacts other than the explicit Commitment Tracking longitudinal-depth exception.

LOCKED.

---

# Q3 Trust Rules

When:

```text
trust_dimension = absent
```

Q3 may not generate:

```text
Trust Verdicts

Management Credibility Conclusions

Trust Conclusions
```

Q3 must explicitly record:

```text
Trust Depth Limitation
```

Validation must enforce:

```text
If quarter_understanding.depth_indicator.trust_dimension = "present",
trust_signals must not be present in the Q3 context.

If quarter_understanding.depth_indicator.trust_dimension = "absent",
trust_signals may be present only as the conditional fallback source.
```

LOCKED.

---

# Q4 Price

Q4 answers:

```text
What is already reflected in expectations?
```

Q4 owns:

* Expectation framing
* Price context framing
* Market expectation interpretation

Q4 does NOT own:

```text
Target Prices

Discounted Cash Flow Models

Trading Signals
```

Q4 may NOT generate:

* Target Prices
* Intrinsic Value
* Fair Value
* Margin of Safety
* Expected Return
* Upside Percentage
* Downside Percentage
* Discounted Cash Flow Valuations
* Relative Valuation Scores
* Buy/Sell Recommendations

Unless a future Valuation Architecture explicitly owns those outputs.

LOCKED.

---

# Q4 Valuation Context Rule

Sprint 11 behavior:

```text
Q4.status = "insufficient_data"

Q4.absent_reason = "market_data_unavailable"
```

Market data integration is deferred.

Valuation methodology is future work and is not implemented in Sprint 11.

When:

```text
market_data.available = false
```

Q4 must:

```text
Record:

valuation_depth_limitation
```

Q4 may not generate:

* Valuation-sensitive conclusions
* Cheap/Expensive conclusions
* Mispricing conclusions
* Price targets

LOCKED.

---

# Ownership Boundary

Investor Intelligence synthesizes.

Investor Intelligence does not:

* Generate signals
* Reinterpret raw trust evidence
* Consume trust pillar artifacts except Commitment Tracking for Q3 longitudinal depth
* Consume Quarter Change directly
* Produce buy/sell/hold recommendations
* Produce price targets

LOCKED.

---

# Replayability

Investor Intelligence must support replay through:

```text
per_question_input_hashes

coherence_hash

artifact lineage

deterministic context assembly
```

Each Q1-Q5 section must record the input hash for the exact question context used.

The artifact must record a coherence hash over the assembled Q1-Q5 outputs and shared context.

Lineage must include required inputs and every enrichment input actually used.

Context assembly must be deterministic and must not depend on unordered input traversal.

LOCKED.

---

# Q5 Reason

Q5 answers:

```text
Why might this investment work or fail?
```

Q5 owns:

* Bull case synthesis
* Bear case synthesis
* Key drivers synthesis
* Key risks synthesis

Q5 synthesizes:

```text
Q1
Q2
Q3
Q4
```

Q5 may explain.

Q5 may synthesize.

Q5 may identify drivers and risks.

Q5 may NOT generate:

* Buy
* Sell
* Hold
* Accumulate
* Reduce
* Enter Position
* Exit Position
* Portfolio Allocation Instructions
* Trade Instructions

Investor Intelligence explains.

Investors decide.

LOCKED.

---

# Section-Level Limitation Rules

Each Q1-Q5 section must expose:

```ts
limitations: string[]
```

Examples:

Q3:

```text
Trust Signals unavailable.
```

Q4:

```text
Market Data unavailable.
```

Q1:

```text
Longitudinal Context unavailable.
```

Section limitations must be surfaced to Partner Domain.

LOCKED.

---

# Consumer Contract

Investor Intelligence must inspect:

```text
Quarter Understanding
Depth Indicator
Enrichment Status
```

before generating conclusions.

Investor Intelligence may not assume enrichment exists.

Partner Domain and downstream consumers must inspect:

```text
depth_indicator
enrichment_status
```

before generating conclusions dependent on:

```text
Business Signals
Trust Signals
Commitment Tracking
Topic Evolution
Prior Investor Intelligence
Market Data
```

LOCKED.

---

# Depth Propagation Rule

Investor Intelligence may not be deeper than its shallowest required input.

LOCKED.

---

# Longitudinal Rule

When:

```text
longitudinal_dimension = absent
```

Investor Intelligence may not generate:

```text
Multi-Period Trend Conclusions

Sustained Improvement Conclusions

Long-Term Momentum Conclusions
```

LOCKED.

---

# Concept Rule

Concept Registry availability is inherited through:

```text
Quarter Understanding enrichment_status
```

Investor Intelligence does not consume:

```text
Concept Registry
```

directly.

When Concept Registry is unavailable through Quarter Understanding enrichment status, Investor Intelligence may not assume concept-normalized understanding.

LOCKED.

---

# Confidence

```ts
type InvestorIntelligenceConfidence = {
  overall: number;

  q1_score: number;

  q2_score: number;

  q3_score: number;

  q4_score: number;

  q5_score: number;

  grounding_score: number;

  evidence_coverage_score: number;
};
```

Values must be in:

```text
[0,1]
```

Confidence is builder-owned.

The prompt may not generate confidence.

LOCKED.

---

# Evaluation Hooks

```ts
type InvestorIntelligenceEvaluationHooks = {
  prompt_version: string;

  model_version: string;

  q1_present: boolean;

  q2_present: boolean;

  q3_present: boolean;

  q4_present: boolean;

  q5_present: boolean;

  depth: DepthIndicator;

  enrichment_status: EnrichmentStatus;
};
```

Evaluation hooks are metadata only.

Evaluation hooks do not execute evaluation.

Evaluation hooks do not define scoring logic.

LOCKED.

---

# Investor Intelligence Artifact Content

```ts
type InvestorIntelligenceArtifactContent = {
  company_id: string;

  period_id: string;

  q1_business: Q1Business;

  q2_money: Q2Money;

  q3_trust: Q3Trust;

  q4_price: Q4Price;

  q5_reason: Q5Reason;

  enrichment_status: EnrichmentStatus;

  depth_indicator: DepthIndicator;

  confidence: InvestorIntelligenceConfidence;

  evaluation_hooks: InvestorIntelligenceEvaluationHooks;
};
```

Artifact ownership belongs to:

```text
Artifact Framework
```

Investor Intelligence does not own:

```text
artifact_id
metadata
lineage
versioning
persistence
```

LOCKED.

---

# Evaluation Requirements

Investor Intelligence should be evaluated for:

* Grounding quality
* Q1 quality
* Q2 quality
* Q3 quality
* Q4 quality
* Q5 quality
* Depth propagation correctness
* Evidence coverage
* Trust limitation compliance

LOCKED.

---

# Replayability

Investor Intelligence must be replayable.

Required lineage:

```text
Company Knowledge

Quarter Understanding
```

Optional lineage:

```text
Business Signals
Trust Signals
Commitment Tracking
Topic Evolution
Prior Investor Intelligence
Market Data
```

LOCKED.

---

# Governance Rules

Investor Intelligence may generate conclusions.

Investor Intelligence may not generate:

```text
Buy Recommendations

Sell Recommendations

Portfolio Instructions

Trade Instructions
```

Investor Intelligence explains.

Investors decide.

LOCKED.

---

# Final Principle

Investor Intelligence owns:

```text
Q1 Business
Q2 Money
Q3 Trust
Q4 Price
Q5 Reason
```

Partner Domain presents Investor Intelligence.

Investor Intelligence remains the final intelligence layer of the platform.

LOCKED.
