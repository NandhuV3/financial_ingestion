import { join } from "node:path";
import type { QuarterChangeReport } from "../change-engine/change.types.js";
import type { PartnerTopicEvolutionSource } from "../partner-domain/partner-source.types.js";
import { fileExists, readJsonFile } from "../shared/filesystem/file-reader.js";
import { writeJsonFile, writeTextFile } from "../shared/filesystem/file-writer.js";
import { getCompanyDirectory, getFilingDirectory } from "../storage/filing-paths.js";
import { resolveFilingDate } from "../storage/resolve-filing.js";
import type { FilingMetadata } from "../types/pipeline.types.js";
import type { ThemeOutput } from "../types/theme.types.js";
import type { TopicAssignmentOutputV2 } from "../topic-assignment-v2/assignment.types.js";
import {
  buildStructuredIntelligence,
  calculateSourceCoverage,
  type StructuredIntelligenceArtifactPaths,
  type StructuredIntelligenceSourceArtifacts,
} from "./build-structured-intelligence.js";
import {
  buildStructuredIntelligencePrompt,
  buildStructuredIntelligencePromptInput,
  generateStructuredIntelligence as requestStructuredIntelligence,
} from "./build-structured-intelligence.prompt.js";
import { STRUCTURED_INTELLIGENCE_SYSTEM_PROMPT_ID } from "../prompt-registry/filesystem-prompt-provider.js";
import { PromptResolver } from "../prompt-registry/prompt-resolver.js";
import {
  STRUCTURED_INTELLIGENCE_MODEL_VERSION,
  STRUCTURED_INTELLIGENCE_SCHEMA_VERSION,
} from "./structured-intelligence.constants.js";
import { calculateEffectivePromptHash } from "../prompt-registry/prompt-hash.js";
import type { PromptProvenance } from "../prompt-registry/prompt-provenance.types.js";
import { calculateStructuredIntelligenceInputHash } from "./structured-intelligence.hash.js";
import {
  getStructuredIntelligencePromptPath,
  getStructuredIntelligenceRawResponsePath,
  getStructuredIntelligenceReportPath,
} from "./structured-intelligence.paths.js";
import {
  FileStructuredIntelligenceRepository,
  type StructuredIntelligenceRepository,
} from "./structured-intelligence.repository.js";
import {
  calculateStructuredIntelligenceQualityMetrics,
  validateStructuredIntelligenceOutput,
} from "./structured-intelligence.validation.js";
import type { StructuredIntelligenceLLMOutput } from "./types/build-structured-intelligence.prompt.types.js";
import type { StructuredIntelligenceGenerationReport } from "./types/structured-intelligence-report.types.js";
import type { StructuredIntelligence } from "./types/structured-intelligence.types.js";
import { loadEnv } from "../shared/config/load.env.js";
loadEnv();

export type GenerateStructuredIntelligenceParams = {
  ticker: string;
  filingDate?: string;
  generatedAt?: string;
  repository?: StructuredIntelligenceRepository;
  generator?: (params: {
    prompt: string;
    systemPrompt?: string;
    model?: string;
  }) => Promise<StructuredIntelligenceLLMOutput>;
};

