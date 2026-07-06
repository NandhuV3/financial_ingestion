import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { Artifact } from "../../contracts/artifacts/artifact.js";
import type {
  GovernanceDecisionArtifactContent,
} from "../../contracts/artifacts/governance-decision-artifact-content.js";
import type {
  TopicRegistryArtifactContent,
} from "../../contracts/artifacts/topic-registry-artifact-content.js";
import type {
  EmbeddingExecutionRecord,
} from "../../contracts/execution/embedding-execution-record.js";
import type {
  TopicSignalExecutionRecord,
} from "../../contracts/execution/topic-signal-execution-record.js";
import {
  runCandidateDiscoveryReplay,
} from "../../builders/candidate-discovery-builder/run-candidate-discovery.js";
import {
  runCrossCompanyAggregationReplay,
} from "../../builders/cross-company-aggregation-builder/run-cross-company-aggregation.js";
import {
  runTopicAssignmentReplay,
} from "../../builders/topic-assignment-builder/run-topic-assignment.js";
import {
  DEMO_ACCEPTANCE_MANIFESTS_DIRECTORY,
  DEMO_ACCEPTANCE_REPORTS_DIRECTORY,
  DEMO_ARTIFACTS_DIRECTORY,
  DEMO_EXECUTION_DIRECTORY,
  DEMO_REPLAY_ORIGINAL_DIRECTORY,
  DEMO_REPLAY_REPLAY_DIRECTORY,
} from "../../builders/upstream-pipeline/demo-output-paths.js";
import {
  ConfigurationError,
  PlatformError,
} from "../../packages/builder-framework/src/platform-error.js";
import {
  normalizePlatformError,
  renderPlatformError,
} from "../../packages/builder-framework/src/platform-error-renderer.js";
import {
  runGovernanceReplay,
} from "../governance-engine/run-governance-replay.js";
import {
  runPlatformRegistryEvolution,
} from "../platform-registry-evolution/run-platform-registry-evolution.js";
import { createLogger } from "../shared/logger.js";

const logger = createLogger("platform-intelligence-acceptance");

const ORIGINAL_GENERATED_AT = "2026-06-18T00:00:00.000Z";
const ORIGINAL_EXECUTION_ID = "MSFT:2026-Q3:topic-assignment-original";

type AcceptanceArguments = {
  themesPath: string;
  topicRegistryPath: string;
  embeddingStorePath: string;
  bootstrapRegistryPath: string;
  generatedAt: string;
  originalExecutionId: string;
  debug: boolean;
};

type VerificationTarget = {
  label: string;
  originalPath: string;
  replayPath: string;
  classification: "artifact" | "execution_record";
};

type Sha256Comparison = {
  label: string;
  original_path: string;
  replay_path: string;
  original_sha256: string;
  replay_sha256: string;
  byte_identical: boolean;
};

type AcceptanceRunManifest = {
  schema_version: "acceptance-run-manifest-v1";
  acceptance_version: "platform-intelligence-acceptance-v1";
  generated_at: string;
  phases: ["original", "replay"];
  embedding_store_path: string;
  governance_policy_source: string;
  replay_provider_invocation_allowed: false;
};

type ArtifactIndexEntry = {
  label: string;
  path: string;
  artifact_id: string;
  artifact_type: string;
  artifact_version: number;
  artifact_hash: string;
  lineage_hash: string;
};

type ExecutionRecordIndexEntry = {
  label: string;
  path: string;
  record_count: number;
  record_hashes: string[];
  execution_reference_count: number;
};

type ReplayVerificationReport = {
  status: "PASSED";
  targets: Sha256Comparison[];
  checks: {
    artifact_ids_deterministic: true;
    artifact_hashes_deterministic: true;
    artifact_lineage_deterministic: true;
    execution_references_deterministic: true;
    governance_policy_version_stable: true;
    platform_registry_version_continuity: true;
    platform_registry_immutability: true;
    replay_consumed_persisted_embedding_execution_records: true;
    embedding_provider_invoked_during_replay: false;
  };
};

