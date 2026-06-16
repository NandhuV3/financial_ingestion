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
Quarter Understanding
```

Investor Intelligence may not generate an artifact without Quarter Understanding.

LOCKED.

---

# Enrichment Inputs

Optional:

```text
Market Context
Industry Context
Valuation Context
Cross-Company Context
```

Future enrichment:

```text
Macro Context
Alternative Data
Portfolio Context
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
  market_context: EnrichmentInputStatus;
  industry_context: EnrichmentInputStatus;
  valuation_context: EnrichmentInputStatus;
  cross_company_context: EnrichmentInputStatus;
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

Q2 must be grounded in Quarter Understanding.

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

When:

```text
valuation_context.available = false
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
Valuation Context unavailable.
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
Market Context
Industry Context
Valuation Context
Cross-Company Context
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
Quarter Understanding
```

Optional lineage:

```text
Market Context
Industry Context
Valuation Context
Cross-Company Context
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
