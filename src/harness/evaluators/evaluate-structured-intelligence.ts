import { validateStructuredIntelligenceOutput } from "../../structured-intelligence/structured-intelligence.validation.js";
import type { StructuredIntelligencePromptInput } from "../../structured-intelligence/types/build-structured-intelligence.prompt.types.js";
import type { StructuredIntelligence } from "../../structured-intelligence/types/structured-intelligence.types.js";
import { countDuplicateValues, createScorecard, flattenText, normalize, scoreCoverage } from "../scorecard.js";
import type { HarnessScorecard } from "../harness.types.js";

const evaluatedFields = [
  "business_description",
  "products",
  "customers",
  "revenue_drivers",
  "competitive_positioning",
  "operating_model",
  "key_dependencies",
  "strategic_priorities",
  "risks",
  "opportunities",
] as const;

export function evaluateStructuredIntelligence(params: {
  artifact: StructuredIntelligence;
  promptInput: StructuredIntelligencePromptInput;
}): HarnessScorecard {
  const schemaFailures = schemaComplianceFailures(params.artifact);
  const populatedFields = evaluatedFields.filter((field) => isPopulated(params.artifact[field]));
  const allOutputValues = outputValues(params.artifact);
  const duplicateCount = countDuplicateValues(allOutputValues);
  const unsupportedValues = unsupportedOutputValues(params.artifact, params.promptInput);
  const groundedCount = allOutputValues.length - unsupportedValues.length;
  const semanticWarnings = structuredQualityWarnings(params.artifact, params.promptInput);
  const warnings = [
    ...unsupportedValues.slice(0, 10).map((value) => `Potential unsupported output: ${value}`),
    ...(duplicateCount > 0 ? [`Duplicate normalized output values: ${duplicateCount}`] : []),
    ...semanticWarnings,
  ];

  return createScorecard({
    artifact: "structured_intelligence",
    dimensions: [
      {
        name: "schema_compliance",
        score: schemaFailures.length === 0 ? 1 : 0,
        notes: schemaFailures.length === 0 ? ["Required fields and types are valid."] : schemaFailures,
      },
      {
        name: "field_coverage",
        score: scoreCoverage(populatedFields.length, evaluatedFields.length),
        notes: [`${populatedFields.length}/${evaluatedFields.length} fields populated.`],
      },
      {
        name: "empty_fields",
        score: scoreCoverage(populatedFields.length, evaluatedFields.length),
        notes: evaluatedFields
          .filter((field) => !isPopulated(params.artifact[field]))
          .map((field) => `Empty field: ${field}`),
      },
      {
        name: "duplicate_count",
        score: duplicateCount === 0 ? 1 : Math.max(0, 1 - (duplicateCount / Math.max(allOutputValues.length, 1))),
        notes: [`Duplicate normalized values: ${duplicateCount}`],
      },
      {
        name: "hallucination_risk",
        score: allOutputValues.length === 0 ? 1 : 1 - (unsupportedValues.length / allOutputValues.length),
        notes: [`Potentially unsupported values: ${unsupportedValues.length}`],
      },
      {
        name: "evidence_grounding",
        score: allOutputValues.length === 0 ? 0 : groundedCount / allOutputValues.length,
        notes: [`Grounded output values: ${groundedCount}/${allOutputValues.length}`],
      },
      themeUtilizationDimension(params.artifact, params.promptInput),
      evidenceUtilizationDimension(params.artifact, params.promptInput),
      businessDescriptionSpecificityDimension(params.artifact),
      productCoverageDimension(params.artifact, params.promptInput),
      customerQualityDimension(params.artifact),
      operatingModelPurityDimension(params.artifact),
    ],
    warnings,
    failures: schemaFailures,
  });
}

function schemaComplianceFailures(artifact: StructuredIntelligence): string[] {
  try {
    validateStructuredIntelligenceOutput(artifact);
    return [];
  } catch (error) {
    return [error instanceof Error ? error.message : String(error)];
  }
}

