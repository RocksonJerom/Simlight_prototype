import type {
  AssessmentType,
  Decision,
  Event,
  EventAssessment,
  FormulaVariable,
} from '../types/simulation'

export const ASSESSMENT_TYPE_LABELS: Record<AssessmentType, string> = {
  mcq: 'Multiple choice',
  text: 'Text response',
  chart: 'Chart-based',
  formula: 'Formula / numeric',
  fill_blank: 'Fill in the blanks',
}

export function getAssessmentType(event: Event): AssessmentType {
  return event.assessment?.type ?? 'mcq'
}

export function getAssessmentPrompt(event: Event): string {
  return event.assessment?.prompt ?? 'What is your decision?'
}

export function defaultAssessment(type: AssessmentType = 'mcq'): EventAssessment {
  const base = { type, prompt: 'What is your decision?' }
  switch (type) {
    case 'text':
      return { ...base, placeholder: 'Type your analysis here…', minLength: 30 }
    case 'chart':
      return {
        ...base,
        prompt: 'Based on the chart, what action do you recommend?',
        chart: {
          type: 'bar',
          title: 'Performance metrics',
          labels: ['Q1', 'Q2', 'Q3', 'Q4'],
          values: [40, 55, 48, 62],
        },
        chartOptions: [
          { id: `co_${Date.now()}_1`, text: 'Option A' },
          { id: `co_${Date.now()}_2`, text: 'Option B' },
        ],
      }
    case 'formula':
      return {
        ...base,
        prompt: 'Calculate the result using the values below.',
        formula: 'ROI (%) = ((Gain − Cost) / Cost) × 100',
        variables: [
          { name: 'Gain', value: '120000' },
          { name: 'Cost', value: '80000' },
        ],
        expectedAnswer: '50',
        tolerance: 0.05,
      }
    case 'fill_blank':
      return {
        ...base,
        prompt: 'Complete the statement.',
        fillTemplate: 'The primary risk is ___ and the mitigation strategy is ___.',
        blanks: [
          { id: `b_${Date.now()}_1`, answer: 'supply delay', placeholder: 'risk' },
          { id: `b_${Date.now()}_2`, answer: 'dual sourcing', placeholder: 'strategy' },
        ],
      }
    default:
      return base
  }
}

export function ensureAssessment(event: Event): EventAssessment {
  if (event.assessment) return event.assessment
  return defaultAssessment('mcq')
}

export function assessmentOptionsForEvent(event: Event): Decision[] {
  const type = getAssessmentType(event)
  if (type === 'chart') return event.assessment?.chartOptions ?? []
  return event.decisions
}

export function syncBlanksFromTemplate(template: string, existing: EventAssessment['blanks'] = []) {
  const parts = template.split('___')
  const blankCount = Math.max(0, parts.length - 1)
  const blanks = Array.from({ length: blankCount }, (_, i) => {
    const prev = existing[i]
    return prev ?? { id: `b_${Date.now()}_${i}`, answer: '', placeholder: `blank ${i + 1}` }
  })
  return blanks
}

export function parseNumericAnswer(value: string): number | null {
  const cleaned = value.replace(/[,%$₹\s]/g, '')
  const n = parseFloat(cleaned)
  return Number.isFinite(n) ? n : null
}

export function scoreFormulaAnswer(expected: string, given: string, tolerance = 0.05): number {
  const exp = parseNumericAnswer(expected)
  const ans = parseNumericAnswer(given)
  if (exp === null || ans === null) return 0.5
  const margin = Math.max(Math.abs(exp) * tolerance, 0.01)
  if (Math.abs(ans - exp) <= margin) return 1
  if (Math.abs(ans - exp) <= margin * 3) return 0.5
  return 0
}

export function scoreFillBlanks(
  blanks: { id: string; answer: string }[],
  responses: Record<string, string>
): number {
  if (!blanks.length) return 0.5
  const correct = blanks.filter(
    (b) => responses[b.id]?.trim().toLowerCase() === b.answer.trim().toLowerCase()
  ).length
  return correct / blanks.length
}

export function qualityToDecisionIndex(quality: number, optionCount = 3): number {
  const clamped = Math.max(0, Math.min(1, quality))
  return Math.min(optionCount - 1, Math.round((1 - clamped) * (optionCount - 1)))
}

export function newDecision(text = 'New option'): Decision {
  return { id: `d${Date.now()}_${Math.random().toString(36).slice(2, 5)}`, text }
}

export function newFormulaVariable(): FormulaVariable {
  return { name: 'Variable', value: '0' }
}
