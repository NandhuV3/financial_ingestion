import { mkdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { Artifact } from "../../contracts/artifacts/artifact.js";
import type {
  UpstreamPipelineArtifactObserver,
  UpstreamPipelineStage,
} from "./run-upstream-pipeline.js";

const ARTIFACT_DUMP_FILENAMES: Record<UpstreamPipelineStage, string> = {
  filing: "00-filing.json",
  evidence_identity: "01-evidence-identity.json",
  themes: "02-themes.json",
  topic_assignment: "03-topic-assignment.json",
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

export async function resetArtifactDumps(
  outputDirectory = "output/demo",
): Promise<void> {
  const absoluteOutputDirectory = resolve(outputDirectory);

  await Promise.all(
    Object.values(ARTIFACT_DUMP_FILENAMES).map((filename) =>
      rm(resolve(absoluteOutputDirectory, filename), { force: true })),
  );
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
