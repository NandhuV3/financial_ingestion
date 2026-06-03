import type { TopicChange, TopicSnapshot } from "./topic-change.types.js";

const importanceRank = {
  low: 1,
  medium: 2,
  high: 3,
} as const;

export function topicEvolved(previous: TopicSnapshot, current: TopicSnapshot): boolean {
  return previous.theme_names.join("\0") !== current.theme_names.join("\0");
}

export function topicIntensified(previous: TopicSnapshot, current: TopicSnapshot): boolean {
  return (
    importanceRank[current.importance] > importanceRank[previous.importance] ||
    current.evidence_count > previous.evidence_count
  );
}

export function topicWeakened(previous: TopicSnapshot, current: TopicSnapshot): boolean {
  return (
    importanceRank[current.importance] < importanceRank[previous.importance] ||
    current.evidence_count < previous.evidence_count
  );
}

export function buildTopicChange(
  changeType: TopicChange["change_type"],
  previous: TopicSnapshot,
  current: TopicSnapshot,
): TopicChange {
  return {
    change_type: changeType,
    topic_id: current.topic_id,
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
