import type { Commitment, CommitmentSummary } from "./types.js";

export function buildCommitmentSummary(commitments: Commitment[]): CommitmentSummary {
  const resolved = commitments.filter((commitment) => commitment.resolution !== null);
  const fulfilled = resolved.filter(
    (commitment) => commitment.resolution?.result === "fulfilled",
  ).length;

  return {
    total_commitments: commitments.length,
    active_commitments: count(commitments, "active"),
    achieved_commitments: count(commitments, "achieved"),
    delayed_commitments: count(commitments, "delayed"),
    modified_commitments: count(commitments, "modified"),
    abandoned_commitments: count(commitments, "abandoned"),
    fulfillment_rate: resolved.length === 0 ? 0 : fulfilled / resolved.length,
  };
}

function count(commitments: Commitment[], status: Commitment["status"]): number {
  return commitments.filter((commitment) => commitment.status === status).length;
}
