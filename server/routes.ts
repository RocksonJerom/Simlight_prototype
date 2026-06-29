import { Router } from 'express'
import { unlink } from 'fs/promises'
import { store } from './store/index.js'
import { generateSimulationContent } from './llm/generate.js'
import { generateSimulationFromDocument } from './llm/generateFromDocument.js'
import { generateEventContentBlocks } from './llm/generateContentBlocks.js'
import { extractTextFromDocument } from './llm/documentExtract.js'
import { generateEventDecisions } from './llm/generateQuestions.js'
import { createRoom, getRoom, joinRoom, linkPlayerSession } from './services/rooms.js'
import { upload, sourceDocumentUpload, assetTypeFromMime, uploadFilePath } from './upload.js'
import { requireAuth, requireFaculty, type AuthedRequest } from './auth/middleware.js'
import { getAiStatus } from './config.js'
import { canPlaySimulation } from './services/visibility.js'
import {
  computeMetricDeltas,
  computeDecisionPoints,
  generateAiFeedback,
  mergeMetricScores,
  weightedFinalScore,
} from './services/scoring.js'
import { sendAssignmentEmail } from './services/email.js'
import type { SimulationRecord } from '../src/types/simulation.js'

export const router = Router()

router.get('/', requireAuth, requireFaculty, async (req: AuthedRequest, res) => {
  res.json(await store.listSimulations(req.auth!.orgId))
})

router.post('/', requireAuth, requireFaculty, async (req: AuthedRequest, res) => {
  const sim = await store.createSimulation(req.body?.meta, req.auth!.orgId, req.auth!.userId)
  res.status(201).json(sim)
})

router.get('/:id/analytics/export', requireAuth, requireFaculty, async (req: AuthedRequest, res) => {
  const csv = await store.exportAnalyticsCsv(req.params.id, req.auth!.orgId)
  if (!csv) return res.status(404).json({ error: 'Simulation not found' })
  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', `attachment; filename="analytics-${req.params.id}.csv"`)
  res.send(csv)
})

router.get('/:id/analytics', requireAuth, requireFaculty, async (req: AuthedRequest, res) => {
  const analytics = await store.getAnalytics(req.params.id, req.auth!.orgId)
  if (!analytics) return res.status(404).json({ error: 'Simulation not found' })
  res.json(analytics)
})

router.post('/:id/duplicate', requireAuth, requireFaculty, async (req: AuthedRequest, res) => {
  const copy = await store.duplicateSimulation(req.params.id, req.auth!.orgId, req.auth!.userId)
  if (!copy) return res.status(404).json({ error: 'Simulation not found' })
  res.status(201).json(copy)
})

router.get('/:id/assignments', requireAuth, requireFaculty, async (req: AuthedRequest, res) => {
  const sim = await store.getSimulation(req.params.id, { orgId: req.auth!.orgId })
  if (!sim) return res.status(404).json({ error: 'Simulation not found' })
  res.json(await store.listAssignments(sim.id, req.auth!.orgId))
})

router.post('/:id/assignments', requireAuth, requireFaculty, async (req: AuthedRequest, res) => {
  const { learnerName, learnerEmail, dueDate, sendEmail } = req.body as {
    learnerName?: string
    learnerEmail?: string
    dueDate?: string
    sendEmail?: boolean
  }
  if (!learnerName?.trim()) return res.status(400).json({ error: 'learnerName is required' })

  const assignment = await store.createAssignment(req.params.id, req.auth!.orgId, {
    learnerName: learnerName.trim(),
    learnerEmail,
    dueDate,
  })
  if (!assignment) return res.status(400).json({ error: 'Simulation must be published' })

  const sim = await store.getSimulation(req.params.id, { orgId: req.auth!.orgId })
  const baseUrl = process.env.APP_URL ?? 'http://localhost:5173'
  const playUrl = `${baseUrl}/play/${req.params.id}?assignment=${assignment.id}&name=${encodeURIComponent(learnerName)}`

  if (sendEmail !== false && learnerEmail) {
    await sendAssignmentEmail({
      to: learnerEmail,
      learnerName: learnerName.trim(),
      simulationTitle: sim?.meta.title ?? 'Simulation',
      playUrl,
      dueDate,
    })
  }

  res.status(201).json({ assignment, playUrl })
})

router.post('/:id/upload', requireAuth, requireFaculty, upload.single('file'), async (req: AuthedRequest, res) => {
  const sim = await store.getSimulation(req.params.id, { orgId: req.auth!.orgId })
  if (!sim) return res.status(404).json({ error: 'Simulation not found' })
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
  const type = assetTypeFromMime(req.file.mimetype)
  if (!type) return res.status(400).json({ error: 'Unsupported file type' })
  const asset = await store.addAsset(req.params.id, req.auth!.orgId, req.file, type)
  if (!asset) return res.status(500).json({ error: 'Failed to save asset' })
  res.status(201).json({
    asset,
    simulation: await store.getSimulation(req.params.id, { orgId: req.auth!.orgId }),
  })
})

