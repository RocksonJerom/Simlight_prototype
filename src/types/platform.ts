export type LeadStatus = 'NEW' | 'CONTACTED' | 'IN PROGRESS' | 'CONVERTED'

export interface Lead {
  id: string
  orgName: string
  segment: string
  contactName: string
  contactEmail?: string
  status: LeadStatus
  notes?: string
  createdAt: string
  convertedOrgId?: string
}

export interface Course {
  id: string
  orgId?: string
  name: string
  category: string
  courseType: 'Core' | 'Elective' | 'Advanced'
  status: 'active' | 'draft'
  createdAt: string
}

export interface Tagline {
  id: string
  orgId?: string
  text: string
  status: 'active' | 'draft'
  createdAt: string
}

export interface SimJobRole {
  id: string
  orgId?: string
  name: string
  description?: string
  createdAt: string
}

export interface OrgGroup {
  id: string
  orgId: string
  name: string
  description?: string
  memberCount: number
  createdAt: string
}

export interface OrgMember {
  id: string
  orgId: string
  name: string
  email: string
  role: 'admin' | 'faculty' | 'learner'
  groupId?: string
  createdAt: string
}

export interface PlatformStats {
  leads: number
  organizations: number
  courses: number
  simulations: number
  publishedSimulations: number
  activeLearners: number
  conversionsThisMonth: number
}

export interface ConvertLeadInput {
  adminSlots: number
  participantCapacity: number
  aiLimit: number
  courseIds: string[]
  adminEmail: string
  adminName: string
  adminPassword: string
}
