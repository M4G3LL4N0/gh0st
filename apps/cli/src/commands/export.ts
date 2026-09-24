import chalk from "chalk";
import ora from "ora";
import { writeFileSync } from "fs";
import { createFileStorage } from "@gh0st/storage";
import { vault, KEY_PURPOSES, EncryptedPayload } from "@gh0st/security";
import { ExportPackage } from "@gh0st/core";

interface ExportOptions {
  output?: string;
  plaintext?: boolean;
}

export async function runExport(options: ExportOptions) {
  const storage = await createFileStorage();
  const exportData = await storage.exportImport.export();

  if (options.plaintext) {
    const outputPath = options.output || `gh0st-export-${Date.now()}.json`;
    writeFileSync(outputPath, JSON.stringify(exportData, null, 2));
    console.log(chalk.green(`\n  Exported to ${outputPath} (plaintext)`));
    console.log(chalk.yellow("  Warning: This export contains unencrypted data!"));
    return;
  }

  if (vault.isLocked()) {
    console.log(chalk.red("  Vault is locked. Unlock it first with your passphrase."));
    process.exit(1);
  }

  const spinner = ora("Encrypting export...").start();

  try {
    const exportPayload = await vault.encryptString(
      JSON.stringify(exportData),
      KEY_PURPOSES.EXPORT
    );

    const outputPackage = {
      version: 1,
      encrypted: true,
      exportedAt: Date.now(),
      payload: exportPayload
    };

    const outputPath = options.output || `gh0st-export-${Date.now()}.gh0st`;
    writeFileSync(outputPath, JSON.stringify(outputPackage, null, 2));

    spinner.succeed("Export encrypted");
    console.log(chalk.green(`\n  Encrypted export saved to ${outputPath}`));
  } catch (error) {
    spinner.fail("Export failed");
    console.log(chalk.red(`\n  Error: ${error instanceof Error ? error.message : "Unknown error"}`));
    process.exit(1);
  }
}