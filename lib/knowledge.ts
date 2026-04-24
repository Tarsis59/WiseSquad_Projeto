import { readFile } from "node:fs/promises";
import path from "node:path";

let cachedKnowledge: string | null = null;

export async function getKnowledgeContext() {
  if (cachedKnowledge) {
    return cachedKnowledge;
  }

  const filePath = path.join(process.cwd(), "base_de_conhecimento.txt");
  cachedKnowledge = await readFile(filePath, "utf-8");
  return cachedKnowledge;
}
