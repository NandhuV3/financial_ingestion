import { join } from "node:path";
import { fileExists, readJsonFile } from "../shared/filesystem/file-reader.js";
import { writeJsonFile } from "../shared/filesystem/file-writer.js";
import type { TopicDefinition, TopicRegistry } from "./topic.types.js";

const registryPath = join(process.cwd(), "data", "registry", "topics.json");

export async function loadTopicRegistry(): Promise<TopicRegistry> {
  if (!fileExists(registryPath)) {
    const emptyRegistry: TopicRegistry = { topics: [] };
    await writeJsonFile(registryPath, emptyRegistry);
    return emptyRegistry;
  }

  return readJsonFile<TopicRegistry>(registryPath);
}

export function findTopicForTheme(params: {
  category: string;
  theme: string;
  registry: TopicRegistry;
}): TopicDefinition | null {
  const normalizedCategory = normalizeTopicText(params.category);
  const normalizedTheme = normalizeTopicText(params.theme);

  return (
    params.registry.topics.find((topic) => {
      const categoryMatches = topic.categories.map(normalizeTopicText).includes(normalizedCategory);
      const variantMatches = topic.theme_variants.map(normalizeTopicText).includes(normalizedTheme);

      return categoryMatches || variantMatches;
    }) ?? null
  );
}

export function normalizeTopicText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}
