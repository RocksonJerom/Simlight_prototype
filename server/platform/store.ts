import { randomUUID } from 'crypto'
import bcrypt from 'bcryptjs'
import { getDatabase } from '../database.js'
import type {
  ConvertLeadInput,
  Course,
  Lead,
  LeadStatus,
  OrgGroup,
  OrgMember,
  PlatformStats,
  SimJobRole,
  Tagline,
} from '../../src/types/platform.js'

function now() {
  return new Date().toISOString()
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48)
}

export function initPlatformSchema() {
  const db = getDatabase()
  db.exec(`
    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      org_name TEXT NOT NULL,
      segment TEXT NOT NULL DEFAULT 'Enterprise',
      contact_name TEXT NOT NULL,
      contact_email TEXT,
      status TEXT NOT NULL DEFAULT 'NEW',
      notes TEXT,
      created_at TEXT NOT NULL,
      converted_org_id TEXT
    );

    CREATE TABLE IF NOT EXISTS courses (
      id TEXT PRIMARY KEY,
      org_id TEXT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      course_type TEXT NOT NULL DEFAULT 'Core',
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS taglines (
      id TEXT PRIMARY KEY,
      org_id TEXT,
      text TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sim_job_roles (
      id TEXT PRIMARY KEY,
      org_id TEXT,
      name TEXT NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS org_groups (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      member_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS org_members (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      role TEXT NOT NULL,
      group_id TEXT,
      created_at TEXT NOT NULL
    );
  `)

  const orgCols = db.prepare(`PRAGMA table_info(organizations)`).all() as { name: string }[]
  const addOrgCol = (col: string, def: string) => {
    if (!orgCols.some((c) => c.name === col)) db.exec(`ALTER TABLE organizations ADD COLUMN ${col} ${def}`)
  }
  addOrgCol('admin_slots', 'INTEGER NOT NULL DEFAULT 5')
  addOrgCol('participant_capacity', 'INTEGER NOT NULL DEFAULT 100')
  addOrgCol('ai_limit', 'INTEGER NOT NULL DEFAULT 5000')
  addOrgCol('lead_id', 'TEXT')

  seedPlatformDefaults()
}

function seedPlatformDefaults() {
  const db = getDatabase()
  const ts = now()
  const courseCount = (db.prepare(`SELECT COUNT(*) as c FROM courses`).get() as { c: number }).c
  if (courseCount === 0) {
  const courses: Omit<Course, 'id'>[] = [
    { name: 'Business Analytics', category: 'Analytics', courseType: 'Core', status: 'active', createdAt: ts },
    { name: 'Human Resource', category: 'Management', courseType: 'Elective', status: 'active', createdAt: ts },
    { name: 'SC Management', category: 'Logistics', courseType: 'Core', status: 'active', createdAt: ts },
    { name: 'Cryptography', category: 'Computer Science', courseType: 'Advanced', status: 'active', createdAt: ts },
    { name: 'Mechanical Engineering', category: 'Engineering', courseType: 'Core', status: 'active', createdAt: ts },
  ]
  for (const c of courses) {
    db.prepare(
      `INSERT INTO courses (id, org_id, name, category, course_type, status, created_at) VALUES (?, NULL, ?, ?, ?, ?, ?)`
    ).run(randomUUID(), c.name, c.category, c.courseType, c.status, c.createdAt)
  }

  const taglines = [
    'Think. Decide. Lead.',
    'Simulations that mirror the real world.',
    'Learn by doing — not by watching.',
  ]
  for (const text of taglines) {
    db.prepare(`INSERT INTO taglines (id, org_id, text, status, created_at) VALUES (?, NULL, ?, 'active', ?)`).run(
      randomUUID(),
      text,
      ts
    )
  }

  const roles = [
    { name: 'SUPPLY MANAGER', description: 'Procurement and supplier decisions' },
    { name: 'OPERATIONS LEAD', description: 'Day-to-day operations management' },
    { name: 'BUSINESS ANALYST', description: 'Data-driven strategic analysis' },
    { name: 'PROFESSOR', description: 'Academic oversight role' },
  ]
  for (const r of roles) {
    db.prepare(
      `INSERT INTO sim_job_roles (id, org_id, name, description, created_at) VALUES (?, NULL, ?, ?, ?)`
    ).run(randomUUID(), r.name, r.description, ts)
  }
  }

  const leadCount = (db.prepare(`SELECT COUNT(*) as c FROM leads`).get() as { c: number }).c
  if (leadCount === 0) {
    const seeds: Omit<Lead, 'id' | 'createdAt'>[] = [
      { orgName: 'Global Tech Inc', segment: 'Enterprise', contactName: 'Sarah Jenkins', status: 'CONVERTED' },
      { orgName: 'NexGen Media', segment: 'Startup', contactName: 'Michael Chen', status: 'IN PROGRESS' },
      { orgName: 'Arctic Solutions', segment: 'Partner', contactName: 'Elena Frost', status: 'NEW' },
      { orgName: 'Luna Platforms', segment: 'Enterprise', contactName: 'David Rossi', status: 'CONTACTED' },
    ]
    for (const l of seeds) {
      db.prepare(
        `INSERT INTO leads (id, org_name, segment, contact_name, status, created_at) VALUES (?, ?, ?, ?, ?, ?)`
      ).run(randomUUID(), l.orgName, l.segment, l.contactName, l.status, ts)
    }
  }

  const platformAdmin = db.prepare(`SELECT id FROM users WHERE email = ?`).get('admin@simlight.tech')
  if (!platformAdmin) {
    let orgId = (db.prepare(`SELECT id FROM organizations WHERE slug = 'simlight-platform'`).get() as { id: string } | undefined)?.id
    if (!orgId) {
      orgId = randomUUID()
      db.prepare(
        `INSERT INTO organizations (id, name, slug, created_at, admin_slots, participant_capacity, ai_limit)
         VALUES (?, 'SimLight Platform', 'simlight-platform', ?, 99, 9999, 50000)`
      ).run(orgId, ts)
    }
    const hash = bcrypt.hashSync('admin123', 10)
    db.prepare(
      `INSERT INTO users (id, email, password_hash, name, role, org_id, created_at) VALUES (?, ?, ?, ?, 'admin', ?, ?)`
    ).run(randomUUID(), 'admin@simlight.tech', hash, 'Platform Admin', orgId, ts)
    console.log('[Platform] Seeded superadmin: admin@simlight.tech / admin123')
  }
}

