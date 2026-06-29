import { unlinkSync, existsSync } from 'fs'
import { basename } from 'path'
import { randomUUID } from 'crypto'
import type {
  SimulationRecord,
  PlaySession,
  SimulationMeta,
  MediaAsset,
  Assignment,
  SimulationAnalytics,
} from '../src/types/simulation.js'
import { defaultMeta } from './defaults.js'
import { getDatabase } from './database.js'
import { formatFileSize, publicUploadUrl } from './upload.js'
import { parseDurationSeconds } from './services/scoring.js'
import type { OrgInvite } from '../src/types/extras.js'
import type { UserRole } from '../src/types/auth.js'

interface SimRow {
  id: string
  org_id: string | null
  created_by: string | null
  meta: string
  generated: string | null
  scoring_type: string
  visibility: string
  is_published: number
  ai_generation_complete: number
  ai_generation_source: string | null
  play_token: string | null
  version: number | null
  created_at: string
  updated_at: string
}

interface AssetRow {
  id: string
  simulation_id: string
  type: string
  name: string
  size: string | null
  file_path: string
  mime_type: string | null
  created_at: string
}

function rowToAsset(row: AssetRow): MediaAsset {
  const filename = basename(row.file_path)
  return {
    id: row.id,
    type: row.type as MediaAsset['type'],
    name: row.name,
    size: row.size ?? undefined,
    url: publicUploadUrl(filename),
  }
}

function loadAssets(simulationId: string): MediaAsset[] {
  const db = getDatabase()
  const rows = db
    .prepare('SELECT * FROM assets WHERE simulation_id = ? ORDER BY created_at')
    .all(simulationId) as AssetRow[]
  return rows.map(rowToAsset)
}