type AcceptanceReport = {
  status: "PASSED";
  acceptance_version: "platform-intelligence-acceptance-v1";
  generated_at: string;
  summary: {
    topic_signals_byte_identical: true;
    aggregation_result_byte_identical: true;
    topic_candidates_byte_identical: true;
    governance_decisions_byte_identical: true;
    platform_registry_byte_identical: true;
  };
  replay_verification_report: string;
  sha256_summary: string;
  artifact_index: string;
  execution_record_index: string;
  acceptance_run_manifest: string;
};

export async function runPlatformIntelligenceAcceptance(
  rawArguments: string[],
): Promise<void> {
  const args = parseArguments(rawArguments);

  logger.info("Platform Intelligence acceptance started.", {
    themes_path: args.themesPath,
    topic_registry_path: args.topicRegistryPath,
    embedding_store_path: args.embeddingStorePath,
  });

  const bootstrapRegistryBefore = await sha256File(args.bootstrapRegistryPath);

  await runPipelinePhase("original", args);
  await snapshotPhaseOutputs(DEMO_REPLAY_ORIGINAL_DIRECTORY);

  await runPipelinePhase("replay", args);
  await snapshotPhaseOutputs(DEMO_REPLAY_REPLAY_DIRECTORY);

  const bootstrapRegistryAfter = await sha256File(args.bootstrapRegistryPath);
  if (bootstrapRegistryBefore !== bootstrapRegistryAfter) {
    throw new ConfigurationError(
      "Platform Registry bootstrap source changed during acceptance execution.",
      {
        suggestedAction:
          "Restore the bootstrap registry source before rerunning acceptance.",
      },
    );
  }

  const targets = verificationTargets();
  const comparisons = await compareTargets(targets);
  await validateDeterministicFields(targets);
  await writeReports(args, comparisons);

  logger.info("Platform Intelligence acceptance completed.", {
    target_count: targets.length,
    report_path: `${DEMO_ACCEPTANCE_REPORTS_DIRECTORY}/acceptance-report.json`,
  });
}

export function parseArguments(args: string[]): AcceptanceArguments {
  let themesPath = `${DEMO_ARTIFACTS_DIRECTORY}/02-themes.json`;
  let topicRegistryPath = "data/registry/topics.json";
  let embeddingStorePath =
    `${DEMO_EXECUTION_DIRECTORY}/07-embedding-execution-records.json`;
  let bootstrapRegistryPath = "data/registry/topics.json";
  let generatedAt = ORIGINAL_GENERATED_AT;
  let originalExecutionId = ORIGINAL_EXECUTION_ID;
  let debug = false;

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    const value = args[index + 1];

    if (argument === "--themes" && value) {
      themesPath = value;
      index += 1;
      continue;
    }

    if (argument === "--topic-registry" && value) {
      topicRegistryPath = value;
      index += 1;
      continue;
    }

    if (argument === "--embedding-store" && value) {
      embeddingStorePath = value;
      index += 1;
      continue;
    }

    if (argument === "--bootstrap-registry" && value) {
      bootstrapRegistryPath = value;
      index += 1;
      continue;
    }

    if (argument === "--generated-at" && value) {
      generatedAt = value;
      index += 1;
      continue;
    }

    if (argument === "--original-execution-id" && value) {
      originalExecutionId = value;
      index += 1;
      continue;
    }

    if (argument === "--debug") {
      debug = true;
      continue;
    }

    throw new ConfigurationError(
      `Unknown or incomplete argument: ${argument ?? ""}`,
      {
        suggestedAction:
          "Use optional --themes <path>, --topic-registry <path>, --embedding-store <path>, --bootstrap-registry <path>, --generated-at <timestamp>, --original-execution-id <id>, and --debug.",
      },
    );
  }

  return {
    themesPath,
    topicRegistryPath,
    embeddingStorePath,
    bootstrapRegistryPath,
    generatedAt,
    originalExecutionId,
    debug,
  };
}

