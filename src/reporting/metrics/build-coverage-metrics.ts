export function calculateEvidenceCoverage(totalChunks: number, referencedChunks: number): number {
  return totalChunks === 0 ? 0 : Number(((referencedChunks / totalChunks) * 100).toFixed(2));
}
