import type { PartnerCompanyIntelligence } from "../types/partner-domain.types";
import { logger } from "../lib/logger/logger";

const partnerApiBaseUrl = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env?.VITE_PARTNER_API_URL
  ?? "http://127.0.0.1:4310";

export async function getPartnerCompany(
  ticker: string,
  filingDate?: string,
): Promise<PartnerCompanyIntelligence> {
  const normalizedTicker = ticker.trim().toUpperCase();
  const url = new URL(`/partner-intelligence/${normalizedTicker}`, partnerApiBaseUrl);

  if (filingDate) {
    url.searchParams.set("filingDate", filingDate);
  }

  const response = await fetch(url);

  if (!response.ok) {
    logger.warn("Partner company request failed", {
      ticker: normalizedTicker,
      status: response.status,
    });
    throw new Error(`Partner company request failed with status ${response.status}`);
  }

  return response.json() as Promise<PartnerCompanyIntelligence>;
}
