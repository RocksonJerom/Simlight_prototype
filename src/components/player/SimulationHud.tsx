import { formatBudgetCr } from '../../utils/player'

export function SimulationHud({
  budget,
  risk,
  score,
  xp,
  timeLeft,
  eventLabel,
  onInfoClick,
  infoActive,
}: {
  budget: number
  risk: number
  score: number
  xp: number
  timeLeft?: string
  eventLabel?: string
  onInfoClick?: () => void
  infoActive?: boolean
}) {
  const chips = [
    { label: 'Budget', value: formatBudgetCr(budget), icon: '💰', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
    { label: 'Risk', value: `${risk}%`, icon: '⚠️', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
    { label: 'Score', value: String(score), icon: '⭐', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
    { label: 'XP', value: xp.toLocaleString(), icon: '✨', color: 'bg-violet-500/20 text-violet-300 border-violet-500/40' },
    ...(timeLeft ? [{ label: 'Time', value: timeLeft, icon: '⏱', color: 'bg-slate-500/20 text-slate-200 border-slate-500/40' }] : []),
  ]

  return (
    <div className="bg-[#0a1628]/95 border-b border-[#1e3a5f] px-4 py-3 shrink-0">
      <div className="w-full flex flex-wrap items-center justify-between gap-3">
        {eventLabel && (
          <p className="text-xs text-slate-400 w-full sm:w-auto truncate">{eventLabel}</p>
        )}
        <div className="flex flex-wrap items-center gap-2 flex-1 justify-end">
          {onInfoClick && (
            <button
              type="button"
              onClick={onInfoClick}
              aria-label="Event information"
              title="Event information"
              className={`w-9 h-9 rounded-full border flex items-center justify-center text-sm font-bold italic shrink-0 transition-colors ${
                infoActive
                  ? 'bg-cyan-500 text-white border-cyan-400'
                  : 'bg-[#1e3a5f]/80 text-cyan-300 border-[#2a4a6f] hover:bg-[#2a4a6f] hover:text-white'
              }`}
            >
              i
            </button>
          )}
          {chips.map((c) => (
            <div
              key={c.label}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-semibold ${c.color}`}
            >
              <span>{c.icon}</span>
              <span className="text-[10px] uppercase tracking-wide opacity-70">{c.label}</span>
              <span>{c.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function SimulationHudFromSession({
  session,
  timeLeft,
  totalEvents,
  title,
  onInfoClick,
  infoActive,
}: {
  session: { budget: number; risk: number; score: number; currentEventIndex: number; decisionsMade: { points: number }[]; completed: boolean }
  timeLeft?: string
  totalEvents: number
  title: string
  onInfoClick?: () => void
  infoActive?: boolean
}) {
  const xp = session.decisionsMade.reduce((s, d) => s + d.points, 0) + (session.completed ? 150 : 0)
  return (
    <SimulationHud
      budget={session.budget}
      risk={session.risk}
      score={session.score}
      xp={xp}
      timeLeft={timeLeft}
      eventLabel={`${title} · Event ${Math.min(session.currentEventIndex + 1, totalEvents)}/${totalEvents}`}
      onInfoClick={onInfoClick}
      infoActive={infoActive}
    />
  )
}
