export interface DecisionRecord {
  eventId: string
  decisionId: string
  points: number
  metricScores?: Record<string, number>
  aiFeedback?: string
}

export interface OrgInvite {
  id: string
  orgId: string
  email: string
  name: string
  role: 'faculty' | 'learner' | 'admin'
  token: string
  invitedBy: string
  createdAt: string
  acceptedAt?: string
}

export interface PasswordReset {
  id: string
  userId: string
  token: string
  expiresAt: string
  usedAt?: string
}

export interface MarketplaceItem {
  id: string
  title: string
  domain: string
  industry: string
  difficulty: string
  duration: string
  orgName: string
  publishedAt: string
  playCount: number
  avgScore: number
  thumbnailUrl?: string
  thumbnailType?: 'image' | 'video'
  eventCount?: number
}

export interface PublicSimulationDetail extends MarketplaceItem {
  scenario?: string
  learningObjectives: string[]
  phases: number
  playMode?: 'single' | 'multiplayer'
  maxPlayers?: number
  assets: { id: string; type: 'image' | 'video' | 'document'; name: string; url?: string }[]
}

export interface CatalogHome {
  featured: MarketplaceItem[]
  newThisWeek: MarketplaceItem[]
  topPlayed: MarketplaceItem[]
  financialLiteracy: MarketplaceItem[]
  operations: MarketplaceItem[]
  businessStrategy: MarketplaceItem[]
  leadership: MarketplaceItem[]
}

export interface CatalogCategory {
  slug: string
  name: string
  domains: string[]
}
