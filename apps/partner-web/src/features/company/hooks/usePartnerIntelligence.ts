import { useEffect, useState } from "react";
import { logger } from "../../../lib/logger/logger";
import { getPartnerIntelligence } from "../api/partner-intelligence.api";
import { mapPartnerCompanyToViewModel } from "../adapters/partner-company.adapter";
import type { PartnerApiError } from "../types/partner-api.types";
import type { PartnerCompanyViewModel } from "../types/partner-company-view-model";

export type UsePartnerIntelligenceResult = {
  data: PartnerCompanyViewModel | null;
  loading: boolean;
  error: PartnerApiError | null;
};

export function usePartnerIntelligence(
  ticker: string,
  filingDate?: string,
): UsePartnerIntelligenceResult {
  const [data, setData] = useState<PartnerCompanyViewModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PartnerApiError | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const normalizedTicker = ticker.trim().toUpperCase();
    const startedAt = performance.now();

    setLoading(true);
    setError(null);
    setData(null);

    getPartnerIntelligence(normalizedTicker, filingDate, { signal: controller.signal })
      .then((intelligence) => {
        if (controller.signal.aborted) {
          return;
        }

        const viewModel = mapPartnerCompanyToViewModel(intelligence);
        const durationMs = Math.round(performance.now() - startedAt);

        setData(viewModel);
        setError(null);
        setLoading(false);

        logger.info("Partner Intelligence hook loaded", {
          ticker: normalizedTicker,
          duration_ms: durationMs,
          success: true,
        });
      })
      .catch((requestError: PartnerApiError) => {
        if (controller.signal.aborted) {
          return;
        }

        const durationMs = Math.round(performance.now() - startedAt);

        setData(null);
        setError(requestError);
        setLoading(false);

        logger.warn("Partner Intelligence hook failed", {
          ticker: normalizedTicker,
          duration_ms: durationMs,
          success: false,
        });
      });

    return () => {
      controller.abort();
    };
  }, [ticker, filingDate]);

  return { data, loading, error };
}
