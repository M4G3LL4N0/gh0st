import chalk from "chalk";
import ora from "ora";
import { readFileSync } from "fs";
import { createFileStorage } from "@gh0st/storage";
import { vault, KEY_PURPOSES } from "@gh0st/security";

export async function runImport(filePath: string) {
  const storage = await createFileStorage();

  console.log(chalk.bold.cyan("\n  Import gh0st Export\n"));

  let data: any;
  try {
    const content = readFileSync(filePath, "utf-8");
    data = JSON.parse(content);
  } catch (error) {
    console.log(chalk.red(`  Failed to read file: ${error instanceof Error ? error.message : "Unknown error"}`));
    process.exit(1);
  }

  if (data.encrypted && data.payload) {
    if (vault.isLocked()) {
      console.log(chalk.red("  Vault is locked. This export is encrypted."));
      console.log(chalk.gray("  Unlock the vault first, then try again."));
      process.exit(1);
    }

    const spinner = ora("Decrypting import...").start();

    try {
      const decrypted = await vault.decryptString(data.payload, KEY_PURPOSES.EXPORT);
      data = JSON.parse(decrypted);
      spinner.succeed("Import decrypted");
    } catch (error) {
      spinner.fail("Decryption failed");
      console.log(chalk.red(`  Failed to decrypt: ${error instanceof Error ? error.message : "Wrong key or corrupted data"}`));
      process.exit(1);
    }
  }

  if (!data.conversations || !data.messages) {
    console.log(chalk.red("  Invalid export format"));
    process.exit(1);
  }

  const spinner = ora("Importing data...").start();

  try {
    await storage.exportImport.import(data);
    spinner.succeed("Import complete");
    console.log(chalk.green(`\n  Imported ${data.conversations.length} conversations`));
    console.log(chalk.green(`  Imported ${data.messages.length} messages`));
    if (data.agents?.length) {
      console.log(chalk.green(`  Imported ${data.agents.length} agents`));
    }
  } catch (error) {
    spinner.fail("Import failed");
    console.log(chalk.red(`\n  Error: ${error instanceof Error ? error.message : "Unknown error"}`));
    process.exit(1);
  }

  console.log();
}