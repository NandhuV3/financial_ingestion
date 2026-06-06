import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCompanyProfileIntelligenceForFiling, getCompanyProfileDirectory, getCompanyProfileEnrichedPath, getCompanyProfileRawPath, writeCompanyProfileIntelligence } from "../build-company-profile-intelligence.js";
import type { CompanyProfileEnriched, CompanyProfileEnrichmentMetadata, CompanyProfileRaw } from "../company-profile.types.js";
import { estimateTokens } from "../../ai/theme-input.js";
import { getCompanyConfig } from "../../config/companies.js";
import { readJsonFile, fileExists } from "../../shared/filesystem/file-reader.js";
import { writeJsonFile } from "../../shared/filesystem/file-writer.js";
import { getCurrentTimestamp } from "../../shared/dates/timestamps.js";
import { createLogger } from "../../shared/logger.js";
import type { OpenAIResponse } from "../../types/pipeline.types.js";
import {
  buildCompanyProfileEnrichmentPrompt,
  buildCompanyProfileEnrichmentPromptInput,
  calculateCompanyProfileRawHash,
  COMPANY_PROFILE_ENRICHMENT_SYSTEM_PROMPT,
} from "./build-company-profile-enrichment-prompt.js";
import type {
  CompanyProfileEnrichmentClient,
  CompanyProfileEnrichmentDecision,
  CompanyProfileEnrichmentFields,
  CompanyProfileEnrichmentReport,
  CompanyProfileEnrichmentResult,
} from "./company-profile-enrichment.types.js";

const OPENAI_API_URL = "https://api.openai.com/v1/responses";
const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
const logger = createLogger("company-profile-enrichment");

loadDotEnv();

const enrichmentSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    business_model: { type: "string" },
    competitive_advantages: {
      type: "array",
      items: { type: "string" },
    },
    customer_value_proposition: { type: "string" },
  },
  required: ["business_model", "competitive_advantages", "customer_value_proposition"],
};

