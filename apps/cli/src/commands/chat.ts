import chalk from "chalk";
import ora from "ora";
import { XAIClient } from "@gh0st/xai";
import { vault, KEY_PURPOSES } from "@gh0st/security";
import { createFileStorage } from "@gh0st/storage";
import { createFileBasedStorage, processFile } from "@gh0st/files";
import { Message, Conversation, SUPPORTED_MODELS, DEFAULT_MODEL } from "@gh0st/core";
import { stdin as input, stdout as output } from "node:process";
import * as readline from "node:readline/promises";
import { marked } from "marked";
import markedTerminal from "marked-terminal";

marked.setOptions({
  renderer: new markedTerminal()
});

interface ChatOptions {
  model?: string;
  agent?: string;
  strict?: boolean;
}

export async function runChat(options: ChatOptions) {
  console.log(chalk.bold.cyan("\n  gh0st — Private AI Chat"));
  console.log(chalk.gray("  Type /help for commands, /exit to quit\n"));

  const storage = await createFileStorage();
  const fileStorage = await createFileBasedStorage();

  const config = await loadConfig();
  if (!config.xai.apiKey) {
    console.log(chalk.yellow("  No xAI API key configured. Run 'gh0st doctor' to set up."));
    return;
  }

  const client = new XAIClient({
    apiKey: config.xai.apiKey,
    baseUrl: config.xai.baseUrl,
    defaultModel: options.model || config.model || DEFAULT_MODEL,
    defaultStore: !options.strict && !config.privacy.strictMode
  });

  if (options.strict || config.privacy.strictMode) {
    const spinner = ora("Verifying ZDR...").start();
    const zdrResult = await client.verifyZDR();
    if (!zdrResult.verified) {
      spinner.fail("ZDR verification failed");
      console.log(chalk.red("  Cannot proceed in strict mode without verified ZDR."));
      return;
    }
    spinner.succeed("ZDR verified");
  }

  let currentConversationId: string | null = null;
  let messages: Message[] = [];

  const rl = readline.createInterface({ input, output });

  const printHelp = () => {
    console.log(chalk.gray("\n  Commands:"));
    console.log(chalk.gray("    /help          Show this help"));
    console.log(chalk.gray("    /exit          Exit chat"));
    console.log(chalk.gray("    /new           Start new conversation"));
    console.log(chalk.gray("    /chats         List conversations"));
    console.log(chalk.gray("    /load <id>     Load conversation"));
    console.log(chalk.gray("    /save          Save current conversation"));
    console.log(chalk.gray("    /model <name>  Switch model"));
    console.log(chalk.gray("    /attach <path> Attach file"));
    console.log(chalk.gray("    /clear         Clear screen\n"));
  };

  const printMarkdown = (text: string) => {
    console.log(marked.parse(text));
  };

  const streamResponse = async (userMessage: Message) => {
    messages.push(userMessage);
    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      conversationId: currentConversationId || "",
      role: "assistant",
      content: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    messages.push(assistantMessage);

    let accumulatedContent = "";
    process.stdout.write(chalk.green("  Grok: "));

    try {
      for await (const chunk of client.streamChat({
        model: options.model || config.model || DEFAULT_MODEL,
        messages: messages.map((m) => ({
          role: m.role as "user" | "assistant" | "system",
          content: m.content.map((p) => p.text || "").join("\n")
        })),
        stream: true,
        store: !options.strict && !config.privacy.strictMode
      })) {
        const delta = chunk.choices[0]?.delta;
        if (delta?.content) {
          accumulatedContent += delta.content;
          process.stdout.write(delta.content);
        }
      }
      console.log("\n");

      assistantMessage.content = [{ type: "text", text: accumulatedContent }];
      assistantMessage.updatedAt = Date.now();

      if (currentConversationId) {
        await storage.messages.update(assistantMessage.id, { content: assistantMessage.content });
      }
    } catch (error) {
      console.log(chalk.red(`\n  Error: ${error instanceof Error ? error.message : "Unknown error"}\n`));
    }
  };

  const newConversation = async () => {
    currentConversationId = crypto.randomUUID();
    const conversation: Conversation = {
      id: currentConversationId,
      title: "New Chat",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      model: options.model || config.model || DEFAULT_MODEL,
      archived: false,
      pinned: false,
      messageCount: 0
    };
    await storage.conversations.create(conversation);
    messages = [];
    console.log(chalk.green(`\n  Started new conversation: ${currentConversationId}\n`));
  };

  await newConversation();

  printHelp();

  while (true) {
    const line = await rl.question(chalk.blue("  You: "));
    const trimmed = line.trim();

    if (!trimmed) continue;

    if (trimmed.startsWith("/")) {
      const [cmd, ...args] = trimmed.slice(1).split(" ");

      switch (cmd) {
        case "help":
          printHelp();
          break;
        case "exit":
        case "quit":
          console.log(chalk.gray("\n  Goodbye!\n"));
          rl.close();
          return;
        case "new":
          await newConversation();
          break;
        case "chats":
          const chats = await storage.conversations.getAll({ limit: 20 });
          console.log(chalk.gray("\n  Conversations:"));
          chats.forEach((c) => {
            const marker = c.id === currentConversationId ? chalk.green("→") : " ";
            console.log(`  ${marker} ${c.id.slice(0, 8)}  ${c.title}  (${c.messageCount} msgs)`);
          });
          console.log();
          break;
        case "load":
          if (args[0]) {
            const conv = await storage.conversations.get(args[0]);
            if (conv) {
              currentConversationId = conv.id;
              messages = await storage.messages.getByConversation(conv.id);
              console.log(chalk.green(`\n  Loaded conversation: ${conv.title}\n`));
            } else {
              console.log(chalk.red("  Conversation not found"));
            }
          }
          break;
        case "model":
          if (args[0] && SUPPORTED_MODELS[args[0]]) {
            options.model = args[0];
            console.log(chalk.green(`\n  Switched to model: ${SUPPORTED_MODELS[args[0]].name}\n`));
          } else {
            console.log(chalk.gray("\n  Available models:"));
            Object.entries(SUPPORTED_MODELS).forEach(([k, v]) => {
              console.log(`    ${k} - ${v.name}`);
            });
            console.log();
          }
          break;
        case "attach":
          if (args[0]) {
            try {
              const fs = await import("fs/promises");
              const fileBuffer = await fs.readFile(args[0]);
              const arrayBuffer = fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength);
              const processed = await processFile(arrayBuffer, args[0].split("/").pop() || "file", "text/plain");
              const userMessage: Message = {
                id: crypto.randomUUID(),
                conversationId: currentConversationId || "",
                role: "user",
                content: [{ type: "text", text: `[Attached: ${processed.fileName}]\n\n${processed.textContent}` }],
                createdAt: Date.now(),
                updatedAt: Date.now()
              };
              await streamResponse(userMessage);
            } catch (e) {
              console.log(chalk.red(`  Failed to attach file: ${e instanceof Error ? e.message : "Unknown error"}`));
            }
          }
          break;
        case "clear":
          console.clear();
          break;
        default:
          console.log(chalk.yellow(`  Unknown command: ${cmd}. Type /help for help.`));
      }
    } else {
      const userMessage: Message = {
        id: crypto.randomUUID(),
        conversationId: currentConversationId || "",
        role: "user",
        content: [{ type: "text", text: trimmed }],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      await streamResponse(userMessage);
    }
  }
}

async function loadConfig() {
  const fs = await import("fs/promises");
  const path = await import("path");
  const os = await import("os");

  const configPath = path.join(os.homedir(), ".gh0st", "config.json");
  try {
    const data = await fs.readFile(configPath, "utf-8");
    return JSON.parse(data);
  } catch {
    return {
      xai: { apiKey: "", baseUrl: "https://api.x.ai/v1", timeout: 60000 },
      privacy: { strictMode: true, storeConversations: false, telemetryEnabled: false },
      ui: { theme: "system", compactMode: false, showTokenCounts: true },
      storage: { encryptAttachments: true, maxAttachmentSize: 50 * 1024 * 1024 },
      model: DEFAULT_MODEL
    };
  }
}