import { stableHash } from "../investor-intelligence-builder/hashes.js";
import type {
  GroundedUnderstanding,
  StructuredUnderstanding,
  StructuredValueReference,
} from "./contract.js";

type StructuredValue = {
  fieldPath: string;
  value: GroundedUnderstanding & Record<string, unknown>;
};

export function buildStructuredValueReferences(input: {
  companyId: string;
  periodId: string;
  filingId: string;
  understanding: StructuredUnderstanding;
}): StructuredValueReference[] {
  return structuredValues(input.understanding)
    .map(({ fieldPath, value }) => {
      const evidenceRefs = uniqueSorted(value.evidence_refs);
      const valueHash = stableHash(canonicalValueForHash(value));

      return {
        value_ref: `structured-value:${stableHash({
          company_id: input.companyId,
          period_id: input.periodId,
          filing_id: input.filingId,
          field_path: fieldPath,
          value_hash: valueHash,
        })}`,
        field_path: fieldPath,
        value_hash: valueHash,
        evidence_refs: evidenceRefs,
      };
    })
    .sort(compareReferences);
}

export function assertUniqueCollectionLabels(
  understanding: StructuredUnderstanding,
  fail: (field: string, normalizedLabel: string) => never,
): void {
  const collections: Array<{
    field: string;
    labels: string[];
  }> = [
    {
      field: "understanding.products",
      labels: understanding.products.map(({ product_name }) => product_name),
    },
    {
      field: "understanding.customers",
      labels: understanding.customers.map(
        ({ customer_segment }) => customer_segment,
      ),
    },
    {
      field: "understanding.revenue_drivers",
      labels: understanding.revenue_drivers.map(({ driver }) => driver),
    },
    {
      field: "understanding.competitive_positioning",
      labels: understanding.competitive_positioning.map(
        ({ position }) => position,
      ),
    },
    {
      field: "understanding.strategic_priorities",
      labels: understanding.strategic_priorities.map(
        ({ priority }) => priority,
      ),
    },
    {
      field: "understanding.management_focus",
      labels: understanding.management_focus.map(
        ({ focus_area }) => focus_area,
      ),
    },
    {
      field: "understanding.risks",
      labels: understanding.risks.map(({ risk }) => risk),
    },
    {
      field: "understanding.dependencies",
      labels: understanding.dependencies.map(({ dependency }) => dependency),
    },
  ];

  for (const collection of collections) {
    const seen = new Set<string>();

    for (const label of collection.labels) {
      const normalized = normalizeCollectionLabel(label);

      if (seen.has(normalized)) {
        fail(collection.field, normalized);
      }

      seen.add(normalized);
    }
  }
}

export function normalizeCollectionLabel(value: string): string {
  return value
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function structuredValues(
  understanding: StructuredUnderstanding,
): StructuredValue[] {
  const values: StructuredValue[] = [];

  if (understanding.business_model !== null) {
    values.push({
      fieldPath: "understanding.business_model",
      value: understanding.business_model,
    });
  }

  if (understanding.revenue_model !== null) {
    values.push({
      fieldPath: "understanding.revenue_model",
      value: understanding.revenue_model,
    });
  }

  addCollection(
    values,
    "products",
    "product_name",
    understanding.products,
  );
  addCollection(
    values,
    "customers",
    "customer_segment",
    understanding.customers,
  );
  addCollection(
    values,
    "revenue_drivers",
    "driver",
    understanding.revenue_drivers,
  );
  addCollection(
    values,
    "competitive_positioning",
    "position",
    understanding.competitive_positioning,
  );
  addCollection(
    values,
    "strategic_priorities",
    "priority",
    understanding.strategic_priorities,
  );
  addCollection(
    values,
    "management_focus",
    "focus_area",
    understanding.management_focus,
  );
  addCollection(values, "risks", "risk", understanding.risks);
  addCollection(
    values,
    "dependencies",
    "dependency",
    understanding.dependencies,
  );

  return values;
}

function addCollection<T extends GroundedUnderstanding & Record<string, unknown>>(
  output: StructuredValue[],
  collection: string,
  labelKey: keyof T,
  values: T[],
): void {
  for (const value of values) {
    const label = String(value[labelKey]);
    const normalized = encodeURIComponent(normalizeCollectionLabel(label));

    output.push({
      fieldPath: `understanding.${collection}[${String(labelKey)}=${normalized}]`,
      value,
    });
  }
}

function canonicalValueForHash(
  value: GroundedUnderstanding & Record<string, unknown>,
): unknown {
  const { confidence: _confidence, evidence_refs: _evidenceRefs, ...content } =
    value;

  return canonicalize(content);
}

function canonicalize(value: unknown): unknown {
  if (typeof value === "string") {
    return value.normalize("NFKC");
  }

  if (Array.isArray(value)) {
    const canonicalItems = value.map(canonicalize);
    const uniqueItems = new Map(
      canonicalItems.map((item) => [stableHash(item), item]),
    );

    return [...uniqueItems.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([, item]) => item);
  }

  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, entry]) => entry !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, canonicalize(entry)]),
    );
  }

  return value;
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)]
    .sort((left, right) => left.localeCompare(right));
}

function compareReferences(
  left: StructuredValueReference,
  right: StructuredValueReference,
): number {
  return left.field_path.localeCompare(right.field_path)
    || left.value_ref.localeCompare(right.value_ref);
}
