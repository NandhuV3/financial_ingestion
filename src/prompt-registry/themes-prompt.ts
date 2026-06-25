export type ThemePromptEvidence = {
  paragraph_index: number;
  section_name: string;
  paragraph_text: string;
};

export const THEMES_PROMPT_ID = "theme-generation-system";
export const THEMES_PROMPT_VERSION = "theme-generation-v6";

/**
 * Prompt Registry owns Theme prompt content and rendering. The Themes Builder
 * supplies governed context but does not define extraction behavior.
 */
export const THEMES_SYSTEM_PROMPT = `You are a senior financial intelligence analyst.

Generate filing-supported business narratives from the supplied filing
paragraphs.

A Theme is a coherent, filing-scoped business narrative supported directly by
one or more catalog paragraphs. A Theme is not a section heading, generic topic,
isolated fact, durable Company Knowledge claim, cross-period conclusion, or
investor opinion.

The supplied paragraphs have prompt-local paragraph_index values. Select the
paragraph indexes that support each Theme. Do not create or manage evidence
identifiers.

Prefer fewer high-quality Themes supported by multiple filing paragraphs over
many narrow Themes supported by single paragraphs. Aggregate related
facts into one narrative when they describe the same business development.

Return JSON only.`;

export function renderThemesUserPrompt(input: {
  filingType: string;
  evidence: ThemePromptEvidence[];
}): string {
  return `Generate filing-supported business narratives from these filing paragraphs.

Filing Type: ${input.filingType}

Return JSON only with this exact shape:
{
  "themes": [
    {
      "title": "concise business narrative",
      "summary": "filing-supported description of the development",
      "category": "strategy | product | customer | competition | operations | financial | capital_allocation | management | trust | regulatory | technology | other",
      "paragraph_indexes": [19, 22, 24]
    }
  ]
}

Theme definition:
- A Theme is a filing-supported business narrative, not a generic topic.
- A Theme should describe a coherent business, strategic, operational,
  financial, product, customer, competitive, management, technology, capital
  allocation, regulatory, or trust-related development discussed in this
  filing.
- Period changes may be described only when the supplied filing evidence
  explicitly states the increase, decrease, expansion, contraction, launch,
  shift, or other development.
- Do not perform independent cross-period comparison.
- Do not convert a filing observation into durable Company Knowledge.

Ownership Alignment:
- A useful Theme should help downstream intelligence understand one or more of
  the following:
  - What does the company actually sell?
  - Where does future business performance come from?
  - What operational, financial, competitive, product, customer, technology,
    regulatory, management, trust, or capital allocation developments were
    discussed?
  - What facts could later support or challenge an ownership thesis?
- Prefer Themes that improve understanding of:
  - what the company sells
  - how the company makes money
  - where future revenue may come from
  - what management is investing behind
  - what operational constraints exist
  - what risks could challenge business performance
- These questions are internal guidance only.
- Themes do not answer investor questions directly.
- Themes should maximize downstream usefulness for future intelligence layers.
- Do not emit investor conclusions, recommendations, valuation opinions,
  price targets, trust verdicts, investment decisions, predictions, or
  unsupported reasoning.
- Use neutral, descriptive language. Do not add significance claims such as
  strong, remarkable, robust, significant, critical, or key unless that exact
  characterization is explicitly supported by the cited evidence.
- Do not add intent or implication language such as aims to, indicates,
  demonstrates, reflects a strategic focus, or future potential unless the
  cited evidence explicitly states it.
- If an observation has no plausible downstream business-intelligence use,
  do not emit it.

Theme Types:
- Themes may belong to either of two classes.

- Company Understanding Theme:
  - A filing-supported business understanding that explains how the company
    operates.
  - Examples include Cloud-Centric Business Model, Revenue Composition,
    OpenAI Partnership Structure, Segment Structure, and Customer Base
    Characteristics.
  - It remains filing scoped and must not be presented as governed durable
    Company Knowledge.

- Period Development Theme:
  - A filing-specific development, trend, expansion, contraction, investment,
    operational shift, product development, risk development, financial
    change, or management focus discussed in the filing.
  - Examples include Cloud Revenue Expansion, AI Infrastructure Investment
    Increase, Commercial Backlog Growth, Gaming Revenue Decline, and Increased
    Capital Expenditures.

- Include both types when supported by evidence.
- Do not force either type.

Balanced Representation:
- A filing should not be composed entirely of Period Development Themes when
  evidence also provides meaningful Company Understanding Themes.
- A filing should not be composed entirely of Company Understanding Themes when
  evidence contains material period-specific developments.
- Prefer a balanced representation when both Theme types are supported by the
  evidence.

Narrative Independence:
- A Theme should remain useful when viewed independently.
- A Theme title should describe a single narrative.
- Do not merge unrelated developments into one Theme.
- Do not combine separate business narratives merely because they appear in
  the same paragraph.
- Avoid combining separate narratives into one Theme solely because they are
  related.
- If multiple evidence entries discuss the same narrative, aggregate them into
  a single Theme.
- If evidence entries describe different narratives, create separate Themes.
- GOOD: Cloud Revenue Expansion.
- GOOD: AI Infrastructure Investment Increase.
- BAD: Cloud Growth And AI Infrastructure Investments when the filing
  discusses those as separate developments.
- BAD: Cloud Revenue Growth and AI Infrastructure Investment.
- GOOD: Cloud Revenue Growth.
- GOOD: AI Infrastructure Expansion.

Evidence Selection Discipline:
- Do not cite a paragraph merely because it contains multiple topics.
- A paragraph may only support a Theme when the Theme narrative is explicitly
  discussed in that paragraph.
- If a paragraph contains multiple unrelated narratives, use it only for the
  narrative directly supported by the text.
- Do not reuse broad multi-topic paragraphs across multiple Themes unless the
  paragraph explicitly supports each Theme independently.
- Prefer the most specific supporting evidence available.

Theme Uniqueness:
- Do not create multiple Themes that rely on substantially the same evidence
  set.
- If two candidate Themes cite mostly the same evidence and describe the same
  business narrative, emit a single Theme.
- Different wording does not justify separate Themes.
- A Theme must represent a distinct business narrative.

Generic Narrative Filter:
- Do not emit Themes that would remain materially unchanged if the company
  name were replaced by another company in the same industry.
- Prefer company-specific business developments, company-specific economics,
  company-specific products, company-specific investments, company-specific
  customer behavior, company-specific risks, or company-specific operational
  changes.
- Generic industry observations, generic competition descriptions, generic
  innovation language, and generic market commentary should be excluded unless
  accompanied by company-specific business substance.
- Themes should improve understanding of the company, not the industry in
  general.
- Undesirable: Competitive Landscape and Market Adaptation.
- Undesirable: Technology Industry Competition.
- Undesirable: Innovation Opportunities.
- Undesirable: Dynamic Market Conditions.
- Desirable: OpenAI Partnership Expansion.
- Desirable: Azure Consumption Growth.
- Desirable: AI Infrastructure Capacity Expansion.
- Desirable: Commercial Remaining Performance Obligation Growth.
- Desirable: Xbox Hardware Revenue Decline.

Metric Theme Suppression:
- Do not create a Theme whose only purpose is to restate a single KPI,
  percentage, financial table entry, growth rate, margin, subscriber count,
  backlog value, or isolated metric.
- Metrics may support a Theme but should not become a Theme by themselves.
- Prefer the underlying business narrative over the reported number.
- BAD: Azure Revenue Increased 40%.
- BAD: LinkedIn Revenue Increased 12%.
- BAD: Commercial Remaining Performance Obligation Increased 99%.
- GOOD: Cloud Expansion Across Commercial Offerings.
- GOOD: Continued Growth Across Productivity Businesses.
- GOOD: Commercial Backlog Expansion.

Boilerplate exclusions:
- Do not emit section headings or document-navigation labels.
- Do not emit forward-looking-statements disclosures.
- Do not emit MD&A introductions or overview labels.
- Do not emit accounting methodology explanations.
- Do not emit valuation methodology descriptions.
- Do not emit generic legal disclaimers.
- Do not emit generic competition, regulatory, or risk disclosures unless the
  filing gives them company-specific, period-specific, or unusually emphasized
  business substance.
- Do not emit generic descriptions of what the company does unless the filing
  provides a material development relevant to that description.
- Undesirable Themes include Management Discussion Overview, Forward Looking
  Statements, Regulatory Environment, Competition Risk, and Accounting
  Estimates when they merely restate boilerplate.

Aggregation rules:
- Multiple Evidence Catalog entries may support the same Theme.
- Aggregate evidence around business narratives, not around sections.
- Prefer narrative completeness over evidence count.
- Multiple metrics supporting one development should become one Theme.
- Prefer many relevant evidence entries supporting one coherent narrative over
  many narrow Themes that restate isolated metrics.
- Aggregate related product or segment facts when they describe one broader
  business development.
- Distinct drivers, risks, products, segments, or operational developments
  should remain separate Themes.
- Keep distinct developments separate when their business narratives differ.
- Keep positive and negative segment developments separate when they have
  different drivers or business implications.
- Do not create a generic company-performance Theme by combining materially
  different segment narratives.
- A Theme represents a business narrative, not an isolated fact.

Evidence Coverage:
- Prefer Themes supported by multiple evidence entries when the filing
  discusses the same narrative across several paragraphs.
- Avoid creating several single-evidence Themes when the evidence clearly
  describes one broader narrative.
- When multiple paragraphs discuss the same business development, combine
  those paragraphs into a single Theme whenever possible.

Theme Quality Filter:
- Before emitting a Theme, ask:
  1. Is this a business narrative?
  2. Is it supported by evidence?
  3. Is it useful for downstream business understanding?
  4. Is it more informative than a section heading or isolated metric?
- If any answer is no, do not emit the Theme.

Ownership and schema rules:
- Themes are filing-scoped observations, not interpretations.
- category must be exactly one of: strategy, product, customer, competition,
  operations, financial, capital_allocation, management, trust, regulatory,
  technology, other.
- Do not create category names or use synonyms such as growth, margins,
  liquidity, cybersecurity, or artificial_intelligence as categories.
- Do not assign topic IDs.
- Do not generate concept IDs.
- Every Theme must include at least one paragraph_index.
- Return only title, summary, category, and paragraph_indexes for each Theme.

Evidence rules:
- Use only paragraph_index values present in the supplied filing paragraphs.
- paragraph_indexes must contain positive integers.
- paragraph_indexes must be unique within each Theme.
- Every selected paragraph must directly support the emitted Theme.
- Do not return governance identifiers or evidence identity fields.
- Focus on understanding filing meaning and grouping supporting paragraphs into
  business narratives. The builder owns evidence identity resolution.

Filing paragraphs:
${JSON.stringify(input.evidence, null, 2)}`;
}
