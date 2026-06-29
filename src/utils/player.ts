import type { PlaySession, ScoringMetric } from '../types/simulation'

export function computeXp(session: PlaySession): number {
  const fromDecisions = session.decisionsMade.reduce((sum, d) => sum + d.points, 0)
  const completionBonus = session.completed ? 150 : 0
  return fromDecisions + completionBonus
}

export function formatBudgetCr(budget: number): string {
  const cr = (budget / 10).toFixed(1)
  return `${cr} Cr`
}

export function progressPercent(session: PlaySession, totalEvents: number): number {
  if (totalEvents === 0) return 0
  return Math.round((session.currentEventIndex / totalEvents) * 100)
}

export function metricRating(score: number, maxSeen = 100): number {
  const pct = Math.min(100, (score / Math.max(maxSeen, 1)) * 100)
  if (pct >= 80) return 5
  if (pct >= 60) return 4
  if (pct >= 40) return 3
  if (pct >= 20) return 2
  return 1
}

export function stars(count: number): string {
  return '★'.repeat(count) + '☆'.repeat(5 - count)
}

/** Derive cost/quality/risk star ratings from decision position in the list. */
export function decisionCardRatings(decisionIndex: number, total: number) {
  const t = Math.max(total - 1, 1)
  const ratio = decisionIndex / t
  const cost = Math.max(1, 5 - Math.round(ratio * 3))
  const quality = Math.max(1, 5 - Math.round(ratio * 2))
  const risk = Math.min(5, 1 + Math.round(ratio * 4))
  return { cost, quality, risk }
}

export function feedbackQualityScore(
  decisionIndex: number,
  total: number,
  metricDeltas?: Record<string, number>
): number {
  const positionScore = Math.round(100 - (decisionIndex / Math.max(total - 1, 1)) * 35)
  const deltaBonus = metricDeltas
    ? Math.min(15, Math.round(Object.values(metricDeltas).reduce((a, b) => a + b, 0) / 3))
    : 0
  return Math.min(100, positionScore + deltaBonus)
}

export function parseFeedbackSections(feedback: string): {
  strengths: string[]
  improvements: string[]
} {
  const strengths: string[] = []
  const improvements: string[] = []
  const sentences = feedback.split(/(?<=[.!?])\s+/).filter(Boolean)
  sentences.forEach((s, i) => {
    const lower = s.toLowerCase()
    if (lower.includes('improve') || lower.includes('consider') || lower.includes('risk') || lower.includes('caution')) {
      improvements.push(s)
    } else if (i === 0 || lower.includes('strong') || lower.includes('good') || lower.includes('solid')) {
      strengths.push(s)
    } else {
      improvements.push(s)
    }
  })
  if (strengths.length === 0 && sentences[0]) strengths.push(sentences[0])
  if (improvements.length === 0 && sentences[1]) improvements.push(sentences[1])
  return { strengths: strengths.slice(0, 2), improvements: improvements.slice(0, 2) }
}

export interface Badge {
  id: string
  name: string
  icon: string
  description: string
}

export function earnedBadges(session: PlaySession, metrics: ScoringMetric[]): Badge[] {
  const badges: Badge[] = []
  const xp = computeXp(session)

  if (session.score >= 200) {
    badges.push({ id: 'strategist', name: 'Strategist', icon: '🎯', description: 'High overall score' })
  }
  if (session.budget >= 70) {
    badges.push({ id: 'budget', name: 'Budget Master', icon: '💰', description: 'Strong budget management' })
  }
  if (session.risk <= 30) {
    badges.push({ id: 'risk', name: 'Risk Manager', icon: '🛡️', description: 'Kept risk under control' })
  }
  if (xp >= 500) {
    badges.push({ id: 'xp', name: 'Rising Star', icon: '⭐', description: '500+ XP earned' })
  }
  if (session.decisionsMade.length >= 5) {
    badges.push({ id: 'decider', name: 'Decision Maker', icon: '⚡', description: 'Completed multiple events' })
  }

  const topMetric = Object.entries(session.metricScores ?? {}).sort((a, b) => b[1] - a[1])[0]
  if (topMetric) {
    const name = metrics.find((m) => m.id === topMetric[0])?.name ?? 'Skill'
    badges.push({ id: 'skill', name: `${name} Pro`, icon: '🏅', description: `Top skill: ${name}` })
  }

  return badges.slice(0, 4)
}
