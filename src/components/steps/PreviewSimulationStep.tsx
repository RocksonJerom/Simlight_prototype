import { useState } from 'react'
import { useSimulation } from '../../context/SimulationContext'
import { getSceneMedia } from '../../utils/media'
import { SceneMediaView } from '../media/SceneMediaView'

export function PreviewSimulationStep() {
  const { state, setCurrentStep } = useSimulation()
  const [eventIndex, setEventIndex] = useState(1)
  const g = state.generated

  if (!g) {
    return (
      <div className="rounded-2xl border-2 border-slate-300 bg-white p-8 text-center text-slate-500">
        Complete AI generation first to preview.
      </div>
    )
  }

  const currentEvent = g.events[eventIndex] ?? g.events[0]
  const currentPhase = g.phases.find((p) => p.id === currentEvent.phaseId)
  const sceneMedia = getSceneMedia(state.assets)

  return (
    <div className="rounded-2xl border-2 border-slate-400 bg-white overflow-hidden shadow-sm">
      <div className="bg-slate-800 px-6 py-3 flex items-center gap-2">
        <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-bold">
          6
        </span>
        <h2 className="text-white font-semibold">Preview Simulation</h2>
      </div>

      <div className="flex flex-col lg:flex-row">
        <div className="flex-1 bg-gradient-to-b from-slate-100 to-slate-200 p-4">
          <div className="bg-slate-900 text-white rounded-t-xl px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-medium">{currentPhase?.name ?? 'Phase'}</span>
            <div className="flex gap-4">
              <span>💰 Budget: <strong>10 Cr</strong></span>
              <span>⚠️ Risk: <strong>20%</strong></span>
              <span>⭐ Score: <strong>250</strong></span>
              <span>⏱️ Time: <strong>18:45</strong></span>
            </div>
          </div>

          <div className="bg-white border-x border-slate-300 relative min-h-[280px] flex items-center justify-center overflow-hidden">
            {sceneMedia ? (
              <SceneMediaView
                media={sceneMedia}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <>
                <div className="absolute inset-0 bg-gradient-to-br from-slate-200 via-slate-100 to-blue-100 opacity-60" />
                <div className="relative text-center p-6">
                  <div className="text-6xl mb-4">🏭</div>
                  <p className="text-sm text-slate-500 max-w-md mx-auto">
                    Isometric simulation environment — {state.meta.industry}
                  </p>
                </div>
              </>
            )}

            <div className="absolute inset-x-4 bottom-4 bg-white rounded-xl shadow-xl border border-slate-200 p-5 max-w-lg mx-auto">
              <h4 className="font-semibold text-slate-900 mb-2">{currentEvent.title}</h4>
              <p className="text-sm text-slate-600 mb-4">{currentEvent.description}</p>
              <div className="space-y-2">
                {currentEvent.decisions.map((d, i) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => {
                      if (eventIndex < g.events.length - 1) setEventIndex(eventIndex + 1)
                    }}
                    className="w-full text-left px-4 py-2.5 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-sm transition-colors"
                  >
                    <span className="text-blue-600 font-medium mr-2">{i + 1}.</span>
                    {d.text}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-amber-500 text-white rounded-b-xl px-4 py-2 text-sm font-medium text-center">
            Cost Impact: -₹15 L &nbsp;|&nbsp; Budget Impact: -2% &nbsp;|&nbsp; Risk: +5%
          </div>
        </div>

        <aside className="lg:w-48 bg-slate-50 border-l border-slate-200 p-4">
          <h3 className="text-xs font-semibold text-slate-500 uppercase mb-3">Flow</h3>
          <ol className="space-y-3">
            {g.phases.map((p) => (
              <li key={p.id} className="flex items-start gap-2">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    p.id === currentPhase?.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {p.order}
                </span>
                <span
                  className={`text-xs leading-tight ${
                    p.id === currentPhase?.id ? 'text-blue-700 font-medium' : 'text-slate-500'
                  }`}
                >
                  {p.name}
                </span>
              </li>
            ))}
          </ol>
        </aside>
      </div>

      <div className="p-4 border-t border-slate-200">
        <button
          type="button"
          onClick={() => setCurrentStep(7)}
          className="px-5 py-2.5 bg-slate-800 text-white text-sm font-semibold rounded-lg hover:bg-slate-900"
        >
          Next: Publish Simulation →
        </button>
      </div>
    </div>
  )
}
