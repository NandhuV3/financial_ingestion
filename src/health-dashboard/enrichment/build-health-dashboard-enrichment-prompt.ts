import { calculateStringHash } from "../../shared/hashing/hash-file.js";
import type { BusinessHealthEvidence } from "../health-dashboard.types.js";

export const HEALTH_DASHBOARD_ENRICHMENT_SYSTEM_PROMPT = `You generate business health dashboard narrative for a long-term owner-oriented investing product.

Use only the provided deterministic evidence.
Return JSON only.

Allowed responsibilities:
- Write a plain-language explanation of business health.
- Convert strengthening signals into user-facing business area titles and explanations.
- Convert watch signals into user-facing watch area titles and explanations.

Not allowed:
- Do not change health status.
- Do not invent unsupported facts.
- Do not classify topics.
- Do not add evidence.
- Do not give investment advice.
- Do not mention stock price, buy, sell, trading, or analyst ratings.
- Do not expose topic IDs, evidence counts, trend_state, importance_score, or internal category names.`;

export function buildHealthDashboardEnrichmentPrompt(evidence: BusinessHealthEvidence): string {
  return `Create an owner-friendly business health dashboard from this deterministic evidence.

Return this exact JSON shape:
{
  "explanation": "",
  "strengthening_areas": [
    { "title": "", "explanation": "" }
  ],
  "watch_areas": [
    { "title": "", "explanation": "" }
  ]
}

Rules:
- Use simple business language a non-finance user can understand.
- explanation should be 1 concise sentence.
- strengthening_areas must contain at most 3 items.
- watch_areas must contain at most 3 items.
- Each title should be a business idea, not an internal label.
- Each area explanation should explain why it matters to an owner.
- If evidence is sparse, return fewer items.
- Do not expose raw labels directly when they are internal or awkward.
- Preserve the direction implied by evidence: strengthening signals belong in strengthening_areas, watch signals belong in watch_areas.

Evidence:
${JSON.stringify(evidence, null, 2)}`;
}

export function calculateBusinessHealthEvidenceHash(evidence: BusinessHealthEvidence): string {
  return calculateStringHash(JSON.stringify(normalizeEvidenceForHash(evidence)));
}

function normalizeEvidenceForHash(evidence: BusinessHealthEvidence): Omit<BusinessHealthEvidence, "generated_at"> {
  return {
    company: evidence.company,
    ticker: evidence.ticker,
    filing_date: evidence.filing_date,
    health_status: evidence.health_status,
    strengthening_signals: evidence.strengthening_signals,
    watch_signals: evidence.watch_signals,
    risk_signals: evidence.risk_signals,
    timeline: evidence.timeline,
  };
}
