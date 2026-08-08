import Database from 'better-sqlite3';
import path from 'path';

// Prevent multiple database instances during development hot-reloads
const globalForDb = global as unknown as { db: Database.Database };

const dbPath = path.resolve(process.cwd(), 'tournament.db');

export const db = globalForDb.db || new Database(dbPath);

if (process.env.NODE_ENV !== 'production') {
  globalForDb.db = db;
}

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS tournament (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    state TEXT NOT NULL
  )
`);

export function getTournamentState(): string | null {
  try {
    const row = db.prepare('SELECT state FROM tournament WHERE id = 1').get() as { state: string } | undefined;
    return row ? row.state : null;
  } catch (e) {
    console.error('Error reading from SQLite database:', e);
    return null;
  }
}

export function saveTournamentState(stateJson: string) {
  try {
    db.prepare('INSERT OR REPLACE INTO tournament (id, state) VALUES (1, ?)')
      .run(stateJson);
  } catch (e) {
    console.error('Error writing to SQLite database:', e);
    throw e;
  }
}

export function deleteTournamentState() {
  try {
    db.prepare('DELETE FROM tournament WHERE id = 1').run();
  } catch (e) {
    console.error('Error deleting from SQLite database:', e);
    throw e;
  }
}
