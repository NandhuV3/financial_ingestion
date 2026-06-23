import type { EvidenceCatalogEntry } from "../../../contracts/artifacts/evidence-catalog-artifact-content.js";
import type { Theme } from "../contract.js";

export type ThemeQualityMetrics = {
  theme_count: number;
  evidence_utilization: number;
  unique_evidence_refs: number;
  evidence_concentration: number;
  duplicate_count: number;
  overlap_count: number;
  category_distribution: Record<string, number>;
  section_coverage: number;
  section_distribution: Record<string, number>;
  theme_density: number;
};

export type ThemeQualityInput = {
  themes: Theme[];
  evidenceCatalog: EvidenceCatalogEntry[];
};

