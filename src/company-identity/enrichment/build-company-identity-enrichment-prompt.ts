import { calculateStringHash } from "../../shared/hashing/hash-file.js";
import type { CompanyIdentityEvidence } from "../company-identity.types.js";
import type { CompanyIdentityEnrichmentPromptInput } from "./company-identity-enrichment.types.js";

export const COMPANY_IDENTITY_ENRICHMENT_SYSTEM_PROMPT = `You generate company identity intelligence for a long-term business understanding product.

Use only the provided structured evidence.
Return JSON only.

Allowed responsibilities:
- Synthesize what the company does.
- Identify primary products and customers from evidence.
- Explain likely revenue drivers from evidence.
- Identify business model, competitive, and operating signals from evidence.

Not allowed:
- Do not invent unsupported facts.
- Do not modify risks.
- Do not modify themes.
- Do not modify topics.
- Do not modify evidence.
- Do not copy theme names into revenue_drivers, competitive_signals, or operating_signals.
- Do not turn risks into competitive or operating signals.
- Do not give investment advice.
- Do not mention stock price, buy, sell, or trading.`;

export function buildCompanyIdentityEnrichmentPromptInput(
  evidence: CompanyIdentityEvidence,
): CompanyIdentityEnrichmentPromptInput {
  return {
    evidence,
  };
}

export function buildCompanyIdentityEnrichmentPrompt(input: CompanyIdentityEnrichmentPromptInput): string {
  return `Synthesize company identity from this deterministic evidence.

Return this exact JSON shape:
{
  "business_description": "",
  "primary_products": [],
  "primary_customers": [],
  "revenue_drivers": [],
  "business_model_signals": [],
  "competitive_signals": [],
  "operating_signals": []
}

Rules:
- Use simple business language.
- business_description must be one sentence that answers: what does the company provide, and who pays for it?
- business_description must not use marketing phrases such as "leading company", "innovative company", or "world-class company".
- Use only evidence-supported products, customers, themes, topics, opportunities, and narrative summary.
- Do not include risks in the output; risks remain deterministic evidence.
- Prefer precise identity over keyword repetition.

Definitions:
- Revenue drivers describe HOW the company earns money.
  Good examples: software subscriptions, cloud computing consumption, advertising spend, payment transaction volume, marketplace fees, semiconductor demand.
  Bad examples: revenue growth, margin expansion, AI investment, quarterly performance, theme names, opportunity statements.
- Competitive signals describe why customers continue choosing the company.
  Good examples: brand trust, ecosystem strength, switching costs, network effects, developer ecosystem, scale advantages.
  Bad examples: competition risk, regulatory pressure, competitor descriptions, market pressure.
- Operating signals describe capabilities required to run the business.
  Good examples: cloud infrastructure, logistics network, manufacturing capability, developer platform ecosystem, global distribution network.
  Bad examples: margin pressure, supplier risk, competition, macroeconomic pressure, inflation.

Quality bar:
- A non-finance user should be able to answer what the company does, who pays it, how it makes money, and why customers choose it within 15 seconds.
- If evidence is sparse, return fewer, more precise items instead of generic labels.
- Do not output broad labels such as "technology solutions", "digital services", or "business services" unless the evidence specifically supports them.
- The examples above are definitions, not suggestions. Do not output an example phrase unless the provided evidence supports that exact business capability.

Evidence:
${JSON.stringify(input.evidence, null, 2)}`;
}

export function calculateCompanyIdentityEvidenceHash(evidence: CompanyIdentityEvidence): string {
  return calculateStringHash(JSON.stringify(normalizeEvidenceForHash(evidence)));
}

function normalizeEvidenceForHash(evidence: CompanyIdentityEvidence): CompanyIdentityEvidence {
  return {
    company: evidence.company,
    themes: [...evidence.themes],
    topics: [...evidence.topics],
    products: [...evidence.products],
    customers: [...evidence.customers],
    risks: [...evidence.risks],
    opportunities: [...evidence.opportunities],
    narrative_summary: evidence.narrative_summary,
    filing_dates: [...evidence.filing_dates],
  };
}
