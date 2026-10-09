import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { V2SimulationBuilder } from '../../components/v2/builder/V2SimulationBuilder.js'
import { V2PlayerCockpit } from '../../components/v2/player/V2PlayerCockpit.js'
import {
  V2_SUPPLY_CHAIN_SIMULATION,
  V2_MARKETING_BUDGET_SIMULATION,
  ALL_V2_TEMPLATES,
} from '../../data/v2Templates.js'
import type { V2Simulation } from '../../types/v2.js'
import { api } from '../../api/client.js'

export function V2CreatorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [previewSim, setPreviewSim] = useState<V2Simulation | null>(null)
  const [currentSim, setCurrentSim] = useState<V2Simulation>(() => {
    let initial = ALL_V2_TEMPLATES.find((t) => t.id === id)
    if (!initial && id) {
      try {
        const stored = localStorage.getItem(`simlight-v2-${id}`)
        if (stored) initial = JSON.parse(stored)
      } catch {
        // ignore
      }
    }
    return (
      initial ??
      (id?.includes('marketing')
        ? V2_MARKETING_BUDGET_SIMULATION
        : { ...V2_SUPPLY_CHAIN_SIMULATION, id: id || `v2-${Date.now()}` })
    )
  })

  const [saveStatus, setSaveStatus] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (id && !id.startsWith('v2-supply-chain') && !id.startsWith('v2-marketing')) {
      api
        .getV2Simulation(id)
        .then((res) => {
          if (res.simulation) {
            setCurrentSim(res.simulation)
          } else if (res.record?.v2Data) {
            setCurrentSim(res.record.v2Data)
          }
        })
        .catch(() => {})
    }
  }, [id])

  const handleSave = async (sim: V2Simulation) => {
    setSaving(true)
    setSaveStatus(null)
    try {
      localStorage.setItem(`simlight-v2-${sim.id}`, JSON.stringify(sim))
      await api.saveV2Simulation(sim)
      setCurrentSim(sim)
      setSaveStatus(`Simulation "${sim.title}" saved successfully to database!`)
      setTimeout(() => setSaveStatus(null), 4000)
    } catch (e) {
      console.error(e)
      setSaveStatus(`Saved locally. (Note: Ensure server is running for database persistence)`)
      setTimeout(() => setSaveStatus(null), 4000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8">
      {previewSim ? (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col">
          <div className="bg-slate-900 px-6 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                🎮 Test Flight Preview Mode
              </span>
              <span className="text-xs text-slate-400">· {previewSim.title}</span>
            </div>
            <button
              type="button"
              onClick={() => setPreviewSim(null)}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg cursor-pointer transition"
            >
              ✕ Exit Preview
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <V2PlayerCockpit
              simulation={previewSim}
              learnerName="Faculty Test Pilot"
              onExit={() => setPreviewSim(null)}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-6 max-w-[min(100%,94rem)] mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/teach')}
                className="text-xs text-slate-400 hover:text-white transition flex items-center gap-1.5 cursor-pointer px-3 py-1.5 bg-slate-800/80 rounded-lg hover:bg-slate-700"
              >
                ← Back to Faculty Dashboard
              </button>
              <span className="text-slate-600">|</span>
              <h1 className="text-sm font-semibold text-slate-200">
                Capsim-Style Simulation Architect
              </h1>
            </div>

            <div className="flex items-center gap-3">
              {saving && (
                <span className="text-xs text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-3 py-1 rounded-lg animate-pulse flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  Saving to database…
                </span>
              )}
              {saveStatus && !saving && (
                <span className="text-xs text-emerald-400 bg-emerald-950/50 border border-emerald-800/50 px-3 py-1 rounded-lg animate-fade-in">
                  ✓ {saveStatus}
                </span>
              )}
              <Link
                to={`/assign/${currentSim.id}`}
                className="px-3.5 py-1.5 bg-cyan-600/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-600/30 text-xs font-semibold rounded-lg transition"
              >
                👥 Assign to Students
              </Link>
              <button
                type="button"
                onClick={() => setPreviewSim(currentSim)}
                className="px-3.5 py-1.5 bg-indigo-600/30 text-indigo-200 border border-indigo-500/40 hover:bg-indigo-600/50 text-xs font-semibold rounded-lg transition cursor-pointer"
              >
                ▶ Test Flight
              </button>
            </div>
          </div>

          <V2SimulationBuilder
            initialSimulation={currentSim}
            onSave={handleSave}
            onPreview={(sim) => setPreviewSim(sim)}
          />
        </div>
      )}
    </div>
  )
}
