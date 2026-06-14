import type { CustomerSegment } from "../partner-domain.types.js";
import type { PartnerSourceArtifacts } from "../partner-source.types.js";
import { sentenceList } from "./business-language.js";

export function buildCustomerSegments(artifacts: PartnerSourceArtifacts): CustomerSegment[] {
  const products = sentenceList(
    artifacts.companyKnowledge.products,
    "the company's products or services",
  );
  const customers = artifacts.companyKnowledge.customers;
  const customerSegments = customers.length > 0
    ? customers
    : ["Customers"];

  return customerSegments.map((customer, index) => ({
    customerType: capitalize(customer),
    whyTheyBuy: `They use ${products} to meet practical needs described in the company's filings.`,
    importance: index === 0 ? "core" : "important",
  })).slice(0, 4) as CustomerSegment[];
}

function capitalize(value: string): string {
  const cleaned = value.trim();
  return cleaned.length > 0
    ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
    : "Customers";
}
