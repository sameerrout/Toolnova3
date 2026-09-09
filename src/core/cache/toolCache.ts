import { ToolManifest } from '@/core/types/tool';

export interface CachedToolEntry {
  id: string;
  version: string;
  manifest: ToolManifest;
  installedAt: number;
  lastUsedAt: number;
  integrityHash?: string;
}

const DB_NAME = 'toolnova_tool_cache';
const DB_VERSION = 1;
const STORE_NAME = 'installed_tools';

export class BrowserToolCache {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private isSupported(): boolean {
    return typeof window !== 'undefined' && 'indexedDB' in window;
  }

  private getDB(): Promise<IDBDatabase> {
    if (!this.isSupported()) {
      return Promise.reject(new Error('IndexedDB is not supported in this environment.'));
    }

    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            store.createIndex('version', 'version', { unique: false });
            store.createIndex('lastUsedAt', 'lastUsedAt', { unique: false });
          }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }

    return this.dbPromise;
  }

  /**
   * Checks whether the tool is cached and matches the target version (§8).
   */
  public async checkVersion(
    toolId: string,
    targetVersion: string
  ): Promise<'MATCH' | 'UPDATE_REQUIRED' | 'NOT_CACHED'> {
    try {
      const entry = await this.getTool(toolId);
      if (!entry) return 'NOT_CACHED';
      if (entry.version === targetVersion) return 'MATCH';
      return 'UPDATE_REQUIRED';
    } catch {
      return 'NOT_CACHED';
    }
  }

  /**
   * Retrieves a cached tool and updates its lastUsed timestamp.
   */
  public async getTool(toolId: string): Promise<CachedToolEntry | null> {
    if (!this.isSupported()) return null;

    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(toolId);

      request.onsuccess = () => {
        const entry: CachedToolEntry | undefined = request.result;
        if (entry) {
          entry.lastUsedAt = Date.now();
          store.put(entry);
          resolve(entry);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Installs or updates a tool entry into the local cache (§7).
   */
  public async saveTool(
    manifest: ToolManifest,
    integrityHash?: string
  ): Promise<void> {
    if (!this.isSupported()) return;

    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      const entry: CachedToolEntry = {
        id: manifest.id,
        version: manifest.version,
        manifest,
        installedAt: Date.now(),
        lastUsedAt: Date.now(),
        integrityHash,
      };

      const request = store.put(entry);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Lists all cached tools installed in the user's browser.
   */
  public async listTools(): Promise<CachedToolEntry[]> {
    if (!this.isSupported()) return [];

    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Removes a tool from local cache.
   */
  public async removeTool(toolId: string): Promise<void> {
    if (!this.isSupported()) return;

    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(toolId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const toolCache = new BrowserToolCache();

