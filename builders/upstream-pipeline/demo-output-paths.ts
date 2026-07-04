import { resolve } from "node:path";

export const DEMO_OUTPUT_ROOT = "output/demo";
export const DEMO_ARTIFACTS_DIRECTORY = `${DEMO_OUTPUT_ROOT}/artifacts`;
export const DEMO_EXECUTION_DIRECTORY = `${DEMO_OUTPUT_ROOT}/execution`;
export const DEMO_REPLAY_ORIGINAL_DIRECTORY = `${DEMO_OUTPUT_ROOT}/replay/original`;
export const DEMO_REPLAY_REPLAY_DIRECTORY = `${DEMO_OUTPUT_ROOT}/replay/replay`;
export const DEMO_REPLAY_COMPARISON_DIRECTORY =
  `${DEMO_OUTPUT_ROOT}/replay/comparison`;
export const DEMO_ACCEPTANCE_REPORTS_DIRECTORY =
  `${DEMO_OUTPUT_ROOT}/acceptance/reports`;
export const DEMO_ACCEPTANCE_MANIFESTS_DIRECTORY =
  `${DEMO_OUTPUT_ROOT}/acceptance/manifests`;

export function demoArtifactsDirectory(outputRoot = DEMO_OUTPUT_ROOT): string {
  return resolve(outputRoot, "artifacts");
}

export function demoExecutionDirectory(outputRoot = DEMO_OUTPUT_ROOT): string {
  return resolve(outputRoot, "execution");
}
