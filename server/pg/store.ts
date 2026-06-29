import { randomUUID } from 'crypto'
import { unlinkSync, existsSync } from 'fs'
import { basename } from 'path'
import { getPool } from './pool.js'
import { defaultMeta } from '../defaults.js'
import { formatFileSize, publicUploadUrl } from '../upload.js'
import type {
  SimulationRecord,
  SimulationMeta,
  PlaySession,
  MediaAsset,
  Assignment,
  SimulationAnalytics,
} from '../../src/types/simulation.js'
import type { Organization, User, UserRole } from '../../src/types/auth.js'

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'org'
}

async function loadAssets(simulationId: string): Promise<MediaAsset[]> {
  const { rows } = await getPool().query(
    `SELECT * FROM assets WHERE simulation_id = $1 ORDER BY created_at`,
    [simulationId]
  )
  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    name: row.name,
    size: row.size ?? undefined,
    url: publicUploadUrl(basename(row.file_path)),
  }))
}

async function rowToSimulation(row: Record<string, unknown>): Promise<SimulationRecord> {
  const meta = typeof row.meta === 'string' ? JSON.parse(row.meta) : row.meta
  const generated =
    row.generated == null
      ? null
      : typeof row.generated === 'string'
        ? JSON.parse(row.generated)
        : row.generated
  return {
    id: row.id as string,
    orgId: row.org_id as string,
    createdBy: row.created_by as string,
    meta: meta as SimulationMeta,
    generated: generated as SimulationRecord['generated'],
    assets: await loadAssets(row.id as string),
    scoringType: row.scoring_type as SimulationRecord['scoringType'],
    visibility: row.visibility as SimulationRecord['visibility'],
    isPublished: row.is_published as boolean,
    aiGenerationComplete: row.ai_generation_complete as boolean,
    aiGenerationSource: (row.ai_generation_source as SimulationRecord['aiGenerationSource']) ?? undefined,
    playToken: (row.play_token as string) ?? undefined,
    version: (row.version as number) ?? 1,
    createdAt: new Date(row.created_at as string).toISOString(),
    updatedAt: new Date(row.updated_at as string).toISOString(),
  }
}

export async function createOrganization(name: string): Promise<Organization> {
  const id = randomUUID()
  let slug = slugify(name)
  const dup = await getPool().query(`SELECT id FROM organizations WHERE slug = $1`, [slug])
  if (dup.rows.length) slug = `${slug}-${id.slice(0, 6)}`
  const { rows } = await getPool().query(
    `INSERT INTO organizations (id, name, slug) VALUES ($1, $2, $3) RETURNING *`,
    [id, name, slug]
  )
  const r = rows[0]
  return { id: r.id, name: r.name, slug: r.slug, createdAt: new Date(r.created_at).toISOString() }
}

export async function getOrganization(id: string): Promise<Organization | null> {
  const { rows } = await getPool().query(`SELECT * FROM organizations WHERE id = $1`, [id])
  if (!rows.length) return null
  const r = rows[0]
  return { id: r.id, name: r.name, slug: r.slug, createdAt: new Date(r.created_at).toISOString() }
}

