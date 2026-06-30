export type TopicLifecycleState =
  | "proposed"
  | "provisional"
  | "active"
  | "deprecated"
  | "merged"
  | "retired";

export type TopicRegistryEntry = {
  topic_id: string;
  canonical_name: string;
  definition: string;
  aliases: string[];
  lifecycle_state: TopicLifecycleState;
  created_registry_version: number;
  updated_registry_version: number;
  parent_topic_id?: string;
  child_topic_ids: string[];
  merged_into_topic_id?: string;
  deprecated_reason?: string;
  embedding_version?: string;
  examples: string[];
  created_at: string;
  updated_at: string;
};

export type TopicRegistryArtifactContent = {
  registry_version: number;
  topics: TopicRegistryEntry[];
};
