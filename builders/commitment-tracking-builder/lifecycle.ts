import { BuilderValidationError } from "../../packages/builder-framework/src/builder-errors.js";
import {
  ALLOWED_LIFECYCLE_TRANSITIONS,
  RESOLUTION_RESULTS_BY_STATUS,
  TERMINAL_COMMITMENT_STATUSES,
} from "./contract.js";
import type { CommitmentStatus } from "./contract.js";
import type {
  Commitment,
  CommitmentEvidence,
  CommitmentSourceRecord,
  CommitmentTimelineEvent,
  ResolvedCommitmentSource,
} from "./types.js";
import {
  assertSourceRecordAgreement,
  buildCommitmentEvidence,
  groupCommitmentRecords,
  type SourcedCommitmentRecord,
} from "./source-records.js";
import { isPeriodAfter } from "./period.js";

export function buildCommitments(
  sources: ResolvedCommitmentSource[],
  priorCommitments: Commitment[],
  currentPeriod: string,
): Commitment[] {
  const priorById = new Map(priorCommitments.map((commitment) => [commitment.commitment_id, commitment]));
  const recordsById = groupCommitmentRecords(sources);
  const sourcedCommitments = [...recordsById.entries()]
    .map(([commitmentId, records]) => buildCommitmentHistory(
      records,
      priorById.get(commitmentId) ?? null,
      currentPeriod,
    ))
    .filter((commitment): commitment is Commitment => commitment !== null);
  const sourcedIds = new Set(sourcedCommitments.map((commitment) => commitment.commitment_id));
  const carriedCommitments = priorCommitments
    .filter((commitment) =>
      !sourcedIds.has(commitment.commitment_id)
      && !isTerminalStatus(commitment.status))
    .map((commitment) => carryForwardCommitment(commitment, currentPeriod));

  return [...sourcedCommitments, ...carriedCommitments]
    .sort((left, right) => left.commitment_id.localeCompare(right.commitment_id));
}

function buildCommitmentHistory(
  records: SourcedCommitmentRecord[],
  prior: Commitment | null,
  targetPeriod: string,
): Commitment | null {
  const recordsByPeriod = new Map<string, SourcedCommitmentRecord[]>();

  for (const sourcedRecord of records) {
    const period = sourcedRecord.source.declaration.period_id;
    const periodRecords = recordsByPeriod.get(period) ?? [];
    periodRecords.push(sourcedRecord);
    recordsByPeriod.set(period, periodRecords);
  }

  let commitment = prior;
  const lastPriorPeriod = prior?.timeline.at(-1)?.period ?? null;

  for (const [period, periodRecords] of [...recordsByPeriod.entries()]
    .sort(([left], [right]) => left.localeCompare(right))) {
    if (
      prior !== null
      && lastPriorPeriod !== null
      && period.localeCompare(lastPriorPeriod) < 0
    ) {
      validateHistoricalRecords(periodRecords, prior);
      continue;
    }

    commitment = buildCommitment(periodRecords, commitment, period);
  }

  if (commitment === null || isTerminalStatus(commitment.status)) {
    return commitment;
  }

  return carryForwardCommitment(commitment, targetPeriod);
}

function validateHistoricalRecords(
  records: SourcedCommitmentRecord[],
  prior: Commitment,
): void {
  const primary = records[0];

  if (primary === undefined) {
    return;
  }

  assertStableIdentity(prior, primary.record);
  for (const candidate of records.slice(1)) {
    assertSourceRecordAgreement(primary.record, candidate.record);
  }
}

function buildCommitment(
  records: SourcedCommitmentRecord[],
  prior: Commitment | null,
  currentPeriod: string,
): Commitment {
  const primary = records[0];

  if (primary === undefined) {
    throw new BuilderValidationError("Commitment Tracking cannot build an empty commitment record group.");
  }

  for (const candidate of records.slice(1)) {
    assertSourceRecordAgreement(primary.record, candidate.record);
  }

  if (prior !== null) {
    assertStableIdentity(prior, primary.record);
    assertLifecycleTransition(prior.status, primary.record.status);
  }

  validateResolution(primary.record);

  const currentEvidence = buildCommitmentEvidence(records, []);
  const evidence = buildCommitmentEvidence(records, prior?.evidence ?? []);
  const evidenceIds = new Set(evidence.map((item) => item.evidence_id));

  if (!evidenceIds.has(primary.record.identity_basis.creation_evidence_ref)) {
    throw new BuilderValidationError(
      `Commitment ${primary.record.commitment_id} identity basis must reference creation evidence.`,
    );
  }

  for (const evidenceRef of primary.record.resolution?.evidence_refs ?? []) {
    if (!evidenceIds.has(evidenceRef)) {
      throw new BuilderValidationError(
        `Commitment ${primary.record.commitment_id} resolution references unknown evidence ${evidenceRef}.`,
      );
    }
  }

  const timeline = buildTimeline(prior, primary.record, currentPeriod, currentEvidence);

  return {
    commitment_id: primary.record.commitment_id,
    commitment_type: primary.record.commitment_type,
    statement: primary.record.statement,
    commitment_period: primary.record.commitment_period,
    expected_resolution_period: primary.record.expected_resolution_period,
    actual_resolution_period: primary.record.actual_resolution_period,
    status: primary.record.status,
    timing: {
      overdue: isOverdue(primary.record, currentPeriod),
    },
    identity_basis: primary.record.identity_basis,
    resolution: primary.record.resolution,
    evidence,
    timeline,
    confidence: average(evidence.map((item) => item.confidence)),
  };
}

