import { parseFeedbackSections } from '../../utils/player'

export function AiFeedbackPanel({
  score,
  feedback,
  metricDeltas,
  metricNames,
  onDismiss,
  variant = 'compact',
}: {
  score: number
  feedback: string
  metricDeltas?: Record<string, number>
  metricNames: Record<string, string>
  onDismiss?: () => void
  variant?: 'compact' | 'wide'
}) {
  const { strengths, improvements } = parseFeedbackSections(feedback)
  const wide = variant === 'wide'
  const ringSize = wide ? 104 : 88
  const ringR = wide ? 42 : 36
  const circumference = 2 * Math.PI * ringR
  const offset = circumference - (score / 100) * circumference
  const center = ringSize / 2

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200 shadow-xl p-5 sm:p-6 ${
        wide ? 'w-full' : 'max-w-md'
      }`}
    >
      <div className={`flex items-start gap-4 ${wide ? 'lg:gap-6' : ''}`}>
        <div className="relative shrink-0">
          <svg width={ringSize} height={ringSize} className="-rotate-90">
            <circle cx={center} cy={center} r={ringR} fill="none" stroke="#e2e8f0" strokeWidth={wide ? 10 : 8} />
            <circle
              cx={center}
              cy={center}
              r={ringR}
              fill="none"
              stroke="#005b7f"
              strokeWidth={wide ? 10 : 8}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`font-bold text-[#005b7f] ${wide ? 'text-3xl' : 'text-2xl'}`}>{score}</span>
            <span className={`text-slate-500 uppercase ${wide ? 'text-xs' : 'text-[9px]'}`}>Score</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={`font-bold text-slate-900 mb-2 ${wide ? 'text-lg' : 'text-sm'}`}>AI Feedback</h4>
          <p className={`text-slate-600 leading-relaxed ${wide ? 'text-base' : 'text-xs'}`}>{feedback}</p>
        </div>
      </div>

      {metricDeltas && Object.keys(metricDeltas).length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {Object.entries(metricDeltas).map(([id, delta]) => (
            <span
              key={id}
              className={`px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-medium ${
                wide ? 'text-sm' : 'text-[10px]'
              }`}
            >
              {metricNames[id] ?? id} +{delta}
            </span>
          ))}
        </div>
      )}

      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5 ${wide ? 'text-sm' : 'text-xs'}`}>
        <div>
          <p className="font-semibold text-emerald-700 mb-2">Strengths</p>
          <ul className="text-slate-600 space-y-1 list-disc pl-5">
            {strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-semibold text-amber-700 mb-2">Improve</p>
          <ul className="text-slate-600 space-y-1 list-disc pl-5">
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
          className="mt-5 w-full py-2.5 text-sm font-semibold text-[#005b7f] border border-[#005b7f]/30 rounded-lg hover:bg-[#005b7f]/5"
        >
          Continue →
        </button>
      )}
    </div>
  )
}