function outputValues(artifact: StructuredIntelligence): string[] {
  return evaluatedFields.flatMap((field) => {
    const value = artifact[field];

    return Array.isArray(value) ? value : [value];
  }).filter((value) => value.trim().length > 0);
}

function unsupportedOutputValues(
  artifact: StructuredIntelligence,
  promptInput: StructuredIntelligencePromptInput,
): string[] {
  const evidenceText = normalize(flattenText(promptInput).join(" "));

  return outputValues(artifact).filter((value) => {
    const normalized = normalize(value);

    if (!normalized) {
      return false;
    }

    return !hasTokenSupport(normalized, evidenceText);
  });
}

function themeUtilizationDimension(
  artifact: StructuredIntelligence,
  promptInput: StructuredIntelligencePromptInput,
) {
  const outputText = normalize(outputValues(artifact).join(" "));
  const utilizedThemes = promptInput.themes.filter((theme) =>
    hasTokenSupport(normalize(`${theme.theme} ${theme.category} ${theme.summary}`), outputText),
  ).length;

  return {
    name: "theme_utilization",
    score: scoreCoverage(utilizedThemes, promptInput.themes.length),
    notes: [`Themes reflected in output: ${utilizedThemes}/${promptInput.themes.length}.`],
  };
}

function evidenceUtilizationDimension(
  artifact: StructuredIntelligence,
  promptInput: StructuredIntelligencePromptInput,
) {
  const outputText = normalize(outputValues(artifact).join(" "));
  const evidenceGroups = [
    {
      name: "topics",
      populated: promptInput.topics.length > 0,
      utilized: promptInput.topics.some((topic) =>
        hasTokenSupport(normalize(`${topic.topic_id ?? ""} ${topic.theme} ${topic.category} ${topic.summary}`), outputText),
      ),
    },
    {
      name: "quarter_changes",
      populated: promptInput.quarter_changes.changes.length > 0 || promptInput.quarter_changes.topic_changes.length > 0,
      utilized: hasTokenSupport(
        normalize(flattenText(promptInput.quarter_changes).join(" ")),
        outputText,
      ),
    },
    {
      name: "topic_evolution",
      populated: promptInput.topic_evolution.topics.length > 0,
      utilized: hasTokenSupport(
        normalize(flattenText(promptInput.topic_evolution).join(" ")),
        outputText,
      ),
    },
  ];
  const available = evidenceGroups.filter((group) => group.populated);
  const utilized = available.filter((group) => group.utilized);

  return {
    name: "evidence_utilization",
    score: scoreCoverage(utilized.length, available.length),
    notes: available.length === 0
      ? ["No evidence groups available."]
      : [`Evidence groups reflected in output: ${utilized.map((group) => group.name).join(", ") || "none"}.`],
  };
}

function businessDescriptionSpecificityDimension(artifact: StructuredIntelligence) {
  const description = normalize(artifact.business_description);
  const hasGenericLanguage = genericDescriptionPatterns.some((pattern) => pattern.test(description));
  const hasBusinessIdentity = businessIdentityPatterns.some((pattern) => pattern.test(description));
  const score = description.includes("latest filing")
    ? 0
    : hasGenericLanguage && !hasBusinessIdentity
      ? 0
      : hasGenericLanguage || !hasBusinessIdentity
        ? 0.5
        : 1;

  return {
    name: "business_description_specificity",
    score,
    notes: [
      hasGenericLanguage ? "Generic description language detected." : "No generic description language detected.",
      hasBusinessIdentity ? "Business identity concepts detected." : "No business identity concepts detected.",
    ],
  };
}

