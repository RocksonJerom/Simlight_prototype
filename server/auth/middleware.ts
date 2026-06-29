import type { Request, Response, NextFunction } from 'express'
import { verifyToken } from './jwt.js'
import type { JwtPayload } from '../../src/types/auth.js'

export interface AuthedRequest extends Request {
  auth?: JwtPayload
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) {
    res.status(401).json({ error: 'Authentication required' })
    return
  }
  try {
    req.auth = verifyToken(token)
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

export function requireFaculty(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!req.auth) {
    res.status(401).json({ error: 'Authentication required' })
    return
  }
  if (req.auth.role !== 'faculty' && req.auth.role !== 'admin') {
    res.status(403).json({ error: 'Faculty access required' })
    return
  }
  next()
}
