function tokenize(text) {
    return new Set(text
        .toLowerCase()
        .split(/[^\w]+/)
        .filter((t) => t.length > 1));
}
function calculateScore(queryTokens, contentTokens) {
    let matches = 0;
    for (const token of queryTokens) {
        if (contentTokens.has(token))
            matches++;
    }
    return matches / queryTokens.size;
}
function createSnippet(content, query, maxLength = 200) {
    const lowerContent = content.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerContent.indexOf(lowerQuery);
    if (index === -1) {
        return content.slice(0, maxLength);
    }
    const start = Math.max(0, index - maxLength / 2);
    const end = Math.min(content.length, start + maxLength);
    let snippet = content.slice(start, end);
    if (start > 0)
        snippet = "..." + snippet;
    if (end < content.length)
        snippet = snippet + "...";
    return snippet;
}
export class LexicalFileIndexer {
    fileIndex = new Map();
    async index(file) {
        const chunkTokens = new Map();
        for (const chunk of file.chunks) {
            chunkTokens.set(chunk.id, tokenize(chunk.content));
        }
        this.fileIndex.set(file.id, { file, chunkTokens });
    }
    async search(query, options) {
        const { fileIds, limit = 10 } = options || {};
        const queryTokens = tokenize(query);
        if (queryTokens.size === 0)
            return [];
        const results = [];
        for (const [fileId, { file, chunkTokens }] of this.fileIndex) {
            if (fileIds && !fileIds.includes(fileId))
                continue;
            for (const chunk of file.chunks) {
                const tokens = chunkTokens.get(chunk.id);
                if (!tokens)
                    continue;
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
    async remove(fileId) {
        this.fileIndex.delete(fileId);
    }
    async clear() {
        this.fileIndex.clear();
    }
    getIndexedFileIds() {
        return Array.from(this.fileIndex.keys());
    }
    getIndexedFileCount() {
        return this.fileIndex.size;
    }
}
export function createFileIndexer() {
    return new LexicalFileIndexer();
}
//# sourceMappingURL=indexer.js.map