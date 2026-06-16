# 042-structured-intelligence-prompt-contract.md

Version: 1.0
Status: LOCKED
Owner: Structured Intelligence Layer

Inherits:
040-prompt-governance-spec.md

---

# Purpose

This contract governs the Structured Intelligence Prompt.

Structured Intelligence is the first intelligence-producing layer in the platform.

Its purpose is to transform:

```text
Raw Filing Content
```

into:

```text
Structured Business Understanding
```

for a single filing.

---

# Architectural Position

```text
Filing
   ↓

Themes
   ↓

Topic Assignment
   ↓

Structured Intelligence
   ↓

Company Knowledge

Business Signals

Quarter Understanding
```

---

# Core Question

The prompt answers:

```text
What does this filing tell us
about the business?
```

---

# Ownership

Structured Intelligence owns:

- business understanding
- management narrative extraction
- strategic understanding
- operating understanding
- competitive understanding
- business model understanding

Structured Intelligence does NOT own:

- durable knowledge
- trust assessment
- signal generation
- investor conclusions
- ownership thesis

---

# Core Responsibility

Transform:

```text
Current Filing
```

into:

```text
Structured Business Understanding
```

without using historical memory.

---

# Architectural Principle

Structured Intelligence is:

```text
Filing-Centric
```

not

```text
Company-Centric
```

---

# Reason

Company-centric understanding belongs to:

```text
Company Knowledge
```

---

# Input Contract

Required:

```typescript
type StructuredIntelligenceInput = {
  company: string;

  period: string;

  filing_type: string;

  filing_content: string;

  themes: ThemeOutput[];

  assigned_topics: TopicAssignment[];
};
```

---

# Allowed Inputs

Prompt may consume:

```text
Current Filing

Themes

Assigned Topics
```

---

# Forbidden Inputs

Prompt must NOT consume:

```text
Company Knowledge

Business Signals

Quarter Understanding

Investor Intelligence

Trust Artifacts

Concept Registry

Historical Filings
```

---

# Reason

Prevent:

```text
Future Leakage

Circular Reasoning

Knowledge Contamination
```

---

# Output Contract

Prompt must produce:

```typescript
type StructuredIntelligenceArtifact = {
  business_model: BusinessModelSection;

  products_services: ProductSection;

  customers_markets: CustomerMarketSection;

  competitive_positioning:
    CompetitivePositioningSection;

  growth_initiatives:
    GrowthInitiativesSection;

  operating_priorities:
    OperatingPrioritiesSection;

  capital_allocation:
    CapitalAllocationSection;

  management_commentary:
    ManagementCommentarySection;

  risks_observed:
    RiskObservationSection[];

  metadata: Metadata;
};
```

---

# Business Model Section

Purpose:

```text
Explain how the company creates value.
```

---

# Example

```text
Subscription Model

Transaction Model

Advertising Model

Enterprise Licensing
```

---

# Product Section

Purpose:

```text
What products and services
are discussed in the filing?
```

---

# Customer Section

Purpose:

```text
Who the company serves.
```

---

# Competitive Positioning

Purpose:

```text
How management describes
its market position.
```

---

# Important Rule

This section captures:

```text
Management Narrative
```

not objective truth.

---

# Allowed

```text
Management states
the company is a leader
in cloud infrastructure.
```

---

# Forbidden

```text
The company is
a market leader.
```

unless explicitly supported.

---

# Growth Initiatives

Purpose:

```text
What management is investing in
for future growth.
```

---

# Examples

```text
AI Expansion

Cloud Capacity

Geographic Expansion

Platform Investment
```

---

# Operating Priorities

Purpose:

```text
What management appears focused on.
```

---

# Examples

```text
Efficiency

Margin Improvement

Customer Retention

Execution Discipline
```

---

# Capital Allocation

Purpose:

```text
How capital is being deployed.
```

---

# Examples

```text
Buybacks

Acquisitions

R&D Investment

Debt Reduction
```

---

# Management Commentary

Purpose:

Capture notable management statements.

---

# Rules

Must be:

```text
Grounded

Attributed

Evidence-Based
```

---