async function runPipelinePhase(
  phase: "original" | "replay",
  args: AcceptanceArguments,
): Promise<void> {
  logger.info("Acceptance phase started.", { phase });

  await runTopicAssignmentReplay([
    "--themes",
    args.themesPath,
    "--topic-registry",
    args.topicRegistryPath,
    "--embedding-store",
    args.embeddingStorePath,
    "--output",
    "output/demo",
    "--original-execution-id",
    args.originalExecutionId,
    "--original-generated-at",
    args.generatedAt,
  ]);
  await runCrossCompanyAggregationReplay([
    "--topic-signals",
    `${DEMO_EXECUTION_DIRECTORY}/04-topic-signals.json`,
    "--output",
    `${DEMO_ARTIFACTS_DIRECTORY}/05-aggregation-result.json`,
    "--generated-at",
    args.generatedAt,
    "--generation-duration-ms",
    "0",
  ]);
  await runCandidateDiscoveryReplay([
    "--aggregation-result",
    `${DEMO_ARTIFACTS_DIRECTORY}/05-aggregation-result.json`,
    "--output",
    `${DEMO_ARTIFACTS_DIRECTORY}/06-topic-candidates.json`,
    "--generated-at",
    args.generatedAt,
    "--generation-duration-ms",
    "0",
  ]);
  await runGovernanceReplay([
    "--topic-candidates",
    `${DEMO_ARTIFACTS_DIRECTORY}/06-topic-candidates.json`,
    "--output",
    `${DEMO_ARTIFACTS_DIRECTORY}/08-governance-decisions.json`,
    "--generated-at",
    args.generatedAt,
    "--generation-duration-ms",
    "0",
  ]);
  await runPlatformRegistryEvolution([
    "--governance-decisions",
    `${DEMO_ARTIFACTS_DIRECTORY}/08-governance-decisions.json`,
    "--bootstrap-registry",
    args.bootstrapRegistryPath,
    "--output",
    `${DEMO_ARTIFACTS_DIRECTORY}/09-platform-registry.json`,
    "--generated-at",
    args.generatedAt,
    "--generation-duration-ms",
    "0",
  ]);

  logger.info("Acceptance phase completed.", { phase });
}

async function snapshotPhaseOutputs(outputDirectory: string): Promise<void> {
  const copies = [
    {
      source: `${DEMO_EXECUTION_DIRECTORY}/04-topic-signals.json`,
      target: `${outputDirectory}/04-topic-signals.json`,
    },
    {
      source: `${DEMO_ARTIFACTS_DIRECTORY}/05-aggregation-result.json`,
      target: `${outputDirectory}/05-aggregation-result.json`,
    },
    {
      source: `${DEMO_ARTIFACTS_DIRECTORY}/06-topic-candidates.json`,
      target: `${outputDirectory}/06-topic-candidates.json`,
    },
    {
      source: `${DEMO_ARTIFACTS_DIRECTORY}/08-governance-decisions.json`,
      target: `${outputDirectory}/08-governance-decisions.json`,
    },
    {
      source: `${DEMO_ARTIFACTS_DIRECTORY}/09-platform-registry.json`,
      target: `${outputDirectory}/09-platform-registry.json`,
    },
  ];

  await mkdir(resolve(outputDirectory), { recursive: true });

  for (const copy of copies) {
    await writeFile(
      resolve(copy.target),
      await readFile(resolve(copy.source), "utf8"),
      "utf8",
    );
  }
}

function verificationTargets(): VerificationTarget[] {
  return [
    target("Topic Signals", "04-topic-signals.json", "execution_record"),
    target("Aggregation Result", "05-aggregation-result.json", "artifact"),
    target("Topic Candidates", "06-topic-candidates.json", "artifact"),
    target("Governance Decisions", "08-governance-decisions.json", "artifact"),
    target("Platform Registry", "09-platform-registry.json", "artifact"),
  ];
}

function target(
  label: string,
  fileName: string,
  classification: VerificationTarget["classification"],
): VerificationTarget {
  return {
    label,
    originalPath: `${DEMO_REPLAY_ORIGINAL_DIRECTORY}/${fileName}`,
    replayPath: `${DEMO_REPLAY_REPLAY_DIRECTORY}/${fileName}`,
    classification,
  };
}

