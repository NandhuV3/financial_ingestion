import type { Artifact } from "../../contracts/artifacts/artifact.js";
import { ArtifactStatus } from "../../contracts/artifacts/artifact-status.js";
import type {
  TopicAssignmentArtifactContent,
} from "../../contracts/artifacts/topic-assignment-artifact-content.js";
import type {
  TopicRegistryArtifactContent,
} from "../../contracts/artifacts/topic-registry-artifact-content.js";
import {
  BuilderDependencyError,
  BuilderValidationError,
} from "../../packages/builder-framework/src/builder-errors.js";
import type { ThemesArtifactContent } from "../themes/contract.js";
import { createAssignmentId } from "./assignment.js";
import { calculateTopicAssignmentConfidence } from "./confidence.js";
import {
  ASSIGNMENT_METHODS,
  MAX_ASSIGNMENTS_PER_THEME,
} from "./contract.js";
import type { TopicAssignmentBuilderInput } from "./types.js";

export function validateTopicAssignmentBuilderInput(
  input: TopicAssignmentBuilderInput,
): void {
  requireText(input.company_id, "company_id");
  requireText(input.period_id, "period_id");
  requireText(input.filing_id, "filing_id");
}

export function validateTopicAssignmentDependencies(
  dependencies: Record<string, unknown>,
): void {
  const dependencyNames = Object.keys(dependencies).sort();
  const expected = ["themes", "topic_registry"];

  if (
    dependencyNames.length !== expected.length
    || dependencyNames.some((name, index) => name !== expected[index])
  ) {
    throw new BuilderDependencyError(
      `Topic Assignment requires exactly these dependencies: ${expected.join(", ")}.`,
    );
  }
}

export function requireThemesDependency(
  artifact: Artifact<unknown> | undefined,
  input: TopicAssignmentBuilderInput,
): Artifact<ThemesArtifactContent> {
  if (artifact === undefined) {
    throw new BuilderDependencyError(
      "Missing required Topic Assignment dependency: themes.",
    );
  }

  if (artifact.identity.artifact_type !== "themes") {
    throw new BuilderDependencyError(
      "Topic Assignment themes dependency must have artifact_type themes.",
    );
  }

  const themes = artifact as Artifact<ThemesArtifactContent>;

  if (
    themes.identity.company_id !== input.company_id
    || themes.identity.period_id !== input.period_id
    || themes.content.company_id !== input.company_id
    || themes.content.period_id !== input.period_id
  ) {
    throw new BuilderDependencyError(
      "Topic Assignment themes company and period must match the build target.",
    );
  }

  if (themes.content.filing_id !== input.filing_id) {
    throw new BuilderDependencyError(
      "Topic Assignment themes filing_id must match the build input.",
    );
  }

  if (themes.metadata.status !== ArtifactStatus.ACTIVE) {
    throw new BuilderDependencyError(
      "Topic Assignment themes dependency must be active.",
    );
  }

  const themeIds = new Set<string>();

  for (const [index, theme] of themes.content.themes.entries()) {
    requireText(theme.theme_id, `themes.themes[${index}].theme_id`);
    requireText(theme.title, `themes.themes[${index}].title`);
    requireText(theme.summary, `themes.themes[${index}].summary`);
    requireText(theme.category, `themes.themes[${index}].category`);

    if (
      !Number.isInteger(theme.evidence_count)
      || theme.evidence_count < 0
      || theme.evidence_count !== theme.evidence.length
    ) {
      throw new BuilderDependencyError(
        `themes.themes[${index}].evidence_count must equal evidence length.`,
      );
    }

    if (themeIds.has(theme.theme_id)) {
      throw new BuilderDependencyError(
        `Themes contains duplicate theme_id: ${theme.theme_id}.`,
      );
    }

    themeIds.add(theme.theme_id);
  }

  return themes;
}

