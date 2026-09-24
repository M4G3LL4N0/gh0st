import chalk from "chalk";
import express from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import open from "open";
import { fileURLToPath } from "url";
import { dirname, join, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface WebOptions {
  port: string;
  open: boolean;
}

export async function runWeb(options: WebOptions) {
  const port = parseInt(options.port, 10);
  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({ server });

  const clientDist = resolve(__dirname, "../../client/dist");
  const hasClientBuild = await checkClientBuild(clientDist);

  if (!hasClientBuild) {
    console.log(chalk.yellow("  Client not built. Building..."));
    await buildClient();
  }

  app.use(express.json());
  app.use(express.static(clientDist));

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: Date.now() });
  });

  app.get("/api/config", (req, res) => {
    res.json({ version: "1.0.0-rc.1" });
  });

  wss.on("connection", (ws, req) => {
    const origin = req.headers.origin;
    if (origin && !isAllowedOrigin(origin)) {
      ws.close(4003, "Forbidden origin");
      return;
    }

    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());
        handleWSMessage(ws, message);
      } catch {
        ws.send(JSON.stringify({ type: "error", error: "Invalid message format" }));
      }
    });

    ws.send(JSON.stringify({ type: "connected", timestamp: Date.now() }));
  });

  server.listen(port, "127.0.0.1", () => {
    const url = `http://127.0.0.1:${port}`;
    console.log(chalk.green(`\n  gh0st UI running at ${url}`));
    console.log(chalk.gray("  Press Ctrl+C to stop\n"));

    if (options.open) {
      open(url).catch(() => {});
    }
  });

  process.on("SIGINT", () => {
    console.log(chalk.gray("\n  Shutting down..."));
    server.close(() => process.exit(0));
  });
}

async function checkClientBuild(distPath: string): Promise<boolean> {
  const fs = await import("fs/promises");
  try {
    await fs.access(join(distPath, "index.html"));
    return true;
  } catch {
    return false;
  }
}

async function buildClient() {
  return new Promise<void>((resolve, reject) => {
    const cp = require("child_process");
    const child = cp.spawn("pnpm", ["build:client"], {
      cwd: require("path").resolve(__dirname, "../../.."),
      stdio: ["ignore", "inherit", "inherit"],
      shell: true,
      windowsHide: true
    });
    child.on("close", (code: number | null) => {
      if (code === 0) resolve();
      else reject(new Error(`Build failed with code ${code}`));
    });
    child.on("error", (err: Error) => reject(err));
  });
}

function isAllowedOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    return url.hostname === "127.0.0.1" || url.hostname === "localhost";
  } catch {
    return false;
  }
}

function handleWSMessage(ws: any, message: any) {
  switch (message.type) {
    case "chat":
      handleChatMessage(ws, message);
      break;
    case "ping":
      ws.send(JSON.stringify({ type: "pong" }));
      break;
    default:
      ws.send(JSON.stringify({ type: "error", error: `Unknown message type: ${message.type}` }));
  }
}

async function handleChatMessage(ws: any, message: any) {
  ws.send(JSON.stringify({ type: "stream_start" }));

  try {
    // This would integrate with the XAI client
    // For now, send a mock response
    ws.send(JSON.stringify({
      type: "stream_chunk",
      content: "This is a mock response from the local gh0st server."
    }));
    ws.send(JSON.stringify({ type: "stream_end" }));
  } catch (error) {
    ws.send(JSON.stringify({
      type: "error",
      error: error instanceof Error ? error.message : "Unknown error"
    }));
  }
}