export async function enrichCompanyProfile(
  ticker: string,
  openAIClient: CompanyProfileEnrichmentClient = callOpenAI,
): Promise<CompanyProfileEnrichmentResult> {
  const startedAt = Date.now();
  const company = getCompanyConfig(ticker);
  const rawProfile = await readOrBuildRawProfile(company.ticker);
  const inputHash = calculateCompanyProfileRawHash(rawProfile);
  const enrichedPath = getCompanyProfileEnrichedPath(company.ticker);
  const previousEnriched = fileExists(enrichedPath)
    ? await readJsonFile<CompanyProfileEnriched>(enrichedPath)
    : null;
  const decision = decideCompanyProfileEnrichment({
    enrichedExists: Boolean(previousEnriched),
    previousInputHash: previousEnriched?.enrichment.input_hash ?? null,
    currentInputHash: inputHash,
  });
  const promptInput = buildCompanyProfileEnrichmentPromptInput(rawProfile);
  const prompt = buildCompanyProfileEnrichmentPrompt(promptInput);
  const tokenEstimate = estimateTokens(`${COMPANY_PROFILE_ENRICHMENT_SYSTEM_PROMPT}\n\n${prompt}`);

  logger.info("Company profile enrichment decision.", {
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
    await writeJsonFile(getCompanyProfileEnrichmentReportPath(company.ticker), report);

    return {
      report,
      profile: previousEnriched,
    };
  }

  const enrichmentFields = validateEnrichmentFields(await openAIClient({
    model: MODEL,
    systemPrompt: COMPANY_PROFILE_ENRICHMENT_SYSTEM_PROMPT,
    prompt,
    schema: enrichmentSchema,
  }));
  const metadata: CompanyProfileEnrichmentMetadata = {
    model: MODEL,
    generated_at: getCurrentTimestamp(),
    input_hash: inputHash,
  };
  const enrichedProfile = mergeEnrichment(rawProfile, enrichmentFields, metadata);
  const report = buildEnrichmentReport({
    status: decision.status,
    reason: decision.reason,
    model: MODEL,
    inputHash,
  });

  await writeJsonFile(enrichedPath, enrichedProfile);
  await writeCompanyProfileIntelligence(company.ticker, enrichedProfile);
  await writeJsonFile(getCompanyProfileEnrichmentReportPath(company.ticker), report);

  logger.info("Company profile enrichment generated.", {
    ticker: company.ticker,
    duration_ms: Date.now() - startedAt,
    input_hash: inputHash,
  });

  return {
    report,
    profile: enrichedProfile,
  };
}

export function decideCompanyProfileEnrichment(params: {
  enrichedExists: boolean;
  previousInputHash: string | null;
  currentInputHash: string;
}): CompanyProfileEnrichmentDecision {
  if (params.enrichedExists && params.previousInputHash === params.currentInputHash) {
    return {
      shouldGenerate: false,
      status: "skipped",
      reason: "raw_profile_unchanged",
    };
  }

  return {
    shouldGenerate: true,
    status: "generated",
    reason: "raw_profile_changed",
  };
}

export function mergeEnrichment(
  rawProfile: CompanyProfileRaw,
  enrichment: CompanyProfileEnrichmentFields,
  metadata: CompanyProfileEnrichmentMetadata,
): CompanyProfileEnriched {
  return {
    company: rawProfile.company,
    business_model: enrichment.business_model,
    products: rawProfile.products,
    customers: rawProfile.customers,
    competitive_advantages: enrichment.competitive_advantages,
    business_risks: rawProfile.business_risks,
    themes: rawProfile.themes,
    topics: rawProfile.topics,
    source_filings: rawProfile.source_filings,
    customer_value_proposition: enrichment.customer_value_proposition,
    profile_quality: "enriched",
    enrichment: metadata,
  };
}

export function getCompanyProfileEnrichmentReportPath(ticker: string): string {
  return join(getCompanyProfileDirectory(ticker), "company-profile-enrichment-report.json");
}

async function readOrBuildRawProfile(ticker: string): Promise<CompanyProfileRaw> {
  const rawPath = getCompanyProfileRawPath(ticker);

  if (fileExists(rawPath)) {
    return readJsonFile<CompanyProfileRaw>(rawPath);
  }

  return buildCompanyProfileIntelligenceForFiling(ticker);
}

function buildEnrichmentReport(params: {
  status: CompanyProfileEnrichmentReport["status"];
  reason: CompanyProfileEnrichmentReport["reason"];
  model: string;
  inputHash: string;
}): CompanyProfileEnrichmentReport {
  return {
    status: params.status,
    reason: params.reason,
    model: params.model,
    input_hash: params.inputHash,
    generated_at: getCurrentTimestamp(),
  };
}

function validateEnrichmentFields(fields: CompanyProfileEnrichmentFields): CompanyProfileEnrichmentFields {
  if (!fields.business_model?.trim()) {
    throw new Error("Company profile enrichment is missing business_model.");
  }

  if (!Array.isArray(fields.competitive_advantages) || fields.competitive_advantages.length === 0) {
    throw new Error("Company profile enrichment is missing competitive_advantages.");
  }

  if (!fields.customer_value_proposition?.trim()) {
    throw new Error("Company profile enrichment is missing customer_value_proposition.");
  }

  return {
    business_model: fields.business_model.trim(),
    competitive_advantages: fields.competitive_advantages.map((advantage) => advantage.trim()).filter(Boolean),
    customer_value_proposition: fields.customer_value_proposition.trim(),
  };
}

async function callOpenAI(params: {
  model: string;
  systemPrompt: string;
  prompt: string;
  schema: object;
}): Promise<CompanyProfileEnrichmentFields> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required to enrich company profile intelligence.");
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
        {
          role: "system",
          content: params.systemPrompt,
        },
        {
          role: "user",
          content: params.prompt,
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "company_profile_enrichment",
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
  return JSON.parse(extractOutputText(responseJson)) as CompanyProfileEnrichmentFields;
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
    console.error("Usage: npm run enrich:company-profile -- <ticker>");
    process.exitCode = 1;
  } else {
    enrichCompanyProfile(ticker).then(({ report }) => {
      console.log(`Company profile enrichment: ${report.status} (${report.reason})`);
      console.log(`Input hash: ${report.input_hash}`);
    }).catch((error) => {
      logger.error("Company profile enrichment failed.", {
        ticker,
        error: error instanceof Error ? error.message : String(error),
      });
      process.exitCode = 1;
    });
  }
}
