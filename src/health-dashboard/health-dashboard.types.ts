import type {
  BusinessHealthArea,
  BusinessHealthDashboard,
  BusinessHealthTimelinePoint,
  OwnerBusinessHealth,
} from "../partner-domain/partner-domain.types.js";

export type BusinessHealthSignalSource =
  | "topic_change"
  | "category_change"
  | "topic_evolution"
  | "risk_signal";

export type BusinessHealthEvidenceSignal = {
  source: BusinessHealthSignalSource;
  raw_label: string;
  direction: "strengthening" | "watch";
  topic_id?: string;
  topic_name?: string;
  category?: string;
  change_type?: string;
  theme_names?: string[];
  risk_text?: string;
};

export type BusinessHealthEvidence = {
  company: string;
  ticker: string;
  filing_date: string;
  health_status: OwnerBusinessHealth;
  strengthening_signals: BusinessHealthEvidenceSignal[];
  watch_signals: BusinessHealthEvidenceSignal[];
  risk_signals: string[];
  timeline: BusinessHealthTimelinePoint[];
  generated_at: string;
};

export type HealthDashboardNarrativeOutput = {
  explanation: string;
  strengthening_areas: BusinessHealthArea[];
  watch_areas: BusinessHealthArea[];
};

export type HealthDashboardEnriched = {
  company: string;
  ticker: string;
  filing_date: string;
  health_status: OwnerBusinessHealth;
  explanation: string;
  strengthening_areas: BusinessHealthArea[];
  watch_areas: BusinessHealthArea[];
  enrichment: {
    model: string;
    generated_at: string;
    input_hash: string;
  };
};

export type HealthDashboardEnrichmentDecision = {
  shouldGenerate: boolean;
  status: "generated" | "skipped";
  reason: "evidence_changed" | "evidence_unchanged";
};

export type HealthDashboardEnrichmentReport = {
  status: HealthDashboardEnrichmentDecision["status"];
  reason: HealthDashboardEnrichmentDecision["reason"];
  model: string;
  input_hash: string;
  generated_at: string;
};

export type HealthDashboardEnrichmentClient = (params: {
  model: string;
  systemPrompt: string;
  prompt: string;
  schema: object;
}) => Promise<HealthDashboardNarrativeOutput>;

export type HealthDashboardEnrichmentResult = {
  report: HealthDashboardEnrichmentReport;
  evidence: BusinessHealthEvidence;
  dashboard: HealthDashboardEnriched | null;
};

export function enrichedToDashboard(
  enriched: HealthDashboardEnriched,
  timeline: BusinessHealthTimelinePoint[],
): BusinessHealthDashboard {
  return {
    status: enriched.health_status,
    explanation: enriched.explanation,
    strengtheningAreas: enriched.strengthening_areas.slice(0, 3),
    watchAreas: enriched.watch_areas.slice(0, 3),
    timeline,
  };
}
