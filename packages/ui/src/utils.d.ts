import { type ClassValue } from "clsx";
export declare function cn(...inputs: ClassValue[]): string;
export declare function formatBytes(bytes: number, decimals?: number): string;
export declare function formatDuration(ms: number): string;
export declare function formatTimestamp(timestamp: number): string;
export declare function truncate(text: string, maxLength: number): string;
export declare function generateId(): string;
export declare function debounce<T extends (...args: unknown[]) => unknown>(fn: T, delay: number): (...args: Parameters<T>) => void;
export declare function throttle<T extends (...args: unknown[]) => unknown>(fn: T, limit: number): (...args: Parameters<T>) => void;
//# sourceMappingURL=utils.d.ts.map