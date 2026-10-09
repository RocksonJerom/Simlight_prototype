import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import { AdminLayout } from '../components/layout/AdminLayout'
import type { SimulationRecord } from '../types/simulation'

export function DashboardPage() {
  const [simulations, setSimulations] = useState<SimulationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
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
      setShowCreateModal(true)
    }
  }, [searchParams])

  const handleCreateV2 = () => {
    const newId = `v2-sim-${Date.now()}`
    navigate(`/v2/creator/${newId}`)
  }

  const handleCreateV1 = async () => {
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
    <AdminLayout title="Faculty Dashboard" subtitle="Create, manage, and assign data-driven simulations">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200">
            Active Catalog: {simulations.length} Simulations
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 bg-[#005b7f] hover:bg-[#004d6b] text-white text-sm font-bold rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
          >
            <span>+ Create Simulation</span>
          </button>
        </div>
      </div>

      {/* Creation Mode Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Create New Simulation</h3>
                <p className="text-xs text-slate-500 mt-0.5">Select your preferred simulation creation model</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm p-1"
              >
                ✕
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {/* Option A: Capsim V2 Engine */}
              <div
                onClick={handleCreateV2}
                className="p-5 rounded-2xl border-2 border-cyan-500/40 bg-gradient-to-br from-cyan-50/50 to-blue-50/30 hover:border-cyan-600 cursor-pointer transition shadow-sm hover:shadow-md space-y-3"
              >
                <div className="w-10 h-10 rounded-xl bg-cyan-600 text-white flex items-center justify-center text-xl font-bold">
                  ⚡
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-sm">Advanced Capsim Model</h4>
                    <span className="text-[10px] uppercase tracking-wider font-bold bg-cyan-100 text-cyan-800 px-1.5 py-0.5 rounded">
                      Genie + Manual
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    Multi-phase decision matrix with live financials, operational KPIs, mathematical consequence rules, and Genie AI generation.
                  </p>
                </div>
                <button
                  type="button"
                  className="text-xs font-bold text-cyan-700 flex items-center gap-1 group-hover:underline"
                >
                  Launch Architect →
                </button>
              </div>

              {/* Option B: Standard Case Simulation */}
              <div
                onClick={handleCreateV1}
                className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 cursor-pointer transition shadow-sm hover:shadow-md space-y-3"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center text-xl font-bold">
                  📄
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Guided Case Wizard</h4>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                    7-step guided authoring flow for business case studies with multiple-choice questions, media, and document imports.
                  </p>
                </div>
                <button
                  type="button"
                  className="text-xs font-bold text-slate-700 flex items-center gap-1"
                >
                  Launch Wizard →
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
              <span>Looking for pre-built simulations?</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/v2/creator/v2-supply-chain-crisis')}
                  className="text-cyan-700 font-semibold hover:underline"
                >
                  Supply Chain Template
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => navigate('/v2/creator/v2-marketing-budget-allocation')}
                  className="text-cyan-700 font-semibold hover:underline"
                >
                  Marketing Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-slate-500">Loading simulations…</p>
      ) : simulations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
          <p className="text-4xl">📋</p>
          <div>
            <h3 className="text-lg font-bold text-slate-900">No simulations created yet</h3>
            <p className="text-slate-500 text-sm mt-1 max-w-md mx-auto">
              Build your first interactive business simulation. Choose between our advanced Capsim-style engine or the guided case wizard.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 bg-[#005b7f] text-white font-bold text-sm rounded-xl shadow-md hover:bg-[#004d6b]"
          >
            Create Simulation
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {simulations.map((sim) => {
            const isV2 = Boolean(sim.v2Data)
            const editUrl = isV2 ? `/v2/creator/${sim.id}` : `/creator/${sim.id}`
            const playUrl = isV2 ? `/v2/play/${sim.id}` : `/play/${sim.id}`

            return (
              <div
                key={sim.id}
                className="bg-white rounded-xl border border-slate-200 p-5 flex flex-wrap items-center gap-4 hover:shadow-md transition-shadow"
              >
                <div
                  className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0 ${
                    isV2
                      ? 'bg-gradient-to-br from-cyan-600 to-blue-700 text-white shadow-md shadow-cyan-600/20'
                      : 'bg-gradient-to-br from-[#005b7f] to-[#008fbe] text-white'
                  }`}
                >
                  {isV2 ? '⚡' : '🏭'}
                </div>

                <div className="flex-1 min-w-[220px]">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900">{sim.meta.title}</h3>
                    {isV2 && (
                      <span className="px-2 py-0.5 bg-cyan-100 text-cyan-800 text-[10px] font-extrabold rounded-md uppercase tracking-wider">
                        Capsim V2
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {sim.meta.domain || sim.meta.industry} · {sim.meta.difficulty} · {sim.meta.duration}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Updated {new Date(sim.updatedAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {sim.isPublished ? (
                    <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                      Published
                    </span>
                  ) : sim.aiGenerationComplete ? (
                    <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
                      Draft
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-full">
                      New
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    to={editUrl}
                    className="px-4 py-2 bg-[#005b7f] hover:bg-[#004d6b] text-white text-sm font-medium rounded-lg transition"
                  >
                    Edit
                  </Link>
                  <Link
                    to={playUrl}
                    className="px-4 py-2 border border-green-600 text-green-700 hover:bg-green-50 text-sm font-medium rounded-lg transition"
                  >
                    Play
                  </Link>
                  <Link
                    to={`/assign/${sim.id}`}
                    className="px-4 py-2 border border-blue-600 text-blue-700 hover:bg-blue-50 text-sm font-medium rounded-lg transition"
                  >
                    Assign
                  </Link>
                  <Link
                    to={`/analytics/${sim.id}`}
                    className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium rounded-lg transition"
                  >
                    Reports
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDuplicate(sim.id)}
                    className="px-3 py-2 border border-slate-300 text-slate-700 text-sm rounded-lg hover:bg-slate-50 transition cursor-pointer"
                  >
                    Duplicate
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(sim.id)}
                    className="px-3 py-2 text-red-600 text-sm hover:bg-red-50 rounded-lg transition cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </AdminLayout>
  )
}
