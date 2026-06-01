import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { getCompanyConfig, getCompanyDataDir } from "../config/companies.js";
import type { CompanyConfig } from "../types/company.types.js";
import type { OpenAIResponse } from "../types/pipeline.types.js";

const OPENAI_API_URL = "https://api.openai.com/v1/responses";
const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

const SYSTEM_PROMPT = `You are a senior financial intelligence analyst.

Extract structured business intelligence from SEC filing text.
Use only the provided filing content.
Avoid generic summaries.
Preserve traceability by grounding every point in the filing language.
Return JSON only.`;

const intelligenceSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    business_summary: { type: "string" },
    key_themes: { type: "array", items: { type: "string" } },
    growth_drivers: { type: "array", items: { type: "string" } },
    risks: { type: "array", items: { type: "string" } },
    management_focus: { type: "array", items: { type: "string" } },
    notable_changes: { type: "array", items: { type: "string" } },
  },
  required: [
    "business_summary",
    "key_themes",
    "growth_drivers",
    "risks",
    "management_focus",
    "notable_changes",
  ],
};

export async function generateIntelligence(company: CompanyConfig): Promise<void> {
  const companyDataDir = join(process.cwd(), "data", getCompanyDataDir(company));
  const normalizedDir = join(companyDataDir, "normalized");
  const intelligenceDir = join(companyDataDir, "intelligence");
  const outputPath = join(intelligenceDir, "intelligence.json");
  const managementDiscussion = await readFile(join(normalizedDir, "management-discussion.cleaned.txt"), "utf8");
  const riskFactors = await readFile(join(normalizedDir, "risk-factors.cleaned.txt"), "utf8");
  const prompt = buildPrompt(company, managementDiscussion, riskFactors);
  const inputSize = managementDiscussion.length + riskFactors.length;
  const tokenEstimate = estimateTokens(`${SYSTEM_PROMPT}\n\n${prompt}`);
  const apiKey = process.env.OPENAI_API_KEY;

  console.log(`Model: ${MODEL}`);
  console.log(`Input size: ${inputSize} characters`);
  console.log(`Token count estimate: ${tokenEstimate}`);

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required to generate intelligence.");
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
          name: "apple_quarterly_business_intelligence",
          strict: true,
          schema: intelligenceSchema,
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
  const parsedOutput = JSON.parse(outputText) as IntelligenceOutput;
  const formattedOutput = `${JSON.stringify(parsedOutput, null, 2)}\n`;

  await mkdir(intelligenceDir, { recursive: true });
  await writeFile(outputPath, formattedOutput, "utf8");

  console.log(`Output size: ${formattedOutput.length} characters`);
  console.log(`Generated sections: ${Object.keys(parsedOutput).join(", ")}`);
  console.log(`Saved intelligence to: ${outputPath}`);
}

function buildPrompt(company: CompanyConfig, managementDiscussion: string, riskFactors: string): string {
  return `Generate structured business intelligence for ${company.company} ${company.ticker} from the normalized SEC filing sections below.

Output requirements:
- JSON only.
- Use the exact schema provided by the API response format.
- Keep each array focused and specific.
- Prefer concrete filing-grounded observations over generic business language.
- Do not invent information not present in the sections.
- If a category has limited support in the filing text, include a short filing-grounded statement rather than guessing.

Sections to extract:
- business_summary: 2-4 sentences on what the filing says about the business period.
- key_themes: recurring business themes from management discussion and risk factors.
- growth_drivers: drivers of sales, margin, services, products, regions, or demand described in the filing.
- risks: specific risks described in the filing.
- management_focus: operational, strategic, financial, regulatory, or product areas management appears focused on.
- notable_changes: changes, trends, or updated conditions versus prior periods or prior filings.

MANAGEMENT DISCUSSION:
${managementDiscussion}

RISK FACTORS:
${riskFactors}`;
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
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

type IntelligenceOutput = {
  business_summary: string;
  key_themes: string[];
  growth_drivers: string[];
  risks: string[];
  management_focus: string[];
  notable_changes: string[];
};

if (require.main === module) {
  const ticker = process.argv[2];

  if (!ticker) {
    console.error("Usage: npm run generate:intelligence -- <ticker>");
    process.exitCode = 1;
  } else {
    const company = getCompanyConfig(ticker);

    generateIntelligence(company).catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
  }
}
