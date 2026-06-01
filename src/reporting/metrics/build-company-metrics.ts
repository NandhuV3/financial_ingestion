import type { ChunkMetrics, NormalizationMetrics } from "../../types/report.types.js";
import type { ChunkArtifact } from "../readers/read-chunks.js";
import type { NormalizationArtifact } from "../readers/read-normalization.js";

export function buildNormalizationMetrics(artifacts: NormalizationArtifact[]): NormalizationMetrics {
  return {
    sections: artifacts.map((artifact) => ({
      section: artifact.section,
      input_file: artifact.input_file,
      output_file: artifact.output_file,
      input_characters: artifact.input_text.length,
      normalized_characters: artifact.output_text.length,
      characters_removed: artifact.input_text.length - artifact.output_text.length,
      paragraph_count: splitParagraphs(artifact.output_text).length,
    })),
  };
}

export function buildChunkMetrics(artifacts: ChunkArtifact[]): ChunkMetrics {
  const sections = [];
  const chunkIds: string[] = [];

  for (const artifact of artifacts) {
    const sizes = artifact.chunks.map((chunk) => chunk.text?.length ?? 0);
    const totalCharacters = sum(sizes);

    chunkIds.push(...artifact.chunks.map((chunk) => chunk.chunk_id));
    sections.push({
      section: artifact.section,
      file: artifact.file,
      chunks: artifact.chunks.length,
      total_characters: totalCharacters,
      average_characters: artifact.chunks.length === 0 ? 0 : Math.round(totalCharacters / artifact.chunks.length),
      smallest_chunk: sizes.length === 0 ? 0 : Math.min(...sizes),
      largest_chunk: sizes.length === 0 ? 0 : Math.max(...sizes),
    });
  }

  return {
    sections,
    total_chunks: sum(sections.map((section) => section.chunks)),
    total_characters: sum(sections.map((section) => section.total_characters)),
    chunk_ids: chunkIds,
  };
}

function splitParagraphs(text: string): string[] {
  return text.split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean);
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}