function productCoverageDimension(
  artifact: StructuredIntelligence,
  promptInput: StructuredIntelligencePromptInput,
) {
  const missingDespiteEvidence = promptInput.themes.length >= 5
    && artifact.customers.length > 0
    && artifact.revenue_drivers.length > 0
    && artifact.products.length === 0;

  return {
    name: "product_coverage",
    score: missingDespiteEvidence ? 0 : 1,
    notes: missingDespiteEvidence
      ? ["Products missing despite sufficient business evidence."]
      : ["Product coverage is acceptable for available evidence."],
  };
}

function customerQualityDimension(artifact: StructuredIntelligence) {
  const geographicEntries = artifact.customers.filter((customer) =>
    geographicCustomerPatterns.some((pattern) => pattern.test(normalize(customer))),
  ).length;
  const geographicRatio = artifact.customers.length === 0 ? 0 : geographicEntries / artifact.customers.length;

  return {
    name: "customer_quality",
    score: geographicRatio > 0.5 ? 0.25 : 1,
    notes: [
      `Geographic customer entries: ${geographicEntries}/${artifact.customers.length}.`,
      geographicRatio > 0.5
        ? "Customer list appears geographic rather than customer-segment based."
        : "Customer entries appear segment-oriented.",
    ],
  };
}

function operatingModelPurityDimension(artifact: StructuredIntelligence) {
  const riskEntries = artifact.operating_model.filter((entry) =>
    operatingRiskPatterns.some((pattern) => pattern.test(normalize(entry))),
  ).length;
  const riskRatio = artifact.operating_model.length === 0 ? 0 : riskEntries / artifact.operating_model.length;

  return {
    name: "operating_model_purity",
    score: riskRatio > 0.3 ? 0.5 : 1,
    notes: [
      `Risk-language operating model entries: ${riskEntries}/${artifact.operating_model.length}.`,
      riskRatio > 0.3
        ? "Operating model contains risk statements."
        : "Operating model entries are operationally oriented.",
    ],
  };
}

function structuredQualityWarnings(
  artifact: StructuredIntelligence,
  promptInput: StructuredIntelligencePromptInput,
): string[] {
  return [
    productCoverageDimension(artifact, promptInput),
    customerQualityDimension(artifact),
    operatingModelPurityDimension(artifact),
  ].flatMap((dimension) => dimension.score < 1 ? dimension.notes.filter((note) => warningMessages.has(note)) : []);
}

const genericDescriptionPatterns = [
  /\bgeographic segments?\b/,
  /\bworldwide customers?\b/,
  /\blatest filing\b/,
  /\bcompany provides products?\b/,
  /\bcustomers worldwide\b/,
];

const businessIdentityPatterns = [
  /\bsoftware\b/,
  /\bcloud\b/,
  /\bplatforms?\b/,
  /\bdevices?\b/,
  /\bservices?\b/,
  /\bmarketplaces?\b/,
  /\binfrastructure\b/,
  /\badvertising\b/,
  /\bpayments?\b/,
  /\benterprise\b/,
  /\bconsumer\b/,
];

const geographicCustomerPatterns = [
  /\bchina\b/,
  /\beurope\b/,
  /\basia\b/,
  /\bamericas\b/,
  /\bregions?\b/,
  /\bgeographic\b/,
];

const operatingRiskPatterns = [
  /\brisk\b/,
  /\bexposure\b/,
  /\bincident\b/,
  /\bbreach\b/,
  /\btariff\b/,
  /\blitigation\b/,
  /\binvestigation\b/,
];

const warningMessages = new Set([
  "Products missing despite sufficient business evidence.",
  "Customer list appears geographic rather than customer-segment based.",
  "Operating model contains risk statements.",
]);

function hasTokenSupport(value: string, evidenceText: string): boolean {
  const tokens = value.split(" ").filter((token) => token.length > 3);

  if (tokens.length === 0) {
    return true;
  }

  const supported = tokens.filter((token) => evidenceText.includes(token)).length;

  return supported / tokens.length >= 0.5;
}

function isPopulated(value: string | string[]): boolean {
  return Array.isArray(value) ? value.length > 0 : value.trim().length > 0;
}
