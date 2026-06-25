export type ThemePromptEvidence = {
  paragraph_index: number;
  section_name: string;
  paragraph_text: string;
};

export const THEMES_PROMPT_ID = "theme-generation-system";
export const THEMES_PROMPT_VERSION = "theme-generation-v7";

/**
 * Themes Prompt
 *
 * Ownership:
 * Themes identify filing-supported business narratives.
 *
 * Themes do NOT:
 * - explain the business
 * - create Company Knowledge
 * - detect changes
 * - generate signals
 * - evaluate trust
 * - answer ownership questions
 */
export const THEMES_SYSTEM_PROMPT = `You are a financial filing analyst.

Your responsibility is to identify filing-supported business narratives.

A Theme is a coherent business narrative discussed in a filing.

A Theme is NOT:
- a section heading
- a document label
- a metric
- a KPI
- a business conclusion
- a durable company fact
- a trust assessment
- an investor conclusion

Themes identify what management discussed.

Themes do not determine:
- whether management is correct
- whether a narrative is important
- whether a narrative is positive or negative
- whether investors should care

Prefer fewer high-quality Themes supported by multiple paragraphs over many narrow Themes.

Return JSON only.`;

export function renderThemesUserPrompt(input: {
  filingType: string;
  evidence: ThemePromptEvidence[];
}): string {
  return `Identify filing-supported business narratives from these filing paragraphs.

Filing Type: ${input.filingType}

Return JSON only:

{
  "themes": [
    {
      "title": "concise narrative title",
      "summary": "filing-supported narrative description",
      "category": "strategy | product | customer | competition | operations | financial | capital_allocation | management | trust | regulatory | technology | other",
      "paragraph_indexes": [1, 2, 3]
    }
  ]
}

Theme Definition

A Theme is a filing-supported business narrative.

Examples:

GOOD
- AI Infrastructure Expansion
- Commercial Cloud Growth
- OpenAI Partnership Expansion
- Supply Chain Constraints
- Datacenter Capacity Expansion
- Gaming Revenue Decline

BAD
- Management Discussion Overview
- Risk Factors
- Competition
- Revenue Increased 12%
- Gross Margin 45%
- Business Overview

Narrative Rules

- Identify what management discussed.
- Group related evidence into coherent narratives.
- Aggregate related paragraphs discussing the same narrative.
- Prefer narrative completeness over evidence count.
- Keep unrelated narratives separate.
- A Theme should remain understandable when viewed independently.

Themes Must Not

- Explain how the business works.
- Create durable business facts.
- Identify revenue models.
- Identify customer models.
- Identify operating models.
- Detect period-over-period changes.
- Generate business signals.
- Evaluate management credibility.
- Produce investor conclusions.
- Produce ownership reasoning.
- Produce valuation reasoning.

Metric Suppression

Metrics may support a Theme.

Metrics are not Themes.

BAD
- Revenue Increased 12%
- Operating Margin Expanded
- Subscribers Reached 10 Million

GOOD
- Commercial Cloud Expansion
- Consumer Subscription Growth
- Datacenter Investment Expansion

Boilerplate Suppression

Do not emit:
- section headings
- MD&A labels
- forward-looking statement disclosures
- generic legal disclosures
- generic accounting discussions
- generic risk factor headings

Evidence Rules

- Use only supplied paragraph_index values.
- Every paragraph_index must exist in the supplied evidence.
- Every paragraph must directly support the Theme.
- paragraph_indexes must be unique.
- Use only positive integer paragraph indexes.

Category Rules

Category must be exactly one of:

- strategy
- product
- customer
- competition
- operations
- financial
- capital_allocation
- management
- trust
- regulatory
- technology
- other

Theme Quality Filter

Before emitting a Theme ask:

1. Is this a business narrative?
2. Is it filing-supported?
3. Is it more informative than a section heading?
4. Is it more informative than an isolated metric?

If any answer is no, do not emit the Theme.

Filing Paragraphs:

${JSON.stringify(input.evidence, null, 2)}`;
}