import React, { useRef, useState, useCallback } from "react";
import { useStore } from "../store";
import { XAIClient, ChatOptions } from "@gh0st/xai";
import { vault, KEY_PURPOSES } from "@gh0st/security";
import { Attachment, Message, MessageContentPart, MessageRole } from "@gh0st/core";
import { cn } from "@gh0st/ui";
import { Button } from "@gh0st/ui";
import { Textarea } from "@gh0st/ui";
import { Dropdown, DropdownTrigger, DropdownContent, DropdownItem, DropdownSeparator, DropdownLabel } from "@gh0st/ui";
import { Tooltip } from "@gh0st/ui";
import {
  Send,
  Mic,
  Paperclip,
  X,
  Settings,
  Bot,
  Globe,
  Search,
  Terminal,
  Link2,
  Brain,
  Sparkles,
  Shield,
  Loader2
} from "lucide-react";

export function Composer() {
  const { currentConversationId, addMessage, updateMessage, config, currentAgentId, privacyState } = useStore();
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [showAgents, setShowAgents] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [toolToggles, setToolToggles] = useState<Record<string, boolean>>({
    web_search: true,
    x_search: true,
    code_execution: true,
    remote_mcp: false,
    deep_research: false
  });

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentConversationId || (input.trim() === "" && attachments.length === 0) || isStreaming) return;

    const contentParts: MessageContentPart[] = [];
    if (input.trim()) contentParts.push({ type: "text", text: input.trim() });

    for (const file of attachments) {
      contentParts.push({
        type: "file",
        fileName: file.name,
        mimeType: file.type,
        fileId: `temp-${file.name}-${Date.now()}`
      });
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      conversationId: currentConversationId,
      role: "user",
      content: contentParts,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    addMessage(currentConversationId, userMessage);
    setInput("");
    setAttachments([]);
    setIsStreaming(true);

    try {
      await streamResponse(currentConversationId, userMessage);
    } catch (error) {
      console.error("Stream error:", error);
    } finally {
      setIsStreaming(false);
    }
  }, [currentConversationId, input, attachments, isStreaming, addMessage]);

  const streamResponse = async (conversationId: string, userMessage: Message) => {
    if (!config?.xai.apiKey) {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        conversationId,
        role: "assistant",
        content: [{ type: "text", text: "Please configure your xAI API key in Settings." }],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        error: "Missing API key"
      };
      addMessage(conversationId, errorMessage);
      return;
    }

    const client = new XAIClient({
      apiKey: config.xai.apiKey,
      baseUrl: config.xai.baseUrl,
      defaultModel: config.model,
      defaultStore: !config.privacy.strictMode
    });

    const assistantMessageId = crypto.randomUUID();
    let accumulatedContent = "";
    let toolCalls: MessageContentPart[] = [];

    const assistantMessage: Message = {
      id: assistantMessageId,
      conversationId,
      role: "assistant",
      content: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    addMessage(conversationId, assistantMessage);

    const messages = useStore.getState().messages[conversationId] || [];
    const xaiMessages = messages.map((m) => ({
      role: m.role as "user" | "assistant" | "system",
      content: m.content.map((p) => p.text || "").join("\n")
    }));

    xaiMessages.push({ role: "user", content: userMessage.content.map((p) => p.text || "").join("\n") });

    const tools = Object.entries(toolToggles)
      .filter(([, enabled]) => enabled)
      .map(([type]) => ({ type: type as any }));

    try {
      for await (const chunk of client.streamChat({
        model: config.model,
        messages: xaiMessages,
        tools: tools.length > 0 ? tools : undefined,
        stream: true,
        store: !config.privacy.strictMode
      })) {
        const delta = chunk.choices[0]?.delta;
        if (delta?.content) {
          accumulatedContent += delta.content;
          updateMessage(conversationId, assistantMessageId, {
            content: [{ type: "text", text: accumulatedContent }],
            updatedAt: Date.now()
          });
        }
        if (delta?.tool_calls) {
          // Handle tool calls
        }
      }

      updateMessage(conversationId, assistantMessageId, {
        content: [{ type: "text", text: accumulatedContent }],
        usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0, model: config.model, timestamp: Date.now() }
      });
    } catch (error) {
      updateMessage(conversationId, assistantMessageId, {
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments((prev) => [...prev, ...newFiles]);
    }
    e.target.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit} className="border-t bg-card p-4">
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {attachments.map((file, i) => (
            <span key={i} className="flex items-center gap-1.5 px-2 py-1 bg-muted rounded-full text-sm">
              <Paperclip className="h-3.5 w-3.5" />
              <span className="truncate max-w-[150px]">{file.name}</span>
              <button
                type="button"
                onClick={() => removeAttachment(i)}
                className="p-0.5 rounded hover:bg-accent"
                aria-label="Remove attachment"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={config?.xai.apiKey ? "Message Grok..." : "Configure API key in Settings to start chatting"}
            disabled={isStreaming || !config?.xai.apiKey}
            className="min-h-[44px] max-h-[200px] pr-24 resize-none"
            rows={1}
            aria-label="Message input"
          />

          <div className="absolute bottom-2 right-2 flex items-center gap-1">
            <Tooltip content="Attach files">
              <label className="p-1.5 rounded hover:bg-accent cursor-pointer">
                <input type="file" multiple onChange={handleFileSelect} className="hidden" />
                <Paperclip className="h-5 w-5 text-muted-foreground hover:text-foreground" />
              </label>
            </Tooltip>

            <Dropdown>
              <DropdownTrigger className="p-1.5 rounded hover:bg-accent" aria-label="Tools">
                <Settings className="h-5 w-5 text-muted-foreground hover:text-foreground" />
              </DropdownTrigger>
              <DropdownContent align="end" className="w-56">
                <DropdownLabel>Tools</DropdownLabel>
                {Object.entries(toolToggles).map(([tool, enabled]) => (
                  <DropdownItem
                    key={tool}
                    onClick={() => setToolToggles((t) => ({ ...t, [tool]: !t[tool] }))}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      {tool === "web_search" && <Globe className="h-4 w-4" />}
                      {tool === "x_search" && <Search className="h-4 w-4" />}
                      {tool === "code_execution" && <Terminal className="h-4 w-4" />}
                      {tool === "remote_mcp" && <Link2 className="h-4 w-4" />}
                      {tool === "deep_research" && <Brain className="h-4 w-4" />}
                      <span className="capitalize">{tool.replace("_", " ")}</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={() => setToolToggles((t) => ({ ...t, [tool]: !t[tool] }))}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </DropdownItem>
                ))}
              </DropdownContent>
            </Dropdown>

            <Dropdown>
              <DropdownTrigger className="p-1.5 rounded hover:bg-accent" aria-label="Agents">
                <Bot className="h-5 w-5 text-muted-foreground hover:text-foreground" />
              </DropdownTrigger>
              <DropdownContent align="end" className="w-48">
                <DropdownLabel>Agents</DropdownLabel>
                <DropdownItem onClick={() => useStore.getState().setCurrentAgent(null)}>
                  <Sparkles className="h-3.5 w-3.5 mr-2" />
                  General
                </DropdownItem>
                <DropdownSeparator />
                {useStore.getState().agents.map((agent) => (
                  <DropdownItem
                    key={agent.id}
                    onClick={() => useStore.getState().setCurrentAgent(agent.id)}
                    className={currentAgentId === agent.id ? "bg-primary/10" : ""}
                  >
                    {agent.icon} {agent.name}
                  </DropdownItem>
                ))}
              </DropdownContent>
            </Dropdown>

            <Button
              type="submit"
              disabled={isStreaming || (input.trim() === "" && attachments.length === 0) || !config?.xai.apiKey}
              size="icon"
              className="text-primary hover:bg-primary/10"
              aria-label={isStreaming ? "Stop" : "Send"}
            >
              {isStreaming ? <X className="h-5 w-5" /> : <Send className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {isStreaming && (
        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Streaming response...</span>
        </div>
      )}

      {config?.privacy.strictMode && (
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <Shield className="h-3.5 w-3.5" />
          <span>Strict privacy mode: store=false, ZDR {privacyState?.zdrVerified ? "verified" : "not verified"}</span>
        </div>
      )}
    </form>
  );
}