function rowToLead(r: Record<string, unknown>): Lead {
  return {
    id: r.id as string,
    orgName: r.org_name as string,
    segment: r.segment as string,
    contactName: r.contact_name as string,
    contactEmail: (r.contact_email as string) || undefined,
    status: r.status as LeadStatus,
    notes: (r.notes as string) || undefined,
    createdAt: r.created_at as string,
    convertedOrgId: (r.converted_org_id as string) || undefined,
  }
}

export function listLeads(q?: string): Lead[] {
  const db = getDatabase()
  let rows: Record<string, unknown>[]
  if (q?.trim()) {
    const like = `%${q.trim()}%`
    rows = db
      .prepare(
        `SELECT * FROM leads WHERE org_name LIKE ? OR contact_name LIKE ? OR segment LIKE ? ORDER BY created_at DESC`
      )
      .all(like, like, like) as Record<string, unknown>[]
  } else {
    rows = db.prepare(`SELECT * FROM leads ORDER BY created_at DESC`).all() as Record<string, unknown>[]
  }
  return rows.map(rowToLead)
}

export function getLead(id: string): Lead | null {
  const row = getDatabase().prepare(`SELECT * FROM leads WHERE id = ?`).get(id) as Record<string, unknown> | undefined
  return row ? rowToLead(row) : null
}

export function createLead(data: {
  orgName: string
  segment: string
  contactName: string
  contactEmail?: string
  notes?: string
}): Lead {
  const id = randomUUID()
  const ts = now()
  getDatabase()
    .prepare(
      `INSERT INTO leads (id, org_name, segment, contact_name, contact_email, status, notes, created_at)
       VALUES (?, ?, ?, ?, ?, 'NEW', ?, ?)`
    )
    .run(id, data.orgName, data.segment, data.contactName, data.contactEmail ?? null, data.notes ?? null, ts)
  return getLead(id)!
}

