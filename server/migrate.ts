import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import type Database from 'better-sqlite3'
import type { SimulationRecord } from '../src/types/simulation.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SIMS_FILE = join(__dirname, 'data', 'simulations.json')
const SESSIONS_FILE = join(__dirname, 'data', 'sessions.json')

export function migrateFromJson(database: Database.Database) {
  const count = database.prepare('SELECT COUNT(*) as c FROM simulations').get() as { c: number }
  if (count.c > 0 || !existsSync(SIMS_FILE)) return

  const simulations = JSON.parse(readFileSync(SIMS_FILE, 'utf-8')) as SimulationRecord[]
  const sessions = existsSync(SESSIONS_FILE)
    ? (JSON.parse(readFileSync(SESSIONS_FILE, 'utf-8')) as Array<{
        id: string
        simulationId: string
        learnerName: string
        currentEventIndex: number
        score: number
        budget: number
        risk: number
        decisionsMade: unknown[]
        completed: boolean
        startedAt: string
        completedAt?: string
      }>)
    : []

  const insertSim = database.prepare(`
    INSERT INTO simulations (id, meta, generated, scoring_type, visibility, is_published, ai_generation_complete, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertSession = database.prepare(`
    INSERT INTO sessions (id, simulation_id, assignment_id, learner_name, current_event_index, score, budget, risk, decisions_made, completed, started_at, completed_at)
    VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const tx = database.transaction(() => {
    for (const sim of simulations) {
      insertSim.run(
        sim.id,
        JSON.stringify(sim.meta),
        sim.generated ? JSON.stringify(sim.generated) : null,
        sim.scoringType,
        sim.visibility,
        sim.isPublished ? 1 : 0,
        sim.aiGenerationComplete ? 1 : 0,
        sim.createdAt,
        sim.updatedAt
      )

      for (const asset of sim.assets ?? []) {
        database.prepare(`
          INSERT INTO assets (id, simulation_id, type, name, size, file_path, mime_type, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          asset.id,
          sim.id,
          asset.type,
          asset.name,
          asset.size ?? null,
          asset.url ?? `legacy/${asset.name}`,
          null,
          sim.updatedAt
        )
      }
    }

    for (const s of sessions) {
      insertSession.run(
        s.id,
        s.simulationId,
        s.learnerName,
        s.currentEventIndex,
        s.score,
        s.budget,
        s.risk,
        JSON.stringify(s.decisionsMade),
        s.completed ? 1 : 0,
        s.startedAt,
        s.completedAt ?? null
      )
    }
  })

  tx()
  console.log(`Migrated ${simulations.length} simulations from JSON to SQLite`)
}
