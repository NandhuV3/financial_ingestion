export function removeFilingStyleLanguage(value: string): string {
  return normalizeWhitespace(value)
    .replace(/\binvestors should note\b/gi, "owners should understand")
    .replace(/\bshareholders should consider\b/gi, "owners should understand")
    .replace(/\brevenue increased\b/gi, "customer demand remained visible")
    .replace(/\bearnings improved\b/gi, "business results improved")
    .replace(/\bsupporting references\b/gi, "business discussion")
    .replace(/\bfiling topic\b/gi, "business consideration")
    .replace(/\bnew categories\b/gi, "new business areas")
    .replace(/\bremoved categories\b/gi, "business areas receiving less attention")
    .replace(/\bcurrent filing\b/gi, "current business update")
    .replace(/\bintelligence pipeline\b/gi, "business review")
    .replace(/\bpipeline\b/gi, "business review")
    .replace(/\bfuture enrichment\b/gi, "longer-term review")
    .replace(/\bnot yet implemented\b/gi, "not yet clear")
    .replace(/\bnot yet populated\b/gi, "should be monitored over time")
    .replace(/\bdata not populated\b/gi, "information should be monitored over time")
    .replace(/\bunavailable\b/gi, "not clear yet");
}

export function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function firstSentence(value: string, maxLength = 180): string {
  const cleaned = normalizeWhitespace(value);
  const sentence = cleaned.match(/.*?[.!?](\s|$)/)?.[0]?.trim() ?? cleaned;

  if (sentence.length <= maxLength) {
    return sentence;
  }

  return `${sentence.slice(0, maxLength - 3).trim()}...`;
}

export function dedupeStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const value of values) {
    const cleaned = normalizeWhitespace(removeFilingStyleLanguage(value));
    const key = cleaned.toLowerCase();

    if (!cleaned || seen.has(key)) {
      continue;
    }

    seen.add(key);
    output.push(cleaned);
  }

  return output;
}

export function sentenceList(values: string[], fallback: string): string {
  const cleaned = dedupeStrings(values);

  if (cleaned.length === 0) {
    return fallback;
  }

  if (cleaned.length === 1) {
    return cleaned[0];
  }

  return `${cleaned.slice(0, -1).join(", ")}, and ${cleaned[cleaned.length - 1]}`;
}
