import { Client } from "@replit/object-storage";
import fs from "fs/promises";
import path from "path";
import { Readable } from "stream";

// Check if running in Replit environment
const isReplitEnvironment = process.env.REPL_ID !== undefined;

/**
 * Unified file storage interface that works in both Replit and local environments
 */
export class FileStorage {
  private objectStorage: Client | null = null;
  private localStoragePath: string;
  private initialized = false;

  constructor() {
    this.localStoragePath = path.join(process.cwd(), "uploads");
  }

  /**
   * Initialize storage (only needed for Replit Object Storage)
   */
  async init() {
    if (this.initialized) return;

    if (isReplitEnvironment) {
      try {
        this.objectStorage = new Client();
        console.log("✓ Using Replit Object Storage");
      } catch (error) {
        console.error("Failed to initialize Replit Object Storage, falling back to local storage");
        this.objectStorage = null;
      }
    } else {
      // Ensure local uploads directory exists
      await fs.mkdir(this.localStoragePath, { recursive: true });
      console.log("✓ Using local filesystem storage:", this.localStoragePath);
    }

    this.initialized = true;
  }

  /**
   * Upload a file from a buffer
   */
  async uploadFile(key: string, buffer: Buffer): Promise<{ ok: boolean; error?: string }> {
    await this.init();

    if (this.objectStorage) {
      // Use Replit Object Storage
      const result = await this.objectStorage.uploadFromBytes(key, buffer);
      return result;
    } else {
      // Use local filesystem
      try {
        const filePath = path.join(this.localStoragePath, key);
        const dir = path.dirname(filePath);
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(filePath, buffer);
        return { ok: true };
      } catch (error) {
        return { ok: false, error: String(error) };
      }
    }
  }

  /**
   * Download a file as a buffer
   */
  async downloadFile(key: string): Promise<{ ok: boolean; value?: Uint8Array; error?: string }> {
    await this.init();

    if (this.objectStorage) {
      // Use Replit Object Storage
      const result = await this.objectStorage.downloadAsBytes(key);
      return result;
    } else {
      // Use local filesystem
      try {
        const filePath = path.join(this.localStoragePath, key);
        const buffer = await fs.readFile(filePath);
        return { ok: true, value: new Uint8Array(buffer) };
      } catch (error) {
        return { ok: false, error: String(error) };
      }
    }
  }

  /**
   * Delete a file
   */
  async deleteFile(key: string): Promise<{ ok: boolean; error?: string }> {
    await this.init();

    if (this.objectStorage) {
      // Use Replit Object Storage
      const result = await this.objectStorage.delete(key);
      return result;
    } else {
      // Use local filesystem
      try {
        const filePath = path.join(this.localStoragePath, key);
        await fs.unlink(filePath);
        return { ok: true };
      } catch (error) {
        return { ok: false, error: String(error) };
      }
    }
  }

  /**
   * List all files (optional, for debugging)
   */
  async listFiles(): Promise<{ ok: boolean; value?: string[]; error?: string }> {
    await this.init();

    if (this.objectStorage) {
      // Use Replit Object Storage
      const result = await this.objectStorage.list();
      return result;
    } else {
      // Use local filesystem
      try {
        const files: string[] = [];
        const walkDir = async (dir: string, prefix = "") => {
          const entries = await fs.readdir(dir, { withFileTypes: true });
          for (const entry of entries) {
            const relativePath = path.join(prefix, entry.name);
            if (entry.isDirectory()) {
              await walkDir(path.join(dir, entry.name), relativePath);
            } else {
              files.push(relativePath);
            }
          }
        };
        await walkDir(this.localStoragePath);
        return { ok: true, value: files };
      } catch (error) {
        return { ok: false, error: String(error) };
      }
    }
  }

  /**
   * Check if running in Replit environment
   */
  isReplit(): boolean {
    return isReplitEnvironment;
  }
}

// Export singleton instance
export const fileStorage = new FileStorage();
