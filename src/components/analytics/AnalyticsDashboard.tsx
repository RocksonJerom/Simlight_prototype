import type { SimulationAnalytics } from '../../types/simulation'

function LineTrendChart({ data }: { data: { label: string; score: number }[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-slate-400 text-center py-8">No completed sessions yet</p>
  }
  const max = Math.max(...data.map((d) => d.score), 1)
  const points = data
    .map((d, i) => {
      const x = data.length === 1 ? 50 : (i / (data.length - 1)) * 100
      const y = 100 - (d.score / max) * 80 - 10
      return `${x},${y}`
    })
    .join(' ')

  return (
    <div>
      <svg viewBox="0 0 100 60" className="w-full h-40" preserveAspectRatio="none">
        <polyline fill="none" stroke="#7c3aed" strokeWidth="2" points={points} />
        {data.map((d, i) => {
          const x = data.length === 1 ? 50 : (i / (data.length - 1)) * 100
          const y = 100 - (d.score / max) * 80 - 10
          return <circle key={d.label} cx={x} cy={(y / 100) * 60} r="2" fill="#7c3aed" />
        })}
      </svg>
      <div className="flex justify-between text-[10px] text-slate-400 mt-1">
        {data.map((d) => (
          <span key={d.label}>{d.label}</span>
        ))}
      </div>
    </div>
  )
}

function SkillDonut({ skills }: { skills: { name: string; avg: number }[] }) {
  const total = skills.reduce((s, sk) => s + sk.avg, 0) || 1
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4']
  let cumulative = 0

  if (skills.length === 0) {
    return <p className="text-sm text-slate-400 text-center py-8">No skill data yet</p>
  }

  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 32 32" className="w-28 h-28 shrink-0 -rotate-90">
        {skills.map((sk, i) => {
          const pct = sk.avg / total
          const dash = `${pct * 100} ${100 - pct * 100}`
          const offset = cumulative * 100
          cumulative += pct
          return (
            <circle
              key={sk.name}
              r="16"
              cx="16"
              cy="16"
              fill="transparent"
              stroke={colors[i % colors.length]}
              strokeWidth="32"
              strokeDasharray={dash}
              strokeDashoffset={-offset}
            />
          )
        })}
      </svg>
      <ul className="text-xs text-slate-600 space-y-1.5 flex-1">
        {skills.map((sk, i) => (
          <li key={sk.name} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: colors[i % colors.length] }} />
            <span className="truncate flex-1">{sk.name}</span>
            <span className="font-semibold text-slate-800">{sk.avg}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function AnalyticsDashboard({ data }: { data: SimulationAnalytics }) {
  return (
  <>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Completion Rate', value: `${data.completionRate}%`, icon: '📊' },
            { label: 'Avg Score', value: data.avgScore, icon: '⭐' },
            { label: 'Active Learners', value: data.activeLearners, icon: '👥' },
            { label: 'Completed', value: data.completedSessions, icon: '✅' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <span className="text-2xl">{stat.icon}</span>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stat.value}</p>
              <p className="text-sm text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="font-semibold text-slate-800 mb-4">Score Trend</h2>
            <LineTrendChart data={data.scoreTrend} />
          </section>
          <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="font-semibold text-slate-800 mb-4">Skill Distribution</h2>
            <SkillDonut skills={data.skillDistribution} />
          </section>
        </div>

        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <h2 className="font-semibold text-slate-800 px-6 py-4 border-b border-slate-100">
            Leaderboard
          </h2>
          {data.leaderboard.length === 0 ? (
            <p className="px-6 py-8 text-slate-500 text-sm text-center">No rankings yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-6 py-3 font-semibold text-slate-600">Rank</th>
                  <th className="text-left px-6 py-3 font-semibold text-slate-600">Learner</th>
                  <th className="text-left px-6 py-3 font-semibold text-slate-600">Score</th>
                  <th className="text-left px-6 py-3 font-semibold text-slate-600">XP</th>
                </tr>
              </thead>
              <tbody>
                {data.leaderboard.map((row) => (
                  <tr key={row.rank} className="border-t border-slate-100">
                    <td className="px-6 py-3">
                      <span
                        className={`inline-flex w-7 h-7 items-center justify-center rounded-full text-xs font-bold ${
                          row.rank === 1
                            ? 'bg-amber-100 text-amber-700'
                            : row.rank === 2
                              ? 'bg-slate-200 text-slate-700'
                              : row.rank === 3
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {row.rank}
                      </span>
                    </td>
                    <td className="px-6 py-3 font-medium">{row.name}</td>
                    <td className="px-6 py-3">{row.score}</td>
                    <td className="px-6 py-3 text-violet-600 font-medium">{row.xp.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
  </>
  )
}
