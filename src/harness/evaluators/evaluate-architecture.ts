import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { createScorecard } from "../scorecard.js";
import type { HarnessScorecard } from "../harness.types.js";

type LayerContract = {
  name: string;
  expected: "LLM" | "deterministic";
  paths: string[];
};

const contracts: LayerContract[] = [
  {
    name: "Themes",
    expected: "LLM",
    paths: ["builders/themes"],
  },
  {
    name: "Topic Assignment",
    expected: "deterministic",
    paths: ["builders/topic-assignment-builder"],
  },
  {
    name: "Topic Evolution",
    expected: "deterministic",
    paths: ["builders/topic-evolution-builder"],
  },
  {
    name: "Structured Intelligence",
    expected: "LLM",
    paths: ["builders/structured-intelligence"],
  },
  {
    name: "Company Knowledge",
    expected: "deterministic",
    paths: ["builders/company-knowledge-builder"],
  },
  {
    name: "Partner Domain",
    expected: "deterministic",
    paths: ["src/partner-domain"],
  },
];

export function evaluateArchitectureContracts(): HarnessScorecard {
  const layerDimensions = contracts.map((contract) => {
    const violations = contract.expected === "deterministic"
      ? deterministicViolations(contract.paths)
      : llmLayerNotes(contract.paths);

    return {
      name: contract.name,
      score: violations.length === 0 ? 1 : 0,
      notes: [
        `Expected: ${contract.expected}.`,
        ...violations,
      ],
    };
  });
  const deterministicPaths = contracts
    .filter((contract) => contract.expected === "deterministic")
    .flatMap((contract) => contract.paths);
  const forbiddenImportViolations = forbiddenImports(deterministicPaths);
  const forbiddenFetchViolations = forbiddenFetchCalls(deterministicPaths);
  const dimensions = [
    ...layerDimensions,
    {
      name: "forbidden_imports",
      score: forbiddenImportViolations.length === 0 ? 1 : 0,
      notes: forbiddenImportViolations.length === 0
        ? ["No forbidden deterministic-layer imports found."]
        : forbiddenImportViolations,
    },
    {
      name: "forbidden_fetch_calls",
      score: forbiddenFetchViolations.length === 0 ? 1 : 0,
      notes: forbiddenFetchViolations.length === 0
        ? ["No forbidden deterministic-layer fetch calls found."]
        : forbiddenFetchViolations,
    },
  ];
  const failures = dimensions.flatMap((dimension) =>
    dimension.score === 0 ? dimension.notes.slice(1).map((note) => `${dimension.name}: ${note}`) : [],
  );

  return createScorecard({
    artifact: "architecture_contracts",
    dimensions,
    failures,
  });
}

function deterministicViolations(paths: string[]): string[] {
  const source = paths.map(readPathText).join("\n");
  const violations: string[] = [];

  if (/\bOPENAI_API_KEY\b|\bOpenAI\b|api\.openai\.com/i.test(source)) {
    violations.push("Deterministic layer references OpenAI.");
  }

  if (/fetch\s*\(/.test(source)) {
    violations.push("Deterministic layer performs fetch calls.");
  }

  if (/generateStructuredIntelligence\s*\(/.test(source)) {
    violations.push("Deterministic layer calls Structured Intelligence generation.");
  }

  return violations;
}

function forbiddenImports(paths: string[]): string[] {
  return scanFiles(paths).flatMap(({ path, source }) => {
    const violations: string[] = [];
    const importMatches = source.matchAll(/import[\s\S]*?from\s+["']([^"']+)["']/g);

    for (const match of importMatches) {
      const specifier = match[1] ?? "";

      if (/(^openai$|anthropic|health-dashboard|build-structured-intelligence\.prompt|generate-structured-intelligence)/i.test(specifier)) {
        violations.push(`${path}: forbidden import ${specifier}`);
      }
    }

    if (/import\s+.*\bOpenAI\b/.test(source)) {
      violations.push(`${path}: forbidden OpenAI import`);
    }

    return violations;
  });
}

function forbiddenFetchCalls(paths: string[]): string[] {
  return scanFiles(paths).flatMap(({ path, source }) =>
    /fetch\s*\(/.test(source) ? [`${path}: forbidden fetch call`] : [],
  );
}

function llmLayerNotes(_paths: string[]): string[] {
  return [];
}

function readPathText(path: string): string {
  return scanFiles([path]).map((file) => file.source).join("\n");
}

function scanFiles(paths: string[]): Array<{ path: string; source: string }> {
  return paths.flatMap(scanPath);
}

function scanPath(path: string): Array<{ path: string; source: string }> {
  const fullPath = join(process.cwd(), path);

  try {
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      return readdirSync(fullPath)
        .flatMap((entry) => scanPath(join(path, entry)));
    }

    if (!path.endsWith(".ts")) {
      return [];
    }

    return [{ path, source: readFileSync(fullPath).toString("utf8") }];
  } catch {
    return [];
  }
}
