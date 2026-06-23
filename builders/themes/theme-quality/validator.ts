import type { EvidenceCatalogEntry } from "../../../contracts/artifacts/evidence-catalog-artifact-content.js";
import { BuilderValidationError } from "../../../packages/builder-framework/src/builder-errors.js";
import type { Theme } from "../contract.js";
import { evaluateThemeQuality } from "./evaluator.js";
import type { ThemeQualityMetrics } from "./types.js";

export function validateThemeQualityMetrics(input: {
  themes: Theme[];
  evidenceCatalog: EvidenceCatalogEntry[];
  metrics: ThemeQualityMetrics;
}): void {
  const expected = evaluateThemeQuality({
    themes: input.themes,
    evidenceCatalog: input.evidenceCatalog,
  });

  if (JSON.stringify(input.metrics) !== JSON.stringify(expected)) {
    throw new BuilderValidationError(
      "evaluation_hooks.theme_quality does not reconcile with Themes and the Evidence Catalog.",
    );
  }
}