export function requireTopicRegistryDependency(
  artifact: Artifact<unknown> | undefined,
): Artifact<TopicRegistryArtifactContent> {
  if (artifact === undefined) {
    throw new BuilderDependencyError(
      "Missing required Topic Assignment dependency: topic_registry.",
    );
  }

  if (artifact.identity.artifact_type !== "topic_registry") {
    throw new BuilderDependencyError(
      "Topic Assignment registry dependency must have artifact_type topic_registry.",
    );
  }

  const registry = artifact as Artifact<TopicRegistryArtifactContent>;

  if (
    registry.identity.company_id !== null
    || registry.identity.period_id !== null
  ) {
    throw new BuilderDependencyError(
      "Topic Registry artifact must use global null company and period identity.",
    );
  }

  if (registry.metadata.status !== ArtifactStatus.ACTIVE) {
    throw new BuilderDependencyError(
      "Topic Registry artifact must be active.",
    );
  }

  if (
    !Number.isInteger(registry.content.registry_version)
    || registry.content.registry_version < 1
  ) {
    throw new BuilderDependencyError(
      "Topic Registry registry_version must be a positive integer.",
    );
  }

  if (!Array.isArray(registry.content.topics)) {
    throw new BuilderDependencyError(
      "Topic Registry topics must be an array.",
    );
  }

  const ids = new Set<string>();
  const canonicalNames = new Set<string>();

  for (const [index, topic] of registry.content.topics.entries()) {
    requireText(topic.topic_id, `topic_registry.topics[${index}].topic_id`);
    requireText(
      topic.canonical_name,
      `topic_registry.topics[${index}].canonical_name`,
    );
    requireText(topic.definition, `topic_registry.topics[${index}].definition`);

    if (
      !Array.isArray(topic.aliases)
      || topic.aliases.some((alias) =>
        typeof alias !== "string" || alias.trim() === "")
    ) {
      throw new BuilderDependencyError(
        `topic_registry.topics[${index}].aliases must contain only non-empty strings.`,
      );
    }

    if (
      ![
        "proposed",
        "provisional",
        "active",
        "deprecated",
        "merged",
        "retired",
      ].includes(topic.lifecycle_state)
    ) {
      throw new BuilderDependencyError(
        `topic_registry.topics[${index}].lifecycle_state is invalid.`,
      );
    }

    if (ids.has(topic.topic_id)) {
      throw new BuilderDependencyError(
        `Topic Registry contains duplicate topic_id: ${topic.topic_id}.`,
      );
    }

    validateStringArray(
      topic.child_topic_ids,
      `topic_registry.topics[${index}].child_topic_ids`,
    );
    validatePositiveIntegerDependency(
      topic.created_registry_version,
      `topic_registry.topics[${index}].created_registry_version`,
    );
    validatePositiveIntegerDependency(
      topic.updated_registry_version,
      `topic_registry.topics[${index}].updated_registry_version`,
    );

    if (topic.created_registry_version > topic.updated_registry_version) {
      throw new BuilderDependencyError(
        `topic_registry.topics[${index}] created_registry_version must be less than or equal to updated_registry_version.`,
      );
    }

    if (canonicalNames.has(normalizeText(topic.canonical_name))) {
      throw new BuilderDependencyError(
        `Topic Registry contains duplicate canonical_name: ${topic.canonical_name}.`,
      );
    }

    canonicalNames.add(normalizeText(topic.canonical_name));
    ids.add(topic.topic_id);
  }

  return registry;
}

