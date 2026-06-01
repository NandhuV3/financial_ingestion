import type { HealthCheck, HealthStatus } from "../../types/report.types.js";

export function summarizeHealth(healthChecks: HealthCheck[]): HealthStatus {
  if (healthChecks.some((check) => check.status === "failed")) {
    return "failed";
  }

  if (healthChecks.some((check) => check.status === "stale")) {
    return "stale";
  }

  if (healthChecks.some((check) => check.status === "warning")) {
    return "warning";
  }

  return "healthy";
}
