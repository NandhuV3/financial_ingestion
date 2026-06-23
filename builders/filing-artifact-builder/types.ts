import type { FilingSectionName } from "./contract.js";

export type FilingArtifactBuilderInput = {
  company_id: string;
  period_id: string;
  filing_id: string;
  filing_type: string;
  filing_period: string;
  accession_number: string;
  management_discussion: string;
  risk_factors: string;
  raw_html_hash: string;
};

export type FilingSectionInput = Pick<
  FilingArtifactBuilderInput,
  "management_discussion" | "risk_factors"
>;

export type FilingSectionContent = Record<FilingSectionName, string>;