export function validateTopicAssignmentArtifactContent(
  content: TopicAssignmentArtifactContent,
  themesArtifact: Artifact<ThemesArtifactContent>,
  registryArtifact: Artifact<TopicRegistryArtifactContent>,
): void {
  requireText(content.company_id, "topic_assignment.company_id");
  requireText(content.period_id, "topic_assignment.period_id");
  requireText(content.filing_id, "topic_assignment.filing_id");
  validatePositiveInteger(content.registry_version, "topic_assignment.registry_version");

  if (
    content.company_id !== themesArtifact.content.company_id
    || content.period_id !== themesArtifact.content.period_id
    || content.filing_id !== themesArtifact.content.filing_id
  ) {
    throw new BuilderValidationError(
      "Topic Assignment content identity must reconcile with Themes.",
    );
  }

  if (content.registry_version !== registryArtifact.content.registry_version) {
    throw new BuilderValidationError(
      "Topic Assignment registry_version must reconcile with Topic Registry.",
    );
  }

  const themesById = new Map(
    themesArtifact.content.themes.map((theme) => [theme.theme_id, theme]),
  );
  const themeIds = new Set(themesById.keys());
  const activeTopicIds = new Set(
    registryArtifact.content.topics
      .filter(({ lifecycle_state }) => lifecycle_state === "active")
      .map(({ topic_id }) => topic_id),
  );
  const assignmentIds = new Set<string>();
  const assignmentsByTheme = new Map<string, Set<string>>();

  for (const [index, assignment] of content.assignments.entries()) {
    requireText(assignment.assignment_id, `assignments[${index}].assignment_id`);
    requireText(assignment.theme_id, `assignments[${index}].theme_id`);
    requireText(assignment.topic_id, `assignments[${index}].topic_id`);
    requireText(assignment.theme_title, `assignments[${index}].theme_title`);
    requireText(assignment.theme_summary, `assignments[${index}].theme_summary`);

    const sourceTheme = themesById.get(assignment.theme_id);

    if (sourceTheme === undefined) {
      throw new BuilderValidationError(
        `assignments[${index}].theme_id does not reference Themes.`,
      );
    }

    if (
      assignment.theme_title !== sourceTheme.title
      || assignment.theme_summary !== sourceTheme.summary
    ) {
      throw new BuilderValidationError(
        `assignments[${index}] theme context must match the source Theme.`,
      );
    }

    if (!activeTopicIds.has(assignment.topic_id)) {
      throw new BuilderValidationError(
        `assignments[${index}].topic_id must reference an active registry topic.`,
      );
    }

    if (!ASSIGNMENT_METHODS.includes(assignment.assignment_method)) {
      throw new BuilderValidationError(
        `assignments[${index}].assignment_method is invalid.`,
      );
    }

    validateConfidence(
      assignment.similarity_score,
      `assignments[${index}].similarity_score`,
    );
    validateConfidence(
      assignment.confidence,
      `assignments[${index}].confidence`,
    );

    if (assignment.confidence !== assignment.similarity_score) {
      throw new BuilderValidationError(
        `assignments[${index}].confidence must equal similarity_score.`,
      );
    }

    if (
      assignment.assignment_id
      !== createAssignmentId(assignment.theme_id, assignment.topic_id)
    ) {
      throw new BuilderValidationError(
        `assignments[${index}].assignment_id is not stable.`,
      );
    }

    if (assignmentIds.has(assignment.assignment_id)) {
      throw new BuilderValidationError(
        `Duplicate assignment_id: ${assignment.assignment_id}.`,
      );
    }

    assignmentIds.add(assignment.assignment_id);
    const topicIds = assignmentsByTheme.get(assignment.theme_id) ?? new Set<string>();

    if (topicIds.has(assignment.topic_id)) {
      throw new BuilderValidationError(
        `assignments[${index}] duplicates a Theme-to-Topic assignment.`,
      );
    }

    topicIds.add(assignment.topic_id);
    assignmentsByTheme.set(assignment.theme_id, topicIds);
  }

  if (
    [...assignmentsByTheme.values()].some((topicIds) =>
      topicIds.size > MAX_ASSIGNMENTS_PER_THEME)
  ) {
    throw new BuilderValidationError(
      `A theme may not have more than ${MAX_ASSIGNMENTS_PER_THEME} assignments.`,
    );
  }

  const unassignedThemeIds = new Set<string>();

  for (const [index, unassigned] of content.unassigned_themes.entries()) {
    requireText(unassigned.theme_id, `unassigned_themes[${index}].theme_id`);
    requireText(
      unassigned.theme_title,
      `unassigned_themes[${index}].theme_title`,
    );
    requireText(
      unassigned.theme_summary,
      `unassigned_themes[${index}].theme_summary`,
    );
    validateConfidence(
      unassigned.highest_similarity_score,
      `unassigned_themes[${index}].highest_similarity_score`,
    );

    const sourceTheme = themesById.get(unassigned.theme_id);

    if (
      sourceTheme === undefined
      || assignmentsByTheme.has(unassigned.theme_id)
      || unassignedThemeIds.has(unassigned.theme_id)
    ) {
      throw new BuilderValidationError(
        `unassigned_themes[${index}] must reference one unique unassigned theme.`,
      );
    }

    if (
      unassigned.theme_title !== sourceTheme.title
      || unassigned.theme_summary !== sourceTheme.summary
    ) {
      throw new BuilderValidationError(
        `unassigned_themes[${index}] theme context must match the source Theme.`,
      );
    }

    for (const candidate of unassigned.candidate_topics) {
      if (!activeTopicIds.has(candidate.topic_id)) {
        throw new BuilderValidationError(
          `unassigned_themes[${index}] candidate must reference an active topic.`,
        );
      }

      validateConfidence(
        candidate.similarity_score,
        `unassigned_themes[${index}].candidate_topics[].similarity_score`,
      );
    }

    unassignedThemeIds.add(unassigned.theme_id);
  }

  if (
    new Set([...assignmentsByTheme.keys(), ...unassignedThemeIds]).size
    !== themeIds.size
  ) {
    throw new BuilderValidationError(
      "Every theme must be assigned or represented in unassigned_themes.",
    );
  }

  validateDeterministicOrdering(content);

  const expectedConfidence = calculateTopicAssignmentConfidence(
    content.assignments,
    themeIds.size,
    content.unassigned_themes.length,
  );

  if (JSON.stringify(content.confidence) !== JSON.stringify(expectedConfidence)) {
    throw new BuilderValidationError(
      "Topic Assignment confidence does not reconcile with assignments.",
    );
  }
}

