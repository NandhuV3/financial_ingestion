import { join } from "node:path";
import { fileExists, readTextFile } from "../../shared/filesystem/file-reader.js";
import { reportSections } from "../report-sections.js";

export type NormalizationArtifact = {
  section: string;
  input_file: string;
  output_file: string;
  input_text: string;
  output_text: string;
};

export async function readNormalization(companyDataDir: string): Promise<NormalizationArtifact[]> {
  const artifacts: NormalizationArtifact[] = [];

  for (const section of reportSections) {
    const inputPath = preferredNormalizationInput(companyDataDir, section);
    const outputPath = join(companyDataDir, "normalized", section.normalized);

    artifacts.push({
      section: section.section,
      input_file: inputPath,
      output_file: outputPath,
      input_text: await readTextIfExists(inputPath),
      output_text: await readTextIfExists(outputPath),
    });
  }

  return artifacts;
}

function preferredNormalizationInput(
  companyDataDir: string,
  section: (typeof reportSections)[number],
): string {
  const overlapPath = join(companyDataDir, "processed", section.overlapDeduped);
  const exactDedupPath = join(companyDataDir, "processed", section.exactDeduped);

  if (fileExists(overlapPath)) {
    return overlapPath;
  }

  if (fileExists(exactDedupPath)) {
    return exactDedupPath;
  }

  return join(companyDataDir, "processed", section.processed);
}

async function readTextIfExists(path: string): Promise<string> {
  if (!fileExists(path)) {
    return "";
  }

  return readTextFile(path);
}
