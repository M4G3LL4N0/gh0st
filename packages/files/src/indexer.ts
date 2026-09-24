import { FileIndexer, ProcessedFile, SearchResult, FileChunk } from "./types.js";

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^\w]+/)
      .filter((t) => t.length > 1)
  );
}

function calculateScore(queryTokens: Set<string>, contentTokens: Set<string>): number {
  let matches = 0;
  for (const token of queryTokens) {
    if (contentTokens.has(token)) matches++;
  }
  return matches / queryTokens.size;
}

function createSnippet(content: string, query: string, maxLength: number = 200): string {
  const lowerContent = content.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerContent.indexOf(lowerQuery);

  if (index === -1) {
    return content.slice(0, maxLength);
  }

  const start = Math.max(0, index - maxLength / 2);
  const end = Math.min(content.length, start + maxLength);
  let snippet = content.slice(start, end);

  if (start > 0) snippet = "..." + snippet;
  if (end < content.length) snippet = snippet + "...";

  return snippet;
}

export class LexicalFileIndexer implements FileIndexer {
  private fileIndex: Map<string, { file: ProcessedFile; chunkTokens: Map<string, Set<string>> }> = new Map();

  async index(file: ProcessedFile): Promise<void> {
    const chunkTokens = new Map<string, Set<string>>();
    for (const chunk of file.chunks) {
      chunkTokens.set(chunk.id, tokenize(chunk.content));
    }
    this.fileIndex.set(file.id, { file, chunkTokens });
  }

  async search(query: string, options?: { fileIds?: string[]; limit?: number }): Promise<SearchResult[]> {
    const { fileIds, limit = 10 } = options || {};
    const queryTokens = tokenize(query);

    if (queryTokens.size === 0) return [];

    const results: SearchResult[] = [];

    for (const [fileId, { file, chunkTokens }] of this.fileIndex) {
      if (fileIds && !fileIds.includes(fileId)) continue;

      for (const chunk of file.chunks) {
        const tokens = chunkTokens.get(chunk.id);
        if (!tokens) continue;

        const score = calculateScore(queryTokens, tokens);
        if (score > 0) {
          results.push({
            chunk,
            score,
            snippet: createSnippet(chunk.content, query)
          });
        }
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit);
  }

  async remove(fileId: string): Promise<void> {
    this.fileIndex.delete(fileId);
  }

  async clear(): Promise<void> {
    this.fileIndex.clear();
  }

  getIndexedFileIds(): string[] {
    return Array.from(this.fileIndex.keys());
  }

  getIndexedFileCount(): number {
    return this.fileIndex.size;
  }
}

export function createFileIndexer(): FileIndexer {
  return new LexicalFileIndexer();
}