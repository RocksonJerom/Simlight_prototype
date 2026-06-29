import nodemailer from 'nodemailer'
import { randomUUID } from 'crypto'
import { getDatabase } from '../database.js'

const transporter =
  process.env.SMTP_HOST && process.env.SMTP_USER
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      })
    : null

export async function sendAssignmentEmail(opts: {
  to: string
  learnerName: string
  simulationTitle: string
  playUrl: string
  dueDate?: string
}): Promise<boolean> {
  const subject = `SimLight: You've been assigned "${opts.simulationTitle}"`
  const body = `Hi ${opts.learnerName},\n\nYou have been assigned the simulation "${opts.simulationTitle}".\n\nPlay here: ${opts.playUrl}\n${opts.dueDate ? `\nDue date: ${opts.dueDate}\n` : ''}\n— SimLight`

  logEmail(opts.to, subject, body)

  if (!transporter) {
    console.log(`[Email] (log only) To: ${opts.to}\n${body}`)
    return false
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? 'simlight@localhost',
      to: opts.to,
      subject,
      text: body,
    })
    return true
  } catch (e) {
    console.error('[Email] send failed:', e)
    return false
  }
}

export async function sendPasswordResetEmail(opts: {
  to: string
  name: string
  resetUrl: string
}): Promise<boolean> {
  const subject = 'SimLight: Reset your password'
  const body = `Hi ${opts.name},\n\nReset your password: ${opts.resetUrl}\n\nThis link expires in 1 hour.\n— SimLight`

  logEmail(opts.to, subject, body)
  if (!transporter) {
    console.log(`[Email] (log only) Password reset for ${opts.to}: ${opts.resetUrl}`)
    return false
  }
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? 'simlight@localhost',
      to: opts.to,
      subject,
      text: body,
    })
    return true
  } catch {
    return false
  }
}

function logEmail(to: string, subject: string, body: string) {
  const db = getDatabase()
  db.prepare(
    `INSERT INTO email_log (id, recipient, subject, body, created_at) VALUES (?, ?, ?, ?, ?)`
  ).run(randomUUID(), to, subject, body, new Date().toISOString())
}

export async function sendInviteEmail(opts: {
  to: string
  orgName: string
  inviteUrl: string
}): Promise<boolean> {
  const subject = `Join ${opts.orgName} on SimLight`
  const body = `You've been invited to join ${opts.orgName} on SimLight.\n\nAccept: ${opts.inviteUrl}`

  logEmail(opts.to, subject, body)
  if (!transporter) {
    console.log(`[Email] (log only) Invite to ${opts.to}: ${opts.inviteUrl}`)
    return false
  }
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? 'simlight@localhost',
      to: opts.to,
      subject,
      text: body,
    })
    return true
  } catch {
    return false
  }
}
