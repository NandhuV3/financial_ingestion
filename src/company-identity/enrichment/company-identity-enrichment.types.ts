import type { CompanyIdentityEnriched, CompanyIdentityEvidence } from "../company-identity.types.js";

export type CompanyIdentityEnrichmentPromptInput = {
  evidence: CompanyIdentityEvidence;
};

export type CompanyIdentityEnrichmentDecision = {
  shouldGenerate: boolean;
  status: "generated" | "skipped";
  reason: "evidence_changed" | "evidence_unchanged";
};

export type CompanyIdentityEnrichmentReport = {
  status: CompanyIdentityEnrichmentDecision["status"];
  reason: CompanyIdentityEnrichmentDecision["reason"];
  model: string;
  input_hash: string;
  generated_at: string;
};

export type CompanyIdentityEnrichmentClient = (params: {
  model: string;
  systemPrompt: string;
  prompt: string;
  schema: object;
}) => Promise<Omit<CompanyIdentityEnriched, "company" | "enrichment">>;

export type CompanyIdentityEnrichmentResult = {
  report: CompanyIdentityEnrichmentReport;
  identity: CompanyIdentityEnriched | null;
  evidence: CompanyIdentityEvidence;
};
