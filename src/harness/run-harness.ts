import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { QuarterChangeReport } from "../change-engine/change.types.js";
import { buildCompanyKnowledge } from "../company-knowledge/build-company-knowledge.js";
import { FileCompanyKnowledgeRepository } from "../company-knowledge/company-knowledge.repository.js";
import type { CompanyKnowledge } from "../company-knowledge/types/company-knowledge.types.js";
import { buildPartnerCompanyIntelligence } from "../partner-domain/build-partner-intelligence.js";
import type { PartnerTopicEvolutionSource } from "../partner-domain/partner-source.types.js";
import { fileExists, readJsonFile } from "../shared/filesystem/file-reader.js";
import { writeJsonFile } from "../shared/filesystem/file-writer.js";
import { getCompanyDirectory, getFilingDirectory } from "../storage/filing-paths.js";
import { resolveFilingDate } from "../storage/resolve-filing.js";
import {
  buildStructuredIntelligencePromptInput,
  type StructuredIntelligencePromptSourceArtifacts,
} from "../structured-intelligence/build-structured-intelligence.prompt.js";
import { getStructuredIntelligencePath } from "../structured-intelligence/structured-intelligence.paths.js";
import type { StructuredIntelligence } from "../structured-intelligence/types/structured-intelligence.types.js";
import type { FilingMetadata } from "../types/pipeline.types.js";
import type { ThemeOutput } from "../types/theme.types.js";
import type { TopicAssignmentOutputV2 } from "../topic-assignment-v2/assignment.types.js";
import { evaluateArchitectureContracts } from "./evaluators/evaluate-architecture.js";
import { evaluateCompanyKnowledge } from "./evaluators/evaluate-company-knowledge.js";
import { evaluateFiveQuestions } from "./evaluators/evaluate-five-questions.js";
import { evaluatePartnerDomain } from "./evaluators/evaluate-partner-domain.js";
import { evaluateStructuredIntelligence } from "./evaluators/evaluate-structured-intelligence.js";
import type { HarnessReport, HarnessScorecard } from "./harness.types.js";
import { average } from "./scorecard.js";

export async function runHarness(ticker: string): Promise<HarnessReport> {
  const normalizedTicker = ticker.trim().toUpperCase();
  const filingDate = await resolveFilingDate(normalizedTicker);
  const sourceArtifacts = await loadPromptSourceArtifacts(normalizedTicker, filingDate);
  const promptInput = buildStructuredIntelligencePromptInput(sourceArtifacts);
  const structuredIntelligence = await readJsonFile<StructuredIntelligence>(
    getStructuredIntelligencePath(normalizedTicker, filingDate),
  );
  const companyKnowledge = await loadOrBuildCompanyKnowledge(normalizedTicker, sourceArtifacts.filingMetadata, structuredIntelligence);
  const partnerDomain = await buildPartnerDomainWithCompanyKnowledge(normalizedTicker, filingDate, companyKnowledge);
  const architecture = evaluateArchitectureContracts();
  const artifacts = [
    evaluateStructuredIntelligence({
      artifact: structuredIntelligence,
      promptInput,
    }),
    evaluateCompanyKnowledge({
      knowledge: companyKnowledge,
      structuredIntelligence,
    }),
    evaluatePartnerDomain(partnerDomain),
    evaluateFiveQuestions(partnerDomain.fiveQuestions),
  ];
  const report: HarnessReport = {
    ticker: normalizedTicker,
    filing_date: filingDate,
    overall_score: average([...artifacts, architecture].map((scorecard) => scorecard.overall_score)),
    artifacts,
    warnings: [...artifacts, architecture].flatMap((scorecard) => scorecard.warnings),
    failures: [...artifacts, architecture].flatMap((scorecard) => scorecard.failures),
    architecture,
  };

  await writeJsonFile(join(process.cwd(), "src", "harness", "reports", `${normalizedTicker}-harness-report.json`), report);

  return report;
}

async function loadPromptSourceArtifacts(
  ticker: string,
  filingDate: string,
): Promise<StructuredIntelligencePromptSourceArtifacts> {
  const filingDir = getFilingDirectory(ticker, filingDate);
  const companyDir = getCompanyDirectory(ticker);

  return {
    filingMetadata: await readJsonFile<FilingMetadata>(join(filingDir, "metadata", "filing.json")),
    themes: await readOptionalJson<ThemeOutput>(join(filingDir, "intelligence", "themes.json")),
    topicAssignments: await readOptionalJson<TopicAssignmentOutputV2>(join(filingDir, "intelligence", "themes.with-topics.json")),
    quarterChanges: await readOptionalJson<QuarterChangeReport>(join(filingDir, "comparison", "quarter-change-report.json")),
    topicEvolution: await readOptionalJson<PartnerTopicEvolutionSource>(join(companyDir, "reports", "topic-evolution-report.json")),
  };
}

async function loadOrBuildCompanyKnowledge(
  ticker: string,
  filingMetadata: FilingMetadata,
  structuredIntelligence: StructuredIntelligence,
): Promise<CompanyKnowledge> {
  const repository = new FileCompanyKnowledgeRepository(process.env.PARTNER_WAREHOUSE_ROOT);
  const existing = await repository.loadCurrent(ticker);

  if (existing) {
    return existing;
  }

  return buildCompanyKnowledge({
    structuredIntelligence,
    filingMetadata,
  });
}

async function buildPartnerDomainWithCompanyKnowledge(
  ticker: string,
  filingDate: string,
  companyKnowledge: CompanyKnowledge,
) {
  const previousWarehouseRoot = process.env.PARTNER_WAREHOUSE_ROOT;
  const warehouseRoot = await mkdtemp(join(tmpdir(), "financial-harness-warehouse-"));
  const repository = new FileCompanyKnowledgeRepository(warehouseRoot);

  process.env.PARTNER_WAREHOUSE_ROOT = warehouseRoot;
  await repository.save(ticker, companyKnowledge);

  try {
    return await buildPartnerCompanyIntelligence(ticker, filingDate);
  } finally {
    if (previousWarehouseRoot === undefined) {
      delete process.env.PARTNER_WAREHOUSE_ROOT;
    } else {
      process.env.PARTNER_WAREHOUSE_ROOT = previousWarehouseRoot;
    }
  }
}

async function readOptionalJson<T>(path: string): Promise<T | null> {
  return fileExists(path) ? readJsonFile<T>(path) : null;
}

function printSummary(report: HarnessReport): void {
  console.log("## Harness Summary");
  console.log("");

  for (const artifact of report.artifacts) {
    console.log(`${displayArtifactName(artifact)}: ${status(artifact)}`);
  }

  console.log(`Architecture: ${status(report.architecture)}`);
  console.log("");
  console.log(`Overall Score: ${report.overall_score.toFixed(2)}`);
  console.log(`Warnings: ${report.warnings.length}`);
  console.log(`Failures: ${report.failures.length}`);
}

function displayArtifactName(scorecard: HarnessScorecard): string {
  return scorecard.artifact
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function status(scorecard: HarnessScorecard): "PASS" | "FAIL" {
  return scorecard.failures.length === 0 ? "PASS" : "FAIL";
}

const ticker = process.argv[2];

if (require.main === module) {
  if (!ticker) {
    console.error("Usage: tsx src/harness/run-harness.ts <ticker>");
    process.exitCode = 1;
  } else {
    runHarness(ticker).then(printSummary).catch((error) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    });
  }
}