router.delete('/:id/assets/:assetId', requireAuth, requireFaculty, async (req: AuthedRequest, res) => {
  const sim = await store.getSimulation(req.params.id, { orgId: req.auth!.orgId })
  if (!sim) return res.status(404).json({ error: 'Simulation not found' })
  await store.deleteAsset(req.params.id, req.auth!.orgId, req.params.assetId)
  res.json(await store.getSimulation(req.params.id, { orgId: req.auth!.orgId }))
})

router.get('/:id/public', async (req, res) => {
  const sim = await store.getSimulation(req.params.id, { allowPublic: true })
  if (!sim?.isPublished) return res.status(404).json({ error: 'Not found' })
  const assignmentId = req.query.assignment as string | undefined
  const playToken = req.query.token as string | undefined
  if (
    !canPlaySimulation(sim, {
      playToken,
      assignmentId,
      orgId: (req as AuthedRequest).auth?.orgId,
    })
  ) {
    return res.status(403).json({ error: 'This simulation is not publicly accessible' })
  }
  res.json({
    id: sim.id,
    title: sim.meta.title,
    domain: sim.meta.domain,
    duration: sim.meta.duration,
    assets: sim.assets,
  })
})

router.get('/:id', requireAuth, requireFaculty, async (req: AuthedRequest, res) => {
  const sim = await store.getSimulation(req.params.id, { orgId: req.auth!.orgId })
  if (!sim) return res.status(404).json({ error: 'Simulation not found' })
  res.json(sim)
})

router.patch('/:id', requireAuth, requireFaculty, async (req: AuthedRequest, res) => {
  const { assets: _a, orgId: _o, createdBy: _c, ...updates } = req.body
  const sim = await store.updateSimulation(req.params.id, req.auth!.orgId, updates)
  if (!sim) return res.status(404).json({ error: 'Simulation not found' })
  res.json(sim)
})

router.delete('/:id', requireAuth, requireFaculty, async (req: AuthedRequest, res) => {
  const ok = await store.deleteSimulation(req.params.id, req.auth!.orgId)
  if (!ok) return res.status(404).json({ error: 'Simulation not found' })
  res.status(204).send()
})

router.post('/:id/generate', requireAuth, requireFaculty, async (req: AuthedRequest, res) => {
  const sim = await store.getSimulation(req.params.id, { orgId: req.auth!.orgId })
  if (!sim) return res.status(404).json({ error: 'Simulation not found' })
  try {
    const result = await generateSimulationContent(sim.meta)
    const updated = await store.updateSimulation(sim.id, req.auth!.orgId, {
      generated: result.content,
      aiGenerationComplete: true,
      aiGenerationSource: result.source,
      meta: { ...sim.meta, contentMode: 'ai' },
    })
    res.json({
      simulation: updated,
      generation: { source: result.source, usedFallback: result.usedFallback, error: result.error },
    })
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Generation failed' })
  }
})

router.post(
  '/:id/generate-from-document',
  requireAuth,
  requireFaculty,
  sourceDocumentUpload.single('file'),
  async (req: AuthedRequest, res) => {
    const sim = await store.getSimulation(req.params.id, { orgId: req.auth!.orgId })
    if (!sim) return res.status(404).json({ error: 'Simulation not found' })
    if (!req.file) return res.status(400).json({ error: 'No document uploaded' })

    const filePath = uploadFilePath(req.file.filename)
    try {
      const documentText = await extractTextFromDocument(
        filePath,
        req.file.mimetype,
        req.file.originalname
      )
      const result = await generateSimulationFromDocument(sim.meta, documentText)
      const updated = await store.updateSimulation(sim.id, req.auth!.orgId, {
        generated: result.content,
        aiGenerationComplete: true,
        aiGenerationSource: result.source,
        meta: { ...sim.meta, contentMode: 'document' },
      })
      res.json({
        simulation: updated,
        generation: { source: result.source, usedFallback: result.usedFallback, error: result.error },
        documentChars: documentText.length,
      })
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Document import failed' })
    } finally {
      unlink(filePath).catch(() => {})
    }
  }
)

router.post('/:id/generate-questions', requireAuth, requireFaculty, async (req: AuthedRequest, res) => {
  const sim = await store.getSimulation(req.params.id, { orgId: req.auth!.orgId })
  if (!sim?.generated) return res.status(404).json({ error: 'Simulation not found' })
  const { eventId } = req.body as { eventId?: string }
  if (!eventId) return res.status(400).json({ error: 'eventId is required' })
  const event = sim.generated.events.find((e) => e.id === eventId)
  if (!event) return res.status(404).json({ error: 'Event not found' })
  try {
    const decisions = await generateEventDecisions(sim.meta, event)
    res.json({ decisions })
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Question generation failed' })
  }
})

