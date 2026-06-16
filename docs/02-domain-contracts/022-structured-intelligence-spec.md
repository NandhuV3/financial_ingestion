# 022-structured-intelligence-spec.md

Version: 1.0
Status: LOCKED
Owner: Business Understanding Layer

---

# Purpose

Structured Intelligence answers:

```text
What does this filing tell us about the business?
```

It transforms:

```text
Raw Filing
+
Themes
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
Structured Intelligence
    ↓
Company Knowledge Governance
    ↓
Company Knowledge
```

Structured Intelligence is:

```text
Filing-Scoped
```

not Company-Scoped.

---

# Core Responsibility

Extract structured business understanding from a single filing.

Generate:

- business model understanding
- revenue understanding
- customer understanding
- product understanding
- competitive understanding
- management understanding
- strategic understanding

for this filing only.

---

# Structured Intelligence Does NOT Do

Structured Intelligence never:

- maintain long-term memory
- update Company Knowledge directly
- create Business Signals
- perform trust assessment
- answer investor questions
- create recommendations
- compare periods

Those belong downstream.

---

# Design Principles

---

## Principle 1

Structured Intelligence is Filing Scoped.

Everything must be explainable from:

```text
This Filing
```

alone.

---

## Principle 2

Structured Intelligence is not memory.

It produces candidate understanding.

Company Knowledge decides what survives.

---

## Principle 3

Structured Intelligence may be wrong.

Company Knowledge Governance exists because of this.

---

## Principle 4

Structured Intelligence is LLM-driven.

Interpretation is allowed.

Hallucination is not.

---

## Principle 5

Evidence first.

Every conclusion must be traceable.

---

# Inputs

```typescript
type StructuredIntelligenceInputs = {
  filing: FilingArtifact;

  themes: ThemesArtifact;
};
```

---

# Output

```typescript
type StructuredIntelligenceArtifact = {
  artifact_type: "structured_intelligence";

  company: string;

  filing_id: string;

  filing_period: string;

  understanding: StructuredUnderstanding;

  confidence: StructuredIntelligenceConfidence;

  metadata: ArtifactMetadata;

  lineage: ArtifactLineage;
};
```

---

# Structured Understanding

```typescript
type StructuredUnderstanding = {
  business_model: BusinessModelUnderstanding;

  products: ProductUnderstanding[];

  customers: CustomerUnderstanding[];

  revenue_model: RevenueModelUnderstanding;

  revenue_drivers: RevenueDriverUnderstanding[];

  competitive_positioning: CompetitiveUnderstanding[];

  strategic_priorities: StrategicPriorityUnderstanding[];

  management_focus: ManagementFocusUnderstanding[];

  risks: RiskUnderstanding[];

  dependencies: DependencyUnderstanding[];
};
```

---

# Business Model

```typescript
type BusinessModelUnderstanding = {
  summary: string;

  value_creation: string;

  revenue_structure: string;

  confidence: number;

  evidence_refs: string[];
};
```

---

# Example

```text
Microsoft creates value through:

Cloud Infrastructure
Enterprise Software
Productivity Platforms
AI Services
```

---

# Products

```typescript
type ProductUnderstanding = {
  product_name: string;

  description: string;

  importance: "high" | "medium" | "low";

  confidence: number;

  evidence_refs: string[];
};
```

---

# Customers

```typescript
type CustomerUnderstanding = {
  customer_segment: string;

  description: string;

  confidence: number;

  evidence_refs: string[];
};
```

---

# Revenue Model

```typescript
type RevenueModelUnderstanding = {
  summary: string;

  recurring_components: string[];

  transactional_components: string[];

  confidence: number;

  evidence_refs: string[];
};
```

---

# Revenue Drivers

```typescript
type RevenueDriverUnderstanding = {
  driver: string;

  explanation: string;

  confidence: number;

  evidence_refs: string[];
};
```

---

# Competitive Positioning

```typescript
type CompetitiveUnderstanding = {
  position: string;

  supporting_reasoning: string;

  confidence: number;

  evidence_refs: string[];
};
```

---

# Strategic Priorities

```typescript
type StrategicPriorityUnderstanding = {
  priority: string;

  rationale: string;

  confidence: number;

  evidence_refs: string[];
};
```

---

# Management Focus

```typescript
type ManagementFocusUnderstanding = {
  focus_area: string;

  explanation: string;

  confidence: number;

  evidence_refs: string[];
};
```

---

# Risks

```typescript
type RiskUnderstanding = {
  risk: string;

  explanation: string;

  confidence: number;

  evidence_refs: string[];
};
```

---

# Dependencies

```typescript
type DependencyUnderstanding = {
  dependency: string;

  explanation: string;

  confidence: number;

  evidence_refs: string[];
};
```

