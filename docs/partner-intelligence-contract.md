# Partner Intelligence Domain Contract

## Purpose

Partner Investing should make stocks feel like becoming a small partner in a real business. The intelligence pipeline already produces analyst-oriented artifacts: themes, topic assignments, topic evolution, quarter changes, investor insights, and investor narratives. Those artifacts are useful internally, but they are not the right contract for the future product experience.

The Partner Intelligence Domain is the translation layer between internal intelligence and the frontend:

```text
Intelligence Engine
    -> Partner Intelligence Domain
    -> Frontend Experience
```

The frontend should not need to understand `topic_id`, `importance_score`, `evidence_count`, `trend_state`, categories, filing sections, or prompt-specific fields. It should consume user-facing business concepts such as business health, company story, customers, money, trust, and forensics.

The objective is simple: a non-finance user should finish exploring the app and say, "I finally understand what this company actually does."

## Design Principles

- User-facing language only.
- No buy, sell, hold, target price, prediction, or trading language.
- No raw internal intelligence fields in product contracts.
- Preserve traceability through source metadata, not by exposing implementation details.
- Keep deterministic intelligence separate from AI-authored narrative.
- Design for partial data because some tabs will mature before others.

## Domain Hierarchy

The canonical frontend-facing aggregate is:

```ts
PartnerCompanyIntelligence
```

It contains:

- `CompanyProfile`
- `PartnerSummary`
- `CompanyStory`
- `CustomerSegment[]`
- `MoneyProfile`
- `TrustProfile`
- `ForensicsSignal[]`
- `PartnerIntelligenceSource[]`

This aggregate can power a full company page, while smaller models can power cards, tabs, and portfolio views.

## Domain Models

### CompanyProfile

Purpose: explain what the company does in plain language.

Consumers:

- Company header
- Search result cards
- Intro section of the company page

Fields:

```ts
{
  ticker: string;
  companyName: string;
  tagline: string;
  whatTheyDo: string;
  whoTheyServe: string;
}
```

Source Intelligence:

- Theme Intelligence
- Investor Narrative
- Filing metadata

Future Extensions:

- Business segment extraction
- Product taxonomy
- Customer and revenue segmentation
- Human-edited company descriptions

### PartnerSummary

Purpose: power Home cards and Portfolio cards with a short business-first summary.

Consumers:

- Home company cards
- Watchlist cards
- Portfolio company cards

Fields:

```ts
{
  headline: string;
  summary: string;
  businessHealth: "improving" | "stable" | "weakening";
  conviction: "low" | "medium" | "high";
}
```

Source Intelligence:

- Investor Narrative
- Investor Insight
- Topic Evolution
- Quarter Change Engine

Future Extensions:

- Multi-year consistency scoring
- Source confidence scoring
- Human analyst review

### CompanyStory

Purpose: power the Story tab.

Consumers:

- Company Story tab
- Onboarding explanations
- Educational product surfaces

Fields:

```ts
{
  whatTheyDo: string;
  whoBuys: string;
  whyTheyWin: string;
  whatCouldGoWrong: string;
}
```

Source Intelligence:

- Investor Narrative
- Investor Insight
- Theme Intelligence
- Risk themes

Future Extensions:

- Competitive advantage classification
- Business model extraction
- Segment-level story cards

### CustomerSegment

Purpose: explain who buys from the company and why.

Consumers:

- Customers tab
- Company story expansion

Fields:

```ts
{
  customerType: string;
  whyTheyBuy: string;
  importance?: "core" | "important" | "emerging";
}
```

Source Intelligence:

- Theme Intelligence
- Investor Narrative
- Management discussion sections

Future Extensions:

- Customer concentration analysis
- Segment revenue mapping
- Consumer vs enterprise segmentation

### MoneyProfile

Purpose: translate financial concepts into plain language.

Consumers:

- Money tab
- Educational finance explanations

Canonical translations:

| Investor Concept | Partner Language |
|---|---|
| Revenue | Daily Sales |
| Margin | What's Left After Costs |
| Debt | Loans To Expand |
| Cashflow | Money In The Drawer |

Fields:

```ts
{
  dailySales: PlainLanguageMetric;
  whatsLeftAfterCosts: PlainLanguageMetric;
  loansToExpand: PlainLanguageMetric;
  moneyInTheDrawer: PlainLanguageMetric;
  overallExplanation: string;
}
```

`PlainLanguageMetric`:

```ts
{
  label: string;
  plainLanguageName: string;
  explanation: string;
  status?: "improving" | "stable" | "weakening";
}
```

Source Intelligence:

- Theme Intelligence
- Quarter Change Engine
- Topic Evolution
- Future financial statement extraction

Future Extensions:

- Revenue growth normalization
- Margin trend analysis
- Balance sheet health
- Cash conversion quality

