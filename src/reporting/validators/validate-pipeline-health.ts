import type { ArtifactFreshnessReport } from "../../types/freshness.types.js";
import type { ChunkMetrics, HealthCheck, NormalizationMetrics, ThemeMetrics } from "../../types/report.types.js";

export function validatePipelineHealth(input: {
  extractionDiagnosticsAvailable: boolean;
  normalizationMetrics: NormalizationMetrics;
  chunkMetrics: ChunkMetrics;
  themeMetrics: ThemeMetrics;
  artifactFreshness: ArtifactFreshnessReport;
  themeOutputExists: boolean;
}): HealthCheck[] {
  const healthChecks: HealthCheck[] = [];

  if (!input.extractionDiagnosticsAvailable) {
    healthChecks.push({
      status: "warning",
      message: "Extraction diagnostics file is missing; using processed section sizes only.",
    });
  }

  for (const section of input.normalizationMetrics.sections) {
    if (section.normalized_characters === 0) {
      healthChecks.push({
        status: "failed",
        message: `Normalized output missing or empty for ${section.section}.`,
      });
    }
  }

  for (const section of input.chunkMetrics.sections) {
    if (section.chunks === 0) {
      healthChecks.push({
        status: "failed",
        message: `No chunks generated for ${section.section}.`,
      });
    }
  }

  if (!input.themeOutputExists) {
    healthChecks.push({
      status: "failed",
      message: "Theme output file is missing.",
    });
  }

  if (input.themeMetrics.missing_evidence_ids.length > 0) {
    healthChecks.push({
      status: "failed",
      message: `Theme evidence references missing chunk IDs: ${input.themeMetrics.missing_evidence_ids.join(", ")}.`,
    });
  }

  const riskSection = input.normalizationMetrics.sections.find((section) => section.section === "risk_factors");

  if ((riskSection?.normalized_characters ?? 0) < 100) {
    healthChecks.push({
      status: "warning",
      message: "Risk Factors normalized text is below 100 characters.",
    });
  }

  if (input.chunkMetrics.total_chunks === 0) {
    healthChecks.push({
      status: "failed",
      message: "No chunks generated.",
    });
  }

  if (input.themeMetrics.total_themes === 0) {
    healthChecks.push({
      status: "failed",
      message: "No themes generated.",
    });
  }

  for (const [stage, freshness] of Object.entries(input.artifactFreshness.stages)) {
    if (freshness.status === "stale") {
      healthChecks.push({
        status: "stale",
        message: `${stage} artifacts are stale: ${freshness.reason}`,
      });
    }

    if (freshness.status === "failed") {
      healthChecks.push({
        status: "failed",
        message: `${stage} freshness check failed: ${freshness.reason}`,
      });
    }
  }

  if (healthChecks.length === 0) {
    healthChecks.push({
      status: "healthy",
      message: "All reporting health checks passed.",
    });
  }

  return healthChecks;
}
