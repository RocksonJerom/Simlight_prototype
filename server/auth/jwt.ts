import jwt from 'jsonwebtoken'
import { config } from '../config.js'
import type { JwtPayload } from '../../src/types/auth.js'

const EXPIRES_IN = '7d'

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: EXPIRES_IN })
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwtSecret) as JwtPayload
}
