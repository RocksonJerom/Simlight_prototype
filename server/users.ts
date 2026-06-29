import { randomUUID } from 'crypto'
import { getDatabase } from './database.js'
import type { Organization, User, UserRole } from '../src/types/auth.js'

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48) || 'org'
}

export function createOrganization(name: string): Organization {
  const db = getDatabase()
  const id = randomUUID()
  const now = new Date().toISOString()
  let slug = slugify(name)
  const existing = db.prepare(`SELECT id FROM organizations WHERE slug = ?`).get(slug)
  if (existing) slug = `${slug}-${id.slice(0, 6)}`

  db.prepare(`INSERT INTO organizations (id, name, slug, created_at) VALUES (?, ?, ?, ?)`).run(
    id,
    name,
    slug,
    now
  )
  return { id, name, slug, createdAt: now }
}

export function getOrganization(id: string): Organization | null {
  const row = getDatabase().prepare(`SELECT * FROM organizations WHERE id = ?`).get(id) as
    | Record<string, string>
    | undefined
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    createdAt: row.created_at,
  }
}

export function createUser(data: {
  email: string
  passwordHash: string
  name: string
  role: UserRole
  orgId: string
}): User {
  const db = getDatabase()
  const id = randomUUID()
  const now = new Date().toISOString()
  db.prepare(`
    INSERT INTO users (id, email, password_hash, name, role, org_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, data.email.toLowerCase(), data.passwordHash, data.name, data.role, data.orgId, now)

  return {
    id,
    email: data.email.toLowerCase(),
    name: data.name,
    role: data.role,
    orgId: data.orgId,
    createdAt: now,
  }
}

export function findUserByEmail(email: string): (User & { passwordHash: string }) | null {
  const row = getDatabase()
    .prepare(`SELECT * FROM users WHERE email = ?`)
    .get(email.toLowerCase()) as Record<string, string> | undefined
  if (!row) return null
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role as UserRole,
    orgId: row.org_id,
    createdAt: row.created_at,
    passwordHash: row.password_hash,
  }
}

export function getUserById(id: string): User | null {
  const row = getDatabase().prepare(`SELECT * FROM users WHERE id = ?`).get(id) as
    | Record<string, string>
    | undefined
  if (!row) return null
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role as UserRole,
    orgId: row.org_id,
    createdAt: row.created_at,
  }
}

export function updateUserPassword(userId: string, passwordHash: string): void {
  getDatabase()
    .prepare(`UPDATE users SET password_hash = ? WHERE id = ?`)
    .run(passwordHash, userId)
}
