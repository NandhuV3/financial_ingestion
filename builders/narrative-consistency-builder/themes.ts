import type {
  NarrativeBuildDependencies,
  NarrativeTheme,
  ThemeObservation,
} from "./types.js";
import { BuilderValidationError } from "../../packages/builder-framework/src/builder-errors.js";
import { isPeriodAfter } from "./period.js";

export function buildNarrativeThemes(
  dependencies: NarrativeBuildDependencies,
  currentPeriod: string,
): NarrativeTheme[] {
  const observations = collectThemeObservations(dependencies);
  const priorThemes = new Map(
    dependencies.prior?.content.narrative_themes.map((theme) => [theme.theme_id, theme]) ?? [],
  );
  const themeIds = new Set([...observations.keys(), ...priorThemes.keys()]);

  return [...themeIds]
    .map((themeId): NarrativeTheme => {
      const byPeriod = observations.get(themeId) ?? new Map();
      const current = byPeriod.get(currentPeriod);
      const prior = priorThemes.get(themeId);
      const all = [...byPeriod.entries()].sort(([left], [right]) => left.localeCompare(right));
      const historical = all.filter(([period]) => period !== currentPeriod);
      const latestObservation = current ?? all.at(-1)?.[1];

      if (latestObservation === undefined && prior === undefined) {
        throw new BuilderValidationError(`Narrative theme ${themeId} has no source observation.`);
      }

      const conceptRef = latestObservation?.concept_ref ?? prior!.concept_ref;
      const category = latestObservation?.narrative_category ?? prior!.narrative_category;
      const firstSeen = [prior?.first_seen_period, all[0]?.[0]]
        .filter((value): value is string => value !== undefined)
        .sort()[0]!;
      const previousMentions = historical.at(-1)?.[1].mention_count
        ?? prior?.current_period_mentions
        ?? 0;
      const currentMentions = current?.mention_count ?? 0;
      const historicalCounts = [
        ...(prior === undefined ? [] : [prior.current_period_mentions]),
        ...historical.map(([, observation]) => observation.mention_count),
      ];
      const evidenceRefs = [
        ...prior?.evidence_refs ?? [],
        ...all.flatMap(([, observation]) => observation.evidence_refs),
      ];

      return {
        theme_id: themeId,
        concept_ref: conceptRef,
        narrative_category: category,
        first_seen_period: firstSeen,
        current_period_mentions: currentMentions,
        historical_average_mentions: average(historicalCounts),
        trend: currentMentions > previousMentions
          ? "increasing"
          : currentMentions < previousMentions
            ? "decreasing"
            : "stable",
        evidence_refs: [...new Set(evidenceRefs)].sort(),
        confidence: average(
          all.map(([, observation]) => observation.confidence)
            .concat(prior === undefined ? [] : [prior.confidence]),
        ),
      };
    })
    .sort((left, right) => left.theme_id.localeCompare(right.theme_id));
}

function collectThemeObservations(
  dependencies: NarrativeBuildDependencies,
): Map<string, Map<string, ThemeObservation>> {
  const themes = new Map<string, Map<string, ThemeObservation>>();
  const identities = new Map(
    dependencies.prior?.content.narrative_themes.map((theme) => [
      theme.theme_id,
      {
        concept_ref: theme.concept_ref,
        narrative_category: theme.narrative_category,
      },
    ]) ?? [],
  );
  const priorPeriod = dependencies.prior?.content.period ?? null;

  for (const source of dependencies.sources) {
    if (
      priorPeriod !== null
      && !isPeriodAfter(source.declaration.period_id, priorPeriod)
    ) {
      continue;
    }

    for (const observation of source.artifact.content.theme_observations) {
      const identity = identities.get(observation.theme_id);
      if (
        identity !== undefined
        && (
          identity.concept_ref !== observation.concept_ref
          || identity.narrative_category !== observation.narrative_category
        )
      ) {
        throw new BuilderValidationError(
          `Narrative theme ${observation.theme_id} changed its stable classification.`,
        );
      }
      identities.set(observation.theme_id, {
        concept_ref: observation.concept_ref,
        narrative_category: observation.narrative_category,
      });

      const periods = themes.get(observation.theme_id) ?? new Map();
      const existing = periods.get(source.declaration.period_id);

      if (
        existing !== undefined
        && (
          existing.concept_ref !== observation.concept_ref
          || existing.narrative_category !== observation.narrative_category
        )
      ) {
        throw new BuilderValidationError(
          `Narrative theme ${observation.theme_id} has conflicting classification.`,
        );
      }

      periods.set(source.declaration.period_id, existing === undefined
        ? observation
        : {
            ...existing,
            mention_count: existing.mention_count + observation.mention_count,
            evidence_refs: [...new Set([
              ...existing.evidence_refs,
              ...observation.evidence_refs,
            ])].sort(),
            confidence: average([existing.confidence, observation.confidence]),
          });
      themes.set(observation.theme_id, periods);
    }
  }

  return themes;
}

function average(values: number[]): number {
  return values.length === 0
    ? 0
    : values.reduce((sum, value) => sum + value, 0) / values.length;
}
