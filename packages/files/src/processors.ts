import { FileProcessor, ProcessedFile, createFileChunks, estimateTokens } from "./types.js";

export class TextFileProcessor implements FileProcessor {
  canProcess(mimeType: string): boolean {
    return mimeType.startsWith("text/") ||
      mimeType === "application/json" ||
      mimeType === "application/xml" ||
      mimeType === "application/yaml" ||
      mimeType === "application/x-yaml";
  }

  async process(file: ArrayBuffer, fileName: string, mimeType: string): Promise<ProcessedFile> {
    const decoder = new TextDecoder();
    const textContent = decoder.decode(file);
    const chunks = createFileChunks(crypto.randomUUID(), textContent);

    return {
      id: crypto.randomUUID(),
      fileName,
      mimeType,
      size: file.byteLength,
      textContent,
      chunks,
      extractedAt: Date.now()
    };
  }
}

export class PDFFileProcessor implements FileProcessor {
  canProcess(mimeType: string): boolean {
    return mimeType === "application/pdf";
  }

  async process(file: ArrayBuffer, fileName: string, mimeType: string): Promise<ProcessedFile> {
    const pdfParse = await import("pdf-parse").then((m) => m.default);
    const data = await pdfParse(Buffer.from(file));
    const textContent = data.text || "";
    const chunks = createFileChunks(crypto.randomUUID(), textContent);

    return {
      id: crypto.randomUUID(),
      fileName,
      mimeType,
      size: file.byteLength,
      textContent,
      chunks,
      extractedAt: Date.now()
    };
  }
}

export class DOCXFileProcessor implements FileProcessor {
  canProcess(mimeType: string): boolean {
    return mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }

  async process(file: ArrayBuffer, fileName: string, mimeType: string): Promise<ProcessedFile> {
    const mammoth = await import("mammoth").then((m) => m.default);
    const result = await mammoth.extractRawText({ arrayBuffer: file });
    const textContent = result.value || "";
    const chunks = createFileChunks(crypto.randomUUID(), textContent);

    return {
      id: crypto.randomUUID(),
      fileName,
      mimeType,
      size: file.byteLength,
      textContent,
      chunks,
      extractedAt: Date.now()
    };
  }
}

export class ImageFileProcessor implements FileProcessor {
  canProcess(mimeType: string): boolean {
    return mimeType.startsWith("image/");
  }

  async process(file: ArrayBuffer, fileName: string, mimeType: string): Promise<ProcessedFile> {
    const base64 = btoa(String.fromCharCode(...new Uint8Array(file)));
    const dataUrl = `data:${mimeType};base64,${base64}`;
    const chunks = createFileChunks(crypto.randomUUID(), `[Image: ${fileName}]`);

    return {
      id: crypto.randomUUID(),
      fileName,
      mimeType,
      size: file.byteLength,
      textContent: `[Image: ${fileName}]`,
      chunks,
      extractedAt: Date.now()
    };
  }
}

export const fileProcessors: FileProcessor[] = [
  new TextFileProcessor(),
  new PDFFileProcessor(),
  new DOCXFileProcessor(),
  new ImageFileProcessor()
];

export function getProcessor(mimeType: string): FileProcessor | null {
  return fileProcessors.find((p) => p.canProcess(mimeType)) || null;
}

export async function processFile(file: ArrayBuffer, fileName: string, mimeType: string): Promise<ProcessedFile> {
  const processor = getProcessor(mimeType);
  if (!processor) {
    throw new Error(`Unsupported file type: ${mimeType}`);
  }
  return processor.process(file, fileName, mimeType);
}