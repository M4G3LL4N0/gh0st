import { ModelInfo, Agent } from "./models.js";
export declare const DEFAULT_MODEL = "grok-3";
export declare const SUPPORTED_MODELS: Record<string, ModelInfo>;
export declare const STARTER_AGENTS: Omit<Agent, "id" | "createdAt" | "updatedAt">[];
export declare const SUPPORTED_ATTACHMENT_TYPES: string[];
export declare const MAX_ATTACHMENT_SIZE: number;
export declare const PRIVACY_MODES: {
    readonly STRICT: "strict";
    readonly BALANCED: "balanced";
    readonly PERMISSIVE: "permissive";
};
export type PrivacyMode = (typeof PRIVACY_MODES)[keyof typeof PRIVACY_MODES];
//# sourceMappingURL=constants.d.ts.map