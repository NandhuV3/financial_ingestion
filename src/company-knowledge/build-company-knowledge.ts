import type { CompanyIdentityEnriched } from "../company-identity/company-identity.types.js";
import type { CompanyProfileIntelligence } from "../company-profile/company-profile.types.js";
import { getCurrentTimestamp } from "../shared/dates/timestamps.js";
import { calculateStringHash } from "../shared/hashing/hash-file.js";
import type { FilingMetadata } from "../types/pipeline.types.js";
import type {
  CompanyKnowledge,
  CompanyKnowledgeCompetitivePositioning,
} from "./types/company-knowledge.types.js";

const DEFAULT_SCHEMA_VERSION = "1.0.0";
const DEFAULT_PIPELINE_VERSION = "company-knowledge-builder-v1";
const DEFAULT_MODEL_VERSION = "deterministic-v1";
const DEFAULT_PROMPT_VERSION = "none";
const DEFAULT_KNOWLEDGE_VERSION = 1;

export type BuildCompanyKnowledgeInputs = {
  companyIdentity?: CompanyIdentityEnriched | null;
  companyProfile?: CompanyProfileIntelligence | null;
  filingMetadata?: FilingMetadata | null;
  derivedFrom?: string[];
  schemaVersion?: string;
  pipelineVersion?: string;
  modelVersion?: string;
  promptVersion?: string;
  knowledgeVersion?: number;
  generatedAt?: string;
};

export function buildCompanyKnowledge(inputs: BuildCompanyKnowledgeInputs): CompanyKnowledge {
  const company = firstText([
    inputs.companyIdentity?.company,
    inputs.companyProfile?.company,
    inputs.filingMetadata?.company,
  ]);
  const products = firstArray([
    inputs.companyIdentity?.primary_products,
    inputs.companyProfile?.products,
  ]);
  const customers = firstArray([
    inputs.companyIdentity?.primary_customers,
    inputs.companyProfile?.customers,
  ]);
  const revenueDrivers = firstArray([
    inputs.companyIdentity?.revenue_drivers,
  ]);
  const competitivePositioning = buildCompetitivePositioning(inputs);
  const operatingModel = firstArray([
    inputs.companyIdentity?.operating_signals,
  ]);
  const keyDependencies = buildKeyDependencies(inputs);
  const sourceFilings = mergeSourceFilings(inputs);
  const derivedFrom = mergeDerivedFrom(inputs);
  const inputHash = calculateCompanyKnowledgeInputHash(inputs);
  const confidence = calculateConfidence({
    sourceFilingCount: sourceFilings.length,
    hasIdentity: Boolean(inputs.companyIdentity),
    fieldValues: [
      firstText([inputs.companyIdentity?.business_description, getLegacyProfileBusinessModel(inputs.companyProfile)]),
      products,
      customers,
      revenueDrivers,
      competitivePositioning,
      operatingModel,
      keyDependencies,
    ],
    lineageComplete: sourceFilings.length > 0 && derivedFrom.length > 0,
  });

  return {
    company,
    business_description: firstText([
      inputs.companyIdentity?.business_description,
      getLegacyProfileBusinessModel(inputs.companyProfile),
    ]),
    business_model: {
      value_creation: firstText([
        inputs.companyIdentity?.business_description,
        getLegacyProfileBusinessModel(inputs.companyProfile),
      ]),
      monetization: revenueDrivers.join("; "),
      revenue_structure: "mixed",
    },
    products,
    customers,
    revenue_drivers: revenueDrivers,
    competitive_positioning: competitivePositioning,
    operating_model: operatingModel,
    key_dependencies: keyDependencies,
    confidence,
    metadata: {
      schema_version: inputs.schemaVersion ?? DEFAULT_SCHEMA_VERSION,
      pipeline_version: inputs.pipelineVersion ?? DEFAULT_PIPELINE_VERSION,
      knowledge_version: inputs.knowledgeVersion ?? DEFAULT_KNOWLEDGE_VERSION,
      generated_at: inputs.generatedAt ?? getCurrentTimestamp(),
      input_hash: inputHash,
    },
    lineage: {
      source_filings: sourceFilings,
      derived_from: derivedFrom,
      model_version: inputs.modelVersion ?? DEFAULT_MODEL_VERSION,
      prompt_version: inputs.promptVersion ?? DEFAULT_PROMPT_VERSION,
    },
  };
}

export function calculateCompanyKnowledgeInputHash(inputs: BuildCompanyKnowledgeInputs): string {
  return calculateStringHash(JSON.stringify({
    companyIdentity: normalizeIdentityForHash(inputs.companyIdentity ?? null),
    companyProfile: normalizeProfileForHash(inputs.companyProfile ?? null),
    filingMetadata: inputs.filingMetadata ?? null,
    derivedFrom: [...(inputs.derivedFrom ?? [])].sort(),
    schemaVersion: inputs.schemaVersion ?? DEFAULT_SCHEMA_VERSION,
    pipelineVersion: inputs.pipelineVersion ?? DEFAULT_PIPELINE_VERSION,
    modelVersion: inputs.modelVersion ?? DEFAULT_MODEL_VERSION,
    promptVersion: inputs.promptVersion ?? DEFAULT_PROMPT_VERSION,
    knowledgeVersion: inputs.knowledgeVersion ?? DEFAULT_KNOWLEDGE_VERSION,
  }));
}