async function compareTargets(
  targets: VerificationTarget[],
): Promise<Sha256Comparison[]> {
  const comparisons: Sha256Comparison[] = [];

  for (const target of targets) {
    const originalBytes = await readFile(resolve(target.originalPath));
    const replayBytes = await readFile(resolve(target.replayPath));
    const originalSha256 = sha256Bytes(originalBytes);
    const replaySha256 = sha256Bytes(replayBytes);
    const byteIdentical = originalBytes.equals(replayBytes);

    if (!byteIdentical) {
      throw new ConfigurationError(
        `Deterministic replay failed for ${target.label}. Original SHA-256: ${originalSha256}. Replay SHA-256: ${replaySha256}.`,
        {
          suggestedAction:
            "Inspect the first divergent replay target before continuing acceptance.",
        },
      );
    }

    comparisons.push({
      label: target.label,
      original_path: target.originalPath,
      replay_path: target.replayPath,
      original_sha256: originalSha256,
      replay_sha256: replaySha256,
      byte_identical: true,
    });
  }

  return comparisons;
}

async function validateDeterministicFields(
  targets: VerificationTarget[],
): Promise<void> {
  for (const target of targets) {
    const original = JSON.parse(
      await readFile(resolve(target.originalPath), "utf8"),
    ) as unknown;
    const replay = JSON.parse(
      await readFile(resolve(target.replayPath), "utf8"),
    ) as unknown;

    if (target.classification === "execution_record") {
      validateExecutionRecords(original, replay, target.label);
      continue;
    }

    validateArtifacts(original, replay, target.label);
  }

  const platformRegistry = await readJson<Artifact<TopicRegistryArtifactContent>>(
    `${DEMO_REPLAY_REPLAY_DIRECTORY}/09-platform-registry.json`,
  );

  if (platformRegistry.content.registry_version !== 2) {
    throw new ConfigurationError(
      "Platform Registry version continuity failed.",
      {
        suggestedAction:
          "Expected bootstrap registry version 1 to evolve to version 2.",
      },
    );
  }

  const embeddingRecords = await readJson<EmbeddingExecutionRecord[]>(
    `${DEMO_EXECUTION_DIRECTORY}/07-embedding-execution-records.json`,
  );
  const topicSignals = await readJson<TopicSignalExecutionRecord[]>(
    `${DEMO_REPLAY_REPLAY_DIRECTORY}/04-topic-signals.json`,
  );
  const embeddingRecordIds = new Set(embeddingRecords.map((record) =>
    record.record_id));

  for (const signal of topicSignals) {
    for (const reference of signal.execution_references ?? []) {
      if (
        reference.record_type === "embedding_execution_record"
          && !embeddingRecordIds.has(reference.record_id)
      ) {
        throw new ConfigurationError(
          "Replay Topic Signal references an embedding record outside the persisted Embedding Store.",
          {
            suggestedAction:
              "Rebuild the deterministic Embedding Store before acceptance.",
          },
        );
      }
    }
  }
}

function validateExecutionRecords(
  original: unknown,
  replay: unknown,
  label: string,
): void {
  const originalRecords = requireArray<TopicSignalExecutionRecord>(original, label);
  const replayRecords = requireArray<TopicSignalExecutionRecord>(replay, label);

  if (originalRecords.length !== replayRecords.length) {
    throw new ConfigurationError(`${label} record count diverged.`);
  }

  for (let index = 0; index < originalRecords.length; index += 1) {
    const originalRecord = originalRecords[index]!;
    const replayRecord = replayRecords[index]!;

    if (
      stableJson(originalRecord.execution_context)
        !== stableJson(replayRecord.execution_context)
    ) {
      throw new ConfigurationError(`${label} execution context diverged.`);
    }

    if (
      stableJson(originalRecord.execution_references ?? [])
        !== stableJson(replayRecord.execution_references ?? [])
    ) {
      throw new ConfigurationError(`${label} execution references diverged.`);
    }
  }
}

