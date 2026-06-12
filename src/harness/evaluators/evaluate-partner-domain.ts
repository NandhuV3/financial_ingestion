import type { PartnerCompanyIntelligence } from "../../partner-domain/partner-domain.types.js";
import { createScorecard, flattenText, normalize, scoreCoverage } from "../scorecard.js";
import type { HarnessScorecard } from "../harness.types.js";

const filingLanguage = [
  "filing",
  "10-q",
  "10-k",
  "shareholders should",
  "investors should",
  "supporting references",
  "evidence count",
  "topic id",
];

const jargonTerms = [
  "ebitda",
  "basis points",
  "alpha",
  "multiple expansion",
  "terminal value",
  "discount rate",
];

export function evaluatePartnerDomain(
  artifact: PartnerCompanyIntelligence,
): HarnessScorecard {
  const textValues = flattenText(artifact);
  const allText = textValues.join(" ");
  const sentences = allText.split(/[.!?]+/).map((sentence) => sentence.trim()).filter(Boolean);
  const avgSentenceLength = sentences.length === 0
    ? 0
    : sentences.reduce((sum, sentence) => sum + sentence.split(/\s+/).length, 0) / sentences.length;
  const jargonCount = countTerms(allText, jargonTerms);
  const filingLanguageCount = countTerms(allText, filingLanguage);

  return createScorecard({
    artifact: "partner_domain",
    dimensions: [
      {
        name: "readability",
        score: scoreReadability(avgSentenceLength, jargonCount),
        notes: [
          `Average sentence length: ${Math.round(avgSentenceLength)} words.`,
          `Jargon terms found: ${jargonCount}.`,
        ],
      },
      {
        name: "owner_friendliness",
        score: filingLanguageCount === 0 ? 1 : Math.max(0, 1 - (filingLanguageCount * 0.15)),
        notes: [`Filing or trader-style phrases found: ${filingLanguageCount}.`],
      },
      {
        name: "consistency",
        score: consistencyFailures(artifact).length === 0 ? 1 : 0.5,
        notes: consistencyFailures(artifact).length === 0 ? ["No obvious cross-section mismatch found."] : consistencyFailures(artifact),
      },
      {
        name: "risk_signal_quality",
        score: scoreCoverage(artifact.forensics.filter((signal) => signal.explanation.trim()).length, artifact.forensics.length),
        notes: [`Forensics signals with explanations: ${artifact.forensics.filter((signal) => signal.explanation.trim()).length}/${artifact.forensics.length}.`],
      },
      {
        name: "source_coverage",
        score: scoreCoverage(artifact.sources.length, 4),
        notes: [`Partner Domain sources present: ${artifact.sources.map((source) => source.artifact).join(", ") || "none"}.`],
      },
      sourceTraceabilityDimension(artifact),
    ],
    warnings: filingLanguageCount > 0 ? [`Filing-style language occurrences: ${filingLanguageCount}`] : [],
    failures: consistencyFailures(artifact),
  });
}

function sourceTraceabilityDimension(artifact: PartnerCompanyIntelligence) {
  const sourceNames = new Set(artifact.sources.map((source) => normalize(source.artifact)));
  const expected = ["company knowledge", "themes", "quarter change", "topic evolution"];
  const present = expected.filter((source) => sourceNames.has(source));
  const missing = expected.filter((source) => !sourceNames.has(source));

  return {
    name: "source_traceability",
    score: scoreCoverage(present.length, expected.length),
    notes: missing.length === 0
      ? ["All expected Partner Domain source artifacts are declared."]
      : [`Missing source declarations: ${missing.join(", ")}.`],
  };
}

function scoreReadability(avgSentenceLength: number, jargonCount: number): number {
  const sentenceScore = avgSentenceLength === 0
    ? 0
    : avgSentenceLength <= 24
      ? 1
      : avgSentenceLength <= 34
        ? 0.75
        : 0.45;
  const jargonPenalty = Math.min(0.5, jargonCount * 0.1);

  return Math.max(0, sentenceScore - jargonPenalty);
}

function consistencyFailures(artifact: PartnerCompanyIntelligence): string[] {
  const failures: string[] = [];
  const profileCompany = normalize(artifact.companyName);

  if (!profileCompany) {
    failures.push("Company name is empty.");
  }

  if (!normalize(artifact.profile.companyName).includes(profileCompany) && !profileCompany.includes(normalize(artifact.profile.companyName))) {
    failures.push("Profile company name does not match aggregate company name.");
  }

  if (!artifact.story.whatTheyDo.trim() || !artifact.profile.whatTheyDo.trim()) {
    failures.push("Company story or profile whatTheyDo is empty.");
  }

  return failures;
}

function countTerms(text: string, terms: string[]): number {
  const normalized = normalize(text);

  return terms.reduce((count, term) => count + (normalized.includes(normalize(term)) ? 1 : 0), 0);
}
