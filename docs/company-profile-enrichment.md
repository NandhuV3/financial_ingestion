# Company Profile Enrichment

## Purpose

Company Profile Enrichment improves the plain-language quality of Company Profile Intelligence without making the API or frontend dependent on live LLM calls.

The raw profile remains the source of factual correctness. Enrichment is optional, offline, cached, and persisted.

## Architecture

```text
Existing structured intelligence artifacts
        ↓
Deterministic Company Profile Builder
        ↓
company-profile.raw.json
        ↓
Optional offline enrichment command
        ↓
company-profile.enriched.json
        ↓
company-profile.json
        ↓
Partner API read path
```

Partner API fallback order:

```text
company-profile.enriched.json
  ↓
company-profile.raw.json
  ↓
company-profile.json
  ↓
in-memory deterministic fallback
```

## Raw Profile Schema

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

Raw profile fields are generated deterministically from existing structured artifacts. They are fact-like and should not explain what the business means.

## Enriched Profile Schema

```ts
type CompanyProfileEnriched = {
  company: string;
  products: string[];
  customers: string[];
  business_risks: string[];
  themes: string[];
  topics: string[];
  source_filings: string[];
  business_model: string;
  competitive_advantages: string[];
  customer_value_proposition: string;
  profile_quality: "enriched";
  enrichment: {
    model: string;
    generated_at: string;
    input_hash: string;
  };
};
```

The enrichment layer owns:

```text
business_model
competitive_advantages
customer_value_proposition
```

The enrichment layer must not modify:

```text
products
customers
business_risks
themes
topics
source_filings
risk classifications
```

## Command

```bash
npm run enrich:company-profile -- MSFT
```

This command is offline and may call OpenAI. It is never called by the frontend or Partner API request path.

## Hash Strategy

The enrichment input hash is calculated from a normalized raw profile:

```text
hash(company-profile.raw.json deterministic fields)
```

If `company-profile.enriched.json` already exists and its `enrichment.input_hash` matches the current raw profile hash:

```text
skip enrichment
```

If the raw profile changes:

```text
regenerate enrichment
```

This prevents unnecessary LLM usage while keeping enriched output tied to deterministic inputs.

## Operational Rules

No runtime LLM calls:

```text
API requests only read persisted artifacts.
Frontend never calls LLMs.
Enrichment is an explicit offline command.
```

System resilience:

```text
If enrichment is missing, Partner API uses raw profile.
If raw profile is missing, Partner API can build an in-memory deterministic profile from existing artifacts.
```

## Cost Profile

Expected input is small: one raw profile artifact plus instructions.

Typical estimate:

```text
Input: 500-1,500 tokens
Output: 100-400 tokens
Cost tier: low
```

At scale, cost is controlled by input hashing. Unchanged raw profiles skip enrichment entirely.
