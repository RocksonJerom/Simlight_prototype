export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced'
export type Visibility = 'private' | 'organization' | 'public'
export type ScoringType = 'manual' | 'ai-assisted'
export type ContentCreationMode = 'ai' | 'manual' | 'document'
export type ContentBlockType = 'text' | 'table' | 'chart'
export type ChartType = 'bar' | 'line' | 'pie'

export interface ContentTable {
  headers: string[]
  rows: string[][]
}

export interface ContentChart {
  type: ChartType
  title: string
  labels: string[]
  values: number[]
}

export interface ContentBlock {
  id: string
  type: ContentBlockType
  title?: string
  text?: string
  table?: ContentTable
  chart?: ContentChart
}
export type PlayMode = 'single' | 'multiplayer'
export type AiGenerationSource = 'openai' | 'anthropic' | 'nvidia' | 'groq' | 'mock'

export interface SimulationMeta {
  title: string
  domain: string
  industry: string
  difficulty: Difficulty
  duration: string
  learningObjectives: string[]
  contentMode?: ContentCreationMode
  playMode?: PlayMode
  maxPlayers?: number
}

export interface Decision {
  id: string
  text: string
}

export interface Event {
  id: string
  phaseId: string
  title: string
  description: string
  impact: {
    cost: 'Low' | 'Medium' | 'High'
    budget: 'Up' | 'Down' | 'Neutral'
    risk: 'Low' | 'Medium' | 'High'
  }
  decisions: Decision[]
  contentBlocks?: ContentBlock[]
}

export interface Phase {
  id: string
  name: string
  order: number
}

export interface ScoringMetric {
  id: string
  name: string
  weight: number
  description: string
}

export interface MediaAsset {
  id: string
  type: 'image' | 'document' | 'video'
  name: string
  size?: string
  url?: string
}

export interface GeneratedContent {
  scenario: string
  phases: Phase[]
  events: Event[]
  metrics: ScoringMetric[]
}

export interface SimulationRecord {
  id: string
  orgId: string
  createdBy: string
  meta: SimulationMeta
  generated: GeneratedContent | null
  assets: MediaAsset[]
  scoringType: ScoringType
  visibility: Visibility
  isPublished: boolean
  aiGenerationComplete: boolean
  aiGenerationSource?: AiGenerationSource
  playToken?: string
  version: number
  createdAt: string
  updatedAt: string
}

export interface PlaySession {
  id: string
  simulationId: string
  assignmentId?: string
  userId?: string
  learnerName: string
  currentEventIndex: number
  score: number
  budget: number
  risk: number
  metricScores: Record<string, number>
  decisionsMade: {
    eventId: string
    decisionId: string
    points: number
    metricDeltas?: Record<string, number>
    aiFeedback?: string
  }[]
  completed: boolean
  startedAt: string
  completedAt?: string
  timeLimitSeconds?: number
  expiresAt?: string
}

export interface Assignment {
  id: string
  simulationId: string
  learnerName: string
  learnerEmail?: string
  userId?: string
  assignedAt: string
  dueDate?: string
  status: 'pending' | 'in_progress' | 'completed' | 'overdue'
  sessionId?: string
  inviteToken?: string
}

export interface SimulationAnalytics {
  simulationId: string
  title: string
  totalAssignments: number
  completedSessions: number
  inProgressSessions: number
  avgScore: number
  completionRate: number
  activeLearners: number
  skillDistribution: { name: string; avg: number }[]
  scoreTrend: { label: string; score: number }[]
  leaderboard: { rank: number; name: string; score: number; xp: number }[]
  sessions: PlaySession[]
  assignments: Assignment[]
}

export type SimulationState = Omit<SimulationRecord, 'id' | 'createdAt' | 'updatedAt'>

export type WizardStep = 1 | 2 | 3 | 4 | 5 | 6 | 7
