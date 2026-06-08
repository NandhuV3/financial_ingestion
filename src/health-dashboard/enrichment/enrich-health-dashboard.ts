import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { estimateTokens } from "../../ai/theme-input.js";
import { getCompanyConfig } from "../../config/companies.js";
import { getCurrentTimestamp } from "../../shared/dates/timestamps.js";
import { fileExists, readJsonFile } from "../../shared/filesystem/file-reader.js";
import { writeJsonFile } from "../../shared/filesystem/file-writer.js";
import { createLogger } from "../../shared/logger.js";
import { resolveFilingDate } from "../../storage/resolve-filing.js";
import type { OpenAIResponse } from "../../types/pipeline.types.js";
import {
  buildHealthDashboardEvidenceForFiling,
} from "../build-health-dashboard-evidence.js";
import {
  getHealthDashboardEnrichedPath,
  getHealthDashboardEnrichmentReportPath,
  getHealthDashboardEvidencePath,
} from "../health-dashboard-paths.js";
import type {
  BusinessHealthEvidence,
  HealthDashboardEnriched,
  HealthDashboardEnrichmentClient,
  HealthDashboardEnrichmentDecision,
  HealthDashboardEnrichmentReport,
  HealthDashboardEnrichmentResult,
  HealthDashboardNarrativeOutput,
} from "../health-dashboard.types.js";
import {
  buildHealthDashboardEnrichmentPrompt,
  calculateBusinessHealthEvidenceHash,
  HEALTH_DASHBOARD_ENRICHMENT_SYSTEM_PROMPT,
} from "./build-health-dashboard-enrichment-prompt.js";

const OPENAI_API_URL = "https://api.openai.com/v1/responses";
const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
const logger = createLogger("health-dashboard-enrichment");

loadDotEnv();

const enrichmentSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    explanation: { type: "string" },
    strengthening_areas: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          explanation: { type: "string" },
        },
        required: ["title", "explanation"],
      },
    },
    watch_areas: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          explanation: { type: "string" },
        },
        required: ["title", "explanation"],
      },
    },
  },
  required: ["explanation", "strengthening_areas", "watch_areas"],
};

export async function enrichHealthDashboard(
  ticker: string,
  filingDate?: string,
  openAIClient: HealthDashboardEnrichmentClient = callOpenAI,
): Promise<HealthDashboardEnrichmentResult> {
  const company = getCompanyConfig(ticker);
  const resolvedFilingDate = await resolveFilingDate(company.ticker, filingDate);
  const evidence = await readOrBuildEvidence(company.ticker, resolvedFilingDate);
  const inputHash = calculateBusinessHealthEvidenceHash(evidence);
  const enrichedPath = getHealthDashboardEnrichedPath(company.ticker, resolvedFilingDate);
  const previousEnriched = fileExists(enrichedPath)
    ? await readJsonFile<HealthDashboardEnriched>(enrichedPath)
    : null;
  const decision = decideHealthDashboardEnrichment({
    enrichedExists: Boolean(previousEnriched),
    previousInputHash: previousEnriched?.enrichment.input_hash ?? null,
    currentInputHash: inputHash,
  });
  const prompt = buildHealthDashboardEnrichmentPrompt(evidence);
  const tokenEstimate = estimateTokens(`${HEALTH_DASHBOARD_ENRICHMENT_SYSTEM_PROMPT}\n\n${prompt}`);

  logger.info("Health dashboard enrichment decision.", {
    ticker: company.ticker,
    filing_date: resolvedFilingDate,
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
    await writeJsonFile(getHealthDashboardEnrichmentReportPath(company.ticker, resolvedFilingDate), report);

    return {
      report,
      evidence,
      dashboard: previousEnriched,
    };
  }

  const generated = validateHealthDashboardEnrichmentOutput(await openAIClient({
    model: MODEL,
    systemPrompt: HEALTH_DASHBOARD_ENRICHMENT_SYSTEM_PROMPT,
    prompt,
    schema: enrichmentSchema,
  }));
  const dashboard: HealthDashboardEnriched = {
    company: evidence.company,
    ticker: evidence.ticker,
    filing_date: evidence.filing_date,
    health_status: evidence.health_status,
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

  await writeJsonFile(enrichedPath, dashboard);
  await writeJsonFile(getHealthDashboardEnrichmentReportPath(company.ticker, resolvedFilingDate), report);

  return {
    report,
    evidence,
    dashboard,
  };
}

export function decideHealthDashboardEnrichment(params: {
  enrichedExists: boolean;
  previousInputHash: string | null;
  currentInputHash: string;
}): HealthDashboardEnrichmentDecision {
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

export function validateHealthDashboardEnrichmentOutput(
  output: HealthDashboardNarrativeOutput,
): HealthDashboardNarrativeOutput {
  if (!output.explanation?.trim()) {
    throw new Error("Health dashboard enrichment is missing explanation.");
  }

  return {
    explanation: output.explanation.trim(),
    strengthening_areas: cleanAreas(output.strengthening_areas).slice(0, 3),
    watch_areas: cleanAreas(output.watch_areas).slice(0, 3),
  };
}

async function readOrBuildEvidence(ticker: string, filingDate: string): Promise<BusinessHealthEvidence> {
  const evidencePath = getHealthDashboardEvidencePath(ticker, filingDate);

  if (fileExists(evidencePath)) {
    return readJsonFile<BusinessHealthEvidence>(evidencePath);
  }

  return buildHealthDashboardEvidenceForFiling(ticker, filingDate);
}

function buildEnrichmentReport(params: {
  status: HealthDashboardEnrichmentReport["status"];
  reason: HealthDashboardEnrichmentReport["reason"];
  model: string;
  inputHash: string;
}): HealthDashboardEnrichmentReport {
  return {
    status: params.status,
    reason: params.reason,
    model: params.model,
    input_hash: params.inputHash,
    generated_at: getCurrentTimestamp(),
  };
}

function cleanAreas(values: HealthDashboardNarrativeOutput["strengthening_areas"]) {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .map((value) => ({
      title: typeof value.title === "string" ? value.title.trim() : "",
      explanation: typeof value.explanation === "string" ? value.explanation.trim() : "",
    }))
    .filter((value) => value.title && value.explanation);
}

async function callOpenAI(params: {
  model: string;
  systemPrompt: string;
  prompt: string;
  schema: object;
}): Promise<HealthDashboardNarrativeOutput> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required to enrich health dashboard narrative.");
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
          name: "health_dashboard_enrichment",
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
  return JSON.parse(extractOutputText(responseJson)) as HealthDashboardNarrativeOutput;
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
const filingDate = process.argv[3];

if (require.main === module) {
  if (!ticker) {
    logger.error("Missing ticker for health dashboard enrichment.", {
      usage: "npm run health:enrich -- <ticker> [filingDate]",
    });
    process.exitCode = 1;
  } else {
    enrichHealthDashboard(ticker, filingDate).then(({ report }) => {
      logger.info("Health dashboard enrichment completed.", {
        ticker,
        filing_date: filingDate,
        status: report.status,
        reason: report.reason,
        input_hash: report.input_hash,
      });
    }).catch((error) => {
      logger.error("Health dashboard enrichment failed.", {
        ticker,
        filing_date: filingDate,
        error: error instanceof Error ? error.message : String(error),
      });
      process.exitCode = 1;
    });
  }
}
