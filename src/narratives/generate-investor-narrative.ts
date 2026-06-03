import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { getCompanyConfig } from "../config/companies.js";
import { readJsonFile, fileExists } from "../shared/filesystem/file-reader.js";
import { writeJsonFile, writeTextFile } from "../shared/filesystem/file-writer.js";
import { getCurrentTimestamp } from "../shared/dates/timestamps.js";
import { getFilingDirectory } from "../storage/filing-paths.js";
import { estimateTokens } from "../ai/theme-input.js";
import type { OpenAIResponse, FilingMetadata } from "../types/pipeline.types.js";
import type { ThemeOutput } from "../types/theme.types.js";
import type { QuarterChangeReport } from "../change-engine/change.types.js";
import type { InvestorInsight } from "../insights/insight.types.js";
import {
  buildNarrativePrompt,
  buildNarrativePromptInput,
  calculateNarrativeInputHash,
  NARRATIVE_SYSTEM_PROMPT,
} from "./build-narrative-prompt.js";
import type {
  InvestorNarrative,
  NarrativeDecision,
  NarrativeGenerationReport,
  NarrativeMetadata,
} from "./narrative.types.js";

const OPENAI_API_URL = "https://api.openai.com/v1/responses";
const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

loadDotEnv();

type OpenAIClient = (params: {
  model: string;
  systemPrompt: string;
  prompt: string;
  schema: object;
}) => Promise<InvestorNarrative>;

const narrativeSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    headline: { type: "string" },
    executive_summary: { type: "string" },
    what_changed: { type: "string" },
    bull_case: { type: "string" },
    bear_case: { type: "string" },
    investor_takeaway: { type: "string" },
  },
  required: ["headline", "executive_summary", "what_changed", "bull_case", "bear_case", "investor_takeaway"],
};

export async function generateInvestorNarrative(
  ticker: string,
  filingDate: string,
  openAIClient: OpenAIClient = callOpenAI,
): Promise<NarrativeGenerationReport> {
  const company = getCompanyConfig(ticker);
  const filingDir = getFilingDirectory(company.ticker, filingDate);
  const paths = getNarrativePaths(filingDir);
  const filingMetadata = await readJsonFile<FilingMetadata>(paths.filingMetadataPath);
  const quarterChangeReport = await readJsonFile<QuarterChangeReport>(paths.quarterChangeReportPath);
  const investorInsight = await readJsonFile<InvestorInsight>(paths.investorInsightPath);
  const themesWithTopics = fileExists(paths.themesWithTopicsPath)
    ? await readJsonFile<ThemeOutput>(paths.themesWithTopicsPath)
    : null;
  const promptInput = buildNarrativePromptInput({
    filingMetadata,
    quarterChangeReport,
    investorInsight,
    themesWithTopics,
  });
  const inputHash = calculateNarrativeInputHash(promptInput);
  const prompt = buildNarrativePrompt(promptInput);
  const tokenEstimate = estimateTokens(`${NARRATIVE_SYSTEM_PROMPT}\n\n${prompt}`);
  const previousMetadata = await readNarrativeMetadata(paths.metadataPath);
  const decision = decideNarrativeGeneration({
    outputExists: fileExists(paths.outputJsonPath),
    previousInputHash: previousMetadata?.input_hash ?? null,
    currentInputHash: inputHash,
  });

  console.log(`Estimated narrative tokens: ${tokenEstimate}`);
  console.log("Expected cost tier: low");
  console.log(`Narrative decision: ${decision.status} (${decision.reason})`);

  if (decision.shouldGenerate) {
    const narrative = await requestInvestorNarrative(openAIClient, {
      model: MODEL,
      systemPrompt: NARRATIVE_SYSTEM_PROMPT,
      prompt,
      schema: narrativeSchema,
    });

    await writeJsonFile(paths.outputJsonPath, narrative);
    await writeTextFile(paths.outputMarkdownPath, buildMarkdownNarrative(narrative, filingMetadata));
    await writeNarrativeMetadata(paths.metadataPath, {
      input_hash: inputHash,
      generated_at: getCurrentTimestamp(),
      model: MODEL,
    });
  }

  const report = buildNarrativeGenerationReport({
    status: decision.status,
    reason: decision.reason,
    inputHash,
    tokenEstimate,
    model: MODEL,
  });

  await writeJsonFile(paths.reportPath, report);

  console.log(`Narrative report: ${paths.reportPath}`);
  console.log(`Narrative JSON: ${paths.outputJsonPath}`);
  console.log(`Narrative Markdown: ${paths.outputMarkdownPath}`);

  return report;
}

