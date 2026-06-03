import { join } from "node:path";
import { getCurrentTimestamp } from "../shared/dates/timestamps.js";
import { fileExists, readJsonFile } from "../shared/filesystem/file-reader.js";
import { writeJsonFile } from "../shared/filesystem/file-writer.js";
import { createLogger } from "../shared/logger.js";
import { getFilingDirectory } from "../storage/filing-paths.js";
import type { SemanticTopicMatch, SemanticTopicMatchFile } from "../topic-intelligence/semantic-topic.types.js";
import type { ThemeOutput } from "../types/theme.types.js";
import type {
  TopicApproval,
  TopicApprovalFile,
  TopicAssignedThemeV2,
  TopicAssignmentMethod,
  TopicAssignmentOutputV2,
  TopicAssignmentSummary,
} from "./assignment.types.js";

const logger = createLogger("topic-assignment-v2-apply");
const approvalPath = join(process.cwd(), "data", "review", "topic-approvals.json");

export async function applyApprovedTopics(ticker: string, filingDate: string): Promise<TopicAssignmentOutputV2> {
  const startedAt = Date.now();
  const normalizedTicker = ticker.trim().toUpperCase();
  const filingDir = getFilingDirectory(normalizedTicker, filingDate);
  const themes = await readJsonFile<ThemeOutput>(join(filingDir, "intelligence", "themes.json"));
  const matches = await readSemanticMatches(filingDir);
  const approvals = await loadTopicApprovals();
  const output = applyTopicApprovals({
    themes,
    matches,
    approvals,
    ticker: normalizedTicker,
    filingDate,
  });
  const summary = summarizeAssignments(output.themes);

  await writeJsonFile(join(filingDir, "intelligence", "themes.with-topics.json"), output);

  logger.info("Approved topic assignments applied.", {
    ticker: normalizedTicker,
    filing_date: filingDate,
    duration_ms: Date.now() - startedAt,
    approved_count: summary.approved_count,
    pending_count: summary.pending_count,
    rejected_count: summary.rejected_count,
  });

  return output;
}

export function applyTopicApprovals(params: {
  themes: ThemeOutput;
  matches: SemanticTopicMatch[];
  approvals: TopicApproval[];
  ticker: string;
  filingDate: string;
}): TopicAssignmentOutputV2 {
  const approvalMap = buildApprovalMap(params.approvals, params.ticker, params.filingDate);
  const matchMap = new Map(params.matches.map((match) => [normalizeTheme(match.theme), match]));

  return {
    company: params.themes.company,
    ticker: params.themes.ticker,
    filing_date: params.themes.filing_date,
    themes: params.themes.themes.map((theme) => {
      const normalizedTheme = normalizeTheme(theme.theme);
      const approval = approvalMap.get(normalizedTheme);
      const match = matchMap.get(normalizedTheme);
      const assignmentMethod = match ? deriveAssignmentMethod(match) : null;

      if (approval?.decision === "approved") {
        return {
          ...theme,
          topic_id: approval.topic_id,
          confidence: match?.confidence ?? null,
          assignment_method: assignmentMethod ?? "manual",
          assignment_status: "approved",
        };
      }

      if (approval?.decision === "rejected") {
        return {
          ...theme,
          topic_id: null,
          confidence: match?.confidence ?? null,
          assignment_method: assignmentMethod,
          assignment_status: "rejected",
        };
      }

      return {
        ...theme,
        topic_id: null,
        confidence: match?.confidence ?? null,
        assignment_method: assignmentMethod,
        assignment_status: "pending_review",
      };
    }),
  };
}

export async function loadTopicApprovals(): Promise<TopicApproval[]> {
  if (!fileExists(approvalPath)) {
    const emptyApprovalFile: TopicApprovalFile = { approvals: [] };
    await writeJsonFile(approvalPath, emptyApprovalFile);
    return [];
  }

  const approvalFile = await readJsonFile<TopicApprovalFile | TopicApproval[]>(approvalPath);
  const approvals = Array.isArray(approvalFile) ? approvalFile : approvalFile.approvals;

  return validateTopicApprovals(approvals ?? []);
}

export function validateTopicApprovals(approvals: TopicApproval[]): TopicApproval[] {
  for (const approval of approvals) {
    if (!approval.theme?.trim()) {
      throw new Error("Topic approval is missing theme.");
    }

    if (!approval.topic_id?.trim()) {
      throw new Error(`Topic approval for "${approval.theme}" is missing topic_id.`);
    }

    if (approval.decision !== "approved" && approval.decision !== "rejected") {
      throw new Error(`Topic approval for "${approval.theme}" has unsupported decision "${approval.decision}".`);
    }

    if (!approval.reviewed_at?.trim()) {
      throw new Error(`Topic approval for "${approval.theme}" is missing reviewed_at.`);
    }
  }

  return approvals;
}

export function summarizeAssignments(themes: TopicAssignedThemeV2[]): TopicAssignmentSummary {
  return {
    approved_count: themes.filter((theme) => theme.assignment_status === "approved").length,
    pending_count: themes.filter((theme) => theme.assignment_status === "pending_review").length,
    rejected_count: themes.filter((theme) => theme.assignment_status === "rejected").length,
  };
}

export function buildApproval(params: {
  theme: string;
  topic_id: string;
  decision: TopicApproval["decision"];
  ticker?: string;
  filing_date?: string;
}): TopicApproval {
  return {
    theme: params.theme,
    topic_id: params.topic_id,
    decision: params.decision,
    reviewed_at: getCurrentTimestamp(),
    ticker: params.ticker,
    filing_date: params.filing_date,
  };
}

async function readSemanticMatches(filingDir: string): Promise<SemanticTopicMatch[]> {
  const matchPath = join(filingDir, "intelligence", "semantic-topic-matches.json");

  if (!fileExists(matchPath)) {
    return [];
  }

  return (await readJsonFile<SemanticTopicMatchFile>(matchPath)).matches;
}

function buildApprovalMap(approvals: TopicApproval[], ticker: string, filingDate: string): Map<string, TopicApproval> {
  const scopedApprovals = approvals.filter((approval) =>
    (!approval.ticker || approval.ticker === ticker) && (!approval.filing_date || approval.filing_date === filingDate),
  );

  return new Map(scopedApprovals.map((approval) => [normalizeTheme(approval.theme), approval]));
}

function deriveAssignmentMethod(match: SemanticTopicMatch): TopicAssignmentMethod {
  return match.match_reason.includes("variant_match") ? "variant_match" : "semantic";
}

function normalizeTheme(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}
