import { API_BASE_URL } from "../../../config/env";
import { logger } from "../../../lib/logger/logger";
import type { PartnerCompanyIntelligence } from "../../../types/partner-domain.types";
import type { PartnerApiError } from "../types/partner-api.types";

function buildPartnerIntelligenceUrl(ticker: string, filingDate?: string): URL {
  const normalizedTicker = ticker.trim().toUpperCase();
  const url = new URL(`/partner-intelligence/${normalizedTicker}`, API_BASE_URL);

  if (filingDate) {
    url.searchParams.set("filingDate", filingDate);
  }

  return url;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isPartnerCompanyIntelligence(value: unknown): value is PartnerCompanyIntelligence {
  if (!isRecord(value)) {
    return false;
  }

  return typeof value.ticker === "string"
    && typeof value.companyName === "string"
    && typeof value.asOfFilingDate === "string"
    && isRecord(value.profile)
    && isRecord(value.summary)
    && isRecord(value.story)
    && Array.isArray(value.customers)
    && isRecord(value.money)
    && isRecord(value.trust)
    && Array.isArray(value.forensics)
    && Array.isArray(value.sources);
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = await response.clone().json() as unknown;

    if (isRecord(body) && typeof body.error === "string") {
      return body.error;
    }
  } catch {
    // Fall through to the generic status-based message.
  }

  if (response.status === 400) {
    return "Invalid Partner Intelligence request.";
  }

  if (response.status === 404) {
    return "Partner Intelligence filing not found.";
  }

  if (response.status >= 500) {
    return "Partner Intelligence service is unavailable.";
  }

  return `Partner Intelligence request failed with status ${response.status}.`;
}

function normalizeError(error: unknown, status?: number): PartnerApiError {
  if (isRecord(error) && typeof error.message === "string") {
    return {
      message: error.message,
      status: status ?? (typeof error.status === "number" ? error.status : undefined),
    };
  }

  if (error instanceof Error) {
    return { message: error.message, status };
  }

  return { message: "Partner Intelligence request failed.", status };
}

export async function getPartnerIntelligence(
  ticker: string,
  filingDate?: string,
  options: { signal?: AbortSignal } = {},
): Promise<PartnerCompanyIntelligence> {
  const normalizedTicker = ticker.trim().toUpperCase();
  const startedAt = performance.now();

  try {
    const response = await fetch(buildPartnerIntelligenceUrl(normalizedTicker, filingDate), {
      signal: options.signal,
    });
    const durationMs = Math.round(performance.now() - startedAt);

    if (!response.ok) {
      const message = await readErrorMessage(response);

      throw normalizeError({ message }, response.status);
    }

    const data = await response.json() as unknown;

    if (!isPartnerCompanyIntelligence(data)) {
      throw normalizeError({ message: "Partner Intelligence response was invalid." });
    }

    logger.info("Partner Intelligence request succeeded", {
      ticker: normalizedTicker,
      duration_ms: durationMs,
    });

    return data;
  } catch (error) {
    const durationMs = Math.round(performance.now() - startedAt);
    const normalizedError = normalizeError(error);

    if (options.signal?.aborted) {
      throw normalizedError;
    }

    logger.warn("Partner Intelligence request failed", {
      ticker: normalizedTicker,
      status: normalizedError.status,
      duration_ms: durationMs,
    });

    throw normalizedError;
  }
}
