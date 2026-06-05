import { useEffect, useState } from "react";
import { getPartnerCompany } from "../api/partner-api";
import type { PartnerCompanyIntelligence } from "../types/partner-domain.types";

type PartnerCompanyState = {
  data: PartnerCompanyIntelligence | null;
  loading: boolean;
  error: string | null;
};

export function usePartnerCompany(ticker: string, filingDate?: string): PartnerCompanyState {
  const [state, setState] = useState<PartnerCompanyState>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    setState({ data: null, loading: true, error: null });
    getPartnerCompany(ticker, filingDate)
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((error: unknown) => {
        if (!cancelled) setState({ data: null, loading: false, error: error instanceof Error ? error.message : "Unable to load company." });
      });

    return () => {
      cancelled = true;
    };
  }, [ticker, filingDate]);

  return state;
}