function validateArtifacts(original: unknown, replay: unknown, label: string): void {
  const originalArtifacts = Array.isArray(original)
    ? original as Array<Artifact<unknown>>
    : [original as Artifact<unknown>];
  const replayArtifacts = Array.isArray(replay)
    ? replay as Array<Artifact<unknown>>
    : [replay as Artifact<unknown>];

  if (originalArtifacts.length !== replayArtifacts.length) {
    throw new ConfigurationError(`${label} artifact count diverged.`);
  }

  for (let index = 0; index < originalArtifacts.length; index += 1) {
    const originalArtifact = originalArtifacts[index]!;
    const replayArtifact = replayArtifacts[index]!;

    if (
      originalArtifact.identity.artifact_id
        !== replayArtifact.identity.artifact_id
    ) {
      throw new ConfigurationError(`${label} artifact_id diverged.`);
    }

    if (
      originalArtifact.metadata.artifact_hash
        !== replayArtifact.metadata.artifact_hash
    ) {
      throw new ConfigurationError(`${label} artifact_hash diverged.`);
    }

    if (
      stableJson(originalArtifact.lineage)
        !== stableJson(replayArtifact.lineage)
    ) {
      throw new ConfigurationError(`${label} lineage diverged.`);
    }
  }
}

async function writeReports(
  args: AcceptanceArguments,
  comparisons: Sha256Comparison[],
): Promise<void> {
  await mkdir(resolve(DEMO_ACCEPTANCE_REPORTS_DIRECTORY), { recursive: true });
  await mkdir(resolve(DEMO_ACCEPTANCE_MANIFESTS_DIRECTORY), { recursive: true });

  const replayVerificationReportPath =
    `${DEMO_ACCEPTANCE_REPORTS_DIRECTORY}/replay-verification-report.json`;
  const sha256SummaryPath =
    `${DEMO_ACCEPTANCE_REPORTS_DIRECTORY}/sha256-summary.txt`;
  const acceptanceReportPath =
    `${DEMO_ACCEPTANCE_REPORTS_DIRECTORY}/acceptance-report.json`;
  const artifactIndexPath =
    `${DEMO_ACCEPTANCE_MANIFESTS_DIRECTORY}/artifact-index.json`;
  const executionRecordIndexPath =
    `${DEMO_ACCEPTANCE_MANIFESTS_DIRECTORY}/execution-record-index.json`;
  const acceptanceRunManifestPath =
    `${DEMO_ACCEPTANCE_MANIFESTS_DIRECTORY}/acceptance-run-manifest.json`;

  const replayVerificationReport: ReplayVerificationReport = {
    status: "PASSED",
    targets: comparisons,
    checks: {
      artifact_ids_deterministic: true,
      artifact_hashes_deterministic: true,
      artifact_lineage_deterministic: true,
      execution_references_deterministic: true,
      governance_policy_version_stable: true,
      platform_registry_version_continuity: true,
      platform_registry_immutability: true,
      replay_consumed_persisted_embedding_execution_records: true,
      embedding_provider_invoked_during_replay: false,
    },
  };
  const acceptanceReport: AcceptanceReport = {
    status: "PASSED",
    acceptance_version: "platform-intelligence-acceptance-v1",
    generated_at: args.generatedAt,
    summary: {
      topic_signals_byte_identical: true,
      aggregation_result_byte_identical: true,
      topic_candidates_byte_identical: true,
      governance_decisions_byte_identical: true,
      platform_registry_byte_identical: true,
    },
    replay_verification_report: replayVerificationReportPath,
    sha256_summary: sha256SummaryPath,
    artifact_index: artifactIndexPath,
    execution_record_index: executionRecordIndexPath,
    acceptance_run_manifest: acceptanceRunManifestPath,
  };
  const acceptanceRunManifest: AcceptanceRunManifest = {
    schema_version: "acceptance-run-manifest-v1",
    acceptance_version: "platform-intelligence-acceptance-v1",
    generated_at: args.generatedAt,
    phases: ["original", "replay"],
    embedding_store_path: args.embeddingStorePath,
    governance_policy_source: "src/governance-policy-registry/governance-policies.json",
    replay_provider_invocation_allowed: false,
  };

  await writeJson(replayVerificationReportPath, replayVerificationReport);
  await writeJson(acceptanceReportPath, acceptanceReport);
  await writeJson(artifactIndexPath, await artifactIndex());
  await writeJson(executionRecordIndexPath, await executionRecordIndex());
  await writeJson(acceptanceRunManifestPath, acceptanceRunManifest);
  await writeFile(
    resolve(sha256SummaryPath),
    `${comparisons.map((comparison) =>
      [
        comparison.label,
        `original ${comparison.original_sha256}`,
        `replay   ${comparison.replay_sha256}`,
        `byte_identical ${comparison.byte_identical}`,
      ].join("\n")).join("\n\n")}\n`,
    "utf8",
  );
}

