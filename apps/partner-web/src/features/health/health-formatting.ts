export function formatHealthStatus(status: string): string {
  if (status === "needs_attention") return "Needs Attention";
  return status.charAt(0).toUpperCase() + status.slice(1);
}
