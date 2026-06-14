import type { TopicEvolutionReport, TopicObservation } from "../topic-evolution/topic-evolution.types.js";
import type { ThemeImportance } from "../types/theme.types.js";
import type { TopicChange } from "./topic-change.types.js";

const importanceRank: Record<ThemeImportance, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

const changeRank: Record<TopicChange["change_type"], number> = {
  TOPIC_NEW: 1,
  TOPIC_DISAPPEARED: 2,
  TOPIC_PERSISTED: 3,
  TOPIC_EVOLVED: 4,
  TOPIC_INTENSIFIED: 5,
  TOPIC_WEAKENED: 6,
};

export function deriveQuarterTopicChangesFromEvolution(
  evolutionReport: TopicEvolutionReport,
  previousFilingDate: string,
  currentFilingDate: string,
): TopicChange[] {
  const changes = evolutionReport.topics.flatMap((topic) => {
    const previous = findObservation(topic.history, previousFilingDate, topic.topic_id);
    const current = findObservation(topic.history, currentFilingDate, topic.topic_id);
    const topicChanges: TopicChange[] = [];

    if (!previous.present && !current.present) {
      return topicChanges;
    }

    if (!previous.present && current.present) {
      topicChanges.push(buildTopicChange("TOPIC_NEW", topic.topic_id, previous, current));
      return topicChanges;
    }

    if (previous.present && !current.present) {
      topicChanges.push(buildTopicChange("TOPIC_DISAPPEARED", topic.topic_id, previous, current));
      return topicChanges;
    }

    topicChanges.push(buildTopicChange("TOPIC_PERSISTED", topic.topic_id, previous, current));

    if (topicEvolved(previous, current)) {
      topicChanges.push(buildTopicChange("TOPIC_EVOLVED", topic.topic_id, previous, current));
    }

    if (topicIntensified(previous, current)) {
      topicChanges.push(buildTopicChange("TOPIC_INTENSIFIED", topic.topic_id, previous, current));
    }

    if (topicWeakened(previous, current)) {
      topicChanges.push(buildTopicChange("TOPIC_WEAKENED", topic.topic_id, previous, current));
    }

    return topicChanges;
  });

  return changes.sort((left, right) =>
    left.topic_id.localeCompare(right.topic_id) || changeRank[left.change_type] - changeRank[right.change_type],
  );
}

function findObservation(
  history: TopicObservation[],
  filingDate: string,
  topicId: string,
): TopicObservation {
  const observation = history.find((item) => item.filing_date === filingDate);

  if (!observation) {
    throw new Error(`Topic Evolution is missing filing ${filingDate} for topic ${topicId}.`);
  }

  return observation;
}

function buildTopicChange(
  changeType: TopicChange["change_type"],
  topicId: string,
  previous: TopicObservation,
  current: TopicObservation,
): TopicChange {
  return {
    change_type: changeType,
    topic_id: topicId,
    previous_categories: previous.categories,
    current_categories: current.categories,
    previous_theme_names: previous.theme_names,
    current_theme_names: current.theme_names,
    previous_importance: previous.importance,
    current_importance: current.importance,
    previous_evidence_count: previous.evidence_count,
    current_evidence_count: current.evidence_count,
  };
}

function topicEvolved(previous: TopicObservation, current: TopicObservation): boolean {
  return previous.theme_names.join("\0") !== current.theme_names.join("\0")
    || previous.categories.join("\0") !== current.categories.join("\0");
}

function topicIntensified(previous: TopicObservation, current: TopicObservation): boolean {
  return (
    importanceValue(current.importance) > importanceValue(previous.importance)
    || current.evidence_count > previous.evidence_count
  );
}

function topicWeakened(previous: TopicObservation, current: TopicObservation): boolean {
  return (
    importanceValue(current.importance) < importanceValue(previous.importance)
    || current.evidence_count < previous.evidence_count
  );
}

function importanceValue(value: ThemeImportance | null): number {
  return value ? importanceRank[value] : 0;
}
