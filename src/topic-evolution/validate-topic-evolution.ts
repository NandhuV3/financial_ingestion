import type { TopicRegistry } from "../topic-intelligence/topic.types.js";
import type { AssignedTopicTheme, TopicEvolutionFilingInput } from "./topic-evolution.types.js";

const filingDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const allowedImportance = new Set(["low", "medium", "high"]);
const allowedAssignmentStatuses = new Set(["assigned", "low_confidence", "unassigned"]);

export function validateTopicEvolutionInputs(filings: TopicEvolutionFilingInput[], registry: TopicRegistry): void {
  validateRegistry(registry);

  for (const filing of filings) {
    if (!filingDatePattern.test(filing.metadata.filing_date)) {
      throw new Error(`Invalid filing date for topic evolution: ${filing.metadata.filing_date}`);
    }

    if (!filing.metadata.company.trim()) {
      throw new Error(`Missing company for filing ${filing.metadata.filing_date}`);
    }

    if (!filing.metadata.ticker.trim()) {
      throw new Error(`Missing ticker for filing ${filing.metadata.filing_date}`);
    }

    for (const theme of filing.themes) {
      validateTheme(theme, filing.metadata.filing_date);
    }
  }
}

function validateRegistry(registry: TopicRegistry): void {
  if (!Array.isArray(registry.topics)) {
    throw new Error("Topic registry must contain a topics array");
  }

  const topicIds = new Set<string>();

  for (const topic of registry.topics) {
    if (!topic.topic_id.trim()) {
      throw new Error("Topic registry contains a topic without topic_id");
    }

    if (!topic.topic_name.trim()) {
      throw new Error(`Topic registry topic ${topic.topic_id} is missing topic_name`);
    }

    if (topicIds.has(topic.topic_id)) {
      throw new Error(`Duplicate topic_id in registry: ${topic.topic_id}`);
    }

    topicIds.add(topic.topic_id);
  }
}

function validateTheme(theme: AssignedTopicTheme, filingDate: string): void {
  if (!theme.theme.trim()) {
    throw new Error(`Theme is missing name for filing ${filingDate}`);
  }

  if (!allowedImportance.has(theme.importance)) {
    throw new Error(`Invalid theme importance "${theme.importance}" for ${theme.theme}`);
  }

  if (!Array.isArray(theme.evidence)) {
    throw new Error(`Theme evidence must be an array for ${theme.theme}`);
  }

  if (theme.assignment_status && !allowedAssignmentStatuses.has(theme.assignment_status)) {
    throw new Error(`Invalid assignment_status "${theme.assignment_status}" for ${theme.theme}`);
  }
}