function validateDeterministicOrdering(
  content: TopicAssignmentArtifactContent,
): void {
  const assignmentKeys = content.assignments.map(({ theme_id, topic_id }) =>
    `${theme_id}:${topic_id}`);
  const sortedAssignmentKeys = [...assignmentKeys].sort();

  if (
    assignmentKeys.some((key, index) => key !== sortedAssignmentKeys[index])
  ) {
    throw new BuilderValidationError(
      "Topic assignments must use deterministic ordering.",
    );
  }

  const unassignedIds = content.unassigned_themes.map(({ theme_id }) => theme_id);
  const sortedUnassignedIds = [...unassignedIds].sort();

  if (
    unassignedIds.some((id, index) => id !== sortedUnassignedIds[index])
  ) {
    throw new BuilderValidationError(
      "Unassigned themes must use deterministic ordering.",
    );
  }
}

function validateConfidence(value: number, field: string): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new BuilderValidationError(`${field} must be between 0 and 1.`);
  }
}

function validateStringArray(value: string[], field: string): void {
  if (
    !Array.isArray(value)
    || value.some((entry) =>
      typeof entry !== "string" || entry.trim() === "")
  ) {
    throw new BuilderDependencyError(
      `${field} must contain only non-empty strings.`,
    );
  }
}

function validatePositiveIntegerDependency(value: number, field: string): void {
  if (!Number.isInteger(value) || value < 1) {
    throw new BuilderDependencyError(`${field} must be a positive integer.`);
  }
}

function validatePositiveInteger(value: number, field: string): void {
  if (!Number.isInteger(value) || value < 1) {
    throw new BuilderValidationError(`${field} must be a positive integer.`);
  }
}

function requireText(value: unknown, field: string): asserts value is string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new BuilderValidationError(`${field} must be a non-empty string.`);
  }
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}