function assertStableIdentity(prior: Commitment, current: CommitmentSourceRecord): void {
  const left = prior.identity_basis;
  const right = current.identity_basis;
  const sameIdentity = left.company_id === right.company_id
    && left.commitment_type === right.commitment_type
    && left.canonical_statement === right.canonical_statement
    && left.initial_commitment_period === right.initial_commitment_period
    && left.expected_resolution_period === right.expected_resolution_period
    && left.creation_evidence_ref === right.creation_evidence_ref
    && left.identity_rule_version === right.identity_rule_version;

  if (!sameIdentity) {
    throw new BuilderValidationError(
      `Commitment ${current.commitment_id} changed its stable identity basis.`,
    );
  }
}

function assertLifecycleTransition(
  priorStatus: Commitment["status"],
  currentStatus: Commitment["status"],
): void {
  if (!ALLOWED_LIFECYCLE_TRANSITIONS[priorStatus].includes(currentStatus)) {
    throw new BuilderValidationError(
      `Commitment lifecycle transition ${priorStatus} -> ${currentStatus} is not allowed.`,
    );
  }
}

function validateResolution(record: CommitmentSourceRecord): void {
  const allowedResults = RESOLUTION_RESULTS_BY_STATUS[record.status];

  if (record.status === "new" || record.status === "active") {
    if (record.resolution !== null) {
      throw new BuilderValidationError(
        `Commitment ${record.commitment_id} must not have resolution while ${record.status}.`,
      );
    }
    return;
  }

  if (record.status === "delayed" && record.resolution === null) {
    return;
  }

  if (record.resolution === null || !allowedResults.includes(record.resolution.result)) {
    throw new BuilderValidationError(
      `Commitment ${record.commitment_id} resolution is incompatible with status ${record.status}.`,
    );
  }
}

function buildTimeline(
  prior: Commitment | null,
  record: CommitmentSourceRecord,
  currentPeriod: string,
  evidence: CommitmentEvidence[],
): CommitmentTimelineEvent[] {
  const timeline = prior?.timeline.map((event) => ({ ...event })) ?? [];
  const existing = timeline.find((event) => event.period === currentPeriod);

  if (existing !== undefined) {
    if (existing.status !== record.status) {
      throw new BuilderValidationError(
        `Commitment ${record.commitment_id} already has a different status for ${currentPeriod}.`,
      );
    }
    return timeline;
  }

  const evidenceRef = evidenceForStatus(record, evidence);
  timeline.push({
    period: currentPeriod,
    status: record.status,
    evidence_ref: evidenceRef.evidence_id,
    confidence: evidenceRef.confidence,
  });

  return timeline.sort((left, right) => left.period.localeCompare(right.period));
}

function evidenceForStatus(
  record: CommitmentSourceRecord,
  evidence: CommitmentEvidence[],
): CommitmentEvidence {
  const preferredRole = record.status === "new"
    ? "creation"
    : record.status === "modified"
      ? "modification"
      : isTerminalStatus(record.status)
        ? "resolution"
        : "confirmation";
  const selected = evidence.find((item) => item.evidence_role === preferredRole) ?? evidence[0];

  if (selected === undefined) {
    throw new BuilderValidationError(
      `Commitment ${record.commitment_id} requires evidence for lifecycle state ${record.status}.`,
    );
  }

  return selected;
}

function isOverdue(record: CommitmentSourceRecord, currentPeriod = record.commitment_period): boolean {
  return record.expected_resolution_period !== null
    && isPeriodAfter(currentPeriod, record.expected_resolution_period)
    && record.actual_resolution_period === null
    && !isTerminalStatus(record.status);
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function isTerminalStatus(status: CommitmentStatus): boolean {
  return (TERMINAL_COMMITMENT_STATUSES as readonly CommitmentStatus[]).includes(status);
}

function carryForwardCommitment(
  commitment: Commitment,
  currentPeriod: string,
): Commitment {
  return {
    ...commitment,
    timing: {
      overdue: commitment.expected_resolution_period !== null
        && isPeriodAfter(currentPeriod, commitment.expected_resolution_period)
        && commitment.actual_resolution_period === null
        && !isTerminalStatus(commitment.status),
    },
    identity_basis: { ...commitment.identity_basis },
    resolution: commitment.resolution === null
      ? null
      : {
          ...commitment.resolution,
          evidence_refs: [...commitment.resolution.evidence_refs],
        },
    evidence: commitment.evidence.map((evidence) => ({ ...evidence })),
    timeline: commitment.timeline.map((event) => ({ ...event })),
  };
}
