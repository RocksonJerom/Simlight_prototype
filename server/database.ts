import Database from 'better-sqlite3'
import { randomUUID } from 'crypto'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync, mkdirSync } from 'fs'
import { migrateFromJson } from './migrate.js'
import { initPlatformSchema } from './platform/store.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
export const DATA_DIR = join(__dirname, 'data')
export const UPLOADS_DIR = join(DATA_DIR, 'uploads')
const DB_PATH = join(DATA_DIR, 'simlight.db')

let db: Database.Database | null = null

function initSchema(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS simulations (
      id TEXT PRIMARY KEY,
      meta TEXT NOT NULL,
      generated TEXT,
      scoring_type TEXT NOT NULL DEFAULT 'ai-assisted',
      visibility TEXT NOT NULL DEFAULT 'organization',
      is_published INTEGER NOT NULL DEFAULT 0,
      ai_generation_complete INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS assets (
      id TEXT PRIMARY KEY,
      simulation_id TEXT NOT NULL,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      size TEXT,
      file_path TEXT NOT NULL,
      mime_type TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (simulation_id) REFERENCES simulations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS assignments (
      id TEXT PRIMARY KEY,
      simulation_id TEXT NOT NULL,
      learner_name TEXT NOT NULL,
      learner_email TEXT,
      assigned_at TEXT NOT NULL,
      due_date TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      session_id TEXT,
      FOREIGN KEY (simulation_id) REFERENCES simulations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      simulation_id TEXT NOT NULL,
      assignment_id TEXT,
      learner_name TEXT NOT NULL,
      current_event_index INTEGER NOT NULL DEFAULT 0,
      score INTEGER NOT NULL DEFAULT 0,
      budget INTEGER NOT NULL DEFAULT 100,
      risk INTEGER NOT NULL DEFAULT 20,
      decisions_made TEXT NOT NULL DEFAULT '[]',
      completed INTEGER NOT NULL DEFAULT 0,
      started_at TEXT NOT NULL,
      completed_at TEXT,
      FOREIGN KEY (simulation_id) REFERENCES simulations(id) ON DELETE CASCADE,
      FOREIGN KEY (assignment_id) REFERENCES assignments(id)
    );

    CREATE INDEX IF NOT EXISTS idx_assets_simulation ON assets(simulation_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_simulation ON sessions(simulation_id);
    CREATE INDEX IF NOT EXISTS idx_assignments_simulation ON assignments(simulation_id);
  `)
  migrateSchema(database)
}

function migrateSchema(database: Database.Database) {
  const simCols = database.prepare(`PRAGMA table_info(simulations)`).all() as { name: string }[]
  if (!simCols.some((c) => c.name === 'ai_generation_source')) {
    database.exec(`ALTER TABLE simulations ADD COLUMN ai_generation_source TEXT`)
  }
  if (!simCols.some((c) => c.name === 'org_id')) {
    database.exec(`ALTER TABLE simulations ADD COLUMN org_id TEXT`)
  }
  if (!simCols.some((c) => c.name === 'created_by')) {
    database.exec(`ALTER TABLE simulations ADD COLUMN created_by TEXT`)
  }

  database.exec(`
    CREATE TABLE IF NOT EXISTS organizations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'faculty',
      org_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (org_id) REFERENCES organizations(id)
    );

    CREATE INDEX IF NOT EXISTS idx_users_org ON users(org_id);
    CREATE INDEX IF NOT EXISTS idx_simulations_org ON simulations(org_id);
  `)

  const addCol = (table: string, col: string, def: string) => {
    const cols = database.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]
    if (!cols.some((c) => c.name === col)) database.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`)
  }

  addCol('simulations', 'play_token', 'TEXT')
  addCol('simulations', 'version', 'INTEGER NOT NULL DEFAULT 1')
  addCol('simulations', 'v2_data', 'TEXT')
  addCol('simulations', 'report_config', 'TEXT')
  addCol('sessions', 'metric_scores', "TEXT NOT NULL DEFAULT '{}'")
  addCol('sessions', 'time_limit_seconds', 'INTEGER')
  addCol('sessions', 'expires_at', 'TEXT')
  addCol('sessions', 'user_id', 'TEXT')
  addCol('sessions', 'reg_number', 'TEXT')
  addCol('sessions', 'round_history', 'TEXT')
  addCol('sessions', 'scorecard', 'TEXT')
  addCol('assignments', 'invite_token', 'TEXT')
  addCol('assignments', 'user_id', 'TEXT')
  addCol('assignments', 'reg_number', 'TEXT')
  addCol('assignments', 'notified', 'INTEGER NOT NULL DEFAULT 0')

  database.exec(`
    CREATE TABLE IF NOT EXISTS org_invites (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL,
      email TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'faculty',
      token TEXT NOT NULL UNIQUE,
      invited_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      accepted_at TEXT,
      FOREIGN KEY (org_id) REFERENCES organizations(id)
    );

    CREATE TABLE IF NOT EXISTS password_resets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      used_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS email_log (
      id TEXT PRIMARY KEY,
      recipient TEXT NOT NULL,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `)

  initPlatformSchema()

  const orphanCount = database.prepare(
    `SELECT COUNT(*) as c FROM simulations WHERE org_id IS NULL`
  ).get() as { c: number }
  if (orphanCount.c > 0) {
    const existing = database.prepare(`SELECT id FROM organizations WHERE slug = 'legacy'`).get()
    let orgId: string
    if (existing) {
      orgId = (existing as { id: string }).id
    } else {
      orgId = randomUUID()
      const now = new Date().toISOString()
      database.prepare(
        `INSERT INTO organizations (id, name, slug, created_at) VALUES (?, ?, 'legacy', ?)`
      ).run(orgId, 'Legacy Organization', now)
    }
    database.prepare(`UPDATE simulations SET org_id = ? WHERE org_id IS NULL`).run(orgId)
  }
}

export function getDatabase(): Database.Database {
  if (!db) {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
    if (!existsSync(UPLOADS_DIR)) mkdirSync(UPLOADS_DIR, { recursive: true })

    db = new Database(DB_PATH)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    initSchema(db)
    migrateFromJson(db)
  }
  return db
}