router.post('/:id/generate-content-blocks', requireAuth, requireFaculty, async (req: AuthedRequest, res) => {
  const sim = await store.getSimulation(req.params.id, { orgId: req.auth!.orgId })
  if (!sim?.generated) return res.status(404).json({ error: 'Simulation not found' })
  const { eventId, mode, replace } = req.body as {
    eventId?: string
    mode?: 'all' | 'text' | 'table' | 'chart'
    replace?: boolean
  }
  if (!eventId) return res.status(400).json({ error: 'eventId is required' })
  const event = sim.generated.events.find((e) => e.id === eventId)
  if (!event) return res.status(404).json({ error: 'Event not found' })
  try {
    const generated = await generateEventContentBlocks(sim.meta, event, mode ?? 'all')
    const contentBlocks = replace ? generated : [...(event.contentBlocks ?? []), ...generated]
    const events = sim.generated.events.map((e) =>
      e.id === eventId ? { ...e, contentBlocks } : e
    )
    const updated = await store.updateSimulation(sim.id, req.auth!.orgId, {
      generated: { ...sim.generated, events },
    })
    res.json({ contentBlocks, simulation: updated })
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Content block generation failed' })
  }
})

router.post('/:id/publish', requireAuth, requireFaculty, async (req: AuthedRequest, res) => {
  const sim = await store.getSimulation(req.params.id, { orgId: req.auth!.orgId })
  if (!sim) return res.status(404).json({ error: 'Simulation not found' })
  if (!sim.generated) return res.status(400).json({ error: 'Generate content before publishing' })
  const updated = await store.publishSimulation(req.params.id, req.auth!.orgId, req.body?.visibility ?? sim.visibility)
  res.json(updated)
})

router.get('/:id/sessions', requireAuth, requireFaculty, async (req: AuthedRequest, res) => {
  const sim = await store.getSimulation(req.params.id, { orgId: req.auth!.orgId })
  if (!sim) return res.status(404).json({ error: 'Simulation not found' })
  res.json(await store.listSessionsForSimulation(sim.id))
})

router.get('/:id/play-meta', async (req, res) => {
  const sim = await store.getSimulation(req.params.id, { allowPublic: true })
  if (!sim) return res.status(404).json({ error: 'Simulation not found' })
  const playToken = req.query.token as string | undefined
  const assignmentId = req.query.assignment as string | undefined
  if (
    !canPlaySimulation(sim, {
      playToken,
      assignmentId,
      orgId: (req as AuthedRequest).auth?.orgId,
    })
  ) {
    return res.status(403).json({ error: 'Access denied' })
  }
  res.json({
    title: sim.meta.title,
    playMode: sim.meta.playMode ?? 'single',
    maxPlayers: sim.meta.maxPlayers ?? 4,
  })
})

router.post('/:id/sessions', async (req, res) => {
  const { learnerName, assignmentId, userId, playToken, resumeSessionId } = req.body as {
    learnerName?: string
    assignmentId?: string
    userId?: string
    playToken?: string
    resumeSessionId?: string
  }

  const sim = await store.getSimulation(req.params.id, { allowPublic: true })
  if (!sim) return res.status(404).json({ error: 'Simulation not found' })

  if (
    !canPlaySimulation(sim, {
      playToken,
      assignmentId,
      orgId: (req as AuthedRequest).auth?.orgId,
    })
  ) {
    return res.status(403).json({ error: 'Access denied' })
  }

  if (resumeSessionId) {
    const existing = await store.getSession(resumeSessionId)
    if (existing && !existing.completed && existing.simulationId === req.params.id) {
      return res.json(existing)
    }
  }

  if (!learnerName?.trim()) return res.status(400).json({ error: 'learnerName is required' })
  const session = await store.createSession(req.params.id, learnerName.trim(), assignmentId, userId)
  if (!session) return res.status(400).json({ error: 'Cannot start session' })

  const { roomCode } = req.body as { roomCode?: string }
  if (roomCode) {
    linkPlayerSession(roomCode, learnerName.trim(), session.id)
  }

  res.status(201).json(session)
})

export const marketplaceRouter = Router()

marketplaceRouter.get('/home', async (_req, res) => {
  res.json(await store.getCatalogHome())
})

marketplaceRouter.get('/categories', async (_req, res) => {
  res.json(await store.getCategoryList())
})

