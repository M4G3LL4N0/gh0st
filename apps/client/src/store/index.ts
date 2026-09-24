import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { AppConfig, ModelInfo, Conversation, Message, Agent, PrivacyState, XAIAPIConfig } from "@gh0st/core";
import { SUPPORTED_MODELS, STARTER_AGENTS, DEFAULT_MODEL } from "@gh0st/core";

interface StoreState {
  initialized: boolean;
  config: AppConfig | null;
  privacyState: PrivacyState;
  conversations: Conversation[];
  currentConversationId: string | null;
  messages: Record<string, Message[]>;
  agents: Agent[];
  currentAgentId: string | null;
  theme: "light" | "dark" | "system";
  isStreaming: boolean;
  initialize: () => Promise<void>;
  setConfig: (config: Partial<AppConfig>) => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
  newChat: () => string;
  setCurrentConversation: (id: string | null) => void;
  addMessage: (conversationId: string, message: Message) => void;
  updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => void;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  deleteConversation: (id: string) => void;
  archiveConversation: (id: string) => void;
  addAgent: (agent: Omit<Agent, "id" | "createdAt" | "updatedAt">) => Agent;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  deleteAgent: (id: string) => void;
  setCurrentAgent: (id: string | null) => void;
  updatePrivacyState: (updates: Partial<PrivacyState>) => void;
  lockVault: () => void;
  unlockVault: () => void;
  setStreaming: (streaming: boolean) => void;
}

const DEFAULT_CONFIG: AppConfig = {
  xai: {
    apiKey: "",
    baseUrl: "https://api.x.ai/v1",
    timeout: 60000
  },
  privacy: {
    strictMode: true,
    storeConversations: false,
    telemetryEnabled: false
  },
  ui: {
    theme: "system",
    compactMode: false,
    showTokenCounts: true
  },
  storage: {
    encryptAttachments: true,
    maxAttachmentSize: 50 * 1024 * 1024
  },
  model: DEFAULT_MODEL,
  models: SUPPORTED_MODELS
};

const DEFAULT_PRIVACY_STATE: PrivacyState = {
  requestedStore: false,
  zdrVerified: false,
  localVaultLocked: true,
  telemetryEnabled: false,
  activeMcpDestinations: [],
  remoteToolsEnabled: false,
  runtimeMode: "browser"
};

const DEFAULT_AGENTS: Agent[] = STARTER_AGENTS.map((a, i) => ({
  ...a,
  id: `starter-${i}`,
  createdAt: Date.now(),
  updatedAt: Date.now()
}));

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      initialized: false,
      config: null,
      privacyState: DEFAULT_PRIVACY_STATE,
      conversations: [],
      currentConversationId: null,
      messages: {},
      agents: DEFAULT_AGENTS,
      currentAgentId: null,
      theme: "system",
      isStreaming: false,

      initialize: async () => {
        const storedConfig = localStorage.getItem("gh0st-config");
        let config: AppConfig = DEFAULT_CONFIG;

        if (storedConfig) {
          try {
            config = { ...DEFAULT_CONFIG, ...JSON.parse(storedConfig) };
          } catch {
            config = DEFAULT_CONFIG;
          }
        }

        const storedTheme = localStorage.getItem("gh0st-theme") as "light" | "dark" | "system" | null;
        const theme = storedTheme || "system";

        set({
          config,
          theme,
          initialized: true
        });

        if (theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
          document.documentElement.classList.add("dark");
        }
      },

      setConfig: (updates) => {
        const config = { ...get().config!, ...updates };
        localStorage.setItem("gh0st-config", JSON.stringify(config));
        set({ config });
      },

      setTheme: (theme) => {
        localStorage.setItem("gh0st-theme", theme);
        set({ theme });
        if (theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      },

      newChat: () => {
        const id = crypto.randomUUID();
        const conversation: Conversation = {
          id,
          title: "New Chat",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          model: get().config?.model || DEFAULT_MODEL,
          agentId: get().currentAgentId || undefined,
          archived: false,
          pinned: false,
          messageCount: 0
        };

        set((state) => ({
          conversations: [conversation, ...state.conversations],
          currentConversationId: id,
          messages: { ...state.messages, [id]: [] }
        }));

        return id;
      },

      setCurrentConversation: (id) => {
        set({ currentConversationId: id });
      },

      addMessage: (conversationId, message) => {
        set((state) => ({
          messages: {
            ...state.messages,
            [conversationId]: [...(state.messages[conversationId] || []), message]
          },
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? { ...c, messageCount: c.messageCount + 1, updatedAt: Date.now(), lastMessagePreview: message.content[0]?.text?.slice(0, 100) }
              : c
          )
        }));
      },

      updateMessage: (conversationId, messageId, updates) => {
        set((state) => ({
          messages: {
            ...state.messages,
            [conversationId]: state.messages[conversationId]?.map((m) =>
              m.id === messageId ? { ...m, ...updates } : m
            ) || []
          }
        }));
      },

      deleteConversation: (id) => {
        set((state) => {
          const { [id]: _, ...messages } = state.messages;
          return {
            conversations: state.conversations.filter((c) => c.id !== id),
            messages,
            currentConversationId: state.currentConversationId === id ? null : state.currentConversationId
          };
        });
      },

      archiveConversation: (id) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, archived: !c.archived } : c
          )
        }));
      },

      addAgent: (agent) => {
        const newAgent: Agent = {
          ...agent,
          id: crypto.randomUUID(),
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        set((state) => ({ agents: [...state.agents, newAgent] }));
        return newAgent;
      },

      updateAgent: (id, updates) => {
        set((state) => ({
          agents: state.agents.map((a) =>
            a.id === id ? { ...a, ...updates, updatedAt: Date.now() } : a
          )
        }));
      },

      deleteAgent: (id) => {
        set((state) => ({
          agents: state.agents.filter((a) => a.id !== id),
          currentAgentId: state.currentAgentId === id ? null : state.currentAgentId
        }));
      },

      setCurrentAgent: (id) => {
        set({ currentAgentId: id });
      },

      updatePrivacyState: (updates) => {
        set((state) => ({ privacyState: { ...state.privacyState, ...updates } }));
      },

      lockVault: () => {
        set((state) => ({ privacyState: { ...state.privacyState, localVaultLocked: true } }));
      },

      unlockVault: () => {
        set((state) => ({ privacyState: { ...state.privacyState, localVaultLocked: false } }));
      },

      setStreaming: (streaming) => {
        set({ isStreaming: streaming });
      },

      updateConversation: (id, updates) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          )
        }));
      }
    }),
    {
      name: "gh0st-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        config: state.config,
        theme: state.theme,
        agents: state.agents.filter((a) => !a.id.startsWith("starter-")),
        currentAgentId: state.currentAgentId
      })
    }
  )
);