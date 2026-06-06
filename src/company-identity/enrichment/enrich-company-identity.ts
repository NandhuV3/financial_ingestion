import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { estimateTokens } from "../../ai/theme-input.js";
import { getCompanyConfig } from "../../config/companies.js";
import { getCurrentTimestamp } from "../../shared/dates/timestamps.js";
import { fileExists, readJsonFile } from "../../shared/filesystem/file-reader.js";
import { writeJsonFile } from "../../shared/filesystem/file-writer.js";
import { createLogger } from "../../shared/logger.js";
import type { OpenAIResponse } from "../../types/pipeline.types.js";
import {
  buildCompanyIdentityEvidenceForFiling,
  getCompanyIdentityEnrichedPath,
  getCompanyIdentityEvidencePath,
  getCompanyIdentityPath,
} from "../build-company-identity.js";
import type { CompanyIdentityEnriched, CompanyIdentityEvidence } from "../company-identity.types.js";
import {
  buildCompanyIdentityEnrichmentPrompt,
  buildCompanyIdentityEnrichmentPromptInput,
  calculateCompanyIdentityEvidenceHash,
  COMPANY_IDENTITY_ENRICHMENT_SYSTEM_PROMPT,
} from "./build-company-identity-enrichment-prompt.js";
import type {
  CompanyIdentityEnrichmentClient,
  CompanyIdentityEnrichmentDecision,
  CompanyIdentityEnrichmentReport,
  CompanyIdentityEnrichmentResult,
} from "./company-identity-enrichment.types.js";

const OPENAI_API_URL = "https://api.openai.com/v1/responses";
const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
const logger = createLogger("company-identity-enrichment");

loadDotEnv();

const enrichmentSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    business_description: { type: "string" },
    primary_products: { type: "array", items: { type: "string" } },
    primary_customers: { type: "array", items: { type: "string" } },
    revenue_drivers: { type: "array", items: { type: "string" } },
    business_model_signals: { type: "array", items: { type: "string" } },
    competitive_signals: { type: "array", items: { type: "string" } },
    operating_signals: { type: "array", items: { type: "string" } },
  },
  required: [
    "business_description",
    "primary_products",
    "primary_customers",
    "revenue_drivers",
    "business_model_signals",
    "competitive_signals",
    "operating_signals",
  ],
};

export async function enrichCompanyIdentity(
  ticker: string,
  openAIClient: CompanyIdentityEnrichmentClient = callOpenAI,
): Promise<CompanyIdentityEnrichmentResult> {
  const company = getCompanyConfig(ticker);
  const evidence = await readOrBuildEvidence(company.ticker);
  const inputHash = calculateCompanyIdentityEvidenceHash(evidence);
  const enrichedPath = getCompanyIdentityEnrichedPath(company.ticker);
  const previousEnriched = fileExists(enrichedPath)
    ? await readJsonFile<CompanyIdentityEnriched>(enrichedPath)
    : null;
  const previousEnrichedIsValid = previousEnriched ? isValidPreviousEnrichment(previousEnriched, evidence, company.ticker) : false;
  const decision = decideCompanyIdentityEnrichment({
    enrichedExists: Boolean(previousEnriched),
    previousInputHash: previousEnrichedIsValid ? previousEnriched?.enrichment.input_hash ?? null : null,
    currentInputHash: inputHash,
  });
  const promptInput = buildCompanyIdentityEnrichmentPromptInput(evidence);
  const prompt = buildCompanyIdentityEnrichmentPrompt(promptInput);
  const tokenEstimate = estimateTokens(`${COMPANY_IDENTITY_ENRICHMENT_SYSTEM_PROMPT}\n\n${prompt}`);

  logger.info("Company identity enrichment decision.", {
    ticker: company.ticker,
    status: decision.status,
    reason: decision.reason,
    token_estimate: tokenEstimate,
  });

  if (!decision.shouldGenerate && previousEnriched) {
    const report = buildEnrichmentReport({
      status: decision.status,
      reason: decision.reason,
      model: previousEnriched.enrichment.model,
      inputHash,
    });
    await writeJsonFile(getCompanyIdentityEnrichmentReportPath(company.ticker), report);

    return {
      report,
      identity: previousEnriched,
      evidence,
    };
  }

  const generated = validateCompanyIdentityEnrichmentOutput(await openAIClient({
    model: MODEL,
    systemPrompt: COMPANY_IDENTITY_ENRICHMENT_SYSTEM_PROMPT,
    prompt,
    schema: enrichmentSchema,
  }), evidence);
  const identity: CompanyIdentityEnriched = {
    company: evidence.company,
    ...generated,
    enrichment: {
      model: MODEL,
      generated_at: getCurrentTimestamp(),
      input_hash: inputHash,
    },
  };
  const report = buildEnrichmentReport({
    status: decision.status,
    reason: decision.reason,
    model: MODEL,
    inputHash,
  });

  await writeJsonFile(enrichedPath, identity);
  await writeJsonFile(getCompanyIdentityPath(company.ticker), identity);
  await writeJsonFile(getCompanyIdentityEnrichmentReportPath(company.ticker), report);

  return {
    report,
    identity,
    evidence,
  };
}