export async function createUser(data: {
  email: string
  passwordHash: string
  name: string
  role: UserRole
  orgId: string
}): Promise<User> {
  const id = randomUUID()
  const { rows } = await getPool().query(
    `INSERT INTO users (id, email, password_hash, name, role, org_id) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [id, data.email.toLowerCase(), data.passwordHash, data.name, data.role, data.orgId]
  )
  const r = rows[0]
  return {
    id: r.id,
    email: r.email,
    name: r.name,
    role: r.role,
    orgId: r.org_id,
    createdAt: new Date(r.created_at).toISOString(),
  }
}

export async function findUserByEmail(email: string): Promise<(User & { passwordHash: string }) | null> {
  const { rows } = await getPool().query(`SELECT * FROM users WHERE email = $1`, [email.toLowerCase()])
  if (!rows.length) return null
  const r = rows[0]
  return {
    id: r.id,
    email: r.email,
    name: r.name,
    role: r.role,
    orgId: r.org_id,
    createdAt: new Date(r.created_at).toISOString(),
    passwordHash: r.password_hash,
  }
}

export async function getUserById(id: string): Promise<User | null> {
  const { rows } = await getPool().query(`SELECT * FROM users WHERE id = $1`, [id])
  if (!rows.length) return null
  const r = rows[0]
  return {
    id: r.id,
    email: r.email,
    name: r.name,
    role: r.role,
    orgId: r.org_id,
    createdAt: new Date(r.created_at).toISOString(),
  }
}

export async function listSimulations(orgId: string): Promise<SimulationRecord[]> {
  const { rows } = await getPool().query(
    `SELECT * FROM simulations WHERE org_id = $1 ORDER BY updated_at DESC`,
    [orgId]
  )
  return Promise.all(rows.map(rowToSimulation))
}

export async function getSimulation(
  id: string,
  opts?: { orgId?: string; allowPublic?: boolean }
): Promise<SimulationRecord | null> {
  const { rows } = await getPool().query(`SELECT * FROM simulations WHERE id = $1`, [id])
  if (!rows.length) return null
  const row = rows[0]
  if (opts?.orgId && row.org_id !== opts.orgId) {
    if (!opts.allowPublic || !row.is_published) return null
  }
  return rowToSimulation(row)
}

export async function createSimulation(
  meta: Partial<SimulationMeta> | undefined,
  orgId: string,
  userId: string
): Promise<SimulationRecord> {
  const id = randomUUID()
  const fullMeta = { ...defaultMeta, ...meta }
  await getPool().query(
    `INSERT INTO simulations (id, org_id, created_by, meta) VALUES ($1,$2,$3,$4)`,
    [id, orgId, userId, JSON.stringify(fullMeta)]
  )
  return (await getSimulation(id, { orgId }))!
}

export async function updateSimulation(
  id: string,
  orgId: string,
  updates: Partial<Omit<SimulationRecord, 'id' | 'createdAt' | 'assets' | 'orgId' | 'createdBy'>>
): Promise<SimulationRecord | null> {
  const existing = await getSimulation(id, { orgId })
  if (!existing) return null
  const merged = { ...existing, ...updates }
  await getPool().query(
    `UPDATE simulations SET meta=$1, generated=$2, scoring_type=$3, visibility=$4,
     is_published=$5, ai_generation_complete=$6, ai_generation_source=$7, updated_at=NOW()
     WHERE id=$8 AND org_id=$9`,
    [
      JSON.stringify(merged.meta),
      merged.generated ? JSON.stringify(merged.generated) : null,
      merged.scoringType,
      merged.visibility,
      merged.isPublished,
      merged.aiGenerationComplete,
      merged.aiGenerationSource ?? null,
      id,
      orgId,
    ]
  )
  return getSimulation(id, { orgId })
}

export async function deleteSimulation(id: string, orgId: string): Promise<boolean> {
  const sim = await getSimulation(id, { orgId })
  if (!sim) return false
  const { rows } = await getPool().query(`SELECT file_path FROM assets WHERE simulation_id = $1`, [id])
  for (const a of rows) {
    if (existsSync(a.file_path)) unlinkSync(a.file_path)
  }
  const result = await getPool().query(`DELETE FROM simulations WHERE id = $1 AND org_id = $2`, [id, orgId])
  return (result.rowCount ?? 0) > 0
}

export async function addAsset(
  simulationId: string,
  orgId: string,
  file: { path: string; originalname: string; size: number; mimetype: string },
  type: MediaAsset['type']
): Promise<MediaAsset | null> {
  if (!(await getSimulation(simulationId, { orgId }))) return null
  const id = randomUUID()
  const size = formatFileSize(file.size)
  await getPool().query(
    `INSERT INTO assets (id, simulation_id, type, name, size, file_path, mime_type) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [id, simulationId, type, file.originalname, size, file.path, file.mimetype]
  )
  await getPool().query(`UPDATE simulations SET updated_at = NOW() WHERE id = $1`, [simulationId])
  return { id, type, name: file.originalname, size, url: publicUploadUrl(basename(file.path)) }
}

export async function deleteAsset(simulationId: string, orgId: string, assetId: string): Promise<boolean> {
  const sim = await getSimulation(simulationId, { orgId })
  if (!sim) return false
  const { rows } = await getPool().query(`SELECT * FROM assets WHERE id = $1`, [assetId])
  if (!rows.length) return false
  if (existsSync(rows[0].file_path)) unlinkSync(rows[0].file_path)
  await getPool().query(`DELETE FROM assets WHERE id = $1`, [assetId])
  return true
}

