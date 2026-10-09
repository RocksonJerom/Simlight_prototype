import type {
  V2Simulation,
  SimulationRule,
  RuleCondition,
  LiveVariable,
  VariableDelta,
  DecisionValues,
  RoundSimulationResult,
  AppliedConsequence,
  TriggeredEventOutcome,
  V2Scorecard,
  V2ScorecardMetric,
} from '../types/v2.js'

/**
 * Format variable numbers based on unit
 */
export function formatVariableValue(value: number, unit: string): string {
  if (value === undefined || value === null || isNaN(value)) return '0'
  const rounded = Math.round(value * 10) / 10

  switch (unit) {
    case 'currency_inr': {
      if (Math.abs(value) >= 10000000) {
        return `₹${(value / 10000000).toFixed(2)} Cr`
      }
      if (Math.abs(value) >= 100000) {
        return `₹${(value / 100000).toFixed(2)} Lakh`
      }
      return `₹${value.toLocaleString('en-IN')}`
    }
    case 'currency_usd': {
      if (Math.abs(value) >= 1000000) {
        return `$${(value / 1000000).toFixed(2)}M`
      }
      if (Math.abs(value) >= 1000) {
        return `$${(value / 1000).toFixed(1)}k`
      }
      return `$${value.toLocaleString('en-US')}`
    }
    case 'percent':
      return `${rounded}%`
    case 'units':
      return `${Math.round(value).toLocaleString()} units`
    case 'ratio':
      return `${value.toFixed(2)}x`
    default:
      return `${rounded}`
  }
}

/**
 * Evaluates an atomic condition
 */
export function evaluateCondition(
  condition: RuleCondition,
  decisions: DecisionValues,
  currentVars: Record<string, number>,
  roundNumber: number
): boolean {
  let targetVal: any

  if (condition.targetType === 'round') {
    targetVal = roundNumber
  } else if (condition.targetType === 'variable') {
    targetVal = currentVars[condition.targetId] ?? 0
  } else if (condition.targetType === 'decision') {
    targetVal = decisions[condition.targetId]
  }

  if (targetVal === undefined) return false

  const condVal = condition.value

  switch (condition.operator) {
    case 'equals':
      return String(targetVal).toLowerCase() === String(condVal).toLowerCase()

    case 'not_equals':
      return String(targetVal).toLowerCase() !== String(condVal).toLowerCase()

    case 'greater_than':
      return Number(targetVal) > Number(condVal)

    case 'greater_than_or_equal':
      return Number(targetVal) >= Number(condVal)

    case 'less_than':
      return Number(targetVal) < Number(condVal)

    case 'less_than_or_equal':
      return Number(targetVal) <= Number(condVal)

    case 'includes': {
      if (Array.isArray(targetVal)) {
        return targetVal.includes(condVal)
      }
      return String(targetVal).toLowerCase().includes(String(condVal).toLowerCase())
    }

    case 'between': {
      if (Array.isArray(condVal) && condVal.length === 2) {
        const num = Number(targetVal)
        return num >= Number(condVal[0]) && num <= Number(condVal[1])
      }
      return false
    }

    default:
      return false
  }
}

/**
 * Checks if a complete rule matches
 */
export function evaluateRule(
  rule: SimulationRule,
  decisions: DecisionValues,
  currentVars: Record<string, number>,
  roundNumber: number
): boolean {
  if (!rule.conditions || rule.conditions.length === 0) return true

  const isOr = rule.logic === 'OR'

  for (const condition of rule.conditions) {
    const passed = evaluateCondition(condition, decisions, currentVars, roundNumber)
    if (isOr && passed) return true
    if (!isOr && !passed) return false
  }

  return !isOr
}

/**
 * Applies a mathematical delta to a variable and clamps within limits
 */
export function applyDelta(
  currentValue: number,
  delta: VariableDelta,
  variableDef?: LiveVariable
): number {
  let nextVal = currentValue

  switch (delta.operation) {
    case 'add':
      nextVal = currentValue + delta.value
      break
    case 'subtract':
      nextVal = currentValue - delta.value
      break
    case 'percent_change':
      nextVal = currentValue * (1 + delta.value / 100)
      break
    case 'set':
      nextVal = delta.value
      break
  }

  if (variableDef) {
    if (variableDef.min !== undefined && nextVal < variableDef.min) {
      nextVal = variableDef.min
    }
    if (variableDef.max !== undefined && nextVal > variableDef.max) {
      nextVal = variableDef.max
    }
  }

  return Math.round(nextVal * 100) / 100
}

