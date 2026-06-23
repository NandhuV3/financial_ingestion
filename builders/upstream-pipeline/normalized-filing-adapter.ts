import { join } from "node:path";
import { ArtifactValidationError } from "../../packages/builder-framework/src/platform-error.js";
import { calculateFileHash } from "../../src/shared/hashing/hash-file.js";
import {
  readJsonFile,
  readTextFile,
} from "../../src/shared/filesystem/file-reader.js";
import { getFilingDirectory } from "../../src/storage/filing-paths.js";
import { resolveFilingDate } from "../../src/storage/resolve-filing.js";
import type { FilingArtifactBuilderInput } from "../filing-artifact-builder/types.js";

type FilingMetadata = {
  ticker: string;
  filing_date: string;
  form_type: string;
  accession_number: string;
};

type SecRecentFilings = {
  accessionNumber: string[];
  filingDate: string[];
  reportDate: string[];
  form: string[];
};

type SecSubmissions = {
  fiscalYearEnd: string;
  filings: {
    recent: SecRecentFilings;
  };
};

export type NormalizedFilingAdapterInput = {
  ticker: string;
  filingDate?: string;
};

export type NormalizedFilingAdapterResult = {
  builderInput: FilingArtifactBuilderInput;
  filingDate: string;
};

export async function loadNormalizedFilingBuilderInput(
  input: NormalizedFilingAdapterInput,
): Promise<NormalizedFilingAdapterResult> {
  const ticker = input.ticker.trim().toUpperCase();
  const filingDate = await resolveFilingDate(ticker, input.filingDate);
  const filingDirectory = getFilingDirectory(ticker, filingDate);

  try {
    const metadata = await readJsonFile<FilingMetadata>(
      join(filingDirectory, "metadata", "filing.json"),
    );
    const submissions = await readJsonFile<SecSubmissions>(
      join(filingDirectory, "raw", "filings.json"),
    );
    const managementDiscussion = await readTextFile(
      join(
        filingDirectory,
        "normalized",
        "management-discussion.cleaned.txt",
      ),
    );
    const riskFactors = await readTextFile(
      join(filingDirectory, "normalized", "risk-factors.cleaned.txt"),
    );
    const rawHtmlPath = join(filingDirectory, "raw", "latest-10q.html");
    const reportDate = filingReportDate(metadata, submissions);
    const periodId = fiscalPeriod(reportDate, submissions.fiscalYearEnd);

    validateMetadata(metadata, ticker, filingDate);

    return {
      filingDate,
      builderInput: {
        company_id: ticker,
        period_id: periodId,
        filing_id: metadata.accession_number,
        filing_type: metadata.form_type,
        filing_period: periodId,
        accession_number: metadata.accession_number,
        management_discussion: managementDiscussion,
        risk_factors: riskFactors,
        raw_html_hash: await calculateFileHash(rawHtmlPath),
      },
    };
  } catch (error) {
    if (error instanceof ArtifactValidationError) {
      throw error;
    }

    throw new ArtifactValidationError(
      `Normalized filing inputs could not be loaded for ${ticker} ${filingDate}.`,
      {
        cause: error,
        suggestedAction:
          "Run SEC extraction, deduplication, and normalization for the filing, then retry.",
      },
    );
  }
}

function validateMetadata(
  metadata: FilingMetadata,
  ticker: string,
  filingDate: string,
): void {
  if (
    metadata.ticker.trim().toUpperCase() !== ticker
    || metadata.filing_date !== filingDate
  ) {
    throw new ArtifactValidationError(
      "Filing metadata identity does not match the requested company and filing date.",
      {
        suggestedAction:
          "Use normalized sections and metadata from the same filing directory.",
      },
    );
  }
}

function filingReportDate(
  metadata: FilingMetadata,
  submissions: SecSubmissions,
): string {
  const index = submissions.filings.recent.accessionNumber.indexOf(
    metadata.accession_number,
  );

  if (
    index < 0
    || submissions.filings.recent.filingDate[index] !== metadata.filing_date
    || submissions.filings.recent.form[index] !== metadata.form_type
  ) {
    throw new ArtifactValidationError(
      "Filing metadata does not reconcile with the SEC submissions record.",
      {
        suggestedAction:
          "Regenerate filing metadata from the matching SEC submissions entry.",
      },
    );
  }

  const reportDate = submissions.filings.recent.reportDate[index];

  if (!isIsoDate(reportDate)) {
    throw new ArtifactValidationError(
      "The SEC submissions record does not contain a valid reportDate.",
      {
        suggestedAction:
          "Refresh raw/filings.json so the selected accession includes its reporting date.",
      },
    );
  }

  return reportDate;
}

export function fiscalPeriod(
  reportDate: string,
  fiscalYearEnd: string,
): string {
  if (!isIsoDate(reportDate) || !/^\d{4}$/.test(fiscalYearEnd)) {
    throw new ArtifactValidationError(
      "A valid reportDate and fiscalYearEnd are required to derive filing_period.",
    );
  }

  const [yearText, monthText, dayText] = reportDate.split("-");
  const reportYear = Number(yearText);
  const reportMonth = Number(monthText);
  const reportDay = Number(dayText);
  const fiscalEndMonth = Number(fiscalYearEnd.slice(0, 2));
  const fiscalEndDay = Number(fiscalYearEnd.slice(2, 4));

  if (
    fiscalEndMonth < 1
    || fiscalEndMonth > 12
    || fiscalEndDay < 1
    || fiscalEndDay > 31
  ) {
    throw new ArtifactValidationError(
      "SEC fiscalYearEnd must use a valid MMDD value.",
    );
  }

  const fiscalStartMonth = fiscalEndMonth % 12 + 1;
  const elapsedMonths = (reportMonth - fiscalStartMonth + 12) % 12;
  const quarter = Math.floor(elapsedMonths / 3) + 1;
  const fiscalYear = (
    reportMonth < fiscalEndMonth
    || (reportMonth === fiscalEndMonth && reportDay <= fiscalEndDay)
  )
    ? reportYear
    : reportYear + 1;

  return `${fiscalYear}-Q${quarter}`;
}

function isIsoDate(value: unknown): value is string {
  return typeof value === "string"
    && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`));
}
