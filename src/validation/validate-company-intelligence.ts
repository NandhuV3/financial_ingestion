import { join } from "node:path";
import { buildBusinessSignals } from "../business-signal-intelligence/build-business-signals.js";
import { buildCompanyKnowledge } from "../company-knowledge/build-company-knowledge.js";
import { buildQuarterUnderstanding, type LLMReasoningOutput } from "../quarter-understanding-intelligence/build-quarter-understanding.js";
import { readJsonFile } from "../shared/filesystem/file-reader.js";
import { writeJsonFile } from "../shared/filesystem/file-writer.js";
import { generateStructuredIntelligenceArtifact } from "../structured-intelligence/generate-structured-intelligence.js";
import { getFilingDirectory } from "../storage/filing-paths.js";
import { resolveFilingDate } from "../storage/resolve-filing.js";
import type { FilingMetadata } from "../types/pipeline.types.js";

const TICKER = "MSFT";
const REPORTING_PERIOD = "validation-period";
const OUTPUT_DIRECTORY = join(process.cwd(), "validation-output");

async function validateCompanyIntelligence(): Promise<void> {
  const filingDate = await resolveFilingDate(TICKER);
  const filingMetadata = await readJsonFile<FilingMetadata>(
    join(getFilingDirectory(TICKER, filingDate), "metadata", "filing.json"),
  );
  const structuredIntelligence = await generateStructuredIntelligenceArtifact({
    ticker: TICKER,
    filingDate,
  });
  const companyKnowledge = buildCompanyKnowledge({
    structuredIntelligence,
    filingMetadata,
  });
  const businessSignals = buildBusinessSignals({
    companyKnowledge,
    filingMetadata,
    reportingPeriod: REPORTING_PERIOD,
    derivedFrom: [
      {
        path: "validation-output/company-knowledge.json",
        version: companyKnowledge.metadata.knowledge_version,
        input_hash: companyKnowledge.metadata.input_hash,
      },
    ],
  });
  const reasoningOutput = buildMockReasoningOutput(businessSignals.signals);
  const quarterUnderstanding = buildQuarterUnderstanding({
    companyKnowledge,
    businessSignalArtifact: businessSignals,
    reportingPeriod: REPORTING_PERIOD,
    reasoningOutput,
    derivedFrom: [
      {
        path: "validation-output/company-knowledge.json",
        version: companyKnowledge.metadata.knowledge_version,
        input_hash: companyKnowledge.metadata.input_hash,
      },
    ],
  });

  await writeJsonFile(join(OUTPUT_DIRECTORY, "company-knowledge.json"), companyKnowledge);
  await writeJsonFile(join(OUTPUT_DIRECTORY, "business-signals.json"), businessSignals);
  await writeJsonFile(join(OUTPUT_DIRECTORY, "quarter-understanding.json"), quarterUnderstanding);

  printArtifact("Company Knowledge", companyKnowledge);
  printArtifact("Business Signals", businessSignals);
  printArtifact("Quarter Understanding", quarterUnderstanding);
}

function buildMockReasoningOutput(
  signals: ReturnType<typeof buildBusinessSignals>["signals"],
): LLMReasoningOutput {
  return {
    reasoning_schema_version: "validation-mock-v1",
    understandings: signals.slice(0, 3).map((signal, index) => ({
      category: signal.category,
      semantic_anchor_key: semanticAnchorFor(signal.summary, index),
      summary: `Validation understanding from signal: ${signal.summary}`,
      importance: index === 0 ? "high" : "medium",
      signal_agreement: "corroborating",
      company_knowledge_alignment: "consistent",
      supporting_signal_ids: [signal.signal_id],
    })),
  };
}

function semanticAnchorFor(value: string, index: number): string {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);

  return normalized || `validation_signal_${index + 1}`;
}

function printArtifact(label: string, artifact: unknown): void {
  console.log(`\n=== ${label} ===`);
  console.log(JSON.stringify(artifact, null, 2));
}

if (require.main === module) {
  validateCompanyIntelligence().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
