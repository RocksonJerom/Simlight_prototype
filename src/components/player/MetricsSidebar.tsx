import type { ScoringMetric } from '../../types/simulation'
import { OdometerGauge, SkillsPieChart } from '../charts/MetricGauges'

export function MetricsSidebar({
  metrics,
  metricScores,
  phases,
  currentPhaseId,
  progressPct,
  budget,
  risk,
  score,
}: {
  metrics: ScoringMetric[]
  metricScores: Record<string, number>
  phases: { id: string; name: string; order: number }[]
  currentPhaseId?: string
  progressPct: number
  budget?: number
  risk?: number
  score?: number
}) {
  const skillItems = metrics.slice(0, 6).map((m) => ({
    name: m.name,
    value: metricScores[m.id] ?? 0,
  }))

  return (
    <aside className="w-full lg:w-72 bg-[#0f1f35] border-l border-[#1e3a5f] p-4 space-y-5 shrink-0">
      {budget !== undefined && risk !== undefined && score !== undefined && (
        <div>
          <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-3">Live gauges</h3>
          <div className="flex justify-between gap-1 bg-[#0a1628] rounded-xl p-2">
            <OdometerGauge value={budget} label="Budget" unit="%" color="#10b981" size="sm" />
            <OdometerGauge value={risk} label="Risk" unit="%" color="#f59e0b" size="sm" />
            <OdometerGauge value={score} max={500} label="Score" unit="" color="#3b82f6" size="sm" />
          </div>
        </div>
      )}

      <div>
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>Progress</span>
          <span>{progressPct}%</span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#005b7f] to-cyan-400 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <div>
        <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-3">Skill metrics (pie)</h3>
        <div className="bg-[#0a1628] rounded-xl p-3 [&_li]:text-slate-300 [&_span]:text-slate-400">
          <SkillsPieChart items={skillItems} size={100} />
        </div>
      </div>

      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Phases</h3>
        <ol className="space-y-1.5">
          {phases.map((p) => (
            <li
              key={p.id}
              className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg ${
                p.id === currentPhaseId ? 'bg-[#005b7f]/40 text-cyan-200' : 'text-slate-500'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold">
                {p.order}
              </span>
              <span className="truncate">{p.name}</span>
            </li>
          ))}
        </ol>
      </div>
    </aside>
  )
}
