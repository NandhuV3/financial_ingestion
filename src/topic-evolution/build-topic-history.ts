import type { TopicDefinition } from "../topic-intelligence/topic.types.js";
import type {
  AssignedTopicTheme,
  FilingMetadataForEvolution,
  TopicEvolution,
  TopicEvolutionDiagnostics,
  TopicEvolutionFilingInput,
  TopicObservation,
} from "./topic-evolution.types.js";
import { importanceScore, classifyPresenceState } from "./classify-topic-evolution.js";
import { buildStrengthHistory, calculateTopicStrength } from "./calculate-topic-strength.js";
import { classifyTopicTrend } from "./classify-topic-trend.js";

type TopicAggregate = {
  importance_score: number;
  evidence: Set<string>;
  theme_names: Set<string>;
  theme_count: number;
};

type BuildTopicHistoriesResult = {
  topics: TopicEvolution[];
  diagnostics: Omit<TopicEvolutionDiagnostics, "duration_ms">;
};

export function buildTopicHistories(
  filings: TopicEvolutionFilingInput[],
  topicDefinitions: TopicDefinition[],
): BuildTopicHistoriesResult {
  const diagnostics: Omit<TopicEvolutionDiagnostics, "duration_ms"> = {
    assigned_topics_used: 0,
    unassigned_topics_ignored: 0,
    themes_without_topic_ignored: 0,
    missing_themes_with_topics_files: [],
    filings_with_no_assigned_topics: [],
  };

  const sortedFilings = [...filings].sort((a, b) => a.metadata.filing_date.localeCompare(b.metadata.filing_date));
  const topicNames = new Map(topicDefinitions.map((topic) => [topic.topic_id, topic.topic_name]));
  const filingAggregates = new Map<string, Map<string, TopicAggregate>>();
  const observedTopicIds = new Set<string>();

  for (const filing of sortedFilings) {
    if (!filing.themes_with_topics_file_exists) {
      diagnostics.missing_themes_with_topics_files.push(filing.metadata.filing_date);
    }

    const aggregates = aggregateAssignedThemes(filing.themes, diagnostics);
    filingAggregates.set(filing.metadata.filing_date, aggregates);

    for (const topicId of aggregates.keys()) {
      observedTopicIds.add(topicId);
    }

    if (aggregates.size === 0) {
      diagnostics.filings_with_no_assigned_topics.push(filing.metadata.filing_date);
    }
  }

  const topics = [...observedTopicIds]
    .sort()
    .map((topicId) => buildTopicHistory(topicId, topicNames.get(topicId) ?? topicId, sortedFilings, filingAggregates));

  return { topics, diagnostics };
}

function aggregateAssignedThemes(
  themes: AssignedTopicTheme[],
  diagnostics: Omit<TopicEvolutionDiagnostics, "duration_ms">,
): Map<string, TopicAggregate> {
  const aggregates = new Map<string, TopicAggregate>();

  for (const theme of themes) {
    if (theme.assignment_status === "unassigned") {
      diagnostics.unassigned_topics_ignored += 1;
      continue;
    }

    if (
      (theme.assignment_status !== "assigned" && theme.assignment_status !== "low_confidence")
      || !theme.topic_id
    ) {
      diagnostics.themes_without_topic_ignored += 1;
      continue;
    }

    diagnostics.assigned_topics_used += 1;
    const aggregate = getOrCreateAggregate(aggregates, theme.topic_id);
    aggregate.importance_score = Math.max(aggregate.importance_score, importanceScore(theme.importance));
    aggregate.theme_count += 1;
    aggregate.theme_names.add(theme.theme);

    for (const evidenceId of theme.evidence) {
      aggregate.evidence.add(evidenceId);
    }
  }

  return aggregates;
}

function getOrCreateAggregate(aggregates: Map<string, TopicAggregate>, topicId: string): TopicAggregate {
  const existing = aggregates.get(topicId);

  if (existing) {
    return existing;
  }

  const aggregate = {
    importance_score: 0,
    evidence: new Set<string>(),
    theme_names: new Set<string>(),
    theme_count: 0,
  };
  aggregates.set(topicId, aggregate);
  return aggregate;
}

function buildTopicHistory(
  topicId: string,
  topicName: string,
  filings: TopicEvolutionFilingInput[],
  filingAggregates: Map<string, Map<string, TopicAggregate>>,
): TopicEvolution {
  const history = filings.map((filing) =>
    buildObservation(filing.metadata, filingAggregates.get(filing.metadata.filing_date)?.get(topicId)),
  );
  const presentObservations = history.filter((observation) => observation.present);
  const latestObservation = history.at(-1);
  const quartersPresent = presentObservations.length;
  const quartersAbsent = history.length - quartersPresent;
  const strengthHistory = buildStrengthHistory(history);
  const trend = classifyTopicTrend(strengthHistory);

  return {
    topic_id: topicId,
    topic_name: topicName,
    presence_state: classifyPresenceState(history),
    trend_state: trend.trend_state,
    current_status: latestObservation?.present ? "present" : "absent",
    first_seen: presentObservations[0]?.filing_date ?? null,
    last_seen: presentObservations.at(-1)?.filing_date ?? null,
    quarters_present: quartersPresent,
    quarters_absent: quartersAbsent,
    presence_ratio: history.length === 0 ? 0 : roundRatio(quartersPresent / history.length),
    strength_history: strengthHistory,
    history,
  };
}

function buildObservation(metadata: FilingMetadataForEvolution, aggregate: TopicAggregate | undefined): TopicObservation {
  if (!aggregate) {
    return {
      filing_date: metadata.filing_date,
      form_type: metadata.form_type,
      accession_number: metadata.accession_number ?? null,
      present: false,
      importance: null,
      importance_score: 0,
      evidence_count: 0,
      theme_count: 0,
      topic_strength: 0,
      theme_names: [],
    };
  }

  const topicStrength = calculateTopicStrength({
    importance_score: aggregate.importance_score,
    evidence_count: aggregate.evidence.size,
    theme_count: aggregate.theme_count,
  });

  return {
    filing_date: metadata.filing_date,
    form_type: metadata.form_type,
    accession_number: metadata.accession_number ?? null,
    present: true,
    importance: scoreToImportance(aggregate.importance_score),
    importance_score: aggregate.importance_score,
    evidence_count: aggregate.evidence.size,
    theme_count: aggregate.theme_count,
    topic_strength: topicStrength,
    theme_names: [...aggregate.theme_names].sort(),
  };
}

function scoreToImportance(score: number): "low" | "medium" | "high" {
  if (score >= 3) return "high";
  if (score >= 2) return "medium";
  return "low";
}

function roundRatio(value: number): number {
  return Math.round(value * 100) / 100;
}
