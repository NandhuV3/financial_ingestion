import { buildBusinessInterpretations } from "./business-interpretation.js";
import { applyConcepts } from "./concept-generation.js";
import { buildOperationalInterpretations } from "./operational-interpretation.js";
import { buildStrategicInterpretations } from "./strategic-interpretation.js";
import { buildTrustInterpretations } from "./trust-interpretation.js";
import type {
  ConceptRegistryContent,
  QuarterUnderstandingBuildContext,
  ProposedConcept,
  Understanding,
  UnderstandingSeed,
} from "./types.js";

export function buildUnderstandings(context: QuarterUnderstandingBuildContext): {
  understandings: Understanding[];
  proposed_concepts: ProposedConcept[];
} {
  const seeds = dedupeSeeds([
    ...buildBusinessInterpretations(context),
    ...buildStrategicInterpretations(context),
    ...buildOperationalInterpretations(context),
    ...buildTrustInterpretations(context),
  ]);
  const conceptRegistry = context.conceptRegistryArtifact?.content ?? null;

  return applyConcepts({
    seeds: seeds.sort(compareSeeds),
    conceptRegistry: conceptRegistry as ConceptRegistryContent | null,
  });
}

function dedupeSeeds(seeds: UnderstandingSeed[]): UnderstandingSeed[] {
  const seen = new Set<string>();
  const deduped: UnderstandingSeed[] = [];

  for (const seed of seeds) {
    const key = `${seed.category}:${seed.title}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    deduped.push(seed);
  }

  return deduped;
}

function compareSeeds(left: UnderstandingSeed, right: UnderstandingSeed): number {
  return `${left.category}:${left.title}`.localeCompare(`${right.category}:${right.title}`);
}
