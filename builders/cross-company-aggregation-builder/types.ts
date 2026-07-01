import type {
  AggregationResultArtifactContent,
} from "../../contracts/artifacts/aggregation-result-artifact-content.js";
import type {
  TopicSignalExecutionRecord,
} from "../../contracts/execution/topic-signal-execution-record.js";

export type CrossCompanyAggregationBuilderInput = {
  topic_signals: TopicSignalExecutionRecord[];
  aggregation_configuration_version: string;
};

export type CrossCompanyAggregationBuilderOutput =
  AggregationResultArtifactContent;