export function decideCompanyIdentityEnrichment(params: {
  enrichedExists: boolean;
  previousInputHash: string | null;
  currentInputHash: string;
}): CompanyIdentityEnrichmentDecision {
  if (params.enrichedExists && params.previousInputHash === params.currentInputHash) {
    return {
      shouldGenerate: false,
      status: "skipped",
      reason: "evidence_unchanged",
    };
  }

  return {
    shouldGenerate: true,
    status: "generated",
    reason: "evidence_changed",
  };
}

export function getCompanyIdentityEnrichmentReportPath(ticker: string): string {
  return join(process.cwd(), "data", ticker.trim().toUpperCase(), "company-identity", "company-identity-enrichment-report.json");
}

async function readOrBuildEvidence(ticker: string): Promise<CompanyIdentityEvidence> {
  const evidencePath = getCompanyIdentityEvidencePath(ticker);

  if (fileExists(evidencePath)) {
    return readJsonFile<CompanyIdentityEvidence>(evidencePath);
  }

  return buildCompanyIdentityEvidenceForFiling(ticker);
}

function buildEnrichmentReport(params: {
  status: CompanyIdentityEnrichmentReport["status"];
  reason: CompanyIdentityEnrichmentReport["reason"];
  model: string;
  inputHash: string;
}): CompanyIdentityEnrichmentReport {
  return {
    status: params.status,
    reason: params.reason,
    model: params.model,
    input_hash: params.inputHash,
    generated_at: getCurrentTimestamp(),
  };
}

export function validateCompanyIdentityEnrichmentOutput(
  output: Omit<CompanyIdentityEnriched, "company" | "enrichment">,
  evidence?: CompanyIdentityEvidence,
): Omit<CompanyIdentityEnriched, "company" | "enrichment"> {
  if (!output.business_description?.trim()) {
    throw new Error("Company identity enrichment is missing business_description.");
  }

  for (const field of [
    "primary_products",
    "primary_customers",
    "revenue_drivers",
    "business_model_signals",
    "competitive_signals",
    "operating_signals",
  ] as const) {
    if (!Array.isArray(output[field])) {
      throw new Error(`Company identity enrichment field ${field} must be an array.`);
    }
  }

  const cleaned = {
    business_description: output.business_description.trim(),
    primary_products: cleanArray(output.primary_products),
    primary_customers: cleanArray(output.primary_customers),
    revenue_drivers: cleanArray(output.revenue_drivers),
    business_model_signals: cleanArray(output.business_model_signals),
    competitive_signals: cleanArray(output.competitive_signals),
    operating_signals: cleanArray(output.operating_signals),
  };

  validateBusinessDescription(cleaned.business_description);
  validateFieldDoesNotContainBlockedLanguage("revenue_drivers", cleaned.revenue_drivers, [
    "growth",
    "revenue growth",
    "margin",
    "investment",
    "opportunity",
    "quarterly performance",
  ]);
  validateFieldDoesNotContainBlockedLanguage("competitive_signals", cleaned.competitive_signals, [
    "competition",
    "competitor",
    "competitors",
    "market pressure",
    "regulatory pressure",
    "antitrust",
  ]);
  validateFieldDoesNotContainBlockedLanguage("operating_signals", cleaned.operating_signals, [
    "risk",
    "pressure",
    "competition",
    "inflation",
    "supplier limitation",
    "limited supplier",
    "supply chain risk",
  ]);

  if (evidence) {
    validateEvidenceHasIdentitySupport(evidence);
    validateRevenueDriversDoNotCopyThemes(cleaned.revenue_drivers, evidence);
    validateOperatingSignalsHaveEvidence(cleaned.operating_signals, evidence);
  }

  return cleaned;
}

function cleanArray(values: string[]): string[] {
  return values.map((value) => value.trim()).filter(Boolean);
}

function validateBusinessDescription(description: string): void {
  const normalized = normalizeForValidation(description);

  for (const phrase of ["leading company", "innovative company", "world-class company"]) {
    if (normalized.includes(phrase)) {
      throw new Error(`Company identity enrichment business_description contains marketing language: ${phrase}.`);
    }
  }
}

function validateEvidenceHasIdentitySupport(evidence: CompanyIdentityEvidence): void {
  const hasIdentityEvidence = evidence.products.length > 0
    || evidence.customers.length > 0
    || Boolean(evidence.narrative_summary?.trim());

  if (!hasIdentityEvidence) {
    throw new Error("Company identity enrichment has insufficient identity evidence.");
  }
}

