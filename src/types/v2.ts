export type VariableUnit = 'currency_inr' | 'currency_usd' | 'percent' | 'units' | 'points' | 'ratio'

export type VariableCategory = 'financial' | 'operational' | 'market' | 'risk' | 'reputation'

export interface LiveVariable {
  id: string
  label: string
  description?: string
  unit: VariableUnit
  category: VariableCategory
  initialValue: number
  currentValue: number
  min?: number
  max?: number
  step?: number
  targetDirection?: 'higher_is_better' | 'lower_is_better' | 'target_range'
  benchmark?: number
}

export type DecisionComponentType =
  | 'select'
  | 'allocate'
  | 'slider'
  | 'quantity'
  | 'ranking'
  | 'budget'
  | 'portfolio'
  | 'negotiation'

export interface SelectOption {
  id: string
  label: string
  description?: string
  badge?: string
  icon?: string
}

export interface AllocateItem {
  id: string
  label: string
  description?: string
  min?: number
  max?: number
  step?: number
  defaultVal?: number
}

export interface NegotiationTactic {
  id: string
  title: string
  description: string
  riskLevel: 'Low' | 'Medium' | 'High'
  potentialDiscount: string
}

export interface PortfolioItem {
  id: string
  name: string
  investmentCost: number
  expectedReturn: string
  riskProfile: 'Conservative' | 'Moderate' | 'Aggressive'
  description: string
}

export interface DecisionComponent {
  id: string
  type: DecisionComponentType
  label: string
  description?: string
  required?: boolean

  // Specific to 'select'
  options?: SelectOption[]

  // Specific to 'allocate' or 'budget'
  totalBudget?: number
  budgetUnit?: string
  allocateItems?: AllocateItem[]

  // Specific to 'slider' or 'quantity'
  min?: number
  max?: number
  step?: number
  unitLabel?: string
  defaultValue?: number

  // Specific to 'ranking'
  rankingItems?: { id: string; label: string }[]

  // Specific to 'negotiation'
  negotiationOptions?: NegotiationTactic[]

  // Specific to 'portfolio'
  portfolioItems?: PortfolioItem[]
  maxSelectable?: number
}

export type RuleOperator =
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'greater_than_or_equal'
  | 'less_than'
  | 'less_than_or_equal'
  | 'includes'
  | 'between'

export interface RuleCondition {
  targetType: 'decision' | 'variable' | 'round'
  targetId: string // e.g. decision id, variable id, or 'round'
  operator: RuleOperator
  value: string | number | boolean | (string | number)[]
}

export type DeltaOperation = 'add' | 'subtract' | 'percent_change' | 'set'

export interface VariableDelta {
  variableId: string
  operation: DeltaOperation
  value: number
}

export interface SimulationRule {
  id: string
  name: string
  logic?: 'AND' | 'OR'
  conditions: RuleCondition[]
  variableDeltas: VariableDelta[]
  narrativeFeedback: string // Trade-off explanation e.g. "Supplier negotiation successful. Cost reduced by 5%, but delivery reliability declined."
  triggerEventId?: string
}

export interface SimulationEvent {
  id: string
  title: string
  description: string
  triggerType: 'round' | 'condition' | 'probability'
  triggerRound?: number
  probability?: number // 0 to 1
  condition?: RuleCondition
  impactDeltas: VariableDelta[]
  narrative: string
  severity: 'info' | 'warning' | 'critical' | 'success'
}

export interface SimulationRound {
  roundNumber: number
  title: string
  role: string
  company: string
  situationBrief: string
  bulletPoints?: string[]
  decisions: DecisionComponent[]
  rules: SimulationRule[]
  events: SimulationEvent[]
}

export interface V2Simulation {
  id: string
  title: string
  industry: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  duration: string
  learningObjectives: string[]
  companyName: string
  companyOverview: string
  initialRole: string
  variables: LiveVariable[]
  rounds: SimulationRound[]
  version: '2.0'
  createdAt?: string
  updatedAt?: string
}

export type DecisionValues = Record<string, any>

export interface AppliedConsequence {
  ruleId: string
  ruleName: string
  narrative: string
  variableDeltas: {
    variableId: string
    variableLabel: string
    unit: VariableUnit
    oldValue: number
    newValue: number
    delta: number
    operation: DeltaOperation
  }[]
}

export interface TriggeredEventOutcome {
  eventId: string
  title: string
  narrative: string
  severity: 'info' | 'warning' | 'critical' | 'success'
  variableDeltas: {
    variableId: string
    variableLabel: string
    unit: VariableUnit
    oldValue: number
    newValue: number
    delta: number
  }[]
}

export interface RoundSimulationResult {
  roundNumber: number
  decisions: DecisionValues
  appliedConsequences: AppliedConsequence[]
  triggeredEvents: TriggeredEventOutcome[]
  previousVariables: Record<string, number>
  updatedVariables: Record<string, number>
  summaryTradeOff: string
}

export interface V2ScorecardMetric {
  id: string
  label: string
  unit: VariableUnit
  initialValue: number
  finalValue: number
  change: number
  percentChange: number
  status: 'positive' | 'neutral' | 'negative'
}

export interface V2Scorecard {
  metrics: V2ScorecardMetric[]
  strategicArchetype: string
  summary: string
  strengths: string[]
  tradeOffsNoted: string[]
  overallScore?: number
  behaviorInsights?: {
    riskProfile: string
    capitalStyle: string
    strategicFocus: string
    keyTraitSummary: string
  }
}

export interface V2SessionState {
  sessionId: string
  simulationId: string
  assignmentId?: string
  learnerName: string
  regNumber?: string
  currentRoundIndex: number // 0-indexed
  completed: boolean
  variables: Record<string, number>
  history: RoundSimulationResult[]
  scorecard?: V2Scorecard
  startedAt: string
  completedAt?: string
}
