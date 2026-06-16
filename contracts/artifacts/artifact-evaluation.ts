export type ArtifactEvaluation = {
  evaluation_version: string;
  structural_passed: boolean;
  confidence_score: number;
  warnings: string[];
  evaluation_timestamp: string;
};

