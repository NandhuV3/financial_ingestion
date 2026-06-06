# Company Identity Intelligence

## Purpose

Company Identity Intelligence is the business-understanding layer for Partner Investing.

It separates deterministic evidence gathering from offline LLM synthesis.

## Architecture

```text
Themes
Topics
Insights
Narratives
Risks
Metadata
      ↓
Company Identity Evidence Builder
      ↓
company-identity.evidence.json
      ↓
Offline Company Identity Enrichment
      ↓
company-identity.enriched.json
```

No runtime API request calls an LLM. No frontend code calls an LLM.

## Evidence Model

```ts
type CompanyIdentityEvidence = {
  company: string;
  themes: string[];
  topics: string[];
  products: string[];
  customers: string[];
  risks: string[];
  opportunities: string[];
  narrative_summary?: string;
  filing_dates: string[];
};
```

Evidence is deterministic. It gathers signals from existing structured artifacts and should not explain what the business means.

## Identity Quality Rules

Company identity quality depends on keeping evidence, synthesis, and validation separate.

### Evidence Principles

Evidence should describe what the business actually does, not generic industry language.

The evidence builder should prefer signals that have support from multiple structured sources such as:

```text
themes
approved topic assignments
investor insight
investor narrative
filing metadata
```

Avoid weak product labels unless strongly supported:

```text
digital services
technology solutions
business services
```

Risk evidence remains useful, but it must not be mixed into product, customer, revenue driver, competitive advantage, or operating capability synthesis.

### Prompt Principles

The enrichment prompt defines the business identity fields narrowly:

```text
business_description
  One plain-language sentence answering what the company provides and who pays for it.

revenue_drivers
  How the company earns money.

competitive_signals
  Why customers continue choosing the company.

operating_signals
  Capabilities required to run the business.
```

Good revenue driver examples:

```text
software subscriptions
cloud computing consumption
advertising spend
payment transaction volume
marketplace fees
semiconductor demand
```

Bad revenue driver examples:

```text
revenue growth
margin expansion
AI investment
quarterly performance
theme names
opportunity statements
```

Good competitive signal examples:

```text
brand trust
ecosystem strength
switching costs
network effects
developer ecosystem
scale advantages
```

Bad competitive signal examples:

```text
competition risk
regulatory pressure
competitor descriptions
market pressure
```

Good operating signal examples:

```text
cloud infrastructure
logistics network
manufacturing capability
developer platform ecosystem
global distribution network
```

Bad operating signal examples:

```text
margin pressure
supplier risk
competition
macroeconomic pressure
inflation
```

### Validation Principles

The enrichment validator rejects outputs that are obviously not identity intelligence.

Rejected examples include:

```text
Revenue Drivers:
- Cloud Revenue Growth
- AI investment
- margin expansion

Competitive Signals:
- intense competition
- market pressure
- regulatory pressure

Operating Signals:
- supplier limitations
- inflation pressure
- competition
```

The validator intentionally rejects rather than silently rewriting these values. This keeps offline enrichment auditable and prevents weak artifacts from flowing into Partner Domain outputs.

## Enrichment Model

```ts
type CompanyIdentityEnriched = {
  company: string;
  business_description: string;
  primary_products: string[];
  primary_customers: string[];
  revenue_drivers: string[];
  business_model_signals: string[];
  competitive_signals: string[];
  operating_signals: string[];
  enrichment: {
    model: string;
    generated_at: string;
    input_hash: string;
  };
};
```

The LLM may synthesize:

```text
business_description
primary_products
primary_customers
revenue_drivers
business_model_signals
competitive_signals
operating_signals
```

The LLM must not modify:

```text
themes
topics
risks
opportunities
evidence
```

## Commands

```bash
npm run identity:company:evidence -- MSFT
npm run identity:company:enrich -- MSFT
```

`identity:company:evidence` uses local artifacts only.

`identity:company:enrich` may call OpenAI, but only offline and only when the evidence hash has changed.

## Hash Strategy

The enrichment input hash is calculated from normalized `company-identity.evidence.json`.

If `company-identity.enriched.json` exists and its `enrichment.input_hash` matches the current evidence hash:

```text
skip enrichment
```

If evidence changes:

```text
regenerate enrichment
```

## Fallback Hierarchy

Future Partner Domain integration should use:

```text
identity.enriched
  ↓
identity.evidence
  ↓
metadata fallback
```

This phase does not wire identity into Partner Domain or frontend behavior.

## Ownership Boundaries

Deterministic layer owns:

```text
themes
topics
risks
opportunities
evidence gathering
```

LLM enrichment owns:

```text
semantic business identity
business model explanation
customer/product synthesis
competitive and operating signal synthesis
```

## Identity To Profile Consolidation

Company Identity is the single source of truth for business understanding.

Company Profile is a presentation layer. It may preserve display facts and compatibility artifacts, but it must not generate competing business descriptions, business models, competitive advantages, or customer value propositions.

### Ownership Matrix

| Concept | Owner |
| --- | --- |
| Business Description | Company Identity |
| Primary Products | Company Identity |
| Primary Customers | Company Identity |
| Revenue Drivers | Company Identity |
| Business Model Signals | Company Identity |
| Competitive Signals | Company Identity |
| Operating Signals | Company Identity |
| Business Risks | Deterministic evidence / Company Profile display |
| Partner Summary | Partner Domain formatting |
| Story Formatting | Partner Domain formatting |
| Customer Explanation Formatting | Partner Domain formatting |

Partner Domain builders should consume `src/company-identity/company-identity-accessors.ts` for business-understanding fields. They should use Company Profile only for presentation-oriented fallback facts and risk display.
