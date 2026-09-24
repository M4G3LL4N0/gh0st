import chalk from "chalk";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { vault } from "@gh0st/security";
import { createFileStorage } from "@gh0st/storage";

interface WipeOptions {
  force?: boolean;
}

export async function runWipe(options: WipeOptions) {
  console.log(chalk.bold.red("\n  ⚠️  WARNING: This will permanently delete all gh0st data!\n"));
  console.log(chalk.gray("  This includes:"));
  console.log(chalk.gray("  - All conversations and messages"));
  console.log(chalk.gray("  - All agents"));
  console.log(chalk.gray("  - All attachments and files"));
  console.log(chalk.gray("  - All encrypted vault data"));
  console.log(chalk.gray("  - All settings and preferences\n"));

  if (!options.force) {
    const rl = readline.createInterface({ input, output });
    const confirm = await rl.question(chalk.red("  Type 'DELETE' to confirm: "));
    rl.close();

    if (confirm !== "DELETE") {
      console.log(chalk.yellow("\n  Aborted.\n"));
      return;
    }
  }

  console.log(chalk.gray("\n  Wiping data..."));

  try {
    vault.lock();

    const storage = await createFileStorage();
    await storage.close();

    const fs = await import("fs/promises");
    const path = await import("path");
    const os = await import("os");

    const dataDir = path.join(os.homedir(), ".gh0st");
    await fs.rm(dataDir, { recursive: true, force: true });

    console.log(chalk.green("\n  All gh0st data has been securely removed."));
    console.log(chalk.gray("  Note: Some data may remain in browser storage (IndexedDB)."));
    console.log(chalk.gray("  Clear browser data for complete removal.\n"));
  } catch (error) {
    console.log(chalk.red(`\n  Error during wipe: ${error instanceof Error ? error.message : "Unknown error"}`));
    process.exit(1);
  }
}