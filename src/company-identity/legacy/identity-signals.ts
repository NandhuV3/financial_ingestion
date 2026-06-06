export type IdentitySignalDefinition = {
  label: string;
  keywords: string[];
};

export const productSignalDefinitions: IdentitySignalDefinition[] = [
  { label: "cloud infrastructure", keywords: ["cloud", "azure", "aws", "infrastructure", "datacenter"] },
  { label: "software products", keywords: ["software", "productivity", "operating system", "application"] },
  { label: "developer tools", keywords: ["developer", "github", "platform tools"] },
  { label: "artificial intelligence capabilities", keywords: ["artificial intelligence", " ai ", "ai infrastructure", "ai services"] },
  { label: "advertising services", keywords: ["advertising", "advertiser", "ads"] },
  { label: "consumer devices", keywords: ["device", "hardware", "iphone", "mac", "ipad", "wearable"] },
  { label: "digital services", keywords: ["services", "subscription", "platform", "app store"] },
  { label: "commerce and marketplace services", keywords: ["retail", "commerce", "marketplace", "seller"] },
  { label: "logistics and fulfillment services", keywords: ["logistics", "fulfillment", "delivery", "warehouse"] },
  { label: "payment network services", keywords: ["payment", "payments", "card", "transaction", "merchant"] },
  { label: "semiconductors and computing systems", keywords: ["semiconductor", "chip", "gpu", "accelerated computing"] },
];

export const customerSignalDefinitions: IdentitySignalDefinition[] = [
  { label: "businesses and organizations", keywords: ["business", "businesses", "organization", "organizations", "enterprise"] },
  { label: "consumers", keywords: ["consumer", "consumers", "people", "users", "customer demand"] },
  { label: "developers and technology teams", keywords: ["developer", "developers", "platform", "cloud"] },
  { label: "advertisers and marketers", keywords: ["advertiser", "advertisers", "advertising"] },
  { label: "merchants and sellers", keywords: ["merchant", "merchants", "seller", "sellers", "marketplace"] },
  { label: "creators and media partners", keywords: ["creator", "creators", "content", "media"] },
  { label: "financial institutions and payment partners", keywords: ["bank", "banks", "payment", "payments", "card"] },
  { label: "governments and public-sector customers", keywords: ["government", "public-sector", "public sector"] },
];

export const revenueDriverDefinitions: IdentitySignalDefinition[] = [
  { label: "software subscriptions", keywords: ["subscription", "software", "productivity"] },
  { label: "cloud consumption", keywords: ["cloud", "azure", "aws", "datacenter"] },
  { label: "advertising", keywords: ["advertising", "advertiser", "ads"] },
  { label: "marketplace fees", keywords: ["marketplace", "seller", "merchant"] },
  { label: "payment volume", keywords: ["payment", "payments", "transaction", "card"] },
  { label: "device sales", keywords: ["device", "hardware", "iphone", "mac", "ipad"] },
  { label: "digital services subscriptions", keywords: ["services", "subscription", "app store"] },
  { label: "semiconductor demand", keywords: ["semiconductor", "chip", "gpu", "accelerated computing"] },
  { label: "retail and logistics activity", keywords: ["retail", "commerce", "logistics", "fulfillment"] },
];

export const businessModelSignalDefinitions: IdentitySignalDefinition[] = [
  { label: "recurring revenue", keywords: ["subscription", "recurring", "renew", "remaining performance obligation"] },
  { label: "transaction-based revenue", keywords: ["transaction", "payment", "volume", "marketplace"] },
  { label: "advertising-supported", keywords: ["advertising", "advertiser", "ads"] },
  { label: "enterprise-focused", keywords: ["enterprise", "business", "organization", "commercial"] },
  { label: "consumer-focused", keywords: ["consumer", "people", "users", "device"] },
  { label: "platform business", keywords: ["platform", "ecosystem", "developer"] },
  { label: "infrastructure-intensive", keywords: ["infrastructure", "datacenter", "server capacity", "logistics"] },
];

export const competitiveSignalDefinitions: IdentitySignalDefinition[] = [
  { label: "ecosystem strength", keywords: ["ecosystem", "integrated", "platform"] },
  { label: "scale advantages", keywords: ["scale", "large", "global", "broad"] },
  { label: "network effects", keywords: ["network", "marketplace", "platform"] },
  { label: "brand trust", keywords: ["brand", "trust", "trusted", "loyal"] },
  { label: "switching costs", keywords: ["subscription", "renew", "integrated", "platform"] },
  { label: "developer ecosystem", keywords: ["developer", "developers"] },
  { label: "data and AI capabilities", keywords: ["data", "artificial intelligence", " ai "] },
];

export const operatingSignalDefinitions: IdentitySignalDefinition[] = [
  { label: "cloud infrastructure", keywords: ["cloud", "datacenter", "server", "infrastructure"] },
  { label: "manufacturing intensity", keywords: ["manufacturing", "supplier", "component", "device"] },
  { label: "logistics network", keywords: ["logistics", "fulfillment", "warehouse", "delivery"] },
  { label: "developer ecosystem", keywords: ["developer", "developers", "platform"] },
  { label: "partner network", keywords: ["partner", "partners", "channel"] },
  { label: "advertising marketplace", keywords: ["advertising", "advertiser", "ads"] },
  { label: "supply chain management", keywords: ["supply", "supplier", "component"] },
];

export const riskSignalDefinitions: IdentitySignalDefinition[] = [
  { label: "competition", keywords: ["competition", "competitive", "competitor"] },
  { label: "cybersecurity", keywords: ["cyber", "security breach", "security"] },
  { label: "regulation and antitrust", keywords: ["regulation", "regulatory", "antitrust"] },
  { label: "privacy and data protection", keywords: ["privacy", "data protection"] },
  { label: "supply chain and manufacturing", keywords: ["supply", "supplier", "manufacturing", "tariff", "import", "export"] },
  { label: "macroeconomic and currency pressure", keywords: ["macro", "economic", "currency", "foreign exchange", "inflation"] },
  { label: "taxation", keywords: ["tax", "taxation"] },
  { label: "product quality", keywords: ["quality", "defect", "reliability"] },
  { label: "AI execution risk", keywords: ["artificial intelligence", " ai ", "ai infrastructure"] },
];

export function inferIdentitySignals(
  text: string,
  definitions: IdentitySignalDefinition[],
  fallback: string[],
  limit = 8,
): string[] {
  const normalized = normalize(text);
  const matched = definitions
    .filter((definition) => definition.keywords.some((keyword) => normalized.includes(normalize(keyword))))
    .map((definition) => definition.label);

  return matched.length > 0 ? dedupe(matched).slice(0, limit) : fallback;
}

export function dedupe(values: string[]): string[] {
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

export function toSentenceList(values: string[], fallback: string): string {
  const cleaned = dedupe(values);

  if (cleaned.length === 0) {
    return fallback;
  }

  if (cleaned.length === 1) {
    return cleaned[0];
  }

  return `${cleaned.slice(0, -1).join(", ")}, and ${cleaned[cleaned.length - 1]}`;
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}
