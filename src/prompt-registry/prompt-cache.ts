import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { listFilesystemPrompts } from "./filesystem-prompt-provider.js";
import { calculatePromptHash } from "./prompt-hash.js";
import {
  defaultPromptCacheRoot,
  type CachedPrompt,
} from "./cache-prompt-provider.js";

export async function refreshPromptCache(cacheRoot = defaultPromptCacheRoot()): Promise<CachedPrompt[]> {
  const prompts = listFilesystemPrompts().map((prompt): CachedPrompt => ({
    prompt_id: prompt.promptId,
    version: prompt.version,
    content: prompt.content,
    hash: calculatePromptHash(prompt.content),
    source: "cache",
  }));
  const promptsDirectory = join(cacheRoot, "prompts");

  await mkdir(promptsDirectory, { recursive: true });

  for (const prompt of prompts) {
    await writeFile(
      join(promptsDirectory, `${prompt.prompt_id}.json`),
      `${JSON.stringify(prompt, null, 2)}\n`,
      "utf8",
    );
  }

  await writeFile(
    join(cacheRoot, "active-prompts.json"),
    `${JSON.stringify(prompts, null, 2)}\n`,
    "utf8",
  );

  return prompts;
}

