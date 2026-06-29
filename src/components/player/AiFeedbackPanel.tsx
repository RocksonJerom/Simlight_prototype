import { parseFeedbackSections } from '../../utils/player'

export function AiFeedbackPanel({
  score,
  feedback,
  metricDeltas,
  metricNames,
  onDismiss,
}: {
  score: number
  feedback: string
  metricDeltas?: Record<string, number>
  metricNames: Record<string, string>
  onDismiss?: () => void
}) {
  const { strengths, improvements } = parseFeedbackSections(feedback)
  const circumference = 2 * Math.PI * 36
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-5 max-w-md">
      <div className="flex items-start gap-4">
        <div className="relative shrink-0">
          <svg width="88" height="88" className="-rotate-90">
            <circle cx="44" cy="44" r="36" fill="none" stroke="#e2e8f0" strokeWidth="8" />
            <circle
              cx="44"
              cy="44"
              r="36"
              fill="none"
              stroke="#005b7f"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-[#005b7f]">{score}</span>
            <span className="text-[9px] text-slate-500 uppercase">Score</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-slate-900 text-sm mb-1">AI Feedback</h4>
          <p className="text-xs text-slate-600 leading-relaxed">{feedback}</p>
        </div>
      </div>

      {metricDeltas && Object.keys(metricDeltas).length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {Object.entries(metricDeltas).map(([id, delta]) => (
            <span key={id} className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">
              {metricNames[id] ?? id} +{delta}
            </span>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
        <div>
          <p className="font-semibold text-emerald-700 mb-1">Strengths</p>
          <ul className="text-slate-600 space-y-0.5 list-disc pl-4">
            {strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-semibold text-amber-700 mb-1">Improve</p>
          <ul className="text-slate-600 space-y-0.5 list-disc pl-4">
            {improvements.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      </div>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="mt-4 w-full py-2 text-sm font-semibold text-[#005b7f] border border-[#005b7f]/30 rounded-lg hover:bg-[#005b7f]/5"
        >
          Continue →
        </button>
      )}
    </div>
  )
}
