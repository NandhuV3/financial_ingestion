import { join } from "node:path";
import { fileExists, readJsonFile } from "../../shared/filesystem/file-reader.js";
import type { ReportChunk } from "../../types/report.types.js";
import { reportSections } from "../report-sections.js";

export type ChunkArtifact = {
  section: string;
  file: string;
  chunks: ReportChunk[];
};

export async function readChunks(companyDataDir: string): Promise<ChunkArtifact[]> {
  const artifacts: ChunkArtifact[] = [];

  for (const section of reportSections) {
    const path = join(companyDataDir, "chunks", section.chunks);
    artifacts.push({
      section: section.section,
      file: path,
      chunks: await readJsonArray<ReportChunk>(path),
    });
  }

  return artifacts;
}

async function readJsonArray<T>(path: string): Promise<T[]> {
  if (!fileExists(path)) {
    return [];
  }

  const value = await readJsonFile<unknown>(path);
  return Array.isArray(value) ? value as T[] : [];
}
