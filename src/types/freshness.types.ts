export type FreshnessStatus = "healthy" | "warning" | "failed" | "stale";

export type StageName =
  | "raw"
  | "extraction"
  | "dedupe"
  | "overlap_dedupe"
  | "normalization"
  | "chunking"
  | "themes";

export type StageFreshness = {
  status: FreshnessStatus;
  generated_at: string | null;
  source_file: string | null;
  source_files: string[];
  artifact_files: string[];
  source_hash: string | null;
  stored_source_hash: string | null;
  current_source_hash: string | null;
  reason: string;
};

export type ArtifactFreshnessReport = {
  company: string;
  ticker: string;
  generated_at: string;
  status: FreshnessStatus;
  stages: Record<StageName, StageFreshness>;
};