# Risk Observations

Purpose:

Capture observed risks.

---

# Important Rule

Structured Intelligence may identify:

```text
Risks Mentioned
```

but not:

```text
Risk Severity

Trust Conclusions

Investor Risk
```

---

# Evidence Requirements

Every section requires evidence.

---

# Evidence Schema

```typescript
type EvidencePackage = {
  evidence_refs: EvidenceReference[];
};
```

---

# Evidence Rules

Every major conclusion must trace to:

```text
Filing Evidence
```

---

# Unsupported Conclusion

No evidence:

```text
Conclusion Rejected
```

---

# Hallucination Prevention

Prompt must not introduce:

```text
Products

Markets

Customers

Strategies

Competitors
```

not present in filing.

---

# Grounding Rules

All outputs must be grounded in:

```text
Current Filing
```

only.

---

# Historical Knowledge Rule

Prompt must NOT use:

```text
Prior Filings
```

even if available elsewhere.

---

# Narrative Extraction Rules

Structured Intelligence may summarize.

Structured Intelligence may organize.

Structured Intelligence may simplify.

Structured Intelligence may NOT reinterpret.

---

# Example

Allowed:

```text
Management highlighted
AI demand as a growth driver.
```

Forbidden:

```text
AI will become
the company's primary growth driver.
```

---

# Confidence Rules

Prompt does NOT generate confidence.

---

# Builder Computes

```typescript
type StructuredConfidence = {
  evidence_density: number;

  coverage_score: number;

  specificity_score: number;

  grounding_score: number;

  overall: number;
};
```

---

# Forbidden Output Fields

Prompt must NOT generate:

```text
Confidence

Trust Scores

Valuation Scores

Recommendations

Concept IDs
```

---

# Topic Usage Rules

Prompt may reference topics.

Prompt may NOT create:

```text
New Topic IDs
```

---

# Concept Registry Independence

Prompt must not generate:

```text
Concepts
```

Concept creation belongs later.

---

# Trust Boundary

Structured Intelligence must never assess:

```text
Management Credibility

Trustworthiness

Commitment Reliability
```

Those belong to:

```text
Trust Architecture
```

---

# Investor Boundary

Structured Intelligence must never answer:

```text
Should I own this business?

Will revenue grow?

Is valuation attractive?
```

---

# Evaluation Hooks

Supports evaluation of:

```text
Coverage

Specificity

Grounding

Hallucination Risk

Investor Relevance
```

---

# Evaluation Metrics

## Field Coverage

Measures:

```text
How much filing content
is represented.
```

---

## Evidence Utilization

Measures:

```text
Use of filing evidence.
```

---

## Specificity Score

Measures:

```text
Generic vs specific content.
```

---

## Hallucination Risk

Measures:

```text
Unsupported claims.
```

---

# Prompt Failure Conditions

Prompt fails if it:

Creates concepts

Creates trust conclusions

Creates investor conclusions

Creates recommendations

Uses historical knowledge

Produces unsupported claims

Generates confidence

---

# Recommendation Boundary

Forbidden language:

```text
Buy

Sell

Hold

Undervalued

Overvalued

Expected Return

Price Target
```

---

# Lineage Requirements

Artifact must record:

```typescript
type StructuredPromptLineage = {
  prompt_id: string;

  prompt_version: string;

  model_version: string;
};
```

---

# Replayability Requirements

Production execution:

```text
Temperature = 0
```

required.

---

# Scaling Requirements

Target:

```text
10,000+ companies
```

Must support:

- diverse industries
- multilingual filings
- deterministic generation
- replayability
- auditability

---

# Architectural Invariants

LOCKED.

1. Structured Intelligence is filing-centric.
2. Structured Intelligence does not use history.
3. Structured Intelligence does not generate durable knowledge.
4. Structured Intelligence does not assess trust.
5. Structured Intelligence does not generate concepts.
6. Structured Intelligence does not generate signals.
7. Every conclusion requires evidence.
8. Confidence is builder-generated.
9. Outputs represent business understanding, not investor understanding.
10. Structured Intelligence is the primary intelligence source for downstream layers.

End of Specification.