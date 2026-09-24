import { FileProcessor, ProcessedFile } from "./types.js";
export declare class TextFileProcessor implements FileProcessor {
    canProcess(mimeType: string): boolean;
    process(file: ArrayBuffer, fileName: string, mimeType: string): Promise<ProcessedFile>;
}
export declare class PDFFileProcessor implements FileProcessor {
    canProcess(mimeType: string): boolean;
    process(file: ArrayBuffer, fileName: string, mimeType: string): Promise<ProcessedFile>;
}
export declare class DOCXFileProcessor implements FileProcessor {
    canProcess(mimeType: string): boolean;
    process(file: ArrayBuffer, fileName: string, mimeType: string): Promise<ProcessedFile>;
}
export declare class ImageFileProcessor implements FileProcessor {
    canProcess(mimeType: string): boolean;
    process(file: ArrayBuffer, fileName: string, mimeType: string): Promise<ProcessedFile>;
}
export declare const fileProcessors: FileProcessor[];
export declare function getProcessor(mimeType: string): FileProcessor | null;
export declare function processFile(file: ArrayBuffer, fileName: string, mimeType: string): Promise<ProcessedFile>;
//# sourceMappingURL=processors.d.ts.map