import React, { useRef, useEffect, useCallback } from "react";
import { useStore } from "../store";
import { Message } from "@gh0st/core";
import { MessageBubble } from "./MessageBubble";
import { ScrollArea } from "@gh0st/ui";
import { Loader2 } from "lucide-react";
import { cn } from "@gh0st/ui";

export function ChatArea() {
  const { currentConversationId, messages, config } = useStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = React.useState(true);

  const conversationMessages = currentConversationId ? messages[currentConversationId] || [] : [];

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (autoScroll) {
      scrollToBottom();
    }
  }, [conversationMessages.length, autoScroll, scrollToBottom]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const atBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 50;
    setAutoScroll(atBottom);
  };

  if (!currentConversationId) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background p-8">
        <div className="text-center max-w-md">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <MessageSquare className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">Welcome to gh0st</h2>
          <p className="text-muted-foreground mb-6">
            Start a new conversation to chat with Grok. Your data stays local and encrypted.
          </p>
          <div className="flex flex-col gap-2 max-w-xs mx-auto">
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
              New Chat
            </button>
            <p className="text-xs text-muted-foreground">
              Or select a conversation from the sidebar
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 overflow-hidden" type="auto">
      <div
        ref={viewportRef}
        onScroll={handleScroll}
        className="h-full w-full overflow-y-auto p-4 space-y-4"
      >
        {conversationMessages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {useStore.getState().isStreaming && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Loader2 className="h-5 w-5 text-primary animate-spin" />
            </div>
            <div className="flex-1">
              <div className="bg-muted rounded-lg p-3 animate-pulse">
                <div className="h-4 bg-muted-foreground/50 rounded w-3/4 mb-2" />
                <div className="h-4 bg-muted-foreground/50 rounded w-1/2" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {!autoScroll && (
        <button
          onClick={() => { setAutoScroll(true); scrollToBottom(); }}
          className="fixed bottom-20 right-4 z-10 rounded-full bg-primary p-2 shadow-lg hover:bg-primary/90 transition-colors"
          aria-label="Scroll to bottom"
        >
          <ChevronDown className="h-5 w-5 text-primary-foreground" />
        </button>
      )}
    </ScrollArea>
  );
}

import { MessageSquare, ChevronDown } from "lucide-react";