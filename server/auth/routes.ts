import { Router } from 'express'
import { hashPassword, verifyPassword } from './password.js'
import { signToken } from './jwt.js'
import { requireAuth, requireFaculty, type AuthedRequest } from './middleware.js'
import { store } from '../store/index.js'
import { sendInviteEmail, sendPasswordResetEmail } from '../services/email.js'
import type { RegisterRequest, LoginRequest } from '../../src/types/auth.js'

export const authRouter = Router()

const baseUrl = () => process.env.APP_URL ?? 'http://localhost:5173'

authRouter.post('/register', async (req, res) => {
  const { orgName, name, email, password } = req.body as RegisterRequest
  if (!orgName?.trim() || !name?.trim() || !email?.trim() || !password?.trim()) {
    res.status(400).json({ error: 'All fields are required' })
    return
  }
  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' })
    return
  }
  if (await store.findUserByEmail(email)) {
    res.status(409).json({ error: 'Email already registered' })
    return
  }

  const org = await store.createOrganization(orgName.trim())
  const passwordHash = await hashPassword(password)
  const user = await store.createUser({
    email: email.trim(),
    passwordHash,
    name: name.trim(),
    role: 'faculty',
    orgId: org.id,
  })

  const token = signToken({
    userId: user.id,
    orgId: org.id,
    role: user.role,
    email: user.email,
  })

  res.status(201).json({ token, user, organization: org })
})

authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body as LoginRequest
  if (!email?.trim() || !password) {
    res.status(400).json({ error: 'Email and password are required' })
    return
  }

  const record = await store.findUserByEmail(email.trim())
  if (!record || !(await verifyPassword(password, record.passwordHash))) {
    res.status(401).json({ error: 'Invalid email or password' })
    return
  }

  const org = await store.getOrganization(record.orgId)
  if (!org) {
    res.status(500).json({ error: 'Organization not found' })
    return
  }

  const { passwordHash: _, ...user } = record
  const token = signToken({
    userId: user.id,
    orgId: user.orgId,
    role: user.role,
    email: user.email,
  })

  res.json({ token, user, organization: org })
})

authRouter.get('/me', requireAuth, async (req: AuthedRequest, res) => {
  const user = await store.getUserById(req.auth!.userId)
  const organization = user ? await store.getOrganization(user.orgId) : null
  if (!user || !organization) {
    res.status(404).json({ error: 'User not found' })
    return
  }
  res.json({ user, organization })
})

authRouter.post('/invite', requireAuth, requireFaculty, async (req: AuthedRequest, res) => {
  const { email, name, role } = req.body as { email?: string; name?: string; role?: string }
  if (!email?.trim() || !name?.trim()) {
    res.status(400).json({ error: 'Email and name are required' })
    return
  }
  const invite = await store.createOrgInvite({
    orgId: req.auth!.orgId,
    email: email.trim(),
    name: name.trim(),
    role: (role as 'faculty' | 'learner' | 'admin') ?? 'faculty',
    invitedBy: req.auth!.userId,
  })
  const org = await store.getOrganization(req.auth!.orgId)
  const inviteUrl = `${baseUrl()}/register?invite=${invite.token}&email=${encodeURIComponent(invite.email)}`
  await sendInviteEmail({ to: invite.email, orgName: org?.name ?? 'your organization', inviteUrl })
  res.status(201).json({ invite, inviteUrl })
})

authRouter.get('/invite/:token', async (req, res) => {
  const invite = await store.getOrgInviteByToken(req.params.token)
  if (!invite) return res.status(404).json({ error: 'Invite not found or expired' })
  const org = await store.getOrganization(invite.orgId)
  res.json({ invite, organization: org })
})

authRouter.post('/forgot-password', async (req, res) => {
  const { email } = req.body as { email?: string }
  if (!email?.trim()) return res.status(400).json({ error: 'Email is required' })
  const record = await store.findUserByEmail(email.trim())
  if (record) {
    const token = await store.createPasswordReset(record.id)
    const resetUrl = `${baseUrl()}/reset-password?token=${token}`
    await sendPasswordResetEmail({ to: record.email, name: record.name, resetUrl })
  }
  res.json({ message: 'If that email exists, a reset link was sent.' })
})

authRouter.post('/reset-password', async (req, res) => {
  const { token, password } = req.body as { token?: string; password?: string }
  if (!token || !password || password.length < 6) {
    return res.status(400).json({ error: 'Valid token and password (6+ chars) required' })
  }
  const userId = await store.consumePasswordReset(token)
  if (!userId) return res.status(400).json({ error: 'Invalid or expired reset link' })
  const passwordHash = await hashPassword(password)
  await store.updateUserPassword(userId, passwordHash)
  res.json({ message: 'Password updated' })
})

authRouter.get('/assignments', requireAuth, async (req: AuthedRequest, res) => {
  if (req.auth!.role === 'learner') {
    res.json(await store.listLearnerAssignments(req.auth!.userId))
    return
  }
  res.json([])
})