/**
 * Simulates a student's decisions for a given round
 */
export function simulateRound(
  simulation: V2Simulation,
  currentVariables: Record<string, number>,
  roundNumber: number,
  decisions: DecisionValues,
  randomFloat = Math.random()
): RoundSimulationResult {
  const round = simulation.rounds.find((r) => r.roundNumber === roundNumber)
  if (!round) {
    throw new Error(`Round ${roundNumber} not found in simulation ${simulation.title}`)
  }

  const varMap = new Map(simulation.variables.map((v) => [v.id, v]))
  const updatedVariables: Record<string, number> = { ...currentVariables }

  const appliedConsequences: AppliedConsequence[] = []
  const triggeredEvents: TriggeredEventOutcome[] = []

  // 1. Evaluate and apply Rules
  for (const rule of round.rules || []) {
    if (evaluateRule(rule, decisions, updatedVariables, roundNumber)) {
      const deltasApplied: AppliedConsequence['variableDeltas'] = []

      for (const d of rule.variableDeltas) {
        const vDef = varMap.get(d.variableId)
        const oldVal = updatedVariables[d.variableId] ?? (vDef?.initialValue ?? 0)
        const newVal = applyDelta(oldVal, d, vDef)
        updatedVariables[d.variableId] = newVal

        deltasApplied.push({
          variableId: d.variableId,
          variableLabel: vDef?.label || d.variableId,
          unit: vDef?.unit || 'units',
          oldValue: oldVal,
          newValue: newVal,
          delta: newVal - oldVal,
          operation: d.operation,
        })
      }

      appliedConsequences.push({
        ruleId: rule.id,
        ruleName: rule.name,
        narrative: rule.narrativeFeedback,
        variableDeltas: deltasApplied,
      })
    }
  }

  // 2. Evaluate Dynamic Events (fixed, conditional, or probabilistic)
  for (const event of round.events || []) {
    let triggered = false

    if (event.triggerType === 'round') {
      triggered = event.triggerRound === roundNumber || event.triggerRound === undefined
    } else if (event.triggerType === 'condition' && event.condition) {
      triggered = evaluateCondition(event.condition, decisions, updatedVariables, roundNumber)
    } else if (event.triggerType === 'probability') {
      const p = event.probability ?? 0.5
      triggered = randomFloat <= p
    }

    if (triggered) {
      const eventDeltas: TriggeredEventOutcome['variableDeltas'] = []

      for (const d of event.impactDeltas || []) {
        const vDef = varMap.get(d.variableId)
        const oldVal = updatedVariables[d.variableId] ?? (vDef?.initialValue ?? 0)
        const newVal = applyDelta(oldVal, d, vDef)
        updatedVariables[d.variableId] = newVal

        eventDeltas.push({
          variableId: d.variableId,
          variableLabel: vDef?.label || d.variableId,
          unit: vDef?.unit || 'units',
          oldValue: oldVal,
          newValue: newVal,
          delta: newVal - oldVal,
        })
      }

      triggeredEvents.push({
        eventId: event.id,
        title: event.title,
        narrative: event.narrative,
        severity: event.severity,
        variableDeltas: eventDeltas,
      })
    }
  }

  // 3. Synthesize summary trade-off
  const summaryTradeOff = generateTradeOffStatement(appliedConsequences, varMap)

  return {
    roundNumber,
    decisions,
    appliedConsequences,
    triggeredEvents,
    previousVariables: { ...currentVariables },
    updatedVariables,
    summaryTradeOff,
  }
}

/**
 * Creates an educational trade-off narrative summary
 */
