import { join } from "node:path";
import { getCompanyConfig } from "../config/companies.js";
import { getCurrentTimestamp } from "../shared/dates/timestamps.js";
import { readTextFile } from "../shared/filesystem/file-reader.js";
import { writeJsonFile } from "../shared/filesystem/file-writer.js";
import { getFilingDirectory } from "../storage/filing-paths.js";
import { resolveFilingDate } from "../storage/resolve-filing.js";
import type { Chunk } from "../types/chunk.types.js";
import type { CompanyConfig } from "../types/company.types.js";

type TokenEstimateReport = {
  company: string;
  ticker: string;
  filing_date: string;
  total_chunks: number;
  input_characters: number;
  estimated_tokens: number;
  generated_at: string;
};

const THEME_SYSTEM_PROMPT = `You are a senior financial intelligence analyst.

Extract evidence-backed financial themes from supplied filing evidence.
The Evidence Catalog owns evidence identity.
Themes must use exact evidence_ref values supplied in the Evidence Catalog.
Never generate, transform, hash, infer, or guess an evidence_ref.
Fabricated identifiers are invalid and will be rejected by the validator.
Do not make unsupported claims.
Do not include markdown.
Return JSON only.`;

export async function estimateFilingTokens(ticker: string, filingDate?: string): Promise<TokenEstimateReport> {
  const company = getCompanyConfig(ticker);
  const resolvedFilingDate = await resolveFilingDate(company.ticker, filingDate);
  const filingDir = getFilingDirectory(company.ticker, resolvedFilingDate);
  const chunks = await loadThemeChunks(join(filingDir, "chunks"));
  const estimate = buildThemeInputEstimate(company, chunks);
  const report: TokenEstimateReport = {
    company: company.company,
    ticker: company.ticker,
    filing_date: resolvedFilingDate,
    total_chunks: chunks.length,
    input_characters: estimate.inputCharacters,
    estimated_tokens: estimate.estimatedTokens,
    generated_at: getCurrentTimestamp(),
  };
  const reportPath = join(filingDir, "reports", "token-estimate.json");

  await writeJsonFile(reportPath, report);

  console.log(`Company: ${report.company} (${report.ticker})`);
  console.log(`Filing Date: ${report.filing_date}`);
  console.log("");
  console.log(`Total chunks analyzed: ${report.total_chunks}`);
  console.log(`Input size: ${report.input_characters} characters`);
  console.log(`Token count estimate: ${report.estimated_tokens}`);
  console.log("");
  console.log(`JSON report: ${reportPath}`);

  return report;
}

async function loadThemeChunks(chunksDir: string): Promise<Chunk[]> {
  const managementChunks = JSON.parse(
    await readTextFile(join(chunksDir, "management-discussion.chunks.json")),
  ) as Chunk[];
  const riskChunks = JSON.parse(
    await readTextFile(join(chunksDir, "risk-factors.chunks.json")),
  ) as Chunk[];

  return [...managementChunks, ...riskChunks];
}

function buildThemeInputEstimate(
  company: CompanyConfig,
  chunks: Chunk[],
): {
  inputCharacters: number;
  estimatedTokens: number;
} {
  const chunkPayload = chunks.map((chunk) => ({
    chunk_id: chunk.chunk_id,
    company: chunk.company,
    ticker: chunk.ticker,
    form_type: chunk.form_type,
    filing_date: chunk.filing_date,
    section: chunk.section,
    text: chunk.text,
  }));
  const prompt = `Estimate the Theme extraction request for ${company.company} ${company.ticker}.

The records below are prompt-delivery inputs used only for token estimation.
Production Theme grounding uses exact evidence_ref values supplied by the
Evidence Catalog.

Output schema:
{
  "company": "",
  "ticker": "",
  "filing_date": "",
  "themes": [
    {
      "theme": "",
      "category": "",
      "importance": "high | medium | low",
      "summary": "",
      "evidence": []
    }
  ]
}

Allowed categories include:
- growth
- margins
- liquidity
- competition
- supply_chain
- regulation
- antitrust
- privacy
- cybersecurity
- artificial_intelligence
- product_quality
- macroeconomic
- investments
- taxation

Rules:
- Every theme must have at least one exact Evidence Catalog evidence_ref.
- Evidence_ref values must be selected exactly as supplied.
- Never generate, transform, hash, infer, or guess an evidence_ref.
- Fabricated identifiers are invalid and rejected by validation.
- Do not invent facts, metrics, trends, or risks not supported by filing
  evidence.
- Prefer specific, filing-grounded themes over generic summaries.
- Keep summaries concise but concrete.

Prompt-delivery records:
${JSON.stringify(chunkPayload, null, 2)}`;
  const inputCharacters = prompt.length + THEME_SYSTEM_PROMPT.length;

  return {
    inputCharacters,
    estimatedTokens: Math.ceil(
      `${THEME_SYSTEM_PROMPT}\n\n${prompt}`.length / 4,
    ),
  };
}

const ticker = process.argv[2];
const filingDate = process.argv[3];

if (require.main === module) {
  if (!ticker) {
    console.error("Usage: npm run token:estimate -- <ticker> [filing-date]");
    process.exitCode = 1;
  } else {
    estimateFilingTokens(ticker, filingDate).catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
  }
}
