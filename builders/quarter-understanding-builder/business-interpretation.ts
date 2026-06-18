import type { BusinessSignal } from "../business-signals-builder/types.js";
import { QUARTER_UNDERSTANDING_CALIBRATION } from "./calibration-contract.js";
import type { QuarterUnderstandingBuildContext, UnderstandingSeed } from "./types.js";

export function buildBusinessInterpretations(context: QuarterUnderstandingBuildContext): UnderstandingSeed[] {
  const signals = context.businessSignalsArtifact.content.signals;

  return [
    buildBusinessModelInterpretation(context, signals),
    buildRevenueInterpretation(context, signals),
    buildCustomerInterpretation(context, signals),
    buildProductInterpretation(context, signals),
    buildCompetitionInterpretation(context, signals),
  ].filter((seed): seed is UnderstandingSeed => seed !== null);
}

function buildBusinessModelInterpretation(
  context: QuarterUnderstandingBuildContext,
  signals: BusinessSignal[],
): UnderstandingSeed | null {
  const businessModel = context.companyKnowledgeArtifact.content.knowledge.business_model;
  const relevantSignals = signals.filter((signal) =>
    signal.category === "growth" || signal.category === "strategic" || signal.category === "competitive");

  if (businessModel.summary.trim() === "" && relevantSignals.length === 0) {
    return null;
  }

  return {
    category: "business_model",
    title: "Business model context for the period",
    explanation: `This period is best understood through the existing business model: ${businessModel.summary}`,
    importance: importanceFromSignals(relevantSignals),
    direction: directionFromSignals(relevantSignals),
    signal_refs: relevantSignals.map((signal) => signal.signal_id),
    company_knowledge_refs: ["business_model"],
    trust_signal_refs: [],
    topic_refs: [],
  };
}

function buildRevenueInterpretation(
  context: QuarterUnderstandingBuildContext,
  signals: BusinessSignal[],
): UnderstandingSeed | null {
  const revenueSignals = signals.filter((signal) => signal.category === "growth" || signal.category === "margin");
  const drivers = context.companyKnowledgeArtifact.content.knowledge.revenue_drivers;

  if (drivers.length === 0 && revenueSignals.length === 0) {
    return null;
  }

  return {
    category: "revenue",
    title: "Revenue signals show current business momentum",
    explanation: `Revenue interpretation is grounded in ${drivers.length} durable revenue driver(s) and ${revenueSignals.length} current business signal(s).`,
    importance: importanceFromSignals(revenueSignals),
    direction: directionFromSignals(revenueSignals),
    signal_refs: revenueSignals.map((signal) => signal.signal_id),
    company_knowledge_refs: drivers.map((_, index) => `revenue_drivers.${index}`),
    trust_signal_refs: [],
    topic_refs: [],
  };
}

function buildCustomerInterpretation(
  context: QuarterUnderstandingBuildContext,
  signals: BusinessSignal[],
): UnderstandingSeed | null {
  const customerSignals = signals.filter((signal) => signal.category === "customer");
  const customers = context.companyKnowledgeArtifact.content.knowledge.customers;

  if (customers.length === 0 && customerSignals.length === 0) {
    return null;
  }

  return {
    category: "customers",
    title: "Customer signals define demand context",
    explanation: `Customer understanding is anchored in ${customers.length} customer segment(s) and ${customerSignals.length} customer observation(s).`,
    importance: importanceFromSignals(customerSignals),
    direction: directionFromSignals(customerSignals),
    signal_refs: customerSignals.map((signal) => signal.signal_id),
    company_knowledge_refs: customers.map((_, index) => `customers.${index}`),
    trust_signal_refs: [],
    topic_refs: [],
  };
}

function buildProductInterpretation(
  context: QuarterUnderstandingBuildContext,
  signals: BusinessSignal[],
): UnderstandingSeed | null {
  const productSignals = signals.filter((signal) => signal.category === "product");
  const products = context.companyKnowledgeArtifact.content.knowledge.products;

  if (products.length === 0 && productSignals.length === 0) {
    return null;
  }

  return {
    category: "products",
    title: "Product observations frame the period",
    explanation: `Product interpretation uses ${products.length} known product line(s) and ${productSignals.length} product observation(s).`,
    importance: importanceFromSignals(productSignals),
    direction: directionFromSignals(productSignals),
    signal_refs: productSignals.map((signal) => signal.signal_id),
    company_knowledge_refs: products.map((_, index) => `products.${index}`),
    trust_signal_refs: [],
    topic_refs: [],
  };
}

function buildCompetitionInterpretation(
  context: QuarterUnderstandingBuildContext,
  signals: BusinessSignal[],
): UnderstandingSeed | null {
  const competitiveSignals = signals.filter((signal) => signal.category === "competitive");
  const positioning = context.companyKnowledgeArtifact.content.knowledge.competitive_positioning;

  if (positioning.length === 0 && competitiveSignals.length === 0) {
    return null;
  }

  return {
    category: "competition",
    title: "Competitive context shapes signal significance",
    explanation: `Competitive interpretation is grounded in ${positioning.length} positioning statement(s) and ${competitiveSignals.length} competitive observation(s).`,
    importance: importanceFromSignals(competitiveSignals),
    direction: directionFromSignals(competitiveSignals),
    signal_refs: competitiveSignals.map((signal) => signal.signal_id),
    company_knowledge_refs: positioning.map((_, index) => `competitive_positioning.${index}`),
    trust_signal_refs: [],
    topic_refs: [],
  };
}

export function importanceFromSignals(signals: BusinessSignal[]): "low" | "medium" | "high" {
  if (signals.some((signal) =>
    includesCalibrationValue(QUARTER_UNDERSTANDING_CALIBRATION.HIGH_IMPORTANCE_SIGNAL_MAGNITUDES, signal.magnitude))) {
    return "high";
  }

  if (signals.length >= QUARTER_UNDERSTANDING_CALIBRATION.MEDIUM_IMPORTANCE_MIN_SIGNAL_COUNT) {
    return "medium";
  }

  return "low";
}

export function directionFromSignals(signals: BusinessSignal[]): "improving" | "stable" | "deteriorating" | "mixed" {
  const improving = signals.filter((signal) =>
    includesCalibrationValue(QUARTER_UNDERSTANDING_CALIBRATION.IMPROVING_BUSINESS_SIGNAL_DIRECTIONS, signal.direction)).length;
  const deteriorating = signals.filter((signal) =>
    includesCalibrationValue(QUARTER_UNDERSTANDING_CALIBRATION.DETERIORATING_BUSINESS_SIGNAL_DIRECTIONS, signal.direction)).length;

  if (improving > 0 && deteriorating > 0) {
    return "mixed";
  }

  if (improving > 0) {
    return "improving";
  }

  if (deteriorating > 0) {
    return "deteriorating";
  }

  return "stable";
}

function includesCalibrationValue(values: readonly string[], value: string): boolean {
  return values.includes(value);
}
