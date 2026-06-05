import type { CustomerSegment } from "../partner-domain.types.js";
import type { PartnerSourceArtifacts } from "../partner-source.types.js";
import { getArtifactText } from "./builder-utils.js";

export function buildCustomerSegments(artifacts: PartnerSourceArtifacts): CustomerSegment[] {
  const text = getArtifactText(artifacts);
  const segments: CustomerSegment[] = [];

  if (text.includes("consumer") || text.includes("people")) {
    segments.push({
      customerType: "Consumers",
      whyTheyBuy: "They use the company's products and services in everyday personal workflows.",
      importance: "important",
    });
  }

  if (text.includes("business") || text.includes("organization") || text.includes("enterprise") || text.includes("cloud")) {
    segments.push({
      customerType: "Businesses and organizations",
      whyTheyBuy: "They rely on the company's products and services to run, communicate, analyze, and grow.",
      importance: "core",
    });
  }

  if (text.includes("developer") || text.includes("platform") || text.includes("ai")) {
    segments.push({
      customerType: "Developers and technology teams",
      whyTheyBuy: "They build on the company's platforms, tools, cloud infrastructure, or AI capabilities.",
      importance: "important",
    });
  }

  return segments.length > 0
    ? segments
    : [{
      customerType: "Customers",
      whyTheyBuy: "The current artifacts do not yet provide a detailed customer breakdown.",
      importance: "important",
    }];
}
