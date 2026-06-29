import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import { AdminLayout } from '../components/layout/AdminLayout'
import type { SimulationRecord } from '../types/simulation'

export function DashboardPage() {
  const [simulations, setSimulations] = useState<SimulationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const load = () => {
    setLoading(true)
    api
      .listSimulations()
      .then(setSimulations)
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  useEffect(() => {
    if (searchParams.get('create') === '1') {
      api.createSimulation().then((sim) => navigate(`/creator/${sim.id}`))
    }
  }, [searchParams, navigate])

  const handleCreate = async () => {
    const sim = await api.createSimulation()
    navigate(`/creator/${sim.id}`)
  }

  const handleDuplicate = async (id: string) => {
    const copy = await api.duplicateSimulation(id)
    navigate(`/creator/${copy.id}`)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this simulation?')) return
    await api.deleteSimulation(id)
    load()
  }

  return (
    <AdminLayout title="Faculty Dashboard" subtitle="Create, manage, and assign simulations">
      <div className="flex justify-end mb-4">
        <button
          type="button"
          onClick={handleCreate}
          className="px-4 py-2 bg-[#005b7f] text-white text-sm font-semibold rounded-xl hover:bg-[#004d6b]"
        >
          + New Simulation
        </button>
      </div>

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : simulations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <p className="text-4xl mb-4">📋</p>
          <p className="text-slate-600 mb-4">No simulations yet. Create your first one!</p>
          <button
            type="button"
            onClick={handleCreate}
            className="px-5 py-2.5 bg-[#005b7f] text-white font-semibold rounded-xl"
          >
            Create Simulation
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {simulations.map((sim) => (
            <div
              key={sim.id}
              className="bg-white rounded-xl border border-slate-200 p-5 flex flex-wrap items-center gap-4 hover:shadow-md transition-shadow"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-[#005b7f] to-[#008fbe] rounded-xl flex items-center justify-center text-2xl shrink-0">
                🏭
              </div>
              <div className="flex-1 min-w-[200px]">
                <h3 className="font-semibold text-slate-900">{sim.meta.title}</h3>
                <p className="text-sm text-slate-500">
                  {sim.meta.domain} · {sim.meta.difficulty} · {sim.meta.duration}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {(sim.meta.playMode ?? 'single') === 'multiplayer' ? '👥 Multiplayer' : '👤 Single'} ·{' '}
                  Updated {new Date(sim.updatedAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {sim.isPublished ? (
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                    Published
                  </span>
                ) : sim.aiGenerationComplete ? (
                  <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
                    Draft
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-full">
                    New
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  to={`/creator/${sim.id}`}
                  className="px-4 py-2 bg-[#005b7f] text-white text-sm font-medium rounded-lg"
                >
                  Edit
                </Link>
                {sim.isPublished && (
                  <>
                    <Link to={`/play/${sim.id}`} className="px-4 py-2 border border-green-600 text-green-700 text-sm font-medium rounded-lg">
                      Play
                    </Link>
                    <Link to={`/assign/${sim.id}`} className="px-4 py-2 border border-blue-600 text-blue-700 text-sm font-medium rounded-lg">
                      Assign
                    </Link>
                    <Link to={`/analytics/${sim.id}`} className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg">
                      Reports
                    </Link>
                  </>
                )}
                <button type="button" onClick={() => handleDuplicate(sim.id)}
                  className="px-3 py-2 border border-slate-300 text-slate-700 text-sm rounded-lg">
                  Duplicate
                </button>
                <button type="button" onClick={() => handleDelete(sim.id)}
                  className="px-3 py-2 text-red-600 text-sm hover:bg-red-50 rounded-lg">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  )
}
