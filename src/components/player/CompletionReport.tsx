import { Link } from 'react-router-dom'
import type { PlaySession, ScoringMetric } from '../../types/simulation'
import { AiFeedbackPanel } from './AiFeedbackPanel'
import { OdometerGauge, SkillsPieChart } from '../charts/MetricGauges'
import { computeXp, earnedBadges } from '../../utils/player'

export function CompletionReport({
  session,
  metrics,
  eventCount,
  lastFeedback,
}: {
  session: PlaySession
  metrics: ScoringMetric[]
  eventCount: number
  lastFeedback?: string | null
}) {
  const xp = computeXp(session)
  const badges = earnedBadges(session, metrics)
  const overallQuality = Math.min(100, Math.round(session.score / Math.max(eventCount * 3, 1)))
  const metricNames = Object.fromEntries(metrics.map((m) => [m.id, m.name]))
  const lastDecision = session.decisionsMade[session.decisionsMade.length - 1]
  const feedbackText = lastFeedback ?? lastDecision?.aiFeedback ?? 'Great job completing the simulation!'

  return (
    <div className="min-h-screen bg-[#f3f5f9] py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <div className="text-5xl mb-2">🏆</div>
          <h1 className="text-2xl font-bold text-slate-900">Simulation Complete</h1>
          <p className="text-slate-500">Excellent work, {session.learnerName}</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-bold text-slate-900 mb-4 text-center">Final performance gauges</h3>
          <div className="flex justify-center gap-8 flex-wrap">
            <OdometerGauge value={session.budget} label="Budget remaining" unit="%" color="#10b981" size="lg" />
            <OdometerGauge value={session.risk} label="Risk level" unit="%" color="#f59e0b" size="lg" />
            <OdometerGauge value={session.score} max={500} label="Final score" unit="" color="#3b82f6" size="lg" />
            <OdometerGauge value={xp} max={1000} label="XP earned" unit="" color="#8b5cf6" size="lg" />
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          {[
            { label: 'Final Score', value: session.score, color: 'text-blue-600' },
            { label: 'Budget', value: `${session.budget}%`, color: 'text-emerald-600' },
            { label: 'Risk', value: `${session.risk}%`, color: 'text-amber-600' },
            { label: 'XP Earned', value: xp.toLocaleString(), color: 'text-violet-600' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <AiFeedbackPanel
            score={overallQuality}
            feedback={feedbackText}
            metricDeltas={lastDecision?.metricDeltas}
            metricNames={metricNames}
          />

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="font-bold text-slate-900 mb-4">Skill metrics (pie chart)</h3>
            <SkillsPieChart
              items={metrics.map((m) => ({
                name: m.name,
                value: session.metricScores[m.id] ?? 0,
              }))}
              size={160}
            />
          </div>
        </div>

        {badges.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="font-bold text-slate-900 mb-4">Achievements Unlocked</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {badges.map((b) => (
                <div
                  key={b.id}
                  className="text-center p-4 rounded-xl bg-gradient-to-b from-amber-50 to-orange-50 border border-amber-100"
                >
                  <div className="text-3xl mb-1">{b.icon}</div>
                  <p className="text-sm font-semibold text-slate-800">{b.name}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{b.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-xs text-[#005b7f] font-semibold">
          Certificate of completion — SimLight 2.0
        </p>
        <div className="text-center">
          <Link to="/learn" className="text-sm text-slate-500 hover:text-slate-700">
            ← Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
