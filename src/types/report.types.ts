import type { Chunk } from "./chunk.types.js";
import type { ArtifactFreshnessReport, FreshnessStatus } from "./freshness.types.js";
import type { ThemeOutput } from "./theme.types.js";

export type HealthStatus = FreshnessStatus;

export type HealthCheck = {
  status: HealthStatus;
  message: string;
};

export type FileMetric = {
  path: string;
  exists: boolean;
  characters: number;
  bytes: number;
};

export type ExtractionMetrics = unknown;

export type NormalizationMetrics = {
  sections: Array<{
    section: string;
    input_file: string;
    output_file: string;
    input_characters: number;
    normalized_characters: number;
    characters_removed: number;
    paragraph_count: number;
  }>;
};

export type ChunkMetrics = {
  sections: Array<{
    section: string;
    file: string;
    chunks: number;
    total_characters: number;
    average_characters: number;
    smallest_chunk: number;
    largest_chunk: number;
  }>;
  total_chunks: number;
  total_characters: number;
  chunk_ids: string[];
};

export type ThemeMetrics = {
  file: string;
  total_themes: number;
  evidence_references: number;
  unique_evidence_chunks: number;
  evidence_coverage_percentage: number;
  missing_evidence_ids: string[];
  unreferenced_chunk_ids: string[];
  categories: Record<string, number>;
};

export type CompanyPipelineReport = {
  company: string;
  ticker: string;
  generated_at: string;
  health: HealthStatus;
  health_checks: HealthCheck[];
  files: Record<string, FileMetric>;
  extraction_metrics: ExtractionMetrics;
  deduplication_metrics: unknown;
  overlap_dedup_metrics: unknown;
  normalization_metrics: NormalizationMetrics;
  chunk_metrics: ChunkMetrics;
  theme_metrics: ThemeMetrics;
  artifact_freshness: ArtifactFreshnessReport;
};

export type ReportChunk = Pick<Chunk, "chunk_id" | "section" | "text">;

export type ReportThemeOutput = Partial<ThemeOutput>;
