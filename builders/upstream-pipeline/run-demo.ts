import {
  ConfigurationError,
  PipelineExecutionError,
  PlatformError,
  platformErrorMessage,
} from "../../packages/builder-framework/src/platform-error.js";
import {
  normalizePlatformError,
  renderPlatformError,
} from "../../packages/builder-framework/src/platform-error-renderer.js";
import { PromptResolver } from "../../src/prompt-registry/prompt-resolver.js";
import { loadEnv } from "../../src/shared/config/load.env.js";
import {
  createArtifactDumpObserver,
  resetArtifactDumps,
} from "./artifact-dump.js";
import { MemoryArtifactRepository } from "./memory-artifact-repository.js";
import {
  loadNormalizedFilingBuilderInput,
} from "./normalized-filing-adapter.js";
import { OpenAIResponsesLLMClient } from "./openai-llm-client.js";
import { registerUpstreamBuilders } from "./register-builders.js";
import { runUpstreamPipeline } from "./run-upstream-pipeline.js";

export type DemoArguments = {
  ticker: string;
  filingDate?: string;
  outputDirectory: string;
  debug: boolean;
};

export async function runDemo(rawArguments: string[]): Promise<void> {
  const args = parseArguments(rawArguments);
  const normalizedFiling = await loadNormalizedFilingBuilderInput({
    ticker: args.ticker,
    filingDate: args.filingDate,
  });
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new ConfigurationError(
      "OPENAI_API_KEY is required. Set it in .env or the process environment.",
      {
        suggestedAction:
          "Set OPENAI_API_KEY in .env or the process environment and rerun the demo.",
      },
    );
  }

  const repository = new MemoryArtifactRepository();
  const modelClient = new OpenAIResponsesLLMClient(apiKey);
  const runtime = registerUpstreamBuilders({
    repository,
    promptResolver: new PromptResolver(),
    llmClient: modelClient,
    semanticEmbeddingProvider: modelClient,
    themesModelVersion: process.env.OPENAI_MODEL,
    structuredIntelligenceModelVersion: process.env.OPENAI_MODEL,
  });
  const artifactDumps = createArtifactDumpObserver(args.outputDirectory);

  await resetArtifactDumps(args.outputDirectory);

  try {
    const result = await runUpstreamPipeline({
      runtime,
      normalizedFiling: normalizedFiling.builderInput,
      onArtifact: artifactDumps.observer,
    });

    console.log(
      `Sprint 001 upstream pipeline completed for ${result.content.company_id} ${result.content.period_id}.`,
    );
    console.log(`Artifacts saved to ${artifactDumps.outputDirectory}`);
  } catch (error) {
    if (error instanceof PlatformError) {
      throw error;
    }

    throw new PipelineExecutionError(platformErrorMessage(error), {
      cause: error,
      suggestedAction:
        "Run again with --debug and inspect the failing pipeline stage.",
    });
  }
}

export function parseArguments(args: string[]): DemoArguments {
  let ticker = "MSFT";
  let filingDate: string | undefined;
  let outputDirectory = "output/demo";
  let debug = false;

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    const value = args[index + 1];

    if (argument === "--ticker" && value) {
      ticker = value;
      index += 1;
      continue;
    }

    if (argument === "--filing-date" && value) {
      filingDate = value;
      index += 1;
      continue;
    }

    if (argument === "--output" && value) {
      outputDirectory = value;
      index += 1;
      continue;
    }

    if (argument === "--debug") {
      debug = true;
      continue;
    }

    throw new ConfigurationError(
      `Unknown or incomplete argument: ${argument ?? ""}`,
      {
        suggestedAction:
          "Use optional --ticker <ticker>, --filing-date <YYYY-MM-DD>, --output <directory>, and --debug.",
      },
    );
  }

  if (ticker.trim() === "") {
    throw new ConfigurationError(
      "Ticker must be a non-empty value.",
      {
        suggestedAction: "Provide a valid ticker with --ticker.",
      },
    );
  }

  return {
    ticker: ticker.trim().toUpperCase(),
    filingDate,
    outputDirectory,
    debug,
  };
}

export async function runDemoCli(rawArguments: string[]): Promise<number> {
  loadEnv();
  const debug = rawArguments.includes("--debug");

  try {
    await runDemo(rawArguments);
    return 0;
  } catch (error) {
    console.error(
      renderPlatformError(normalizePlatformError(error), { debug }),
    );
    return 1;
  }
}

if (require.main === module) {
  runDemoCli(process.argv.slice(2)).then((exitCode) => {
    process.exitCode = exitCode;
  });
}
