import { Router, type Response, type NextFunction } from 'express'
import { requireAuth, requireFaculty, type AuthedRequest } from '../auth/middleware.js'
import { store } from '../store/index.js'
import * as platform from './store.js'

export const platformRouter = Router()

function requireAdminRole(req: AuthedRequest, res: Response, next: NextFunction) {
  if (req.auth?.role !== 'admin') return res.status(403).json({ error: 'Admin access required' })
  next()
}

platformRouter.get('/stats', requireAuth, async (req: AuthedRequest, res) => {
  const org = await store.getOrganization(req.auth!.orgId)
  const orgId = org?.slug === 'simlight-platform' ? undefined : req.auth!.orgId
  res.json(platform.getPlatformStats(orgId))
})

platformRouter.get('/leads', requireAuth, requireAdminRole, (req, res) => {
  res.json(platform.listLeads(req.query.q as string | undefined))
})

platformRouter.get('/leads/:id', requireAuth, requireAdminRole, (req, res) => {
  const lead = platform.getLead(req.params.id)
  if (!lead) return res.status(404).json({ error: 'Lead not found' })
  res.json(lead)
})

platformRouter.post('/leads', requireAuth, requireAdminRole, (req, res) => {
  const { orgName, segment, contactName, contactEmail, notes } = req.body
  if (!orgName || !contactName) return res.status(400).json({ error: 'orgName and contactName required' })
  res.status(201).json(
    platform.createLead({ orgName, segment: segment ?? 'Enterprise', contactName, contactEmail, notes })
  )
})

platformRouter.post('/leads/:id/convert', requireAuth, requireAdminRole, (req, res) => {
  try {
    const result = platform.convertLead(req.params.id, req.body)
    res.json(result)
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Conversion failed' })
  }
})

platformRouter.get('/organizations', requireAuth, requireAdminRole, (_req, res) => {
  res.json(platform.listOrganizations())
})

platformRouter.get('/courses', requireAuth, (req: AuthedRequest, res) => {
  res.json(platform.listCourses(req.auth!.orgId))
})

platformRouter.post('/courses', requireAuth, requireFaculty, (req: AuthedRequest, res) => {
  const { name, category, courseType } = req.body
  if (!name || !category) return res.status(400).json({ error: 'name and category required' })
  res.status(201).json(
    platform.createCourse({
      name,
      category,
      courseType: courseType ?? 'Core',
      orgId: req.auth!.role === 'admin' ? undefined : req.auth!.orgId,
    })
  )
})

platformRouter.get('/taglines', requireAuth, (_req, res) => {
  res.json(platform.listTaglines())
})

platformRouter.post('/taglines', requireAuth, requireAdminRole, (req, res) => {
  const { text } = req.body
  if (!text?.trim()) return res.status(400).json({ error: 'text required' })
  res.status(201).json(platform.createTagline(text.trim()))
})

platformRouter.get('/sim-roles', requireAuth, (_req, res) => {
  res.json(platform.listSimJobRoles())
})

platformRouter.post('/sim-roles', requireAuth, requireFaculty, (req: AuthedRequest, res) => {
  const { name, description } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'name required' })
  res.status(201).json(platform.createSimJobRole(name.trim(), description, req.auth!.orgId))
})

platformRouter.get('/org/groups', requireAuth, (req: AuthedRequest, res) => {
  res.json(platform.listOrgGroups(req.auth!.orgId))
})

platformRouter.post('/org/groups', requireAuth, requireFaculty, (req: AuthedRequest, res) => {
  const { name, description } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'name required' })
  res.status(201).json(platform.createOrgGroup(req.auth!.orgId, name.trim(), description))
})

platformRouter.get('/org/members', requireAuth, (req: AuthedRequest, res) => {
  res.json(platform.listOrgMembers(req.auth!.orgId))
})

platformRouter.post('/org/members', requireAuth, requireFaculty, (req: AuthedRequest, res) => {
  const { name, email, role, groupId } = req.body
  if (!name || !email) return res.status(400).json({ error: 'name and email required' })
  res.status(201).json(
    platform.createOrgMember(req.auth!.orgId, {
      name,
      email,
      role: role ?? 'learner',
      groupId,
    })
  )
})