function validateFieldDoesNotContainBlockedLanguage(
  field: keyof Pick<CompanyIdentityEnriched, "revenue_drivers" | "competitive_signals" | "operating_signals">,
  values: string[],
  blockedTerms: string[],
): void {
  for (const value of values) {
    const normalized = normalizeForValidation(value);
    const blockedTerm = blockedTerms.find((term) => normalized.includes(normalizeForValidation(term)));

    if (blockedTerm) {
      throw new Error(`Company identity enrichment field ${field} contains invalid signal "${value}" (${blockedTerm}).`);
    }
  }
}

function validateRevenueDriversDoNotCopyThemes(values: string[], evidence: CompanyIdentityEvidence): void {
  const themeNames = evidence.themes.map((theme) => normalizeForValidation(theme));
  const opportunities = evidence.opportunities.map((opportunity) => normalizeForValidation(opportunity));

  for (const value of values) {
    const normalized = normalizeForValidation(value);
    const copiedTheme = themeNames.find((theme) => theme && normalized === theme);
    const copiedOpportunity = opportunities.find((opportunity) => opportunity && normalized === opportunity);

    if (copiedTheme) {
      throw new Error(`Company identity enrichment revenue_drivers copied a theme name: ${value}.`);
    }

    if (copiedOpportunity) {
      throw new Error(`Company identity enrichment revenue_drivers copied an opportunity statement: ${value}.`);
    }
  }
}

function validateOperatingSignalsHaveEvidence(values: string[], evidence: CompanyIdentityEvidence): void {
  const evidenceText = normalizeForValidation([
    ...evidence.products,
    ...evidence.customers,
    ...evidence.themes,
    ...evidence.topics,
    evidence.narrative_summary ?? "",
  ].join(" "));
  const supportRules: Array<{ signal: string; keywords: string[] }> = [
    { signal: "cloud infrastructure", keywords: ["cloud", "datacenter"] },
    { signal: "logistics network", keywords: ["logistics", "fulfillment", "delivery network"] },
    { signal: "manufacturing capability", keywords: ["manufacturing", "hardware", "device"] },
    { signal: "developer platform ecosystem", keywords: ["developer", "platform"] },
    { signal: "global distribution network", keywords: ["distribution", "regional", "global"] },
  ];

  for (const value of values) {
    const normalized = normalizeForValidation(value);
    const rule = supportRules.find((candidate) => normalized === candidate.signal);

    if (rule && !rule.keywords.some((keyword) => evidenceText.includes(keyword))) {
      throw new Error(`Company identity enrichment operating signal lacks evidence support: ${value}.`);
    }
  }
}

function isValidPreviousEnrichment(
  identity: CompanyIdentityEnriched,
  evidence: CompanyIdentityEvidence,
  ticker: string,
): boolean {
  try {
    validateCompanyIdentityEnrichmentOutput(identity, evidence);
    return true;
  } catch (error) {
    logger.warn("Existing company identity enrichment failed current validation; regenerating.", {
      ticker,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

function normalizeForValidation(value: string): string {
  return value.toLowerCase().replace(/[_-]/g, " ").replace(/\s+/g, " ").trim();
}

async function callOpenAI(params: {
  model: string;
  systemPrompt: string;
  prompt: string;
  schema: object;
}): Promise<Omit<CompanyIdentityEnriched, "company" | "enrichment">> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required to enrich company identity intelligence.");
  }

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: params.model,
      input: [
        { role: "system", content: params.systemPrompt },
        { role: "user", content: params.prompt },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "company_identity_enrichment",
          strict: true,
          schema: params.schema,
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${response.statusText}\n${errorText}`);
  }

  const responseJson = (await response.json()) as OpenAIResponse;
  return JSON.parse(extractOutputText(responseJson)) as Omit<CompanyIdentityEnriched, "company" | "enrichment">;
}

function extractOutputText(response: OpenAIResponse): string {
  if (typeof response.output_text === "string") {
    return response.output_text;
  }

  const textParts: string[] = [];

  for (const output of response.output ?? []) {
    for (const content of output.content ?? []) {
      if (content.type === "output_text" && typeof content.text === "string") {
        textParts.push(content.text);
      }
    }
  }

  const outputText = textParts.join("");

  if (!outputText) {
    throw new Error("OpenAI response did not include output text.");
  }

  return outputText;
}

function loadDotEnv(): void {
  const envPath = join(process.cwd(), ".env");

  if (!existsSync(envPath)) {
    return;
  }

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, "");

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

const ticker = process.argv[2];

if (require.main === module) {
  if (!ticker) {
    console.error("Usage: npm run identity:company:enrich -- <ticker>");
    process.exitCode = 1;
  } else {
    enrichCompanyIdentity(ticker).then(({ report }) => {
      console.log(`Company identity enrichment: ${report.status} (${report.reason})`);
      console.log(`Input hash: ${report.input_hash}`);
    }).catch((error) => {
      logger.error("Company identity enrichment failed.", {
        ticker,
        error: error instanceof Error ? error.message : String(error),
      });
      process.exitCode = 1;
    });
  }
}
