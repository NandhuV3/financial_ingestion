import type { CompanyProfileIntelligence } from "../company-profile/company-profile.types.js";
import { fileExists, readJsonFile } from "../shared/filesystem/file-reader.js";
import {
  getCompanyIdentityEnrichedPath,
  getCompanyIdentityEvidencePath,
  getCompanyIdentityPath,
} from "./build-company-identity.js";
import type { CompanyIdentityEnriched, CompanyIdentityEvidence } from "./company-identity.types.js";

export type CompanyIdentitySource = CompanyIdentityEnriched | CompanyIdentityEvidence | null;

export async function readCompanyIdentityIntelligence(ticker: string): Promise<CompanyIdentitySource> {
  const enrichedPath = getCompanyIdentityEnrichedPath(ticker);
  const evidencePath = getCompanyIdentityEvidencePath(ticker);
  const compatibilityPath = getCompanyIdentityPath(ticker);

  if (fileExists(enrichedPath)) {
    return readJsonFile<CompanyIdentityEnriched>(enrichedPath);
  }

  if (fileExists(evidencePath)) {
    return readJsonFile<CompanyIdentityEvidence>(evidencePath);
  }

  return fileExists(compatibilityPath)
    ? readJsonFile<CompanyIdentityEnriched | CompanyIdentityEvidence>(compatibilityPath)
    : null;
}

export function isCompanyIdentityEnriched(identity: CompanyIdentitySource): identity is CompanyIdentityEnriched {
  return Boolean(identity && "business_description" in identity);
}

export function getBusinessDescription(
  identity: CompanyIdentitySource,
  profile?: CompanyProfileIntelligence,
): string {
  if (isCompanyIdentityEnriched(identity)) {
    return identity.business_description;
  }

  const company = identity?.company ?? profile?.company ?? "The company";
  const products = getPrimaryProducts(identity, profile);
  const customers = getPrimaryCustomers(identity, profile);

  if (products.length > 0 && customers.length > 0) {
    return `${company} provides ${sentenceList(products, "products and services")} to ${sentenceList(customers, "customers")}.`;
  }

  if (products.length > 0) {
    return `${company} provides ${sentenceList(products, "products and services")}.`;
  }

  return `${company} is described through available company filings and partner intelligence artifacts.`;
}

export function getPrimaryProducts(
  identity: CompanyIdentitySource,
  profile?: CompanyProfileIntelligence,
): string[] {
  if (isCompanyIdentityEnriched(identity)) {
    return identity.primary_products;
  }

  return dedupe([...(identity?.products ?? []), ...(profile?.products ?? [])]);
}

export function getPrimaryCustomers(
  identity: CompanyIdentitySource,
  profile?: CompanyProfileIntelligence,
): string[] {
  if (isCompanyIdentityEnriched(identity)) {
    return identity.primary_customers;
  }

  return dedupe([...(identity?.customers ?? []), ...(profile?.customers ?? [])]);
}

export function getRevenueDrivers(identity: CompanyIdentitySource): string[] {
  return isCompanyIdentityEnriched(identity) ? identity.revenue_drivers : [];
}

export function getCompetitiveSignals(identity: CompanyIdentitySource): string[] {
  return isCompanyIdentityEnriched(identity) ? identity.competitive_signals : [];
}

export function getOperatingSignals(identity: CompanyIdentitySource): string[] {
  return isCompanyIdentityEnriched(identity) ? identity.operating_signals : [];
}

function dedupe(values: string[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const value of values) {
    const cleaned = value.replace(/\s+/g, " ").trim();
    const key = cleaned.toLowerCase();

    if (!cleaned || seen.has(key)) {
      continue;
    }

    seen.add(key);
    output.push(cleaned);
  }

  return output;
}

function sentenceList(values: string[], fallback: string): string {
  const cleaned = values.map((value) => value.trim()).filter(Boolean);

  if (cleaned.length === 0) return fallback;
  if (cleaned.length === 1) return cleaned[0];
  if (cleaned.length === 2) return `${cleaned[0]} and ${cleaned[1]}`;

  return `${cleaned.slice(0, -1).join(", ")}, and ${cleaned[cleaned.length - 1]}`;
}
