import chalk from "chalk";
import { vault } from "@gh0st/security";

export async function runLock() {
  if (vault.isLocked()) {
    console.log(chalk.yellow("  Vault is already locked."));
    return;
  }

  vault.lock();
  console.log(chalk.green("  Vault locked."));
}