import chalk from "chalk";
import { createFileStorage } from "@gh0st/storage";
import { formatTimestamp } from "@gh0st/ui";

interface ChatsOptions {
  all?: boolean;
}

export async function runChats(options: ChatsOptions) {
  const storage = await createFileStorage();

  const conversations = await storage.conversations.getAll({
    archived: options.all ? undefined : false,
    limit: 50
  });

  console.log(chalk.bold.cyan("\n  Conversations\n"));

  if (conversations.length === 0) {
    console.log(chalk.yellow("  No conversations found."));
    console.log();
    return;
  }

  conversations.forEach((c) => {
    const status = c.archived ? chalk.gray("[archived]") : c.pinned ? chalk.yellow("[pinned]") : "";
    console.log(`  ${chalk.bold(c.title)} ${status}`);
    console.log(`    ID: ${chalk.gray(c.id)}`);
    console.log(`    Model: ${c.model} | Messages: ${c.messageCount}`);
    console.log(`    Created: ${formatTimestamp(c.createdAt)} | Updated: ${formatTimestamp(c.updatedAt)}`);
    if (c.lastMessagePreview) {
      console.log(`    Last: ${chalk.gray(c.lastMessagePreview.slice(0, 80))}...`);
    }
    console.log();
  });

  console.log(chalk.gray(`  Showing ${conversations.length} conversation(s).`));
  console.log();
}