import chalk from "chalk";
import ora from "ora";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { XAIClient } from "@gh0st/xai";
import { createFileStorage } from "@gh0st/storage";
import { createFileBasedStorage } from "@gh0st/files";
import { vault } from "@gh0st/security";

interface DoctorOptions {
  fix?: boolean;
  setup?: boolean;
}

export async function runDoctor(options: DoctorOptions) {
  console.log(chalk.bold.cyan("\n  gh0st Doctor — Diagnostic Checks\n"));

  const checks: Array<{ name: string; pass: boolean; message: string }> = [];

  const spinner = ora("Running checks...").start();

  const config = await loadConfig();
  checks.push({
    name: "Config file",
    pass: !!config,
    message: config ? "Found at ~/.gh0st/config.json" : "Not found"
  });

  checks.push({
    name: "xAI API Key",
    pass: !!config.xai.apiKey,
    message: config.xai.apiKey ? "Configured" : "Missing — run setup"
  });

  if (config.xai.apiKey) {
    const client = new XAIClient({
      apiKey: config.xai.apiKey,
      baseUrl: config.xai.baseUrl
    });

    try {
      const zdrResult = await client.verifyZDR();
      checks.push({
        name: "ZDR Verification",
        pass: zdrResult.verified,
        message: zdrResult.verified ? "Verified" : `Failed: ${zdrResult.error}`
      });
    } catch {
      checks.push({
        name: "ZDR Verification",
        pass: false,
        message: "Network error"
      });
    }

    const caps = client.getCapabilities();
    checks.push({
      name: "HTTP Streaming",
      pass: caps.httpStreaming,
      message: caps.httpStreaming ? "Supported" : "Not supported"
    });

    checks.push({
      name: "WebSocket Streaming",
      pass: caps.websocketStreaming,
      message: caps.websocketStreaming ? "Supported" : "Not supported"
    });
  }

  try {
    const storage = await createFileStorage();
    checks.push({
      name: "File Storage",
      pass: storage.isReady(),
      message: storage.isReady() ? "Ready" : "Not initialized"
    });
    await storage.close();
  } catch {
    checks.push({
      name: "File Storage",
      pass: false,
      message: "Failed to initialize"
    });
  }

  try {
    const fileStorage = await createFileBasedStorage();
    checks.push({
      name: "File Storage (Files)",
      pass: true,
      message: "Ready"
    });
    await fileStorage.close();
  } catch {
    checks.push({
      name: "File Storage (Files)",
      pass: false,
      message: "Failed to initialize"
    });
  }

  checks.push({
    name: "Vault",
    pass: !vault.isLocked(),
    message: vault.isLocked() ? "Locked" : "Unlocked"
  });

  checks.push({
    name: "Crypto (Web Crypto API)",
    pass: typeof crypto !== "undefined" && !!crypto.subtle,
    message: crypto.subtle ? "Available" : "Not available"
  });

  spinner.stop();

  let allPass = true;
  for (const check of checks) {
    const status = check.pass ? chalk.green("✓") : chalk.red("✗");
    console.log(`  ${status} ${check.name}: ${check.message}`);
    if (!check.pass) allPass = false;
  }

  console.log();

  if (options.fix) {
    console.log(chalk.cyan("  Attempting fixes...\n"));
    await runFixes(config);
    console.log(chalk.green("\n  Fixes applied. Run 'gh0st doctor' again to verify.\n"));
    return;
  }

  if (options.setup) {
    await runSetup();
    return;
  }

  if (allPass) {
    console.log(chalk.green("  All checks passed! gh0st is ready to use.\n"));
  } else {
    console.log(chalk.yellow("  Some checks failed. Run 'gh0st doctor --fix' to attempt repairs.\n"));

    if (!config.xai.apiKey) {
      console.log(chalk.cyan("  To configure your xAI API key:"));
      console.log(chalk.gray("  1. Get an API key from https://console.x.ai"));
      console.log(chalk.gray("  2. Run: gh0st doctor --setup"));
      console.log();
    }
  }
}

async function runFixes(config: any) {
  const fsFix = await import("fs/promises");
  const pathFix = await import("path");
  const osFix = await import("os");

  // Ensure config directory exists
  const configDir = pathFix.join(osFix.homedir(), ".gh0st");
  await fsFix.mkdir(configDir, { recursive: true });

  // Ensure storage directory exists
  const storageDir = pathFix.join(configDir, "storage");
  await fsFix.mkdir(storageDir, { recursive: true });
  await fsFix.mkdir(pathFix.join(storageDir, "conversations"), { recursive: true });
  await fsFix.mkdir(pathFix.join(storageDir, "messages"), { recursive: true });
  await fsFix.mkdir(pathFix.join(storageDir, "attachments"), { recursive: true });
  await fsFix.mkdir(pathFix.join(storageDir, "agents"), { recursive: true });
  await fsFix.mkdir(pathFix.join(storageDir, "tool-events"), { recursive: true });
  await fsFix.mkdir(pathFix.join(storageDir, "usage"), { recursive: true });
  await fsFix.mkdir(pathFix.join(storageDir, "continuations"), { recursive: true });

  console.log(chalk.green("  ✓ Created storage directories"));
}

async function runSetup() {
  const fsSetup = await import("fs/promises");
  const pathSetup = await import("path");
  const osSetup = await import("os");
  const readline = await import("node:readline/promises");
  const { stdin: input, stdout: output } = await import("node:process");

  console.log(chalk.bold.cyan("\n  gh0st Setup\n"));

  const rl = readline.createInterface({ input, output });

  const apiKey = await rl.question(chalk.blue("  Enter xAI API key: "));
  rl.close();

  if (!apiKey.trim()) {
    console.log(chalk.red("  No API key provided. Setup cancelled.\n"));
    return;
  }

  // Test the API key
  console.log(chalk.gray("  Testing connection..."));
  const { XAIClient } = await import("@gh0st/xai");
  const client = new XAIClient({ apiKey: apiKey.trim(), baseUrl: "https://api.x.ai/v1" });

  try {
    const zdrResult = await client.verifyZDR();
    if (zdrResult.verified) {
      console.log(chalk.green("  ✓ ZDR verified"));
    } else {
      console.log(chalk.yellow(`  ⚠ ZDR not verified: ${zdrResult.error}`));
      console.log(chalk.gray("  You can still use gh0st, but strict mode will be disabled."));
    }
  } catch (error) {
    console.log(chalk.red(`  ✗ Connection test failed: ${error instanceof Error ? error.message : "Unknown error"}`));
    console.log(chalk.gray("  You can still save the key and test later."));
  }

  // Save config
  const config = {
    xai: { apiKey: apiKey.trim(), baseUrl: "https://api.x.ai/v1", timeout: 60000 },
    privacy: { strictMode: true, storeConversations: false, telemetryEnabled: false },
    ui: { theme: "system", compactMode: false, showTokenCounts: true },
    storage: { encryptAttachments: true, maxAttachmentSize: 50 * 1024 * 1024 },
    model: "grok-3"
  };

  const fsSetup2 = await import("fs/promises");
  const pathSetup2 = await import("path");
  const osSetup2 = await import("os");

  const configDir = pathSetup2.join(osSetup2.homedir(), ".gh0st");
  await fsSetup2.mkdir(configDir, { recursive: true });
  await fsSetup2.writeFile(pathSetup2.join(configDir, "config.json"), JSON.stringify(config, null, 2));

  console.log(chalk.green("\n  ✓ Configuration saved to ~/.gh0st/config.json"));
  console.log(chalk.gray("  Run 'gh0st doctor' to verify setup.\n"));
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