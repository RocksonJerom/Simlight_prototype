import type { Event, ScoringMetric, SimulationRecord } from '../../src/types/simulation.js'
import { resolveProvider, getLlmCredentials } from '../config.js'

const IMPACT_MULT = { Low: 1, Medium: 1.5, High: 2 } as const

export function parseDurationSeconds(duration: string): number {
  const m = duration.match(/(\d+)/)
  return (m ? parseInt(m[1], 10) : 30) * 60
}

export function computeMetricDeltas(
  event: Event,
  decisionIndex: number,
  metrics: ScoringMetric[]
): Record<string, number> {
  const quality = 1 - decisionIndex * 0.15
  const riskFactor = IMPACT_MULT[event.impact.risk]
  const deltas: Record<string, number> = {}

  for (const m of metrics) {
    let delta = Math.round((m.weight / 10) * quality * 10) / 10
    if (m.name.toLowerCase().includes('risk')) delta *= riskFactor > 1.5 ? 0.7 : 1.1
    if (m.name.toLowerCase().includes('cost')) {
      delta *= event.impact.budget === 'Down' ? 0.8 : event.impact.budget === 'Up' ? 1.2 : 1
    }
    deltas[m.id] = Math.max(0, Math.round(delta))
  }
  return deltas
}

export function computeDecisionPoints(
  event: Event,
  decisionIndex: number,
  metricDeltas: Record<string, number>
): number {
  const base = 15 + decisionIndex * 5
  const impactBonus = event.impact.risk === 'Low' ? 10 : event.impact.risk === 'Medium' ? 5 : 0
  const metricBonus = Math.round(Object.values(metricDeltas).reduce((a, b) => a + b, 0) / 5)
  return base + impactBonus + metricBonus
}

export function buildFeedbackText(
  event: Event,
  decisionText: string,
  metricDeltas: Record<string, number>,
  metrics: ScoringMetric[]
): string {
  const top = Object.entries(metricDeltas)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([id, v]) => {
      const name = metrics.find((m) => m.id === id)?.name ?? 'Metric'
      return `${name} (+${v})`
    })
  return `You chose "${decisionText}". Impact on ${event.title}: Cost ${event.impact.cost}, Risk ${event.impact.risk}. Strongest gains: ${top.join(', ') || 'balanced performance'}.`
}

export async function generateAiFeedback(
  sim: SimulationRecord,
  event: Event,
  decisionText: string,
  metricDeltas: Record<string, number>
): Promise<string> {
  if (sim.scoringType !== 'ai-assisted' || resolveProvider() === 'mock') {
    return buildFeedbackText(event, decisionText, metricDeltas, sim.generated?.metrics ?? [])
  }

  const metrics = sim.generated?.metrics ?? []
  const prompt = `You are a business simulation coach. In 2 sentences, give constructive feedback on this learner decision.
Simulation: ${sim.meta.title}
Event: ${event.title}
Decision: ${decisionText}
Impact tags: cost=${event.impact.cost}, budget=${event.impact.budget}, risk=${event.impact.risk}
Respond with plain text only, no markdown.`

  try {
    const provider = resolveProvider()
    const creds = getLlmCredentials(provider)
    if (creds && provider !== 'anthropic' && provider !== 'mock') {
      const res = await fetch(`${creds.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${creds.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: creds.model,
          temperature: 0.6,
          max_tokens: 120,
          messages: [{ role: 'user', content: prompt }],
        }),
      })
      if (res.ok) {
        const data = (await res.json()) as { choices?: { message?: { content?: string } }[] }
        const text = data.choices?.[0]?.message?.content?.trim()
        if (text) return text
      }
    }
  } catch {
    /* fallback below */
  }
  return buildFeedbackText(event, decisionText, metricDeltas, metrics)
}

export function mergeMetricScores(
  current: Record<string, number>,
  deltas: Record<string, number>
): Record<string, number> {
  const merged = { ...current }
  for (const [k, v] of Object.entries(deltas)) {
    merged[k] = (merged[k] ?? 0) + v
  }
  return merged
}

export function weightedFinalScore(
  metricScores: Record<string, number>,
  metrics: ScoringMetric[]
): number {
  if (!metrics.length) return 0
  let total = 0
  let weightSum = 0
  for (const m of metrics) {
    total += (metricScores[m.id] ?? 0) * (m.weight / 100)
    weightSum += m.weight
  }
  return Math.round(total * (100 / Math.max(weightSum, 1)))
}
