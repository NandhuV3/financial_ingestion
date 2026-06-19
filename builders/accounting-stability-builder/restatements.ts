import { stableRecordId } from "./identity.js";
import type {
  AccountingBuildDependencies,
  RestatementRecord,
} from "./types.js";
import { sortedUnique } from "./validation-helpers.js";

export function buildRestatements(
  dependencies: AccountingBuildDependencies,
): RestatementRecord[] {
  const records = new Map<string, RestatementRecord>();

  for (const { artifact } of dependencies.sources) {
    if (!artifact.content.coverage.restatements_available) {
      continue;
    }

    for (const observation of artifact.content.restatements) {
      const id = stableRecordId("restatement", [
        observation.period_announced,
        [...observation.periods_affected].sort().join("\u001f"),
        observation.scope,
        observation.description,
      ]);
      const existing = records.get(id);

      records.set(id, {
        restatement_id: id,
        period_announced: observation.period_announced,
        periods_affected: sortedUnique(observation.periods_affected),
        scope: observation.scope,
        description: observation.description,
        materiality: observation.materiality,
        evidence_refs: sortedUnique([
          ...existing?.evidence_refs ?? [],
          ...observation.evidence_refs,
        ]),
        source_artifact_refs: sortedUnique([
          ...existing?.source_artifact_refs ?? [],
          artifact.identity.artifact_id,
        ]),
        confidence: existing === undefined
          ? observation.confidence
          : Math.max(existing.confidence, observation.confidence),
      });
    }
  }

  return [...records.values()].sort((left, right) =>
    left.period_announced.localeCompare(right.period_announced)
    || left.restatement_id.localeCompare(right.restatement_id));
}

