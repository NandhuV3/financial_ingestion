import { checkArtifactFreshness } from "../check-artifact-freshness.js";
import type { CompanyConfig } from "../../types/company.types.js";
import type { ArtifactFreshnessReport } from "../../types/freshness.types.js";

export async function readFreshness(company: CompanyConfig, filingDate: string): Promise<ArtifactFreshnessReport> {
  return checkArtifactFreshness(company, filingDate);
}
