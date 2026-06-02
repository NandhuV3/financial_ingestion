import { join } from "node:path";
import { getCompanyConfig } from "../config/companies.js";
import { readTextFile } from "../shared/filesystem/file-reader.js";
import { ensureDirectory, writeJsonFile } from "../shared/filesystem/file-writer.js";
import { getFilingDirectory } from "../storage/filing-paths.js";
import { resolveFilingDate } from "../storage/resolve-filing.js";
import type { Chunk } from "../types/chunk.types.js";
import type { CompanyConfig } from "../types/company.types.js";

const TARGET_CHUNK_CHARACTERS = 1800;
const MAX_CHUNK_CHARACTERS = 2600;
const MIN_CHUNK_CHARACTERS = 450;
const FORM_TYPE = "10-Q";

const sections = [
  {
    section: "management_discussion",
    idPrefix: "mgmt",
    inputFileName: "management-discussion.cleaned.txt",
    outputFileName: "management-discussion.chunks.json",
  },
  {
    section: "risk_factors",
    idPrefix: "risk",
    inputFileName: "risk-factors.cleaned.txt",
    outputFileName: "risk-factors.chunks.json",
  },
];

export async function chunkSections(company: CompanyConfig, filingDate?: string): Promise<void> {
  const resolvedFilingDate = await resolveFilingDate(company.ticker, filingDate);
  const filingDir = getFilingDirectory(company.ticker, resolvedFilingDate);
  const normalizedDir = join(filingDir, "normalized");
  const chunksDir = join(filingDir, "chunks");
  await ensureDirectory(chunksDir);

  for (const section of sections) {
    const inputPath = join(normalizedDir, section.inputFileName);
    const outputPath = join(chunksDir, section.outputFileName);
    const text = await readTextFile(inputPath);
    const paragraphs = splitParagraphs(text);
    const chunkTexts = buildChunks(paragraphs);
    const chunks: Chunk[] = chunkTexts.map((chunkText, index) => ({
      chunk_id: `${section.idPrefix}_${String(index + 1).padStart(3, "0")}`,
      company: company.company,
      ticker: company.ticker,
      form_type: FORM_TYPE,
      filing_date: resolvedFilingDate,
      section: section.section,
      text: chunkText,
    }));

    await writeJsonFile(outputPath, chunks);

    const sizes = chunks.map((chunk) => chunk.text.length);
    const totalSize = sizes.reduce((sum, size) => sum + size, 0);
    const averageSize = chunks.length === 0 ? 0 : Math.round(totalSize / chunks.length);
    const largestSize = sizes.length === 0 ? 0 : Math.max(...sizes);
    const smallestSize = sizes.length === 0 ? 0 : Math.min(...sizes);
    const chunksWithMetadata = chunks.filter(hasRequiredMetadata).length;
    const missingMetadataCount = chunks.length - chunksWithMetadata;
    const schemaFields = chunks[0] ? Object.keys(chunks[0]) : [];
    const removedFields = ["source_heading"];
    const removedFieldsPresent = chunks.some((chunk) =>
      removedFields.some((field) => Object.hasOwn(chunk, field)),
    );
    const validationStatus = missingMetadataCount === 0 && !removedFieldsPresent ? "passed" : "failed";

    console.log(`Section: ${section.section}`);
    console.log(`Output: ${outputPath}`);
    console.log(`Total chunks: ${chunks.length}`);
    console.log(`Schema fields: ${schemaFields.join(", ")}`);
    console.log(`Removed fields: ${removedFields.join(", ")}`);
    console.log(`Validation status: ${validationStatus}`);
    console.log(`Chunks with required metadata: ${chunksWithMetadata}`);
    console.log(`Missing required metadata count: ${missingMetadataCount}`);
    console.log(`Average chunk size: ${averageSize} characters`);
    console.log(`Largest chunk: ${largestSize} characters`);
    console.log(`Smallest chunk: ${smallestSize} characters`);
    console.log("Sample chunk:");
    console.log(JSON.stringify(chunks[0], null, 2));
    console.log("");
  }
}

function hasRequiredMetadata(chunk: Chunk): boolean {
  return Boolean(
    chunk.chunk_id &&
      chunk.company &&
      chunk.ticker &&
      chunk.form_type &&
      chunk.filing_date &&
      chunk.section &&
      chunk.text,
  );
}

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function buildChunks(paragraphs: string[]): string[] {
  const chunks: string[] = [];
  let currentParagraphs: string[] = [];
  let currentSize = 0;

  for (const paragraph of paragraphs.flatMap(splitOversizedParagraph)) {
    const nextSize = currentSize === 0 ? paragraph.length : currentSize + 2 + paragraph.length;
    const currentIsUseful = currentSize >= MIN_CHUNK_CHARACTERS;

    if (currentParagraphs.length > 0 && nextSize > TARGET_CHUNK_CHARACTERS && currentIsUseful) {
      chunks.push(currentParagraphs.join("\n\n"));
      currentParagraphs = [paragraph];
      currentSize = paragraph.length;
      continue;
    }

    currentParagraphs.push(paragraph);
    currentSize = nextSize;
  }

  if (currentParagraphs.length > 0) {
    const finalChunk = currentParagraphs.join("\n\n");
    const previousChunk = chunks.at(-1);

    if (previousChunk && finalChunk.length < MIN_CHUNK_CHARACTERS) {
      chunks[chunks.length - 1] = `${previousChunk}\n\n${finalChunk}`;
    } else {
      chunks.push(finalChunk);
    }
  }

  return chunks;
}

function splitOversizedParagraph(paragraph: string): string[] {
  if (paragraph.length <= MAX_CHUNK_CHARACTERS) {
    return [paragraph];
  }

  const sentences = paragraph.match(/[^.!?]+[.!?]+(?:["')\]]+)?|[^.!?]+$/g) ?? [paragraph];
  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences.map((value) => value.trim()).filter(Boolean)) {
    const next = current ? `${current} ${sentence}` : sentence;

    if (current && next.length > MAX_CHUNK_CHARACTERS) {
      chunks.push(current);
      current = sentence;
      continue;
    }

    current = next;
  }

  if (current) {
    chunks.push(current);
  }

  return chunks;
}

if (require.main === module) {
  const ticker = process.argv[2];
  const filingDate = process.argv[3];

  if (!ticker) {
    console.error("Usage: npm run chunk:sections -- <ticker> [filing-date]");
    process.exitCode = 1;
  } else {
    const company = getCompanyConfig(ticker);

    chunkSections(company, filingDate).catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
  }
}