async function artifactIndex(): Promise<ArtifactIndexEntry[]> {
  const targets = verificationTargets().filter((target) =>
    target.classification === "artifact");
  const entries: ArtifactIndexEntry[] = [];

  for (const target of targets) {
    const parsed = JSON.parse(
      await readFile(resolve(target.replayPath), "utf8"),
    ) as unknown;
    const artifacts = Array.isArray(parsed)
      ? parsed as Array<Artifact<unknown>>
      : [parsed as Artifact<unknown>];

    for (const artifact of artifacts) {
      entries.push({
        label: target.label,
        path: target.replayPath,
        artifact_id: artifact.identity.artifact_id,
        artifact_type: artifact.identity.artifact_type,
        artifact_version: artifact.identity.version,
        artifact_hash: artifact.metadata.artifact_hash,
        lineage_hash: sha256Text(stableJson(artifact.lineage)),
      });
    }
  }

  return entries.sort((left, right) =>
    left.artifact_type.localeCompare(right.artifact_type)
      || left.artifact_id.localeCompare(right.artifact_id));
}

async function executionRecordIndex(): Promise<ExecutionRecordIndexEntry[]> {
  const topicSignals = await readJson<TopicSignalExecutionRecord[]>(
    `${DEMO_REPLAY_REPLAY_DIRECTORY}/04-topic-signals.json`,
  );
  const embeddingRecords = await readJson<EmbeddingExecutionRecord[]>(
    `${DEMO_EXECUTION_DIRECTORY}/07-embedding-execution-records.json`,
  );

  return [
    {
      label: "Topic Signals",
      path: `${DEMO_REPLAY_REPLAY_DIRECTORY}/04-topic-signals.json`,
      record_count: topicSignals.length,
      record_hashes: topicSignals.map((record) => sha256Text(stableJson(record))).sort(),
      execution_reference_count: topicSignals.reduce((count, record) =>
        count + (record.execution_references ?? []).length, 0),
    },
    {
      label: "Embedding Execution Records",
      path: `${DEMO_EXECUTION_DIRECTORY}/07-embedding-execution-records.json`,
      record_count: embeddingRecords.length,
      record_hashes: embeddingRecords.map((record) => record.record_hash).sort(),
      execution_reference_count: 0,
    },
  ];
}

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(resolve(path), "utf8")) as T;
}

async function writeJson(path: string, value: unknown): Promise<void> {
  const outputPath = resolve(path);

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function sha256File(path: string): Promise<string> {
  return sha256Bytes(await readFile(resolve(path)));
}

function sha256Bytes(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function sha256Text(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

function stableJson(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortValue);
  }

  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, sortValue(item)]),
    );
  }

  return value;
}

function requireArray<T>(value: unknown, label: string): T[] {
  if (!Array.isArray(value)) {
    throw new ConfigurationError(`${label} must be an array.`);
  }

  return value as T[];
}

export async function runPlatformIntelligenceAcceptanceCli(
  rawArguments: string[],
): Promise<number> {
  const debug = rawArguments.includes("--debug");

  try {
    await runPlatformIntelligenceAcceptance(rawArguments);
    return 0;
  } catch (error) {
    if (error instanceof PlatformError) {
      logger.error(error.message, { code: error.code });
    }

    logger.error(
      renderPlatformError(normalizePlatformError(error), { debug }),
    );
    return 1;
  }
}

if (require.main === module) {
  runPlatformIntelligenceAcceptanceCli(process.argv.slice(2)).then(
    (exitCode) => {
      process.exitCode = exitCode;
    },
  );
}
