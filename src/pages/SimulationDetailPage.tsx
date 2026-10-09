import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PublicLayout } from '../components/layout/PublicLayout'
import { SceneMediaView } from '../components/media/SceneMediaView'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import type { PublicSimulationDetail } from '../types/extras'
import { getSceneMedia } from '../utils/media'

export function SimulationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { isAuthenticated } = useAuth()
  const [sim, setSim] = useState<PublicSimulationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    api
      .getPublicSimulation(id)
      .then(setSim)
      .catch((e) => setError(e instanceof Error ? e.message : 'Not found'))
      .finally(() => setLoading(false))
  }, [id])

  const sceneMedia = sim
    ? getSceneMedia(
        sim.assets.map((a) => ({
          id: a.id,
          type: a.type,
          name: a.name,
          url: a.url,
        }))
      )
    : null

  return (
    <PublicLayout>
      <div className="w-full max-w-[min(100%,90rem)] mx-auto px-4 sm:px-6 lg:px-10 py-8">
        {loading ? (
          <p className="text-slate-500">Loading…</p>
        ) : error || !sim ? (
          <div className="text-center py-16">
            <p className="text-slate-400 mb-4">{error || 'Simulation not found'}</p>
            <Link to="/browse" className="text-cyan-400 hover:underline">
              ← Back to browse
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3 space-y-6">
              <div className="aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-slate-800">
                {sceneMedia ? (
                  <SceneMediaView media={sceneMedia} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl">🏭</div>
                )}
              </div>

              <div>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="px-2 py-1 bg-violet-500/20 text-violet-300 text-xs rounded-full">
                    {sim.difficulty}
                  </span>
                  <span className="px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded-full">
                    {sim.domain}
                  </span>
                  <span className="px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded-full">
                    {sim.industry}
                  </span>
                  <span className="px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded-full">
                    {sim.duration}
                  </span>
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">{sim.title}</h1>
                <p className="text-slate-400 text-sm">by {sim.orgName}</p>
                {sim.playCount > 0 && (
                  <p className="text-sm text-slate-500 mt-2">
                    ▶ {sim.playCount} plays
                    {sim.avgScore > 0 && ` · ⭐ ${sim.avgScore} avg score`}
                  </p>
                )}
              </div>

              {sim.scenario && (
                <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <h2 className="font-semibold text-white mb-2">Scenario</h2>
                  <p className="text-slate-300 text-sm leading-relaxed">{sim.scenario}</p>
                </section>
              )}

              {sim.learningObjectives.length > 0 && (
                <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <h2 className="font-semibold text-white mb-3">Learning objectives</h2>
                  <ul className="space-y-2">
                    {sim.learningObjectives.map((obj) => (
                      <li key={obj} className="flex gap-2 text-sm text-slate-300">
                        <span className="text-cyan-400">✓</span>
                        {obj}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>

            <aside className="lg:col-span-2 space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sticky top-24">
                <h2 className="font-semibold text-white mb-4">Play this simulation</h2>
                <p className="text-sm text-slate-400 mb-6">
                  {sim.eventCount ?? 0} decision events across {sim.phases} phases. Enter your name and start
                  immediately — no account required.
                </p>
                <Link
                  to={`/play/${sim.id}`}
                  className="block w-full py-3 text-center bg-cyan-500 text-slate-950 font-bold rounded-xl hover:bg-cyan-400 mb-3"
                >
                  ▶ Play now
                </Link>
                {isAuthenticated && (
                  <Link
                    to={`/assign/${sim.id}`}
                    className="block w-full py-3 text-center border border-slate-600 text-white font-medium rounded-xl hover:bg-slate-800"
                  >
                    Assign to class
                  </Link>
                )}
                {!isAuthenticated && (
                  <p className="text-xs text-slate-500 text-center mt-4">
                    <Link to="/login" className="text-cyan-400 hover:underline">
                      Sign in
                    </Link>{' '}
                    to assign this to learners
                  </p>
                )}
              </div>

              {sim.assets.filter((a) => a.type === 'document').length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <h3 className="font-semibold text-white mb-3 text-sm">Reference materials</h3>
                  <ul className="space-y-2">
                    {sim.assets
                      .filter((a) => a.type === 'document')
                      .map((doc) => (
                        <li key={doc.id}>
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-cyan-400 hover:underline"
                          >
                            📄 {doc.name}
                          </a>
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </aside>
          </div>
        )}
      </div>
    </PublicLayout>
  )
}
