import { BuilderValidationError } from "../../packages/builder-framework/src/builder-errors.js";
import type {
  CommitmentEvidence,
  CommitmentSourceRecord,
  ResolvedCommitmentSource,
} from "./types.js";

export type SourcedCommitmentRecord = {
  record: CommitmentSourceRecord;
  source: ResolvedCommitmentSource;
};

export function groupCommitmentRecords(
  sources: ResolvedCommitmentSource[],
): Map<string, SourcedCommitmentRecord[]> {
  const recordsById = new Map<string, SourcedCommitmentRecord[]>();

  for (const source of sources) {
    for (const record of source.artifact.content.commitment_records) {
      const records = recordsById.get(record.commitment_id) ?? [];
      records.push({ record, source });
      recordsById.set(record.commitment_id, records);
    }
  }

  return recordsById;
}

export function assertSourceRecordAgreement(
  left: CommitmentSourceRecord,
  right: CommitmentSourceRecord,
): void {
  const fields: Array<keyof CommitmentSourceRecord> = [
    "commitment_type",
    "statement",
    "commitment_period",
    "expected_resolution_period",
    "actual_resolution_period",
    "status",
    "expected_resolution_passed",
  ];

  for (const field of fields) {
    if (left[field] !== right[field]) {
      throw new BuilderValidationError(
        `Commitment ${left.commitment_id} has conflicting ${field} across sources.`,
      );
    }
  }

  if (!sameIdentityBasis(left.identity_basis, right.identity_basis)) {
    throw new BuilderValidationError(
      `Commitment ${left.commitment_id} has conflicting identity basis across sources.`,
    );
  }

  if (!sameResolution(left.resolution, right.resolution)) {
    throw new BuilderValidationError(
      `Commitment ${left.commitment_id} has conflicting resolution across sources.`,
    );
  }
}

function sameIdentityBasis(
  left: CommitmentSourceRecord["identity_basis"],
  right: CommitmentSourceRecord["identity_basis"],
): boolean {
  return left.company_id === right.company_id
    && left.commitment_type === right.commitment_type
    && left.canonical_statement === right.canonical_statement
    && left.initial_commitment_period === right.initial_commitment_period
    && left.expected_resolution_period === right.expected_resolution_period
    && left.creation_evidence_ref === right.creation_evidence_ref
    && left.identity_rule_version === right.identity_rule_version;
}

function sameResolution(
  left: CommitmentSourceRecord["resolution"],
  right: CommitmentSourceRecord["resolution"],
): boolean {
  if (left === null || right === null) {
    return left === right;
  }

  return left.result === right.result
    && left.assessed_period === right.assessed_period
    && left.rule_version === right.rule_version
    && sameStringSet(left.evidence_refs, right.evidence_refs);
}

function sameStringSet(left: string[], right: string[]): boolean {
  return left.length === right.length
    && [...left].sort().every((value, index) => value === [...right].sort()[index]);
}

export function buildCommitmentEvidence(
  records: SourcedCommitmentRecord[],
  priorEvidence: CommitmentEvidence[],
): CommitmentEvidence[] {
  const evidenceByIdentity = new Map<string, CommitmentEvidence>();
  const currentEvidence = records.flatMap(({ record, source }) =>
    record.evidence.map((item): CommitmentEvidence => ({
      ...item,
      source_artifact_ref: source.artifact.identity.artifact_id,
      source_artifact_version: source.artifact.identity.version,
      filing_period: source.declaration.period_id,
      source_type: source.declaration.source_type,
    })));

  for (const evidence of [...priorEvidence, ...currentEvidence]) {
    evidenceByIdentity.set(
      `${evidence.evidence_id}:${evidence.source_artifact_ref}:${evidence.source_record_ref}`,
      { ...evidence },
    );
  }

  return [...evidenceByIdentity.values()].sort(
    (left, right) => left.evidence_id.localeCompare(right.evidence_id)
      || left.source_artifact_ref.localeCompare(right.source_artifact_ref),
  );
}
