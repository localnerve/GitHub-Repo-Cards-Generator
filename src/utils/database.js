import { resolve } from 'node:path';
import Database from 'better-sqlite3';

// Use an absolute path so it always finds 'cache.db' in your project root
const dbPath = resolve('cache.db');
export const db = new Database(dbPath);

// Enable Write-Ahead Logging (WAL) for better concurrency
db.pragma('journal_mode = WAL');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS cache (
    user TEXT,
    repo_name TEXT,
    stars INTEGER,
    forks INTEGER,
    description TEXT,
    html_url TEXT,
    language TEXT,
    timestamp INTEGER,
    PRIMARY KEY (user, repo_name)
  );
`);