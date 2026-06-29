import { useSimulation } from '../../context/SimulationContext'

export function ConfigureScoringStep() {
  const { state, updateMetric, setScoringType, setCurrentStep } = useSimulation()
  const g = state.generated

  if (!g) {
    return (
      <div className="rounded-2xl border-2 border-pink-200 bg-white p-8 text-center text-slate-500">
        Complete AI generation first to configure scoring.
      </div>
    )
  }

  const totalWeight = g.metrics.reduce((s, m) => s + m.weight, 0)

  return (
    <div className="rounded-2xl border-2 border-pink-200 bg-white overflow-hidden shadow-sm">
      <div className="bg-pink-600 px-6 py-3 flex items-center gap-2">
        <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-bold">
          5
        </span>
        <h2 className="text-white font-semibold">Configure Scoring</h2>
      </div>

      <div className="p-6 space-y-5">
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="scoringType"
              checked={state.scoringType === 'manual'}
              onChange={() => setScoringType('manual')}
              className="text-pink-600 focus:ring-pink-500"
            />
            <span className="text-sm font-medium text-slate-700">Manual Scoring</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="scoringType"
              checked={state.scoringType === 'ai-assisted'}
              onChange={() => setScoringType('ai-assisted')}
              className="text-pink-600 focus:ring-pink-500"
            />
            <span className="text-sm font-medium text-slate-700">AI Assisted Scoring</span>
          </label>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Metric</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 w-28">Weightage (%)</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Description</th>
              </tr>
            </thead>
            <tbody>
              {g.metrics.map((m) => (
                <tr key={m.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-800">{m.name}</td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={m.weight}
                      onChange={(e) => updateMetric(m.id, { weight: Number(e.target.value) })}
                      className="w-20 px-2 py-1 border border-slate-300 rounded text-center focus:ring-2 focus:ring-pink-500 outline-none"
                    />
                  </td>
                  <td className="px-4 py-3 text-slate-600">{m.description}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 border-t border-slate-200">
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-700">Total</td>
                <td className="px-4 py-3">
                  <span
                    className={`font-bold ${totalWeight === 100 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {totalWeight}%
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {totalWeight !== 100 ? 'Weights should sum to 100%' : '✓ Valid'}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <button
          type="button"
          onClick={() => setCurrentStep(6)}
          className="px-5 py-2.5 bg-pink-600 text-white text-sm font-semibold rounded-lg hover:bg-pink-700"
        >
          Next: Preview Simulation →
        </button>
      </div>
    </div>
  )
}
