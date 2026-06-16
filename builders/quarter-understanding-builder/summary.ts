import type { QuarterUnderstandingArtifactContent } from "./types.js";

export function countTrustUnderstandings(content: QuarterUnderstandingArtifactContent): number {
  return content.understandings.filter((understanding) => understanding.category === "trust").length;
}

export function countLongitudinalReferences(content: QuarterUnderstandingArtifactContent): number {
  return content.understandings.reduce(
    (sum, understanding) => sum + understanding.evidence_package.topic_refs.length,
    0,
  );
}
