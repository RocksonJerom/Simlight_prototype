import type { Event } from '../../src/types/simulation.js'
import {
  assessmentOptionsForEvent,
  getAssessmentType,
  qualityToDecisionIndex,
  scoreFillBlanks,
  scoreFormulaAnswer,
} from '../../src/utils/assessment.js'

export interface DecidePayload {
  decisionId?: string
  response?: {
    text?: string
    value?: string
    blanks?: Record<string, string>
  }
}

export function resolveDecisionFromPayload(
  event: Event,
  payload: DecidePayload
): { decisionIndex: number; decisionId: string; feedbackText: string; responseText?: string } {
  const type = getAssessmentType(event)
  const assessment = event.assessment
  const options = assessmentOptionsForEvent(event)
  const optionCount = Math.max(options.length, 3)

  if (type === 'mcq' || type === 'chart') {
    const decision = options.find((d) => d.id === payload.decisionId)
    if (!decision) throw new Error('Invalid decision')
    const decisionIndex = options.findIndex((d) => d.id === payload.decisionId)
    return {
      decisionIndex,
      decisionId: decision.id,
      feedbackText: decision.text,
    }
  }

  if (type === 'text') {
    const text = (payload.response?.text ?? '').trim()
    const minLen = assessment?.minLength ?? 30
    const quality = text.length >= minLen ? 1 : text.length >= minLen / 2 ? 0.5 : 0.2
    return {
      decisionIndex: qualityToDecisionIndex(quality, optionCount),
      decisionId: `text_${event.id}`,
      feedbackText: text || '(no response)',
      responseText: text,
    }
  }

  if (type === 'formula') {
    const value = payload.response?.value ?? ''
    const quality = scoreFormulaAnswer(
      assessment?.expectedAnswer ?? '0',
      value,
      assessment?.tolerance ?? 0.05
    )
    return {
      decisionIndex: qualityToDecisionIndex(quality, optionCount),
      decisionId: `formula_${event.id}`,
      feedbackText: value ? `Answer: ${value}` : '(no answer)',
      responseText: value,
    }
  }

  if (type === 'fill_blank') {
    const blanks = assessment?.blanks ?? []
    const quality = scoreFillBlanks(blanks, payload.response?.blanks ?? {})
    const filled = blanks
      .map((b) => payload.response?.blanks?.[b.id] ?? '')
      .filter(Boolean)
      .join(', ')
    return {
      decisionIndex: qualityToDecisionIndex(quality, optionCount),
      decisionId: `fill_${event.id}`,
      feedbackText: filled ? `Your answers: ${filled}` : '(incomplete)',
      responseText: filled,
    }
  }

  throw new Error('Unsupported assessment type')
}
