import type { CompanyKnowledge } from "../../company-knowledge/types/company-knowledge.types.js";
import type { StructuredIntelligence } from "../../structured-intelligence/types/structured-intelligence.types.js";
import { createScorecard, normalize, scoreCoverage } from "../scorecard.js";
import type { HarnessScorecard } from "../harness.types.js";

export function evaluateCompanyKnowledge(params: {
  knowledge: CompanyKnowledge;
  structuredIntelligence: StructuredIntelligence;
}): HarnessScorecard {
  const knowledge = params.knowledge;
  const source = params.structuredIntelligence;

  return createScorecard({
    artifact: "company_knowledge",
    dimensions: [
      {
        name: "business_description_quality",
        score: scoreDescription(knowledge.business_description),
        notes: [`Description length: ${knowledge.business_description.length}`],
      },
      coverageDimension("customer_coverage", knowledge.customers, source.customers),
      coverageDimension("revenue_coverage", knowledge.revenue_drivers, source.revenue_drivers),
      coverageDimension(
        "dependency_coverage",
        knowledge.key_dependencies.map((dependency) => dependency.description),
        source.key_dependencies,
      ),
      coverageDimension("risk_coverage", knowledge.risks, source.risks),
      coverageDimension("opportunity_coverage", knowledge.opportunities, source.opportunities),
      informationPreservationDimension(knowledge, source),
    ],
    warnings: consistencyWarnings(knowledge, source),
    failures: requiredFailures(knowledge),
  });
}

function informationPreservationDimension(
  knowledge: CompanyKnowledge,
  source: StructuredIntelligence,
) {
  const preservationChecks = [
    { name: "business_description", preserved: normalize(knowledge.business_description) === normalize(source.business_description) },
    { name: "products", ...coverageStats(knowledge.products, source.products) },
    { name: "customers", ...coverageStats(knowledge.customers, source.customers) },
    { name: "revenue_drivers", ...coverageStats(knowledge.revenue_drivers, source.revenue_drivers) },
    {
      name: "competitive_positioning",
      ...coverageStats(knowledge.competitive_positioning.map((item) => item.signal), source.competitive_positioning),
    },
    { name: "operating_model", ...coverageStats(knowledge.operating_model, source.operating_model) },
    { name: "key_dependencies", ...coverageStats(knowledge.key_dependencies.map((item) => item.description), source.key_dependencies) },
    { name: "strategic_priorities", ...coverageStats(knowledge.strategic_priorities, source.strategic_priorities) },
    { name: "risks", ...coverageStats(knowledge.risks, source.risks) },
    { name: "opportunities", ...coverageStats(knowledge.opportunities, source.opportunities) },
  ].map((check) => "preserved" in check
    ? { name: check.name, score: check.preserved ? 1 : 0 }
    : { name: check.name, score: check.score });
  const score = preservationChecks.length === 0
    ? 1
    : preservationChecks.reduce((sum, check) => sum + check.score, 0) / preservationChecks.length;
  const missing = preservationChecks
    .filter((check) => check.score < 1)
    .map((check) => check.name);

  return {
    name: "information_preservation",
    score,
    notes: missing.length === 0
      ? ["Structured Intelligence fields are preserved in Company Knowledge."]
      : [`Fields with partial preservation: ${missing.join(", ")}.`],
  };
}

function coverageDimension(name: string, target: string[], source: string[]) {
  const stats = coverageStats(target, source);

  return {
    name,
    score: stats.score,
    notes: stats.total === 0
      ? ["No source values available."]
      : [`${stats.matched}/${stats.total} source values preserved.`],
  };
}

function coverageStats(target: string[], source: string[]) {
  const sourceValues = source.map(normalize).filter(Boolean);
  const targetValues = new Set(target.map(normalize).filter(Boolean));
  const matched = sourceValues.filter((value) => targetValues.has(value)).length;

  return {
    score: scoreCoverage(matched, sourceValues.length),
    matched,
    total: sourceValues.length,
  };
}

function scoreDescription(value: string): number {
  const normalized = normalize(value);

  if (!normalized) {
    return 0;
  }

  if (normalized.includes("available filing intelligence") || normalized.includes("not yet")) {
    return 0.2;
  }

  return value.length >= 60 && value.length <= 280 ? 1 : 0.7;
}

function consistencyWarnings(
  knowledge: CompanyKnowledge,
  source: StructuredIntelligence,
): string[] {
  const warnings: string[] = [];

  if (knowledge.company !== source.company) {
    warnings.push(`Company mismatch: ${knowledge.company} vs ${source.company}`);
  }

  if (knowledge.metadata.input_hash === source.metadata.input_hash) {
    warnings.push("Company Knowledge input hash matches Structured Intelligence hash exactly; expected a derived artifact hash.");
  }

  return warnings;
}

function requiredFailures(knowledge: CompanyKnowledge): string[] {
  const failures: string[] = [];

  if (!knowledge.company.trim()) failures.push("Company Knowledge company is empty.");
  if (!knowledge.business_description.trim()) failures.push("Company Knowledge business_description is empty.");
  if (!knowledge.metadata.input_hash.trim()) failures.push("Company Knowledge input_hash is empty.");
  if (knowledge.lineage.derived_from.length === 0) failures.push("Company Knowledge lineage.derived_from is empty.");

  return failures;
}
