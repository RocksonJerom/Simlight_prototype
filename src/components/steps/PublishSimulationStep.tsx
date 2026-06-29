import { Link } from 'react-router-dom'
import { useSimulation } from '../../context/SimulationContext'
import type { Visibility } from '../../types/simulation'

const VISIBILITY_OPTIONS: { value: Visibility; label: string; desc: string }[] = [
  { value: 'private', label: 'Private', desc: 'Only you can access' },
  { value: 'organization', label: 'Organization', desc: 'Visible to your institution' },
  { value: 'public', label: 'Public Marketplace', desc: 'Available to all users' },
]

export function PublishSimulationStep() {
  const { simulationId, state, setVisibility, publish } = useSimulation()
  const privateLink =
    state.visibility === 'private' && state.playToken
      ? `${window.location.origin}/play/${simulationId}?token=${state.playToken}`
      : null

  return (
    <div className="rounded-2xl border-2 border-green-200 bg-white overflow-hidden shadow-sm">
      <div className="bg-green-600 px-6 py-3 flex items-center gap-2">
        <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-bold">
          7
        </span>
        <h2 className="text-white font-semibold">Publish Simulation</h2>
      </div>

      <div className="p-6 space-y-6">
        {state.isPublished ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl text-green-600">✓</span>
            </div>
            <h3 className="text-xl font-bold text-green-700">Simulation Published Successfully!</h3>
            <p className="text-sm text-slate-500 mt-2">
              Your simulation is now available based on your visibility settings.
            </p>
          </div>
        ) : (
          <p className="text-sm text-slate-600">
            Review your simulation and choose visibility settings before publishing.
          </p>
        )}

        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div className="w-20 h-20 bg-gradient-to-br from-violet-400 to-blue-500 rounded-xl flex items-center justify-center text-3xl shrink-0">
            🏭
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-slate-900 truncate">{state.meta.title}</h4>
            <p className="text-sm text-slate-500">{state.meta.domain} · {state.meta.difficulty}</p>
            <p className="text-xs text-slate-400 mt-1">
              {state.meta.duration} ·{' '}
              {(state.meta.contentMode ?? 'ai') === 'ai' ? 'AI content' : 'Manual content'} ·{' '}
              {(state.meta.playMode ?? 'single') === 'single' ? 'Single player' : 'Multiplayer'}
            </p>
          </div>
          {state.isPublished && (
            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
              Published
            </span>
          )}
        </div>

        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Visibility Settings</h4>
          <div className="space-y-2">
            {VISIBILITY_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  state.visibility === opt.value
                    ? 'border-green-500 bg-green-50'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="visibility"
                  checked={state.visibility === opt.value}
                  onChange={() => setVisibility(opt.value)}
                  className="mt-0.5 text-green-600 focus:ring-green-500"
                />
                <div>
                  <p className="text-sm font-medium text-slate-800">{opt.label}</p>
                  <p className="text-xs text-slate-500">{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {state.isPublished && privateLink && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-sm font-medium text-amber-900">Private play link</p>
            <p className="text-xs text-amber-800 break-all mt-1">{privateLink}</p>
            <p className="text-xs text-amber-700 mt-2">Share this link with learners who have the play token.</p>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          {!state.isPublished ? (
            <button
              type="button"
              onClick={publish}
              className="px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 shadow-md"
            >
              🚀 Publish Simulation
            </button>
          ) : (
            <>
              <Link
                to={`/play/${simulationId}`}
                className="px-5 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700"
              >
                View Simulation
              </Link>
              <Link
                to={`/assign/${simulationId}`}
                className="px-5 py-2.5 border border-green-600 text-green-700 text-sm font-semibold rounded-lg hover:bg-green-50"
              >
                Assign to Learners
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
