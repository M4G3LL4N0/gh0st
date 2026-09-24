import chalk from "chalk";
import { XAIClient } from "@gh0st/xai";
import { vault } from "@gh0st/security";
import { createFileStorage } from "@gh0st/storage";
import { createFileBasedStorage } from "@gh0st/files";

export async function runStatus() {
  console.log(chalk.bold.cyan("\n  gh0st Status\n"));

  const config = await loadConfig();
  const storage = await createFileStorage();
  const fileStorage = await createFileBasedStorage();

  console.log(chalk.gray("  Configuration:"));
  console.log(`    API Key: ${config.xai.apiKey ? chalk.green("Set") : chalk.red("Not set")}`);
  console.log(`    Base URL: ${config.xai.baseUrl}`);
  console.log(`    Model: ${config.model || "grok-3"}`);
  console.log(`    Strict Mode: ${config.privacy.strictMode ? chalk.green("Enabled") : chalk.yellow("Disabled")}`);
  console.log(`    Store Conversations: ${config.privacy.storeConversations ? chalk.green("Yes") : chalk.yellow("No")}`);
  console.log(`    Telemetry: ${config.privacy.telemetryEnabled ? chalk.green("Enabled") : chalk.yellow("Disabled")}`);

  console.log(chalk.gray("\n  Storage:"));
  const convCount = await storage.conversations.getCount();
  const archivedCount = await storage.conversations.getCount(true);
  console.log(`    Conversations: ${convCount} (${archivedCount} archived)`);
  const agentCount = (await storage.agents.getAll()).length;
  console.log(`    Agents: ${agentCount}`);
  const fileCount = (await fileStorage.getAll()).length;
  console.log(`    Files: ${fileCount}`);

  console.log(chalk.gray("\n  Vault:"));
  console.log(`    Locked: ${vault.isLocked() ? chalk.green("Yes") : chalk.yellow("No")}`);

  if (config.xai.apiKey) {
    console.log(chalk.gray("\n  xAI Connection:"));
    const client = new XAIClient({
      apiKey: config.xai.apiKey,
      baseUrl: config.xai.baseUrl
    });
    const caps = client.getCapabilities();
    console.log(`    HTTP Streaming: ${caps.httpStreaming ? chalk.green("Yes") : chalk.red("No")}`);
    console.log(`    WebSocket Streaming: ${caps.websocketStreaming ? chalk.green("Yes") : chalk.red("No")}`);
    console.log(`    ZDR Verification: ${caps.zdrVerification ? chalk.green("Yes") : chalk.red("No")}`);
    console.log(`    Continuation Support: ${caps.continuationSupport ? chalk.green("Yes") : chalk.red("No")}`);

    const zdrResult = await client.verifyZDR();
    console.log(`    ZDR Status: ${zdrResult.verified ? chalk.green("Verified") : chalk.red("Not Verified")}`);
    if (zdrResult.headerValue) {
      console.log(`    Header Value: ${zdrResult.headerValue}`);
    }
  }

  console.log();
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
      model: "grok-3"
    };
  }
}