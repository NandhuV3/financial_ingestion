import { join } from "node:path";
import { readTextFile } from "../shared/filesystem/file-reader.js";
import type { Chunk } from "../types/chunk.types.js";
import type { CompanyConfig } from "../types/company.types.js";

export const THEME_SYSTEM_PROMPT = `You are a senior financial intelligence analyst.

Extract evidence-backed financial themes from SEC filing chunks.
Every theme must cite supporting chunk IDs from the provided chunks.
Do not make unsupported claims.
Do not include markdown.
Return JSON only.`;

export type ThemeInputEstimate = {
  chunks: Chunk[];
  prompt: string;
  inputCharacters: number;
  estimatedTokens: number;
};

export async function loadThemeChunks(chunksDir: string): Promise<Chunk[]> {
  const managementChunks = JSON.parse(
    await readTextFile(join(chunksDir, "management-discussion.chunks.json")),
  ) as Chunk[];
  const riskChunks = JSON.parse(await readTextFile(join(chunksDir, "risk-factors.chunks.json"))) as Chunk[];
  return [...managementChunks, ...riskChunks];
}

export function buildThemePrompt(company: CompanyConfig, chunks: Chunk[]): string {
  const chunkPayload = chunks.map((chunk) => ({
    chunk_id: chunk.chunk_id,
    company: chunk.company,
    ticker: chunk.ticker,
    form_type: chunk.form_type,
    filing_date: chunk.filing_date,
    section: chunk.section,
    text: chunk.text,
  }));

  return `Generate evidence-backed financial themes from these ${company.company} ${company.ticker} SEC filing chunks.

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
- Every theme must have at least one evidence chunk ID.
- Evidence IDs must come from the provided chunks exactly.
- Use multiple evidence chunks when a theme is supported across sections.
- A chunk may support multiple themes.
- Do not invent facts, metrics, trends, or risks not supported by the chunks.
- Prefer specific, filing-grounded themes over generic summaries.
- Keep summaries concise but concrete.

Chunks:
${JSON.stringify(chunkPayload, null, 2)}`;
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function buildThemeInputEstimate(company: CompanyConfig, chunks: Chunk[]): ThemeInputEstimate {
  const prompt = buildThemePrompt(company, chunks);
  const inputCharacters = prompt.length + THEME_SYSTEM_PROMPT.length;

  return {
    chunks,
    prompt,
    inputCharacters,
    estimatedTokens: estimateTokens(`${THEME_SYSTEM_PROMPT}\n\n${prompt}`),
  };
}
