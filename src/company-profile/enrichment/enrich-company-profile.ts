import { join } from "node:path";
import { buildCompanyProfileIntelligenceForFiling, getCompanyProfileDirectory, getCompanyProfileRawPath } from "../build-company-profile-intelligence.js";
import type { CompanyProfileRaw } from "../company-profile.types.js";
import { getCompanyConfig } from "../../config/companies.js";
import { readJsonFile, fileExists } from "../../shared/filesystem/file-reader.js";
import { writeJsonFile } from "../../shared/filesystem/file-writer.js";
import { getCurrentTimestamp } from "../../shared/dates/timestamps.js";
import { createLogger } from "../../shared/logger.js";
import {
  calculateCompanyProfileRawHash,
} from "./build-company-profile-enrichment-prompt.js";
import type {
  CompanyProfileEnrichmentDecision,
  CompanyProfileEnrichmentReport,
  CompanyProfileEnrichmentResult,
} from "./company-profile-enrichment.types.js";

const logger = createLogger("company-profile-enrichment");

export async function enrichCompanyProfile(ticker: string): Promise<CompanyProfileEnrichmentResult> {
  const startedAt = Date.now();
  const company = getCompanyConfig(ticker);
  const rawProfile = await readOrBuildRawProfile(company.ticker);
  const inputHash = calculateCompanyProfileRawHash(rawProfile);
  const decision = decideCompanyProfileEnrichment();

  logger.info("Company profile enrichment decision.", {
    ticker: company.ticker,
    status: decision.status,
    reason: decision.reason,
  });

  const report = buildEnrichmentReport({
    status: decision.status,
    reason: decision.reason,
    model: "company-identity",
    inputHash,
  });

  await writeJsonFile(getCompanyProfileEnrichmentReportPath(company.ticker), report);

  logger.info("Company profile enrichment skipped; company identity owns business understanding.", {
    ticker: company.ticker,
    duration_ms: Date.now() - startedAt,
    input_hash: inputHash,
  });

  return {
    report,
    profile: rawProfile,
  };
}

export function decideCompanyProfileEnrichment(): CompanyProfileEnrichmentDecision {
  return {
    shouldGenerate: false,
    status: "skipped",
    reason: "identity_owns_business_understanding",
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
