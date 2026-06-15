export const ARTIFACT_TYPES = [
  "themes",
  "topic_assignment",
  "topic_evolution",
  "quarter_change",
  "structured_intelligence",
  "company_knowledge",
  "business_signals",
  "quarter_understanding",
  "investor_intelligence",
  "partner_domain",
  "prompt_registry",
  "concept_registry",
  "evaluation_report",
  "dependency_index",
] as const;

export type ArtifactType = typeof ARTIFACT_TYPES[number];

