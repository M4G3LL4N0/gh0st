import React from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import { Message, MessageContentPart, MessageRole } from "@gh0st/core";
import { cn } from "@gh0st/ui";
import { Copy, Check, X, RefreshCw, MoreHorizontal, Bot, User, Terminal } from "lucide-react";
import { Badge } from "@gh0st/ui";
import { Dropdown, DropdownTrigger, DropdownContent, DropdownItem, DropdownSeparator } from "@gh0st/ui";
import { Tooltip } from "@gh0st/ui";
import { formatTimestamp } from "@gh0st/ui";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const [copied, setCopied] = React.useState(false);

  const roleIcons = {
    user: User,
    assistant: Bot,
    tool: Terminal,
    system: Terminal
  };

  const RoleIcon = roleIcons[message.role] || Bot;

  const handleCopy = async () => {
    const text = message.content.map((p) => p.text || "").join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRetry = () => {
    // TODO: Implement retry logic
  };

  const handleEdit = () => {
    // TODO: Implement edit logic
  };

  if (message.role === "system") {
    return (
      <div className="flex items-center justify-center my-4">
        <span className="px-3 py-1 text-xs text-muted-foreground bg-muted rounded-full">
          {message.content[0]?.text || "System message"}
        </span>
      </div>
    );
  }

  const isUser = message.role === "user";
  const isTool = message.role === "tool";

  return (
    <div
      className={cn(
        "flex gap-3 max-w-4xl",
        isUser && "justify-end",
        !isUser && "justify-start"
      )}
    >
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <RoleIcon className="h-4 w-4 text-primary" />
        </div>
      )}

      <div
        className={cn(
          "relative max-w-[70%]",
          isUser ? "text-right" : "text-left"
        )}
      >
        <div
          className={cn(
            "rounded-2xl px-4 py-2",
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-none"
              : isTool
              ? "bg-muted border border-border rounded-tl-none"
              : "bg-card border border-border rounded-tl-none"
          )}
        >
          {message.content.map((part, i) => (
            <MessageContent key={`${message.id}-${i}`} part={part} message={message} />
          ))}

          {message.error && (
            <div className="mt-2 p-2 text-sm text-destructive bg-destructive/10 rounded">
              <X className="h-3.5 w-3.5 inline mr-1" />
              {message.error}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 mt-1 px-1">
          <span className="text-xs text-muted-foreground">
            {formatTimestamp(message.createdAt)}
          </span>

          {message.usage && (
            <Badge variant="outline" className="text-xs">
              {message.usage.totalTokens} tokens
            </Badge>
          )}

          {!isUser && !isTool && (
            <Dropdown>
              <DropdownTrigger className="p-1 rounded hover:bg-accent opacity-0 group-hover:opacity-100" aria-label="Message options">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </DropdownTrigger>
              <DropdownContent align="end">
                <DropdownItem onClick={handleCopy}>
                  <Copy className="h-3.5 w-3.5 mr-2" />
                  {copied ? "Copied!" : "Copy"}
                </DropdownItem>
                <DropdownItem onClick={handleEdit}>
                  <Edit2 className="h-3.5 w-3.5 mr-2" />
                  Edit & Resend
                </DropdownItem>
                <DropdownItem onClick={handleRetry}>
                  <RefreshCw className="h-3.5 w-3.5 mr-2" />
                  Retry
                </DropdownItem>
              </DropdownContent>
            </Dropdown>
          )}
        </div>
      </div>

      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <User className="h-4 w-4 text-primary" />
        </div>
      )}
    </div>
  );
}

function MessageContent({ part, message }: { part: MessageContentPart; message: Message }) {
  switch (part.type) {
    case "text":
      return part.text ? (
        <ReactMarkdown
          components={{
            code: ({ children, className, ...props }) => {
              const classNameStr = className || "";
              const isInline = !classNameStr.includes("language-");
              if (isInline) {
                return <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>;
              }
              const language = classNameStr.replace("language-", "");
              return (
                <div className="relative my-2 rounded-lg bg-gray-900 overflow-hidden">
                  <div className="px-3 py-1.5 text-xs text-gray-400 border-b border-gray-700 flex items-center justify-between">
                    <span>{language}</span>
                    <CopyCode code={String(children)} />
                  </div>
                  <pre className="p-4 overflow-x-auto"><code className={cn("text-sm", classNameStr)}>{children}</code></pre>
                </div>
              );
            }
          }}
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
        >
          {part.text}
        </ReactMarkdown>
      ) : null;

    case "image":
      return part.imageUrl ? (
        <div className="my-2 rounded-lg overflow-hidden border border-border">
          <img
            src={part.imageUrl}
            alt={part.text || "Attached image"}
            className="max-w-full h-auto"
            loading="lazy"
          />
        </div>
      ) : null;

    case "file":
      return (
        <div className="my-2 flex items-center gap-2 p-2 bg-muted/50 rounded-lg border border-border">
          <FileIcon className="h-5 w-5 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{part.fileName || "File"}</p>
            <p className="text-xs text-muted-foreground">{part.mimeType}</p>
          </div>
        </div>
      );

    case "tool_call":
      return (
        <div className="my-2 p-3 bg-muted/50 rounded-lg border border-border">
          <div className="flex items-center gap-2 text-sm mb-1">
            <Terminal className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{part.toolName}</span>
            <Badge variant="outline" className="text-xs">Running</Badge>
          </div>
          <pre className="text-xs text-muted-foreground overflow-x-auto">
            {JSON.stringify(part.toolArgs, null, 2)}
          </pre>
        </div>
      );

    case "tool_result":
      return (
        <div className="my-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 text-sm mb-1">
            <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="font-medium">Tool Result</span>
            <Badge variant="success" className="text-xs">Completed</Badge>
          </div>
          <pre className="text-xs overflow-x-auto">{JSON.stringify(part.toolResult, null, 2)}</pre>
        </div>
      );

    case "citation":
      return part.citation ? (
        <a
          href={part.citation.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          <BookOpen className="h-3.5 w-3.5" />
          <span>{part.citation.title}</span>
        </a>
      ) : null;

    default:
      return null;
  }
}

function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Tooltip content={copied ? "Copied!" : "Copy code"}>
      <button onClick={handleCopy} className="p-1 rounded hover:bg-gray-700 transition-colors">
        <Copy className={cn("h-3.5 w-3.5", copied ? "text-green-400" : "text-gray-400")} />
      </button>
    </Tooltip>
  );
}

import { FileIcon, BookOpen, Edit2 } from "lucide-react";