function rowToSimulation(row: SimRow): SimulationRecord {
  return {
    id: row.id,
    orgId: row.org_id ?? '',
    createdBy: row.created_by ?? '',
    meta: JSON.parse(row.meta) as SimulationMeta,
    generated: row.generated ? JSON.parse(row.generated) : null,
    assets: loadAssets(row.id),
    scoringType: row.scoring_type as SimulationRecord['scoringType'],
    visibility: row.visibility as SimulationRecord['visibility'],
    isPublished: row.is_published === 1,
    aiGenerationComplete: row.ai_generation_complete === 1,
    aiGenerationSource: (row.ai_generation_source as SimulationRecord['aiGenerationSource']) ?? undefined,
    playToken: row.play_token ?? undefined,
    version: row.version ?? 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function rowToSession(row: Record<string, unknown>): PlaySession {
  return {
    id: row.id as string,
    simulationId: row.simulation_id as string,
    assignmentId: (row.assignment_id as string) ?? undefined,
    userId: (row.user_id as string) ?? undefined,
    learnerName: row.learner_name as string,
    currentEventIndex: row.current_event_index as number,
    score: row.score as number,
    budget: row.budget as number,
    risk: row.risk as number,
    metricScores: JSON.parse((row.metric_scores as string) || '{}'),
    decisionsMade: JSON.parse(row.decisions_made as string),
    completed: (row.completed as number) === 1,
    startedAt: row.started_at as string,
    completedAt: (row.completed_at as string) ?? undefined,
    timeLimitSeconds: (row.time_limit_seconds as number) ?? undefined,
    expiresAt: (row.expires_at as string) ?? undefined,
  }
}

function assignmentStatus(row: Record<string, unknown>): Assignment['status'] {
  const status = row.status as string
  const due = row.due_date as string | undefined
  if (status === 'completed' || status === 'in_progress' || status === 'pending') {
    if (due && status !== 'completed' && new Date(due) < new Date()) return 'overdue'
    return status as Assignment['status']
  }
  return 'pending'
}

function rowToAssignment(row: Record<string, unknown>): Assignment {
  return {
    id: row.id as string,
    simulationId: row.simulation_id as string,
    learnerName: row.learner_name as string,
    learnerEmail: (row.learner_email as string) ?? undefined,
    userId: (row.user_id as string) ?? undefined,
    assignedAt: row.assigned_at as string,
    dueDate: (row.due_date as string) ?? undefined,
    status: assignmentStatus(row),
    sessionId: (row.session_id as string) ?? undefined,
    inviteToken: (row.invite_token as string) ?? undefined,
  }
}

export function listSimulations(orgId: string): SimulationRecord[] {
  const db = getDatabase()
  const rows = db
    .prepare('SELECT * FROM simulations WHERE org_id = ? ORDER BY updated_at DESC')
    .all(orgId) as SimRow[]
  return rows.map(rowToSimulation)
}

export function getSimulation(
  id: string,
  opts?: { orgId?: string; allowPublic?: boolean }
): SimulationRecord | null {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM simulations WHERE id = ?').get(id) as SimRow | undefined
  if (!row) return null

  if (opts?.orgId && row.org_id !== opts.orgId) {
    if (!opts.allowPublic || row.is_published !== 1) return null
  }

  return rowToSimulation(row)
}

export function createSimulation(
  meta: Partial<SimulationMeta> | undefined,
  orgId: string,
  userId: string
): SimulationRecord {
  const db = getDatabase()
  const now = new Date().toISOString()
  const id = randomUUID()
  const fullMeta = { ...defaultMeta, ...meta }

  db.prepare(`
    INSERT INTO simulations (id, org_id, created_by, meta, generated, scoring_type, visibility, is_published, ai_generation_complete, created_at, updated_at)
    VALUES (?, ?, ?, ?, NULL, 'ai-assisted', 'organization', 0, 0, ?, ?)
  `).run(id, orgId, userId, JSON.stringify(fullMeta), now, now)

  return getSimulation(id, { orgId })!
}

export function updateSimulation(
  id: string,
  orgId: string,
  updates: Partial<Omit<SimulationRecord, 'id' | 'createdAt' | 'assets' | 'orgId' | 'createdBy'>>
): SimulationRecord | null {
  const existing = getSimulation(id, { orgId })
  if (!existing) return null

  const merged = { ...existing, ...updates, id: existing.id, createdAt: existing.createdAt }
  const now = new Date().toISOString()

  getDatabase()
    .prepare(`
      UPDATE simulations SET
        meta = ?, generated = ?, scoring_type = ?, visibility = ?,
        is_published = ?, ai_generation_complete = ?, ai_generation_source = ?,
        play_token = ?, version = ?, updated_at = ?
      WHERE id = ?
    `)
    .run(
      JSON.stringify(merged.meta),
      merged.generated ? JSON.stringify(merged.generated) : null,
      merged.scoringType,
      merged.visibility,
      merged.isPublished ? 1 : 0,
      merged.aiGenerationComplete ? 1 : 0,
      merged.aiGenerationSource ?? null,
      merged.playToken ?? null,
      merged.version ?? 1,
      now,
      id
    )

  return getSimulation(id, { orgId })
}

export function deleteSimulation(id: string, orgId: string): boolean {
  const sim = getSimulation(id, { orgId })
  if (!sim) return false

  const db = getDatabase()
  const assets = db.prepare('SELECT file_path FROM assets WHERE simulation_id = ?').all(id) as {
    file_path: string
  }[]

  for (const a of assets) {
    if (existsSync(a.file_path)) unlinkSync(a.file_path)
  }

  const result = db.prepare('DELETE FROM simulations WHERE id = ?').run(id)
  return result.changes > 0
}

export function addAsset(
  simulationId: string,
  orgId: string,
  file: { path: string; originalname: string; size: number; mimetype: string },
  type: MediaAsset['type']
): MediaAsset | null {
  if (!getSimulation(simulationId, { orgId })) return null

  const id = randomUUID()
  const now = new Date().toISOString()
  const size = formatFileSize(file.size)

  getDatabase()
    .prepare(`
      INSERT INTO assets (id, simulation_id, type, name, size, file_path, mime_type, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(id, simulationId, type, file.originalname, size, file.path, file.mimetype, now)

  getDatabase()
    .prepare('UPDATE simulations SET updated_at = ? WHERE id = ?')
    .run(now, simulationId)

  return rowToAsset({
    id,
    simulation_id: simulationId,
    type,
    name: file.originalname,
    size,
    file_path: file.path,
    mime_type: file.mimetype,
    created_at: now,
  })
}

export function deleteAsset(assetId: string): boolean {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM assets WHERE id = ?').get(assetId) as AssetRow | undefined
  if (!row) return false

  if (existsSync(row.file_path)) unlinkSync(row.file_path)
  db.prepare('DELETE FROM assets WHERE id = ?').run(assetId)
  db.prepare('UPDATE simulations SET updated_at = ? WHERE id = ?').run(
    new Date().toISOString(),
    row.simulation_id
  )
  return true
}

export function createAssignment(
  simulationId: string,
  orgId: string,
  data: { learnerName: string; learnerEmail?: string; dueDate?: string }
): Assignment | null {
  if (!getSimulation(simulationId, { orgId })?.isPublished) return null

  const id = randomUUID()
  const inviteToken = randomUUID()
  const now = new Date().toISOString()

  getDatabase()
    .prepare(`
      INSERT INTO assignments (id, simulation_id, learner_name, learner_email, assigned_at, due_date, status, invite_token)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
    `)
    .run(id, simulationId, data.learnerName, data.learnerEmail ?? null, now, data.dueDate ?? null, inviteToken)

  return getAssignment(id)
}

export function getAssignment(id: string): Assignment | null {
  const row = getDatabase().prepare('SELECT * FROM assignments WHERE id = ?').get(id)
  return row ? rowToAssignment(row as Record<string, unknown>) : null
}

export function listAssignments(simulationId: string, orgId: string): Assignment[] {
  if (!getSimulation(simulationId, { orgId })) return []
  const rows = getDatabase()
    .prepare('SELECT * FROM assignments WHERE simulation_id = ? ORDER BY assigned_at DESC')
    .all(simulationId)
  return rows.map((r) => rowToAssignment(r as Record<string, unknown>))
}

export function createSession(
  simulationId: string,
  learnerName: string,
  assignmentId?: string,
  userId?: string
): PlaySession | null {
  const sim = getSimulation(simulationId, { allowPublic: true })
  if (!sim?.isPublished || !sim.generated) return null

  if (assignmentId) {
    const assignment = getAssignment(assignmentId)
    if (!assignment || assignment.simulationId !== simulationId) return null
    if (assignment.dueDate && new Date(assignment.dueDate) < new Date()) return null
  }

  const id = randomUUID()
  const now = new Date().toISOString()
  const timeLimitSeconds = parseDurationSeconds(sim.meta.duration)
  const expiresAt = new Date(Date.now() + timeLimitSeconds * 1000).toISOString()

  getDatabase()
    .prepare(`
      INSERT INTO sessions (id, simulation_id, assignment_id, user_id, learner_name, current_event_index, score, budget, risk, metric_scores, decisions_made, completed, started_at, time_limit_seconds, expires_at)
      VALUES (?, ?, ?, ?, ?, 0, 0, 100, 20, '{}', '[]', 0, ?, ?, ?)
    `)
    .run(id, simulationId, assignmentId ?? null, userId ?? null, learnerName, now, timeLimitSeconds, expiresAt)

  if (assignmentId) {
    getDatabase()
      .prepare(`UPDATE assignments SET status = 'in_progress', session_id = ? WHERE id = ?`)
      .run(id, assignmentId)
  }

  return getSession(id)
}

export function getSession(id: string): PlaySession | null {
  const row = getDatabase().prepare('SELECT * FROM sessions WHERE id = ?').get(id)
  return row ? rowToSession(row as Record<string, unknown>) : null
}

export function updateSession(
  id: string,
  updates: Partial<Omit<PlaySession, 'id' | 'simulationId' | 'startedAt'>>
): PlaySession | null {
  const existing = getSession(id)
  if (!existing) return null

  const merged = { ...existing, ...updates }

  getDatabase()
    .prepare(`
      UPDATE sessions SET
        assignment_id = ?, user_id = ?, learner_name = ?, current_event_index = ?, score = ?, budget = ?, risk = ?,
        metric_scores = ?, decisions_made = ?, completed = ?, completed_at = ?
      WHERE id = ?
    `)
    .run(
      merged.assignmentId ?? null,
      merged.userId ?? null,
      merged.learnerName,
      merged.currentEventIndex,
      merged.score,
      merged.budget,
      merged.risk,
      JSON.stringify(merged.metricScores ?? {}),
      JSON.stringify(merged.decisionsMade),
      merged.completed ? 1 : 0,
      merged.completedAt ?? null,
      id
    )

  if (merged.completed && merged.assignmentId) {
    getDatabase()
      .prepare(`UPDATE assignments SET status = 'completed', session_id = ? WHERE id = ?`)
      .run(id, merged.assignmentId)
  }

  return getSession(id)
}

export function listSessionsForSimulation(simulationId: string): PlaySession[] {
  const rows = getDatabase()
    .prepare('SELECT * FROM sessions WHERE simulation_id = ? ORDER BY started_at DESC')
    .all(simulationId)
  return rows.map((r) => rowToSession(r as Record<string, unknown>))
}

export function getAnalytics(simulationId: string, orgId: string): SimulationAnalytics | null {
  const sim = getSimulation(simulationId, { orgId })
  if (!sim) return null

  const sessions = listSessionsForSimulation(simulationId)
  const assignments = listAssignments(simulationId, orgId)
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

export function publishSimulation(id: string, orgId: string, visibility?: SimulationRecord['visibility']) {
  const sim = getSimulation(id, { orgId })
  if (!sim?.generated) return null
  const playToken = visibility === 'private' || sim.visibility === 'private' ? randomUUID() : sim.playToken
  return updateSimulation(id, orgId, {
    isPublished: true,
    visibility: visibility ?? sim.visibility,
    playToken,
    version: sim.version + 1,
  })
}

export function duplicateSimulation(id: string, orgId: string, userId: string): SimulationRecord | null {
  const sim = getSimulation(id, { orgId })
  if (!sim) return null
  const copy = createSimulation(
    { ...sim.meta, title: `${sim.meta.title} (Copy)` },
    orgId,
    userId
  )
  return updateSimulation(copy.id, orgId, {
    generated: sim.generated,
    aiGenerationComplete: sim.aiGenerationComplete,
    aiGenerationSource: sim.aiGenerationSource,
    scoringType: sim.scoringType,
    visibility: sim.visibility,
  })
}

export {
  listMarketplace,
  searchMarketplace,
  getCatalogHome,
  getPublicSimulationDetail,
  getCategoryList,
} from './services/catalog.js'

export function exportAnalyticsCsv(simulationId: string, orgId: string): string | null {
  const analytics = getAnalytics(simulationId, orgId)
  if (!analytics) return null
  const header = 'Learner,Score,Budget,Risk,Status,Started,Completed'
  const rows = analytics.sessions.map(
    (s) =>
      `"${s.learnerName}",${s.score},${s.budget},${s.risk},${s.completed ? 'Completed' : 'In Progress'},${s.startedAt},${s.completedAt ?? ''}`
  )
  return [header, ...rows].join('\n')
}

export function createOrgInvite(data: {
  orgId: string
  email: string
  name: string
  role: UserRole
  invitedBy: string
}): OrgInvite {
  const id = randomUUID()
  const token = randomUUID()
  const now = new Date().toISOString()
  getDatabase()
    .prepare(
      `INSERT INTO org_invites (id, org_id, email, name, role, token, invited_by, created_at) VALUES (?,?,?,?,?,?,?,?)`
    )
    .run(id, data.orgId, data.email.toLowerCase(), data.name, data.role, token, data.invitedBy, now)
  return {
    id,
    orgId: data.orgId,
    email: data.email.toLowerCase(),
    name: data.name,
    role: data.role,
    token,
    invitedBy: data.invitedBy,
    createdAt: now,
  }
}

export function getOrgInviteByToken(token: string): OrgInvite | null {
  const row = getDatabase().prepare(`SELECT * FROM org_invites WHERE token = ?`).get(token) as
    | Record<string, string>
    | undefined
  if (!row || row.accepted_at) return null
  return {
    id: row.id,
    orgId: row.org_id,
    email: row.email,
    name: row.name,
    role: row.role as UserRole,
    token: row.token,
    invitedBy: row.invited_by,
    createdAt: row.created_at,
    acceptedAt: row.accepted_at,
  }
}

export function acceptOrgInvite(token: string): OrgInvite | null {
  const invite = getOrgInviteByToken(token)
  if (!invite) return null
  getDatabase()
    .prepare(`UPDATE org_invites SET accepted_at = ? WHERE token = ?`)
    .run(new Date().toISOString(), token)
  return { ...invite, acceptedAt: new Date().toISOString() }
}

export function createPasswordReset(userId: string): string {
  const id = randomUUID()
  const token = randomUUID()
  const expiresAt = new Date(Date.now() + 3600000).toISOString()
  getDatabase()
    .prepare(`INSERT INTO password_resets (id, user_id, token, expires_at) VALUES (?,?,?,?)`)
    .run(id, userId, token, expiresAt)
  return token
}

export function consumePasswordReset(token: string): string | null {
  const row = getDatabase()
    .prepare(`SELECT * FROM password_resets WHERE token = ? AND used_at IS NULL`)
    .get(token) as Record<string, string> | undefined
  if (!row || new Date(row.expires_at) < new Date()) return null
  getDatabase()
    .prepare(`UPDATE password_resets SET used_at = ? WHERE id = ?`)
    .run(new Date().toISOString(), row.id)
  return row.user_id
}

export function getAssignmentByInviteToken(token: string): Assignment | null {
  const row = getDatabase().prepare(`SELECT * FROM assignments WHERE invite_token = ?`).get(token)
  return row ? rowToAssignment(row as Record<string, unknown>) : null
}

export function listLearnerAssignments(userId: string): Assignment[] {
  const rows = getDatabase()
    .prepare(`SELECT * FROM assignments WHERE user_id = ? ORDER BY assigned_at DESC`)
    .all(userId)
  return rows.map((r) => rowToAssignment(r as Record<string, unknown>))
}
