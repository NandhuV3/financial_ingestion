import type { ThemeMetrics } from "../../types/report.types.js";
import type { ThemeArtifact } from "../readers/read-themes.js";
import { calculateEvidenceCoverage } from "./build-coverage-metrics.js";

export function buildThemeMetrics(artifact: ThemeArtifact, chunkIds: string[]): ThemeMetrics {
  const themes = Array.isArray(artifact.theme_output?.themes) ? artifact.theme_output.themes : [];
  const evidenceIds = themes.flatMap((theme) => (Array.isArray(theme.evidence) ? theme.evidence : []));
  const knownChunkIds = new Set(chunkIds);
  const uniqueEvidenceIds = [...new Set(evidenceIds)];
  const missingEvidenceIds = uniqueEvidenceIds.filter((chunkId) => !knownChunkIds.has(chunkId));
  const unreferencedChunkIds = chunkIds.filter((chunkId) => !uniqueEvidenceIds.includes(chunkId));
  const categories: Record<string, number> = {};

  for (const theme of themes) {
    categories[theme.category] = (categories[theme.category] ?? 0) + 1;
  }

  return {
    file: artifact.file,
    total_themes: themes.length,
    evidence_references: evidenceIds.length,
    unique_evidence_chunks: uniqueEvidenceIds.length,
    evidence_coverage_percentage: calculateEvidenceCoverage(chunkIds.length, uniqueEvidenceIds.length),
    missing_evidence_ids: missingEvidenceIds,
    unreferenced_chunk_ids: unreferencedChunkIds,
    categories,
  };
}
