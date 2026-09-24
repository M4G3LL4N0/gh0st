import chalk from "chalk";
import ora from "ora";
import { XAIClient } from "@gh0st/xai";
import { Message } from "@gh0st/core";
import { SUPPORTED_MODELS, DEFAULT_MODEL } from "@gh0st/core";
import { marked } from "marked";
import markedTerminal from "marked-terminal";

marked.setOptions({
  renderer: new markedTerminal()
});

interface AskOptions {
  model?: string;
  strict?: boolean;
}

export async function runAsk(question: string, options: AskOptions) {
  const config = await loadConfig();
  if (!config.xai.apiKey) {
    console.log(chalk.red("Error: No xAI API key configured. Run 'gh0st doctor' to set up."));
    process.exit(1);
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
      console.log(chalk.red("Cannot proceed in strict mode without verified ZDR."));
      process.exit(1);
    }
    spinner.succeed("ZDR verified");
  }

  const spinner = ora("Thinking...").start();

  try {
    const result = await client.chat({
      model: options.model || config.model || DEFAULT_MODEL,
      messages: [{ role: "user", content: question } as any],
      stream: false,
      store: !options.strict && !config.privacy.strictMode
    });

    spinner.stop();
    const content = result.response.choices[0]?.message?.content;
    const textContent = Array.isArray(content) ? content.map(c => c.text || "").join("\n") : (content || "");
    console.log(marked.parse(textContent));

    if (result.response.usage) {
      console.log(chalk.gray(`\nTokens: ${result.response.usage.total_tokens} (in: ${result.response.usage.prompt_tokens}, out: ${result.response.usage.completion_tokens})`));
    }
  } catch (error) {
    spinner.fail("Request failed");
    console.log(chalk.red(`Error: ${error instanceof Error ? error.message : "Unknown error"}`));
    process.exit(1);
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