import { join } from "node:path";
import { fileExists, readJsonFile } from "../shared/filesystem/file-reader.js";
import { createLogger } from "../shared/logger.js";
import { getFilingDirectory } from "../storage/filing-paths.js";
import { FileStructuredIntelligenceRepository } from "../structured-intelligence/structured-intelligence.repository.js";
import type { FilingMetadata } from "../types/pipeline.types.js";
import { FileCompanyKnowledgeRepository } from "./company-knowledge.repository.js";
import { generateCompanyKnowledge } from "./generate-company-knowledge.js";
import type { CompanyKnowledge } from "./types/company-knowledge.types.js";

const logger = createLogger("company-knowledge-command");

export async function generateCompanyKnowledgeCommand(
  ticker: string,
  filingDate: string,
): Promise<CompanyKnowledge> {
  const normalizedTicker = ticker.trim().toUpperCase();
  const normalizedFilingDate = filingDate.trim();
  const filingDir = getFilingDirectory(normalizedTicker, normalizedFilingDate);
  const warehouseRoot = process.env.PARTNER_WAREHOUSE_ROOT;
  const filingMetadata = await readRequiredJson<FilingMetadata>(
    join(filingDir, "metadata", "filing.json"),
    `Missing filing metadata for ${normalizedTicker} ${normalizedFilingDate}. Run filing ingestion before Company Knowledge.`,
  );
  const structuredIntelligenceRepository = new FileStructuredIntelligenceRepository();
  const structuredIntelligence = await structuredIntelligenceRepository.load(normalizedTicker, normalizedFilingDate);

  if (!structuredIntelligence) {
    throw new Error(
      `Missing Structured Intelligence for ${normalizedTicker} ${normalizedFilingDate}. Run: npm run generate:structured-intelligence -- ${normalizedTicker} ${normalizedFilingDate}`,
    );
  }

  const repository = new FileCompanyKnowledgeRepository(warehouseRoot);
  const artifact = await generateCompanyKnowledge({
    ticker: normalizedTicker,
    structuredIntelligence,
    filingMetadata,
    repository,
  });
  const fieldCounts = countCompanyKnowledgeFields(artifact);
  const artifactPath = companyKnowledgeCurrentPath(warehouseRoot, normalizedTicker);

  logger.info("Company Knowledge generated.", {
    ticker: normalizedTicker,
    filing_date: normalizedFilingDate,
    artifact_path: artifactPath,
    confidence_overall: artifact.confidence.overall,
    confidence_filing_depth: artifact.confidence.filing_depth,
    confidence_field_coverage: artifact.confidence.field_coverage,
    populated_fields: fieldCounts.populated,
    total_fields: fieldCounts.total,
  });

  console.log(`Company Knowledge generated for ${normalizedTicker}`);
  console.log(`Confidence: ${artifact.confidence.overall}`);
  console.log(`Fields: ${fieldCounts.populated}/${fieldCounts.total}`);
  console.log(`Current artifact: ${artifactPath}`);

  return artifact;
}

export function countCompanyKnowledgeFields(artifact: CompanyKnowledge): {
  populated: number;
  total: number;
} {
  const fields = [
    artifact.business_description,
    artifact.products,
    artifact.customers,
    artifact.revenue_drivers,
    artifact.competitive_positioning,
    artifact.operating_model,
    artifact.key_dependencies,
    artifact.strategic_priorities,
    artifact.risks,
    artifact.opportunities,
  ];
  const populated = fields.filter((value) =>
    Array.isArray(value) ? value.length > 0 : Boolean(value.trim()),
  ).length;

  return {
    populated,
    total: fields.length,
  };
}

async function readRequiredJson<T>(path: string, missingMessage: string): Promise<T> {
  if (!fileExists(path)) {
    throw new Error(missingMessage);
  }

  return readJsonFile<T>(path);
}

function companyKnowledgeCurrentPath(warehouseRoot: string | undefined, ticker: string): string {
  return join(
    warehouseRoot ?? join(process.cwd(), "warehouse"),
    "companies",
    ticker.trim().toUpperCase(),
    "company-knowledge",
    "current.json",
  );
}

const ticker = process.argv[2];
const filingDate = process.argv[3];

if (require.main === module) {
  if (!ticker || !filingDate) {
    logger.error("Usage: npm run generate:company-knowledge -- <ticker> <filing-date>", {});
    process.exitCode = 1;
  } else {
    generateCompanyKnowledgeCommand(ticker, filingDate).catch((error) => {
      logger.error("Company Knowledge generation failed.", {
        ticker,
        filing_date: filingDate,
        error: error instanceof Error ? error.message : String(error),
      });
      process.exitCode = 1;
    });
  }
}
