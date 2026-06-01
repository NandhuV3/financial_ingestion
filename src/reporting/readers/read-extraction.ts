import { stat } from "node:fs/promises";
import { join } from "node:path";
import { fileExists, readJsonFile, readTextFile } from "../../shared/filesystem/file-reader.js";
import type { FileMetric } from "../../types/report.types.js";
import { reportSections } from "../report-sections.js";

export async function readFileMetrics(companyDataDir: string): Promise<Record<string, FileMetric>> {
  const files = [
    "raw/filings.json",
    "raw/latest-10q-index.html",
    "raw/latest-10q.html",
    "processed/extraction-diagnostics.json",
    "processed/deduplication-report.json",
    "processed/overlap-deduplication-report.json",
    "intelligence/themes.json",
    ...reportSections.flatMap((section) => [
      `processed/${section.processed}`,
      `processed/${section.exactDeduped}`,
      `processed/${section.overlapDeduped}`,
      `normalized/${section.normalized}`,
      `chunks/${section.chunks}`,
    ]),
  ];
  const metrics: Record<string, FileMetric> = {};

  for (const file of files) {
    const path = join(companyDataDir, file);
    metrics[file] = await readFileMetric(path);
  }

  return metrics;
}

export async function readExtraction(companyDataDir: string): Promise<{
  diagnostics_available: boolean;
  extraction_metrics: unknown;
}> {
  const diagnosticsPath = join(companyDataDir, "processed", "extraction-diagnostics.json");

  if (fileExists(diagnosticsPath)) {
    return {
      diagnostics_available: true,
      extraction_metrics: summarizeExtractionDiagnostics(await readJsonArtifact(diagnosticsPath)),
    };
  }

  const sections = [];

  for (const section of reportSections) {
    const path = join(companyDataDir, "processed", section.processed);
    sections.push({
      section: section.section,
      extracted_characters: (await readTextIfExists(path)).length,
      diagnostics_available: false,
    });
  }

  return {
    diagnostics_available: false,
    extraction_metrics: { diagnostics_available: false, sections },
  };
}

export async function readJsonArtifact(path: string): Promise<unknown | null> {
  if (!fileExists(path)) {
    return null;
  }

  return readJsonFile<unknown>(path);
}

async function readFileMetric(path: string): Promise<FileMetric> {
  if (!fileExists(path)) {
    return { path, exists: false, characters: 0, bytes: 0 };
  }

  const [text, fileStat] = await Promise.all([readTextFile(path), stat(path)]);
  return {
    path,
    exists: true,
    characters: text.length,
    bytes: fileStat.size,
  };
}

async function readTextIfExists(path: string): Promise<string> {
  if (!fileExists(path)) {
    return "";
  }

  return readTextFile(path);
}

function summarizeExtractionDiagnostics(diagnostics: unknown): unknown {
  if (!Array.isArray(diagnostics)) {
    return diagnostics;
  }

  return {
    diagnostics_available: true,
    sections: diagnostics.map((section) => {
      const sectionRecord = section as {
        section?: string;
        candidates_found?: number;
        selected_candidate?: number;
        extracted_characters?: number;
        candidates?: Array<Record<string, unknown>>;
      };

      return {
        section: sectionRecord.section,
        candidates_found: sectionRecord.candidates_found,
        selected_candidate: sectionRecord.selected_candidate,
        extracted_characters: sectionRecord.extracted_characters,
        candidates: (sectionRecord.candidates ?? []).map((candidate) => ({
          candidate_number: candidate.candidateNumber,
          block_index: candidate.blockIndex,
          tag: candidate.tag,
          inside_table: candidate.insideTable,
          has_anchor: candidate.hasAnchor,
          in_main_content: candidate.inMainContent,
          looks_like_heading: candidate.looksLikeHeading,
          following_characters: candidate.followingCharacters,
          rejected_reasons: candidate.rejectedReasons,
          score: candidate.score,
          text_preview: String(candidate.text ?? "").slice(0, 160),
        })),
      };
    }),
  };
}
