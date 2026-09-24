import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}
export function formatBytes(bytes, decimals = 2) {
    if (bytes === 0)
        return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}
export function formatDuration(ms) {
    if (ms < 1000)
        return `${ms}ms`;
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60)
        return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60)
        return `${minutes}m ${seconds % 60}s`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
}
export function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 60000)
        return "just now";
    if (diff < 3600000)
        return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000)
        return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000)
        return `${Math.floor(diff / 86400000)}d ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
export function truncate(text, maxLength) {
    if (text.length <= maxLength)
        return text;
    return text.slice(0, maxLength - 3) + "...";
}
export function generateId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
export function debounce(fn, delay) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
}
export function throttle(fn, limit) {
    let inThrottle = false;
    return (...args) => {
        if (!inThrottle) {
            fn(...args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
}
//# sourceMappingURL=utils.js.map