### TrustProfile

Purpose: power the Trust tab and separate business quality from short-term results.

Consumers:

- Trust tab
- Long-term owner education

Fields:

```ts
{
  managementQuality: string;
  longTermThinking: string;
  capitalAllocation: string;
  skinInTheGame: string;
  confidence: "low" | "medium" | "high";
  dataAvailability: "available" | "partial" | "not_available";
}
```

Source Intelligence:

- Investor Narrative
- Investor Insight
- Future proxy and ownership analysis

Current Limitation:

The present filing pipeline may only partially populate this model. The contract is intentionally designed now so the UI can support a Trust tab without depending on incomplete internal implementation details.

Future Extensions:

- Proxy statement ingestion
- Insider ownership
- Capital allocation history
- Buyback and dilution analysis
- Management tenure and compensation analysis

### ForensicsSignal

Purpose: power the Forensics tab with simple risk indicators.

Consumers:

- Forensics tab
- Risk badges
- Portfolio risk summaries

Fields:

```ts
{
  label: string;
  severity: "green" | "yellow" | "red";
  explanation: string;
}
```

Severity meaning:

- `green`: no obvious concern from available intelligence
- `yellow`: worth understanding before becoming a partner
- `red`: material concern that deserves careful review

Source Intelligence:

- Risk themes
- Quarter Change Engine
- Topic Evolution
- Investor Insight

Future Extensions:

- Accounting quality checks
- Restatement detection
- Debt covenant analysis
- Auditor changes
- Litigation and regulatory event tracking

### BusinessHealth

Purpose: translate internal topic and quarter-change signals into a simple status.

Type:

```ts
type BusinessHealth = "improving" | "stable" | "weakening";
```

Internal Mapping Guidance:

| Internal Intelligence | Partner Health Interpretation |
|---|---|
| More positive business topics, stable risks, improving operating themes | improving |
| Persistent strengths, no major negative changes, steady topic strength | stable |
| Rising risks, weakening topic strength, adverse quarter changes | weakening |

Important: Business health is not a stock rating. It does not mean buy, sell, cheap, expensive, or expected return. It describes the observed condition of the business using available intelligence.

Source Intelligence:

- Topic Evolution
- Quarter Change Engine
- Investor Insight
- Investor Narrative

Future Extensions:

- Multi-year business health trend
- Segment-specific health
- Confidence intervals based on source completeness

## Mapping Table

| Intelligence Artifact | Partner Domain |
|---|---|
| Investor Narrative | `PartnerSummary`, `CompanyStory`, `CompanyProfile` |
| Investor Insight | `PartnerSummary`, `CompanyStory`, `ForensicsSignal` |
| Topic Evolution | `BusinessHealth`, `PartnerSummary`, `MoneyProfile`, `ForensicsSignal` |
| Quarter Change Engine | `BusinessHealth`, `PartnerSummary`, `ForensicsSignal` |
| Theme Intelligence | `CompanyProfile`, `CompanyStory`, `CustomerSegment`, `MoneyProfile` |
| Filing Metadata | `PartnerCompanyIntelligence.asOfFilingDate`, `CompanyProfile.ticker`, `CompanyProfile.companyName` |

## What This Contract Avoids

The Partner Domain should not expose:

- `topic_id`
- `importance_score`
- `evidence_count`
- `trend_state`
- internal category names
- chunk IDs
- prompt-specific fields
- raw SEC filing structure

Those fields remain internal audit and intelligence-layer details.

## Architectural Risks

1. Oversimplification risk: translating complex intelligence into simple language can hide nuance. Mitigation: retain source metadata and allow expandable explanations.
2. False precision risk: `businessHealth` may look like a rating. Mitigation: document that it describes business condition, not investment advice.
3. Partial data risk: Trust and Money tabs may be incomplete until new extraction layers exist. Mitigation: include `dataAvailability` and plain-language fallbacks.
4. Drift risk: frontend teams may request internal fields for convenience. Mitigation: keep this contract as the boundary and add user-facing fields instead.
5. Narrative dependency risk: AI text can vary. Mitigation: use deterministic artifacts for structure and use narrative only for language.

## Recommended Next Phase

Phase 4.6 should build a deterministic Partner Domain adapter:

```text
Investor Narrative
Investor Insight
Topic Evolution
Quarter Change Engine
Theme Intelligence
    -> PartnerCompanyIntelligence
```

That phase should:

- Create `src/partner-domain/build-partner-intelligence.ts`
- Read existing artifacts only
- Avoid OpenAI calls
- Avoid SEC calls
- Generate `data/{ticker}/reports/partner-intelligence.json`
- Add contract tests for user-facing fields
- Verify no internal fields leak into the Partner Domain output
