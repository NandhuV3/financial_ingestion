import type { ThemeImportance } from "../types/theme.types.js";
import {
  buildTopicChange,
  topicEvolved,
  topicIntensified,
  topicWeakened,
} from "./detect-topic-evolution.js";
import type {
  TopicAwareTheme,
  TopicAwareThemeOutput,
  TopicChange,
  TopicChangeSummary,
  TopicComparisonResult,
  TopicSnapshot,
} from "./topic-change.types.js";

const importanceRank: Record<ThemeImportance, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

export function compareTopics(
  previousThemes: TopicAwareThemeOutput | null,
  currentThemes: TopicAwareThemeOutput | null,
): TopicComparisonResult {
  const previousTopics = buildTopicSnapshots(previousThemes);
  const currentTopics = buildTopicSnapshots(currentThemes);
  const persistedTopicIds = [...previousTopics.keys()]
    .filter((topicId) => currentTopics.has(topicId))
    .sort((left, right) => left.localeCompare(right));
  const topicChanges: TopicChange[] = [];

  for (const topicId of persistedTopicIds) {
    const previous = previousTopics.get(topicId);
    const current = currentTopics.get(topicId);

    if (!previous || !current) {
      continue;
    }

    topicChanges.push(buildTopicChange("TOPIC_PERSISTED", previous, current));

    if (topicEvolved(previous, current)) {
      topicChanges.push(buildTopicChange("TOPIC_EVOLVED", previous, current));
    }

    if (topicIntensified(previous, current)) {
      topicChanges.push(buildTopicChange("TOPIC_INTENSIFIED", previous, current));
    }

    if (topicWeakened(previous, current)) {
      topicChanges.push(buildTopicChange("TOPIC_WEAKENED", previous, current));
    }
  }

  return {
    topic_changes: topicChanges,
    topic_summary: buildTopicSummary(topicChanges),
  };
}

export function buildTopicSnapshots(themeOutput: TopicAwareThemeOutput | null): Map<string, TopicSnapshot> {
  const themesByTopic = new Map<string, TopicAwareTheme[]>();

  for (const theme of themeOutput?.themes ?? []) {
    const topicId = theme.topic_id?.trim();

    if (!topicId) {
      continue;
    }

    const themes = themesByTopic.get(topicId) ?? [];
    themes.push(theme);
    themesByTopic.set(topicId, themes);
  }

  return new Map(
    [...themesByTopic.entries()]
      .map(([topicId, themes]) => {
        const evidence = uniqueSorted(themes.flatMap((theme) => theme.evidence));
        const snapshot: TopicSnapshot = {
          topic_id: topicId,
          categories: uniqueSorted(themes.map((theme) => theme.category)),
          theme_names: uniqueSorted(themes.map((theme) => theme.theme)),
          importance: highestImportance(themes.map((theme) => theme.importance)),
          evidence_count: evidence.length,
        };

        return [topicId, snapshot] as const;
      })
      .sort(([left], [right]) => left.localeCompare(right)),
  );
}

function buildTopicSummary(topicChanges: TopicChange[]): TopicChangeSummary {
  return {
    persisted_topics: countTopicChanges(topicChanges, "TOPIC_PERSISTED"),
    evolved_topics: countTopicChanges(topicChanges, "TOPIC_EVOLVED"),
    intensified_topics: countTopicChanges(topicChanges, "TOPIC_INTENSIFIED"),
    weakened_topics: countTopicChanges(topicChanges, "TOPIC_WEAKENED"),
  };
}

function countTopicChanges(topicChanges: TopicChange[], changeType: TopicChange["change_type"]): number {
  return topicChanges.filter((change) => change.change_type === changeType).length;
}

function highestImportance(values: ThemeImportance[]): ThemeImportance {
  return values.reduce((highest, current) =>
    importanceRank[current] > importanceRank[highest] ? current : highest,
  );
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}