function buildCompetitivePositioning(inputs: BuildCompanyKnowledgeInputs): CompanyKnowledgeCompetitivePositioning[] {
  const identitySignals = cleanArray(inputs.companyIdentity?.competitive_signals ?? []);

  if (identitySignals.length > 0) {
    return dedupeBySignal(identitySignals.map((signal) => ({
      signal,
      source_type: "observed",
    })));
  }

  const legacyAdvantages = cleanArray(getLegacyProfileCompetitiveAdvantages(inputs.companyProfile));

  return dedupeBySignal(legacyAdvantages.map((signal) => ({
    signal,
    source_type: "claimed",
  })));
}

function buildKeyDependencies(inputs: BuildCompanyKnowledgeInputs): CompanyKnowledge["key_dependencies"] {
  void inputs;
  return [];
}

function calculateConfidence(params: {
  sourceFilingCount: number;
  hasIdentity: boolean;
  fieldValues: unknown[];
  lineageComplete: boolean;
}): CompanyKnowledge["confidence"] {
  const filingDepth = params.sourceFilingCount >= 2 ? 1 : params.sourceFilingCount === 1 ? 0.5 : 0;
  const identityCoverage = params.hasIdentity ? 1 : 0;
  const populatedFields = params.fieldValues.filter((value) =>
    Array.isArray(value) ? value.length > 0 : Boolean(String(value ?? "").trim()),
  ).length;
  const fieldCoverage = params.fieldValues.length === 0 ? 0 : populatedFields / params.fieldValues.length;
  const lineageCoverage = params.lineageComplete ? 1 : 0;
  const overall = clamp((filingDepth * 0.25)
    + (identityCoverage * 0.30)
    + (fieldCoverage * 0.30)
    + (lineageCoverage * 0.15));

  return {
    overall: round(overall),
    filing_depth: round(filingDepth),
    field_coverage: round(fieldCoverage),
  };
}

function mergeSourceFilings(inputs: BuildCompanyKnowledgeInputs): CompanyKnowledge["lineage"]["source_filings"] {
  const filings = [
    ...(inputs.filingMetadata ? [{
      id: inputs.filingMetadata.accession_number,
      period: inputs.filingMetadata.filing_date,
      type: inputs.filingMetadata.form_type,
    }] : []),
    ...(inputs.companyProfile?.source_filings ?? []).map((filingDate) => ({
      id: filingDate,
      period: filingDate,
      type: "unknown",
    })),
  ];
  const seen = new Set<string>();
  const output: CompanyKnowledge["lineage"]["source_filings"] = [];

  for (const filing of filings) {
    const key = `${filing.id.trim()}|${filing.period.trim()}|${filing.type.trim()}`.toLowerCase();

    if (!filing.id.trim() || seen.has(key)) {
      continue;
    }

    seen.add(key);
    output.push({
      id: filing.id.trim(),
      period: filing.period.trim(),
      type: filing.type.trim(),
    });
  }

  return output.sort((left, right) => left.period.localeCompare(right.period));
}

function mergeDerivedFrom(inputs: BuildCompanyKnowledgeInputs): string[] {
  return dedupeStrings([
    ...(inputs.companyIdentity ? ["company-identity"] : []),
    ...(inputs.companyProfile ? [`company-profile.${inputs.companyProfile.profile_quality}`] : []),
    ...(inputs.filingMetadata ? ["filing-metadata"] : []),
    ...(inputs.derivedFrom ?? []),
  ]);
}

function firstText(values: Array<string | undefined | null>): string {
  return values.map((value) => value?.trim() ?? "").find(Boolean) ?? "";
}

function firstArray(values: Array<string[] | undefined | null>): string[] {
  return values.map(cleanArray).find((value) => value.length > 0) ?? [];
}

function cleanArray(values: string[] | undefined | null): string[] {
  return dedupeStrings((values ?? []).map((value) => value.trim()).filter(Boolean));
}

function dedupeStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const value of values) {
    const key = value.toLowerCase();

    if (!seen.has(key)) {
      seen.add(key);
      output.push(value);
    }
  }

  return output;
}

function dedupeBySignal(values: CompanyKnowledgeCompetitivePositioning[]): CompanyKnowledgeCompetitivePositioning[] {
  const seen = new Set<string>();
  const output: CompanyKnowledgeCompetitivePositioning[] = [];

  for (const value of values) {
    const key = value.signal.toLowerCase();

    if (!seen.has(key)) {
      seen.add(key);
      output.push(value);
    }
  }

  return output;
}

function getLegacyProfileBusinessModel(profile?: CompanyProfileIntelligence | null): string {
  return profile && "business_model" in profile ? profile.business_model : "";
}

function getLegacyProfileCompetitiveAdvantages(profile?: CompanyProfileIntelligence | null): string[] {
  return profile && "competitive_advantages" in profile ? profile.competitive_advantages : [];
}

function normalizeIdentityForHash(identity: CompanyIdentityEnriched | null) {
  if (!identity) return null;

  return {
    ...identity,
    enrichment: {
      model: identity.enrichment.model,
      input_hash: identity.enrichment.input_hash,
    },
  };
}

function normalizeProfileForHash(profile: CompanyProfileIntelligence | null) {
  if (!profile) return null;

  if ("enrichment" in profile) {
    return {
      ...profile,
      enrichment: {
        model: profile.enrichment.model,
        input_hash: profile.enrichment.input_hash,
      },
    };
  }

  return profile;
}

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
