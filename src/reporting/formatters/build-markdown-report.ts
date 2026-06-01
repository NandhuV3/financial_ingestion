import { basename } from "node:path";
import type { CompanyPipelineReport } from "../../types/report.types.js";

export function buildMarkdownReport(report: CompanyPipelineReport): string {
  const chunkMetrics = report.chunk_metrics;
  const themeMetrics = report.theme_metrics;
  const normalizationMetrics = report.normalization_metrics;
  const deduplicationMetrics = report.deduplication_metrics as { totals?: Record<string, number> } | null;
  const overlapMetrics = report.overlap_dedup_metrics as { totals?: Record<string, number> } | null;
  const freshness = report.artifact_freshness;

  const extractionMetrics = report.extraction_metrics as { diagnostics_available?: boolean } | null;

  return `# ${report.company} (${report.ticker}) Pipeline Report

Generated: ${report.generated_at}

Health: ${report.health}

## Health Checks

${report.health_checks.map((check) => `- ${check.status}: ${check.message}`).join("\n")}

## Artifact Freshness

- Overall freshness: ${freshness.status}

${Object.entries(freshness.stages)
  .map(([stage, stageFreshness]) => `- ${stage}: ${stageFreshness.status} (${stageFreshness.reason})`)
  .join("\n")}

## Extraction

- Diagnostics available: ${Boolean(extractionMetrics?.diagnostics_available)}
- Processed sections: ${normalizationMetrics.sections.length}

## Deduplication

- Exact duplicate characters removed: ${deduplicationMetrics?.totals?.characters_removed ?? 0}
- Exact duplicate blocks removed: ${deduplicationMetrics?.totals?.duplicate_blocks_removed ?? 0}
- Overlap characters removed: ${overlapMetrics?.totals?.characters_removed ?? 0}
- Contained paragraphs removed: ${overlapMetrics?.totals?.removed_contained ?? 0}
- High-overlap paragraphs removed: ${overlapMetrics?.totals?.removed_overlap ?? 0}

## Normalization

${normalizationMetrics.sections
  .map(
    (section) =>
      `- ${section.section}: ${section.input_characters} input chars -> ${section.normalized_characters} normalized chars (${section.paragraph_count} paragraphs)`,
  )
  .join("\n")}

## Chunks

- Total chunks: ${chunkMetrics.total_chunks}
- Total chunk characters: ${chunkMetrics.total_characters}

${chunkMetrics.sections
  .map(
    (section) =>
      `- ${section.section}: ${section.chunks} chunks, avg ${section.average_characters}, min ${section.smallest_chunk}, max ${section.largest_chunk}`,
  )
  .join("\n")}

## Themes

- Total themes: ${themeMetrics.total_themes}
- Evidence references: ${themeMetrics.evidence_references}
- Evidence coverage: ${themeMetrics.evidence_coverage_percentage}%
- Missing evidence IDs: ${themeMetrics.missing_evidence_ids.join(", ") || "none"}
- Unreferenced chunks: ${themeMetrics.unreferenced_chunk_ids.join(", ") || "none"}

## Files

${Object.entries(report.files)
  .map(([name, metric]) => `- ${basename(name)}: ${metric.exists ? `${metric.characters} chars` : "missing"}`)
  .join("\n")}
`;
}
