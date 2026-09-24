import chalk from "chalk";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { createFileStorage } from "@gh0st/storage";
import { Agent, STARTER_AGENTS } from "@gh0st/core";

interface AgentsOptions {
  list?: boolean;
  create?: boolean;
}

export async function runAgents(options: AgentsOptions) {
  const storage = await createFileStorage();

  if (options.list || (!options.create && !options.list)) {
    const agents = await storage.agents.getAll();
    console.log(chalk.bold.cyan("\n  Agents\n"));

    const starterAgents = agents.filter((a) => a.id.startsWith("starter-"));
    const customAgents = agents.filter((a) => !a.id.startsWith("starter-"));

    if (starterAgents.length > 0) {
      console.log(chalk.gray("  Starter Agents:"));
      starterAgents.forEach((a) => {
        console.log(`    ${a.icon}  ${chalk.bold(a.name)}`);
        console.log(`       ${a.description}`);
        console.log(`       Model: ${a.model} | Tools: ${a.enabledTools.join(", ")}`);
        console.log();
      });
    }

    if (customAgents.length > 0) {
      console.log(chalk.gray("  Custom Agents:"));
      customAgents.forEach((a) => {
        console.log(`    ${a.icon}  ${chalk.bold(a.name)}`);
        console.log(`       ${a.description}`);
        console.log(`       Model: ${a.model} | Tools: ${a.enabledTools.join(", ")}`);
        console.log();
      });
    }

    if (agents.length === 0) {
      console.log(chalk.yellow("  No agents found."));
    }
    console.log();
  }

  if (options.create) {
    const rl = readline.createInterface({ input, output });
    console.log(chalk.bold.cyan("\n  Create New Agent\n"));

    const name = await rl.question(chalk.blue("  Name: "));
    const icon = await rl.question(chalk.blue("  Icon (emoji or lucide name): "));
    const description = await rl.question(chalk.blue("  Description: "));
    const instructions = await rl.question(chalk.blue("  Instructions: "));
    const model = await rl.question(chalk.blue(`  Model (${Object.keys(await import("@gh0st/core")).filter(k => k.endsWith("MODELS"))[0] || "grok-3"}): `)) || "grok-3";
    const toolsInput = await rl.question(chalk.blue("  Tools (comma-separated, e.g. web_search,code_execution): "));
    const tools = toolsInput.split(",").map((t) => t.trim()).filter(Boolean);

    const newAgent: Omit<Agent, "id" | "createdAt" | "updatedAt"> = {
      name: name.trim(),
      icon: icon.trim() || "bot",
      description: description.trim(),
      instructions: instructions.trim(),
      model: model.trim(),
      reasoningEffort: "medium",
      enabledTools: tools as any,
      attachedFileIds: [],
      mcpServerIds: []
    };

    const agent = await storage.agents.create(newAgent);
    console.log(chalk.green(`\n  Created agent: ${agent.name} (${agent.id})`));
    rl.close();
  }
}