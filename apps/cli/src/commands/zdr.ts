import chalk from "chalk";
import ora from "ora";
import { XAIClient } from "@gh0st/xai";

export async function runZDR() {
  console.log(chalk.bold.cyan("\n  ZDR Verification\n"));

  const config = await loadConfig();
  if (!config.xai.apiKey) {
    console.log(chalk.red("  No xAI API key configured. Run 'gh0st doctor' to set up."));
    process.exit(1);
  }

  const client = new XAIClient({
    apiKey: config.xai.apiKey,
    baseUrl: config.xai.baseUrl
  });

  const spinner = ora("Running ZDR preflight check...").start();

  try {
    const result = await client.verifyZDR();

    if (result.verified) {
      spinner.succeed("ZDR VERIFIED");
      console.log(chalk.green(`\n  Zero Data Retention is active for this API key.`));
      console.log(chalk.gray(`  Header: x-zero-data-retention: ${result.headerValue}`));
      console.log(chalk.gray(`  Verified at: ${new Date(result.timestamp).toISOString()}`));
    } else {
      spinner.fail("ZDR NOT VERIFIED");
      console.log(chalk.red(`\n  Zero Data Retention could not be verified.`));
      console.log(chalk.gray(`  Header: x-zero-data-retention: ${result.headerValue || "missing"}`));
      console.log(chalk.gray(`  Error: ${result.error}`));
      console.log(chalk.yellow("\n  This may mean:"));
      console.log(chalk.yellow("  - Your xAI account doesn't have ZDR enabled"));
      console.log(chalk.yellow("  - The API key doesn't have ZDR permissions"));
      console.log(chalk.yellow("  - Network issues prevented verification"));
      process.exit(1);
    }
  } catch (error) {
    spinner.fail("Verification failed");
    console.log(chalk.red(`\n  Error: ${error instanceof Error ? error.message : "Unknown error"}`));
    process.exit(1);
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