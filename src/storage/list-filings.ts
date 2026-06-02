import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { getCompanyDirectory } from "./filing-paths.js";

const filingDatePattern = /^\d{4}-\d{2}-\d{2}$/;

export async function listAvailableFilings(ticker: string): Promise<string[]> {
  const filingsDir = join(getCompanyDirectory(ticker), "filings");

  try {
    const entries = await readdir(filingsDir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .filter((name) => filingDatePattern.test(name))
      .sort();
  } catch {
    return [];
  }
}

export async function getLatestAvailableFiling(ticker: string): Promise<string | undefined> {
  return (await listAvailableFilings(ticker)).at(-1);
}

if (require.main === module) {
  const ticker = process.argv[2];

  if (!ticker) {
    console.error("Usage: tsx src/storage/list-filings.ts <ticker>");
    process.exitCode = 1;
  } else {
    listAvailableFilings(ticker)
      .then((filings) => {
        for (const filing of filings) {
          console.log(filing);
        }
      })
      .catch((error) => {
        console.error(error);
        process.exitCode = 1;
      });
  }
}
