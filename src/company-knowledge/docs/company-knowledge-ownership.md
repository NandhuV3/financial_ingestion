# Company Knowledge Ownership Contract

Company Knowledge is the future source-of-truth contract for durable business understanding.

It defines what the platform knows about a company as a business, independent of quarter-specific changes, presentation copy, health dashboards, owner questions, or investment recommendations.

This document is schema and ownership only. It does not define builders, storage paths, enrichment prompts, commands, or generated artifacts.

## Final Schema

```ts
type CompanyKnowledge = {
  company: string;

  business_model: {
    value_creation: string;
    monetization: string;
    revenue_structure:
      | "recurring"
      | "transactional"
      | "project"
      | "mixed";
  };

  products: string[];

  customers: string[];

  revenue_drivers: string[];

  competitive_positioning: {
    signal: string;
    source_type:
      | "claimed"
      | "observed";
  }[];

  operating_model: string[];

  key_dependencies: {
    description: string;
    type:
      | "supplier"
      | "platform"
      | "technology"
      | "customer"
      | "regulatory";
  }[];

  confidence_score: number;

  metadata: {
    knowledge_version: number;
    generated_at: string;
    input_hash: string;
    pipeline_version: string;
  };

  lineage: {
    source_filings: string[];
    derived_from: string[];
    pipeline_version: string;
    model_version: string;
    prompt_version: string;
  };
};
```

## Ownership Matrix

| Concept | Owner | Notes |
| --- | --- | --- |
| What the company does | Company Knowledge | Canonical business understanding. |
| How the company makes money | Company Knowledge | Captured through structured `business_model` and `revenue_drivers`. |
| Products and services | Company Knowledge | Durable product/service understanding, not quarter commentary. |
| Customers | Company Knowledge | Durable customer groups and buyer types. |
| Operating model | Company Knowledge | How the company runs and delivers its business. |
| Competitive positioning | Company Knowledge | Durable positioning signals with claimed/observed source type. |
| Business dependencies | Company Knowledge | Typed key inputs, partners, platforms, suppliers, technology, customer, or regulatory dependencies. |
| Quarter changes | Quarter Change Engine | Company Knowledge does not own period-over-period deltas. |
| Health status | Business Health / Health Dashboard | Company Knowledge does not decide improving/stable/needs-attention. |
| Health narratives | Health Dashboard Enrichment | Health-specific presentation, not canonical business knowledge. |
| Investor narratives | Investor Narrative Layer | Narrative packaging only. |
| Owner questions | Future Owner Questions Intelligence | Questions are generated from knowledge and signals, not stored as knowledge. |
| Investment recommendations | Not owned | Out of scope for Partner Investing. |
| Presentation logic | Partner Domain / Frontend | Company Knowledge should not contain UI copy structure. |

## Owned By Company Knowledge

- What the company does.
- How the company makes money.
- Products.
- Customers.
- Operating model.
- Competitive positioning.
- Business dependencies.

## Not Owned By Company Knowledge

- Quarter changes.
- Health status.
- Narratives.
- Owner questions.
- Investment recommendations.
- Presentation logic.

## Future Dependency Diagram

```text
Source Filings
  ↓
Existing Structured Intelligence
  ↓
Company Knowledge
  ↓
Business Signal Intelligence
  ↓
Quarter Understanding Intelligence
  ↓
Owner Intelligence
  ↓
Owner Questions Intelligence
```

## Future Consumers

### Business Signal Intelligence

Uses Company Knowledge to determine which business facts are stable enough to compare against new signals. It should not redefine what the company does.

### Quarter Understanding Intelligence

Uses Company Knowledge as context for explaining what changed in a quarter. It owns period interpretation, not the canonical company model.

### Owner Intelligence

Uses Company Knowledge to translate internal intelligence into owner-oriented understanding. It should not duplicate durable company facts.

### Owner Questions Intelligence

Uses Company Knowledge to ask better questions about the business. Questions remain separate from knowledge.

## Boundary Rule

If a field explains the durable business model, customers, products, operating structure, competitive positioning, or dependencies, it belongs in Company Knowledge.

If a field explains what changed, how healthy the business looks, what a user should read, or how to present the company in the application, it belongs outside Company Knowledge.

## Future Lineage Rules

Every future Company Knowledge artifact must include:

- source_filings
- derived_from
- input_hash
- pipeline_version
- model_version
- prompt_version
- generated_at

The artifact must be reproducible from lineage data.

No business fact may exist without traceable source lineage.