marketplaceRouter.get('/', async (req, res) => {
  const { q, category, difficulty, industry, domain, sort, limit } = req.query
  res.json(
    await store.searchMarketplace({
      q: q as string | undefined,
      category: category as string | undefined,
      difficulty: difficulty as string | undefined,
      industry: industry as string | undefined,
      domain: domain as string | undefined,
      sort: sort as 'new' | 'popular' | 'title' | undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    })
  )
})

marketplaceRouter.get('/:id', async (req, res) => {
  const detail = await store.getPublicSimulationDetail(req.params.id)
  if (!detail) return res.status(404).json({ error: 'Simulation not found' })
  res.json(detail)
})

export const sessionsRouter = Router()

export const aiRouter = Router()

aiRouter.get('/status', (_req, res) => {
  res.json(getAiStatus())
})

sessionsRouter.get('/:sessionId', async (req, res) => {
  const session = await store.getSession(req.params.sessionId)
  if (!session) return res.status(404).json({ error: 'Session not found' })
  const sim = await store.getSimulation(session.simulationId, { allowPublic: true })
  if (!sim) return res.status(404).json({ error: 'Simulation not found' })
  res.json({ session, simulation: sim as SimulationRecord })
})

sessionsRouter.post('/:sessionId/decide', async (req, res) => {
  const session = await store.getSession(req.params.sessionId)
  if (!session) return res.status(404).json({ error: 'Session not found' })
  if (session.completed) return res.status(400).json({ error: 'Session already completed' })
  if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
    return res.status(400).json({ error: 'Time limit exceeded' })
  }

  const sim = await store.getSimulation(session.simulationId, { allowPublic: true })
  if (!sim?.generated) return res.status(400).json({ error: 'Invalid simulation' })

  const { decisionId } = req.body as { decisionId?: string }
  const event = sim.generated.events[session.currentEventIndex]
  if (!event) return res.status(400).json({ error: 'No current event' })
  const decision = event.decisions.find((d) => d.id === decisionId)
  if (!decision) return res.status(400).json({ error: 'Invalid decision' })

  const decisionIndex = event.decisions.findIndex((d) => d.id === decisionId)
  const metrics = sim.generated.metrics
  const metricDeltas = computeMetricDeltas(event, decisionIndex, metrics)
  const points = computeDecisionPoints(event, decisionIndex, metricDeltas)
  const aiFeedback = await generateAiFeedback(sim, event, decision.text, metricDeltas)
  const metricScores = mergeMetricScores(session.metricScores ?? {}, metricDeltas)

  const budgetDelta = event.impact.budget === 'Down' ? -5 : event.impact.budget === 'Up' ? 3 : 0
  const riskDelta = event.impact.risk === 'High' ? 8 : event.impact.risk === 'Medium' ? 4 : -2
  const nextIndex = session.currentEventIndex + 1
  const completed = nextIndex >= sim.generated.events.length
  const finalScore = completed ? weightedFinalScore(metricScores, metrics) : session.score + points

  const updated = await store.updateSession(session.id, {
    currentEventIndex: nextIndex,
    score: completed ? finalScore : session.score + points,
    budget: Math.max(0, Math.min(100, session.budget + budgetDelta)),
    risk: Math.max(0, Math.min(100, session.risk + riskDelta)),
    metricScores,
    decisionsMade: [
      ...session.decisionsMade,
      { eventId: event.id, decisionId: decision.id, points, metricDeltas, aiFeedback },
    ],
    completed,
    completedAt: completed ? new Date().toISOString() : undefined,
  })

  const simData = await store.getSimulation(session.simulationId, { allowPublic: true })
  res.json({ session: updated, simulation: simData, aiFeedback, metricDeltas })
})

export const roomsRouter = Router()

roomsRouter.post('/', async (req, res) => {
  const { simulationId, hostName, maxPlayers } = req.body as {
    simulationId?: string
    hostName?: string
    maxPlayers?: number
  }
  if (!simulationId || !hostName?.trim()) {
    return res.status(400).json({ error: 'simulationId and hostName are required' })
  }
  const sim = await store.getSimulation(simulationId, { allowPublic: true })
  if (!sim) return res.status(404).json({ error: 'Simulation not found' })
  const room = createRoom(
    simulationId,
    hostName.trim(),
    maxPlayers ?? sim.meta.maxPlayers ?? 4
  )
  res.status(201).json(room)
})

roomsRouter.get('/:code', (req, res) => {
  const room = getRoom(req.params.code)
  if (!room) return res.status(404).json({ error: 'Room not found' })
  res.json(room)
})

roomsRouter.post('/:code/join', (req, res) => {
  const { playerName } = req.body as { playerName?: string }
  if (!playerName?.trim()) return res.status(400).json({ error: 'playerName is required' })
  const room = joinRoom(req.params.code, playerName.trim())
  if (!room) return res.status(400).json({ error: 'Cannot join room' })
  res.json(room)
})