export function decideNarrativeGeneration(params: {
  outputExists: boolean;
  previousInputHash: string | null;
  currentInputHash: string;
}): NarrativeDecision {
  if (params.outputExists && params.previousInputHash === params.currentInputHash) {
    return {
      shouldGenerate: false,
      status: "skipped",
      reason: "unchanged",
    };
  }

  return {
    shouldGenerate: true,
    status: "generated",
    reason: "generated",
  };
}

export async function readNarrativeMetadata(path: string): Promise<NarrativeMetadata | null> {
  if (!fileExists(path)) {
    return null;
  }

  return readJsonFile<NarrativeMetadata>(path);
}

export async function writeNarrativeMetadata(path: string, metadata: NarrativeMetadata): Promise<void> {
  await writeJsonFile(path, metadata);
}

export function buildNarrativeGenerationReport(params: {
  status: NarrativeGenerationReport["status"];
  reason: NarrativeGenerationReport["reason"];
  inputHash: string;
  tokenEstimate: number;
  model: string;
}): NarrativeGenerationReport {
  return {
    status: params.status,
    reason: params.reason,
    input_hash: params.inputHash,
    token_estimate: params.tokenEstimate,
    model: params.model,
    generated_at: getCurrentTimestamp(),
  };
}

export async function requestInvestorNarrative(
  openAIClient: OpenAIClient,
  params: {
    model: string;
    systemPrompt: string;
    prompt: string;
    schema: object;
  },
): Promise<InvestorNarrative> {
  return openAIClient(params);
}

async function callOpenAI(params: {
  model: string;
  systemPrompt: string;
  prompt: string;
  schema: object;
}): Promise<InvestorNarrative> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required to generate investor narrative.");
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
          name: "investor_narrative",
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
  return JSON.parse(extractOutputText(responseJson)) as InvestorNarrative;
}

function buildMarkdownNarrative(narrative: InvestorNarrative, filingMetadata: FilingMetadata): string {
  return `# ${filingMetadata.company} Investor Narrative

**Filing Date:** ${filingMetadata.filing_date}

## Headline

${narrative.headline}

## Executive Summary

${narrative.executive_summary}

## What Changed

${narrative.what_changed}

## Bull Case

${narrative.bull_case}

## Bear Case

${narrative.bear_case}

## Investor Takeaway

${narrative.investor_takeaway}
`;
}

function getNarrativePaths(filingDir: string) {
  return {
    filingMetadataPath: join(filingDir, "metadata", "filing.json"),
    quarterChangeReportPath: join(filingDir, "comparison", "quarter-change-report.json"),
    investorInsightPath: join(filingDir, "insights", "investor-insight.json"),
    themesWithTopicsPath: join(filingDir, "intelligence", "themes.with-topics.json"),
    metadataPath: join(filingDir, "metadata", "narrative-metadata.json"),
    reportPath: join(filingDir, "reports", "narrative-generation-report.json"),
    outputJsonPath: join(filingDir, "narratives", "investor-narrative.json"),
    outputMarkdownPath: join(filingDir, "narratives", "investor-narrative.md"),
  };
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
  if (!ticker || !filingDate) {
    console.error("Usage: npm run generate:narrative -- <ticker> <filing-date>");
    process.exitCode = 1;
  } else {
    generateInvestorNarrative(ticker, filingDate).catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
  }
}
