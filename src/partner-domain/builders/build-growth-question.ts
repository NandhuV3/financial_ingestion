import type { OwnerQuestionCard } from "../partner-domain.types.js";
import type { PartnerSourceArtifacts } from "../partner-source.types.js";
import { sentenceList } from "./business-language.js";

const question = "Where does the next rupee come from?";

export function buildGrowthQuestion(artifacts: PartnerSourceArtifacts): OwnerQuestionCard {
  const knowledge = artifacts.companyKnowledge;
  const revenueDrivers = sentenceList(knowledge.revenue_drivers, "the existing revenue drivers described by Company Knowledge");
  const priorities = sentenceList(knowledge.strategic_priorities, "the strategic priorities described by Company Knowledge");
  const strengthening = strengtheningTopics(artifacts);
  const growthSignals = sentenceList(strengthening, "areas showing stronger business attention");

  return {
    question,
    answer: `The next rupee is most likely to come from ${revenueDrivers}. The business is prioritizing ${priorities}, while recent signals point to ${growthSignals}.`,
    confidence: confidenceFromSignals([
      ...knowledge.revenue_drivers,
      ...knowledge.strategic_priorities,
      ...strengthening,
    ]),
    evidence: [
      "revenue_drivers",
      "strategic_priorities",
      ...(artifacts.quarterChange ? ["quarter_change"] : []),
      ...(artifacts.topicEvolution ? ["topic_evolution"] : []),
    ],
    status: "answered",
  };
}

function strengtheningTopics(artifacts: PartnerSourceArtifacts): string[] {
  const quarterTopics = artifacts.quarterChange?.topic_changes
    .filter((change) => change.change_type === "TOPIC_INTENSIFIED")
    .map((change) => change.topic_id) ?? [];
  const quarterCategories = artifacts.quarterChange?.changes
    .filter((change) => ["NEW_CATEGORY", "IMPORTANCE_INCREASED", "EVIDENCE_INCREASED"].includes(change.change_type))
    .flatMap((change) => [change.category, ...change.current_theme_names]) ?? [];
  const evolutionTopics = artifacts.topicEvolution?.topics
    .filter((topic) => topic.trend_state === "strengthening" || topic.presence_state === "new")
    .map((topic) => topic.topic_name) ?? [];

  return dedupe([...quarterTopics, ...quarterCategories, ...evolutionTopics]).slice(0, 3);
}

function confidenceFromSignals(signals: string[]): OwnerQuestionCard["confidence"] {
  const count = signals.filter((signal) => signal.trim().length > 0).length;

  if (count >= 4) return "high";
  if (count >= 2) return "medium";
  return "low";
}

function dedupe(values: string[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const value of values) {
    const cleaned = value.replace(/[_-]/g, " ").replace(/\s+/g, " ").trim();
    const key = cleaned.toLowerCase();

    if (!cleaned || seen.has(key)) {
      continue;
    }

    seen.add(key);
    output.push(cleaned);
  }

  return output;
}
