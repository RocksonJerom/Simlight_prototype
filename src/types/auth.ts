export type UserRole = 'faculty' | 'learner' | 'admin'

export interface Organization {
  id: string
  name: string
  slug: string
  createdAt: string
}

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  orgId: string
  createdAt: string
}

export interface AuthUser {
  user: User
  organization: Organization
}

export interface JwtPayload {
  userId: string
  orgId: string
  role: UserRole
  email: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  orgName: string
  name: string
  email: string
  password: string
}
