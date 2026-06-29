-- SimLight PostgreSQL schema (Phase 5)

CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'faculty',
  org_id TEXT NOT NULL REFERENCES organizations(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS simulations (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  created_by TEXT NOT NULL REFERENCES users(id),
  meta JSONB NOT NULL,
  generated JSONB,
  scoring_type TEXT NOT NULL DEFAULT 'ai-assisted',
  visibility TEXT NOT NULL DEFAULT 'organization',
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  ai_generation_complete BOOLEAN NOT NULL DEFAULT FALSE,
  ai_generation_source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY,
  simulation_id TEXT NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  size TEXT,
  file_path TEXT NOT NULL,
  mime_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assignments (
  id TEXT PRIMARY KEY,
  simulation_id TEXT NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
  learner_name TEXT NOT NULL,
  learner_email TEXT,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  due_date TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  session_id TEXT
);

CREATE TABLE IF NOT EXISTS play_sessions (
  id TEXT PRIMARY KEY,
  simulation_id TEXT NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
  assignment_id TEXT REFERENCES assignments(id),
  learner_name TEXT NOT NULL,
  current_event_index INTEGER NOT NULL DEFAULT 0,
  score INTEGER NOT NULL DEFAULT 0,
  budget INTEGER NOT NULL DEFAULT 100,
  risk INTEGER NOT NULL DEFAULT 20,
  decisions_made JSONB NOT NULL DEFAULT '[]',
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_org ON users(org_id);
CREATE INDEX IF NOT EXISTS idx_simulations_org ON simulations(org_id);
CREATE INDEX IF NOT EXISTS idx_assets_simulation ON assets(simulation_id);
CREATE INDEX IF NOT EXISTS idx_play_sessions_simulation ON play_sessions(simulation_id);
CREATE INDEX IF NOT EXISTS idx_assignments_simulation ON assignments(simulation_id);