export async function createAssignment(
  simulationId: string,
  orgId: string,
  data: { learnerName: string; learnerEmail?: string; dueDate?: string }
): Promise<Assignment | null> {
  if (!(await getSimulation(simulationId, { orgId }))?.isPublished) return null
  const id = randomUUID()
  await getPool().query(
    `INSERT INTO assignments (id, simulation_id, learner_name, learner_email, due_date, status) VALUES ($1,$2,$3,$4,$5,'pending')`,
    [id, simulationId, data.learnerName, data.learnerEmail ?? null, data.dueDate ?? null]
  )
  return getAssignment(id)
}

export async function getAssignment(id: string): Promise<Assignment | null> {
  const { rows } = await getPool().query(`SELECT * FROM assignments WHERE id = $1`, [id])
  if (!rows.length) return null
  const r = rows[0]
  return {
    id: r.id,
    simulationId: r.simulation_id,
    learnerName: r.learner_name,
    learnerEmail: r.learner_email ?? undefined,
    assignedAt: new Date(r.assigned_at).toISOString(),
    dueDate: r.due_date ?? undefined,
    status: r.status,
    sessionId: r.session_id ?? undefined,
  }
}

export async function listAssignments(simulationId: string, orgId: string): Promise<Assignment[]> {
  if (!(await getSimulation(simulationId, { orgId }))) return []
  const { rows } = await getPool().query(
    `SELECT * FROM assignments WHERE simulation_id = $1 ORDER BY assigned_at DESC`,
    [simulationId]
  )
  return rows.map((r) => ({
    id: r.id,
    simulationId: r.simulation_id,
    learnerName: r.learner_name,
    learnerEmail: r.learner_email ?? undefined,
    assignedAt: new Date(r.assigned_at).toISOString(),
    dueDate: r.due_date ?? undefined,
    status: r.status,
    sessionId: r.session_id ?? undefined,
  }))
}

export async function createSession(
  simulationId: string,
  learnerName: string,
  assignmentId?: string,
  _userId?: string
): Promise<PlaySession | null> {
  const sim = await getSimulation(simulationId, { allowPublic: true })
  if (!sim?.isPublished || !sim.generated) return null
  if (assignmentId) {
    const a = await getAssignment(assignmentId)
    if (!a || a.simulationId !== simulationId) return null
  }
  const id = randomUUID()
  await getPool().query(
    `INSERT INTO play_sessions (id, simulation_id, assignment_id, learner_name) VALUES ($1,$2,$3,$4)`,
    [id, simulationId, assignmentId ?? null, learnerName]
  )
  if (assignmentId) {
    await getPool().query(
      `UPDATE assignments SET status = 'in_progress', session_id = $1 WHERE id = $2`,
      [id, assignmentId]
    )
  }
  return getSession(id)
}

export async function getSession(id: string): Promise<PlaySession | null> {
  const { rows } = await getPool().query(`SELECT * FROM play_sessions WHERE id = $1`, [id])
  if (!rows.length) return null
  const r = rows[0]
  return {
    id: r.id,
    simulationId: r.simulation_id,
    assignmentId: r.assignment_id ?? undefined,
    learnerName: r.learner_name,
    currentEventIndex: r.current_event_index,
    score: r.score,
    budget: r.budget,
    risk: r.risk,
    decisionsMade: r.decisions_made,
    metricScores: {},
    completed: r.completed,
    startedAt: new Date(r.started_at).toISOString(),
    completedAt: r.completed_at ? new Date(r.completed_at).toISOString() : undefined,
  }
}

