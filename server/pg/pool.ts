import pg from 'pg'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { config } from '../config.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

let pool: pg.Pool | null = null

export function getPool(): pg.Pool {
  if (!pool) {
    if (!config.databaseUrl) throw new Error('DATABASE_URL is not configured')
    pool = new pg.Pool({ connectionString: config.databaseUrl })
  }
  return pool
}

export async function initPostgres(): Promise<void> {
  const p = getPool()
  const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8')
  await p.query(schema)
  console.log('PostgreSQL schema initialized')
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
  }
}