export async function generateStructuredIntelligenceArtifact(
  params: GenerateStructuredIntelligenceParams,
): Promise<StructuredIntelligence> {
  const startedAt = Date.now();
  const resolvedFilingDate = await resolveFilingDate(params.ticker, params.filingDate);
  const repository = params.repository ?? new FileStructuredIntelligenceRepository();
  const { artifacts, paths } = await loadSourceArtifacts(params.ticker, resolvedFilingDate);
  const promptInput = buildStructuredIntelligencePromptInput(artifacts);
  const prompt = buildStructuredIntelligencePrompt(promptInput);
  const resolvedSystemPrompt = new PromptResolver().resolve(STRUCTURED_INTELLIGENCE_SYSTEM_PROMPT_ID);
  const promptProvenance = buildStructuredIntelligencePromptProvenance(resolvedSystemPrompt, prompt);
  const systemPrompt = resolvedSystemPrompt.content;
  const generatedAt = params.generatedAt ?? new Date().toISOString();
  const inputHash = calculateStructuredIntelligenceInputHash(promptInput);

  await writeTextFile(
    getStructuredIntelligencePromptPath(params.ticker, resolvedFilingDate),
    prompt,
  );

  const rawOutput = await (params.generator ?? requestStructuredIntelligence)({
    prompt,
    systemPrompt,
    model: STRUCTURED_INTELLIGENCE_MODEL_VERSION,
  });

  await writeJsonFile(
    getStructuredIntelligenceRawResponsePath(params.ticker, resolvedFilingDate),
    rawOutput,
  );

  const validated = validateStructuredIntelligenceOutput(rawOutput);
  const qualityMetrics = calculateStructuredIntelligenceQualityMetrics(validated);
  const artifact = buildStructuredIntelligence({
    artifacts,
    promptInput,
    output: validated,
    paths,
    promptProvenance,
    generatedAt,
  });

  await repository.save(params.ticker, resolvedFilingDate, artifact);
  await writeReport(params.ticker, resolvedFilingDate, {
    status: "generated",
    duration_ms: Date.now() - startedAt,
    source_coverage: calculateSourceCoverage(artifacts),
    input_hash: inputHash,
    model_version: STRUCTURED_INTELLIGENCE_MODEL_VERSION,
    prompt_version: promptProvenance.prompt_version,
    prompt_provenance: promptProvenance,
    generated_at: generatedAt,
    validation_passed: true,
    ...qualityMetrics,
  });

  return artifact;
}

export function buildStructuredIntelligencePromptProvenance(
  resolvedSystemPrompt: {
    promptId: string;
    version: string;
    content: string;
    source: PromptProvenance["prompt_source"];
    activationId?: string | null;
  },
  userPrompt: string,
): PromptProvenance {
  return {
    prompt_id: resolvedSystemPrompt.promptId,
    prompt_version: resolvedSystemPrompt.version,
    prompt_hash: calculateEffectivePromptHash({
      systemPrompt: resolvedSystemPrompt.content,
      userPrompt,
      schemaVersion: STRUCTURED_INTELLIGENCE_SCHEMA_VERSION,
    }),
    prompt_source: resolvedSystemPrompt.source,
    activation_id: resolvedSystemPrompt.activationId ?? null,
  };
}

async function loadSourceArtifacts(
  ticker: string,
  filingDate: string,
): Promise<{
  artifacts: StructuredIntelligenceSourceArtifacts;
  paths: StructuredIntelligenceArtifactPaths;
}> {
  const filingDir = getFilingDirectory(ticker, filingDate);
  const companyDir = getCompanyDirectory(ticker);
  const paths = {
    filingMetadata: join(filingDir, "metadata", "filing.json"),
    themes: join(filingDir, "intelligence", "themes.json"),
    topicAssignments: join(filingDir, "intelligence", "themes.with-topics.json"),
    quarterChanges: join(filingDir, "comparison", "quarter-change-report.json"),
    topicEvolution: join(companyDir, "reports", "topic-evolution-report.json"),
  };

  return {
    paths,
    artifacts: {
      filingMetadata: await readJsonFile<FilingMetadata>(paths.filingMetadata),
      themes: await readOptionalJson<ThemeOutput>(paths.themes),
      topicAssignments: await readOptionalJson<TopicAssignmentOutputV2>(paths.topicAssignments),
      quarterChanges: await readOptionalJson<QuarterChangeReport>(paths.quarterChanges),
      topicEvolution: await readOptionalJson<PartnerTopicEvolutionSource>(paths.topicEvolution),
    },
  };
}

async function writeReport(
  ticker: string,
  filingDate: string,
  report: StructuredIntelligenceGenerationReport,
): Promise<void> {
  await writeJsonFile(getStructuredIntelligenceReportPath(ticker, filingDate), report);
}

async function readOptionalJson<T>(path: string): Promise<T | null> {
  return fileExists(path) ? readJsonFile<T>(path) : null;
}

const ticker = process.argv[2];
const filingDate = process.argv[3];

if (require.main === module) {
  if (!ticker) {
    console.error("Usage: tsx src/structured-intelligence/generate-structured-intelligence.ts <ticker> [filing-date]");
    process.exitCode = 1;
  } else {
    generateStructuredIntelligenceArtifact({ ticker, filingDate }).catch((error) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    });
  }
}
