# Company Profile Intelligence

## Purpose

Company Profile Intelligence is the lightweight presentation artifact layer that feeds Partner Domain builders.

The Partner Domain should explain a company in plain language, but that language must come from generated intelligence artifacts, not ticker-specific code. Adding a new company should require ingestion and intelligence generation, not editing frontend or Partner Domain builders.

## Ownership Model

`src/company-profile/` owns Company Profile Intelligence.

Company Profile no longer owns business understanding. That responsibility moved to Company Identity.

```text
Company Identity = business understanding
Company Profile = presentation facts and formatting support
```

Company Identity owns:

```text
business_description
primary_products
primary_customers
revenue_drivers
business_model_signals
competitive_signals
operating_signals
```

Company Profile owns:

```text
profile presentation
products/customers fallback facts
business risk display facts
themes/topics/source filing references
```

Partner Domain builders consume Company Identity for meaning and Company Profile for display-oriented supporting facts. They should not own company-specific narratives, ticker maps, or encyclopedia-style descriptions.

## Artifact Schema

```ts
type CompanyProfileRaw = {
  company: string;
  products: string[];
  customers: string[];
  business_risks: string[];
  themes: string[];
  topics: string[];
  source_filings: string[];
  profile_quality: "raw";
};
```

Raw profile fields are deterministic, fact-like outputs derived from existing intelligence artifacts.

Legacy `company-profile.enriched.json` artifacts may exist for backward compatibility, but Company Profile enrichment is retired. New business descriptions, competitive signals, business model language, and customer value propositions must come from Company Identity.

## Ownership Matrix

| Concept | Owner |
| --- | --- |
| Business Description | Company Identity |
| Primary Products | Company Identity |
| Primary Customers | Company Identity |
| Revenue Drivers | Company Identity |
| Competitive Signals | Company Identity |
| Operating Signals | Company Identity |
| Partner Summary | Company Profile + Partner Domain formatting |
| Story Formatting | Company Profile + Partner Domain formatting |
| Customer Explanation Formatting | Company Profile + Partner Domain formatting |
| Business Risk Display | Company Profile |

## Builder Flow

```text
Filing metadata
Themes
Topic assignments
Topic evolution
Investor insight
Investor narrative
        ↓
buildCompanyProfileIntelligence()
        ↓
data/{ticker}/company-profile/company-profile.raw.json
        ↓
Partner Domain builders
        ↓
Partner Intelligence API
```

The raw builder is deterministic. It uses existing structured artifacts and generic keyword/signal extraction. It does not call OpenAI, read raw filings, use embeddings, or use ticker-specific branches.

The `enrich:company-profile` command remains as a compatibility command, but it now reports `skipped` because Company Identity owns business understanding.

## Relationship To Partner Intelligence

Partner Intelligence is the frontend-facing aggregate:

```text
profile
summary
story
customers
money
trust
forensics
```

Company Identity supplies business understanding for those sections. Company Profile supplies presentation facts and display-oriented fallback data. Partner Domain builders translate these artifacts into product-facing sections without exposing internal details such as topic IDs, evidence counts, or trend states.

## Fallback Behavior

Partner API fallback order:

```text
company-profile.raw.json
  ↓
company-profile.json
  ↓
in-memory deterministic fallback
```

If persisted profile artifacts are missing, the Partner Domain builder can construct an in-memory raw profile from the available filing-level artifacts. This keeps the API resilient while preserving persisted artifacts as the preferred source.

Business understanding fallback now goes through Company Identity:

```text
company-identity.enriched.json
  ↓
company-identity.evidence.json
  ↓
company-profile raw facts
```

Fallbacks do not introduce ticker-specific narratives.

## Guardrails

Allowed in `business-language.ts`:

```text
formatting helpers
sentence cleanup
deduplication helpers
```

Not allowed:

```text
ticker maps
company summaries
company descriptions
company-specific customer narratives
```

## Future Extensions

Future deterministic extraction can improve raw facts by adding:

```text
product taxonomy
customer taxonomy
management/trust signals
source traceability
artifact freshness metadata
```

Future profile work should improve presentation formatting, source traceability, and display metadata. It should not reintroduce business-model, competitive-advantage, or customer-value synthesis into Company Profile.
