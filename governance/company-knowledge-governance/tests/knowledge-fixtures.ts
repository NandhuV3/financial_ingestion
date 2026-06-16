import type { CompanyKnowledge } from "../../../builders/company-knowledge-builder/types.js";

export function knowledge(): CompanyKnowledge {
  return {
    business_model: {
      summary: "Microsoft sells software and cloud services.",
      value_creation: "Enterprise customers run work on Microsoft platforms.",
      revenue_structure: "Subscriptions and cloud usage.",
      confidence: 0.82,
      supporting_periods: ["2026-Q2"],
      last_updated_period: "2026-Q2",
    },
    products: [product("Azure", "Cloud infrastructure.")],
    customers: [{
      customer_segment: "Enterprise customers",
      description: "Organizations buying software and cloud services.",
      confidence: 0.82,
      supporting_periods: ["2026-Q2"],
      last_updated_period: "2026-Q2",
    }],
    revenue_structure: {
      summary: "Subscriptions and usage.",
      recurring_components: ["subscriptions"],
      transactional_components: ["usage"],
      confidence: 0.82,
      supporting_periods: ["2026-Q2"],
      last_updated_period: "2026-Q2",
    },
    revenue_drivers: [{
      driver: "Cloud usage",
      description: "Azure workload growth.",
      confidence: 0.82,
      supporting_periods: ["2026-Q2"],
      last_updated_period: "2026-Q2",
    }],
    competitive_positioning: [{
      positioning: "Enterprise platform",
      rationale: "Integrated software and cloud breadth.",
      confidence: 0.82,
      supporting_periods: ["2026-Q2"],
      last_updated_period: "2026-Q2",
    }],
    strategic_priorities: [{
      priority: "AI integration",
      description: "AI across products.",
      confidence: 0.82,
      supporting_periods: ["2026-Q2"],
      last_updated_period: "2026-Q2",
    }],
    management_focus: [{
      focus_area: "Cloud capacity",
      description: "Scaling infrastructure.",
      confidence: 0.82,
      supporting_periods: ["2026-Q2"],
      last_updated_period: "2026-Q2",
    }],
    dependencies: [{
      dependency: "Data center capacity",
      description: "Cloud services require infrastructure.",
      confidence: 0.82,
      supporting_periods: ["2026-Q2"],
      last_updated_period: "2026-Q2",
    }],
  };
}

function product(productName: string, description: string): CompanyKnowledge["products"][number] {
  return {
    product_name: productName,
    description,
    importance: "high",
    confidence: 0.82,
    supporting_periods: ["2026-Q2"],
    last_updated_period: "2026-Q2",
  };
}

