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

export type AssessmentType = 'mcq' | 'text' | 'chart' | 'formula' | 'fill_blank'

export interface AssessmentBlank {
  id: string
  answer: string
  placeholder?: string
}

export interface FormulaVariable {
  name: string
  value: string
}

export interface EventAssessment {
  type: AssessmentType
  prompt: string
  placeholder?: string
  minLength?: number
  chart?: ContentChart
  chartOptions?: Decision[]
  formula?: string
  variables?: FormulaVariable[]
  expectedAnswer?: string
  tolerance?: number
  fillTemplate?: string
  blanks?: AssessmentBlank[]
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
  assessment?: EventAssessment
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
  v2Data?: any
  reportConfig?: ReportCustomizationConfig
  createdAt: string
  updatedAt: string
}

export interface PlaySession {
  id: string
  simulationId: string
  assignmentId?: string
  userId?: string
  learnerName: string
  regNumber?: string
  currentEventIndex: number
  score: number
  budget: number
  risk: number
  metricScores: Record<string, number>
  decisionsMade: {
    eventId: string
    decisionId: string
    response?: string
    points: number
    metricDeltas?: Record<string, number>
    aiFeedback?: string
  }[]
  roundHistory?: any[]
  scorecard?: any
  completed: boolean
  startedAt: string
  completedAt?: string
  timeLimitSeconds?: number
  expiresAt?: string
}

export interface Assignment {
  id: string
  simulationId: string
  simulationTitle?: string
  learnerName: string
  learnerEmail?: string
  regNumber?: string
  userId?: string
  assignedAt: string
  dueDate?: string
  status: 'pending' | 'in_progress' | 'completed' | 'overdue'
  sessionId?: string
  inviteToken?: string
}

export interface StudentReportData {
  session: PlaySession
  simulation: {
    id: string
    title: string
    industry?: string
    difficulty?: string
    duration?: string
    companyName?: string
    companyOverview?: string
    learningObjectives?: string[]
    variables?: any[]
    rounds?: any[]
    isV2?: boolean
  }
  learner: {
    name: string
    regNumber: string
    email?: string
  }
  scorecard?: {
    metrics: {
      id: string
      label: string
      unit?: string
      initialValue: number
      finalValue: number
      change: number
      percentChange: number
      status: 'positive' | 'neutral' | 'negative'
    }[]
    strategicArchetype: string
    summary: string
    strengths: string[]
    tradeOffsNoted: string[]
  }
  decisionInsights: {
    roundNumber: number
    title: string
    decisions: Record<string, any>
    appliedConsequences: {
      ruleId: string
      ruleName: string
      narrative: string
      variableDeltas: any[]
    }[]
    tradeOffSummary: string
  }[]
    cohortComparison?: {
    totalParticipants: number
    rank: number
    percentile: number
    classAverageScore: number
    highestScore: number
    medianScore: number
    metricAverages: Record<string, number>
  }
  behaviorInsights?: {
    riskProfile: string
    capitalStyle: string
    strategicFocus: string
    keyTraitSummary: string
  }
  customization?: ReportCustomizationConfig
}

export interface ReportCustomizationConfig {
  showOverallScore: boolean
  showGrade: boolean
  showStrategicArchetype: boolean
  showExecutiveSummary: boolean
  showStrengthsAndTradeoffs: boolean
  showBehaviorInsights: boolean
  showKpiTrajectory: boolean
  showDecisionAudit: boolean
  showCohortBenchmark: boolean
  showStudentRegNumber: boolean
  showStudentEmail: boolean
  facultyNotes?: string
}

export const DEFAULT_REPORT_CUSTOMIZATION: ReportCustomizationConfig = {
  showOverallScore: true,
  showGrade: true,
  showStrategicArchetype: true,
  showExecutiveSummary: true,
  showStrengthsAndTradeoffs: true,
  showBehaviorInsights: true,
  showKpiTrajectory: true,
  showDecisionAudit: true,
  showCohortBenchmark: true,
  showStudentRegNumber: true,
  showStudentEmail: true,
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