export async function updateSession(
  id: string,
  updates: Partial<Omit<PlaySession, 'id' | 'simulationId' | 'startedAt'>>
): Promise<PlaySession | null> {
  const existing = await getSession(id)
  if (!existing) return null
  const merged = { ...existing, ...updates }
  await getPool().query(
    `UPDATE play_sessions SET assignment_id=$1, learner_name=$2, current_event_index=$3, score=$4,
     budget=$5, risk=$6, decisions_made=$7, completed=$8, completed_at=$9 WHERE id=$10`,
    [
      merged.assignmentId ?? null,
      merged.learnerName,
      merged.currentEventIndex,
      merged.score,
      merged.budget,
      merged.risk,
      JSON.stringify(merged.decisionsMade),
      merged.completed,
      merged.completedAt ?? null,
      id,
    ]
  )
  if (merged.completed && merged.assignmentId) {
    await getPool().query(
      `UPDATE assignments SET status = 'completed', session_id = $1 WHERE id = $2`,
      [id, merged.assignmentId]
    )
  }
  return getSession(id)
}

export async function listSessionsForSimulation(simulationId: string): Promise<PlaySession[]> {
  const { rows } = await getPool().query(
    `SELECT * FROM play_sessions WHERE simulation_id = $1 ORDER BY started_at DESC`,
    [simulationId]
  )
  return rows.map((r) => ({
    id: r.id,
    simulationId: r.simulation_id,
    assignmentId: r.assignment_id ?? undefined,
    learnerName: r.learner_name,
    currentEventIndex: r.current_event_index,
    score: r.score,
    budget: r.budget,
    risk: r.risk,
    decisionsMade: r.decisions_made,
    metricScores: {},
    completed: r.completed,
    startedAt: new Date(r.started_at).toISOString(),
    completedAt: r.completed_at ? new Date(r.completed_at).toISOString() : undefined,
  }))
}

export async function getAnalytics(simulationId: string, orgId: string): Promise<SimulationAnalytics | null> {
  const sim = await getSimulation(simulationId, { orgId })
  if (!sim) return null
  const sessions = await listSessionsForSimulation(simulationId)
  const assignments = await listAssignments(simulationId, orgId)
  const completed = sessions.filter((s) => s.completed)
  const inProgress = sessions.filter((s) => !s.completed)
  const avgScore =
    completed.length > 0
      ? Math.round(completed.reduce((sum, s) => sum + s.score, 0) / completed.length)
      : 0

  const totalAttempts = Math.max(sessions.length, assignments.length, 1)
  const completionRate = Math.round((completed.length / totalAttempts) * 100)

  const skillDistribution = (sim.generated?.metrics ?? []).map((m) => {
    const vals = completed.map((s) => s.metricScores[m.id] ?? 0).filter((v) => v > 0)
    const avg = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0
    return { name: m.name, avg }
  })

  const scoreTrend = completed
    .slice(-8)
    .map((s, i) => ({ label: `S${i + 1}`, score: s.score }))

  const leaderboard = [...completed]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((s, i) => ({
      rank: i + 1,
      name: s.learnerName,
      score: s.score,
      xp: s.decisionsMade.reduce((sum, d) => sum + d.points, 0) + 150,
    }))

  return {
    simulationId,
    title: sim.meta.title,
    totalAssignments: assignments.length,
    completedSessions: completed.length,
    inProgressSessions: inProgress.length,
    avgScore,
    completionRate,
    activeLearners: inProgress.length + completed.length,
    skillDistribution,
    scoreTrend,
    leaderboard,
    sessions,
    assignments,
  }
}

export async function publishSimulation(
  id: string,
  orgId: string,
  visibility?: SimulationRecord['visibility']
): Promise<SimulationRecord | null> {
  const sim = await getSimulation(id, { orgId })
  if (!sim?.generated) return null
  return updateSimulation(id, orgId, {
    isPublished: true,
    visibility: visibility ?? sim.visibility,
    version: (sim.version ?? 1) + 1,
  })
}

export async function duplicateSimulation(
  id: string,
  orgId: string,
  userId: string
): Promise<SimulationRecord | null> {
  const sim = await getSimulation(id, { orgId })
  if (!sim) return null
  const copy = await createSimulation({ ...sim.meta, title: `${sim.meta.title} (Copy)` }, orgId, userId)
  return updateSimulation(copy.id, orgId, {
    generated: sim.generated,
    aiGenerationComplete: sim.aiGenerationComplete,
    aiGenerationSource: sim.aiGenerationSource,
    scoringType: sim.scoringType,
    visibility: sim.visibility,
  })
}

export async function listMarketplace(): Promise<
  import('../../src/types/extras.js').MarketplaceItem[]
