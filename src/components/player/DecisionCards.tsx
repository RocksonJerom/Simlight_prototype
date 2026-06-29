import type { Decision } from '../../types/simulation'
import { decisionCardRatings, stars } from '../../utils/player'

export function DecisionCards({
  decisions,
  onSelect,
  disabled,
}: {
  decisions: Decision[]
  onSelect: (id: string) => void
  disabled?: boolean
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {decisions.map((d, i) => {
        const ratings = decisionCardRatings(i, decisions.length)
        return (
          <button
            key={d.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(d.id)}
            className="text-left p-4 rounded-xl border-2 border-slate-200 bg-white hover:border-[#005b7f] hover:shadow-lg hover:shadow-[#005b7f]/10 transition-all disabled:opacity-50 group"
          >
            <p className="text-sm font-semibold text-slate-900 mb-3 group-hover:text-[#005b7f]">
              {d.text}
            </p>
            <div className="grid grid-cols-3 gap-2 text-[10px]">
              <div className="bg-slate-50 rounded-lg p-2 text-center">
                <p className="text-slate-500 uppercase font-semibold mb-0.5">Cost</p>
                <p className="text-amber-500 tracking-tight">{stars(ratings.cost)}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-2 text-center">
                <p className="text-slate-500 uppercase font-semibold mb-0.5">Quality</p>
                <p className="text-amber-500 tracking-tight">{stars(ratings.quality)}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-2 text-center">
                <p className="text-slate-500 uppercase font-semibold mb-0.5">Risk</p>
                <p className="text-amber-500 tracking-tight">{stars(ratings.risk)}</p>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