---

# Evidence Requirements

Mandatory.

Every field must contain:

```typescript
evidence_refs: string[]
```

No evidence:

```text
No output.
```

---

# Evidence Format

```typescript
type EvidenceReference = {
  filing_section: string;

  paragraph_id: string;

  excerpt_hash: string;
};
```

---

# Hallucination Prevention

Structured Intelligence may only use:

```text
Filing
+
Themes
```

Inputs.

No external knowledge.

No market knowledge.

No prior filing knowledge.

No Company Knowledge.

---

# Confidence Model

```typescript
type StructuredIntelligenceConfidence = {
  overall: number;

  evidence_coverage: number;

  field_completeness: number;

  theme_utilization: number;

  hallucination_risk: number;
};
```

---

# Confidence Rules

High Confidence:

```text
Strong Evidence

+
Multiple References

+
Consistent Themes
```

---

Low Confidence:

```text
Sparse Evidence

or

Ambiguous Filing Language
```

---

# Theme Usage

Themes are inputs.

Themes are not outputs.

Structured Intelligence should consume themes.

Evaluation tracks:

```text
Theme Utilization
```

---

# Missing Information

Structured Intelligence never invents.

If information absent:

```text
Unknown
```

Not:

```text
Guessed
```

---

# Output Status

```typescript
type StructuredIntelligenceStatus =
  | "complete"
  | "partial"
  | "insufficient_filing";
```

---

# Partial

Used when:

```text
Some sections missing
```

---

# Insufficient Filing

Used when:

```text
Filing too sparse
```

to support understanding.

---

# Relationship to Company Knowledge

Critical Boundary.

---

## Structured Intelligence

Produces:

```text
Candidate Understanding
```

---

## Company Knowledge

Produces:

```text
Durable Understanding
```

---

# Example

Quarter 1:

```text
AI is strategic priority.
```

Quarter 2:

```text
Cloud expansion is strategic priority.
```

Structured Intelligence outputs both.

Company Knowledge decides:

```text
Promote
Merge
Retain
Review
```

Structured Intelligence never decides.

---

# Promotion Boundary

Structured Intelligence has:

```text
ZERO WRITE ACCESS
```

to Company Knowledge.

Promotion Governance owns all updates.

LOCKED.

---

# Invalidation Rules

Structured Intelligence becomes stale when:

- filing changes
- filing amendment arrives
- themes change
- prompt version changes
- model version changes

---

# Regeneration Rules

Regenerate whenever:

```text
Input Hash
```

changes.

---

# Evaluation Metrics

---

## Schema Compliance

Required.

100%.

---

## Field Coverage

Measures:

```text
Meaningful Fields
/
Available Fields
```

---

## Evidence Coverage

Measures:

```text
Fields With Evidence
/
Total Fields
```

---

## Theme Utilization

Measures:

```text
Themes Used
/
Themes Available
```

---

## Hallucination Risk

Measures:

```text
Unsupported Claims
/
Total Claims
```

---

## Investor Relevance

Human reviewed.

Does output capture:

```text
What matters?
```

---

# Prompt Requirements

Prompt must enforce:

1. Filing-only reasoning
2. Evidence grounding
3. No external knowledge
4. No recommendations
5. No trust conclusions
6. No investment language

---

# Structured Output Mode

Required.

No free-form responses.

LLM must generate:

```typescript
StructuredUnderstanding
```

schema only.

---

# Metadata

```typescript
type ArtifactMetadata = {
  schema_version: string;

  prompt_version: string;

  model_version: string;

  generated_at: string;

  artifact_version: number;
};
```

---

# Lineage

```typescript
type ArtifactLineage = {
  filing_version: number;

  themes_version: number;

  prompt_version: string;

  model_version: string;

  input_hash: string;
};
```

---

# Archive Strategy

```text
current.json

archive/
```

for every filing.

---

# Scaling Requirements

Target:

```text
10,000+ companies
```

---

# Performance Target

```text
< 60 seconds
```

per filing.

---

# Governance

Structured Intelligence outputs are:

```text
Candidate Intelligence
```

not Canonical Knowledge.

Every downstream promotion must pass:

```text
Company Knowledge Governance
```

before becoming durable truth.

---

# Architectural Invariants

The following are LOCKED:

1. Structured Intelligence is filing-scoped.
2. Structured Intelligence is LLM-driven.
3. Structured Intelligence never maintains memory.
4. Structured Intelligence cannot update Company Knowledge.
5. Every output requires evidence.
6. No external knowledge allowed.
7. No investor conclusions allowed.
8. No trust conclusions allowed.
9. Structured output mode is mandatory.
10. Company Knowledge Governance is the only promotion path.

End of Specification.