> {
  const { rows } = await getPool().query(`
    SELECT s.id, s.meta, s.updated_at, o.name as org_name
    FROM simulations s
    JOIN organizations o ON o.id = s.org_id
    WHERE s.is_published = TRUE AND s.visibility = 'public'
    ORDER BY s.updated_at DESC
  `)
  return rows.map((r) => {
    const meta = r.meta as SimulationMeta
    return {
      id: r.id,
      title: meta.title,
      domain: meta.domain,
      industry: meta.industry,
      difficulty: meta.difficulty,
      duration: meta.duration,
      orgName: r.org_name,
      publishedAt: new Date(r.updated_at).toISOString(),
      playCount: 0,
      avgScore: 0,
    }
  })
}

export async function searchMarketplace(
  filters: import('../services/catalog.js').MarketplaceFilters = {}
): Promise<import('../../src/types/extras.js').MarketplaceItem[]> {
  const items = await listMarketplace()
  let result = items
  if (filters.q) {
    const q = filters.q.toLowerCase()
    result = result.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.domain.toLowerCase().includes(q) ||
        i.industry.toLowerCase().includes(q)
    )
  }
  if (filters.sort === 'popular') result = [...result].sort((a, b) => b.playCount - a.playCount)
  if (filters.limit) result = result.slice(0, filters.limit)
  return result
}

export async function getCatalogHome(): Promise<import('../../src/types/extras.js').CatalogHome> {
  const all = await listMarketplace()
  return {
    featured: all.slice(0, 6),
    newThisWeek: all.slice(0, 8),
    topPlayed: all.slice(0, 10),
    financialLiteracy: all.filter((i) => i.domain === 'Finance').slice(0, 8),
    operations: all
      .filter((i) => i.domain.includes('Operations') || i.domain.includes('Supply Chain'))
      .slice(0, 8),
    businessStrategy: all.filter((i) => i.domain === 'Business Strategy').slice(0, 8),
    leadership: all.filter((i) => i.domain === 'Human Resources').slice(0, 8),
  }
}

export async function getPublicSimulationDetail(
  id: string
): Promise<import('../../src/types/extras.js').PublicSimulationDetail | null> {
  const sim = await getSimulation(id, { allowPublic: true })
  if (!sim?.isPublished || sim.visibility !== 'public') return null
  const org = await getOrganization(sim.orgId)
  const item = (await listMarketplace()).find((i) => i.id === id)
  if (!item) return null
  return {
    ...item,
    scenario: sim.generated?.scenario,
    learningObjectives: sim.meta.learningObjectives,
    phases: sim.generated?.phases.length ?? 0,
    playMode: sim.meta.playMode ?? 'single',
    maxPlayers: sim.meta.maxPlayers ?? 4,
    assets: sim.assets.map((a) => ({ id: a.id, type: a.type, name: a.name, url: a.url })),
  }
}

export async function getCategoryList() {
  const { getCategoryList: list } = await import('../services/catalog.js')
  return list()
}

export async function exportAnalyticsCsv(simulationId: string, orgId: string): Promise<string | null> {
  const analytics = await getAnalytics(simulationId, orgId)
  if (!analytics) return null
  const header = 'Learner,Score,Budget,Risk,Status,Started,Completed'
  const rows = analytics.sessions.map(
    (s) =>
      `"${s.learnerName}",${s.score},${s.budget},${s.risk},${s.completed ? 'Completed' : 'In Progress'},${s.startedAt},${s.completedAt ?? ''}`
  )
  return [header, ...rows].join('\n')
}

export async function createOrgInvite(
  _data: import('../../src/types/extras.js').OrgInvite
): Promise<never> {
  throw new Error('Org invites require SQLite in this prototype')
}

export async function getOrgInviteByToken(_token: string): Promise<null> {
  return null
}

export async function acceptOrgInvite(_token: string): Promise<null> {
  return null
}

export async function createPasswordReset(_userId: string): Promise<never> {
  throw new Error('Password reset requires SQLite in this prototype')
}

export async function consumePasswordReset(_token: string): Promise<null> {
  return null
}

export async function listLearnerAssignments(_userId: string): Promise<Assignment[]> {
  return []
}

export async function updateUserPassword(userId: string, passwordHash: string): Promise<void> {
  await getPool().query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [passwordHash, userId])
}
