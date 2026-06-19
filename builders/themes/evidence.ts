import { createHash } from "node:crypto";
import type { SourceEvidence } from "./contract.js";
import type {
  FilingEvidenceCatalogEntry,
  ThemesBuilderInput,
} from "./types.js";

export function buildFilingEvidenceCatalog(
  input: ThemesBuilderInput,
): FilingEvidenceCatalogEntry[] {
  const excerpts = input.filing_content
    .split(/\n\s*\n/)
    .map(normalizeExcerpt)
    .filter((excerpt) => excerpt.length > 0);
  const seen = new Set<string>();
  const catalog: FilingEvidenceCatalogEntry[] = [];

  for (const excerpt of excerpts) {
    const excerptHash = createExcerptHash(excerpt);

    if (seen.has(excerptHash)) {
      continue;
    }

    seen.add(excerptHash);
    catalog.push({
      section: "filing_content",
      excerpt_hash: excerptHash,
      paragraph_reference: `excerpt-${String(catalog.length + 1).padStart(4, "0")}`,
      excerpt,
    });
  }

  return catalog;
}

export function canonicalEvidenceForHash(
  catalog: FilingEvidenceCatalogEntry[],
  excerptHash: string,
): SourceEvidence | null {
  const entry = catalog.find(({ excerpt_hash }) =>
    excerpt_hash === excerptHash);

  if (!entry) {
    return null;
  }

  return {
    section: entry.section,
    excerpt_hash: entry.excerpt_hash,
    paragraph_reference: entry.paragraph_reference,
  };
}

function createExcerptHash(excerpt: string): string {
  return createHash("sha256")
    .update(excerpt, "utf8")
    .digest("hex");
}

function normalizeExcerpt(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .trim();
}