export function convertLead(leadId: string, input: ConvertLeadInput): { lead: Lead; orgId: string } {
  const db = getDatabase()
  const lead = getLead(leadId)
  if (!lead) throw new Error('Lead not found')
  if (lead.status === 'CONVERTED') throw new Error('Lead already converted')

  const orgId = randomUUID()
  const ts = now()
  let slug = slugify(lead.orgName)
  const existing = db.prepare(`SELECT id FROM organizations WHERE slug = ?`).get(slug)
  if (existing) slug = `${slug}-${orgId.slice(0, 6)}`

  db.prepare(
    `INSERT INTO organizations (id, name, slug, created_at, admin_slots, participant_capacity, ai_limit, lead_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(orgId, lead.orgName, slug, ts, input.adminSlots, input.participantCapacity, input.aiLimit, leadId)

  const hash = bcrypt.hashSync(input.adminPassword, 10)
  db.prepare(
    `INSERT INTO users (id, email, password_hash, name, role, org_id, created_at) VALUES (?, ?, ?, ?, 'admin', ?, ?)`
  ).run(randomUUID(), input.adminEmail, hash, input.adminName, orgId, ts)

  db.prepare(`UPDATE leads SET status = 'CONVERTED', converted_org_id = ? WHERE id = ?`).run(orgId, leadId)

  return { lead: getLead(leadId)!, orgId }
}

export function listCourses(orgId?: string): Course[] {
  const db = getDatabase()
  const rows = orgId
    ? (db
        .prepare(`SELECT * FROM courses WHERE org_id IS NULL OR org_id = ? ORDER BY name`)
        .all(orgId) as Record<string, unknown>[])
    : (db.prepare(`SELECT * FROM courses ORDER BY name`).all() as Record<string, unknown>[])
  return rows.map((r) => ({
    id: r.id as string,
    orgId: (r.org_id as string) || undefined,
    name: r.name as string,
    category: r.category as string,
    courseType: r.course_type as Course['courseType'],
    status: r.status as Course['status'],
    createdAt: r.created_at as string,
  }))
}

export function createCourse(data: {
  name: string
  category: string
  courseType: Course['courseType']
  orgId?: string
}): Course {
  const id = randomUUID()
  const ts = now()
  getDatabase()
    .prepare(
      `INSERT INTO courses (id, org_id, name, category, course_type, status, created_at) VALUES (?, ?, ?, ?, ?, 'active', ?)`
    )
    .run(id, data.orgId ?? null, data.name, data.category, data.courseType, ts)
  return listCourses().find((c) => c.id === id)!
}

export function listTaglines(): Tagline[] {
  return (getDatabase().prepare(`SELECT * FROM taglines ORDER BY created_at DESC`).all() as Record<string, unknown>[]).map(
    (r) => ({
      id: r.id as string,
      orgId: (r.org_id as string) || undefined,
      text: r.text as string,
      status: r.status as Tagline['status'],
      createdAt: r.created_at as string,
    })
  )
}

export function createTagline(text: string, orgId?: string): Tagline {
  const id = randomUUID()
  const ts = now()
  getDatabase()
    .prepare(`INSERT INTO taglines (id, org_id, text, status, created_at) VALUES (?, ?, ?, 'active', ?)`)
    .run(id, orgId ?? null, text, ts)
  return listTaglines().find((t) => t.id === id)!
}

export function listSimJobRoles(): SimJobRole[] {
  return (
    getDatabase().prepare(`SELECT * FROM sim_job_roles ORDER BY name`).all() as Record<string, unknown>[]
  ).map((r) => ({
    id: r.id as string,
    orgId: (r.org_id as string) || undefined,
    name: r.name as string,
    description: (r.description as string) || undefined,
    createdAt: r.created_at as string,
  }))
}

export function createSimJobRole(name: string, description?: string, orgId?: string): SimJobRole {
  const id = randomUUID()
  const ts = now()
  getDatabase()
    .prepare(`INSERT INTO sim_job_roles (id, org_id, name, description, created_at) VALUES (?, ?, ?, ?, ?)`)
    .run(id, orgId ?? null, name, description ?? null, ts)
  return listSimJobRoles().find((r) => r.id === id)!
}

export function listOrgGroups(orgId: string): OrgGroup[] {
  return (
    getDatabase().prepare(`SELECT * FROM org_groups WHERE org_id = ? ORDER BY name`).all(orgId) as Record<
      string,
      unknown
    >[]
  ).map((r) => ({
    id: r.id as string,
    orgId: r.org_id as string,
    name: r.name as string,
    description: (r.description as string) || undefined,
    memberCount: r.member_count as number,
    createdAt: r.created_at as string,
  }))
}

export function createOrgGroup(orgId: string, name: string, description?: string): OrgGroup {
  const id = randomUUID()
  const ts = now()
  getDatabase()
    .prepare(
      `INSERT INTO org_groups (id, org_id, name, description, member_count, created_at) VALUES (?, ?, ?, ?, 0, ?)`
    )
    .run(id, orgId, name, description ?? null, ts)
  return listOrgGroups(orgId).find((g) => g.id === id)!
}

export function listOrgMembers(orgId: string): OrgMember[] {
  return (
    getDatabase().prepare(`SELECT * FROM org_members WHERE org_id = ? ORDER BY name`).all(orgId) as Record<
      string,
      unknown
    >[]
  ).map((r) => ({
    id: r.id as string,
    orgId: r.org_id as string,
    name: r.name as string,
    email: r.email as string,
    role: r.role as OrgMember['role'],
    groupId: (r.group_id as string) || undefined,
    createdAt: r.created_at as string,
  }))
}

export function createOrgMember(
  orgId: string,
  data: { name: string; email: string; role: OrgMember['role']; groupId?: string }
): OrgMember {
  const id = randomUUID()
  const ts = now()
  getDatabase()
    .prepare(
      `INSERT INTO org_members (id, org_id, name, email, role, group_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(id, orgId, data.name, data.email, data.role, data.groupId ?? null, ts)
  if (data.groupId) {
    getDatabase()
      .prepare(`UPDATE org_groups SET member_count = member_count + 1 WHERE id = ?`)
      .run(data.groupId)
  }
  return listOrgMembers(orgId).find((m) => m.id === id)!
}

export function listOrganizations() {
  const db = getDatabase()
  return (
    db
      .prepare(
        `SELECT o.*, (SELECT COUNT(*) FROM users u WHERE u.org_id = o.id) as user_count,
         (SELECT COUNT(*) FROM simulations s WHERE s.org_id = o.id) as sim_count
         FROM organizations o ORDER BY o.created_at DESC`
      )
      .all() as Record<string, unknown>[]
  ).map((r) => ({
    id: r.id as string,
    name: r.name as string,
    slug: r.slug as string,
    createdAt: r.created_at as string,
    adminSlots: (r.admin_slots as number) ?? 5,
    participantCapacity: (r.participant_capacity as number) ?? 100,
    aiLimit: (r.ai_limit as number) ?? 5000,
    userCount: r.user_count as number,
    simCount: r.sim_count as number,
  }))
}

export function getPlatformStats(orgId?: string): PlatformStats {
  const db = getDatabase()
  const leads = (db.prepare(`SELECT COUNT(*) as c FROM leads`).get() as { c: number }).c
  const organizations = (db.prepare(`SELECT COUNT(*) as c FROM organizations`).get() as { c: number }).c
  const courses = (db.prepare(`SELECT COUNT(*) as c FROM courses`).get() as { c: number }).c
  const simCountStmt = orgId
    ? db.prepare(`SELECT COUNT(*) as c FROM simulations WHERE org_id = ?`)
    : db.prepare(`SELECT COUNT(*) as c FROM simulations`)
  const simulations = ((orgId ? simCountStmt.get(orgId) : simCountStmt.get()) as { c: number }).c
  const pubStmt = orgId
    ? db.prepare(`SELECT COUNT(*) as c FROM simulations WHERE org_id = ? AND is_published = 1`)
    : db.prepare(`SELECT COUNT(*) as c FROM simulations WHERE is_published = 1`)
  const publishedSimulations = ((orgId ? pubStmt.get(orgId) : pubStmt.get()) as { c: number }).c
  const activeLearners = orgId
    ? (db.prepare(`SELECT COUNT(*) as c FROM users WHERE org_id = ? AND role = 'learner'`).get(orgId) as { c: number }).c
    : (db.prepare(`SELECT COUNT(*) as c FROM users WHERE role = 'learner'`).get() as { c: number }).c
  const monthStart = new Date()
  monthStart.setDate(1)
  const conversionsThisMonth = (
    db
      .prepare(`SELECT COUNT(*) as c FROM leads WHERE status = 'CONVERTED' AND created_at >= ?`)
      .get(monthStart.toISOString()) as { c: number }
  ).c
  return {
    leads,
    organizations,
    courses,
    simulations,
    publishedSimulations,
    activeLearners,
    conversionsThisMonth,
  }
}