function generateTradeOffStatement(
  consequences: AppliedConsequence[],
  varMap: Map<string, LiveVariable>
): string {
  if (consequences.length === 0) {
    return 'Your decisions have been locked in. Company operations proceed along baseline projections.'
  }

  // Combine top positive and negative variable shifts
  const positiveShifts: string[] = []
  const negativeShifts: string[] = []

  for (const c of consequences) {
    for (const d of c.variableDeltas) {
      const vDef = varMap.get(d.variableId)
      const higherIsBetter = vDef?.targetDirection !== 'lower_is_better'
      const isPositive = higherIsBetter ? d.delta > 0 : d.delta < 0
      const formattedDiff = formatVariableValue(Math.abs(d.delta), d.unit)

      if (Math.abs(d.delta) > 0.01) {
        if (isPositive) {
          positiveShifts.push(`${vDef?.label || d.variableId} improved by ${formattedDiff}`)
        } else {
          negativeShifts.push(`${vDef?.label || d.variableId} strained by ${formattedDiff}`)
        }
      }
    }
  }

  if (positiveShifts.length > 0 && negativeShifts.length > 0) {
    return `Strategic Trade-Off: ${positiveShifts[0]}, but ${negativeShifts[0]}.`
  }

  if (consequences[0]?.narrative) {
    return consequences[0].narrative
  }

  return 'Decisions successfully executed across corporate resources.'
}

/**
 * Calculates end-of-simulation holistic performance scorecard
 */
export function calculateScorecard(
  simulation: V2Simulation,
  initialVars: Record<string, number>,
  finalVars: Record<string, number>,
  history: RoundSimulationResult[]
): V2Scorecard {
  const metrics: V2ScorecardMetric[] = simulation.variables.map((v) => {
    const init = initialVars[v.id] ?? v.initialValue
    const fin = finalVars[v.id] ?? init
    const change = Math.round((fin - init) * 100) / 100
    const pct = init !== 0 ? Math.round((change / Math.abs(init)) * 1000) / 10 : 0

    const higherIsBetter = v.targetDirection !== 'lower_is_better'
    let status: V2ScorecardMetric['status'] = 'neutral'
    if (Math.abs(change) > 0.01) {
      status = higherIsBetter ? (change > 0 ? 'positive' : 'negative') : change < 0 ? 'positive' : 'negative'
    }

    return {
      id: v.id,
      label: v.label,
      unit: v.unit,
      initialValue: init,
      finalValue: fin,
      change,
      percentChange: pct,
      status,
    }
  })

  // Determine Archetype
  const positives = metrics.filter((m) => m.status === 'positive').length
  const negatives = metrics.filter((m) => m.status === 'negative').length

  let strategicArchetype = 'Balanced Execution'
  if (positives > negatives * 2) {
    strategicArchetype = 'High-Growth & Aggressive Optimization'
  } else if (negatives > positives) {
    strategicArchetype = 'Risk-Exposed / Strained Operations'
  } else {
    strategicArchetype = 'Prudent & Sustainable Management'
  }

  const strengths: string[] = metrics
    .filter((m) => m.status === 'positive')
    .map((m) => `${m.label} increased by ${formatVariableValue(Math.abs(m.change), m.unit)} (${m.percentChange > 0 ? '+' : ''}${m.percentChange}%)`)

  const tradeOffsNoted: string[] = metrics
    .filter((m) => m.status === 'negative')
    .map((m) => `${m.label} reduced by ${formatVariableValue(Math.abs(m.change), m.unit)} (${m.percentChange}%)`)

  const summary = `Completed ${history.length} decision rounds across ${simulation.companyName}. You managed operations with a ${strategicArchetype.toLowerCase()} posture, navigating trade-offs between cost containment, capacity, and customer risk.`

  const overallScore = Math.max(40, Math.min(98, Math.round(65 + (positives - negatives) * 10)))

  const baseScorecard = {
    metrics,
    strategicArchetype,
    summary,
    strengths: strengths.length ? strengths : ['Maintained baseline operational continuity'],
    tradeOffsNoted: tradeOffsNoted.length ? tradeOffsNoted : ['No significant negative trade-offs detected'],
    overallScore,
  }

  const behaviorInsights = calculateBehaviorInsights(simulation, history, baseScorecard)

  return {
    ...baseScorecard,
    behaviorInsights,
  }
}

/**
 * Re-simulates from a specific round with alternative decisions (What-If Analysis)
 */
