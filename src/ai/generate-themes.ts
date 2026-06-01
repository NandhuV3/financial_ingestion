import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { getCompanyConfig, getCompanyDataDir } from "../config/companies.js";
import type { Chunk } from "../types/chunk.types.js";
import type { CompanyConfig } from "../types/company.types.js";
import type { OpenAIResponse } from "../types/pipeline.types.js";
import type { ThemeOutput } from "../types/theme.types.js";

const OPENAI_API_URL = "https://api.openai.com/v1/responses";

loadDotEnv();

const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

const SYSTEM_PROMPT = `You are a senior financial intelligence analyst.

Extract evidence-backed financial themes from SEC filing chunks.
Every theme must cite supporting chunk IDs from the provided chunks.
Do not make unsupported claims.
Do not include markdown.
Return JSON only.`;

export async function generateThemes(company: CompanyConfig): Promise<void> {
  const companyDataDir = join(process.cwd(), "data", getCompanyDataDir(company));
  const chunksDir = join(companyDataDir, "chunks");
  const intelligenceDir = join(companyDataDir, "intelligence");
  const outputPath = join(intelligenceDir, "themes.json");
  const chunks = await loadChunks(chunksDir);
  const chunkIds = chunks.map((chunk) => chunk.chunk_id);
  const themeSchema = buildThemeSchema(chunkIds);
  const prompt = buildPrompt(company, chunks);
  const inputSize = prompt.length + SYSTEM_PROMPT.length;
  const tokenEstimate = estimateTokens(`${SYSTEM_PROMPT}\n\n${prompt}`);
  const apiKey = process.env.OPENAI_API_KEY;

  console.log(`Model: ${MODEL}`);
  console.log(`Total chunks analyzed: ${chunks.length}`);
  console.log(`Input size: ${inputSize} characters`);
  console.log(`Token count estimate: ${tokenEstimate}`);

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required to generate evidence-backed themes.");
  }

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      input: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "apple_q2_2026_evidence_backed_themes",
          strict: true,
          schema: themeSchema,
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${response.statusText}\n${errorText}`);
  }

  const responseJson = (await response.json()) as OpenAIResponse;
  const outputText = extractOutputText(responseJson);
  const themes = JSON.parse(outputText) as ThemeOutput;

  validateThemeOutput(themes, new Set(chunkIds));

  const referencedChunkIds = getReferencedChunkIds(themes);
  const chunksNotReferenced = chunkIds.filter((chunkId) => !referencedChunkIds.includes(chunkId));
  const evidenceCoverage = `${referencedChunkIds.length}/${chunks.length}`;
  const formattedOutput = `${JSON.stringify(themes, null, 2)}\n`;

  await mkdir(intelligenceDir, { recursive: true });
  await writeFile(outputPath, formattedOutput, "utf8");

  console.log(`Themes generated: ${themes.themes.length}`);
  console.log(`Evidence coverage: ${evidenceCoverage} chunks referenced`);
  console.log(`Chunk IDs referenced: ${referencedChunkIds.join(", ")}`);
  console.log(`Chunks not referenced: ${chunksNotReferenced.join(", ") || "none"}`);
  console.log(`Output size: ${formattedOutput.length} characters`);
  console.log(`Saved themes to: ${outputPath}`);
}

async function loadChunks(chunksDir: string): Promise<Chunk[]> {
  const managementChunks = JSON.parse(
    await readFile(join(chunksDir, "management-discussion.chunks.json"), "utf8"),
  ) as Chunk[];
  const riskChunks = JSON.parse(await readFile(join(chunksDir, "risk-factors.chunks.json"), "utf8")) as Chunk[];
  return [...managementChunks, ...riskChunks];
}

function buildPrompt(company: CompanyConfig, chunks: Chunk[]): string {
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

function buildThemeSchema(chunkIds: string[]): object {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      company: { type: "string" },
      ticker: { type: "string" },
      filing_date: { type: "string" },
      themes: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            theme: { type: "string" },
            category: { type: "string" },
            importance: { type: "string", enum: ["high", "medium", "low"] },
            summary: { type: "string" },
            evidence: {
              type: "array",
              items: { type: "string", enum: chunkIds },
            },
          },
          required: ["theme", "category", "importance", "summary", "evidence"],
        },
      },
    },
    required: ["company", "ticker", "filing_date", "themes"],
  };
}

function validateThemeOutput(output: ThemeOutput, validChunkIds: Set<string>): void {
  if (!output.themes.length) {
    throw new Error("Theme output did not include any themes.");
  }

  for (const theme of output.themes) {
    if (!theme.evidence.length) {
      throw new Error(`Theme "${theme.theme}" has no evidence.`);
    }

    for (const chunkId of theme.evidence) {
      if (!validChunkIds.has(chunkId)) {
        throw new Error(`Theme "${theme.theme}" references unknown chunk ID: ${chunkId}`);
      }
    }
  }
}

function getReferencedChunkIds(output: ThemeOutput): string[] {
  return [...new Set(output.themes.flatMap((theme) => theme.evidence))].sort();
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

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
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

if (require.main === module) {
  const ticker = process.argv[2];

  if (!ticker) {
    console.error("Usage: npm run generate:themes -- <ticker>");
    process.exitCode = 1;
  } else {
    const company = getCompanyConfig(ticker);

    generateThemes(company).catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
  }
}
