import { promises as fs } from "fs";
import { join } from "path";
import { homedir } from "os";
import { FileStorage, ProcessedFile } from "../types.js";

const GHOST_DIR = join(homedir(), ".gh0st");
const FILES_DIR = join(homedir(), ".gh0st", "files");

async function ensureDirs(): Promise<void> {
  await fs.mkdir(FILES_DIR, { recursive: true });
}

async function readJson<T>(filePath: string): Promise<T | null> {
  try {
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data) as T;
  } catch {
    return null;
  }
}

async function writeJson<T>(filePath: string, data: T): Promise<void> {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

async function listJsonFiles(dir: string): Promise<string[]> {
  try {
    const files = await fs.readdir(dir);
    return files.filter(f => f.endsWith(".json"));
  } catch {
    return [];
  }
}

export class FileBasedFileStorage implements FileStorage {
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    await fs.mkdir(FILES_DIR, { recursive: true });
    this.initialized = true;
  }

  async save(file: ProcessedFile): Promise<void> {
    await fs.mkdir(FILES_DIR, { recursive: true });
    await fs.writeFile(join(FILES_DIR, `${file.id}.json`), JSON.stringify(file, null, 2), "utf-8");
  }

  async get(fileId: string): Promise<ProcessedFile | null> {
    try {
      const data = await fs.readFile(join(FILES_DIR, `${fileId}.json`), "utf-8");
      return JSON.parse(data) as ProcessedFile;
    } catch {
      return null;
    }
  }

  async getAll(): Promise<ProcessedFile[]> {
    try {
      const files = await fs.readdir(FILES_DIR);
      const result: ProcessedFile[] = [];
      for (const file of files) {
        if (!file.endsWith(".json")) continue;
        const data = await fs.readFile(join(FILES_DIR, file), "utf-8").catch(() => null);
        if (!data) continue;
        const f = JSON.parse(data) as ProcessedFile;
        result.push(f);
      }
      return result;
    } catch {
      return [];
    }
  }

  async delete(fileId: string): Promise<void> {
    await fs.unlink(join(FILES_DIR, `${fileId}.json`)).catch(() => {});
  }

  async close(): Promise<void> {
    this.initialized = false;
  }
}

export async function createFileStorage(): Promise<FileBasedFileStorage> {
  const storage = new FileBasedFileStorage();
  await storage.initialize();
  return storage;
}