#!/usr/bin/env node
import { program } from "commander";
import chalk from "chalk";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const packageJson = JSON.parse(readFileSync(join(__dirname, "../package.json"), "utf-8"));

program
  .name("gh0st")
  .description("Private AI client — local-first, encrypted, xAI-powered")
  .version(packageJson.version);

program
  .command("chat")
  .description("Start an interactive chat session")
  .option("-m, --model <model>", "Model to use")
  .option("-a, --agent <agent>", "Agent to use")
  .option("--strict", "Enable strict privacy mode (store=false)")
  .action(async (options) => {
    const { runChat } = await import("./commands/chat.js");
    await runChat(options);
  });

program
  .command("ask <question>")
  .description("Ask a single question and get a response")
  .option("-m, --model <model>", "Model to use")
  .option("--strict", "Enable strict privacy mode")
  .action(async (question, options) => {
    const { runAsk } = await import("./commands/ask.js");
    await runAsk(question, options);
  });

program
  .command("web")
  .description("Start the local browser UI server")
  .option("-p, --port <port>", "Port to listen on", "1420")
  .option("--no-open", "Don't open browser automatically")
  .action(async (options) => {
    const { runWeb } = await import("./commands/web.js");
    await runWeb(options);
  });

program
  .command("status")
  .description("Show runtime, provider, and privacy status")
  .action(async () => {
    const { runStatus } = await import("./commands/status.js");
    await runStatus();
  });

program
  .command("zdr")
  .description("Run ZDR verification against xAI")
  .action(async () => {
    const { runZDR } = await import("./commands/zdr.js");
    await runZDR();
  });

program
  .command("agents")
  .description("List and manage agents")
  .option("-l, --list", "List all agents")
  .option("-c, --create", "Create a new agent interactively")
  .action(async (options) => {
    const { runAgents } = await import("./commands/agents.js");
    await runAgents(options);
  });

program
  .command("chats")
  .description("List local conversations")
  .option("-a, --all", "Include archived conversations")
  .action(async (options) => {
    const { runChats } = await import("./commands/chats.js");
    await runChats(options);
  });

program
  .command("export")
  .description("Export conversations (encrypted or plaintext)")
  .option("-o, --output <path>", "Output file path")
  .option("--plaintext", "Export as plaintext (not encrypted)")
  .action(async (options) => {
    const { runExport } = await import("./commands/export.js");
    await runExport(options);
  });

program
  .command("import <file>")
  .description("Import a gh0st export")
  .action(async (file) => {
    const { runImport } = await import("./commands/import.js");
    await runImport(file);
  });

program
  .command("lock")
  .description("Lock the local vault")
  .action(async () => {
    const { runLock } = await import("./commands/lock.js");
    await runLock();
  });

program
  .command("wipe")
  .description("Securely remove gh0st user state")
  .option("--force", "Skip confirmation")
  .action(async (options) => {
    const { runWipe } = await import("./commands/wipe.js");
    await runWipe(options);
  });

program
  .command("doctor")
  .description("Run diagnostic checks")
  .option("--fix", "Attempt to fix common issues")
  .option("--setup", "Run interactive setup wizard")
  .action(async (options) => {
    const { runDoctor } = await import("./commands/doctor.js");
    await runDoctor(options);
  });

program.parseAsync(process.argv).catch((err) => {
  console.error(chalk.red("Error:"), err.message);
  process.exit(1);
});