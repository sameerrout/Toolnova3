import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  salt: string;
  profile_image: string | null;
  auth_provider: 'local' | 'google';
  created_at: number;
  updated_at: number;
}

export interface SessionRecord {
  token: string;
  user_id: string;
  expires_at: number;
  created_at: number;
}

import os from 'node:os';

interface DatabaseSchema {
  users: UserRecord[];
  sessions: SessionRecord[];
}

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const DATA_DIR = isServerless
  ? path.join(os.tmpdir(), 'toolnova_data')
  : path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'toolnova_db.json');

class FileDatabase {
  private inMemoryData: DatabaseSchema | null = null;
  private isLoaded = false;

  private ensureDb(): DatabaseSchema {
    if (this.isLoaded && this.inMemoryData) {
      return this.inMemoryData;
    }

    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (!fs.existsSync(DB_FILE)) {
        const initial: DatabaseSchema = { users: [], sessions: [] };
        fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
        this.inMemoryData = initial;
        this.isLoaded = true;
        return initial;
      }

      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      this.inMemoryData = JSON.parse(raw);
      this.isLoaded = true;
      return this.inMemoryData!;
    } catch {
      const fallback: DatabaseSchema = { users: [], sessions: [] };
      this.inMemoryData = fallback;
      this.isLoaded = true;
      return fallback;
    }
  }

  private save(): void {
    if (!this.inMemoryData) return;
    try {
      const tempFile = `${DB_FILE}.${Date.now()}.tmp`;
      fs.writeFileSync(tempFile, JSON.stringify(this.inMemoryData, null, 2), 'utf-8');
      fs.renameSync(tempFile, DB_FILE);
    } catch (err) {
      console.error('[Database] Failed to write database file:', err);
    }
  }

  public async findUserByEmail(email: string): Promise<UserRecord | null> {
    const db = this.ensureDb();
    const normalized = email.toLowerCase().trim();
    const user = db.users.find((u) => u.email === normalized);
    return user || null;
  }

  public async findUserById(id: string): Promise<UserRecord | null> {
    const db = this.ensureDb();
    const user = db.users.find((u) => u.id === id);
    return user || null;
  }

  public async createUser(
    userData: Omit<UserRecord, 'id' | 'created_at' | 'updated_at'>
  ): Promise<UserRecord> {
    const db = this.ensureDb();
    const now = Date.now();
    const newUser: UserRecord = {
      ...userData,
      id: crypto.randomUUID(),
      email: userData.email.toLowerCase().trim(),
      created_at: now,
      updated_at: now,
    };

    db.users.push(newUser);
    this.save();
    return newUser;
  }

  public async createSession(
    userId: string,
    expiresInMs = 30 * 24 * 60 * 60 * 1000 // 30 days
  ): Promise<SessionRecord> {
    const db = this.ensureDb();
    const token = crypto.randomBytes(32).toString('hex');
    const now = Date.now();
    const session: SessionRecord = {
      token,
      user_id: userId,
      expires_at: now + expiresInMs,
      created_at: now,
    };

    // Clean up expired sessions for hygiene
    db.sessions = db.sessions.filter((s) => s.expires_at > now);
    db.sessions.push(session);
    this.save();
    return session;
  }

  public async findSession(
    token: string
  ): Promise<{ session: SessionRecord; user: UserRecord } | null> {
    const db = this.ensureDb();
    const now = Date.now();
    const session = db.sessions.find((s) => s.token === token);

    if (!session) return null;
    if (session.expires_at <= now) {
      // Expired session
      this.deleteSession(token);
      return null;
    }

    const user = db.users.find((u) => u.id === session.user_id);
    if (!user) return null;

    return { session, user };
  }

  public async deleteSession(token: string): Promise<void> {
    const db = this.ensureDb();
    db.sessions = db.sessions.filter((s) => s.token !== token);
    this.save();
  }
}

export const db = new FileDatabase();

