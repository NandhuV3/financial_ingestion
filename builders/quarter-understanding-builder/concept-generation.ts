import type {
  ConceptRegistryContent,
  ProposedConcept,
  Understanding,
  UnderstandingSeed,
} from "./types.js";

export function applyConcepts(input: {
  seeds: UnderstandingSeed[];
  conceptRegistry: ConceptRegistryContent | null;
}): {
  understandings: Understanding[];
  proposed_concepts: ProposedConcept[];
} {
  const understandings = input.seeds.map((seed) => {
    const concept = input.conceptRegistry?.concepts?.find((candidate) =>
      candidate.status === "active" && candidate.category === seed.category);

    return {
      understanding_id: stableUnderstandingId(seed),
      category: seed.category,
      ...(concept ? { concept_id: concept.concept_id } : {}),
      title: seed.title,
      explanation: seed.explanation,
      importance: seed.importance,
      direction: seed.direction,
      evidence_package: {
        signal_refs: [...new Set(seed.signal_refs)],
        company_knowledge_refs: [...new Set(seed.company_knowledge_refs)],
        trust_signal_refs: [...new Set(seed.trust_signal_refs)],
        topic_refs: [...new Set(seed.topic_refs)],
      },
    };
  });

  const proposed_concepts = input.conceptRegistry === null
    ? input.seeds.map((seed) => proposedConceptFor(seed))
    : [];

  return {
    understandings,
    proposed_concepts,
  };
}

function proposedConceptFor(seed: UnderstandingSeed): ProposedConcept {
  return {
    proposed_concept_id: `proposed:${normalizeIdPart(seed.category)}:${normalizeIdPart(seed.title)}`,
    title: seed.title,
    description: `Proposed concept for ${seed.category} interpretation.`,
    evidence_refs: [
      ...seed.signal_refs,
      ...seed.company_knowledge_refs,
      ...seed.trust_signal_refs,
      ...seed.topic_refs,
    ],
    rationale: "Concept Registry enrichment was unavailable, so this understanding is emitted without a concept_id.",
  };
}

function stableUnderstandingId(seed: UnderstandingSeed): string {
  return [
    seed.category,
    seed.title,
    seed.signal_refs.join("."),
    seed.trust_signal_refs.join("."),
    seed.topic_refs.join("."),
  ]
    .map((part) => normalizeIdPart(part))
    .filter(Boolean)
    .join(":");
}

function normalizeIdPart(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}
