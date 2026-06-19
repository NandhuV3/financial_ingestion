import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { Artifact } from "../../contracts/artifacts/artifact.js";
import type {
  UpstreamPipelineArtifactObserver,
  UpstreamPipelineStage,
} from "./run-upstream-pipeline.js";

const ARTIFACT_DUMP_FILENAMES: Record<UpstreamPipelineStage, string> = {
  themes: "01-themes.json",
  structured_intelligence: "02-structured-intelligence.json",
  company_knowledge_candidate: "03-company-knowledge-candidate.json",
  governance_decision: "04-governance-decision.json",
  company_knowledge: "05-company-knowledge.json",
  business_signals: "06-business-signals.json",
};

export function createArtifactDumpObserver(
  outputDirectory = "output/demo",
): {
  outputDirectory: string;
  observer: UpstreamPipelineArtifactObserver;
} {
  const absoluteOutputDirectory = resolve(outputDirectory);

  return {
    outputDirectory: absoluteOutputDirectory,
    observer: async (stage, artifact) => {
      await writeArtifactDump(absoluteOutputDirectory, stage, artifact);
    },
  };
}

export async function writeArtifactDump(
  outputDirectory: string,
  stage: UpstreamPipelineStage,
  artifact: Artifact<unknown>,
): Promise<string> {
  await mkdir(outputDirectory, { recursive: true });
  const outputPath = resolve(
    outputDirectory,
    ARTIFACT_DUMP_FILENAMES[stage],
  );
  await writeFile(outputPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");

  return outputPath;
}