export function simulateWhatIf(
  simulation: V2Simulation,
  originalHistory: RoundSimulationResult[],
  targetRoundNumber: number,
  newDecisions: DecisionValues
): {
  replayedHistory: RoundSimulationResult[]
  alternativeScorecard: V2Scorecard
} {
  const initialVars: Record<string, number> = {}
  simulation.variables.forEach((v) => {
    initialVars[v.id] = v.initialValue
  })

  const replayedHistory: RoundSimulationResult[] = []
  let runningVars = { ...initialVars }

  for (let i = 0; i < originalHistory.length; i++) {
    const roundNum = i + 1
    const decisionsToUse = roundNum === targetRoundNumber ? newDecisions : originalHistory[i].decisions

    const res = simulateRound(simulation, runningVars, roundNum, decisionsToUse, 0.4)
    replayedHistory.push(res)
    runningVars = { ...res.updatedVariables }
  }

  const alternativeScorecard = calculateScorecard(simulation, initialVars, runningVars, replayedHistory)

  return {
    replayedHistory,
    alternativeScorecard,
  }
}

export interface BehaviorInsights {
  riskProfile: string
  capitalStyle: string
  strategicFocus: string
  keyTraitSummary: string
}

/**
 * Computes behavioral play insights based on decisions made across phases
 */
export function calculateBehaviorInsights(
  simulation: V2Simulation,
  history: RoundSimulationResult[],
  scorecard: V2Scorecard
): BehaviorInsights {
  let highRiskCount = 0
  let conservativeCount = 0

  for (const roundRes of history) {
    const roundDef = simulation.rounds.find((r) => r.roundNumber === roundRes.roundNumber)
    for (const dDef of roundDef?.decisions || []) {
      const val = roundRes.decisions[dDef.id]
      if (dDef.type === 'slider' && dDef.max) {
        const ratio = (Number(val) - (dDef.min || 0)) / (dDef.max - (dDef.min || 0))
        if (ratio >= 0.6) highRiskCount++
        else if (ratio <= 0.35) conservativeCount++
      } else if (dDef.type === 'select') {
        const selectedOpt = dDef.options?.find((o) => o.id === val)
        const optTitle = (selectedOpt?.label || '').toLowerCase()
        if (optTitle.includes('aggressive') || optTitle.includes('expand') || optTitle.includes('automate') || optTitle.includes('rush')) {
          highRiskCount++
        } else if (optTitle.includes('conservative') || optTitle.includes('delay') || optTitle.includes('contain') || optTitle.includes('maintain')) {
          conservativeCount++
        }
      }
    }
  }

  // Determine Risk Profile
  let riskProfile = 'Prudent & Balanced Strategist'
  if (highRiskCount > conservativeCount + 1) {
    riskProfile = 'Aggressive Growth Risk-Taker'
  } else if (conservativeCount > highRiskCount + 1) {
    riskProfile = 'Risk-Averse Capital Guardian'
  }

  // Determine Capital Style
  let capitalStyle = 'Balanced Value Optimizer'
  const cashMetric = scorecard.metrics?.find((m) => m.id.toLowerCase().includes('cash') || m.id.toLowerCase().includes('budget'))
  if (cashMetric && cashMetric.change < -75000) {
    capitalStyle = 'Heavy Growth Capex Deployer'
  } else if (cashMetric && cashMetric.change >= 0) {
    capitalStyle = 'Cash Protective & Margin Preserver'
  }

  // Determine Strategic Focus
  let strategicFocus = 'Balanced Corporate Execution'
  const capacityMetric = scorecard.metrics?.find((m) => m.id.toLowerCase().includes('capacity') || m.id.toLowerCase().includes('production'))
  if (capacityMetric && capacityMetric.percentChange > 15) {
    strategicFocus = 'Scale & Production Capacity Expansion'
  } else if (cashMetric && cashMetric.percentChange > 10) {
    strategicFocus = 'Liquidity & Cash Flow Protection'
  }

  const keyTraitSummary = `The player demonstrated a ${riskProfile.toLowerCase()} posture, deploying a ${capitalStyle.toLowerCase()} approach that prioritized ${strategicFocus.toLowerCase()} across all ${history.length} operational phases.`

  return {
    riskProfile,
    capitalStyle,
    strategicFocus,
    keyTraitSummary,
  }
}
