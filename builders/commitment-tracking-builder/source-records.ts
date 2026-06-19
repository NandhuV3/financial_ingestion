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

  if (JSON.stringify(left.identity_basis) !== JSON.stringify(right.identity_basis)) {
    throw new BuilderValidationError(
      `Commitment ${left.commitment_id} has conflicting identity basis across sources.`,
    );
  }

  if (JSON.stringify(left.resolution) !== JSON.stringify(right.resolution)) {
    throw new BuilderValidationError(
      `Commitment ${left.commitment_id} has conflicting resolution across sources.`,
    );
  }
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
